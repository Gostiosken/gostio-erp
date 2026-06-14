"use server";

import { revalidatePath } from "next/cache";
import { dbReadError, mockReadResult, shouldUseMockData } from "@/lib/action-db";
import {
  getPedidosWebAdminMock,
  procesarPedidoWebMock,
} from "@/lib/data/pedidos-web-admin-mock";
import { getPrisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/types/action";
import type {
  AccionPedidoWeb,
  DetallePedidoWebAdmin,
  PedidoWebAdmin,
  ResultadoProcesarPedidoWeb,
} from "@/lib/types/admin-ecommerce";
import {
  calcularTotalesVentaMultiIva,
  normalizarTipoIva,
} from "@/lib/types/factura-ticket";
import {
  getTipoDocumentoId,
  incrementarNumeroComprobante,
} from "@/lib/types/venta";

const PEDIDOS_WEB_ADMIN_PATH = "/ventas/pedidos-web";
const STOCK_PATH = "/almacen/articulos";
const TIENDA_PATH = "/";

const pedidoWebInclude = {
  detalles: {
    include: {
      detalleIngreso: {
        select: {
          codigo: true,
          articulo: { select: { nombre: true } },
        },
      },
    },
    orderBy: { iddetalle_pedido: "asc" as const },
  },
  ventas: {
    select: { idventa: true },
    orderBy: { idventa: "desc" as const },
    take: 1,
  },
} as const;

type PedidoWebDb = {
  idpedido: number;
  idcliente: number;
  idusuario: number;
  idsucursal: number;
  tipo_pedido: string;
  origen: string;
  fecha: Date;
  estado: string;
  detalles: Array<{
    iddetalle_pedido: number;
    iddetalle_ingreso: number;
    cantidad: number;
    precio_venta: { toString(): string };
    descuento: { toString(): string } | null;
    tipo_iva: string;
    detalleIngreso: {
      codigo: string;
      articulo: { nombre: string };
    };
  }>;
  ventas: Array<{ idventa: number }>;
};

function mapDetallesPedidoWeb(
  detalles: PedidoWebDb["detalles"]
): DetallePedidoWebAdmin[] {
  return detalles.map((detalle) => {
    const precio = Number(detalle.precio_venta);
    const descuento = detalle.descuento ? Number(detalle.descuento) : null;
    return {
      iddetalle_pedido: detalle.iddetalle_pedido,
      iddetalle_ingreso: detalle.iddetalle_ingreso,
      cantidad: detalle.cantidad,
      precio_venta: precio,
      descuento,
      tipo_iva: normalizarTipoIva(detalle.tipo_iva),
      nombreArticulo: detalle.detalleIngreso.articulo.nombre,
      codigo: detalle.detalleIngreso.codigo,
      subtotal: detalle.cantidad * precio - (descuento ?? 0),
    };
  });
}

function mapPedidoWebAdmin(
  pedido: PedidoWebDb,
  cliente: {
    idpersona: number;
    nombre: string;
    tipo_documento: string;
    num_documento: string;
    telefono: string | null;
    direccion: string | null;
  }
): PedidoWebAdmin {
  const detalles = mapDetallesPedidoWeb(pedido.detalles);
  const { impuesto, total, liquidacion } = calcularTotalesVentaMultiIva(
    detalles.map((d) => ({
      cantidad: d.cantidad,
      precio_venta: d.precio_venta,
      descuento: d.descuento ?? undefined,
      tipo_iva: d.tipo_iva,
    }))
  );

  return {
    idpedido: pedido.idpedido,
    idcliente: pedido.idcliente,
    idsucursal: pedido.idsucursal,
    idusuario: pedido.idusuario,
    fecha: pedido.fecha.toISOString().slice(0, 10),
    estado: pedido.estado as PedidoWebAdmin["estado"],
    origen: "WEB",
    tipo_pedido: pedido.tipo_pedido,
    impuesto,
    total,
    liquidacion,
    cliente: {
      idcliente: cliente.idpersona,
      nombre: cliente.nombre,
      tipo_documento: cliente.tipo_documento,
      num_documento: cliente.num_documento,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
    },
    detalles,
    idventa: pedido.ventas[0]?.idventa ?? null,
  };
}

export async function getPedidosWeb(): Promise<ActionResult<PedidoWebAdmin[]>> {
  if (shouldUseMockData()) {
    return mockReadResult(getPedidosWebAdminMock());
  }

  try {
    const pedidos = await getPrisma().pedido.findMany({
      where: { origen: "WEB" },
      include: pedidoWebInclude,
      orderBy: { fecha: "desc" },
    });

    if (!pedidos.length) {
      return { success: true, data: [] };
    }

    const clientes = await getPrisma().persona.findMany({
      where: {
        idpersona: { in: pedidos.map((p) => p.idcliente) },
      },
    });
    const clientesMap = new Map(clientes.map((c) => [c.idpersona, c]));

    const data = pedidos.map((pedido) => {
      const cliente = clientesMap.get(pedido.idcliente);
      return mapPedidoWebAdmin(
        pedido as PedidoWebDb,
        cliente ?? {
          idpersona: pedido.idcliente,
          nombre: "Cliente no registrado",
          tipo_documento: "—",
          num_documento: "—",
          telefono: null,
          direccion: null,
        }
      );
    });

    return { success: true, data };
  } catch (error) {
    if (shouldUseMockData()) {
      return mockReadResult(getPedidosWebAdminMock());
    }
    return dbReadError<PedidoWebAdmin[]>(
      "No se pudieron obtener los pedidos web.",
      error
    );
  }
}

export async function procesarPedidoWeb(
  idpedido: number,
  accion: AccionPedidoWeb,
  idusuarioActual: number
): Promise<ActionResult<ResultadoProcesarPedidoWeb>> {
  if (!idpedido) {
    return { success: false, error: "Pedido no válido." };
  }

  if (!idusuarioActual) {
    return { success: false, error: "Usuario no válido." };
  }

  if (accion !== "APROBAR" && accion !== "RECHAZAR") {
    return { success: false, error: "Acción no reconocida." };
  }

  if (shouldUseMockData()) {
    const resultado = procesarPedidoWebMock(idpedido, accion, idusuarioActual);
    if ("error" in resultado) {
      return { success: false, error: resultado.error, usingMockData: true };
    }
    return { success: true, data: resultado, usingMockData: true };
  }

  try {
    const resultado = await getPrisma().$transaction(async (tx) => {
      const pedido = await tx.pedido.findFirst({
        where: { idpedido, origen: "WEB" },
        include: {
          detalles: true,
          ventas: { select: { idventa: true }, take: 1 },
        },
      });

      if (!pedido) {
        throw new Error("PEDIDO_NO_ENCONTRADO");
      }

      if (pedido.estado !== "Pendiente") {
        throw new Error(`PEDIDO_YA_PROCESADO:${pedido.estado}`);
      }

      if (accion === "RECHAZAR") {
        await tx.pedido.update({
          where: { idpedido },
          data: { estado: "Cancelado" },
        });

        return {
          idpedido,
          accion,
          estado: "Cancelado" as const,
        };
      }

      for (const detalle of pedido.detalles) {
        const lote = await tx.detalleIngreso.findUnique({
          where: { iddetalle_ingreso: detalle.iddetalle_ingreso },
          select: { stock_actual: true },
        });

        if (!lote || lote.stock_actual < detalle.cantidad) {
          throw new Error("STOCK_INSUFICIENTE");
        }
      }

      const detallesAdmin = pedido.detalles.map((detalle) => ({
        cantidad: detalle.cantidad,
        precio_venta: Number(detalle.precio_venta),
        descuento: detalle.descuento ? Number(detalle.descuento) : undefined,
        tipo_iva: normalizarTipoIva(detalle.tipo_iva),
      }));

      const { impuesto, total, liquidacion } =
        calcularTotalesVentaMultiIva(detallesAdmin);

      const tipoComprobante = "Boleta" as const;
      const idtipo = getTipoDocumentoId(tipoComprobante);
      const documento = await tx.detalleDocumentoSucursal.findFirst({
        where: {
          idsucursal: pedido.idsucursal,
          idtipo_documento: idtipo,
        },
      });

      const serie = documento?.ultima_serie ?? "B001";
      const numero = incrementarNumeroComprobante(
        documento?.ultimo_numero ?? "00000000"
      );

      await tx.pedido.update({
        where: { idpedido },
        data: { estado: "Aceptado" },
      });

      for (const detalle of pedido.detalles) {
        await tx.detalleIngreso.update({
          where: { iddetalle_ingreso: detalle.iddetalle_ingreso },
          data: {
            stock_actual: { decrement: detalle.cantidad },
          },
        });
      }

      const venta = await tx.venta.create({
        data: {
          idpedido: pedido.idpedido,
          idusuario: idusuarioActual,
          tipo_venta: pedido.tipo_pedido,
          tipo_comprobante: tipoComprobante,
          serie_comprobante: serie,
          num_comprobante: numero,
          fecha: new Date(),
          impuesto,
          total,
          estado: "Aceptado",
        },
      });

      if (documento) {
        await tx.detalleDocumentoSucursal.update({
          where: {
            iddetalle_documento_sucursal: documento.iddetalle_documento_sucursal,
          },
          data: { ultimo_numero: numero },
        });
      }

      return {
        idpedido,
        accion,
        estado: "Aceptado" as const,
        idventa: venta.idventa,
        impuesto,
        total,
        liquidacion,
        tipo_comprobante: tipoComprobante,
        serie_comprobante: serie,
        num_comprobante: numero,
      };
    });

    revalidatePath(PEDIDOS_WEB_ADMIN_PATH);
    revalidatePath(STOCK_PATH);
    revalidatePath(TIENDA_PATH);
    revalidatePath("/ventas/nueva");

    return { success: true, data: resultado };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PEDIDO_NO_ENCONTRADO") {
        return { success: false, error: "Pedido web no encontrado." };
      }
      if (error.message.startsWith("PEDIDO_YA_PROCESADO:")) {
        const estado = error.message.replace("PEDIDO_YA_PROCESADO:", "");
        return {
          success: false,
          error: `El pedido ya fue procesado (${estado}).`,
        };
      }
      if (error.message === "STOCK_INSUFICIENTE") {
        return {
          success: false,
          error: "Stock insuficiente para completar la aprobación del pedido.",
        };
      }
    }

    return {
      success: false,
      error: "No se pudo procesar el pedido web.",
    };
  }
}
