import 'dart:io';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/cart_item.dart';
import '../models/employee.dart';
import '../models/epi_item.dart';
import '../models/session.dart';
import 'storage_repo.dart';

/// Acesso aos dados do banco da FILIAL (colaboradores, produtos, movimentações).
class DataRepo {
  // ── Consultas ──────────────────────────────────────────────────────────

  /// Verdadeiro quando o token de sessao ainda vale.
  ///
  /// Sem esta checagem, um token expirado (12h) nao produz NENHUM erro: o RLS
  /// simplesmente devolve zero linhas, e o app mostrava listas vazias parecendo
  /// que o banco nao tinha dados — sem nunca dizer "sua sessao expirou".
  /// A funcao `app_session_is_valid` e security definer de proposito: precisa
  /// ler `sessions`, que o RLS bloqueia para o anon.
  ///
  /// Se a funcao nao existir no servidor (migration 0013 ainda nao aplicada),
  /// devolve `true` para nao travar o app por causa de uma checagem extra.
  static Future<bool> isSessionValid(SupabaseClient client) async {
    try {
      final res = await client.rpc('app_session_is_valid');
      return res == true;
    } catch (_) {
      return true;
    }
  }

  static Future<List<Employee>> fetchEmployees(SupabaseClient client) async {
    final res = await client
        .from('employees')
        .select('id, name, cpf, registration, role, status')
        .eq('status', 'Ativo')
        .order('name');
    final rows = (res as List).cast<Map>();
    return rows.map((m) => Employee.fromMap(Map<String, dynamic>.from(m))).toList();
  }

  static Future<List<EpiItem>> fetchStock(SupabaseClient client) async {
    final episRes = await client.from('epis').select('id, name').order('name');
    final varsRes = await client.from('epi_variants').select('epi_id, id, color, size, quantity');

    final episRows = (episRes as List).cast<Map>();
    final varsRows = (varsRes as List).cast<Map>();

    final variants = varsRows
        .map((m) => EpiVariant.fromMap(Map<String, dynamic>.from(m)))
        .toList();

    return episRows
        .map((m) => EpiItem.fromMap(Map<String, dynamic>.from(m), variants))
        .toList();
  }

  static Future<List<Map<String, dynamic>>> fetchRecentMovements(
    SupabaseClient client, {
    int limit = 5,
  }) async {
    final res = await client
        .from('movements')
        .select('id, type, employee_name, epi_name, quantity, color, size, created_at')
        .order('id', ascending: false)
        .limit(limit);
    return (res as List).cast<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
  }

  // ── Notificações (alertas de estoque, avisos da matriz, distribuições) ──

  static Future<List<Map<String, dynamic>>> fetchNotifications(
    SupabaseClient client, {
    int limit = 30,
  }) async {
    final res = await client
        .from('notifications')
        .select('id, type, title, message, read, created_at')
        .order('id', ascending: false)
        .limit(limit);
    return (res as List).cast<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
  }

  static Future<void> markNotificationRead(SupabaseClient client, int id) async {
    await client.from('notifications').update({'read': true}).eq('id', id);
  }

  static Future<void> markAllNotificationsRead(SupabaseClient client) async {
    await client.from('notifications').update({'read': true}).eq('read', false);
  }

  // ── Saída de EPI ───────────────────────────────────────────────────────

  /// Upload seguro: só sobe se o arquivo ainda existir no aparelho (a foto
  /// pode ter sido capturada há horas, durante o período offline).
  static Future<String?> _uploadIfExists({
    required SupabaseClient client,
    required String folder,
    required String fileName,
    required String? filePath,
  }) async {
    if (filePath == null) return null;
    final f = File(filePath);
    if (!f.existsSync()) return null;
    try {
      return await StorageRepo.upload(
          client: client, folder: folder, fileName: fileName, filePath: filePath);
    } catch (_) {
      return null;
    }
  }

  static Future<int> processSaida({
    required SupabaseClient client,
    required AppSession session,
    required String cartId,
    required Employee employee,
    required List<CartItem> items,
    String? photoPath,
    String? signaturePath,
    DateTime? createdAt,
    bool offlineCreated = false,
  }) async {
    if (items.isEmpty) throw Exception('Nenhum item na saída.');

    // 1) Fotos/assinaturas primeiro
    final photoUrl = await _uploadIfExists(
        client: client, folder: 'saidas/$cartId', fileName: 'foto.jpg', filePath: photoPath);
    final signatureUrl = await _uploadIfExists(
        client: client, folder: 'saidas/$cartId', fileName: 'assinatura.png', filePath: signaturePath);

    // 2) Valida estoque antes de escrever
    final epiIds = items.map((i) => i.epiId).toSet().toList();
    final varsRes = await client
        .from('epi_variants')
        .select('id, epi_id, color, size, quantity')
        .inFilter('epi_id', epiIds);
    final variants = (varsRes as List).cast<Map>().map((m) => Map<String, dynamic>.from(m)).toList();

    // Compara cor e tamanho normalizados. O banco pode guardar "" num lado e
    // null no outro para a mesma variação "sem cor/tamanho"; a comparação
    // estrita reprova e estourava "não encontrada" mesmo com o EPI e a
    // variação existindo no banco — que era o erro na hora de dar saída.
    String norm(Object? v) => (v as String?)?.trim().toLowerCase() ?? '';

    EpiVariant matchVariant(CartItem item) {
      final pool =
          variants.where((x) => (x['epi_id'] as num).toInt() == item.epiId).toList();

      final v = pool.firstWhere(
        (x) =>
            norm(x['color']) == norm(item.color) && norm(x['size']) == norm(item.size),
        orElse: () {
          // EPI com uma única variação não tem como "não casar": é ela.
          if (pool.length == 1) return pool.first;
          final opcoes = pool
              .map((x) => norm(x['size']).isEmpty ? 'único' : norm(x['size']))
              .join(', ');
          throw Exception(
            'Variação de "${item.epiName}" não encontrada. '
            'Tamanhos disponíveis: $opcoes.',
          );
        },
      );
      return EpiVariant.fromMap(v);
    }

    for (final item in items) {
      final v = matchVariant(item);
      if (v.quantity < item.quantity) {
        throw Exception(
          'Estoque insuficiente de "${item.epiName}" ${item.variantLabel.isEmpty ? '' : item.variantLabel} '
          '(disponível: ${v.quantity}).',
        );
      }
    }

    // 3) Aplica com log de compensação (reverte tudo se algo falhar)
    final undos = <Future<void> Function()>[];

    Future<void> runUndos() async {
      for (final undo in undos.reversed) {
        try {
          await undo();
        } catch (_) {}
      }
    }

    try {
      for (final item in items) {
        final v = matchVariant(item);

        await client
            .from('epi_variants')
            .update({'quantity': v.quantity - item.quantity})
            .eq('id', v.id);
        undos.add(() async {
          await client.from('epi_variants').update({'quantity': v.quantity}).eq('id', v.id);
        });

        final epiRes = await client.from('epis').select('total_quantity').eq('id', item.epiId).single();
        final oldTotal = (epiRes['total_quantity'] as num?)?.toInt() ?? 0;
        await client
            .from('epis')
            .update({'total_quantity': (oldTotal - item.quantity).clamp(0, 1 << 31)})
            .eq('id', item.epiId);
        undos.add(() async {
          await client.from('epis').update({'total_quantity': oldTotal}).eq('id', item.epiId);
        });

        await client.from('movements').insert({
          'type': 'Entrega',
          'employee_name': employee.name,
          'employee_id': employee.id,
          'epi_name': item.epiName,
          'epi_id': item.epiId,
          'quantity': item.quantity,
          'color': item.color,
          'size': item.size,
          'state': item.state,
          'operator': 'App Mobile',
          'notes': item.observation.isNotEmpty ? item.observation : null,
          'company_name': session.companyName,
          'cart_id': cartId,
          'photo_url': photoUrl,
          'signature_url': signatureUrl,
          // Quando a operação é online o `createdAt` não chega — usa o horário
          // de agora em UTC para o registro nunca ficar sem data no web.
          'created_at': (createdAt ?? DateTime.now()).toUtc().toIso8601String(),
          'offline_created': offlineCreated,
        });
      }
      undos.add(() async {
        await client.from('movements').delete().eq('cart_id', cartId);
      });
    } catch (_) {
      await runUndos();
      rethrow;
    }

    return items.length;
  }

  // ── Devolução de EPI ───────────────────────────────────────────────────

  static Future<int> processDevolucao({
    required SupabaseClient client,
    required AppSession session,
    required String cartId,
    required Employee employee,
    required List<CartItem> items,
    String? photoPath,
    String? signaturePath,
    DateTime? createdAt,
    bool offlineCreated = false,
  }) async {
    if (items.isEmpty) throw Exception('Nenhum item na devolução.');

    final photoUrl = await _uploadIfExists(
        client: client, folder: 'devolucoes/$cartId', fileName: 'foto.jpg', filePath: photoPath);
    final signatureUrl = await _uploadIfExists(
        client: client, folder: 'devolucoes/$cartId', fileName: 'assinatura.png', filePath: signaturePath);

    final epiIds = items.map((i) => i.epiId).toSet().toList();
    final varsRes = await client
        .from('epi_variants')
        .select('id, epi_id, color, size, quantity')
        .inFilter('epi_id', epiIds);
    final variants = (varsRes as List).cast<Map>().map((m) => Map<String, dynamic>.from(m)).toList();

    EpiVariant? matchVariant(CartItem item) {
      for (final x in variants) {
        if ((x['epi_id'] as num).toInt() == item.epiId &&
            (x['color'] as String? ?? '') == item.color &&
            (x['size'] as String? ?? '') == item.size) {
          return EpiVariant.fromMap(x);
        }
      }
      return null;
    }

    final undos = <Future<void> Function()>[];

    Future<void> runUndos() async {
      for (final undo in undos.reversed) {
        try {
          await undo();
        } catch (_) {}
      }
    }

    try {
      for (final item in items) {
        final damaged = item.state == 'Danificado';

        if (!damaged) {
          final v = matchVariant(item);
          if (v != null) {
            await client
                .from('epi_variants')
                .update({'quantity': v.quantity + item.quantity})
                .eq('id', v.id);
            undos.add(() async {
              await client.from('epi_variants').update({'quantity': v.quantity}).eq('id', v.id);
            });

            final epiRes = await client.from('epis').select('total_quantity').eq('id', item.epiId).single();
            final oldTotal = (epiRes['total_quantity'] as num?)?.toInt() ?? 0;
            await client
                .from('epis')
                .update({'total_quantity': oldTotal + item.quantity})
                .eq('id', item.epiId);
            undos.add(() async {
              await client.from('epis').update({'total_quantity': oldTotal}).eq('id', item.epiId);
            });
          } else {
            await client.from('epi_variants').insert({
              'epi_id': item.epiId,
              'color': item.color,
              'size': item.size,
              'quantity': item.quantity,
              'min_quantity': 0,
            });
            undos.add(() async {
              await client
                  .from('epi_variants')
                  .delete()
                  .eq('epi_id', item.epiId)
                  .eq('color', item.color)
                  .eq('size', item.size);
            });

            final epiRes = await client.from('epis').select('total_quantity').eq('id', item.epiId).single();
            final oldTotal = (epiRes['total_quantity'] as num?)?.toInt() ?? 0;
            await client
                .from('epis')
                .update({'total_quantity': oldTotal + item.quantity})
                .eq('id', item.epiId);
            undos.add(() async {
              await client.from('epis').update({'total_quantity': oldTotal}).eq('id', item.epiId);
            });
          }
        }

        await client.from('movements').insert({
          'type': 'Devolução',
          'employee_name': employee.name,
          'employee_id': employee.id,
          'epi_name': item.epiName,
          'epi_id': item.epiId,
          'quantity': item.quantity,
          'color': item.color,
          'size': item.size,
          'state': item.state,
          'operator': 'App Mobile',
          'notes': item.observation.isNotEmpty ? item.observation : null,
          'company_name': session.companyName,
          'cart_id': cartId,
          'photo_url': photoUrl,
          'signature_url': signatureUrl,
          // Idem saída: sem createdAt (online) usa o horário atual em UTC.
          'created_at': (createdAt ?? DateTime.now()).toUtc().toIso8601String(),
          'offline_created': offlineCreated,
        });
      }
      undos.add(() async {
        await client.from('movements').delete().eq('cart_id', cartId);
      });
    } catch (_) {
      await runUndos();
      rethrow;
    }

    return items.length;
  }
}
