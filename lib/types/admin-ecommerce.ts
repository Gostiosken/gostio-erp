import type { LiquidacionIvaParaguay, TipoIvaParaguay } from "@/lib/types/factura-ticket";
import type { EstadoPedidoWeb } from "@/lib/types/ecommerce";

export type AccionPedidoWeb = "APROBAR" | "RECHAZAR";

export interface DetallePedidoWebAdmin {
  iddetalle_pedido: number;
  iddetalle_ingreso: number;
  cantidad: number;
  precio_venta: number;
  descuento: number | null;
  tipo_iva: TipoIvaParaguay;
  nombreArticulo: string;
  codigo: string | null;
  subtotal: number;
}

export interface ClientePedidoWebAdmin {
  idcliente: number;
  nombre: string;
  tipo_documento: string;
  num_documento: string;
  telefono: string | null;
  direccion: string | null;
}

export interface PedidoWebAdmin {
  idpedido: number;
  idcliente: number;
  idsucursal: number;
  idusuario: number;
  fecha: string;
  estado: EstadoPedidoWeb;
  origen: "WEB";
  tipo_pedido: string;
  impuesto: number;
  total: number;
  liquidacion: LiquidacionIvaParaguay;
  cliente: ClientePedidoWebAdmin;
  detalles: DetallePedidoWebAdmin[];
  idventa: number | null;
}

export interface ResultadoProcesarPedidoWeb {
  idpedido: number;
  accion: AccionPedidoWeb;
  estado: EstadoPedidoWeb;
  idventa?: number;
  impuesto?: number;
  total?: number;
  liquidacion?: LiquidacionIvaParaguay;
  tipo_comprobante?: string;
  serie_comprobante?: string;
  num_comprobante?: string;
}
