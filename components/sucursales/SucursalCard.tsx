"use client";

import type { Sucursal } from "@/lib/types/sucursal";
import { getEstadoLabel, isSucursalActiva } from "@/lib/types/sucursal";

type SucursalCardProps = {
  sucursal: Sucursal;
  onEdit: (sucursal: Sucursal) => void;
  onToggleEstado: (sucursal: Sucursal) => void;
  isProcessing?: boolean;
};

export default function SucursalCard({
  sucursal,
  onEdit,
  onToggleEstado,
  isProcessing = false,
}: SucursalCardProps) {
  const activa = isSucursalActiva(sucursal.estado);

  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6"
            >
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-slate-900">
              {sucursal.razon_social}
            </h3>
            <p className="text-sm text-slate-500">
              {sucursal.tipo_documento}: {sucursal.num_documento}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            activa
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {getEstadoLabel(sucursal.estado)}
        </span>
      </div>

      <dl className="mb-5 space-y-2 text-sm">
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-slate-500">Dirección</dt>
          <dd className="text-slate-700">{sucursal.direccion}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-slate-500">Teléfono</dt>
          <dd className="text-slate-700">{sucursal.telefono}</dd>
        </div>
        {sucursal.email && (
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-slate-500">Email</dt>
            <dd className="truncate text-slate-700">{sucursal.email}</dd>
          </div>
        )}
        {sucursal.representante && (
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-slate-500">Representante</dt>
            <dd className="text-slate-700">{sucursal.representante}</dd>
          </div>
        )}
      </dl>

      <div className="mt-auto flex gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => onEdit(sucursal)}
          disabled={isProcessing}
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-60"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onToggleEstado(sucursal)}
          disabled={isProcessing}
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition disabled:opacity-60 ${
            activa
              ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          {activa ? "Desactivar" : "Activar"}
        </button>
      </div>
    </article>
  );
}
