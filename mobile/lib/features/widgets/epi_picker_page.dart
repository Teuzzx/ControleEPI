import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme.dart';
import '../../models/cart_item.dart';
import '../../models/epi_item.dart';
import '../../providers.dart';

/// Seleção de EPI + variação (cor/tamanho) + quantidade.
/// mode: 'saida' (só variantes com estoque) | 'devolucao' (qualquer variante + estado).
/// Retorna um CartItem via Navigator.pop.
class EpiPickerPage extends ConsumerStatefulWidget {
  const EpiPickerPage({super.key, required this.mode});

  final String mode;

  @override
  ConsumerState<EpiPickerPage> createState() => _EpiPickerPageState();
}

class _EpiPickerPageState extends ConsumerState<EpiPickerPage> {
  final _searchCtrl = TextEditingController();
  String _query = '';

  EpiItem? _selected;
  EpiVariant? _variant;
  int _qty = 1;
  String _state = 'Novo';
  String _observation = '';

  bool get _isSaida => widget.mode == 'saida';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _selectEpi(EpiItem epi) {
    final options = _isSaida ? epi.availableVariants : epi.variants;
    setState(() {
      _selected = epi;
      _variant = options.isNotEmpty ? options.first : null;
      _qty = 1;
      _state = 'Novo';
      _observation = '';
    });
  }

  int get _maxQty => _isSaida ? (_variant?.quantity ?? 1) : 9999;

  void _add() {
    if (_selected == null || _variant == null) return;
    if (_qty < 1) return;
    if (_isSaida && _qty > _variant!.quantity) return;

    Navigator.pop(
      context,
      CartItem(
        epiId: _selected!.id,
        epiName: _selected!.name,
        color: _variant!.color,
        size: _variant!.size,
        quantity: _qty,
        state: _state,
        observation: _observation.trim(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final stock = ref.watch(stockProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(_isSaida ? 'Escolher EPI' : 'Escolher EPI devolvido'),
        actions: [
          IconButton(
            tooltip: 'Atualizar estoque',
            icon: const Icon(Icons.refresh, color: kSub),
            onPressed: () => ref.invalidate(stockProvider),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
            child: TextField(
              controller: _searchCtrl,
              onChanged: (v) => setState(() => _query = v.toLowerCase()),
              decoration: const InputDecoration(
                hintText: 'Buscar EPI...',
                prefixIcon: Icon(Icons.search, color: kMuted, size: 20),
              ),
            ),
          ),
          Expanded(
            child: stock.when(
              data: (items) {
                final filtered = items
                    .where((e) => _query.isEmpty || e.name.toLowerCase().contains(_query))
                    .toList();
                return ListView(
                  padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                  children: [
                    for (final epi in filtered)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: AppCard(
                          onTap: () => _selectEpi(epi),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          child: Row(
                            children: [
                              Container(
                                width: 38,
                                height: 38,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: (_selected?.id == epi.id ? kIndigo : kGreen)
                                      .withValues(alpha: 0.13),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(
                                  _selected?.id == epi.id
                                      ? Icons.check
                                      : Icons.inventory_2_outlined,
                                  color: _selected?.id == epi.id ? kIndigo : kGreen,
                                  size: 19,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(epi.name,
                                        style: const TextStyle(
                                            color: kText, fontSize: 13.5, fontWeight: FontWeight.w600)),
                                    Text(
                                      _isSaida
                                          ? '${epi.availableQuantity} un. disponíveis'
                                          : '${epi.variants.length} variação(ões)',
                                      style: const TextStyle(color: kMuted, fontSize: 11.5),
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(Icons.chevron_right, color: kSub, size: 20),
                            ],
                          ),
                        ),
                      ),
                    if (filtered.isEmpty)
                      const Padding(
                        padding: EdgeInsets.all(32),
                        child: Center(
                          child: Text('Nenhum EPI encontrado.',
                              style: TextStyle(color: kMuted)),
                        ),
                      ),
                  ],
                );
              },
              loading: () => const Center(
                child: CircularProgressIndicator(strokeWidth: 2, color: kIndigo),
              ),
              error: (e, _) => ErrorRetry(
                message: friendlyDataError(e),
                onRetry: () => ref.invalidate(stockProvider),
              ),
            ),
          ),
          if (_selected != null) _buildDetailPanel(),
        ],
      ),
    );
  }

  Widget _buildDetailPanel() {
    final epi = _selected!;
    final options = _isSaida ? epi.availableVariants : epi.variants;

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
      decoration: const BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        border: Border(top: BorderSide(color: Color(0xFF22263C))),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(epi.name,
                    style: const TextStyle(color: kText, fontSize: 15, fontWeight: FontWeight.w700)),
              ),
              IconButton(
                tooltip: 'Fechar',
                icon: const Icon(Icons.close, color: kMuted, size: 20),
                onPressed: () => setState(() => _selected = null),
              ),
            ],
          ),
          if (options.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Text('Este EPI não tem variações com estoque.',
                  style: TextStyle(color: kRed, fontSize: 12.5)),
            )
          else ...[
            const Text('Variação', style: TextStyle(color: kMuted, fontSize: 11, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: options.map((v) {
                final active = _variant?.id == v.id;
                return InkWell(
                  onTap: () => setState(() {
                    _variant = v;
                    _qty = 1;
                  }),
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: active
                          ? kIndigo.withValues(alpha: 0.18)
                          : Colors.white.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: active ? kIndigo : Colors.white.withValues(alpha: 0.08),
                        width: active ? 1.4 : 1,
                      ),
                    ),
                    child: Text(
                      '${v.label.isEmpty ? 'Único' : v.label}  •  ${v.quantity}',
                      style: TextStyle(
                        color: active ? kText : kSub,
                        fontWeight: FontWeight.w600,
                        fontSize: 12.5,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 14),
            if (!_isSaida) ...[
              const Text('Estado do EPI',
                  style: TextStyle(color: kMuted, fontSize: 11, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Row(
                children: ['Novo', 'Usado', 'Danificado'].map((s) {
                  final active = _state == s;
                  final color = s == 'Danificado' ? kRed : s == 'Usado' ? kAmber : kGreen;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: InkWell(
                      onTap: () => setState(() => _state = s),
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: active ? color.withValues(alpha: 0.15) : Colors.transparent,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: active ? color : Colors.white.withValues(alpha: 0.1),
                          ),
                        ),
                        child: Text(s,
                            style: TextStyle(
                              color: active ? color : kSub,
                              fontSize: 12.5,
                              fontWeight: FontWeight.w600,
                            )),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
              TextField(
                onChanged: (v) => _observation = v,
                decoration: const InputDecoration(
                  hintText: 'Observação (opcional)',
                  contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
              ),
              const SizedBox(height: 12),
            ],
            Row(
              children: [
                IconButton(
                  onPressed: _qty > 1 ? () => setState(() => _qty--) : null,
                  icon: const Icon(Icons.remove_circle_outline, color: kIndigo),
                  iconSize: 30,
                ),
                SizedBox(
                  width: 48,
                  child: Text(
                    '$_qty',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: kText, fontSize: 18, fontWeight: FontWeight.w800,
                      fontFamily: 'monospace',
                    ),
                  ),
                ),
                IconButton(
                  onPressed: _qty < _maxQty ? () => setState(() => _qty++) : null,
                  icon: const Icon(Icons.add_circle_outline, color: kIndigo),
                  iconSize: 30,
                ),
                const Spacer(),
                if (_isSaida)
                  Text('máx. ${_variant?.quantity ?? 0}',
                      style: const TextStyle(color: kMuted, fontSize: 11.5, fontFamily: 'monospace')),
                ElevatedButton(
                  onPressed: _add,
                  child: const Text('Adicionar'),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
