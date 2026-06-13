import { formatMoneda as formatMonedaBase } from "@/lib/format-moneda";

export interface Credito {
  idcredito: number;
  idventa: number;
  fecha: string;
  total_pago: number;
}

export interface CreditoInput {
  idventa: number;
  fecha?: string;
  total_pago: number;
}

export interface VentaPendienteCobro {
  idventa: number;
  fecha: string;
  idcliente: number;
  clienteNombre: string;
  tipo_comprobante: string;
  serie_comprobante: string;
  num_comprobante: string;
  comprobante: string;
  totalVenta: number;
  totalPagado: number;
  saldoPendiente: number;
}

export function calcularSaldoPendiente(
  totalVenta: number,
  totalPagado: number
): number {
  return Number(Math.max(0, totalVenta - totalPagado).toFixed(2));
}

export function formatComprobante(
  serie: string,
  numero: string
): string {
  return `${serie}-${numero}`;
}

export function formatMonedaCredito(valor: number): string {
  return formatMonedaBase(valor);
}
