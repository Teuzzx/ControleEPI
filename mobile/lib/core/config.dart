/// Configuração do Supabase da MATRIZ (autenticação).
///
/// Definir no build/run:
///   flutter run --dart-define=SUPABASE_URL=https://xxxx.supabase.co \
///               --dart-define=SUPABASE_ANON_KEY=eyJ...
class Config {
  static const String supabaseMatrizUrl = String.fromEnvironment('SUPABASE_URL');
  static const String supabaseMatrizAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');

  /// Versão do app instalado (deve bater com `version:` do pubspec.yaml).
  static const String appVersion = '1.0.7';

  /// Site onde ficam o `app-version.json` e o APK (Vercel).
  static const String appHomeUrl = String.fromEnvironment(
    'APP_HOME_URL',
    defaultValue: 'https://controleepi10.vercel.app',
  );

  static bool get isConfigured => supabaseMatrizUrl.isNotEmpty && supabaseMatrizAnonKey.isNotEmpty;
}
