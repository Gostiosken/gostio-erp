"use server";

import { dbReadError, mockReadResult, shouldUseMockData } from "@/lib/action-db";
import { getPrisma } from "@/lib/prisma";
import {
  getDashboardAnalyticsMock,
  getProductosVendidosAnoMock,
  getTotalesDiaMock,
  getVentasDiasMock,
  getVentasMesMock,
} from "@/lib/data/dashboard-mock";
import type { ActionResult } from "@/lib/types/action";
import type {
  DashboardAnalytics,
  DashboardTotales,
  ProductoVendidoTop,
  VentaCompraMesPoint,
  VentaDiaPoint,
} from "@/lib/types/dashboard";

function getTodayBounds(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
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

function ultimosNMeses(n: number): { mes: string; label: string }[] {
  const meses: { mes: string; label: string }[] = [];
  const hoy = new Date();

  for (let i = n - 1; i >= 0; i -= 1) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    meses.push({
      mes: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`,
      label: fecha.toLocaleDateString("es-PY", {
        month: "short",
        year: "2-digit",
      }),
    });
  }

  return meses;
}

function toNumber(value: { toString(): string } | number | null | undefined): number {
  if (value == null) return 0;
  return Number(value);
}

export async function getTotalesDia(
  idsucursal: number
): Promise<ActionResult<DashboardTotales>> {
  if (shouldUseMockData()) {
    return mockReadResult(getTotalesDiaMock(idsucursal));
  }

  try {
    const prisma = getPrisma();
    const { start, end } = getTodayBounds();

    const [compras, ventasContado, creditos] = await Promise.all([
      prisma.ingreso.aggregate({
        where: {
          idsucursal,
          fecha: { gte: start, lt: end },
          estado: "Aceptado",
        },
        _sum: { total: true },
      }),
      prisma.venta.aggregate({
        where: {
          tipo_venta: "Contado",
          fecha: { gte: start, lt: end },
          estado: "Aceptado",
          pedido: { idsucursal },
        },
        _sum: { total: true },
      }),
      prisma.credito.aggregate({
        where: {
          fecha: { gte: start, lt: end },
          venta: { pedido: { idsucursal } },
        },
        _sum: { total_pago: true },
      }),
    ]);

    return {
      success: true,
      data: {
        totalCompradoHoy: toNumber(compras._sum.total),
        totalVentaContadoHoy: toNumber(ventasContado._sum.total),
        totalRecaudadoCreditosHoy: toNumber(creditos._sum.total_pago),
      },
    };
  } catch (error) {
    if (shouldUseMockData()) return mockReadResult(getTotalesDiaMock(idsucursal));
    return dbReadError<DashboardTotales>(
      "No se pudieron obtener los totales del día.",
      error
    );
  }
}

export async function getVentasDias(
  idsucursal: number
): Promise<ActionResult<VentaDiaPoint[]>> {
  if (shouldUseMockData()) {
    return mockReadResult(getVentasDiasMock(idsucursal));
  }

  try {
    const prisma = getPrisma();
    const dias = ultimosNDias(15);
    const inicio = new Date(dias[0]);
    inicio.setHours(0, 0, 0, 0);

    const ventas = await prisma.venta.findMany({
      where: {
        fecha: { gte: inicio },
        estado: "Aceptado",
        pedido: { idsucursal },
      },
      select: { fecha: true, total: true },
    });

    const totalesPorDia = new Map<string, number>();
    for (const venta of ventas) {
      const fecha = venta.fecha.toISOString().slice(0, 10);
      totalesPorDia.set(fecha, (totalesPorDia.get(fecha) ?? 0) + toNumber(venta.total));
    }

    return {
      success: true,
      data: dias.map((fecha) => ({
        fecha,
        total: totalesPorDia.get(fecha) ?? 0,
      })),
    };
  } catch (error) {
    if (shouldUseMockData()) return mockReadResult(getVentasDiasMock(idsucursal));
    return dbReadError<VentaDiaPoint[]>(
      "No se pudieron obtener las ventas por día.",
      error
    );
  }
}

export async function getVentasMes(
  idsucursal: number
): Promise<ActionResult<VentaCompraMesPoint[]>> {
  if (shouldUseMockData()) {
    return mockReadResult(getVentasMesMock(idsucursal));
  }

  try {
    const prisma = getPrisma();
    const meses = ultimosNMeses(12);
    const inicio = new Date();
    inicio.setMonth(inicio.getMonth() - 11, 1);
    inicio.setHours(0, 0, 0, 0);

    const [ventas, compras] = await Promise.all([
      prisma.venta.findMany({
        where: {
          fecha: { gte: inicio },
          estado: "Aceptado",
          pedido: { idsucursal },
        },
        select: { fecha: true, total: true },
      }),
      prisma.ingreso.findMany({
        where: {
          idsucursal,
          fecha: { gte: inicio },
          estado: "Aceptado",
        },
        select: { fecha: true, total: true },
      }),
    ]);

    const ventasPorMes = new Map<string, number>();
    for (const venta of ventas) {
      const mes = venta.fecha.toISOString().slice(0, 7);
      ventasPorMes.set(mes, (ventasPorMes.get(mes) ?? 0) + toNumber(venta.total));
    }

    const comprasPorMes = new Map<string, number>();
    for (const ingreso of compras) {
      const mes = ingreso.fecha.toISOString().slice(0, 7);
      comprasPorMes.set(mes, (comprasPorMes.get(mes) ?? 0) + toNumber(ingreso.total));
    }

    return {
      success: true,
      data: meses.map((punto) => ({
        mes: punto.mes,
        label: punto.label,
        ventas: ventasPorMes.get(punto.mes) ?? 0,
        compras: comprasPorMes.get(punto.mes) ?? 0,
      })),
    };
  } catch (error) {
    if (shouldUseMockData()) return mockReadResult(getVentasMesMock(idsucursal));
    return dbReadError<VentaCompraMesPoint[]>(
      "No se pudieron obtener las ventas y compras mensuales.",
      error
    );
  }
}

export async function getProductosVendidosAno(
  idsucursal: number
): Promise<ActionResult<ProductoVendidoTop[]>> {
  if (shouldUseMockData()) {
    return mockReadResult(getProductosVendidosAnoMock(idsucursal));
  }

  try {
    const prisma = getPrisma();
    const anio = new Date().getFullYear();
    const inicioAnio = new Date(anio, 0, 1);
    const finAnio = new Date(anio + 1, 0, 1);

    const detalles = await prisma.detallePedido.findMany({
      where: {
        pedido: {
          idsucursal,
          fecha: { gte: inicioAnio, lt: finAnio },
          estado: "Aceptado",
        },
      },
      select: {
        cantidad: true,
        precio_venta: true,
        descuento: true,
        detalleIngreso: {
          select: {
            idarticulo: true,
            articulo: { select: { nombre: true } },
          },
        },
      },
    });

    const acumulado = new Map<number, ProductoVendidoTop>();

    for (const detalle of detalles) {
      const idarticulo = detalle.detalleIngreso.idarticulo;
      const nombre = detalle.detalleIngreso.articulo.nombre;
      const descuento = toNumber(detalle.descuento);
      const subtotal =
        detalle.cantidad * toNumber(detalle.precio_venta) - descuento;

      const actual = acumulado.get(idarticulo) ?? {
        idarticulo,
        nombre,
        cantidad: 0,
        total: 0,
      };

      actual.cantidad += detalle.cantidad;
      actual.total += subtotal;
      acumulado.set(idarticulo, actual);
    }

    const top = [...acumulado.values()]
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    return { success: true, data: top };
  } catch (error) {
    if (shouldUseMockData()) return mockReadResult(getProductosVendidosAnoMock(idsucursal));
    return dbReadError<ProductoVendidoTop[]>(
      "No se pudieron obtener los productos más vendidos.",
      error
    );
  }
}

export async function getDashboardAnalytics(
  idsucursal: number
): Promise<ActionResult<DashboardAnalytics>> {
  if (shouldUseMockData()) {
    return mockReadResult(getDashboardAnalyticsMock(idsucursal));
  }

  try {
    const [totales, ventasUltimos15Dias, ventasComprasMensual, topProductosAno] =
      await Promise.all([
        getTotalesDia(idsucursal),
        getVentasDias(idsucursal),
        getVentasMes(idsucursal),
        getProductosVendidosAno(idsucursal),
      ]);

    return {
      success: true,
      data: {
        totales: totales.data ?? {
          totalCompradoHoy: 0,
          totalVentaContadoHoy: 0,
          totalRecaudadoCreditosHoy: 0,
        },
        ventasUltimos15Dias: ventasUltimos15Dias.data ?? [],
        ventasComprasMensual: ventasComprasMensual.data ?? [],
        topProductosAno: topProductosAno.data ?? [],
      },
      usingMockData:
        totales.usingMockData ||
        ventasUltimos15Dias.usingMockData ||
        ventasComprasMensual.usingMockData ||
        topProductosAno.usingMockData,
    };
  } catch (error) {
    if (shouldUseMockData()) return mockReadResult(getDashboardAnalyticsMock(idsucursal));
    return dbReadError<DashboardAnalytics>(
      "No se pudieron obtener los datos del dashboard.",
      error
    );
  }
}
