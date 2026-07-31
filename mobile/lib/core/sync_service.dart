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
import 'hive_service.dart';

/// Fila offline: operações feitas sem internet ficam no Hive e são
/// sincronizadas automaticamente quando a conexão volta.
class SyncService {
  Box? _box;
  Box? _failedBox;
  bool _running = false;

  /// Notifica a UI sobre quantas operações estão pendentes.
  final ValueNotifier<int> pendingNotifier = ValueNotifier(0);
  final ValueNotifier<int> failedNotifier = ValueNotifier(0);

  Future<void> init(WidgetRef ref) async {
    _box = Hive.box(HiveService.pendingOpsBox);
    _failedBox = Hive.box(HiveService.failedOpsBox);
    _refreshCounts();

    Connectivity().onConnectivityChanged.listen((_) => processQueue(ref));

    // Sincroniza também ao iniciar (se já houver sessão).
    if (ref.read(sessionProvider) != null) {
      processQueue(ref);
    }
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
      'created_at': DateTime.now().toIso8601String(),
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
    try {
      final keys = _box!.keys.toList();
      for (final key in keys) {
        final raw = _box!.get(key);
        if (raw is! Map) {
          await _box!.delete(key);
          continue;
        }
        final op = Map<String, dynamic>.from(raw);
        final payload = Map<String, dynamic>.from(op['payload'] as Map);
        try {
          await _execute(payload, op['type'] as String? ?? 'saida');
          await _box!.delete(key);
        } catch (_) {
          await _box!.delete(key);
          await _failedBox!.add(op);
          break; // para e deixa o resto para a próxima tentativa
        }
      }
    } finally {
      _running = false;
      _refreshCounts();
    }
  }

  Future<void> _execute(Map<String, dynamic> payload, String type) async {
    final client = SupabaseClient(
      payload['company_url'] as String,
      payload['company_key'] as String,
      headers: {
        'x-session-token': payload['token'] as String,
      },
    );

    final session = AppSession(
      id: 0,
      name: '',
      email: '',
      role: 'filial',
      companyId: null,
      companyName: '',
      companyUrl: payload['company_url'] as String,
      companyKey: payload['company_key'] as String,
      token: payload['token'] as String,
      expiresAt: DateTime.now().millisecondsSinceEpoch + 12 * 60 * 60 * 1000,
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
