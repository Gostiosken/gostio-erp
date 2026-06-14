import { formatMoneda as formatMonedaBase } from "@/lib/format-moneda";
import type { TipoIvaParaguay } from "@/lib/types/factura-ticket";
import type { TicketFacturaData } from "@/lib/types/factura-ticket";

export type TipoVenta = "Contado" | "Credito";

export type TipoComprobanteVenta = "Factura" | "Boleta";

export interface LoteDisponible {
  iddetalle_ingreso: number;
  idarticulo: number;
  nombreArticulo: string;
  codigo: string;
  serie: string | null;
  descripcion: string | null;
  stock_actual: number;
  precio_ventapublico: number;
  tipo_iva: TipoIvaParaguay;
}

export interface DetalleVentaInput {
  iddetalle_ingreso: number;
  cantidad: number;
  precio_venta: number;
  descuento?: number;
  tipo_iva?: TipoIvaParaguay;
}

export interface VentaCabeceraInput {
  idcliente: number;
  idusuario: number;
  idsucursal: number;
  tipo_venta: TipoVenta;
  tipo_comprobante: TipoComprobanteVenta;
  serie_comprobante: string;
  num_comprobante: string;
  fecha: string;
  porcentaje_impuesto: number;
}

export interface CreateVentaInput {
  cabecera: VentaCabeceraInput;
  detalles: DetalleVentaInput[];
}

export interface CorrelativoComprobante {
  serie: string;
  numero: string;
  siguienteNumero: string;
  num_factura?: string;
}

export interface DetallePedidoVenta {
  iddetalle_pedido: number;
  iddetalle_ingreso: number;
  cantidad: number;
  precio_venta: number;
  descuento: number | null;
  tipo_iva: TipoIvaParaguay;
  nombreArticulo?: string;
}

export interface VentaRegistro {
  idventa: number;
  idpedido: number;
  idcliente: number;
  idusuario: number;
  idsucursal: number;
  idtimbrado?: number | null;
  tipo_venta: TipoVenta;
  tipo_comprobante: string;
  serie_comprobante: string;
  num_comprobante: string;
  num_factura?: string | null;
  fecha: string;
  impuesto: number;
  total: number;
  estado: string;
  cliente?: {
    idpersona: number;
    nombre: string;
    tipo_documento?: string;
    num_documento?: string;
  };
  detalles?: DetallePedidoVenta[];
  ticket?: TicketFacturaData;
}

export const TIPOS_VENTA: TipoVenta[] = ["Contado", "Credito"];

export const TIPOS_COMPROBANTE_VENTA: TipoComprobanteVenta[] = [
  "Factura",
  "Boleta",
];

export function calcularTotalesVenta(
  detalles: DetalleVentaInput[],
  porcentajeImpuesto: number
): {
  subtotalBruto: number;
  descuentoTotal: number;
  subtotalNeto: number;
  impuesto: number;
  total: number;
} {
  const subtotalBruto = detalles.reduce(
    (acc, item) => acc + item.cantidad * item.precio_venta,
    0
  );
  const descuentoTotal = detalles.reduce(
    (acc, item) => acc + (item.descuento ?? 0),
    0
  );
  const subtotalNeto = Number((subtotalBruto - descuentoTotal).toFixed(2));
  const impuesto = Number(
    ((subtotalNeto * porcentajeImpuesto) / 100).toFixed(2)
  );
  const total = Number((subtotalNeto + impuesto).toFixed(2));

  return {
    subtotalBruto: Number(subtotalBruto.toFixed(2)),
    descuentoTotal: Number(descuentoTotal.toFixed(2)),
    subtotalNeto,
    impuesto,
    total,
  };
}

export function formatMonedaVenta(valor: number): string {
  return formatMonedaBase(valor);
}

export function getTipoDocumentoId(tipo: TipoComprobanteVenta): number {
  return tipo === "Factura" ? 1 : 2;
}

export function incrementarNumeroComprobante(numero: string): string {
  const parsed = Number.parseInt(numero, 10);
  const siguiente = Number.isNaN(parsed) ? 1 : parsed + 1;
  return String(siguiente).padStart(numero.length, "0");
}
