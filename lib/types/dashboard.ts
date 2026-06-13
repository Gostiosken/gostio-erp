import { formatMoneda as formatMonedaBase } from "@/lib/format-moneda";

export type DashboardTotales = {
  totalCompradoHoy: number;
  totalVentaContadoHoy: number;
  totalRecaudadoCreditosHoy: number;
};

export type VentaDiaPoint = {
  fecha: string;
  total: number;
};

export type VentaCompraMesPoint = {
  mes: string;
  label: string;
  ventas: number;
  compras: number;
};

export type ProductoVendidoTop = {
  idarticulo: number;
  nombre: string;
  cantidad: number;
  total: number;
};

export type DashboardAnalytics = {
  totales: DashboardTotales;
  ventasUltimos15Dias: VentaDiaPoint[];
  ventasComprasMensual: VentaCompraMesPoint[];
  topProductosAno: ProductoVendidoTop[];
};

export function formatMonedaDashboard(value: number): string {
  return formatMonedaBase(value);
}
