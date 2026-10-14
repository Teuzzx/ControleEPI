import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_ce_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/config.dart';
import 'core/hive_service.dart';
import 'core/sync_service.dart';
import 'models/employee.dart';
import 'models/epi_item.dart';
import 'models/session.dart';
import 'repositories/auth_repo.dart';
import 'repositories/data_repo.dart';

// ── Serviço de sincronização offline ─────────────────────────────────────
// Declarado antes da sessão porque o SessionNotifier o recebe por
// injeção (para poder encerrar o listener de conectividade no logout).

final syncServiceProvider = Provider<SyncService>((ref) {
  final service = SyncService();
  ref.onDispose(service.dispose);
  return service;
});

// ── Sessão ───────────────────────────────────────────────────────────────

final sessionProvider = StateNotifierProvider<SessionNotifier, AppSession?>(
  (ref) => SessionNotifier(ref.read(syncServiceProvider)),
);

class SessionNotifier extends StateNotifier<AppSession?> {
  SessionNotifier(this._sync) : super(_load());

  final SyncService _sync;

  static AppSession? _load() {
    final raw = Hive.box<String>(HiveService.sessionBox).get('current');
    if (raw == null) return null;
    try {
      final session = AppSession.fromMap(jsonDecode(raw) as Map<String, dynamic>);
      if (session.isExpired) {
        Hive.box<String>(HiveService.sessionBox).delete('current');
        return null;
      }
      return session;
    } catch (_) {
      return null;
    }
  }

  Future<void> login(String email, String password) async {
    final session = await AuthRepo.login(email, password);
    await Hive.box<String>(HiveService.sessionBox).put('current', jsonEncode(session.toMap()));
    state = session;
  }

  Future<void> logout() async {
    // Encerra o serviço de sincronização ANTES de derrubar a sessão: o
    // listener de conectividade guarda o `ref` da HomePage e chamaria
    // `processQueue` apontando para uma sessão já destruída — era uma das
    // fontes do "erro ao acessar" após sair/entrar no app.
    try {
      await _sync.stop();
    } catch (_) {
      // logout nunca pode falhar por causa da fila offline
    }

    await Hive.box<String>(HiveService.sessionBox).delete('current');
    state = null;
  }
}

// ── Cliente Supabase da empresa do usuário ────────────────────────────────

final dataClientProvider = Provider<SupabaseClient?>((ref) {
  final session = ref.watch(sessionProvider);
  if (session == null) return null;

  if (session.hasCompany) {
    return SupabaseClient(session.companyUrl, session.companyKey,
        headers: {'x-session-token': session.token});
  }
  return SupabaseClient(Config.supabaseMatrizUrl, Config.supabaseMatrizAnonKey,
      headers: {'x-session-token': session.token});
});

// ── Dados (com cache offline) ────────────────────────────────────────────

final employeesProvider = FutureProvider<List<Employee>>((ref) async {
  final client = ref.watch(dataClientProvider);
  if (client == null) throw StateError('Sessão expirada. Faça login novamente.');

  final cache = Hive.box(HiveService.employeesCacheBox);
  try {
    final list = await DataRepo.fetchEmployees(client);
    await cache.put('data', list.map((e) => e.toMap()).toList());
    return list;
  } catch (e) {
    final cached = cache.get('data');
    if (cached is List && cached.isNotEmpty) {
      return cached.map((m) => Employee.fromMap(Map<String, dynamic>.from(m as Map))).toList();
    }
    rethrow;
  }
});

final stockProvider = FutureProvider<List<EpiItem>>((ref) async {
  final client = ref.watch(dataClientProvider);
  if (client == null) throw StateError('Sessão expirada. Faça login novamente.');

  final cache = Hive.box(HiveService.stockCacheBox);
  try {
    final list = await DataRepo.fetchStock(client);
    await cache.put('data', list.map((e) => _epiToMap(e)).toList());
    return list;
  } catch (e) {
    final cached = cache.get('data');
    if (cached is List && cached.isNotEmpty) {
      return cached.map((m) => _epiFromMap(Map<String, dynamic>.from(m as Map))).toList();
    }
    rethrow;
  }
});

final recentMovementsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final client = ref.watch(dataClientProvider);
  if (client == null) throw StateError('Sessão expirada.');
  return DataRepo.fetchRecentMovements(client);
});

// ── Notificações (alertas de estoque, avisos da matriz, distribuições) ───

final notificationsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final client = ref.watch(dataClientProvider);
  if (client == null) throw StateError('Sessão expirada.');
  return DataRepo.fetchNotifications(client);
});

int _notifChannelSeq = 0;

/// Mantém o canal realtime de notificações ativo: quando uma notificação
/// muda no banco (nova alerta/aviso ou marcação de lida), o provider acima
/// é recarregado automaticamente.
final notificationsRealtimeProvider = Provider<Object?>((ref) {
  final client = ref.watch(dataClientProvider);
  if (client == null) return null;

  final channel = client
      .channel('mobile-notifications-${++_notifChannelSeq}')
      .onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'notifications',
        callback: (_) => ref.invalidate(notificationsProvider),
      )
      .subscribe();
  ref.onDispose(() => client.removeChannel(channel));
  return channel;
});

// Cache de estoque: serializa EpiItem de forma simples (sem codegen).
Map<String, dynamic> _epiToMap(EpiItem e) => {
      'id': e.id,
      'name': e.name,
      'variants': e.variants
          .map((v) => {
                'id': v.id,
                'epi_id': v.epiId,
                'color': v.color,
                'size': v.size,
                'quantity': v.quantity,
              })
          .toList(),
    };

EpiItem _epiFromMap(Map<String, dynamic> m) {
  final variants = (m['variants'] as List)
      .map((v) => EpiVariant.fromMap(Map<String, dynamic>.from(v as Map)))
      .toList();
  return EpiItem(id: (m['id'] as num).toInt(), name: m['name'] as String, variants: variants);
}
