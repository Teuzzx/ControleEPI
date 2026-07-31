import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';

import '../../core/theme.dart';
import '../../models/cart_item.dart';
import '../../models/employee.dart';
import '../../providers.dart';
import '../../repositories/data_repo.dart';
import '../widgets/capture_page.dart';
import '../widgets/employee_picker_page.dart';
import '../widgets/epi_picker_page.dart';

class SaidaPage extends ConsumerStatefulWidget {
  const SaidaPage({super.key});

  @override
  ConsumerState<SaidaPage> createState() => _SaidaPageState();
}

class _SaidaPageState extends ConsumerState<SaidaPage> {
  Employee? _employee;
  final List<CartItem> _cart = [];
  String? _photoPath;
  String? _signaturePath;
  bool _submitting = false;

  int get _totalQty => _cart.fold(0, (s, i) => s + i.quantity);

  Future<void> _pickEmployee() async {
    final picked = await Navigator.push<Employee>(context,
        MaterialPageRoute(builder: (_) => const EmployeePickerPage()));
    if (picked != null) setState(() => _employee = picked);
  }

  Future<void> _pickEpi() async {
    final item = await Navigator.push<CartItem>(context,
        MaterialPageRoute(builder: (_) => const EpiPickerPage(mode: 'saida')));
    if (item == null || !mounted) return;

    setState(() {
      final existing = _cart.indexWhere(
        (c) => c.epiId == item.epiId && c.color == item.color && c.size == item.size,
      );
      if (existing >= 0) {
        final old = _cart[existing];
        _cart[existing] = CartItem(
          epiId: old.epiId,
          epiName: old.epiName,
          color: old.color,
          size: old.size,
          quantity: old.quantity + item.quantity,
          state: old.state,
          observation: old.observation,
        );
      } else {
        _cart.add(item);
      }
    });
  }

  Future<void> _capture() async {
    final result = await Navigator.push<CaptureResult>(context,
        MaterialPageRoute(builder: (_) => const CapturePage()));
    if (result == null) return;
    setState(() {
      _photoPath = result.photoPath;
      _signaturePath = result.signaturePath;
    });
  }

  Future<void> _submit() async {
    if (_submitting) return;

    // Validações
    if (_employee == null) {
      _warn('Selecione o colaborador.');
      return;
    }
    if (_cart.isEmpty) {
      _warn('Adicione ao menos um EPI.');
      return;
    }
    if (_photoPath == null || _signaturePath == null) {
      _warn('Adicione a foto do EPI e a assinatura do colaborador.');
      return;
    }

    final session = ref.read(sessionProvider);
    if (session == null) {
      _warn('Sessão expirada. Faça login novamente.');
      return;
    }

    final cartId = const Uuid().v4();
    final sync = ref.read(syncServiceProvider);
    setState(() => _submitting = true);

    try {
      final connectivity = await Connectivity().checkConnectivity();
      if (connectivity.every((c) => c == ConnectivityResult.none)) {
        // Offline: guarda na fila
        await sync.enqueue(
          type: 'saida',
          session: session,
          cartId: cartId,
          employee: _employee!,
          items: List.of(_cart),
          photoPath: _photoPath,
          signaturePath: _signaturePath,
        );
        if (!mounted) return;
        _done('Salvo offline. Será sincronizado quando houver internet.');
        return;
      }

      // Online
      final client = ref.read(dataClientProvider);
      try {
        if (client == null) throw Exception('Sem conexão com o servidor.');
        await DataRepo.processSaida(
          client: client,
          session: session,
          cartId: cartId,
          employee: _employee!,
          items: List.of(_cart),
          photoPath: _photoPath,
          signaturePath: _signaturePath,
        );
      } catch (e) {
        // Erros de estoque/validação não podem ir para a fila offline.
        final msg = e.toString();
        if (msg.contains('Estoque insuficiente') ||
            msg.contains('não encontrada') ||
            msg.contains('insuficiente')) {
          if (!mounted) return;
          setState(() => _submitting = false);
          _warn(msg.replaceAll('Exception: ', ''));
          return;
        }
        // Falha de rede: enfileira e sincroniza depois
        await sync.enqueue(
          type: 'saida',
          session: session,
          cartId: cartId,
          employee: _employee!,
          items: List.of(_cart),
          photoPath: _photoPath,
          signaturePath: _signaturePath,
        );
        if (!mounted) return;
        _done('Sem conexão. Operação salva e será sincronizada automaticamente.');
        return;
      }

      if (!mounted) return;
      _done('Saída registrada com sucesso!');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _done(String message) {
    ref.invalidate(stockProvider);
    ref.invalidate(recentMovementsProvider);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: kGreen,
        content: Text(message, style: const TextStyle(color: Colors.white)),
      ),
    );
    setState(() {
      _employee = null;
      _cart.clear();
      _photoPath = null;
      _signaturePath = null;
    });
  }

  void _warn(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final offlineReady = _employee != null && _cart.isNotEmpty;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Saída de EPI'),
        actions: [
          IconButton(
            tooltip: 'Limpar',
            icon: const Icon(Icons.delete_sweep_outlined, color: kSub),
            onPressed: () => setState(() {
              _employee = null;
              _cart.clear();
              _photoPath = null;
              _signaturePath = null;
            }),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
              children: [
                // ── Colaborador ──────────────────────────────────────────
                const Text('1. Colaborador',
                    style: TextStyle(color: kMuted, fontSize: 12, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                AppCard(
                  onTap: _pickEmployee,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  child: Row(
                    children: [
                      Icon(
                        _employee == null ? Icons.person_outline : Icons.person,
                        color: _employee == null ? kMuted : kGreen,
                        size: 22,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _employee?.name ?? 'Tocar para selecionar',
                          style: TextStyle(
                            color: _employee == null ? kMuted : kText,
                            fontSize: 13.5,
                            fontWeight: _employee == null ? FontWeight.w400 : FontWeight.w600,
                          ),
                        ),
                      ),
                      const Icon(Icons.chevron_right, color: kIndigo, size: 20),
                    ],
                  ),
                ),

                // ── Itens ────────────────────────────────────────────────
                const SizedBox(height: 20),
                Row(
                  children: [
                    const Text('2. Itens',
                        style: TextStyle(
                            color: kMuted, fontSize: 12, fontWeight: FontWeight.w700)),
                    const Spacer(),
                    Text('$_totalQty un.',
                        style: const TextStyle(
                            color: kSub, fontSize: 12, fontWeight: FontWeight.w600)),
                  ],
                ),
                const SizedBox(height: 8),
                if (_cart.isEmpty)
                  AppCard(
                    onTap: _pickEpi,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 18),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.add_circle_outline, color: kIndigo, size: 20),
                        SizedBox(width: 8),
                        Text('Adicionar EPI ao carrinho',
                            style: TextStyle(color: kSub, fontSize: 13.5)),
                      ],
                    ),
                  )
                else
                  ..._cart.map((item) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: AppCard(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          child: Row(
                            children: [
                              Container(
                                width: 34,
                                height: 34,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: kGreen.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(9),
                                ),
                                child: Text('${item.quantity}',
                                    style: const TextStyle(
                                        color: kGreen,
                                        fontWeight: FontWeight.w800,
                                        fontSize: 13)),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(item.epiName,
                                        style: const TextStyle(
                                            color: kText, fontSize: 13.5, fontWeight: FontWeight.w600)),
                                    Text(item.variantLabel.isEmpty ? 'Único' : item.variantLabel,
                                        style: const TextStyle(color: kMuted, fontSize: 11.5)),
                                  ],
                                ),
                              ),
                              IconButton(
                                tooltip: 'Remover',
                                icon: const Icon(Icons.close, color: kRed, size: 18),
                                onPressed: () => setState(() => _cart.remove(item)),
                              ),
                            ],
                          ),
                        ),
                      )),
                if (_cart.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: AppCard(
                      onTap: _pickEpi,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add, color: kIndigo, size: 18),
                          SizedBox(width: 6),
                          Text('Adicionar outro EPI',
                              style: TextStyle(color: kIndigo, fontSize: 12.5)),
                        ],
                      ),
                    ),
                  ),

                // ── Foto + assinatura ─────────────────────────────────────
                const SizedBox(height: 12),
                const Text('3. Foto e assinatura',
                    style: TextStyle(color: kMuted, fontSize: 12, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                AppCard(
                  onTap: _capture,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  child: Row(
                    children: [
                      Icon(
                        _photoPath != null && _signaturePath != null
                            ? Icons.check_circle
                            : Icons.camera_alt_outlined,
                        color: _photoPath != null && _signaturePath != null ? kGreen : kAmber,
                        size: 22,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _photoPath != null && _signaturePath != null
                                  ? 'Foto e assinatura capturadas'
                                  : 'Capturar foto do EPI e assinatura',
                              style: const TextStyle(
                                  color: kText, fontSize: 13.5, fontWeight: FontWeight.w600),
                            ),
                            Text(
                              _photoPath != null && _signaturePath != null
                                  ? 'Tocar para refazer'
                                  : 'Ficam salvas no registro da saída',
                              style: const TextStyle(color: kMuted, fontSize: 11.5),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right, color: kAmber, size: 20),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Rodapé de confirmação ───────────────────────────────────────
          Container(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
            decoration: const BoxDecoration(
              color: kBg,
              border: Border(top: BorderSide(color: Color(0xFF1E2236))),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (offlineReady)
                  Row(
                    children: [
                      const Icon(Icons.cloud_off, color: kMuted, size: 15),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          _photoPath == null || _signaturePath == null
                              ? 'Complete a foto e a assinatura.'
                              : 'Pronto para registrar. Sem internet? A operação será salva offline.',
                          style: const TextStyle(color: kMuted, fontSize: 11.5),
                        ),
                      ),
                    ],
                  ),
                if (offlineReady) const SizedBox(height: 8),
                ElevatedButton.icon(
                  onPressed: _submitting || !offlineReady ? null : _submit,
                  icon: _submitting
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.check_circle_outline, size: 20),
                  label: Text(_submitting ? 'Registrando...' : 'Confirmar Saída'),
                ),
                const SizedBox(height: 10),
                TextButton.icon(
                  onPressed: () => context.go('/home'),
                  icon: const Icon(Icons.arrow_back, size: 16, color: kSub),
                  label: const Text('Cancelar e voltar',
                      style: TextStyle(color: kSub, fontSize: 13)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
