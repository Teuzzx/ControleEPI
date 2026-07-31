import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/config.dart';
import '../../core/theme.dart';
import '../../providers.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  String? _error;
  String? _diagResult;

  Future<void> _runDiagnostic() async {
    setState(() => _diagResult = 'Testando conexão...');
    try {
      final client = HttpClient()
        ..connectionTimeout = const Duration(seconds: 10);
      final request = await client
          .getUrl(Uri.parse('${Config.supabaseMatrizUrl}/rest/v1/'))
          .timeout(const Duration(seconds: 10));
      request.headers.set('apikey', Config.supabaseMatrizAnonKey);
      final response = await request.close().timeout(const Duration(seconds: 10));
      final status = response.statusCode;
      final body = await response.transform(const SystemEncoding().decoder).join();
      client.close(force: true);
      setState(() => _diagResult =
          'Servidor respondeu HTTP $status.\n\n$body');
    } catch (e) {
      setState(() => _diagResult = 'FALHOU. Detalhe técnico:\n$e');
    }
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
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
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(28),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: kIndigo.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: kIndigo.withValues(alpha: 0.4)),
                    ),
                    child: const Text('🦺', style: TextStyle(fontSize: 30)),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Controle de EPI',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: kText,
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.5,
                      fontFamily: 'Roboto',
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Acesso do almoxarife',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: kSub, fontSize: 14),
                  ),
                  const SizedBox(height: 32),
                  TextField(
                    controller: _emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    autocorrect: false,
                    decoration: const InputDecoration(labelText: 'E-mail', hintText: 'voce@empresa.com'),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _passCtrl,
                    obscureText: _obscure,
                    onSubmitted: (_) => _submit(),
                    decoration: InputDecoration(
                      labelText: 'Senha',
                      suffixIcon: IconButton(
                        icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility,
                            size: 20, color: kMuted),
                        onPressed: () => setState(() => _obscure = !_obscure),
                      ),
                    ),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: kRed.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: kRed.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.error_outline, size: 16, color: kRed),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(_error!,
                                style: const TextStyle(color: kRed, fontSize: 12.5)),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: kSub,
                            side: const BorderSide(color: Color(0xFF23273C)),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          onPressed: () {
                            _emailCtrl.text = 'admin@norion.com';
                            _passCtrl.text = 'admin123';
                            setState(() {});
                          },
                          child: const Text('Preencher demo',
                              style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  ElevatedButton(
                    onPressed: _loading ? null : _submit,
                    child: _loading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Entrar'),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Dados protegidos — login verificado no banco.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: kMuted, fontSize: 11.5),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: _runDiagnostic,
                    child: const Text('Testar conexão com o servidor',
                        style: TextStyle(color: kSub, fontSize: 11.5)),
                  ),
                  if (_diagResult != null) ...[
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF171A29),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFF23273C)),
                      ),
                      child: Text(_diagResult!,
                          style: const TextStyle(
                              color: kSub, fontSize: 11, fontFamily: 'monospace')),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
