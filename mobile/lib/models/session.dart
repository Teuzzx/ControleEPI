/// Sessão do almoxarife — resultado do login via RPC `app_login` no banco da matriz.
class AppSession {
  final int id;
  final String name;
  final String email;
  final String role;
  final int? companyId;
  final String companyName;
  final String companyUrl;
  final String companyKey;
  final String token;
  final int expiresAt;

  /// Acesso do login: 'web' (só computador), 'mobile' (só app) ou 'both'.
  final String access;

  const AppSession({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.companyId,
    required this.companyName,
    required this.companyUrl,
    required this.companyKey,
    required this.token,
    required this.expiresAt,
    this.access = 'both',
  });

  bool get isExpired => expiresAt <= DateTime.now().millisecondsSinceEpoch;
  bool get hasCompany => companyUrl.isNotEmpty && companyKey.isNotEmpty;
  bool get canUseMobile => access == 'mobile' || access == 'both';

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'email': email,
        'role': role,
        'company_id': companyId,
        'company_name': companyName,
        'company_url': companyUrl,
        'company_key': companyKey,
        'token': token,
        'expires_at': expiresAt,
        'access': access,
      };

  factory AppSession.fromMap(Map<String, dynamic> m) => AppSession(
        id: (m['id'] as num).toInt(),
        name: m['name'] as String,
        email: m['email'] as String,
        role: m['role'] as String,
        companyId: (m['company_id'] as num?)?.toInt(),
        companyName: m['company_name'] as String? ?? '',
        companyUrl: m['company_url'] as String? ?? '',
        companyKey: m['company_key'] as String? ?? '',
        token: m['token'] as String,
        expiresAt: (m['expires_at'] as num).toInt(),
        access: m['access'] as String? ?? 'both',
      );
}
