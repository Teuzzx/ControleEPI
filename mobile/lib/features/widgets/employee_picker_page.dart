import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme.dart';
import '../../providers.dart';

/// Seleção de colaborador — retorna via Navigator.pop(context, employee).
class EmployeePickerPage extends ConsumerStatefulWidget {
  const EmployeePickerPage({super.key});

  @override
  ConsumerState<EmployeePickerPage> createState() => _EmployeePickerPageState();
}

class _EmployeePickerPageState extends ConsumerState<EmployeePickerPage> {
  final _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    ref.invalidate(employeesProvider);
    await ref.read(employeesProvider.future);
  }

  @override
  Widget build(BuildContext context) {
    final employees = ref.watch(employeesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Selecionar Colaborador')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
            child: TextField(
              controller: _searchCtrl,
              onChanged: (v) => setState(() => _query = v.toLowerCase()),
              decoration: const InputDecoration(
                hintText: 'Buscar por nome, matrícula ou CPF...',
                prefixIcon: Icon(Icons.search, color: kMuted, size: 20),
              ),
            ),
          ),
          Expanded(
            child: employees.when(
              data: (list) {
                final filtered = list.where((e) => e.matches(_query)).toList();

                if (filtered.isEmpty) {
                  return EmptyRetry(
                    message: 'Nenhum colaborador encontrado.',
                    onRefresh: _refresh,
                  );
                }

                return RefreshIndicator(
                  color: kIndigo,
                  onRefresh: _refresh,
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final e = filtered[i];
                      return AppCard(
                        onTap: () => Navigator.pop(context, e),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        child: Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: kIndigo.withValues(alpha: 0.14),
                                borderRadius: BorderRadius.circular(11),
                              ),
                              child: Text(
                                _initials(e.name),
                                style: const TextStyle(
                                    color: kIndigo, fontWeight: FontWeight.w800, fontSize: 13),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    e.name,
                                    style: const TextStyle(
                                        color: kText, fontSize: 14, fontWeight: FontWeight.w600),
                                  ),
                                  Text(
                                    [e.role, e.registration, e.cpf]
                                        .where((s) => s.isNotEmpty)
                                        .join(' • '),
                                    style: const TextStyle(color: kMuted, fontSize: 11.5),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            const Icon(Icons.chevron_right, color: kIndigo),
                          ],
                        ),
                      );
                    },
                  ),
                );
              },
              loading: () => const Center(
                child: CircularProgressIndicator(strokeWidth: 2, color: kIndigo),
              ),
              error: (e, _) => ErrorRetry(
                message: friendlyDataError(e),
                onRetry: () => ref.invalidate(employeesProvider),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Iniciais para o avatar. Antes, um nome vazio/vazio-espaços gerava
  /// `p[0]` de uma string vazia e quebrava o layout do avatar.
  String _initials(String name) {
    final parts =
        name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    return parts.take(2).map((p) => p[0].toUpperCase()).join();
  }
}