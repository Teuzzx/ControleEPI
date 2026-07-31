import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:epi_mobile/core/theme.dart';

void main() {
  test('tema é criado com fundo escuro e cor primária', () {
    final theme = buildAppTheme();
    expect(theme.scaffoldBackgroundColor, kBg);
    expect(theme.colorScheme.primary, kIndigo);
  });

  testWidgets('StatusChip renderiza o rótulo', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: StatusChip(label: 'Ativo', color: kGreen)),
      ),
    );
    expect(find.text('Ativo'), findsOneWidget);
  });
}
