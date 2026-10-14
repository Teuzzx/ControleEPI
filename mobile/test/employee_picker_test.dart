import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:epi_mobile/features/widgets/employee_picker_page.dart';
import 'package:epi_mobile/models/employee.dart';
import 'package:epi_mobile/providers.dart';

/// Regressão do bug reportado: "erro quando eu vou selecionar os
/// colaboradores".
///
/// A tela abria com a exceção crua do Supabase e — quando o colaborador
/// vinha com coluna nullable — o `registration/cpf.toLowerCase()` da busca
/// derrubava a lista inteira.
const _fakeEmployees = <Employee>[
  Employee(
    id: 1,
    name: 'Carlos Eduardo Mendes',
    cpf: '423.891.670-09',
    registration: 'MAT-00124',
    role: 'Operador de Máquinas',
    status: 'Ativo',
  ),
  Employee(
    id: 2,
    name: 'Juliana Ferreira Costa',
    cpf: '518.234.790-51',
    registration: 'MAT-00127',
    role: 'Técnico de Segurança',
    status: 'Ativo',
  ),
];

/// Collaboradores com todas as colunas textuais vazias — o payload que
/// derrubava a busca.
const _nullEmployees = <Employee>[
  Employee(
    id: 3,
    name: 'Colaborador Sem Cadastro',
    cpf: '',
    registration: '',
    role: '',
    status: 'Ativo',
  ),
];

Widget _wrap({
  required List<Employee> employees,
}) {
  return ProviderScope(
    overrides: [
      employeesProvider.overrideWith((ref) async => employees),
      dataClientProvider.overrideWithValue(null),
    ],
    child: const MaterialApp(home: EmployeePickerPage()),
  );
}

void main() {
  testWidgets('lista os colaboradores e devolve o escolhido no pop',
      (tester) async {
    Employee? returned;

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          employeesProvider.overrideWith((ref) async => _fakeEmployees),
          dataClientProvider.overrideWithValue(null),
        ],
        child: MaterialApp(
          home: Builder(
            builder: (context) => ElevatedButton(
              onPressed: () async {
                returned = await Navigator.push<Employee>(
                  context,
                  MaterialPageRoute(builder: (_) => const EmployeePickerPage()),
                );
              },
              child: const Text('abrir'),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('abrir'));
    await tester.pumpAndSettle();

    expect(find.text('Carlos Eduardo Mendes'), findsOneWidget);
    expect(find.text('Juliana Ferreira Costa'), findsOneWidget);

    await tester.tap(find.text('Carlos Eduardo Mendes'));
    await tester.pumpAndSettle();

    expect(returned, isNotNull);
    expect(returned!.id, 1);
    expect(returned!.registration, 'MAT-00124');
  });

  testWidgets('a busca filtra por nome, matrícula e CPF sem quebrar',
      (tester) async {
    await tester.pumpWidget(_wrap(employees: _fakeEmployees));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'juliana');
    await tester.pump();
    expect(find.text('Juliana Ferreira Costa'), findsOneWidget);
    expect(find.text('Carlos Eduardo Mendes'), findsNothing);

    // busca por CPF com e sem pontuação
    await tester.enterText(find.byType(TextField), '518');
    await tester.pump();
    expect(find.text('Juliana Ferreira Costa'), findsOneWidget);

    await tester.enterText(find.byType(TextField), '518.234.790-51');
    await tester.pump();
    expect(find.text('Juliana Ferreira Costa'), findsOneWidget);

    // busca por matrícula
    await tester.enterText(find.byType(TextField), 'MAT-00124');
    await tester.pump();
    expect(find.text('Carlos Eduardo Mendes'), findsOneWidget);
  });

  testWidgets('colaborador com matrícula e CPF vazios não quebra a busca',
      (tester) async {
    await tester.pumpWidget(_wrap(employees: _nullEmployees));
    await tester.pumpAndSettle();

    expect(find.text('Colaborador Sem Cadastro'), findsOneWidget);

    // antes: registration.toLowerCase() sobre vazio era ok, mas o
    // avatar quebrava com nome vazio; agora ambos são seguros.
    await tester.enterText(find.byType(TextField), 'sem');
    await tester.pump();
    expect(find.text('Colaborador Sem Cadastro'), findsOneWidget);
  });

  testWidgets('busca sem resultado mostra estado vazio', (tester) async {
    await tester.pumpWidget(_wrap(employees: _fakeEmployees));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'zzzz');
    await tester.pumpAndSettle();

    expect(find.text('Nenhum colaborador encontrado.'), findsOneWidget);
  });

  testWidgets('erro de carregamento mostra mensagem amigável e botão de retry',
      (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          employeesProvider.overrideWith(
            (ref) async => throw Exception(
                'column employees.registration does not exist (PGRST203)'),
          ),
          dataClientProvider.overrideWithValue(null),
        ],
        child: const MaterialApp(home: EmployeePickerPage()),
      ),
    );
    await tester.pumpAndSettle();

    // Não pode vazar o erro técnico do banco para o almoxarife.
    expect(find.textContaining('PGRST203'), findsNothing);
    expect(find.text('Tentar novamente'), findsOneWidget);
  });
}