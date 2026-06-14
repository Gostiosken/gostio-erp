import { INGRESOS_MOCK } from "@/lib/data/ingresos-mock";
import { getVentasMockBySucursal } from "@/lib/data/ventas-mock";
import { normalizarTipoIva } from "@/lib/types/factura-ticket";
import {
  acumularLiquidacionIvaRG90,
  calcularMargenRentabilidad,
  calcularTopProductosRentabilidad,
  etiquetaPeriodo,
  getRangoMes,
  liquidarLineasFacturaRG90,
  montoLineaVenta,
  normalizarFechaReporte,
  sumarTotalesLibroIva,
  type LibroIvaFila,
  type LibroIvaVentasDetalle,
  type LineaIvaReporte,
  type ReporteIvaVentas,
  type ReporteRentabilidad,
} from "@/lib/types/reportes";

function esFacturaLegal(
  venta: ReturnType<typeof getVentasMockBySucursal>[number]
): boolean {
  return (
    venta.tipo_comprobante === "Factura" &&
    venta.estado === "Aceptado" &&
    Boolean(venta.num_factura)
  );
}

function ventaEnPeriodo(fecha: string, mes: number, anio: number): boolean {
  const [anioStr, mesStr] = fecha.split("-");
  return Number.parseInt(anioStr, 10) === anio && Number.parseInt(mesStr, 10) === mes;
}

function ventaEnRango(fecha: string, inicio: Date, fin: Date): boolean {
  const valor = normalizarFechaReporte(fecha);
  return valor >= inicio && valor <= fin;
}

function obtenerPrecioCompraMock(iddetalle_ingreso: number): number {
  for (const ingreso of INGRESOS_MOCK) {
    const detalle = ingreso.detalles?.find(
      (item) => item.iddetalle_ingreso === iddetalle_ingreso
    );
    if (detalle) {
      return detalle.precio_compra;
    }
  }
  return 0;
}

function obtenerNombreArticuloMock(iddetalle_ingreso: number): string {
  for (const ingreso of INGRESOS_MOCK) {
    const detalle = ingreso.detalles?.find(
      (item) => item.iddetalle_ingreso === iddetalle_ingreso
    );
    if (detalle?.articulo?.nombre) {
      return detalle.articulo.nombre;
    }
  }
  return `Artículo lote #${iddetalle_ingreso}`;
}

function obtenerIdArticuloMock(iddetalle_ingreso: number): number {
  for (const ingreso of INGRESOS_MOCK) {
    const detalle = ingreso.detalles?.find(
      (item) => item.iddetalle_ingreso === iddetalle_ingreso
    );
    if (detalle) return detalle.idarticulo;
  }
  return iddetalle_ingreso;
}

export function getReporteIvaVentasMock(
  idsucursal: number,
  mes: number,
  anio: number
): ReporteIvaVentas {
  const libro = getLibroIvaVentasMock(idsucursal, mes, anio);
  const liquidacion = acumularLiquidacionIvaRG90(
    libro.filas.flatMap((fila) => {
      const lineas: LineaIvaReporte[] = [];
      if (fila.exentas > 0) lineas.push({ montoLinea: fila.exentas, tipo_iva: "EXENTA" });
      if (fila.gravadas5 + fila.iva5 > 0) {
        lineas.push({ montoLinea: fila.gravadas5 + fila.iva5, tipo_iva: "5" });
      }
      if (fila.gravadas10 + fila.iva10 > 0) {
        lineas.push({ montoLinea: fila.gravadas10 + fila.iva10, tipo_iva: "10" });
      }
      return lineas;
    })
  );

  return {
    periodo: libro.periodo,
    idsucursal,
    cantidadFacturas: libro.filas.length,
    ...liquidacion,
  };
}

export function getLibroIvaVentasMock(
  idsucursal: number,
  mes: number,
  anio: number
): LibroIvaVentasDetalle {
  const facturas = getVentasMockBySucursal(idsucursal).filter(
    (venta) => esFacturaLegal(venta) && ventaEnPeriodo(venta.fecha, mes, anio)
  );

  const filas: LibroIvaFila[] = facturas.map((factura) => {
    const lineas: LineaIvaReporte[] = (factura.detalles ?? []).map((detalle) => ({
      montoLinea: montoLineaVenta(detalle),
      tipo_iva: normalizarTipoIva(detalle.tipo_iva),
    }));

    if (lineas.length === 0 && factura.total > 0) {
      lineas.push({ montoLinea: Math.round(factura.total), tipo_iva: "10" });
    }

    const montos = liquidarLineasFacturaRG90(lineas);

    return {
      idventa: factura.idventa,
      fecha: factura.fecha,
      numComprobante: factura.num_factura ?? `${factura.serie_comprobante}-${factura.num_comprobante}`,
      rucCliente: factura.cliente?.num_documento ?? "—",
      nombreCliente: factura.cliente?.nombre ?? "—",
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

export function getReporteRentabilidadMock(
  idsucursal: number,
  fechaInicio: Date | string,
  fechaFin: Date | string
): ReporteRentabilidad {
  const inicio = normalizarFechaReporte(fechaInicio);
  const fin = normalizarFechaReporte(fechaFin);
  fin.setHours(23, 59, 59, 999);

  const ventas = getVentasMockBySucursal(idsucursal).filter(
    (venta) =>
      venta.estado === "Aceptado" && ventaEnRango(venta.fecha, inicio, fin)
  );

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
    for (const detalle of venta.detalles ?? []) {
      const ingresoLinea = montoLineaVenta(detalle);
      const costoUnitario = obtenerPrecioCompraMock(detalle.iddetalle_ingreso);
      const costoLinea = Math.round(detalle.cantidad * costoUnitario);
      totalIngresosVentas += ingresoLinea;
      totalCostoMercaderiaVendida += costoLinea;
      cantidadLineas += 1;

      itemsTop.push({
        idarticulo: obtenerIdArticuloMock(detalle.iddetalle_ingreso),
        nombre:
          detalle.nombreArticulo ??
          obtenerNombreArticuloMock(detalle.iddetalle_ingreso),
        cantidad: detalle.cantidad,
        ingresos: ingresoLinea,
        costo: costoLinea,
      });
    }

    if ((venta.detalles ?? []).length === 0) {
      totalIngresosVentas += Math.round(venta.total);
    }
  }

  const margen = calcularMargenRentabilidad(
    totalIngresosVentas,
    totalCostoMercaderiaVendida
  );

  return {
    idsucursal,
    fechaInicio: inicio.toISOString().slice(0, 10),
    fechaFin: fin.toISOString().slice(0, 10),
    totalIngresosVentas,
    totalCostoMercaderiaVendida,
    ...margen,
    cantidadVentas: ventas.length,
    cantidadLineas,
    topProductos: calcularTopProductosRentabilidad(itemsTop),
  };
}

export function getReporteIvaVentasMockJunio2026(idsucursal: number): ReporteIvaVentas {
  return getReporteIvaVentasMock(idsucursal, 6, 2026);
}

export function getRangoMesMock(mes: number, anio: number) {
  return getRangoMes(mes, anio);
}
