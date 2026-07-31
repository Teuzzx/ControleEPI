import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/theme.dart';
import 'features/devolucao/devolucao_page.dart';
import 'features/estoque/estoque_page.dart';
import 'features/home/home_page.dart';
import 'features/login/login_page.dart';
import 'features/saida/saida_page.dart';
import 'providers.dart';

final _routerProvider = Provider<GoRouter>((ref) {
  // watch: recria a rota sempre que a sessão muda (login/logout),
  // fazendo o redirect rodar de novo na hora — sem precisar reabrir o app.
  final session = ref.watch(sessionProvider);
  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final loggingIn = state.matchedLocation == '/login';
      if (session == null) return loggingIn ? null : '/login';
      if (loggingIn) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
      GoRoute(path: '/home', builder: (_, __) => const HomePage()),
      GoRoute(path: '/saida', builder: (_, __) => const SaidaPage()),
      GoRoute(path: '/devolucao', builder: (_, __) => const DevolucaoPage()),
      GoRoute(path: '/estoque', builder: (_, __) => const EstoquePage()),
    ],
  );
});

class EpiMobileApp extends ConsumerWidget {
  const EpiMobileApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(_routerProvider);
    return MaterialApp.router(
      title: 'Controle de EPI',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      routerConfig: router,
    );
  }
}
