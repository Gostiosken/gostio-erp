/**
 * Indica si el ERP debe operar contra PostgreSQL (DATABASE_URL configurada).
 * Sin URL, las Server Actions usan datos mock en memoria.
 */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
