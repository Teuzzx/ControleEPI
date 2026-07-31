import 'dart:convert';
import 'dart:io';

import 'config.dart';

/// Resultado da checagem de atualização.
class UpdateInfo {
  final String version;
  final String notes;
  final String apkUrl;
  const UpdateInfo({required this.version, required this.notes, required this.apkUrl});
}

/// Consulta o `app-version.json` publicado no site (Vercel) e compara com a
/// versão instalada. Retorna `null` se não há atualização ou o site está fora.
class UpdateService {
  static Future<UpdateInfo?> check() async {
    final client = HttpClient()..connectionTimeout = const Duration(seconds: 8);
    try {
      final request = await client
          .getUrl(Uri.parse('${Config.appHomeUrl}/app-version.json'))
          .timeout(const Duration(seconds: 8));
      final response = await request.close().timeout(const Duration(seconds: 8));
      if (response.statusCode != 200) return null;

      final body = await response.transform(utf8.decoder).join();
      final json = jsonDecode(body) as Map<String, dynamic>;
      final remote = json['version'] as String? ?? '';
      if (!_isNewer(remote, Config.appVersion)) return null;

      return UpdateInfo(
        version: remote,
        notes: json['notes'] as String? ?? '',
        apkUrl: json['apkUrl'] as String? ?? '/Controle-EPI.apk',
      );
    } catch (_) {
      return null; // Sem internet ou site fora do ar: não incomoda o usuário.
    } finally {
      client.close(force: true);
    }
  }

  /// Compara versões "X.Y.Z": retorna true se [a] é maior que [b].
  static bool _isNewer(String a, String b) {
    List<int> parts(String s) =>
        s.split('.').map((p) => int.tryParse(p.trim()) ?? 0).toList();
    final pa = parts(a);
    final pb = parts(b);
    for (var i = 0; i < pa.length || i < pb.length; i++) {
      final da = i < pa.length ? pa[i] : 0;
      final db = i < pb.length ? pb[i] : 0;
      if (da != db) return da > db;
    }
    return false;
  }
}
