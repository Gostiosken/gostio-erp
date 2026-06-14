import { CLIENTES_MOCK } from "@/lib/data/clientes-mock";
import { PEDIDOS_WEB_MOCK } from "@/lib/data/ecommerce-mock";
import {
  avanzarCorrelativoMock,
  getCorrelativoMock,
  restarStockMock,
} from "@/lib/data/stock-mock";
import { getNextMockVentaId } from "@/lib/data/ventas-mock";
import {
  calcularTotalesVentaMultiIva,
  normalizarTipoIva,
} from "@/lib/types/factura-ticket";
import type {
  AccionPedidoWeb,
  ClientePedidoWebAdmin,
  DetallePedidoWebAdmin,
  PedidoWebAdmin,
  ResultadoProcesarPedidoWeb,
} from "@/lib/types/admin-ecommerce";
import type { EstadoPedidoWeb } from "@/lib/types/ecommerce";

const NOMBRES_PRODUCTOS: Record<number, { nombre: string; codigo: string }> = {
  10: { nombre: "Tinta Plastisol Negra 1L", codigo: "TINTA-PLS-NEG-1L" },
  11: { nombre: "Tinta Base Agua Cyan 500ml", codigo: "TINTA-AGU-CYA-500" },
  12: { nombre: "Vinilo Textil Transfer Rojo 50cm", codigo: "VIN-TXT-ROJ-50" },
  13: { nombre: "Vinilo PU Flex Blanco 30cm", codigo: "VIN-PU-BLA-30" },
  14: { nombre: "Plotter de Corte 60cm Pro", codigo: "PLOT-60-PRO" },
  15: { nombre: "Mesa Serigráfica 4 Colores", codigo: "MESA-SERI-4C" },
};

const CLIENTES_WEB_SEED: ClientePedidoWebAdmin[] = [
  {
    idcliente: 301,
    nombre: "Serigráfica Guaraní S.A.",
    tipo_documento: "RUC",
    num_documento: "80012345-1",
    telefono: "0981 200 345",
    direccion: "Av. España 1245, Asunción",
  },
  {
    idcliente: 302,
    nombre: "Estampados del Este E.A.S.",
    tipo_documento: "RUC",
    num_documento: "80123456-7",
    telefono: "0982 555 901",
    direccion: "Ruta 7 Km 18, Ciudad del Este",
  },
  {
    idcliente: 303,
    nombre: "María Fernanda González",
    tipo_documento: "CI",
    num_documento: "4.567.890",
    telefono: "0973 112 880",
    direccion: "Calle Palma 456, Fernando de la Mora",
  },
];

function buildDetallesAdmin(
  detalles: Array<{
    iddetalle_pedido: number;
    iddetalle_ingreso: number;
    cantidad: number;
    precio_venta: number;
    descuento?: number | null;
    tipo_iva?: string;
  }>
): DetallePedidoWebAdmin[] {
  return detalles.map((detalle) => {
    const producto = NOMBRES_PRODUCTOS[detalle.iddetalle_ingreso];
    const descuento = detalle.descuento ?? 0;
    return {
      iddetalle_pedido: detalle.iddetalle_pedido,
      iddetalle_ingreso: detalle.iddetalle_ingreso,
      cantidad: detalle.cantidad,
      precio_venta: detalle.precio_venta,
      descuento: detalle.descuento ?? null,
      tipo_iva: normalizarTipoIva(detalle.tipo_iva),
      nombreArticulo: producto?.nombre ?? `Producto lote #${detalle.iddetalle_ingreso}`,
      codigo: producto?.codigo ?? null,
      subtotal: detalle.cantidad * detalle.precio_venta - descuento,
    };
  });
}

function buildPedidoAdminFromInput(input: {
  idpedido: number;
  idcliente: number;
  idsucursal: number;
  idusuario: number;
  fecha: string;
  estado: EstadoPedidoWeb;
  cliente: ClientePedidoWebAdmin;
  detalles: Array<{
    iddetalle_pedido?: number;
    iddetalle_ingreso: number;
    cantidad: number;
    precio_venta: number;
    descuento?: number | null;
    tipo_iva?: string;
  }>;
  idventa?: number | null;
}): PedidoWebAdmin {
  const detalles = buildDetallesAdmin(
    input.detalles.map((d, i) => ({
      ...d,
      iddetalle_pedido: d.iddetalle_pedido ?? i + 1,
    }))
  );

  const { impuesto, total, liquidacion } = calcularTotalesVentaMultiIva(
    detalles.map((d) => ({
      cantidad: d.cantidad,
      precio_venta: d.precio_venta,
      descuento: d.descuento ?? undefined,
      tipo_iva: d.tipo_iva,
    }))
  );

  return {
    idpedido: input.idpedido,
    idcliente: input.idcliente,
    idsucursal: input.idsucursal,
    idusuario: input.idusuario,
    fecha: input.fecha,
    estado: input.estado,
    origen: "WEB",
    tipo_pedido: "Contado",
    impuesto,
    total,
    liquidacion,
    cliente: input.cliente,
    detalles,
    idventa: input.idventa ?? null,
  };
}

export const PEDIDOS_WEB_ADMIN_MOCK: PedidoWebAdmin[] = [
  buildPedidoAdminFromInput({
    idpedido: 501,
    idcliente: 301,
    idsucursal: 1,
    idusuario: 1,
    fecha: "2026-06-12",
    estado: "Pendiente",
    cliente: CLIENTES_WEB_SEED[0],
    detalles: [
      {
        iddetalle_pedido: 1,
        iddetalle_ingreso: 10,
        cantidad: 4,
        precio_venta: 185_000,
        tipo_iva: "10",
      },
      {
        iddetalle_pedido: 2,
        iddetalle_ingreso: 12,
        cantidad: 2,
        precio_venta: 120_000,
        tipo_iva: "10",
      },
    ],
  }),
  buildPedidoAdminFromInput({
    idpedido: 502,
    idcliente: 302,
    idsucursal: 1,
    idusuario: 1,
    fecha: "2026-06-11",
    estado: "Pendiente",
    cliente: CLIENTES_WEB_SEED[1],
    detalles: [
      {
        iddetalle_pedido: 1,
        iddetalle_ingreso: 11,
        cantidad: 6,
        precio_venta: 95_000,
        tipo_iva: "10",
      },
      {
        iddetalle_pedido: 2,
        iddetalle_ingreso: 13,
        cantidad: 5,
        precio_venta: 78_000,
        tipo_iva: "10",
      },
    ],
  }),
  buildPedidoAdminFromInput({
    idpedido: 503,
    idcliente: 303,
    idsucursal: 1,
    idusuario: 1,
    fecha: "2026-06-10",
    estado: "Pendiente",
    cliente: CLIENTES_WEB_SEED[2],
    detalles: [
      {
        iddetalle_pedido: 1,
        iddetalle_ingreso: 14,
        cantidad: 1,
        precio_venta: 4_850_000,
        tipo_iva: "5",
      },
    ],
  }),
];

function mapClienteMock(idcliente: number): ClientePedidoWebAdmin {
  const seed = CLIENTES_WEB_SEED.find((c) => c.idcliente === idcliente);
  if (seed) return seed;

  const cliente = CLIENTES_MOCK.find((c) => c.idpersona === idcliente);
  if (cliente) {
    return {
      idcliente: cliente.idpersona,
      nombre: cliente.nombre,
      tipo_documento: cliente.tipo_documento,
      num_documento: cliente.num_documento,
      telefono: cliente.telefono ?? null,
      direccion: cliente.direccion ?? null,
    };
  }

  return {
    idcliente,
    nombre: "Cliente web",
    tipo_documento: "RUC",
    num_documento: "—",
    telefono: null,
    direccion: null,
  };
}

function mapPedidoDinamicoMock(
  pedido: (typeof PEDIDOS_WEB_MOCK)[number]
): PedidoWebAdmin | null {
  const existente = PEDIDOS_WEB_ADMIN_MOCK.find((p) => p.idpedido === pedido.idpedido);
  if (existente) return existente;

  return buildPedidoAdminFromInput({
    idpedido: pedido.idpedido,
    idcliente: pedido.idcliente,
    idsucursal: pedido.idsucursal,
    idusuario: pedido.idusuario,
    fecha: pedido.fecha,
    estado: pedido.estado,
    cliente: mapClienteMock(pedido.idcliente),
    detalles: pedido.detalles.map((d, index) => ({
      iddetalle_pedido: index + 1,
      iddetalle_ingreso: d.iddetalle_ingreso,
      cantidad: d.cantidad,
      precio_venta: d.precio_venta,
      descuento: d.descuento,
      tipo_iva: d.tipo_iva,
    })),
    idventa: pedido.idventa ?? null,
  });
}

export function getPedidosWebAdminMock(): PedidoWebAdmin[] {
  const dinamicos = PEDIDOS_WEB_MOCK.map(mapPedidoDinamicoMock).filter(
    (pedido): pedido is PedidoWebAdmin => pedido !== null
  );

  const idsDinamicos = new Set(dinamicos.map((p) => p.idpedido));
  const estaticos = PEDIDOS_WEB_ADMIN_MOCK.filter((p) => !idsDinamicos.has(p.idpedido));

  return [...dinamicos, ...estaticos].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

function findPedidoMutable(idpedido: number): PedidoWebAdmin | undefined {
  const estatico = PEDIDOS_WEB_ADMIN_MOCK.find((p) => p.idpedido === idpedido);
  if (estatico) return estatico;

  const dinamico = PEDIDOS_WEB_MOCK.find((p) => p.idpedido === idpedido);
  if (!dinamico) return undefined;

  let admin = PEDIDOS_WEB_ADMIN_MOCK.find((p) => p.idpedido === idpedido);
  if (!admin) {
    const mapped = mapPedidoDinamicoMock(dinamico);
    if (mapped) {
      PEDIDOS_WEB_ADMIN_MOCK.push(mapped);
      admin = mapped;
    }
  }
  return admin;
}

export function procesarPedidoWebMock(
  idpedido: number,
  accion: AccionPedidoWeb,
  _idusuarioActual: number
): ResultadoProcesarPedidoWeb | { error: string } {
  const pedido = findPedidoMutable(idpedido);

  if (!pedido) {
    return { error: "Pedido web no encontrado." };
  }

  if (pedido.estado !== "Pendiente") {
    return { error: `El pedido #${idpedido} ya fue procesado (${pedido.estado}).` };
  }

  if (accion === "RECHAZAR") {
    pedido.estado = "Cancelado";

    const dinamico = PEDIDOS_WEB_MOCK.find((p) => p.idpedido === idpedido);
    if (dinamico) {
      dinamico.estado = "Cancelado";
    }

    return {
      idpedido,
      accion,
      estado: "Cancelado",
    };
  }

  for (const detalle of pedido.detalles) {
    const ok = restarStockMock(detalle.iddetalle_ingreso, detalle.cantidad);
    if (!ok) {
      return {
        error: `Stock insuficiente para el lote #${detalle.iddetalle_ingreso}.`,
      };
    }
  }

  const correlativo = getCorrelativoMock(pedido.idsucursal, "Boleta");
  avanzarCorrelativoMock(pedido.idsucursal, "Boleta", correlativo.numero);

  const idventa = getNextMockVentaId();
  pedido.estado = "Aceptado";
  pedido.idventa = idventa;

  const dinamico = PEDIDOS_WEB_MOCK.find((p) => p.idpedido === idpedido);
  if (dinamico) {
    dinamico.estado = "Aceptado";
    dinamico.idventa = idventa;
  }

  return {
    idpedido,
    accion,
    estado: "Aceptado",
    idventa,
    impuesto: pedido.impuesto,
    total: pedido.total,
    liquidacion: pedido.liquidacion,
    tipo_comprobante: "Boleta",
    serie_comprobante: correlativo.serie,
    num_comprobante: correlativo.numero,
  };
}
