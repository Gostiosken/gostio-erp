import { formatMoneda } from "@/lib/format-moneda";

export type TipoIvaParaguay = "10" | "5" | "EXENTA";

export interface DetalleTicketItem {
  nombre: string;
  cantidad: number;
  precio_venta: number;
  descuento?: number;
  tipo_iva: TipoIvaParaguay;
}

export interface LiquidacionIvaParaguay {
  gravada10: number;
  iva10: number;
  gravada5: number;
  iva5: number;
  exenta: number;
  totalIva: number;
  totalGeneral: number;
}

export interface DatosEmisorTicket {
  razon_social: string;
  ruc_emisor: string;
  direccion: string;
  numero_timbrado: string;
  fecha_vencimiento_timbrado: string;
  establecimiento: string;
  punto_expedicion: string;
}

export interface DatosClienteTicket {
  nombre: string;
  tipo_documento: string;
  num_documento: string;
}

export interface TicketFacturaData {
  num_factura: string;
  tipo_comprobante: string;
  fecha: string;
  emisor: DatosEmisorTicket;
  cliente: DatosClienteTicket;
  items: DetalleTicketItem[];
  liquidacion: LiquidacionIvaParaguay;
}

export function normalizarTipoIva(valor: string | null | undefined): TipoIvaParaguay {
  const upper = (valor ?? "10").toUpperCase();
  if (upper === "5") return "5";
  if (upper === "EXENTA" || upper === "EXENTO") return "EXENTA";
  return "10";
}

export function getEtiquetaTipoIva(tipo: TipoIvaParaguay): string {
  if (tipo === "EXENTA") return "Exenta";
  return `${tipo}%`;
}

export function formatNumeroFactura(
  establecimiento: string,
  puntoExpedicion: string,
  secuencial: number
): string {
  const est = establecimiento.padStart(3, "0").slice(-3);
  const punto = puntoExpedicion.padStart(3, "0").slice(-3);
  const seq = String(secuencial).padStart(7, "0");
  return `${est}-${punto}-${seq}`;
}

export function formatGsEntero(valor: number): string {
  return formatMoneda(Math.round(valor));
}

export function calcularLiquidacionIvaParaguay(
  detalles: DetalleTicketItem[]
): LiquidacionIvaParaguay {
  let gravada10 = 0;
  let iva10 = 0;
  let gravada5 = 0;
  let iva5 = 0;
  let exenta = 0;

  for (const detalle of detalles) {
    const subtotal =
      detalle.cantidad * detalle.precio_venta - (detalle.descuento ?? 0);
    const base = Math.round(subtotal);

    if (detalle.tipo_iva === "EXENTA") {
      exenta += base;
      continue;
    }

    if (detalle.tipo_iva === "5") {
      gravada5 += base;
      iva5 += Math.round(base * 0.05);
      continue;
    }

    gravada10 += base;
    iva10 += Math.round(base * 0.1);
  }

  const totalIva = iva10 + iva5;
  const totalGeneral = gravada10 + gravada5 + exenta + totalIva;

  return {
    gravada10,
    iva10,
    gravada5,
    iva5,
    exenta,
    totalIva,
    totalGeneral,
  };
}

export function calcularTotalesVentaMultiIva(
  detalles: Array<{
    cantidad: number;
    precio_venta: number;
    descuento?: number;
    tipo_iva?: string;
  }>
): { impuesto: number; total: number; liquidacion: LiquidacionIvaParaguay } {
  const items: DetalleTicketItem[] = detalles.map((d) => ({
    nombre: "",
    cantidad: d.cantidad,
    precio_venta: d.precio_venta,
    descuento: d.descuento,
    tipo_iva: normalizarTipoIva(d.tipo_iva),
  }));

  const liquidacion = calcularLiquidacionIvaParaguay(items);

  return {
    impuesto: liquidacion.totalIva,
    total: liquidacion.totalGeneral,
    liquidacion,
  };
}
