/// Item do carrinho de saída/devolução.
class CartItem {
  final int epiId;
  final String epiName;
  final String color;
  final String size;
  final int quantity;
  final String state; // Novo | Usado | Danificado
  final String observation;

  const CartItem({
    required this.epiId,
    required this.epiName,
    required this.color,
    required this.size,
    required this.quantity,
    this.state = 'Novo',
    this.observation = '',
  });

  String get variantLabel => [size, color].where((s) => s.isNotEmpty).join(' ');

  Map<String, dynamic> toMap() => {
        'epi_id': epiId,
        'epi_name': epiName,
        'color': color,
        'size': size,
        'quantity': quantity,
        'state': state,
        'observation': observation,
      };

  factory CartItem.fromMap(Map<String, dynamic> m) => CartItem(
        epiId: (m['epi_id'] as num).toInt(),
        epiName: m['epi_name'] as String? ?? '',
        color: m['color'] as String? ?? '',
        size: m['size'] as String? ?? '',
        quantity: (m['quantity'] as num).toInt(),
        state: m['state'] as String? ?? 'Novo',
        observation: m['observation'] as String? ?? '',
      );
}
