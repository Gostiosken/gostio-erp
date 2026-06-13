"use client";

import type { VentaCompraMesPoint } from "@/lib/types/dashboard";
import { formatMonedaDashboard } from "@/lib/types/dashboard";

type BarChartComparativoProps = {
  data: VentaCompraMesPoint[];
};

export default function BarChartComparativo({ data }: BarChartComparativoProps) {
  if (data.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-slate-500">
        Sin datos mensuales para mostrar.
      </p>
    );
  }

  const maxValor = Math.max(
    ...data.flatMap((d) => [d.ventas, d.compras]),
    1
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
          Ventas
        </span>
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
          Compras
        </span>
      </div>

      <div className="flex h-56 items-end gap-2 overflow-x-auto pb-2 sm:gap-3">
        {data.map((mes) => {
          const alturaVentas = (mes.ventas / maxValor) * 100;
          const alturaCompras = (mes.compras / maxValor) * 100;

          return (
            <div
              key={mes.mes}
              className="flex min-w-[44px] flex-1 flex-col items-center gap-1"
            >
              <div className="flex h-44 w-full items-end justify-center gap-1">
                <div
                  className="w-3 rounded-t-md bg-indigo-500 transition-all hover:bg-indigo-400 sm:w-4"
                  style={{ height: `${alturaVentas}%` }}
                  title={`Ventas ${mes.label}: ${formatMonedaDashboard(mes.ventas)}`}
                />
                <div
                  className="w-3 rounded-t-md bg-amber-500 transition-all hover:bg-amber-400 sm:w-4"
                  style={{ height: `${alturaCompras}%` }}
                  title={`Compras ${mes.label}: ${formatMonedaDashboard(mes.compras)}`}
                />
              </div>
              <span className="text-[10px] font-medium text-slate-500">
                {mes.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
