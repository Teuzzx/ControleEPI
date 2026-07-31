import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/config.dart';
import '../../core/theme.dart';
import '../../core/update_service.dart';
import '../../providers.dart';
import '../../repositories/data_repo.dart';

const _typeIcons = {
  'distribuicao': '📦',
  'info': 'ℹ️',
  'alerta': '⚠️',
  'aviso': '📢',
};

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

  Future<void> _showNotifications() async {
    final client = ref.read(dataClientProvider);
    if (client == null) return;

    final notifications = await ref.read(notificationsProvider.future);
    final unreadCount = notifications.where((n) => n['read'] != true).length;

    if (!mounted) return;

    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (sheetContext) {
        return Consumer(
          builder: (context, ref, _) {
            final items = ref.watch(notificationsProvider).valueOrNull ?? notifications;
            return Container(
              decoration: const BoxDecoration(
                color: kCard,
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(sheetContext).size.height * 0.75,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(height: 10),
                  Container(
                    width: 42,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.white24,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 14, 12, 8),
                    child: Row(
                      children: [
                        const Text(
                          'Notificações',
                          style: TextStyle(
                            color: kText,
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const Spacer(),
                        if (unreadCount > 0)
                          TextButton(
                            onPressed: () async {
                              await DataRepo.markAllNotificationsRead(client);
                              ref.invalidate(notificationsProvider);
                            },
                            child: const Text(
                              'Marcar todas',
                              style: TextStyle(color: kIndigo, fontSize: 12.5),
                            ),
                          ),
                        IconButton(
                          icon: const Icon(Icons.close, color: kSub, size: 20),
                          onPressed: () => Navigator.of(sheetContext).pop(),
                        ),
                      ],
                    ),
                  ),
                  Flexible(
                    child: items.isEmpty
                        ? const Padding(
                            padding: EdgeInsets.all(32),
                            child: Text(
                              'Nenhuma notificação.',
                              style: TextStyle(color: kMuted, fontSize: 13),
                            ),
                          )
                        : ListView.separated(
                            shrinkWrap: true,
                            padding: const EdgeInsets.fromLTRB(14, 4, 14, 24),
                            itemCount: items.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 6),
                            itemBuilder: (context, i) {
                              final n = items[i];
                              final id = (n['id'] as num?)?.toInt() ?? 0;
                              final read = n['read'] == true;
                              return Material(
                                color: read ? Colors.transparent : kIndigo.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(12),
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(12),
                                  onTap: read
                                      ? null
                                      : () async {
                                          await DataRepo.markNotificationRead(client, id);
                                          ref.invalidate(notificationsProvider);
                                        },
                                  child: Container(
                                    padding: const EdgeInsets.all(14),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: read
                                            ? Colors.white.withValues(alpha: 0.06)
                                            : kIndigo.withValues(alpha: 0.3),
                                      ),
                                    ),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          _typeIcons[n['type'] as String?] ?? '📌',
                                          style: const TextStyle(fontSize: 16),
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                children: [
                                                  Expanded(
                                                    child: Text(
                                                      n['title'] as String? ?? '',
                                                      style: TextStyle(
                                                        color: read ? kSub : kText,
                                                        fontSize: 13,
                                                        fontWeight: FontWeight.w700,
                                                      ),
                                                      maxLines: 2,
                                                      overflow: TextOverflow.ellipsis,
                                                    ),
                                                  ),
                                                  if (!read)
                                                    Container(
                                                      width: 7,
                                                      height: 7,
                                                      margin: const EdgeInsets.only(left: 8),
                                                      decoration: const BoxDecoration(
                                                        color: kIndigo,
                                                        shape: BoxShape.circle,
                                                        boxShadow: [
                                                          BoxShadow(
                                                            color: kIndigo,
                                                            blurRadius: 6,
                                                          ),
                                                        ],
                                                      ),
                                                    ),
                                                ],
                                              ),
                                              const SizedBox(height: 3),
                                              Text(
                                                n['message'] as String? ?? '',
                                                style: const TextStyle(color: kSub, fontSize: 12),
                                              ),
                                              const SizedBox(height: 5),
                                              Text(
                                                _formatNotifDate(n['created_at'] as String?),
                                                style: const TextStyle(
                                                  color: kMuted,
                                                  fontSize: 10.5,
                                                  fontFamily: 'monospace',
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  String _formatNotifDate(String? iso) {
    final d = DateTime.tryParse(iso ?? '')?.toLocal();
    if (d == null) return '';
    return DateFormat('dd/MM/yyyy HH:mm').format(d);
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
    ref.watch(notificationsRealtimeProvider);
    final unread = ref
            .watch(notificationsProvider)
            .valueOrNull
            ?.where((n) => n['read'] != true)
            .length ??
        0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Controle de EPI'),
        actions: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              IconButton(
                tooltip: 'Notificações',
                icon: const Icon(Icons.notifications_none, color: kSub),
                onPressed: _showNotifications,
              ),
              if (unread > 0)
                Positioned(
                  right: 6,
                  top: 6,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5),
                    height: 16,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF43F5E),
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: const [
                        BoxShadow(color: Color(0xFFF43F5E), blurRadius: 6),
                      ],
                    ),
                    child: Text(
                      unread > 9 ? '9+' : '$unread',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
            ],
          ),
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
