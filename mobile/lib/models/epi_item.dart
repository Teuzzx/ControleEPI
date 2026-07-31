class EpiVariant {
  final int id;
  final int epiId;
  final String color;
  final String size;
  final int quantity;

  const EpiVariant({
    required this.id,
    required this.epiId,
    required this.color,
    required this.size,
    required this.quantity,
  });

  String get label => [size, color].where((s) => s.isNotEmpty).join(' ');

  factory EpiVariant.fromMap(Map<String, dynamic> m) => EpiVariant(
        id: (m['id'] as num).toInt(),
        epiId: (m['epi_id'] as num).toInt(),
        color: m['color'] as String? ?? '',
        size: m['size'] as String? ?? '',
        quantity: (m['quantity'] as num?)?.toInt() ?? 0,
      );
}

class EpiItem {
  final int id;
  final String name;
  final List<EpiVariant> variants;

  const EpiItem({required this.id, required this.name, required this.variants});

  int get totalQuantity => variants.fold(0, (s, v) => s + v.quantity);

  List<EpiVariant> get availableVariants =>
      variants.where((v) => v.quantity > 0).toList();

  factory EpiItem.fromMap(Map<String, dynamic> m, List<EpiVariant> allVariants) =>
      EpiItem(
        id: (m['id'] as num).toInt(),
        name: m['name'] as String? ?? '',
        variants: allVariants.where((v) => v.epiId == (m['id'] as num).toInt()).toList(),
      );
}
