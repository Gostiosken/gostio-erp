"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import BarChartComparativo from "@/components/dashboard/BarChartComparativo";
import DonutTopProductos from "@/components/dashboard/DonutTopProductos";
import LineChartVentas from "@/components/dashboard/LineChartVentas";
import { getDashboardAnalytics } from "@/lib/actions/dashboard";
import type { DashboardAnalytics } from "@/lib/types/dashboard";
import { formatMonedaDashboard } from "@/lib/types/dashboard";

type MetricCardProps = {
  title: string;
  value: string;
  subtitle: string;
  accent: "indigo" | "emerald" | "amber";
  icon: React.ReactNode;
};

const accentStyles = {
  indigo: {
    card: "from-indigo-500 to-indigo-600",
    glow: "shadow-indigo-500/20",
  },
  emerald: {
    card: "from-emerald-500 to-emerald-600",
    glow: "shadow-emerald-500/20",
  },
  amber: {
    card: "from-amber-500 to-amber-600",
    glow: "shadow-amber-500/20",
  },
};

function MetricCard({ title, value, subtitle, accent, icon }: MetricCardProps) {
  const styles = accentStyles[accent];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${styles.card} p-5 text-white shadow-lg ${styles.glow}`}
    >
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-white/70">{subtitle}</p>
        </div>
        <div className="rounded-xl bg-white/15 p-2.5">{icon}</div>
      </div>
    </div>
  );
}

function fechaHoyFormateada(): string {
  return new Date().toLocaleDateString("es-PY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DashboardManager() {
  const { session } = useAuth();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    getDashboardAnalytics(session.idsucursal).then((result) => {
      if (result.success && result.data) {
        setAnalytics(result.data);
        setUsingMockData(Boolean(result.usingMockData));
      }
      setLoading(false);
    });
  }, [session]);

  const totales = analytics?.totales;

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              Fase 5 · Analítica de negocio
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Panel de Control
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Resumen operativo ·{" "}
              <span className="font-medium text-slate-700">
                {session?.sucursalNombre ?? "—"}
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Hoy
            </p>
            <p className="mt-0.5 font-medium capitalize text-slate-800">
              {fechaHoyFormateada()}
            </p>
          </div>
        </div>
      </header>

      <main className="space-y-6 px-6 py-8 lg:px-8">
        {usingMockData && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Modo demostración: las métricas y gráficos usan datos simulados
            coherentes con el resto del ERP.
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              <p className="text-sm text-slate-500">Cargando analítica...</p>
            </div>
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard
                title="Compras del día"
                value={formatMonedaDashboard(totales?.totalCompradoHoy ?? 0)}
                subtitle="Total ingresado en compras hoy"
                accent="amber"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-6 w-6"
                  >
                    <path d="M3 7h18M3 7l2 13h14l2-13M16 11a4 4 0 0 1-8 0" />
                  </svg>
                }
              />
              <MetricCard
                title="Ventas al contado"
                value={formatMonedaDashboard(totales?.totalVentaContadoHoy ?? 0)}
                subtitle="Facturación contado del día"
                accent="emerald"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-6 w-6"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                }
              />
              <MetricCard
                title="Recaudación créditos"
                value={formatMonedaDashboard(
                  totales?.totalRecaudadoCreditosHoy ?? 0
                )}
                subtitle="Abonos de cuentas por cobrar hoy"
                accent="indigo"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-6 w-6"
                  >
                    <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    <path d="M12 8v4l3 2" />
                  </svg>
                }
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Tendencia de ventas
                    </h2>
                    <p className="text-sm text-slate-500">
                      Últimos 15 días · Monto total facturado
                    </p>
                  </div>
                </div>
                <LineChartVentas data={analytics?.ventasUltimos15Dias ?? []} />
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Compras vs Ventas
                  </h2>
                  <p className="text-sm text-slate-500">
                    Comparativo mensual · Últimos 12 meses
                  </p>
                </div>
                <BarChartComparativo data={analytics?.ventasComprasMensual ?? []} />
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Top productos del año
                  </h2>
                  <p className="text-sm text-slate-500">
                    Artículos más vendidos por unidades
                  </p>
                </div>
                <DonutTopProductos data={analytics?.topProductosAno ?? []} />
              </article>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
