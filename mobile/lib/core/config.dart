/// Configuração do Supabase da MATRIZ (autenticação).
///
/// As credenciais ficam embutidas como padrão (a anon key é pública, usada
/// apenas para leitura/escrita protegida por RLS). Para sobrescrever:
///   flutter run --dart-define=SUPABASE_URL=https://xxxx.supabase.co \
///               --dart-define=SUPABASE_ANON_KEY=eyJ...
class Config {
  static const String supabaseMatrizUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://lqbfejbnnpukwiipwfxy.supabase.co',
  );
  static const String supabaseMatrizAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxYmZlamJubnB1a3dpaXB3Znh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0NjAyNjEsImV4cCI6MjEwMTAzNjI2MX0.UV8huCbBaNQoR14eqdlLI1s8NHPvNjnmeNNkK5yIXt0',
  );

  /// Versão do app instalado (deve bater com `version:` do pubspec.yaml).
  static const String appVersion = '1.0.10';

  /// Site onde ficam o `app-version.json` e o APK (Vercel).
  static const String appHomeUrl = String.fromEnvironment(
    'APP_HOME_URL',
    defaultValue: 'https://controleepi10.vercel.app',
  );

  static bool get isConfigured => supabaseMatrizUrl.isNotEmpty && supabaseMatrizAnonKey.isNotEmpty;
}
