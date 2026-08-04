import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme.dart';
import '../../repositories/auth_repo.dart';

const _cField = Color(0xFF171B28);
const _cPurple = Color(0xFF6D5EF8);
const _cPurpleLight = Color(0xFF8575FF);
const _cPurpleSoft = Color(0xFF8B7CFF);
const _cDim = Color(0xFF6E6E84);

/// Recuperação de senha em 2 passos (igual ao web):
/// Passo 1 — informa o e-mail (chama `app_request_password_reset`).
/// Passo 2 — código de 6 dígitos + nova senha (chama `app_reset_password_with_code`).
/// Devolve `true` quando a senha foi redefinida com sucesso.
class ForgotPasswordDialog extends StatefulWidget {
  const ForgotPasswordDialog({super.key});

  @override
  State<ForgotPasswordDialog> createState() => _ForgotPasswordDialogState();
}

class _ForgotPasswordDialogState extends State<ForgotPasswordDialog> {
  final _emailCtrl = TextEditingController();
  final _codeCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  final _emailFocus = FocusNode();
  final _codeFocus = FocusNode();

  var _step = 1;
  var _loading = false;
  var _obscure = true;
  String? _error;
  String? _info;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _codeCtrl.dispose();
    _passCtrl.dispose();
    _confirmCtrl.dispose();
    _emailFocus.dispose();
    _codeFocus.dispose();
    super.dispose();
  }

  Future<void> _sendCode() async {
    if (_loading) return;
    if (_emailCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Informe o e-mail do seu login.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
      _info = null;
    });
    try {
      await AuthRepo.requestPasswordReset(_emailCtrl.text);
      if (!mounted) return;
      setState(() {
        _step = 2;
        _loading = false;
        _info =
            'Se existir uma conta com este e-mail, você receberá um código de 6 dígitos.';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _reset() async {
    if (_loading) return;
    if (_codeCtrl.text.trim().isEmpty ||
        _passCtrl.text.isEmpty ||
        _confirmCtrl.text.isEmpty) {
      setState(() => _error = 'Preencha o código, a nova senha e a confirmação.');
      return;
    }
    if (_passCtrl.text.length < 6) {
      setState(() => _error = 'A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (_passCtrl.text != _confirmCtrl.text) {
      setState(() => _error = 'As senhas não coincidem.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await AuthRepo.resetPasswordWithCode(
        _emailCtrl.text,
        _codeCtrl.text,
        _passCtrl.text,
      );
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  void _backToLogin() => Navigator.of(context).pop(false);

  void _toStep1() {
    setState(() {
      _step = 1;
      _error = null;
      _info = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: const Color(0xFF171B28),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: const BorderSide(color: Colors.white12),
      ),
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      content: SingleChildScrollView(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 400),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.lock_reset, size: 32, color: _cPurpleSoft),
              const SizedBox(height: 12),
              Text(
                _step == 1 ? 'Recuperar senha' : 'Digite o código',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                _step == 1
                    ? 'Informe o e-mail do seu login. Enviaremos um código de verificação de 6 dígitos.'
                    : 'Digite o código recebido por e-mail e defina a nova senha.',
                textAlign: TextAlign.center,
                style: const TextStyle(color: _cDim, fontSize: 13, height: 1.5),
              ),
              const SizedBox(height: 20),
              if (_step == 1)
                _field(
                  focusNode: _emailFocus,
                  controller: _emailCtrl,
                  icon: Icons.mail_outline,
                  hint: 'Seu e-mail de login',
                  keyboard: TextInputType.emailAddress,
                )
              else ...[
                _field(
                  focusNode: _codeFocus,
                  controller: _codeCtrl,
                  icon: Icons.password,
                  hint: 'Código de 6 dígitos',
                  keyboard: TextInputType.number,
                  maxLength: 6,
                  code: true,
                ),
                const SizedBox(height: 12),
                _field(
                  focusNode: FocusNode(),
                  controller: _passCtrl,
                  icon: Icons.lock_outline,
                  hint: 'Nova senha (mín. 6)',
                  obscure: _obscure,
                  suffix: IconButton(
                    icon: Icon(
                      _obscure ? Icons.visibility_off : Icons.visibility,
                      size: 17,
                      color: _cDim,
                    ),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),
                const SizedBox(height: 12),
                _field(
                  focusNode: FocusNode(),
                  controller: _confirmCtrl,
                  icon: Icons.lock_outline,
                  hint: 'Confirme a nova senha',
                  obscure: _obscure,
                ),
              ],
              const SizedBox(height: 14),

              if (_error != null) ...[
                _banner(color: kRed, icon: Icons.error_outline, text: _error!),
                const SizedBox(height: 12),
              ],
              if (_info != null && _step == 2) ...[
                _banner(color: kGreen, icon: Icons.check_circle_outline, text: _info!),
                const SizedBox(height: 12),
              ],

              Row(
                children: [
                  if (_step == 1)
                    TextButton(
                      onPressed: _backToLogin,
                      style: TextButton.styleFrom(foregroundColor: _cDim),
                      child: const Text('Voltar ao login'),
                    )
                  else
                    TextButton(
                      onPressed: _toStep1,
                      style: TextButton.styleFrom(foregroundColor: _cDim),
                      child: const Text('Voltar'),
                    ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _primary(
                      loading: _loading,
                      onTap: _loading ? null : (_step == 1 ? _sendCode : _reset),
                      label: _step == 1 ? 'Enviar código' : 'Redefinir senha',
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _field({
    required FocusNode focusNode,
    required TextEditingController controller,
    required IconData icon,
    required String hint,
    bool obscure = false,
    TextInputType? keyboard,
    int? maxLength,
    bool code = false,
    Widget? suffix,
  }) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeOut,
      height: 52,
      decoration: BoxDecoration(
        color: _cField.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: focusNode.hasFocus
              ? _cPurple.withValues(alpha: 0.5)
              : Colors.transparent,
        ),
      ),
      child: TextField(
        focusNode: focusNode,
        controller: controller,
        obscureText: obscure,
        keyboardType: keyboard,
        maxLength: maxLength,
        textAlign: code ? TextAlign.center : TextAlign.start,
        inputFormatters: code ? [FilteringTextInputFormatter.digitsOnly] : null,
        style: code
            ? const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w700,
                letterSpacing: 8,
              )
            : const TextStyle(color: Colors.white, fontSize: 15),
        decoration: InputDecoration(
          border: InputBorder.none,
          counterText: '',
          hintText: hint,
          hintStyle: const TextStyle(color: _cDim, fontSize: 13.5),
          prefixIcon: code ? null : Icon(icon, size: 17, color: _cDim),
          suffixIcon: suffix,
          contentPadding: const EdgeInsets.symmetric(horizontal: 6, vertical: 14),
        ),
      ),
    );
  }

  Widget _banner({required Color color, required IconData icon, required String text}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 8),
          Expanded(
            child: Text(text, style: TextStyle(color: color, fontSize: 12.5, height: 1.4)),
          ),
        ],
      ),
    );
  }

  Widget _primary({
    required bool loading,
    required VoidCallback? onTap,
    required String label,
  }) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(14),
      child: Ink(
        height: 50,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [_cPurple, _cPurpleLight],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(14),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Center(
            child: loading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : Text(
                    label,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}