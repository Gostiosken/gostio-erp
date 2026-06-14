"use server";

import { revalidatePath } from "next/cache";
import { dbReadError, mockReadResult, shouldUseMockData } from "@/lib/action-db";
import { CLIENTES_MOCK } from "@/lib/data/clientes-mock";
import {
  avanzarCorrelativoMock,
  getCorrelativoMock,
  getLotesDisponiblesMock,
  obtenerStockMock,
  restarStockMock,
} from "@/lib/data/stock-mock";
import {
  avanzarTimbradoMock,
  getSiguienteNumeroFacturaMock,
  getTimbradoActivoMock,
} from "@/lib/data/timbrados-mock";
import {
  buildMockTicket,
  getNextMockPedidoId,
  getNextMockVentaId,
  getVentasMockBySucursal,
  VENTAS_MOCK,
} from "@/lib/data/ventas-mock";
import { getPrisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/types/action";
import {
  calcularLiquidacionIvaParaguay,
  formatNumeroFactura,
  normalizarTipoIva,
  type DetalleTicketItem,
  type TicketFacturaData,
  type TipoIvaParaguay,
} from "@/lib/types/factura-ticket";
import type { Timbrado } from "@/lib/types/timbrado";
import type {
  CorrelativoComprobante,
  CreateVentaInput,
  LoteDisponible,
  TipoComprobanteVenta,
  VentaRegistro,
} from "@/lib/types/venta";
import {
  getTipoDocumentoId,
  incrementarNumeroComprobante,
} from "@/lib/types/venta";

const VENTAS_PATH = "/ventas/nueva";

type VentaConRelaciones = {
  idventa: number;
  idpedido: number;
  idusuario: number;
  idtimbrado: number | null;
  tipo_venta: string;
  tipo_comprobante: string;
  serie_comprobante: string;
  num_comprobante: string;
  num_factura: string | null;
  fecha: Date;
  impuesto: { toString(): string };
  total: { toString(): string };
  estado: string;
  timbrado?: {
    numero_timbrado: string;
    razon_social: string;
    ruc_emisor: string;
    direccion: string;
    establecimiento: string;
    punto_expedicion: string;
    fecha_vencimiento: Date;
  } | null;
  pedido: {
    idcliente: number;
    idsucursal: number;
    detalles?: Array<{
      iddetalle_pedido: number;
      iddetalle_ingreso: number;
      cantidad: number;
      precio_venta: { toString(): string };
      descuento: { toString(): string } | null;
      tipo_iva: string;
      detalleIngreso?: {
        articulo?: { nombre: string };
      };
    }>;
  };
};

function buildTicketData(
  venta: VentaConRelaciones,
  cliente: {
    nombre: string;
    tipo_documento: string;
    num_documento: string;
  },
  timbrado: Timbrado | null
): TicketFacturaData | undefined {
  if (!timbrado && !venta.num_factura) return undefined;

  const items: DetalleTicketItem[] =
    venta.pedido.detalles?.map((detalle) => ({
      nombre: detalle.detalleIngreso?.articulo?.nombre ?? `Ítem #${detalle.iddetalle_ingreso}`,
      cantidad: detalle.cantidad,
      precio_venta: Number(detalle.precio_venta),
      descuento: detalle.descuento ? Number(detalle.descuento) : 0,
      tipo_iva: normalizarTipoIva(detalle.tipo_iva),
    })) ?? [];

  const emisor = timbrado
    ? {
        razon_social: timbrado.razon_social,
        ruc_emisor: timbrado.ruc_emisor,
        direccion: timbrado.direccion,
        numero_timbrado: timbrado.numero_timbrado,
        fecha_vencimiento_timbrado: timbrado.fecha_vencimiento,
        establecimiento: timbrado.establecimiento,
        punto_expedicion: timbrado.punto_expedicion,
      }
    : venta.timbrado
      ? {
          razon_social: venta.timbrado.razon_social,
          ruc_emisor: venta.timbrado.ruc_emisor,
          direccion: venta.timbrado.direccion,
          numero_timbrado: venta.timbrado.numero_timbrado,
          fecha_vencimiento_timbrado: venta.timbrado.fecha_vencimiento
            .toISOString()
            .slice(0, 10),
          establecimiento: venta.timbrado.establecimiento,
          punto_expedicion: venta.timbrado.punto_expedicion,
        }
      : {
          razon_social: "—",
          ruc_emisor: "—",
          direccion: "—",
          numero_timbrado: "—",
          fecha_vencimiento_timbrado: "—",
          establecimiento: "001",
          punto_expedicion: "001",
        };

  const numFactura =
    venta.num_factura ??
    formatNumeroFactura(
      emisor.establecimiento,
      emisor.punto_expedicion,
      Number.parseInt(venta.num_comprobante, 10) || 0
    );

  return {
    num_factura: numFactura,
    tipo_comprobante: venta.tipo_comprobante,
    fecha: venta.fecha.toISOString().slice(0, 10),
    emisor,
    cliente,
    items,
    liquidacion: calcularLiquidacionIvaParaguay(items),
  };
}

function mapVenta(
  venta: VentaConRelaciones,
  cliente?: {
    idpersona: number;
    nombre: string;
    tipo_documento?: string;
    num_documento?: string;
  },
  timbrado?: Timbrado | null
): VentaRegistro {
  const clienteTicket = cliente
    ? {
        nombre: cliente.nombre,
        tipo_documento: cliente.tipo_documento ?? "RUC",
        num_documento: cliente.num_documento ?? "—",
      }
    : { nombre: "—", tipo_documento: "RUC", num_documento: "—" };

  const registro: VentaRegistro = {
    idventa: venta.idventa,
    idpedido: venta.idpedido,
    idcliente: venta.pedido.idcliente,
    idusuario: venta.idusuario,
    idsucursal: venta.pedido.idsucursal,
    idtimbrado: venta.idtimbrado,
    tipo_venta: venta.tipo_venta as VentaRegistro["tipo_venta"],
    tipo_comprobante: venta.tipo_comprobante,
    serie_comprobante: venta.serie_comprobante,
    num_comprobante: venta.num_comprobante,
    num_factura: venta.num_factura,
    fecha: venta.fecha.toISOString().slice(0, 10),
    impuesto: Number(venta.impuesto),
    total: Number(venta.total),
    estado: venta.estado,
    cliente: cliente
      ? {
          idpersona: cliente.idpersona,
          nombre: cliente.nombre,
          tipo_documento: cliente.tipo_documento,
          num_documento: cliente.num_documento,
        }
      : undefined,
    detalles: venta.pedido.detalles?.map((detalle) => ({
      iddetalle_pedido: detalle.iddetalle_pedido,
      iddetalle_ingreso: detalle.iddetalle_ingreso,
      cantidad: detalle.cantidad,
      precio_venta: Number(detalle.precio_venta),
      descuento: detalle.descuento ? Number(detalle.descuento) : null,
      tipo_iva: normalizarTipoIva(detalle.tipo_iva),
      nombreArticulo: detalle.detalleIngreso?.articulo?.nombre,
    })),
  };

  const ticket = buildTicketData(venta, clienteTicket, timbrado ?? null);
  if (ticket) {
    registro.ticket = ticket;
  }

  return registro;
}

const ventaInclude = {
  pedido: {
    include: {
      detalles: {
        include: {
          detalleIngreso: {
            include: {
              articulo: { select: { nombre: true, tipo_iva: true } },
            },
          },
        },
      },
    },
  },
  timbrado: true,
} as const;

function validarTimbradoParaVenta(timbrado: Timbrado): string | null {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vencimiento = new Date(`${timbrado.fecha_vencimiento}T00:00:00`);

  if (hoy > vencimiento) {
    return `El timbrado ${timbrado.numero_timbrado} está vencido.`;
  }

  const siguiente = timbrado.numero_actual + 1;
  if (siguiente > timbrado.numero_hasta) {
    return "El correlativo del timbrado alcanzó el límite autorizado.";
  }

  if (siguiente < timbrado.numero_desde) {
    return "El correlativo actual está fuera del rango autorizado del timbrado.";
  }

  return null;
}

export async function getStockDisponible(
  idsucursal: number
): Promise<ActionResult<LoteDisponible[]>> {
  if (!idsucursal) {
    return { success: false, error: "Sucursal no válida." };
  }

  if (shouldUseMockData()) {
    const lotes = getLotesDisponiblesMock(idsucursal).map((lote) => ({
      ...lote,
      tipo_iva: normalizarTipoIva("10"),
    }));
    return mockReadResult(lotes);
  }

  try {
    const lotes = await getPrisma().detalleIngreso.findMany({
      where: {
        stock_actual: { gt: 0 },
        ingreso: { idsucursal },
      },
      include: {
        articulo: {
          select: { idarticulo: true, nombre: true, tipo_iva: true },
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
        tipo_iva: normalizarTipoIva(lote.articulo.tipo_iva),
      })),
    };
  } catch (error) {
    if (shouldUseMockData()) {
      const lotes = getLotesDisponiblesMock(idsucursal).map((lote) => ({
        ...lote,
        tipo_iva: normalizarTipoIva("10"),
      }));
      return mockReadResult(lotes);
    }
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

  if (tipoComprobante === "Factura") {
    if (shouldUseMockData()) {
      const numFactura = getSiguienteNumeroFacturaMock(idsucursal);
      if (!numFactura) {
        return {
          success: false,
          error: "No hay timbrado activo o el rango está agotado.",
          usingMockData: true,
        };
      }
      const partes = numFactura.split("-");
      return mockReadResult({
        serie: `${partes[0]}-${partes[1]}`,
        numero: partes[2] ?? "0000001",
        siguienteNumero: numFactura,
        num_factura: numFactura,
      });
    }

    try {
      const timbrado = await getPrisma().timbrado.findFirst({
        where: { idsucursal, estado: "1" },
        orderBy: { idtimbrado: "desc" },
      });

      if (!timbrado) {
        return { success: false, error: "No hay timbrado activo para esta sucursal." };
      }

      const mapped = {
        idtimbrado: timbrado.idtimbrado,
        numero_timbrado: timbrado.numero_timbrado,
        idsucursal: timbrado.idsucursal,
        razon_social: timbrado.razon_social,
        ruc_emisor: timbrado.ruc_emisor,
        direccion: timbrado.direccion,
        establecimiento: timbrado.establecimiento,
        punto_expedicion: timbrado.punto_expedicion,
        serie: timbrado.serie,
        numero_desde: timbrado.numero_desde,
        numero_hasta: timbrado.numero_hasta,
        numero_actual: timbrado.numero_actual,
        fecha_inicio: timbrado.fecha_inicio.toISOString().slice(0, 10),
        fecha_vencimiento: timbrado.fecha_vencimiento.toISOString().slice(0, 10),
        estado: timbrado.estado as Timbrado["estado"],
      };

      const errorTimbrado = validarTimbradoParaVenta(mapped);
      if (errorTimbrado) {
        return { success: false, error: errorTimbrado };
      }

      const secuencial = timbrado.numero_actual + 1;
      const numFactura = formatNumeroFactura(
        timbrado.establecimiento,
        timbrado.punto_expedicion,
        secuencial
      );

      return {
        success: true,
        data: {
          serie: `${timbrado.establecimiento}-${timbrado.punto_expedicion}`,
          numero: String(secuencial).padStart(7, "0"),
          siguienteNumero: String(secuencial + 1).padStart(7, "0"),
          num_factura: numFactura,
        },
      };
    } catch (error) {
      return dbReadError<CorrelativoComprobante>(
        "No se pudo obtener el correlativo del timbrado.",
        error
      );
    }
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
      include: ventaInclude,
      orderBy: { idventa: "desc" },
    });

    const clientes = await getPrisma().persona.findMany({
      where: {
        idpersona: { in: ventas.map((v) => v.pedido.idcliente) },
      },
    });
    const clientesMap = new Map(clientes.map((c) => [c.idpersona, c]));

    return {
      success: true,
      data: ventas.map((venta) => {
        const cliente = clientesMap.get(venta.pedido.idcliente);
        return mapVenta(
          venta as VentaConRelaciones,
          cliente
            ? {
                idpersona: cliente.idpersona,
                nombre: cliente.nombre,
                tipo_documento: cliente.tipo_documento,
                num_documento: cliente.num_documento,
              }
            : undefined
        );
      }),
    };
  } catch (error) {
    if (shouldUseMockData()) return mockReadResult(getVentasMockBySucursal(idsucursal));
    return dbReadError<VentaRegistro[]>("No se pudieron obtener las ventas.", error);
  }
}

export async function getVentaById(
  idventa: number
): Promise<ActionResult<VentaRegistro>> {
  if (!idventa) {
    return { success: false, error: "Venta no válida." };
  }

  if (shouldUseMockData()) {
    const venta = VENTAS_MOCK.find((v) => v.idventa === idventa);
    if (!venta) {
      return { success: false, error: "Venta no encontrada." };
    }
    return mockReadResult(venta);
  }

  try {
    const venta = await getPrisma().venta.findUnique({
      where: { idventa },
      include: ventaInclude,
    });

    if (!venta) {
      return { success: false, error: "Venta no encontrada." };
    }

    const cliente = await getPrisma().persona.findUnique({
      where: { idpersona: venta.pedido.idcliente },
    });

    return {
      success: true,
      data: mapVenta(
        venta as VentaConRelaciones,
        cliente
          ? {
              idpersona: cliente.idpersona,
              nombre: cliente.nombre,
              tipo_documento: cliente.tipo_documento,
              num_documento: cliente.num_documento,
            }
          : undefined
      ),
    };
  } catch (error) {
    if (shouldUseMockData()) {
      const venta = VENTAS_MOCK.find((v) => v.idventa === idventa);
      if (!venta) return { success: false, error: "Venta no encontrada." };
      return mockReadResult(venta);
    }
    return dbReadError<VentaRegistro>("No se pudo obtener la venta.", error);
  }
}

async function resolverTipoIvaDetalles(
  detalles: CreateVentaInput["detalles"]
): Promise<Array<CreateVentaInput["detalles"][number] & { tipo_iva: TipoIvaParaguay }>> {
  if (shouldUseMockData()) {
    return detalles.map((d) => ({
      ...d,
      tipo_iva: normalizarTipoIva(d.tipo_iva ?? "10"),
    }));
  }

  const ids = detalles.map((d) => d.iddetalle_ingreso);
  const lotes = await getPrisma().detalleIngreso.findMany({
    where: { iddetalle_ingreso: { in: ids } },
    include: { articulo: { select: { tipo_iva: true } } },
  });
  const mapaIva = new Map(
    lotes.map((l) => [l.iddetalle_ingreso, normalizarTipoIva(l.articulo.tipo_iva)])
  );

  return detalles.map((d) => ({
    ...d,
    tipo_iva: normalizarTipoIva(d.tipo_iva ?? mapaIva.get(d.iddetalle_ingreso) ?? "10"),
  }));
}

export async function createVenta(
  input: CreateVentaInput
): Promise<ActionResult<VentaRegistro>> {
  const { cabecera, detalles } = input;

  if (!detalles.length) {
    return { success: false, error: "Debe agregar al menos un producto a la venta." };
  }

  const detallesConIva = await resolverTipoIvaDetalles(detalles);
  const liquidacion = calcularLiquidacionIvaParaguay(
    detallesConIva.map((d) => ({
      nombre: "",
      cantidad: d.cantidad,
      precio_venta: d.precio_venta,
      descuento: d.descuento,
      tipo_iva: d.tipo_iva,
    }))
  );
  const impuesto = liquidacion.totalIva;
  const total = liquidacion.totalGeneral;

  if (shouldUseMockData()) {
    for (const detalle of detallesConIva) {
      const stock = obtenerStockMock(detalle.iddetalle_ingreso);
      if (stock < detalle.cantidad) {
        return {
          success: false,
          error: `Stock insuficiente para el lote #${detalle.iddetalle_ingreso}.`,
          usingMockData: true,
        };
      }
    }

    let numFactura: string | null = null;
    let idtimbrado: number | null = null;
    let serie = cabecera.serie_comprobante;
    let numero = cabecera.num_comprobante;
    let timbradoUsado: Timbrado | null = null;

    if (cabecera.tipo_comprobante === "Factura") {
      const avance = avanzarTimbradoMock(cabecera.idsucursal);
      if (!avance) {
        return {
          success: false,
          error: "No hay timbrado activo o el rango de facturas está agotado.",
          usingMockData: true,
        };
      }
      numFactura = avance.num_factura;
      idtimbrado = avance.timbrado.idtimbrado;
      timbradoUsado = avance.timbrado;
      serie = `${avance.timbrado.establecimiento}-${avance.timbrado.punto_expedicion}`;
      numero = String(avance.secuencial).padStart(7, "0");
    } else {
      avanzarCorrelativoMock(
        cabecera.idsucursal,
        cabecera.tipo_comprobante,
        cabecera.num_comprobante
      );
    }

    for (const detalle of detallesConIva) {
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
      idtimbrado,
      tipo_venta: cabecera.tipo_venta,
      tipo_comprobante: cabecera.tipo_comprobante,
      serie_comprobante: serie,
      num_comprobante: numero,
      num_factura: numFactura,
      fecha: cabecera.fecha,
      impuesto,
      total,
      estado: "Aceptado",
      cliente: cliente
        ? {
            idpersona: cliente.idpersona,
            nombre: cliente.nombre,
            tipo_documento: cliente.tipo_documento,
            num_documento: cliente.num_documento,
          }
        : undefined,
        detalles: detallesConIva.map((detalle, index) => ({
        iddetalle_pedido: index + 1,
        iddetalle_ingreso: detalle.iddetalle_ingreso,
        cantidad: detalle.cantidad,
        precio_venta: detalle.precio_venta,
        descuento: detalle.descuento ?? null,
        tipo_iva: detalle.tipo_iva,
        nombreArticulo: `Producto lote #${detalle.iddetalle_ingreso}`,
      })),
    };

    ventaMock.ticket = buildMockTicket(ventaMock);

    VENTAS_MOCK.unshift(ventaMock);

    return {
      success: true,
      data: ventaMock,
      usingMockData: true,
    };
  }

  try {
    const venta = await getPrisma().$transaction(async (tx) => {
      for (const detalle of detallesConIva) {
        const lote = await tx.detalleIngreso.findUnique({
          where: { iddetalle_ingreso: detalle.iddetalle_ingreso },
          select: { stock_actual: true },
        });

        if (!lote || lote.stock_actual < detalle.cantidad) {
          throw new Error("STOCK_INSUFICIENTE");
        }
      }

      let numFactura: string | null = null;
      let idtimbrado: number | null = null;
      let serie = cabecera.serie_comprobante.trim();
      let numero = cabecera.num_comprobante.trim();

      if (cabecera.tipo_comprobante === "Factura") {
        const timbrado = await tx.timbrado.findFirst({
          where: { idsucursal: cabecera.idsucursal, estado: "1" },
          orderBy: { idtimbrado: "desc" },
        });

        if (!timbrado) {
          throw new Error("SIN_TIMBRADO");
        }

        const mapped: Timbrado = {
          idtimbrado: timbrado.idtimbrado,
          numero_timbrado: timbrado.numero_timbrado,
          idsucursal: timbrado.idsucursal,
          razon_social: timbrado.razon_social,
          ruc_emisor: timbrado.ruc_emisor,
          direccion: timbrado.direccion,
          establecimiento: timbrado.establecimiento,
          punto_expedicion: timbrado.punto_expedicion,
          serie: timbrado.serie,
          numero_desde: timbrado.numero_desde,
          numero_hasta: timbrado.numero_hasta,
          numero_actual: timbrado.numero_actual,
          fecha_inicio: timbrado.fecha_inicio.toISOString().slice(0, 10),
          fecha_vencimiento: timbrado.fecha_vencimiento.toISOString().slice(0, 10),
          estado: timbrado.estado as Timbrado["estado"],
        };

        const errorTimbrado = validarTimbradoParaVenta(mapped);
        if (errorTimbrado) {
          throw new Error(`TIMBRADO_INVALIDO:${errorTimbrado}`);
        }

        const secuencial = timbrado.numero_actual + 1;
        numFactura = formatNumeroFactura(
          timbrado.establecimiento,
          timbrado.punto_expedicion,
          secuencial
        );
        idtimbrado = timbrado.idtimbrado;
        serie = `${timbrado.establecimiento}-${timbrado.punto_expedicion}`;
        numero = String(secuencial).padStart(7, "0");

        await tx.timbrado.update({
          where: { idtimbrado: timbrado.idtimbrado },
          data: { numero_actual: secuencial },
        });
      }

      const pedido = await tx.pedido.create({
        data: {
          idcliente: cabecera.idcliente,
          idusuario: cabecera.idusuario,
          idsucursal: cabecera.idsucursal,
          tipo_pedido: cabecera.tipo_venta,
          fecha: new Date(cabecera.fecha),
          numero: Number.parseInt(numero, 10) || null,
          estado: "Aceptado",
        },
      });

      for (const detalle of detallesConIva) {
        await tx.detallePedido.create({
          data: {
            idpedido: pedido.idpedido,
            iddetalle_ingreso: detalle.iddetalle_ingreso,
            cantidad: detalle.cantidad,
            precio_venta: detalle.precio_venta,
            descuento: detalle.descuento ?? null,
            tipo_iva: detalle.tipo_iva,
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
          idtimbrado,
          tipo_venta: cabecera.tipo_venta,
          tipo_comprobante: cabecera.tipo_comprobante,
          serie_comprobante: serie,
          num_comprobante: numero,
          num_factura: numFactura,
          fecha: new Date(cabecera.fecha),
          impuesto,
          total,
          estado: "Aceptado",
        },
      });

      if (cabecera.tipo_comprobante !== "Factura") {
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
            data: { ultimo_numero: numero },
          });
        }
      }

      return tx.venta.findUnique({
        where: { idventa: nuevaVenta.idventa },
        include: ventaInclude,
      });
    });

    if (!venta) {
      return { success: false, error: "No se pudo recuperar la venta creada." };
    }

    const cliente = await getPrisma().persona.findUnique({
      where: { idpersona: venta.pedido.idcliente },
    });

    revalidatePath(VENTAS_PATH);
    return {
      success: true,
      data: mapVenta(
        venta as VentaConRelaciones,
        cliente
          ? {
              idpersona: cliente.idpersona,
              nombre: cliente.nombre,
              tipo_documento: cliente.tipo_documento,
              num_documento: cliente.num_documento,
            }
          : undefined
      ),
    };
  } catch (error) {
    if (error instanceof Error && error.message === "STOCK_INSUFICIENTE") {
      return { success: false, error: "Stock insuficiente para uno o más productos." };
    }
    if (error instanceof Error && error.message === "SIN_TIMBRADO") {
      return {
        success: false,
        error: "No hay timbrado activo configurado para esta sucursal.",
      };
    }
    if (error instanceof Error && error.message.startsWith("TIMBRADO_INVALIDO:")) {
      return {
        success: false,
        error: error.message.replace("TIMBRADO_INVALIDO:", ""),
      };
    }
    return {
      success: false,
      error: "No se pudo procesar la venta.",
    };
  }
}
