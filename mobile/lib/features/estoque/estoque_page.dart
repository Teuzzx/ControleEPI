import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/theme.dart';
import '../../models/epi_item.dart';
import '../../providers.dart';

class EstoquePage extends ConsumerStatefulWidget {
  const EstoquePage({super.key});

  @override
  ConsumerState<EstoquePage> createState() => _EstoquePageState();
}

class _EstoquePageState extends ConsumerState<EstoquePage> {
  final _searchCtrl = TextEditingController();
  String _query = '';
  RealtimeChannel? _channel;

  @override
  void initState() {
    super.initState();
    _subscribeRealtime();
  }

  @override
  void dispose() {
    final client = ref.read(dataClientProvider);
    if (client != null && _channel != null) {
      client.removeChannel(_channel!);
    }
    _searchCtrl.dispose();
    super.dispose();
  }

  void _subscribeRealtime() {
    final client = ref.read(dataClientProvider);
    if (client == null) return;
    _channel = client.channel('estoque-live');
    _channel!.onPostgresChanges(
      event: PostgresChangeEvent.all,
      schema: 'public',
      table: 'epi_variants',
      callback: (_) => ref.invalidate(stockProvider),
    );
    _channel!.subscribe();
  }

  @override
  Widget build(BuildContext context) {
    final stock = ref.watch(stockProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Consultar Estoque'),
        actions: [
          IconButton(
            tooltip: 'Atualizar',
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
                if (filtered.isEmpty) {
                  return const Center(
                    child: Text('Nenhum EPI encontrado.', style: TextStyle(color: kMuted)),
                  );
                }
                return RefreshIndicator(
                  color: kIndigo,
                  onRefresh: () async => ref.invalidate(stockProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) => _EpiCard(epi: filtered[i]),
                  ),
                );
              },
              loading: () => const Center(
                child: CircularProgressIndicator(strokeWidth: 2, color: kIndigo),
              ),
              error: (e, _) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Erro ao carregar o estoque.',
                          style: TextStyle(color: kRed, fontSize: 13.5)),
                      const SizedBox(height: 8),
                      Text('$e', textAlign: TextAlign.center,
                          style: const TextStyle(color: kMuted, fontSize: 11.5)),
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

class _EpiCard extends StatelessWidget {
  const _EpiCard({required this.epi});

  final EpiItem epi;

  @override
  Widget build(BuildContext context) {
    // Agrupa por cor para exibir "Capacete Branco: P 20 | M 58 | G 40"
    final byColor = <String, List<EpiVariant>>{};
    for (final v in epi.variants) {
      byColor.putIfAbsent(v.color, () => []).add(v);
    }

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: kGreen.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: kGreen.withValues(alpha: 0.25)),
                ),
                child: const Icon(Icons.health_and_safety_outlined, color: kGreen, size: 19),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(epi.name,
                        style: const TextStyle(color: kText, fontSize: 14.5, fontWeight: FontWeight.w700)),
                    Text('${epi.totalQuantity} unidade(s) no total',
                        style: const TextStyle(color: kMuted, fontSize: 11.5)),
                  ],
                ),
              ),
              if (epi.totalQuantity == 0)
                const StatusChip(label: 'ESGOTADO', color: kRed),
            ],
          ),
          if (byColor.isNotEmpty) ...[
            const SizedBox(height: 12),
            ...byColor.entries.map((entry) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 90,
                        child: Text(
                          entry.key.isEmpty ? 'Padrão' : entry.key,
                          style: const TextStyle(
                              color: kSub, fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ),
                      Expanded(
                        child: Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: entry.value.map((v) {
                            final zero = v.quantity == 0;
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: zero
                                    ? kRed.withValues(alpha: 0.07)
                                    : Colors.white.withValues(alpha: 0.04),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: zero
                                      ? kRed.withValues(alpha: 0.25)
                                      : Colors.white.withValues(alpha: 0.08),
                                ),
                              ),
                              child: Text(
                                '${v.size.isEmpty ? 'Único' : v.size}  ${v.quantity}',
                                style: TextStyle(
                                  fontFamily: 'monospace',
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w700,
                                  color: zero ? kRed : kText,
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                  ),
                )),
          ] else
            const Padding(
              padding: EdgeInsets.only(top: 10),
              child: Text('Sem variações cadastradas.',
                  style: TextStyle(color: kMuted, fontSize: 12)),
            ),
        ],
      ),
    );
  }
}
