"use client";

import type { ProductoVendidoTop } from "@/lib/types/dashboard";
import { formatMonedaDashboard } from "@/lib/types/dashboard";

const COLORES = ["#4f46e5", "#06b6d4", "#f59e0b", "#10b981", "#ec4899"];

type DonutTopProductosProps = {
  data: ProductoVendidoTop[];
};

export default function DonutTopProductos({ data }: DonutTopProductosProps) {
  if (data.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-slate-500">
        Sin productos vendidos este año.
      </p>
    );
  }

  const totalCantidad = data.reduce((acc, p) => acc + p.cantidad, 0);
  const radio = 72;
  const circunferencia = 2 * Math.PI * radio;

  const segmentos = data.reduce<
    Array<{
      producto: ProductoVendidoTop;
      color: string;
      porcentaje: number;
      dashArray: string;
      dashOffset: number;
    }>
  >((acc, producto, index) => {
    const porcentaje = producto.cantidad / totalCantidad;
    const longitud = porcentaje * circunferencia;
    const offset = acc.reduce((sum, seg) => {
      const prevLongitud = seg.porcentaje * circunferencia;
      return sum + prevLongitud;
    }, 0);

    acc.push({
      producto,
      color: COLORES[index % COLORES.length],
      porcentaje,
      dashArray: `${longitud} ${circunferencia - longitud}`,
      dashOffset: -offset,
    });

    return acc;
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center">
      <div className="relative mx-auto h-48 w-48">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle
            cx="100"
            cy="100"
            r={radio}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="28"
          />
          {segmentos.map((seg) => (
            <circle
              key={seg.producto.idarticulo}
              cx="100"
              cy="100"
              r={radio}
              fill="none"
              stroke={seg.color}
              strokeWidth="28"
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.dashOffset}
              className="transition-all duration-500"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-2xl font-bold text-slate-900">
            {totalCantidad.toLocaleString("es-PY")}
          </p>
          <p className="text-xs text-slate-500">unidades</p>
        </div>
      </div>

      <ul className="space-y-3">
        {segmentos.map((seg) => (
          <li key={seg.producto.idarticulo}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 font-medium text-slate-800">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="truncate">{seg.producto.nombre}</span>
              </span>
              <span className="shrink-0 text-slate-500">
                {(seg.porcentaje * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${seg.porcentaje * 100}%`,
                  backgroundColor: seg.color,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {seg.producto.cantidad.toLocaleString("es-PY")} uds ·{" "}
              {formatMonedaDashboard(seg.producto.total)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
