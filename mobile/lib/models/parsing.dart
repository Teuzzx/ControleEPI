/// Coerções seguras para desserialização de dados vindos do Postgres/PostgREST.
///
/// As colunas do banco são `bigint`/`numeric` sem `NOT NULL`. O driver pode
/// devolver `null` (coluna vazia) ou o número como `String` (numeric /
/// bigserial em alguns formatos de resposta). Um cast direto
/// (`m['id'] as num`) estourava `type 'String' is not a subtype of type
/// 'num'` e derrubava a tela — inclusive ao reidratar a fila offline.
library;

/// Converte para `int`, aceitando numérico ou string numérica.
int asInt(Object? value, {int fallback = 0}) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value.trim()) ?? fallback;
  return fallback;
}

/// Converte para string, normalizando `null`/`undefined` para `''`.
String asString(Object? value) {
  if (value == null) return '';
  if (value is String) return value;
  return value.toString();
}