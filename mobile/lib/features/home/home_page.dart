import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/config.dart';
import '../../core/theme.dart';
import '../../core/update_service.dart';
import '../../providers.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  @override
  void initState() {
    super.initState();
    // Inicia o serviço de sincronização offline (escuta a conexão).
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(syncServiceProvider).init(ref);
      _checkForUpdate();
    });
  }

  Future<void> _checkForUpdate() async {
    final info = await UpdateService.check();
    if (info == null || !mounted) return;

    showDialog<void>(
      context: context,
      barrierDismissible: true,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: kCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.system_update_alt, color: kIndigo, size: 26),
            SizedBox(width: 10),
            Text('Nova atualização', style: TextStyle(color: kText, fontSize: 18)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Versão ${info.version} disponível.',
                style: const TextStyle(color: kText, fontSize: 14, fontWeight: FontWeight.w600)),
            if (info.notes.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(info.notes, style: const TextStyle(color: kSub, fontSize: 12.5)),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Agora não', style: TextStyle(color: kSub)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: kIndigo),
            onPressed: () async {
              Navigator.of(dialogContext).pop();
              await launchUrl(
                Uri.parse('${Config.appHomeUrl}${info.apkUrl}'),
                mode: LaunchMode.externalApplication,
              );
            },
            child: const Text('Atualizar', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionProvider);
    final movements = ref.watch(recentMovementsProvider);
    final sync = ref.watch(syncServiceProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Controle de EPI'),
        actions: [
          ValueListenableBuilder<int>(
            valueListenable: sync.pendingNotifier,
            builder: (_, pending, __) {
              if (pending > 0) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: StatusChip(
                      label: '$pending pendente${pending > 1 ? 's' : ''}',
                      color: kAmber,
                      icon: Icons.cloud_upload_outlined,
                    ),
                  );
              }
              return Padding(
                padding: const EdgeInsets.only(right: 12),
                child: StatusChip(label: 'Sincronizado', color: kGreen, icon: Icons.cloud_done_outlined),
              );
            },
          ),
          IconButton(
            tooltip: 'Sair',
            icon: const Icon(Icons.logout, color: kSub),
            onPressed: () => ref.read(sessionProvider.notifier).logout(),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Container(
                  width: 46,
                  height: 46,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: kIndigo.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Text(
                    (session?.name ?? '?').trim().isEmpty ? '?' : (session!.name.trim().substring(0, 1)).toUpperCase(),
                    style: const TextStyle(
                      color: kIndigo,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Olá, ${session?.name.split(' ').first ?? ''} 👋',
                        style: const TextStyle(color: kText, fontSize: 18, fontWeight: FontWeight.w800),
                      ),
                      const Text('Almoxarife', style: TextStyle(color: kSub, fontSize: 13)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            _ActionCard(
              icon: '📦',
              title: 'Dar Saída de EPI',
              subtitle: 'Entrega com foto e assinatura',
              color: kIndigo,
              onTap: () => context.push('/saida'),
            ),
            const SizedBox(height: 12),
            _ActionCard(
              icon: '↩️',
              title: 'Registrar Devolução',
              subtitle: 'Item devolvido volta ao estoque',
              color: kCyan,
              onTap: () => context.push('/devolucao'),
            ),
            const SizedBox(height: 12),
            _ActionCard(
              icon: '📊',
              title: 'Consultar Estoque',
              subtitle: 'Somente leitura',
              color: kGreen,
              onTap: () => context.push('/estoque'),
            ),
            const SizedBox(height: 28),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Últimas movimentações',
                    style: TextStyle(color: kText, fontSize: 14, fontWeight: FontWeight.w700)),
                const Text('tempo real', style: TextStyle(color: kMuted, fontSize: 11)),
              ],
            ),
            const SizedBox(height: 10),
            movements.when(
              data: (rows) {
                if (rows.isEmpty) {
                  return const AppCard(
                    child: Center(
                      child: Padding(
                        padding: EdgeInsets.all(20),
                        child: Text('Nenhuma movimentação ainda.',
                            style: TextStyle(color: kMuted, fontSize: 13)),
                      ),
                    ),
                  );
                }
                return AppCard(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Column(
                    children: rows.map((m) {
                      final type = m['type'] as String? ?? '';
                      final icon = switch (type) {
                        'Entrega' => Icons.inventory_2_outlined,
                        'Devolução' => Icons.replay,
                        'Entrada' => Icons.add_box_outlined,
                        'Distribuição' => Icons.local_shipping_outlined,
                        _ => Icons.swap_horiz,
                      };
                      final color = switch (type) {
                        'Entrega' => kIndigo,
                        'Devolução' => kCyan,
                        'Entrada' => kGreen,
                        'Distribuição' => kAmber,
                        _ => kSub,
                      };
                      final when = DateTime.tryParse(m['created_at'] as String? ?? '')?.toLocal();
                      return ListTile(
                        dense: true,
                        leading: Icon(icon, color: color, size: 22),
                        title: Text(
                          '${m['employee_name'] ?? '—'} • ${m['epi_name'] ?? ''}',
                          style: const TextStyle(color: kText, fontSize: 13.5, fontWeight: FontWeight.w600),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        subtitle: Text(
                          '${m['quantity']} un. ${when != null ? '• ${DateFormat("dd/MM HH:mm").format(when)}' : ''}',
                          style: const TextStyle(color: kMuted, fontSize: 11.5),
                        ),
                        trailing: StatusChip(label: type, color: color),
                      );
                    }).toList(),
                  ),
                );
              },
              loading: () => const AppCard(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Center(child: CircularProgressIndicator(strokeWidth: 2, color: kIndigo)),
                ),
              ),
              error: (e, _) => AppCard(
                child: Text('Não foi possível carregar movimentações.',
                    style: TextStyle(color: kMuted, fontSize: 13)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  final String icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.13),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: color.withValues(alpha: 0.3)),
            ),
            child: Text(icon, style: const TextStyle(fontSize: 24)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: kText, fontSize: 15, fontWeight: FontWeight.w700)),
                const SizedBox(height: 2),
                Text(subtitle, style: const TextStyle(color: kSub, fontSize: 12.5)),
              ],
            ),
          ),
          Icon(Icons.chevron_right, color: color),
        ],
      ),
    );
  }
}
