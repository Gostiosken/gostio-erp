export const SIMBOLO_MONEDA = "Gs.";

/** Formato guaraníes (Paraguay): sin decimales, separador local es-PY. */
export function formatMoneda(valor: number): string {
  const entero = Math.round(valor);
  const numero = entero.toLocaleString("es-PY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${SIMBOLO_MONEDA} ${numero}`;
}
