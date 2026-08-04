import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/config.dart';
import '../models/session.dart';

class AuthException implements Exception {
  final String message;
  const AuthException(this.message);
  @override
  String toString() => message;
}

/// Login contra o banco da MATRIZ via RPC `app_login`
/// (verificação feita dentro do Postgres — a senha não trafega como hash).
class AuthRepo {
  static Future<AppSession> login(String email, String password) async {
    if (!Config.isConfigured) {
      throw const AuthException(
        'App não configurado. Defina SUPABASE_URL e SUPABASE_ANON_KEY no build.',
      );
    }

    final client = SupabaseClient(Config.supabaseMatrizUrl, Config.supabaseMatrizAnonKey);

    final dynamic res;
    try {
      res = await client.rpc('app_login', params: {
        'p_email': email.trim(),
        'p_password': password,
      });
    } catch (e) {
      // Exceção de rede (DNS/firewall/sem internet) — o servidor nem foi contatado.
      final msg = e.toString();
      if (msg.contains('SocketException') ||
          msg.contains('ClientException') ||
          msg.contains('Connection') ||
          msg.contains('TimeoutException') ||
          msg.contains('network') ||
          msg.contains('HttpException') ||
          msg.contains('HandshakeException') ||
          msg.contains('status code 000') ||
          msg.contains('Failed to connect')) {
        throw AuthException(
          'Sem conexão com o servidor. Verifique a internet do celular e tente de novo.\n'
          '\nDetalhe técnico (envie para o suporte): $msg',
        );
      }
      if (msg.contains('function app_login') ||
          msg.contains('does not exist') ||
          msg.contains('PGRST')) {
        throw const AuthException(
          'Servidor fora de configuração (função app_login não encontrada). '
          'Avise o responsável pelo sistema.',
        );
      }
      throw AuthException('Erro ao falar com o servidor. Tente de novo.\n\nDetalhe: $msg');
    }

    final rows = res is List ? res : <dynamic>[];
    if (rows.isEmpty) {
      throw const AuthException('Credenciais inválidas. Verifique e tente novamente.');
    }

    final row = Map<String, dynamic>.from(rows.first as Map);

    final session = AppSession(
      id: (row['user_id'] as num).toInt(),
      name: row['user_name'] as String? ?? '',
      email: row['user_email'] as String? ?? email,
      role: row['user_role'] as String? ?? 'filial',
      companyId: (row['company_id'] as num?)?.toInt(),
      companyName: row['company_name'] as String? ?? 'Matriz Central',
      companyUrl: row['company_url'] as String? ?? '',
      companyKey: row['company_key'] as String? ?? '',
      token: row['token'] as String,
      expiresAt: DateTime.now().millisecondsSinceEpoch + 12 * 60 * 60 * 1000,
    );

    if (session.role == 'filial' && !session.hasCompany) {
      throw const AuthException(
        'Sua empresa ainda não está vinculada a um banco de dados. '
        'A matriz precisa conectar a empresa pelo painel.',
      );
    }

    return session;
  }

  /// Solicita o código de recuperação por e-mail (RPC `app_request_password_reset`).
  static Future<void> requestPasswordReset(String email) async {
    await _rpc('app_request_password_reset', {
      'p_email': email.trim(),
    });
  }

  /// Redefine a senha com o código recebido (RPC `app_reset_password_with_code`).
  static Future<void> resetPasswordWithCode(String email, String code, String password) async {
    await _rpc('app_reset_password_with_code', {
      'p_email': email.trim(),
      'p_code': code.trim(),
      'p_password': password,
    });
  }

  static Future<void> _rpc(String fn, Map<String, dynamic> params) async {
    if (!Config.isConfigured) {
      throw const AuthException(
        'App não configurado. Defina SUPABASE_URL e SUPABASE_ANON_KEY no build.',
      );
    }
    final client = SupabaseClient(Config.supabaseMatrizUrl, Config.supabaseMatrizAnonKey);
    try {
      await client.rpc(fn, params: params);
    } catch (e) {
      throw AuthException(_cleanMessage(e));
    }
  }

  /// Traduz exceções da rede/PostgREST para mensagens amigáveis.
  static String _cleanMessage(Object e) {
    final msg = e.toString();
    if (msg.contains('SocketException') ||
        msg.contains('ClientException') ||
        msg.contains('Connection') ||
        msg.contains('TimeoutException') ||
        msg.contains('HttpException') ||
        msg.contains('HandshakeException') ||
        msg.contains('status code 000') ||
        msg.contains('Failed to connect')) {
      return 'Sem conexão com o servidor. Verifique a internet do celular e tente de novo.';
    }
    if (msg.contains('does not exist') || msg.contains('PGRST')) {
      return 'Servidor fora de configuração (função não encontrada). Avise o responsável pelo sistema.';
    }
    // Erro levantado pelo banco (ex.: "Código inválido ou expirado.") — vem
    // como PostgrestException com a mensagem da função.
    if (e is PostgrestException) {
      final m = e.message.trim();
      if (m.isNotEmpty && !m.toLowerCase().contains('failed')) return m;
    }
    final match = RegExp(r'message:\s*([^,)\n]+)').firstMatch(msg);
    if (match != null) {
      final m = match.group(1)?.trim() ?? '';
      if (m.isNotEmpty) return m;
    }
    return 'Erro ao falar com o servidor. Tente de novo.\n\nDetalhe: $msg';
  }
}
