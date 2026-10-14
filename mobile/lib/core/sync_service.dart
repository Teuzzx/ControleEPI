import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_ce_flutter/hive_flutter.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/cart_item.dart';
import '../models/employee.dart';
import '../models/session.dart';
import '../providers.dart';
import '../repositories/data_repo.dart';
import 'config.dart';
import 'hive_service.dart';

/// Fila offline: operações feitas sem internet ficam no Hive e são
/// sincronizadas automaticamente quando a conexão volta.
class SyncService {
  Box? _box;
  Box? _failedBox;
  bool _running = false;

  /// Assinatura de conectividade. Antes ela era criada dentro de
  /// [init] e NUNCA cancelada: cada montagem da HomePage adicionava mais
  /// um listener, e cada listener guardava um `WidgetRef` já descartado.
  /// Ao navegar para fora e voltar, o callback disparava com o `ref`
  /// destruído e o app estourava ("dependencies were used after being
  /// disposed"). Guardamos a assinatura para poder cancelar.
  StreamSubscription<List<ConnectivityResult>>? _connSub;

  /// Notifica a UI sobre quantas operações estão pendentes.
  final ValueNotifier<int> pendingNotifier = ValueNotifier(0);
  final ValueNotifier<int> failedNotifier = ValueNotifier(0);

  /// Aviso de sincronização concluída (ex.: "Subimos as entradas e saídas
  /// do período offline") — a tela principal escuta e mostra ao usuário.
  final ValueNotifier<String?> syncNoticeNotifier = ValueNotifier(null);

  bool _initialized = false;

  Future<void> init(WidgetRef ref) async {
    _box ??= Hive.box(HiveService.pendingOpsBox);
    _failedBox ??= Hive.box(HiveService.failedOpsBox);
    _refreshCounts();

    // Idempotente: evita acumular listeners a cada entrada na HomePage.
    if (!_initialized) {
      _initialized = true;
      _connSub = Connectivity().onConnectivityChanged.listen((_) {
        processQueue(ref);
      });
    }

    // Sincroniza também ao iniciar (se já houver sessão).
    if (ref.read(sessionProvider) != null) {
      processQueue(ref);
    }
  }

  /// Cancela apenas a assinatura de conectividade.
  ///
  /// Idempotente e segura para chamar várias vezes. Usada no logout: o
  /// listener guardava o `ref` da HomePage e chamaria `processQueue`
  /// apontando para uma sessão já destruída. NÃO descarta os
  /// ValueNotifier — eles continuam vivos para o próximo login.
  Future<void> stop() async {
    await _connSub?.cancel();
    _connSub = null;
    _initialized = false;
  }

  /// Libera tudo de verdade. Só o dono do provider chama isto
  /// (`ref.onDispose`), no encerramento da sessão.
  void dispose() {
    _connSub?.cancel();
    _connSub = null;
    _initialized = false;
    pendingNotifier.dispose();
    failedNotifier.dispose();
    syncNoticeNotifier.dispose();
  }

  Future<void> enqueue({
    required String type,
    required AppSession session,
    required String cartId,
    required Employee employee,
    required List<CartItem> items,
    String? photoPath,
    String? signaturePath,
  }) async {
    await _box!.add({
      'id': cartId,
      'type': type,
      // Data/hora em que a operação foi lançada no celular — preservada na
      // sincronização para o registro chegar com o horário correto.
      'created_at': DateTime.now().toUtc().toIso8601String(),
      'payload': {
        'company_url': session.companyUrl,
        'company_key': session.companyKey,
        'token': session.token,
        'cart_id': cartId,
        'employee': employee.toMap(),
        'items': items.map((i) => i.toMap()).toList(),
        'photo_path': photoPath,
        'signature_path': signaturePath,
      },
    });
    _refreshCounts();
  }

  Future<void> processQueue(WidgetRef ref) async {
    if (_running) return;
    if (_box == null) return;

    final session = ref.read(sessionProvider);
    if (session == null) return;

    final connectivity = await Connectivity().checkConnectivity();
    if (connectivity.every((c) => c == ConnectivityResult.none)) return;

    _running = true;
    var synced = 0;
    final errors = <String>{};
    try {
      // 1) Tenta de novo as que falharam antes (podem ter falhado por rede).
      final failedKeys = _failedBox!.keys.toList();
      for (final key in failedKeys) {
        final raw = _failedBox!.get(key);
        if (raw is! Map) {
          await _failedBox!.delete(key);
          continue;
        }
        final op = Map<String, dynamic>.from(raw);
        try {
          await _execute(op, session);
          await _failedBox!.delete(key);
          synced++;
        } catch (e) {
          op['error'] = e.toString();
          await _failedBox!.put(key, op);
          errors.add(_friendlyError(e));
        }
      }

      // 2) Processa a fila pendente (sem parar na primeira falha — cada
      //    operação é independente e pode ser enviada mesmo se outra falhar).
      final keys = _box!.keys.toList();
      for (final key in keys) {
        final raw = _box!.get(key);
        if (raw is! Map) {
          await _box!.delete(key);
          continue;
        }
        final op = Map<String, dynamic>.from(raw);
        try {
          await _execute(op, session);
          await _box!.delete(key);
          synced++;
        } catch (e) {
          op['error'] = e.toString();
          await _box!.delete(key);
          await _failedBox!.add(op);
          errors.add(_friendlyError(e));
        }
      }
    } finally {
      _running = false;
      _refreshCounts();
      _notifySync(synced, errors);
    }
  }

  /// Traduz o erro técnico para algo que o almoxarife entenda.
  String _friendlyError(Object e) {
    final msg = e.toString();
    if (msg.contains('SocketException') ||
        msg.contains('ClientException') ||
        msg.contains('Connection') ||
        msg.contains('TimeoutException') ||
        msg.contains('status code 000') ||
        msg.contains('Failed to connect')) {
      return 'Sem conexão com o servidor. Vamos tentar de novo automaticamente.';
    }
    if (msg.contains('session') && msg.contains('token')) {
      return 'Sessão expirada. Saia e entre no app novamente.';
    }
    if (msg.contains('Estoque insuficiente') ||
        msg.contains('não encontrada') ||
        msg.contains('insuficiente')) {
      return 'O estoque mudou no computador. Confira a quantidade e refaça a operação.';
    }
    return msg.replaceAll('Exception: ', '').trim();
  }

  void _notifySync(int synced, Set<String> errors) {
    if (synced > 0 && errors.isEmpty) {
      syncNoticeNotifier.value = synced == 1
          ? 'Subimos 1 movimentação feita durante o período offline.'
          : 'Subimos $synced movimentações feitas durante o período offline.';
    } else if (synced > 0) {
      syncNoticeNotifier.value =
          'Subimos $synced movimentação${synced > 1 ? 'ões' : ''} do período offline, '
          'mas ${errors.length} ficou(ram) pendente(s). ${errors.first}';
    } else if (errors.isNotEmpty) {
      syncNoticeNotifier.value =
          '${errors.length} operação(ões) não puderam ser sincronizadas. ${errors.first}';
    }
  }

  /// Resolve o banco de destino da sincronização.
  ///
  /// A filial pode não ter um projeto Supabase próprio: nesse caso o banco é
  /// o da MATRIZ (igual ao `dataClientProvider` usado nas operações online).
  /// Usa a URL/chave gravadas na fila; se vazias, cai para a sessão atual e,
  /// por fim, para a matriz.
  static ({String url, String key, String token}) resolveTarget(
    Map<String, dynamic> payload,
    AppSession currentSession,
  ) {
    final payloadUrl = payload['company_url'] as String? ?? '';
    final payloadKey = payload['company_key'] as String? ?? '';

    final url = payloadUrl.isNotEmpty
        ? payloadUrl
        : (currentSession.companyUrl.isNotEmpty
            ? currentSession.companyUrl
            : Config.supabaseMatrizUrl);
    final key = payloadKey.isNotEmpty
        ? payloadKey
        : (currentSession.companyKey.isNotEmpty
            ? currentSession.companyKey
            : Config.supabaseMatrizAnonKey);

    // Token atual da sessão (o gravado na fila pode ter expirado — 12h).
    final token = currentSession.token.isNotEmpty
        ? currentSession.token
        : (payload['token'] as String? ?? '');

    return (url: url, key: key, token: token);
  }

  Future<void> _execute(Map<String, dynamic> op, AppSession currentSession) async {
    final payload = Map<String, dynamic>.from(op['payload'] as Map);
    final type = op['type'] as String? ?? 'saida';
    final createdAt = DateTime.tryParse(op['created_at'] as String? ?? '');

    final target = resolveTarget(payload, currentSession);

    final client = SupabaseClient(
      target.url,
      target.key,
      headers: {
        'x-session-token': target.token,
      },
    );

    final session = AppSession(
      id: currentSession.id,
      name: currentSession.name,
      email: currentSession.email,
      role: currentSession.role,
      companyId: currentSession.companyId,
      companyName: currentSession.companyName,
      companyUrl: target.url,
      companyKey: target.key,
      token: target.token,
      expiresAt: currentSession.expiresAt,
      access: currentSession.access,
    );

    final employee = Employee.fromMap(Map<String, dynamic>.from(payload['employee'] as Map));
    final items = (payload['items'] as List)
        .map((i) => CartItem.fromMap(Map<String, dynamic>.from(i as Map)))
        .toList();

    final common = {
      'client': client,
      'session': session,
      'cartId': payload['cart_id'] as String,
      'employee': employee,
      'items': items,
      'photoPath': payload['photo_path'] as String?,
      'signaturePath': payload['signature_path'] as String?,
    };

    if (type == 'devolucao') {
      await DataRepo.processDevolucao(
        client: common['client'] as SupabaseClient,
        session: common['session'] as AppSession,
        cartId: common['cartId'] as String,
        employee: common['employee'] as Employee,
        items: common['items'] as List<CartItem>,
        photoPath: common['photoPath'] as String?,
        signaturePath: common['signaturePath'] as String?,
        createdAt: createdAt,
        offlineCreated: true,
      );
    } else {
      await DataRepo.processSaida(
        client: common['client'] as SupabaseClient,
        session: common['session'] as AppSession,
        cartId: common['cartId'] as String,
        employee: common['employee'] as Employee,
        items: common['items'] as List<CartItem>,
        photoPath: common['photoPath'] as String?,
        signaturePath: common['signaturePath'] as String?,
        createdAt: createdAt,
        offlineCreated: true,
      );
    }
  }

  Future<void> clearFailed() async {
    await _failedBox!.clear();
    _refreshCounts();
  }

  void _refreshCounts() {
    pendingNotifier.value = _box?.length ?? 0;
    failedNotifier.value = _failedBox?.length ?? 0;
  }
}
