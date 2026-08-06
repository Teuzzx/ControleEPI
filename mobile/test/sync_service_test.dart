import 'package:flutter_test/flutter_test.dart';

import 'package:epi_mobile/core/config.dart';
import 'package:epi_mobile/core/sync_service.dart';
import 'package:epi_mobile/models/session.dart';

AppSession _session({
  String companyUrl = '',
  String companyKey = '',
  String token = 'token-novo',
}) =>
    AppSession(
      id: 1,
      name: 'Almoxarife',
      email: 'a@b.com',
      role: 'filial',
      companyId: 2,
      companyName: 'Filial São Paulo',
      companyUrl: companyUrl,
      companyKey: companyKey,
      token: token,
      expiresAt: DateTime.now().millisecondsSinceEpoch + 12 * 60 * 60 * 1000,
    );

void main() {
  group('SyncService.resolveTarget', () {
    test('usa o banco da MATRIZ quando a filial não tem projeto próprio', () {
      // Filial SP não tem supabase_url/anon_key no banco — a fila salva vazio.
      final payload = {
        'company_url': '',
        'company_key': '',
        'token': 'token-antigo',
      };

      final target = SyncService.resolveTarget(payload, _session());

      expect(target.url, Config.supabaseMatrizUrl);
      expect(target.key, Config.supabaseMatrizAnonKey);
    });

    test('usa a URL/chave da filial quando gravadas na fila', () {
      final payload = {
        'company_url': 'https://filial.supabase.co',
        'company_key': 'chave-filial',
        'token': 'token-antigo',
      };

      final target = SyncService.resolveTarget(payload, _session());

      expect(target.url, 'https://filial.supabase.co');
      expect(target.key, 'chave-filial');
    });

    test('usa o token atual da sessão em vez do token expirado da fila', () {
      final payload = {
        'company_url': '',
        'company_key': '',
        'token': 'token-antigo-expirado',
      };

      final target = SyncService.resolveTarget(payload, _session());

      expect(target.token, 'token-novo');
    });

    test('mantém o token da fila quando a sessão atual não tem token', () {
      final payload = {
        'company_url': '',
        'company_key': '',
        'token': 'token-da-fila',
      };

      final target = SyncService.resolveTarget(payload, _session(token: ''));

      expect(target.token, 'token-da-fila');
    });
  });
}
