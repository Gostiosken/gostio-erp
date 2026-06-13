import { formatMoneda as formatMonedaGuaranies } from "@/lib/format-moneda";

export type TipoComprobanteCompra = "Factura" | "Boleta";

export interface DetalleIngresoInput {
  idarticulo: number;
  codigo: string;
  serie?: string | null;
  descripcion?: string | null;
  stock_ingreso: number;
  precio_compra: number;
  precio_ventadistribuidor: number;
  precio_ventapublico: number;
}

export interface IngresoCabeceraInput {
  idusuario: number;
  idsucursal: number;
  idproveedor: number;
  tipo_comprobante: TipoComprobanteCompra;
  serie_comprobante: string;
  num_comprobante: string;
  fecha: string;
  porcentaje_impuesto: number;
}

export interface CreateIngresoInput {
  cabecera: IngresoCabeceraInput;
  detalles: DetalleIngresoInput[];
}

export interface DetalleIngreso extends DetalleIngresoInput {
  iddetalle_ingreso: number;
  idingreso: number;
  stock_actual: number;
  articulo?: {
    idarticulo: number;
    nombre: string;
  };
}

export interface Ingreso {
  idingreso: number;
  idusuario: number;
  idsucursal: number;
  idproveedor: number;
  tipo_comprobante: string;
  serie_comprobante: string;
  num_comprobante: string;
  fecha: string;
  impuesto: number;
  total: number;
  estado: string;
  proveedor?: {
    idpersona: number;
    nombre: string;
    num_documento: string;
  };
  detalles?: DetalleIngreso[];
}

export const TIPOS_COMPROBANTE_COMPRA: TipoComprobanteCompra[] = [
  "Factura",
  "Boleta",
];

export function calcularTotalesIngreso(
  detalles: DetalleIngresoInput[],
  porcentajeImpuesto: number
): { subtotal: number; impuesto: number; total: number } {
  const subtotal = detalles.reduce(
    (acc, item) => acc + item.stock_ingreso * item.precio_compra,
    0
  );
  const impuesto = Number(((subtotal * porcentajeImpuesto) / 100).toFixed(2));
  const total = Number((subtotal + impuesto).toFixed(2));
  return { subtotal, impuesto, total };
}

export function formatMoneda(valor: number): string {
  return formatMonedaGuaranies(valor);
}
