import type { LiquidacionIvaParaguay, TipoIvaParaguay } from "@/lib/types/factura-ticket";

export type OrigenPedido = "POS" | "WEB";

export type EstadoPedidoWeb = "Pendiente" | "Aceptado" | "Cancelado";

export interface ProductoEcommerce {
  idarticulo: number;
  iddetalle_ingreso: number;
  nombre: string;
  descripcion: string | null;
  imagen: string | null;
  precio_ventapublico: number;
  stock_actual: number;
  tipo_iva: TipoIvaParaguay;
  categoria: {
    idcategoria: number;
    nombre: string;
  };
  unidadMedida: {
    idunidad_medida: number;
    nombre: string;
    prefijo: string;
  };
  codigo: string;
}

export interface DetallePedidoWebInput {
  iddetalle_ingreso: number;
  cantidad: number;
  precio_venta: number;
  descuento?: number;
  tipo_iva?: TipoIvaParaguay;
}

/** Payload del carrito web enviado desde la tienda. */
export interface CreatePedidoWebStore {
  idcliente: number;
  idsucursal: number;
  idusuario: number;
  fecha?: string;
  detalles: DetallePedidoWebInput[];
}

export interface ResultadoPedidoWeb {
  idpedido: number;
  impuesto: number;
  total: number;
  liquidacion: LiquidacionIvaParaguay;
}
