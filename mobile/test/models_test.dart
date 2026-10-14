import 'package:flutter_test/flutter_test.dart';

import 'package:epi_mobile/models/cart_item.dart';
import 'package:epi_mobile/models/employee.dart';
import 'package:epi_mobile/models/epi_item.dart';
import 'package:epi_mobile/models/session.dart';

/// Regressão das falhas do app do almoxarife.
///
/// [Employee.fromMap] e [CartItem.fromMap] são usados tanto no caminho
/// online quanto ao reidratar a fila offline (Hive). Um `null` vindo do
/// banco quebrava a tela inteira na hora de abrir, sem mensagem útil.
void main() {
  group('Employee.fromMap — colunas nullable do banco', () {
    test('normaliza campos textuais null para string vazia', () {
      final e = Employee.fromMap({
        'id': 1,
        'name': 'Carlos Mendes',
        'cpf': null,
        'registration': null,
        'role': null,
        'status': null,
      });

      expect(e.id, 1);
      expect(e.name, 'Carlos Mendes');
      expect(e.cpf, '');
      expect(e.registration, '');
      expect(e.role, '');
      expect(e.status, 'Ativo');
    });

    test('sobrevive a um registro com todos os campos textuais nulos', () {
      final e = Employee.fromMap({'id': 2, 'name': null});

      expect(e.name, '');
      expect(e.cpf, '');
      expect(e.registration, '');
      expect(e.role, '');
      // É este encadeamento (name/registration/cpf.toLowerCase()) que
      // estourava na tela de seleção de colaborador.
      expect(e.name.toLowerCase(), '');
      expect(e.registration.toLowerCase(), '');
      expect(e.cpf.toLowerCase(), '');
    });

    test('aceita id vindo como string (bigint do PostgREST)', () {
      final e = Employee.fromMap({'id': '42', 'name': 'Ana'});
      expect(e.id, 42);
    });
  });

  group('Employee.matches — busca do seletor de colaboradores', () {
    Employee employee() => Employee.fromMap({
          'id': 1,
          'name': 'Carlos Eduardo Mendes',
          'cpf': '423.891.670-09',
          'registration': 'MAT-00124',
          'role': 'Operador',
        });

    test('busca por nome', () {
      expect(employee().matches('carlos'), isTrue);
      expect(employee().matches('EDUARDO'), isTrue);
      expect(employee().matches('marcelo'), isFalse);
    });

    test('busca por matrícula', () {
      expect(employee().matches('MAT-00124'), isTrue);
      expect(employee().matches('mat-00124'), isTrue);
      expect(employee().matches('MAT-00999'), isFalse);
    });

    test('busca por CPF aceita com e sem pontuação', () {
      expect(employee().matches('423.891.670-09'), isTrue);
      expect(employee().matches('42389167009'), isTrue);
      expect(employee().matches('891670'), isTrue);
    });

    test('query vazia devolve todos', () {
      expect(employee().matches(''), isTrue);
      // Só espaços É uma query vazia. A busca faz trim antes de comparar,
      // então devolver false aqui faria o almoxarife digitar um espaço e a
      // lista inteira sumir com "Nenhum colaborador encontrado".
      expect(employee().matches('   '), isTrue);
      expect(employee().matches('\t\n '), isTrue);
    });

    test('registro sem CPF/matrícula não quebra a busca', () {
      final vazio = Employee.fromMap({'id': 9, 'name': 'Sem Cadastro'});
      expect(vazio.matches('sem'), isTrue);
      expect(vazio.matches('111'), isFalse);
    });
  });

  group('EpiItem — estoque disponível para saída', () {
    test('availableQuantity ignora variações esgotadas', () {
      final item = EpiItem.fromMap({'id': 1, 'name': 'Capacete'}, [
        EpiVariant.fromMap(
            {'id': 1, 'epi_id': 1, 'color': 'Branco', 'size': 'M', 'quantity': 10}),
        EpiVariant.fromMap(
            {'id': 2, 'epi_id': 1, 'color': 'Preto', 'size': 'G', 'quantity': 0}),
      ]);

      // A tela exibia 10 (soma tudo) mas só havia 10 REALMENTE
      // disponíveis — e 0 quando todas estavam zeradas.
      expect(item.totalQuantity, 10);
      expect(item.availableQuantity, 10);
      expect(item.availableVariants.length, 1);
    });

    test('EPI totalmente esgotado tem availableQuantity zero', () {
      final item = EpiItem.fromMap({'id': 2, 'name': 'Luva'}, [
        EpiVariant.fromMap(
            {'id': 3, 'epi_id': 2, 'color': '', 'size': 'M', 'quantity': 0}),
      ]);

      expect(item.totalQuantity, 0);
      expect(item.availableQuantity, 0);
      expect(item.availableVariants, isEmpty);
    });
  });

  group('CartItem.fromMap — reidratação da fila offline', () {
    test('normaliza campos ausentes', () {
      final c = CartItem.fromMap({'epi_id': 7, 'epi_name': 'Capacete'});

      expect(c.epiId, 7);
      expect(c.epiName, 'Capacete');
      expect(c.color, '');
      expect(c.size, '');
      expect(c.state, 'Novo');
      expect(c.observation, '');
      expect(c.variantLabel, '');
    });
  });

  group('AppSession.fromMap', () {
    test('lê company_id null (usuário da matriz)', () {
      final s = AppSession.fromMap({
        'id': 1,
        'name': 'Admin',
        'email': 'a@b.com',
        'role': 'matriz',
        'company_id': null,
        'token': 't',
        'expires_at': 99999999999999,
      });

      expect(s.companyId, isNull);
      expect(s.hasCompany, isFalse);
      expect(s.canUseMobile, isTrue);
    });

    test('login exclusivo da web não pode usar o app', () {
      final s = AppSession.fromMap({
        'id': 2,
        'name': 'Web',
        'email': 'w@b.com',
        'role': 'matriz',
        'company_id': null,
        'token': 't',
        'expires_at': 99999999999999,
        'access': 'web',
      });

      expect(s.canUseMobile, isFalse);
    });

    test('sessão expirada é detectada', () {
      final s = AppSession.fromMap({
        'id': 3,
        'name': 'X',
        'email': 'x@b.com',
        'role': 'matriz',
        'company_id': null,
        'token': 't',
        'expires_at': 1,
      });

      expect(s.isExpired, isTrue);
    });
  });
}