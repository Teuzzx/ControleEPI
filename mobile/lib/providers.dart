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

// ── Sessão ───────────────────────────────────────────────────────────────

final sessionProvider = StateNotifierProvider<SessionNotifier, AppSession?>(
  (ref) => SessionNotifier(),
);

class SessionNotifier extends StateNotifier<AppSession?> {
  SessionNotifier() : super(_load());

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

// ── Serviço de sincronização offline ─────────────────────────────────────

final syncServiceProvider = Provider<SyncService>((ref) => SyncService());

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
