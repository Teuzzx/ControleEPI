import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';

const Color kBg = Color(0xFF0D0F18);
const Color kCard = Color(0xFF131627);
const Color kIndigo = Color(0xFF6366F1);
const Color kCyan = Color(0xFF22D3EE);
const Color kGreen = Color(0xFF10B981);
const Color kAmber = Color(0xFFF59E0B);
const Color kRed = Color(0xFFF43F5E);
const Color kText = Color(0xFFE8EAF6);
const Color kSub = Color(0xFF9BA3C4);

/// Antes era #3D4257, que sobre o fundo dava 1.93:1 — bem abaixo do mínimo
/// de 4.5:1, e essa cor carregava os rótulos de etapa de todas as telas.
/// Este tom fecha 5.14:1 no fundo e 4.82:1 no card, e continua legível como
/// texto de apoio sem competir com kSub.
const Color kMuted = Color(0xFF7E8499);

// ── Vidro ────────────────────────────────────────────────────────────────
// O vidro aqui tem função, não enfeite: as camadas que ficam *acima* do
// conteúdo (barra de navegação, cabeçalho, folha modal) borram o que passa
// por baixo, e isso comunica "a lista continua aqui embaixo". No corpo da
// tela o card é opaco — blur em todo item custa bateria sem informar nada.
const Color kGlassTint = Color(0xFF8B93FF);
const Color kGlassEdge = Color(0x26FFFFFF);
const Color kGlassEdgeStrong = Color(0x3DFFFFFF);
const double kGlassBlur = 18;

// ── Ritmo ────────────────────────────────────────────────────────────────
const double kGapXs = 6;
const double kGapSm = 10;
const double kGap = 14;
const double kGapLg = 20;
const double kGapXl = 28;
const double kGap2Xl = 40;

const double kRadiusSm = 12;
const double kRadius = 16;
const double kRadiusLg = 22;
const double kRadiusXl = 28;

/// Sombra com deslocamento e desfoque reais — é isso que separa um card do
/// fundo. Halo colorido sem deslocamento vira decoração e não profundidade.
List<BoxShadow> kDepth([double strength = 1]) {
  return [
    BoxShadow(
      color: const Color(0xFF000000).withValues(alpha: 0.34 * strength),
      offset: const Offset(0, 10),
      blurRadius: 26,
      spreadRadius: -6,
    ),
    BoxShadow(
      color: const Color(0xFF000000).withValues(alpha: 0.24 * strength),
      offset: const Offset(0, 2),
      blurRadius: 6,
      spreadRadius: -2,
    ),
  ];
}

List<BoxShadow> kDepthLift([double strength = 1]) {
  return [
    BoxShadow(
      color: const Color(0xFF000000).withValues(alpha: 0.44 * strength),
      offset: const Offset(0, 18),
      blurRadius: 42,
      spreadRadius: -10,
    ),
  ];
}

ThemeData buildAppTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: kIndigo,
    brightness: Brightness.dark,
  ).copyWith(
    primary: kIndigo,
    secondary: kCyan,
    surface: kCard,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: kBg,
    fontFamily: 'Roboto',
    appBarTheme: const AppBarTheme(
      backgroundColor: kBg,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: kText,
        fontSize: 18,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFF171A29),
      hintStyle: const TextStyle(color: kMuted, fontSize: 14),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF23273C)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF23273C)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: kIndigo, width: 1.4),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: kIndigo,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(vertical: 16),
        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: const Color(0xFF1B1E30),
      contentTextStyle: const TextStyle(color: kText, fontSize: 13.5),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ),
    dividerTheme: const DividerThemeData(color: Color(0xFF1E2236)),
  );
}

/// Card padrão do sistema.
///
/// O corpo da tela é opaco de propósito: aqui o card precisa de *peso* e de
/// uma borda que separa da superfície, não de transparência. O vidro fica
/// reservado às camadas flutuantes (ver [GlassPanel]).
class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
    this.accent,
    this.elevated = false,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  /// Cor do conteúdo. Também desenha um fio luminoso no topo do card, o que
  /// dá a sensação de que a luz vem de cima — sem fio colorido na lateral.
  final Color? accent;
  final bool elevated;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(kRadius);
    final surface = Container(
      decoration: BoxDecoration(
        borderRadius: radius,
        // Ligeiramente mais claro que o fundo: é a separação real.
        color: kCard,
        boxShadow: elevated ? kDepthLift() : kDepth(),
        border: Border.all(
          color: accent != null
              ? Color.alphaBlend(accent!.withValues(alpha: 0.20), kGlassEdge)
              : kGlassEdge,
          width: 1,
        ),
        gradient: accent != null
            ? LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  accent!.withValues(alpha: 0.10),
                  accent!.withValues(alpha: 0.0),
                ],
              )
            : null,
      ),
      child: ClipRRect(
        borderRadius: radius,
        child: Stack(
          children: [
            child,
            // Fio de luz no topo — o detalhe que faz o card parecer vidro
            // em vez de caixa. 1px, sem deslocamento, só claridade.
            if (accent != null)
              Positioned(
                top: 0,
                left: radius.topLeft.x,
                right: radius.topRight.x,
                child: Container(
                  height: 1,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.transparent,
                        accent!.withValues(alpha: 0.55),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );

    final body = Padding(padding: padding, child: child);

    if (onTap == null) return body;

    return Material(
      color: Colors.transparent,
      borderRadius: radius,
      child: InkWell(
        onTap: onTap,
        borderRadius: radius,
        splashColor: (accent ?? kIndigo).withValues(alpha: 0.10),
        highlightColor: (accent ?? kIndigo).withValues(alpha: 0.06),
        child: surface,
      ),
    );
  }
}

/// Camada de vidro de verdade — para o que fica *sobre* o conteúdo.
///
/// Usado na barra de navegação inferior, no cabeçalho e nas folhas modais.
/// O `BackdropFilter` aqui tem um trabalho a fazer: deixar a lista passar por
/// baixo e ainda assim ser legível. Barato, porque são poucas camadas.
class GlassPanel extends StatelessWidget {
  const GlassPanel({
    super.key,
    required this.child,
    this.padding = EdgeInsets.zero,
    this.blur = kGlassBlur,
    this.tint,
    this.radius,
    this.topBorder = false,
    this.elevated = true,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final double blur;
  final Color? tint;
  final double? radius;
  final bool topBorder;
  final bool elevated;

  @override
  Widget build(BuildContext context) {
    final r = BorderRadius.vertical(top: Radius.circular(radius ?? kRadiusXl));
    return ClipRRect(
      borderRadius: r,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            color: (tint ?? const Color(0xFF0D0F18)).withValues(alpha: 0.72),
            boxShadow: elevated ? kDepthLift(0.8) : null,
            border: Border(
              top: topBorder
                  ? BorderSide(color: kGlassEdgeStrong, width: 1)
                  : BorderSide.none,
              left: BorderSide(color: kGlassEdge, width: 1),
              right: BorderSide(color: kGlassEdge, width: 1),
              bottom: topBorder
                  ? BorderSide.none
                  : BorderSide(color: kGlassEdge, width: 1),
            ),
          ),
          child: child,
        ),
      ),
    );
  }
}

/// Estado de erro com ação de recuperação.
///
/// Antes cada tela repetia `Text('Erro ao carregar ...\n$e')`, que despejava
/// a exceção técnica do Supabase na cara do almoxarife sem nenhuma forma de
/// tentar de novo. Este widget padroniza a mensagem e sempre oferece retry.
class ErrorRetry extends StatelessWidget {
  const ErrorRetry({
    super.key,
    required this.message,
    required this.onRetry,
    this.detail,
  });

  final String message;
  final VoidCallback onRetry;
  final String? detail;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_rounded, color: kMuted, size: 40),
            const SizedBox(height: 14),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: kText, fontSize: 13.5, height: 1.5),
            ),
            if (detail != null && detail!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                detail!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: kMuted, fontSize: 11),
              ),
            ],
            const SizedBox(height: 20),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Tentar novamente'),
              style: OutlinedButton.styleFrom(
                foregroundColor: kIndigo,
                side: const BorderSide(color: kIndigo),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Estado vazio dentro de uma lista com pull-to-refresh (precisa de altura
/// mínima para o gesto do RefreshIndicator funcionar em lista vazia).
class EmptyRetry extends StatelessWidget {
  const EmptyRetry({
    super.key,
    required this.message,
    required this.onRefresh,
  });

  final String message;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: kIndigo,
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(
            height: MediaQuery.of(context).size.height * 0.45,
            child: Center(
              child: Text(
                message,
                style: const TextStyle(color: kMuted, fontSize: 13),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Mensagem de erro legível, a partir da exceção crua do Supabase/dart.
/// Usada pelas telas que carregam dados (colaboradores, estoque, EPI).
String friendlyDataError(Object error) {
  final raw = error.toString();
  if (raw.contains('Bad state') && raw.contains('Sessão expirada')) {
    return 'Sua sessão expirou. Saia e entre no app novamente.';
  }
  if (raw.contains('does not exist') ||
      raw.contains('PGRST') ||
      raw.contains('schema cache')) {
    return 'O servidor desta empresa ainda está sendo configurado. '
        'Avise o responsável pelo sistema.';
  }
  if (raw.contains('JWT') ||
      raw.contains('token') ||
      raw.contains('401') ||
      raw.contains('403')) {
    return 'Sua sessão expirou. Saia e entre no app novamente.';
  }
  if (raw.contains('SocketException') ||
      raw.contains('ClientException') ||
      raw.contains('Connection') ||
      raw.contains('Failed host lookup') ||
      raw.contains('TimeoutException') ||
      raw.contains('status code 000')) {
    return 'Sem conexão com o servidor. Verifique a internet do celular.';
  }
  return 'Não foi possível carregar os dados. Toque em tentar novamente.';
}

class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.label, required this.color, this.icon});

  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(color: color, fontSize: 11.5, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}

/// Ação principal da home.
///
/// Dimensionado para dedo com luva: 68px de altura, ícone e rótulo grandes,
/// e o cartão inteiro é alvo. A ação primária do turno recebe tratamento
/// visual diferente da secundária — hierarquia real, não três cards iguais.
class PrimaryAction extends StatelessWidget {
  const PrimaryAction({
    super.key,
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.color,
    required this.onTap,
    this.emphasized = false,
  });

  final IconData icon;
  final String label;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;
  final bool emphasized;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(kRadiusLg);
    return Material(
      color: Colors.transparent,
      borderRadius: radius,
      child: InkWell(
        onTap: onTap,
        borderRadius: radius,
        splashColor: color.withValues(alpha: 0.14),
        highlightColor: color.withValues(alpha: 0.08),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: radius,
            color: emphasized
                ? Color.alphaBlend(color.withValues(alpha: 0.13), kCard)
                : kCard,
            boxShadow: emphasized ? kDepthLift(0.7) : kDepth(),
            border: Border.all(
              color: emphasized
                  ? color.withValues(alpha: 0.34)
                  : kGlassEdge,
              width: 1,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
            child: Row(
              children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(kRadiusSm),
                    color: color.withValues(alpha: 0.16),
                    border: Border.all(color: color.withValues(alpha: 0.30)),
                  ),
                  child: Icon(icon, color: color, size: 23),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        label,
                        style: const TextStyle(
                          color: kText,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.2,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        subtitle,
                        style: const TextStyle(
                          color: kSub,
                          fontSize: 12.5,
                          height: 1.25,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: kMuted,
                  size: 22,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Cabeçalho de etapa num fluxo de 3 passos.
///
/// Antes era só "1. Colaborador" em cinza — o número não dizia nada sobre o
/// estado. Aqui o marcador vira um selo que se preenche quando a etapa está
/// pronta, então o almoxarife vê de longe o que falta sem ler nada.
class StepHeader extends StatelessWidget {
  const StepHeader({
    super.key,
    required this.label,
    this.done = false,
    this.detail,
  });

  final String label;
  final bool done;
  final String? detail;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: kGapLg, bottom: kGapSm),
      child: Row(
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOut,
            width: 22,
            height: 22,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: done ? kGreen : Colors.transparent,
              border: Border.all(
                color: done ? kGreen : kMuted,
                width: 1.4,
              ),
            ),
            child: done
                ? const Icon(Icons.check, size: 13, color: Colors.white)
                : null,
          ),
          const SizedBox(width: 10),
          Text(
            label,
            style: TextStyle(
              color: done ? kText : kMuted,
              fontSize: 13,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.1,
            ),
          ),
          if (detail != null) ...[
            const Spacer(),
            Text(
              detail!,
              style: const TextStyle(
                color: kSub,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Cabeçalho de seção. O espaço vem *acima* do título, nunca abaixo — é o
/// que separa um bloco do anterior.
class SectionHeader extends StatelessWidget {
  const SectionHeader({super.key, required this.title, this.trailing});

  final String title;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: kGapXl, bottom: kGapSm),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                color: kText,
                fontSize: 13,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.2,
              ),
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}
