import 'parsing.dart';

class Employee {
  final int id;
  final String name;
  final String cpf;
  final String registration;
  final String role;
  final String status;

  const Employee({
    required this.id,
    required this.name,
    required this.cpf,
    required this.registration,
    required this.role,
    required this.status,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'cpf': cpf,
        'registration': registration,
        'role': role,
        'status': status,
      };

  factory Employee.fromMap(Map<String, dynamic> m) => Employee(
        id: asInt(m['id']),
        name: asString(m['name']),
        cpf: asString(m['cpf']),
        registration: asString(m['registration']),
        role: asString(m['role']),
        status: m['status'] == null ? 'Ativo' : asString(m['status']),
      );

  /// Remove a pontuação para a busca por CPF casar com o que o
  /// almoxarife digita (`423.891.670-09` vs `42389167009`).
  String get cpfDigits => cpf.replaceAll(RegExp(r'\D'), '');

  /// Critério de comparação da busca por nome/matrícula/CPF.
  bool matches(String query) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return true;
    final digits = q.replaceAll(RegExp(r'\D'), '');
    if (digits.isNotEmpty && digits.length >= 3 && cpfDigits.contains(digits)) {
      return true;
    }
    return name.toLowerCase().contains(q) ||
        registration.toLowerCase().contains(q) ||
        cpf.toLowerCase().contains(q);
  }
}