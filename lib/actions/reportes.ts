"use server";

import { dbReadError, mockReadResult, shouldUseMockData } from "@/lib/action-db";
import {
  getLibroIvaVentasMock,
  getReporteIvaVentasMock,
  getReporteRentabilidadMock,
} from "@/lib/data/reportes-mock";
import { getPrisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/types/action";
import { normalizarTipoIva } from "@/lib/types/factura-ticket";
import {
  acumularLiquidacionIvaRG90,
  calcularMargenRentabilidad,
  calcularTopProductosRentabilidad,
  etiquetaPeriodo,
  getRangoMes,
  liquidarLineasFacturaRG90,
  montoLineaVenta,
  sumarTotalesLibroIva,
  validarPeriodo,
  validarRangoFechas,
  type LibroIvaFila,
  type LibroIvaVentasDetalle,
  type LineaIvaReporte,
  type ReporteIvaVentas,
  type ReporteRentabilidad,
} from "@/lib/types/reportes";

function toNumber(value: { toString(): string } | number | null | undefined): number {
  if (value == null) return 0;
  return Number(value);
}

export async function getReporteIvaVentas(
  idsucursal: number,
  mes: number,
  anio: number
): Promise<ActionResult<ReporteIvaVentas>> {
  if (!idsucursal) {
    return { success: false, error: "Sucursal no válida." };
  }

  const errorPeriodo = validarPeriodo(mes, anio);
  if (errorPeriodo) {
    return { success: false, error: errorPeriodo };
  }

  if (shouldUseMockData()) {
    return mockReadResult(getReporteIvaVentasMock(idsucursal, mes, anio));
  }

  try {
    const libro = await consultarLibroIvaVentas(idsucursal, mes, anio);
    const lineas: LineaIvaReporte[] = [];

    for (const fila of libro.filas) {
      if (fila.exentas > 0) {
        lineas.push({ montoLinea: fila.exentas, tipo_iva: "EXENTA" });
      }
      if (fila.gravadas5 + fila.iva5 > 0) {
        lineas.push({ montoLinea: fila.gravadas5 + fila.iva5, tipo_iva: "5" });
      }
      if (fila.gravadas10 + fila.iva10 > 0) {
        lineas.push({ montoLinea: fila.gravadas10 + fila.iva10, tipo_iva: "10" });
      }
    }

    const liquidacion = acumularLiquidacionIvaRG90(lineas);

    return {
      success: true,
      data: {
        periodo: libro.periodo,
        idsucursal,
        cantidadFacturas: libro.filas.length,
        ...liquidacion,
      },
    };
  } catch (error) {
    if (shouldUseMockData()) {
      return mockReadResult(getReporteIvaVentasMock(idsucursal, mes, anio));
    }
    return dbReadError<ReporteIvaVentas>(
      "No se pudo generar el reporte de IVA de ventas.",
      error
    );
  }
}

async function consultarLibroIvaVentas(
  idsucursal: number,
  mes: number,
  anio: number
): Promise<LibroIvaVentasDetalle> {
  const { inicio, fin } = getRangoMes(mes, anio);

  const ventas = await getPrisma().venta.findMany({
    where: {
      tipo_comprobante: "Factura",
      num_factura: { not: null },
      estado: "Aceptado",
      fecha: { gte: inicio, lte: fin },
      pedido: { idsucursal },
    },
    include: {
      pedido: {
        include: {
          detalles: {
            select: {
              cantidad: true,
              precio_venta: true,
              descuento: true,
              tipo_iva: true,
            },
          },
        },
      },
    },
    orderBy: { fecha: "asc" },
  });

  const clientesIds = [...new Set(ventas.map((v) => v.pedido.idcliente))];
  const clientes = await getPrisma().persona.findMany({
    where: { idpersona: { in: clientesIds } },
    select: {
      idpersona: true,
      nombre: true,
      num_documento: true,
    },
  });
  const clientesMap = new Map(clientes.map((c) => [c.idpersona, c]));

  const filas: LibroIvaFila[] = ventas.map((venta) => {
    const lineas: LineaIvaReporte[] = venta.pedido.detalles.map((detalle) => ({
      montoLinea: montoLineaVenta({
        cantidad: detalle.cantidad,
        precio_venta: toNumber(detalle.precio_venta),
        descuento: detalle.descuento ? toNumber(detalle.descuento) : null,
      }),
      tipo_iva: normalizarTipoIva(detalle.tipo_iva),
    }));

    const montos = liquidarLineasFacturaRG90(lineas);
    const cliente = clientesMap.get(venta.pedido.idcliente);

    return {
      idventa: venta.idventa,
      fecha: venta.fecha.toISOString().slice(0, 10),
      numComprobante: venta.num_factura ?? `${venta.serie_comprobante}-${venta.num_comprobante}`,
      rucCliente: cliente?.num_documento ?? "—",
      nombreCliente: cliente?.nombre ?? "—",
      ...montos,
    };
  });

  return {
    periodo: {
      mes,
      anio,
      etiqueta: etiquetaPeriodo(mes, anio),
    },
    idsucursal,
    filas,
    totales: sumarTotalesLibroIva(filas),
  };
}

export async function getLibroIvaVentas(
  idsucursal: number,
  mes: number,
  anio: number
): Promise<ActionResult<LibroIvaVentasDetalle>> {
  if (!idsucursal) {
    return { success: false, error: "Sucursal no válida." };
  }

  const errorPeriodo = validarPeriodo(mes, anio);
  if (errorPeriodo) {
    return { success: false, error: errorPeriodo };
  }

  if (shouldUseMockData()) {
    return mockReadResult(getLibroIvaVentasMock(idsucursal, mes, anio));
  }

  try {
    const libro = await consultarLibroIvaVentas(idsucursal, mes, anio);
    return { success: true, data: libro };
  } catch (error) {
    if (shouldUseMockData()) {
      return mockReadResult(getLibroIvaVentasMock(idsucursal, mes, anio));
    }
    return dbReadError<LibroIvaVentasDetalle>(
      "No se pudo generar el libro IVA de ventas.",
      error
    );
  }
}

export async function getReporteRentabilidad(
  idsucursal: number,
  fechaInicio: Date | string,
  fechaFin: Date | string
): Promise<ActionResult<ReporteRentabilidad>> {
  if (!idsucursal) {
    return { success: false, error: "Sucursal no válida." };
  }

  const rango = validarRangoFechas(fechaInicio, fechaFin);
  if (typeof rango === "string") {
    return { success: false, error: rango };
  }

  if (shouldUseMockData()) {
    return mockReadResult(
      getReporteRentabilidadMock(idsucursal, rango.inicio, rango.fin)
    );
  }

  try {
    const ventas = await getPrisma().venta.findMany({
      where: {
        estado: "Aceptado",
        fecha: {
          gte: rango.inicio,
          lte: rango.fin,
        },
        pedido: { idsucursal },
      },
      include: {
        pedido: {
          include: {
            detalles: {
              include: {
                detalleIngreso: {
                  select: {
                    precio_compra: true,
                    idarticulo: true,
                    articulo: { select: { nombre: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { fecha: "asc" },
    });

    let totalIngresosVentas = 0;
    let totalCostoMercaderiaVendida = 0;
    let cantidadLineas = 0;
    const itemsTop: Array<{
      idarticulo: number;
      nombre: string;
      cantidad: number;
      ingresos: number;
      costo: number;
    }> = [];

    for (const venta of ventas) {
      for (const detalle of venta.pedido.detalles) {
        const cantidad = detalle.cantidad;
        const ingresoLinea = montoLineaVenta({
          cantidad,
          precio_venta: toNumber(detalle.precio_venta),
          descuento: detalle.descuento ? toNumber(detalle.descuento) : null,
        });
        const costoUnitario = toNumber(detalle.detalleIngreso.precio_compra);
        const costoLinea = Math.round(cantidad * costoUnitario);

        totalIngresosVentas += ingresoLinea;
        totalCostoMercaderiaVendida += costoLinea;
        cantidadLineas += 1;

        itemsTop.push({
          idarticulo: detalle.detalleIngreso.idarticulo,
          nombre: detalle.detalleIngreso.articulo.nombre,
          cantidad,
          ingresos: ingresoLinea,
          costo: costoLinea,
        });
      }
    }

    const margen = calcularMargenRentabilidad(
      totalIngresosVentas,
      totalCostoMercaderiaVendida
    );

    return {
      success: true,
      data: {
        idsucursal,
        fechaInicio: rango.inicio.toISOString().slice(0, 10),
        fechaFin: rango.fin.toISOString().slice(0, 10),
        totalIngresosVentas,
        totalCostoMercaderiaVendida,
        ...margen,
        cantidadVentas: ventas.length,
        cantidadLineas,
        topProductos: calcularTopProductosRentabilidad(itemsTop),
      },
    };
  } catch (error) {
    if (shouldUseMockData()) {
      return mockReadResult(
        getReporteRentabilidadMock(idsucursal, rango.inicio, rango.fin)
      );
    }
    return dbReadError<ReporteRentabilidad>(
      "No se pudo generar el reporte de rentabilidad.",
      error
    );
  }
}
