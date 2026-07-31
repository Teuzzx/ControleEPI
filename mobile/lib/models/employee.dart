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
        id: (m['id'] as num).toInt(),
        name: m['name'] as String? ?? '',
        cpf: m['cpf'] as String? ?? '',
        registration: m['registration'] as String? ?? '',
        role: m['role'] as String? ?? '',
        status: m['status'] as String? ?? 'Ativo',
      );
}
