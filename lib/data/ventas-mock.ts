import type { VentaRegistro } from "@/lib/types/venta";

export const VENTAS_MOCK: VentaRegistro[] = [
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
    impuesto: 4.5,
    total: 29.5,
    estado: "Aceptado",
    cliente: { idpersona: 101, nombre: "Comercial Los Andes S.A.C." },
    detalles: [
      {
        iddetalle_pedido: 1,
        iddetalle_ingreso: 1,
        cantidad: 10,
        precio_venta: 2.5,
        descuento: 0,
      },
    ],
  },
  {
    idventa: 2,
    idpedido: 2,
    idcliente: 102,
    idusuario: 1,
    idsucursal: 1,
    tipo_venta: "Credito",
    tipo_comprobante: "Factura",
    serie_comprobante: "F001",
    num_comprobante: "00000121",
    fecha: "2026-06-10",
    impuesto: 76.5,
    total: 502.5,
    estado: "Aceptado",
    cliente: { idpersona: 102, nombre: "Bodega El Progreso" },
    detalles: [],
  },
  {
    idventa: 3,
    idpedido: 3,
    idcliente: 103,
    idusuario: 1,
    idsucursal: 1,
    tipo_venta: "Credito",
    tipo_comprobante: "Factura",
    serie_comprobante: "F001",
    num_comprobante: "00000122",
    fecha: "2026-06-12",
    impuesto: 18.0,
    total: 118.0,
    estado: "Aceptado",
    cliente: { idpersona: 103, nombre: "María Elena Quispe" },
    detalles: [],
  },
];

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
