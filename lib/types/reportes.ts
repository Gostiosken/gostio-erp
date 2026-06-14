import { normalizarTipoIva, type TipoIvaParaguay } from "@/lib/types/factura-ticket";

export interface PeriodoReporte {
  mes: number;
  anio: number;
  etiqueta: string;
}

export interface LiquidacionGravadaRG90 {
  /** Suma de montos brutos de líneas en esta tasa (precio con IVA incluido). */
  montoBruto: number;
  /** Base imponible gravada (sin el componente IVA). */
  totalGravado: number;
  /** IVA extraído según DNIT: Monto / 11 o Monto / 21. */
  iva: number;
}

export interface ReporteIvaVentas {
  periodo: PeriodoReporte;
  idsucursal: number;
  cantidadFacturas: number;
  /** Suma de todos los ítems facturados en Gs. (sin decimales). */
  totalFacturadoBruto: number;
  gravado10: LiquidacionGravadaRG90;
  gravado5: LiquidacionGravadaRG90;
  totalExentas: number;
  totalIva: number;
}

export interface ProductoRentabilidadTop {
  idarticulo: number;
  nombre: string;
  cantidadVendida: number;
  ingresosGenerados: number;
  costoMercaderia: number;
  margenBruto: number;
  margenPorcentaje: number;
}

export interface ReporteRentabilidad {
  idsucursal: number;
  fechaInicio: string;
  fechaFin: string;
  totalIngresosVentas: number;
  totalCostoMercaderiaVendida: number;
  margenUtilidadBruta: number;
  margenUtilidadPorcentaje: number;
  cantidadVentas: number;
  cantidadLineas: number;
  topProductos: ProductoRentabilidadTop[];
}

export interface LibroIvaFila {
  idventa: number;
  fecha: string;
  numComprobante: string;
  rucCliente: string;
  nombreCliente: string;
  exentas: number;
  gravadas5: number;
  iva5: number;
  gravadas10: number;
  iva10: number;
  totalFacturado: number;
}

export interface LibroIvaTotales {
  exentas: number;
  gravadas5: number;
  iva5: number;
  gravadas10: number;
  iva10: number;
  totalFacturado: number;
}

export interface LibroIvaVentasDetalle {
  periodo: PeriodoReporte;
  idsucursal: number;
  filas: LibroIvaFila[];
  totales: LibroIvaTotales;
}

export interface LineaIvaReporte {
  montoLinea: number;
  tipo_iva: TipoIvaParaguay;
}

const MESES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function etiquetaPeriodo(mes: number, anio: number): string {
  const nombreMes = MESES_ES[mes - 1] ?? `Mes ${mes}`;
  return `${nombreMes} ${anio}`;
}

export function validarPeriodo(mes: number, anio: number): string | null {
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
    return "El mes debe estar entre 1 y 12.";
  }
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
    return "El año no es válido.";
  }
  return null;
}

export function getRangoMes(mes: number, anio: number): { inicio: Date; fin: Date } {
  const inicio = new Date(anio, mes - 1, 1);
  const fin = new Date(anio, mes, 0, 23, 59, 59, 999);
  return { inicio, fin };
}

export function normalizarFechaReporte(valor: Date | string): Date {
  if (valor instanceof Date) {
    const copia = new Date(valor);
    copia.setHours(0, 0, 0, 0);
    return copia;
  }

  const texto = valor.trim();
  const fecha = texto.includes("T")
    ? new Date(texto)
    : new Date(`${texto}T00:00:00`);

  if (Number.isNaN(fecha.getTime())) {
    throw new Error("FECHA_INVALIDA");
  }

  fecha.setHours(0, 0, 0, 0);
  return fecha;
}

export function validarRangoFechas(
  fechaInicio: Date | string,
  fechaFin: Date | string
): { inicio: Date; fin: Date } | string {
  let inicio: Date;
  let fin: Date;

  try {
    inicio = normalizarFechaReporte(fechaInicio);
    fin = normalizarFechaReporte(fechaFin);
  } catch {
    return "Las fechas ingresadas no son válidas.";
  }

  if (fin < inicio) {
    return "La fecha fin no puede ser anterior a la fecha inicio.";
  }

  fin.setHours(23, 59, 59, 999);
  return { inicio, fin };
}

function redondearGs(valor: number): number {
  return Math.round(valor);
}

/**
 * Liquidación IVA para Formulario 120 / RG90 (precios con IVA incluido).
 * IVA 10% = Monto / 11 · IVA 5% = Monto / 21
 */
export function calcularLiquidacionGravadaRG90(
  montoBruto: number,
  tasa: 10 | 5
): LiquidacionGravadaRG90 {
  const bruto = redondearGs(montoBruto);

  if (bruto <= 0) {
    return { montoBruto: 0, totalGravado: 0, iva: 0 };
  }

  if (tasa === 10) {
    const iva = redondearGs(bruto / 11);
    return {
      montoBruto: bruto,
      totalGravado: bruto - iva,
      iva,
    };
  }

  const iva = redondearGs(bruto / 21);
  return {
    montoBruto: bruto,
    totalGravado: bruto - iva,
    iva,
  };
}

export function acumularLiquidacionIvaRG90(
  lineas: LineaIvaReporte[]
): Pick<
  ReporteIvaVentas,
  "totalFacturadoBruto" | "gravado10" | "gravado5" | "totalExentas" | "totalIva"
> {
  let monto10 = 0;
  let monto5 = 0;
  let totalExentas = 0;

  for (const linea of lineas) {
    const monto = redondearGs(linea.montoLinea);
    const tipo = normalizarTipoIva(linea.tipo_iva);

    if (tipo === "EXENTA") {
      totalExentas += monto;
      continue;
    }

    if (tipo === "5") {
      monto5 += monto;
      continue;
    }

    monto10 += monto;
  }

  const gravado10 = calcularLiquidacionGravadaRG90(monto10, 10);
  const gravado5 = calcularLiquidacionGravadaRG90(monto5, 5);

  return {
    totalFacturadoBruto: monto10 + monto5 + totalExentas,
    gravado10,
    gravado5,
    totalExentas,
    totalIva: gravado10.iva + gravado5.iva,
  };
}

export function calcularMargenRentabilidad(
  totalIngresosVentas: number,
  totalCostoMercaderiaVendida: number
): Pick<ReporteRentabilidad, "margenUtilidadBruta" | "margenUtilidadPorcentaje"> {
  const ingresos = redondearGs(totalIngresosVentas);
  const cmv = redondearGs(totalCostoMercaderiaVendida);
  const margenUtilidadBruta = ingresos - cmv;
  const margenUtilidadPorcentaje =
    ingresos > 0
      ? Number(((margenUtilidadBruta / ingresos) * 100).toFixed(2))
      : 0;

  return { margenUtilidadBruta, margenUtilidadPorcentaje };
}

export function montoLineaVenta(input: {
  cantidad: number;
  precio_venta: number;
  descuento?: number | null;
}): number {
  return redondearGs(
    input.cantidad * input.precio_venta - (input.descuento ?? 0)
  );
}

export function liquidarLineasFacturaRG90(
  lineas: LineaIvaReporte[]
): Pick<
  LibroIvaFila,
  "exentas" | "gravadas5" | "iva5" | "gravadas10" | "iva10" | "totalFacturado"
> {
  const liquidacion = acumularLiquidacionIvaRG90(lineas);
  return {
    exentas: liquidacion.totalExentas,
    gravadas5: liquidacion.gravado5.totalGravado,
    iva5: liquidacion.gravado5.iva,
    gravadas10: liquidacion.gravado10.totalGravado,
    iva10: liquidacion.gravado10.iva,
    totalFacturado: liquidacion.totalFacturadoBruto,
  };
}

export function sumarTotalesLibroIva(filas: LibroIvaFila[]): LibroIvaTotales {
  return filas.reduce(
    (acc, fila) => ({
      exentas: acc.exentas + fila.exentas,
      gravadas5: acc.gravadas5 + fila.gravadas5,
      iva5: acc.iva5 + fila.iva5,
      gravadas10: acc.gravadas10 + fila.gravadas10,
      iva10: acc.iva10 + fila.iva10,
      totalFacturado: acc.totalFacturado + fila.totalFacturado,
    }),
    {
      exentas: 0,
      gravadas5: 0,
      iva5: 0,
      gravadas10: 0,
      iva10: 0,
      totalFacturado: 0,
    }
  );
}

export function calcularTopProductosRentabilidad(
  items: Array<{
    idarticulo: number;
    nombre: string;
    cantidad: number;
    ingresos: number;
    costo: number;
  }>,
  limite = 5
): ProductoRentabilidadTop[] {
  const mapa = new Map<number, ProductoRentabilidadTop>();

  for (const item of items) {
    const actual = mapa.get(item.idarticulo) ?? {
      idarticulo: item.idarticulo,
      nombre: item.nombre,
      cantidadVendida: 0,
      ingresosGenerados: 0,
      costoMercaderia: 0,
      margenBruto: 0,
      margenPorcentaje: 0,
    };

    actual.cantidadVendida += item.cantidad;
    actual.ingresosGenerados += item.ingresos;
    actual.costoMercaderia += item.costo;
    mapa.set(item.idarticulo, actual);
  }

  return [...mapa.values()]
    .map((producto) => {
      const margenBruto = producto.ingresosGenerados - producto.costoMercaderia;
      return {
        ...producto,
        margenBruto,
        margenPorcentaje:
          producto.ingresosGenerados > 0
            ? Number(((margenBruto / producto.ingresosGenerados) * 100).toFixed(2))
            : 0,
      };
    })
    .sort((a, b) => b.ingresosGenerados - a.ingresosGenerados)
    .slice(0, limite);
}

export const MESES_REPORTE = MESES_ES.map((nombre, index) => ({
  valor: index + 1,
  nombre,
}));
