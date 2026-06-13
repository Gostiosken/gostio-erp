import { CREDITOS_MOCK } from "@/lib/data/creditos-mock";
import { INGRESOS_MOCK } from "@/lib/data/ingresos-mock";
import { VENTAS_MOCK } from "@/lib/data/ventas-mock";
import type {
  DashboardAnalytics,
  DashboardTotales,
  ProductoVendidoTop,
  VentaCompraMesPoint,
  VentaDiaPoint,
} from "@/lib/types/dashboard";

const TOP_PRODUCTOS_SUCURSAL_1: ProductoVendidoTop[] = [
  { idarticulo: 1, nombre: "Agua Mineral 625ml", cantidad: 1240, total: 3100.0 },
  { idarticulo: 2, nombre: "Arroz Extra 1kg", cantidad: 860, total: 4128.0 },
  { idarticulo: 3, nombre: "Detergente Líquido", cantidad: 420, total: 5040.0 },
  { idarticulo: 4, nombre: "Aceite Vegetal 1L", cantidad: 315, total: 2835.0 },
  { idarticulo: 5, nombre: "Leche Evaporada 400g", cantidad: 280, total: 1680.0 },
];

const VENTAS_DIA_BASE = [
  820, 940, 760, 1100, 980, 1250, 890, 1020, 1180, 1340, 990, 1420, 1080, 1560,
  1280,
];

const VENTAS_MES_BASE = [
  { ventas: 18400, compras: 15200 },
  { ventas: 20100, compras: 16800 },
  { ventas: 17850, compras: 14100 },
  { ventas: 22300, compras: 18900 },
  { ventas: 19600, compras: 16200 },
  { ventas: 24100, compras: 20500 },
  { ventas: 21800, compras: 17800 },
  { ventas: 25400, compras: 22100 },
  { ventas: 23200, compras: 19400 },
  { ventas: 26800, compras: 23600 },
  { ventas: 24500, compras: 20800 },
  { ventas: 28100, compras: 24200 },
];

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function ultimosNDias(n: number): string[] {
  const dias: string[] = [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  for (let i = n - 1; i >= 0; i -= 1) {
    const fecha = new Date(hoy);
    fecha.setDate(fecha.getDate() - i);
    dias.push(fecha.toISOString().slice(0, 10));
  }

  return dias;
}

function ultimosNMeses(n: number): VentaCompraMesPoint[] {
  const meses: VentaCompraMesPoint[] = [];
  const hoy = new Date();

  for (let i = n - 1; i >= 0; i -= 1) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    const label = fecha.toLocaleDateString("es-PY", {
      month: "short",
      year: "2-digit",
    });
    const base = VENTAS_MES_BASE[i] ?? VENTAS_MES_BASE[VENTAS_MES_BASE.length - 1];

    meses.push({
      mes,
      label,
      ventas: base.ventas,
      compras: base.compras,
    });
  }

  return meses;
}

function sumarPorFecha(
  registros: { fecha: string; monto: number }[],
  fecha: string
): number {
  return registros
    .filter((r) => r.fecha === fecha)
    .reduce((acc, r) => acc + r.monto, 0);
}

export function getTotalesDiaMock(idsucursal: number): DashboardTotales {
  if (idsucursal !== 1) {
    return {
      totalCompradoHoy: 0,
      totalVentaContadoHoy: 0,
      totalRecaudadoCreditosHoy: 0,
    };
  }

  const hoy = hoyISO();

  const comprasHoy = INGRESOS_MOCK.filter(
    (i) => i.idsucursal === idsucursal && i.fecha === hoy
  ).reduce((acc, i) => acc + i.total, 0);

  const ventasContadoHoy = VENTAS_MOCK.filter(
    (v) =>
      v.idsucursal === idsucursal &&
      v.tipo_venta === "Contado" &&
      v.fecha === hoy
  ).reduce((acc, v) => acc + v.total, 0);

  const creditosHoy = CREDITOS_MOCK.filter((c) => c.fecha === hoy).reduce(
    (acc, c) => acc + c.total_pago,
    0
  );

  return {
    totalCompradoHoy: comprasHoy + (comprasHoy === 0 ? 428.5 : 0),
    totalVentaContadoHoy: ventasContadoHoy + (ventasContadoHoy === 0 ? 156.8 : 0),
    totalRecaudadoCreditosHoy: creditosHoy + (creditosHoy === 0 ? 250.0 : 0),
  };
}

export function getVentasDiasMock(idsucursal: number): VentaDiaPoint[] {
  if (idsucursal !== 1) return ultimosNDias(15).map((fecha) => ({ fecha, total: 0 }));

  const dias = ultimosNDias(15);
  const ventasReales = VENTAS_MOCK.filter((v) => v.idsucursal === idsucursal).map(
    (v) => ({ fecha: v.fecha, monto: v.total })
  );

  return dias.map((fecha, index) => {
    const real = sumarPorFecha(ventasReales, fecha);
    const simulado = VENTAS_DIA_BASE[index] ?? 0;
    return { fecha, total: real > 0 ? real : simulado };
  });
}

export function getVentasMesMock(idsucursal: number): VentaCompraMesPoint[] {
  if (idsucursal !== 1) {
    return ultimosNMeses(12).map((m) => ({ ...m, ventas: 0, compras: 0 }));
  }

  const meses = ultimosNMeses(12);

  const ventasPorMes = new Map<string, number>();
  for (const venta of VENTAS_MOCK.filter((v) => v.idsucursal === idsucursal)) {
    const mes = venta.fecha.slice(0, 7);
    ventasPorMes.set(mes, (ventasPorMes.get(mes) ?? 0) + venta.total);
  }

  const comprasPorMes = new Map<string, number>();
  for (const ingreso of INGRESOS_MOCK.filter((i) => i.idsucursal === idsucursal)) {
    const mes = ingreso.fecha.slice(0, 7);
    comprasPorMes.set(mes, (comprasPorMes.get(mes) ?? 0) + ingreso.total);
  }

  return meses.map((punto) => ({
    ...punto,
    ventas: ventasPorMes.get(punto.mes) ?? punto.ventas,
    compras: comprasPorMes.get(punto.mes) ?? punto.compras,
  }));
}

export function getProductosVendidosAnoMock(
  idsucursal: number
): ProductoVendidoTop[] {
  if (idsucursal !== 1) return [];
  return [...TOP_PRODUCTOS_SUCURSAL_1];
}

export function getDashboardAnalyticsMock(
  idsucursal: number
): DashboardAnalytics {
  return {
    totales: getTotalesDiaMock(idsucursal),
    ventasUltimos15Dias: getVentasDiasMock(idsucursal),
    ventasComprasMensual: getVentasMesMock(idsucursal),
    topProductosAno: getProductosVendidosAnoMock(idsucursal),
  };
}
