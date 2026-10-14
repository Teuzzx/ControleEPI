import 'parsing.dart';

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
        epiId: asInt(m['epi_id']),
        epiName: asString(m['epi_name']),
        color: asString(m['color']),
        size: asString(m['size']),
        quantity: asInt(m['quantity']),
        state: m['state'] == null ? 'Novo' : asString(m['state']),
        observation: asString(m['observation']),
      );
}