/**
 * Normalizadores banco → app.
 *
 * As tabelas do Postgres declaram colunas textuais como `TEXT DEFAULT ''`
 * **sem `NOT NULL`**, então qualquer linha pode devolver `null` (coluna
 * nunca preenchida, insert antigo, seed parcial). As interfaces em
 * `data/mock.ts`, porém, declaram esses campos como `string` obrigatório.
 *
 * Sem esta camada, o `null` vazava para a UI e quebrava em runtime —
 * por exemplo `employee.registration.toLowerCase()` na busca de
 * colaboradores quebrava a página inteira com
 * "Cannot read properties of null (reading 'toLowerCase')".
 *
 * A regra é simples: normalizar **na fronteira** (logo após a query) para
 * que nenhuma tela precise conhecer a nulabilidade do banco.
 */

/** `null`/`undefined` → `""`; qualquer outro valor → `String(valor)`. */
export function str(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

/**
 * Converte para número finito. PostgreSQL retorna `bigint`/`numeric` como
 * string no PostgREST em alguns drivers, então `Number()` é necessário.
 * Valores ausentes ou não numéricos caem no `fallback`.
 */
export function num(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Garante que a resposta do PostgREST é uma lista (nunca `null`). */
export function rows<T>(data: T[] | null | undefined): T[] {
  return Array.isArray(data) ? data : [];
}

/**
 * Remove pontuação de documentos (CPF/CNPJ) e espaços para busca.
 * `000.000.000-00` e `00000000000` passam a casar entre si.
 */
export function onlyDigits(value: unknown): string {
  return str(value).replace(/\D/g, "");
}

/** Busca textual tolerante a `null` em qualquer campo do registro. */
export function matches(haystack: unknown, needle: string): boolean {
  if (!needle) return true;
  return str(haystack).toLowerCase().includes(needle);
}