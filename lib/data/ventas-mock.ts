import type { VentaRegistro } from "@/lib/types/venta";
import {
  calcularLiquidacionIvaParaguay,
  formatNumeroFactura,
  type TicketFacturaData,
} from "@/lib/types/factura-ticket";
import { getTimbradoActivoMock } from "@/lib/data/timbrados-mock";

export function buildMockTicket(venta: VentaRegistro): TicketFacturaData | undefined {
  const timbrado = getTimbradoActivoMock(venta.idsucursal);
  if (!timbrado || !venta.cliente) return undefined;

  const items =
    venta.detalles?.map((d) => ({
      nombre: d.nombreArticulo ?? `Producto lote #${d.iddetalle_ingreso}`,
      cantidad: d.cantidad,
      precio_venta: d.precio_venta,
      descuento: d.descuento ?? 0,
      tipo_iva: d.tipo_iva,
    })) ?? [];

  return {
    num_factura:
      venta.num_factura ??
      formatNumeroFactura(
        timbrado.establecimiento,
        timbrado.punto_expedicion,
        Number.parseInt(venta.num_comprobante, 10) || 1
      ),
    tipo_comprobante: venta.tipo_comprobante,
    fecha: venta.fecha,
    emisor: {
      razon_social: timbrado.razon_social,
      ruc_emisor: timbrado.ruc_emisor,
      direccion: timbrado.direccion,
      numero_timbrado: timbrado.numero_timbrado,
      fecha_vencimiento_timbrado: timbrado.fecha_vencimiento,
      establecimiento: timbrado.establecimiento,
      punto_expedicion: timbrado.punto_expedicion,
    },
    cliente: {
      nombre: venta.cliente.nombre,
      tipo_documento: venta.cliente.tipo_documento ?? "RUC",
      num_documento: venta.cliente.num_documento ?? "—",
    },
    items,
    liquidacion: calcularLiquidacionIvaParaguay(items),
  };
}

const BASE_VENTAS: VentaRegistro[] = [
  {
    idventa: 1,
    idpedido: 1,
    idcliente: 101,
    idusuario: 1,
    idsucursal: 1,
    tipo_venta: "Contado",
    tipo_comprobante: "Boleta",
    serie_comprobante: "B001",
    num_comprobante: "00000044",
    fecha: "2026-06-08",
    impuesto: 4500,
    total: 29500,
    estado: "Aceptado",
    cliente: {
      idpersona: 101,
      nombre: "Comercial Los Andes S.A.C.",
      tipo_documento: "RUC",
      num_documento: "80011111-1",
    },
    detalles: [
      {
        iddetalle_pedido: 1,
        iddetalle_ingreso: 1,
        cantidad: 10,
        precio_venta: 2500,
        descuento: 0,
        tipo_iva: "10",
        nombreArticulo: "Arroz Premium 1kg",
      },
    ],
  },
  {
    idventa: 2,
    idpedido: 2,
    idcliente: 102,
    idusuario: 1,
    idsucursal: 1,
    idtimbrado: 1,
    tipo_venta: "Credito",
    tipo_comprobante: "Factura",
    serie_comprobante: "001-001",
    num_comprobante: "0000121",
    num_factura: "001-001-0000121",
    fecha: "2026-06-10",
    impuesto: 76500,
    total: 502500,
    estado: "Aceptado",
    cliente: {
      idpersona: 102,
      nombre: "Bodega El Progreso",
      tipo_documento: "RUC",
      num_documento: "80022222-2",
    },
    detalles: [
      {
        iddetalle_pedido: 2,
        iddetalle_ingreso: 2,
        cantidad: 100,
        precio_venta: 4800,
        descuento: 0,
        tipo_iva: "10",
        nombreArticulo: "Arroz Extra 1kg",
      },
      {
        iddetalle_pedido: 3,
        iddetalle_ingreso: 3,
        cantidad: 5,
        precio_venta: 5000,
        descuento: 0,
        tipo_iva: "5",
        nombreArticulo: "Detergente Líquido",
      },
    ],
  },
  {
    idventa: 3,
    idpedido: 3,
    idcliente: 103,
    idusuario: 1,
    idsucursal: 1,
    idtimbrado: 1,
    tipo_venta: "Credito",
    tipo_comprobante: "Factura",
    serie_comprobante: "001-001",
    num_comprobante: "0000122",
    num_factura: "001-001-0000122",
    fecha: "2026-06-12",
    impuesto: 18000,
    total: 118000,
    estado: "Aceptado",
    cliente: {
      idpersona: 103,
      nombre: "María Elena Quispe",
      tipo_documento: "CI",
      num_documento: "4.567.890",
    },
    detalles: [
      {
        iddetalle_pedido: 4,
        iddetalle_ingreso: 1,
        cantidad: 40,
        precio_venta: 2500,
        descuento: 0,
        tipo_iva: "10",
        nombreArticulo: "Agua Mineral 625ml",
      },
      {
        iddetalle_pedido: 5,
        iddetalle_ingreso: 2,
        cantidad: 2,
        precio_venta: 9000,
        descuento: 0,
        tipo_iva: "EXENTA",
        nombreArticulo: "Arroz Extra 1kg (promo exenta)",
      },
    ],
  },
];

export const VENTAS_MOCK: VentaRegistro[] = BASE_VENTAS.map((venta) => ({
  ...venta,
  ticket: buildMockTicket(venta),
}));

export function getVentasMockBySucursal(idsucursal: number): VentaRegistro[] {
  return VENTAS_MOCK.filter((venta) => venta.idsucursal === idsucursal);
}

let mockVentaCounter = 3;
let mockPedidoCounter = 3;

export function getNextMockVentaId(): number {
  mockVentaCounter += 1;
  return mockVentaCounter;
}

export function getNextMockPedidoId(): number {
  mockPedidoCounter += 1;
  return mockPedidoCounter;
}
