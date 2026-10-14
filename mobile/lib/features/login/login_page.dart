import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme.dart';
import '../../providers.dart';
import 'forgot_password_dialog.dart';

// ── Paleta premium ─────────────────────────────────────────────────────────
const _cBg = Color(0xFF09090F);
const _cField = Color(0xFF171B28);
const _cPurple = Color(0xFF6D5EF8);
const _cPurpleLight = Color(0xFF8575FF);
const _cPurpleSoft = Color(0xFF8B7CFF);
const _cMuted = Color(0xFFA3A3B2);
const _cDim = Color(0xFF6E6E84);
const _cCard = Color.fromRGBO(18, 22, 33, 0.72);

const _kBgPrimary =
    'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=1080&q=80';
const _kBgFallback =
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1080&q=80';

// ── Entrada animada (fade + slide, com atraso em cascata) ──────────────────
class _Reveal extends StatefulWidget {
  const _Reveal({required this.delay, required this.child});

  final double delay;
  final Widget child;

  @override
  State<_Reveal> createState() => _RevealState();
}

class _RevealState extends State<_Reveal>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 750),
  )..forward();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final interval = Interval(
      widget.delay,
      widget.delay + 0.45,
      curve: Curves.easeOutCubic,
    );
    return AnimatedBuilder(
      animation: _c,
      builder: (context, child) {
        final t = interval.transform(_c.value);
        return Opacity(
          opacity: t,
          child: Transform.translate(offset: Offset(0, 22 * (1 - t)), child: child),
        );
      },
      child: widget.child,
    );
  }
}

// ── Campo de login com glow roxo no foco ───────────────────────────────────
class _LoginField extends StatefulWidget {
  const _LoginField({
    required this.focusNode,
    required this.controller,
    required this.icon,
    required this.hint,
    this.obscure = false,
    this.suffix,
    this.onSubmitted,
    this.enabled = true,
  });

  final FocusNode focusNode;
  final TextEditingController controller;
  final IconData icon;
  final String hint;
  final bool obscure;
  final Widget? suffix;
  final ValueChanged<String>? onSubmitted;
  final bool enabled;

  @override
  State<_LoginField> createState() => _LoginFieldState();
}

class _LoginFieldState extends State<_LoginField> {
  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOut,
      height: 58,
      decoration: BoxDecoration(
        color: _cField,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: widget.focusNode.hasFocus
              ? _cPurple.withValues(alpha: 0.5)
              : Colors.transparent,
        ),
        boxShadow: widget.focusNode.hasFocus
            ? [
                BoxShadow(
                  color: _cPurple.withValues(alpha: 0.22),
                  blurRadius: 30,
                  spreadRadius: 0,
                ),
              ]
            : null,
      ),
      child: TextField(
        focusNode: widget.focusNode,
        controller: widget.controller,
        obscureText: widget.obscure,
        enabled: widget.enabled,
        autocorrect: false,
        onSubmitted: widget.onSubmitted,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 15,
          fontWeight: FontWeight.w500,
        ),
        decoration: InputDecoration(
          border: InputBorder.none,
          hintText: widget.hint,
          hintStyle: const TextStyle(color: _cDim, fontSize: 14.5),
          prefixIcon: Icon(widget.icon, size: 17, color: _cDim),
          suffixIcon: widget.suffix,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 6, vertical: 18),
        ),
      ),
    );
  }
}

// ── Botão principal com gradiente ──────────────────────────────────────────
class _PrimaryButton extends StatefulWidget {
  const _PrimaryButton({
    required this.onPressed,
    required this.loading,
    required this.success,
    required this.child,
  });

  final VoidCallback? onPressed;
  final bool loading;
  final bool success;
  final Widget child;

  @override
  State<_PrimaryButton> createState() => _PrimaryButtonState();
}

class _PrimaryButtonState extends State<_PrimaryButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return AnimatedScale(
      scale: _pressed ? 0.98 : 1.02,
      duration: const Duration(milliseconds: 140),
      curve: Curves.easeOut,
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          height: 60,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [_cPurple, _cPurpleLight],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: _cPurple.withValues(alpha: 0.32),
                blurRadius: 30,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: widget.onPressed,
            onTapDown: (_) => setState(() => _pressed = true),
            onTapUp: (_) => setState(() => _pressed = false),
            onTapCancel: () => setState(() => _pressed = false),
            child: Center(
              child: AnimatedOpacity(
                duration: const Duration(milliseconds: 250),
                opacity: widget.loading || widget.success ? 0.9 : 1,
                child: widget.child,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Página de login ────────────────────────────────────────────────────────
class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage>
    with SingleTickerProviderStateMixin {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _emailFocus = FocusNode();
  final _passFocus = FocusNode();
  late final AnimationController _floatCtrl = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 4),
  )..repeat(reverse: true);
  late final AnimationController _glowCtrl = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 3),
  )..repeat(reverse: true);

  bool _loading = false;
  bool _obscure = true;
  bool _remember = false;
  String? _error;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _emailFocus.dispose();
    _passFocus.dispose();
    _floatCtrl.dispose();
    _glowCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_loading) return;
    if (_emailCtrl.text.trim().isEmpty || _passCtrl.text.isEmpty) {
      setState(() => _error = 'Informe e-mail e senha.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      await ref.read(sessionProvider.notifier).login(_emailCtrl.text, _passCtrl.text);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _cBg,
      body: Stack(
        children: [
          // ── Wallpaper: fotografia de EPI ──
          Positioned.fill(
            child: Image.network(
              _kBgPrimary,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) =>
                  Image.network(_kBgFallback, fit: BoxFit.cover),
            ),
          ),
          // Gradiente escuro ~80% para leitura
          Positioned.fill(
            child: DecoratedBox(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Color(0xC709090F),
                    Color(0x9E09090F),
                    Color(0xCC09090F),
                    Color(0xF209090F),
                  ],
                  stops: [0, 0.34, 0.68, 1],
                ),
              ),
            ),
          ),
          // Vinheta
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  radius: 1.15,
                  colors: [Colors.transparent, Colors.black.withValues(alpha: 0.62)],
                  stops: const [0.48, 1],
                ),
              ),
            ),
          ),
          // Iluminação suave nas laterais
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [
                    _cPurple.withValues(alpha: 0.14),
                    Colors.transparent,
                    Colors.transparent,
                    _cPurple.withValues(alpha: 0.12),
                  ],
                  stops: const [0, 0.3, 0.7, 1],
                ),
              ),
            ),
          ),

          // ── Conteúdo ──
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(28),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 430),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // ── Cabeçalho ──
                      _Reveal(
                        delay: 0,
                        child: Column(
                          children: [
                            AnimatedBuilder(
                              animation: _floatCtrl,
                              builder: (context, child) => Transform.translate(
                                offset: Offset(0, -8 * _floatCtrl.value),
                                child: child,
                              ),
                              child: Container(
                                  width: 88,
                                  height: 88,
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    color: _cPurple.withValues(alpha: 0.13),
                                    borderRadius:
                                        BorderRadius.circular(kRadiusLg),
                                    border: Border.all(
                                        color: _cPurpleSoft
                                            .withValues(alpha: 0.34)),
                                    boxShadow: kDepthLift(0.7),
                                  ),
                                  // Antes era um escudo com um badge de
                                  // capacete de MOTO por cima — não tem
                                  // relação com EPI e é o clichê de
                                  // "escudo = segurança". O capacete de obra
                                  // é o próprio equipamento que o sistema
                                  // controla.
                                  child: const Icon(
                                    Icons.health_and_safety,
                                    size: 44,
                                    color: _cPurpleSoft,
                                  ),
                                ),
                              ),
                            const SizedBox(height: 22),
                            const Text(
                              'Controle de EPI',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 30,
                                fontWeight: FontWeight.w800,
                                letterSpacing: -0.9,
                              ),
                            ),
                            const SizedBox(height: 10),
                            const Text(
                              'Entrega, devolução e estoque de EPI, com prova de quem recebeu.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: _cMuted,
                                fontSize: 12.5,
                                height: 1.55,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),

                      // ── Card flutuante ──
                      _Reveal(
                        delay: 0.18,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(30),
                          child: BackdropFilter(
                            filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
                            child: Container(
                              padding: const EdgeInsets.fromLTRB(24, 30, 24, 26),
                              decoration: BoxDecoration(
                                color: _cCard,
                                borderRadius: BorderRadius.circular(30),
                                border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.08)),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.45),
                                    blurRadius: 90,
                                    offset: const Offset(0, 40),
                                  ),
                                  BoxShadow(
                                    color: _cPurple.withValues(alpha: 0.07),
                                    blurRadius: 60,
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  const Text(
                                    'Bem-vindo novamente',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 28,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: -0.7,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  const Text(
                                    'Faça login para continuar utilizando o sistema.',
                                    style: TextStyle(
                                        color: _cMuted, fontSize: 14, height: 1.5),
                                  ),
                                  const SizedBox(height: 26),

                                  // E-mail
                                  _LoginField(
                                    focusNode: _emailFocus,
                                    controller: _emailCtrl,
                                    icon: Icons.mail_outline,
                                    hint: 'E-mail ou matrícula',
                                    enabled: !_loading,
                                  ),
                                  const SizedBox(height: 14),

                                  // Senha
                                  _LoginField(
                                    focusNode: _passFocus,
                                    controller: _passCtrl,
                                    icon: Icons.lock_outline,
                                    hint: 'Sua senha',
                                    obscure: _obscure,
                                    enabled: !_loading,
                                    onSubmitted: (_) => _submit(),
                                    suffix: IconButton(
                                      icon: Icon(
                                        _obscure
                                            ? Icons.visibility_off
                                            : Icons.visibility,
                                        size: 17,
                                        color: _cDim,
                                      ),
                                      onPressed: () =>
                                          setState(() => _obscure = !_obscure),
                                    ),
                                  ),
                                  const SizedBox(height: 14),

                                  // Lembrar + Esqueci
                                  Row(
                                    children: [
                                      Expanded(
                                        child: InkWell(
                                          onTap: () => setState(
                                              () => _remember = !_remember),
                                          borderRadius: BorderRadius.circular(8),
                                          child: Padding(
                                            padding: const EdgeInsets.symmetric(
                                                vertical: 6),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                AnimatedContainer(
                                                  duration: const Duration(
                                                      milliseconds: 180),
                                                  width: 18,
                                                  height: 18,
                                                  decoration: BoxDecoration(
                                                    color: _remember
                                                        ? _cPurple
                                                        : Colors.transparent,
                                                    borderRadius:
                                                        BorderRadius.circular(6),
                                                    border: _remember
                                                        ? null
                                                        : Border.all(
                                                            color: Colors.white
                                                                .withValues(
                                                                    alpha: 0.16)),
                                                  ),
                                                  child: _remember
                                                      ? const Icon(
                                                          Icons.check,
                                                          size: 12,
                                                          color: Colors.white)
                                                      : null,
                                                ),
                                                const SizedBox(width: 9),
                                                const Text(
                                                  'Lembrar de mim',
                                                  style: TextStyle(
                                                      color: Color(0xFF8A8A9C),
                                                      fontSize: 13),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),
                                      TextButton(
                                        onPressed: () async {
                                          final messenger =
                                              ScaffoldMessenger.of(context);
                                          final ok = await showDialog<bool>(
                                            context: context,
                                            builder: (_) =>
                                                const ForgotPasswordDialog(),
                                          );
                                          if (ok == true && mounted) {
                                            _passCtrl.clear();
                                            messenger.showSnackBar(
                                              const SnackBar(
                                                backgroundColor: kGreen,
                                                content: Text(
                                                  'Senha redefinida com sucesso! Faça login com a nova senha.',
                                                  style: TextStyle(
                                                      color: Colors.white),
                                                ),
                                              ),
                                            );
                                          }
                                        },
                                        style: TextButton.styleFrom(
                                          foregroundColor: _cPurpleSoft,
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 4),
                                          textStyle: const TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w600),
                                        ),
                                        child: const Text('Esqueci minha senha'),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),

                                  // Erro
                                  if (_error != null) ...[
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: kRed.withValues(alpha: 0.08),
                                        borderRadius: BorderRadius.circular(14),
                                        border: Border.all(
                                            color: kRed.withValues(alpha: 0.2)),
                                      ),
                                      child: Row(
                                        children: [
                                          const Icon(Icons.error_outline,
                                              size: 16, color: kRed),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(_error!,
                                                style: const TextStyle(
                                                    color: kRed,
                                                    fontSize: 13)),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                  ],

                                  // Botão principal
                                  _PrimaryButton(
                                    loading: _loading,
                                    success: false,
                                    onPressed: _loading ? null : _submit,
                                    child: _loading
                                        ? const SizedBox(
                                            width: 20,
                                            height: 20,
                                            child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                                color: Colors.white),
                                          )
                                        : const Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Text(
                                                'Acessar Sistema',
                                                style: TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 15,
                                                  fontWeight: FontWeight.w700,
                                                  letterSpacing: 0.2,
                                                ),
                                              ),
                                              SizedBox(width: 10),
                                              Icon(Icons.arrow_forward,
                                                  size: 17,
                                                  color: Colors.white),
                                            ],
                                          ),
                                  ),
                                  const SizedBox(height: 14),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 28),

                      // ── Selo de segurança ──
                      _Reveal(
                        delay: 0.34,
                        child: Column(
                          children: [
                            AnimatedBuilder(
                              animation: _glowCtrl,
                              builder: (context, child) => Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: _cPurple.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                      color: _cPurple.withValues(alpha: 0.3)),
                                  boxShadow: [
                                    BoxShadow(
                                      color: _cPurple.withValues(alpha: 0.5),
                                      blurRadius:
                                          14 + 14 * _glowCtrl.value,
                                    ),
                                  ],
                                ),
                                child: const Icon(Icons.safety_check,
                                    size: 20, color: _cPurpleSoft),
                              ),
                            ),
                            const SizedBox(height: 9),
                            const Text(
                              'Seus dados estão protegidos',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Color(0xFFE4E4EF),
                                fontSize: 12.5,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 5),
                            const Text(
                              'Comunicação criptografada • Login seguro • Ambiente protegido',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                  color: _cDim, fontSize: 11, letterSpacing: 0.2),
                            ),
                            const SizedBox(height: 14),
                            const Text(
                              'NORION • Tecnologia e Inovação',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Color(0xFF4A4A5E),
                                fontSize: 10,
                                letterSpacing: 2,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
