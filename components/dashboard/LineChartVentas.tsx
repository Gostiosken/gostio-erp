"use client";

import type { VentaDiaPoint } from "@/lib/types/dashboard";
import { formatMonedaDashboard } from "@/lib/types/dashboard";

type LineChartVentasProps = {
  data: VentaDiaPoint[];
};

const WIDTH = 640;
const HEIGHT = 220;
const PADDING = { top: 16, right: 16, bottom: 36, left: 48 };

export default function LineChartVentas({ data }: LineChartVentasProps) {
  if (data.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-slate-500">
        Sin datos de ventas para mostrar.
      </p>
    );
  }

  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const chartWidth = WIDTH - PADDING.left - PADDING.right;
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const points = data.map((punto, index) => {
    const x =
      PADDING.left + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const y =
      PADDING.top + chartHeight - (punto.total / maxTotal) * chartHeight;
    return { x, y, ...punto };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = [
    `M ${points[0].x} ${PADDING.top + chartHeight}`,
    ...points.map((p) => `L ${p.x} ${p.y}`),
    `L ${points[points.length - 1].x} ${PADDING.top + chartHeight}`,
    "Z",
  ].join(" ");

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    value: maxTotal * ratio,
    y: PADDING.top + chartHeight - ratio * chartHeight,
  }));

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full min-w-[480px]"
        role="img"
        aria-label="Tendencia de ventas últimos 15 días"
      >
        <defs>
          <linearGradient id="ventasGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => (
          <g key={tick.value}>
            <line
              x1={PADDING.left}
              y1={tick.y}
              x2={WIDTH - PADDING.right}
              y2={tick.y}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
            <text
              x={PADDING.left - 8}
              y={tick.y + 4}
              textAnchor="end"
              className="fill-slate-400 text-[10px]"
            >
              {tick.value >= 1000
                ? `${(tick.value / 1000).toFixed(1)}k`
                : Math.round(tick.value)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#ventasGradient)" />
        <polyline
          points={polyline}
          fill="none"
          stroke="#4f46e5"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((punto) => (
          <g key={punto.fecha}>
            <circle cx={punto.x} cy={punto.y} r="4" fill="#4f46e5" />
            <title>
              {punto.fecha}: {formatMonedaDashboard(punto.total)}
            </title>
          </g>
        ))}

        {points
          .filter((_, i) => i % 3 === 0 || i === points.length - 1)
          .map((punto) => (
            <text
              key={`label-${punto.fecha}`}
              x={punto.x}
              y={HEIGHT - 10}
              textAnchor="middle"
              className="fill-slate-500 text-[9px]"
            >
              {punto.fecha.slice(5)}
            </text>
          ))}
      </svg>
    </div>
  );
}
