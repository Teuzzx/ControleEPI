import 'parsing.dart';

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
        id: asInt(m['id']),
        epiId: asInt(m['epi_id']),
        color: asString(m['color']),
        size: asString(m['size']),
        quantity: asInt(m['quantity']),
      );
}

class EpiItem {
  final int id;
  final String name;
  final List<EpiVariant> variants;

  const EpiItem({required this.id, required this.name, required this.variants});

  /// Soma de todas as variações.
  int get totalQuantity => variants.fold(0, (s, v) => s + v.quantity);

  /// Apenas as variações com estoque — é o que a saída de EPI pode usar.
  List<EpiVariant> get availableVariants =>
      variants.where((v) => v.quantity > 0).toList();

  /// Total do que realmente pode ser entregue (ignora variações zeradas).
  ///
  /// A tela de escolha de EPI exibia [totalQuantity], que soma também as
  /// variações esgotadas: o almoxarife via "40 disponíveis", tocava e
  /// recebia "Este EPI não tem variações com estoque".
  int get availableQuantity =>
      availableVariants.fold(0, (s, v) => s + v.quantity);

  factory EpiItem.fromMap(Map<String, dynamic> m, List<EpiVariant> allVariants) =>
      EpiItem(
        id: asInt(m['id']),
        name: asString(m['name']),
        variants: allVariants.where((v) => v.epiId == asInt(m['id'])).toList(),
      );
}