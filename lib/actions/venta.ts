"use server";

import { revalidatePath } from "next/cache";
import { dbReadError, mockReadResult, shouldUseMockData } from "@/lib/action-db";
import { getPrisma } from "@/lib/prisma";
import { CLIENTES_MOCK } from "@/lib/data/clientes-mock";
import {
  avanzarCorrelativoMock,
  getCorrelativoMock,
  getLotesDisponiblesMock,
  obtenerStockMock,
  restarStockMock,
} from "@/lib/data/stock-mock";
import {
  getNextMockPedidoId,
  getNextMockVentaId,
  getVentasMockBySucursal,
  VENTAS_MOCK,
} from "@/lib/data/ventas-mock";
import type { ActionResult } from "@/lib/types/action";
import type {
  CorrelativoComprobante,
  CreateVentaInput,
  LoteDisponible,
  TipoComprobanteVenta,
  VentaRegistro,
} from "@/lib/types/venta";
import {
  calcularTotalesVenta,
  getTipoDocumentoId,
  incrementarNumeroComprobante,
} from "@/lib/types/venta";

const VENTAS_PATH = "/ventas/nueva";

function mapVenta(venta: {
  idventa: number;
  idpedido: number;
  idusuario: number;
  tipo_venta: string;
  tipo_comprobante: string;
  serie_comprobante: string;
  num_comprobante: string;
  fecha: Date;
  impuesto: { toString(): string };
  total: { toString(): string };
  estado: string;
  pedido: {
    idcliente: number;
    idsucursal: number;
    detalles?: Array<{
      iddetalle_pedido: number;
      iddetalle_ingreso: number;
      cantidad: number;
      precio_venta: { toString(): string };
      descuento: { toString(): string } | null;
    }>;
  };
}): VentaRegistro {
  return {
    idventa: venta.idventa,
    idpedido: venta.idpedido,
    idcliente: venta.pedido.idcliente,
    idusuario: venta.idusuario,
    idsucursal: venta.pedido.idsucursal,
    tipo_venta: venta.tipo_venta as VentaRegistro["tipo_venta"],
    tipo_comprobante: venta.tipo_comprobante,
    serie_comprobante: venta.serie_comprobante,
    num_comprobante: venta.num_comprobante,
    fecha: venta.fecha.toISOString().slice(0, 10),
    impuesto: Number(venta.impuesto),
    total: Number(venta.total),
    estado: venta.estado,
    detalles: venta.pedido.detalles?.map((detalle) => ({
      iddetalle_pedido: detalle.iddetalle_pedido,
      iddetalle_ingreso: detalle.iddetalle_ingreso,
      cantidad: detalle.cantidad,
      precio_venta: Number(detalle.precio_venta),
      descuento: detalle.descuento ? Number(detalle.descuento) : null,
    })),
  };
}

export async function getStockDisponible(
  idsucursal: number
): Promise<ActionResult<LoteDisponible[]>> {
  if (!idsucursal) {
    return { success: false, error: "Sucursal no válida." };
  }

  if (shouldUseMockData()) {
    return mockReadResult(getLotesDisponiblesMock(idsucursal));
  }

  try {
    const lotes = await getPrisma().detalleIngreso.findMany({
      where: {
        stock_actual: { gt: 0 },
        ingreso: { idsucursal },
      },
      include: {
        articulo: {
          select: { idarticulo: true, nombre: true },
        },
      },
      orderBy: { iddetalle_ingreso: "asc" },
    });

    return {
      success: true,
      data: lotes.map((lote) => ({
        iddetalle_ingreso: lote.iddetalle_ingreso,
        idarticulo: lote.idarticulo,
        nombreArticulo: lote.articulo.nombre,
        codigo: lote.codigo,
        serie: lote.serie,
        descripcion: lote.descripcion,
        stock_actual: lote.stock_actual,
        precio_ventapublico: Number(lote.precio_ventapublico),
      })),
    };
  } catch (error) {
    if (shouldUseMockData()) return mockReadResult(getLotesDisponiblesMock(idsucursal));
    return dbReadError<LoteDisponible[]>("No se pudo obtener el stock disponible.", error);
  }
}

export async function getCorrelativoComprobante(
  idsucursal: number,
  tipoComprobante: TipoComprobanteVenta
): Promise<ActionResult<CorrelativoComprobante>> {
  if (!idsucursal) {
    return { success: false, error: "Sucursal no válida." };
  }

  if (shouldUseMockData()) {
    return mockReadResult(getCorrelativoMock(idsucursal, tipoComprobante));
  }

  try {
    const idtipo = getTipoDocumentoId(tipoComprobante);
    const documento = await getPrisma().detalleDocumentoSucursal.findFirst({
      where: { idsucursal, idtipo_documento: idtipo },
    });

    if (!documento) {
      return {
        success: true,
        data: getCorrelativoMock(idsucursal, tipoComprobante),
      };
    }

    const siguienteNumero = incrementarNumeroComprobante(documento.ultimo_numero);
    return {
      success: true,
      data: {
        serie: documento.ultima_serie,
        numero: siguienteNumero,
        siguienteNumero: incrementarNumeroComprobante(siguienteNumero),
      },
    };
  } catch (error) {
    if (shouldUseMockData()) {
      return mockReadResult(getCorrelativoMock(idsucursal, tipoComprobante));
    }
    return dbReadError<CorrelativoComprobante>(
      "No se pudo obtener el correlativo del comprobante.",
      error
    );
  }
}

export async function getVentas(
  idsucursal: number
): Promise<ActionResult<VentaRegistro[]>> {
  if (!idsucursal) {
    return { success: false, error: "Sucursal no válida." };
  }

  if (shouldUseMockData()) {
    return mockReadResult(getVentasMockBySucursal(idsucursal));
  }

  try {
    const ventas = await getPrisma().venta.findMany({
      where: { pedido: { idsucursal } },
      include: {
        pedido: {
          include: {
            detalles: true,
          },
        },
      },
      orderBy: { idventa: "desc" },
    });

    return {
      success: true,
      data: ventas.map(mapVenta),
    };
  } catch (error) {
    if (shouldUseMockData()) return mockReadResult(getVentasMockBySucursal(idsucursal));
    return dbReadError<VentaRegistro[]>("No se pudieron obtener las ventas.", error);
  }
}

export async function createVenta(
  input: CreateVentaInput
): Promise<ActionResult<VentaRegistro>> {
  const { cabecera, detalles } = input;

  if (!detalles.length) {
    return { success: false, error: "Debe agregar al menos un producto a la venta." };
  }

  const { impuesto, total } = calcularTotalesVenta(
    detalles,
    cabecera.porcentaje_impuesto
  );

  if (shouldUseMockData()) {
    for (const detalle of detalles) {
      const stock = obtenerStockMock(detalle.iddetalle_ingreso);
      if (stock < detalle.cantidad) {
        return {
          success: false,
          error: `Stock insuficiente para el lote #${detalle.iddetalle_ingreso}.`,
          usingMockData: true,
        };
      }
    }

    for (const detalle of detalles) {
      const ok = restarStockMock(detalle.iddetalle_ingreso, detalle.cantidad);
      if (!ok) {
        return {
          success: false,
          error: "Error al actualizar el inventario en modo demostración.",
          usingMockData: true,
        };
      }
    }

    const idpedido = getNextMockPedidoId();
    const idventa = getNextMockVentaId();
    const cliente = CLIENTES_MOCK.find((item) => item.idpersona === cabecera.idcliente);

    const ventaMock: VentaRegistro = {
      idventa,
      idpedido,
      idcliente: cabecera.idcliente,
      idusuario: cabecera.idusuario,
      idsucursal: cabecera.idsucursal,
      tipo_venta: cabecera.tipo_venta,
      tipo_comprobante: cabecera.tipo_comprobante,
      serie_comprobante: cabecera.serie_comprobante,
      num_comprobante: cabecera.num_comprobante,
      fecha: cabecera.fecha,
      impuesto,
      total,
      estado: "Aceptado",
      cliente: cliente
        ? { idpersona: cliente.idpersona, nombre: cliente.nombre }
        : undefined,
      detalles: detalles.map((detalle, index) => ({
        iddetalle_pedido: index + 1,
        iddetalle_ingreso: detalle.iddetalle_ingreso,
        cantidad: detalle.cantidad,
        precio_venta: detalle.precio_venta,
        descuento: detalle.descuento ?? null,
      })),
    };

    VENTAS_MOCK.unshift(ventaMock);
    avanzarCorrelativoMock(
      cabecera.idsucursal,
      cabecera.tipo_comprobante,
      cabecera.num_comprobante
    );

    return {
      success: true,
      data: ventaMock,
      usingMockData: true,
    };
  }

  try {
    const venta = await getPrisma().$transaction(async (tx) => {
      for (const detalle of detalles) {
        const lote = await tx.detalleIngreso.findUnique({
          where: { iddetalle_ingreso: detalle.iddetalle_ingreso },
          select: { stock_actual: true },
        });

        if (!lote || lote.stock_actual < detalle.cantidad) {
          throw new Error("STOCK_INSUFICIENTE");
        }
      }

      const pedido = await tx.pedido.create({
        data: {
          idcliente: cabecera.idcliente,
          idusuario: cabecera.idusuario,
          idsucursal: cabecera.idsucursal,
          tipo_pedido: cabecera.tipo_venta,
          fecha: new Date(cabecera.fecha),
          numero: Number.parseInt(cabecera.num_comprobante, 10) || null,
          estado: "Aceptado",
        },
      });

      for (const detalle of detalles) {
        await tx.detallePedido.create({
          data: {
            idpedido: pedido.idpedido,
            iddetalle_ingreso: detalle.iddetalle_ingreso,
            cantidad: detalle.cantidad,
            precio_venta: detalle.precio_venta,
            descuento: detalle.descuento ?? null,
          },
        });

        await tx.detalleIngreso.update({
          where: { iddetalle_ingreso: detalle.iddetalle_ingreso },
          data: {
            stock_actual: {
              decrement: detalle.cantidad,
            },
          },
        });
      }

      const nuevaVenta = await tx.venta.create({
        data: {
          idpedido: pedido.idpedido,
          idusuario: cabecera.idusuario,
          tipo_venta: cabecera.tipo_venta,
          tipo_comprobante: cabecera.tipo_comprobante,
          serie_comprobante: cabecera.serie_comprobante.trim(),
          num_comprobante: cabecera.num_comprobante.trim(),
          fecha: new Date(cabecera.fecha),
          impuesto,
          total,
          estado: "Aceptado",
        },
      });

      const idtipo = getTipoDocumentoId(cabecera.tipo_comprobante);
      const documento = await tx.detalleDocumentoSucursal.findFirst({
        where: {
          idsucursal: cabecera.idsucursal,
          idtipo_documento: idtipo,
        },
      });

      if (documento) {
        await tx.detalleDocumentoSucursal.update({
          where: {
            iddetalle_documento_sucursal: documento.iddetalle_documento_sucursal,
          },
          data: { ultimo_numero: cabecera.num_comprobante.trim() },
        });
      }

      return tx.venta.findUnique({
        where: { idventa: nuevaVenta.idventa },
        include: {
          pedido: {
            include: { detalles: true },
          },
        },
      });
    });

    if (!venta) {
      return { success: false, error: "No se pudo recuperar la venta creada." };
    }

    revalidatePath(VENTAS_PATH);
    return { success: true, data: mapVenta(venta) };
  } catch (error) {
    if (error instanceof Error && error.message === "STOCK_INSUFICIENTE") {
      return { success: false, error: "Stock insuficiente para uno o más productos." };
    }
    return {
      success: false,
      error: "No se pudo procesar la venta.",
    };
  }
}
