"use client";

import { useState, useTransition } from "react";
import { updateConfiguracion } from "@/lib/actions/configuracion";
import type { ConfiguracionGlobal, ConfiguracionGlobalInput } from "@/lib/types/configuracion";

type ConfiguracionManagerProps = {
  initialConfig: ConfiguracionGlobal;
  usingMockData?: boolean;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

export default function ConfiguracionManager({
  initialConfig,
  usingMockData = false,
}: ConfiguracionManagerProps) {
  const [form, setForm] = useState<ConfiguracionGlobalInput>({
    empresa: initialConfig.empresa,
    nombre_impuesto: initialConfig.nombre_impuesto,
    porcentaje_impuesto: initialConfig.porcentaje_impuesto,
    simbolo_moneda: initialConfig.simbolo_moneda,
    logo: initialConfig.logo,
  });
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      if (usingMockData) {
        setFeedback({
          type: "success",
          message: "Configuración actualizada (modo demostración).",
        });
        return;
      }

      const result = await updateConfiguracion(form);
      if (result.success) {
        setFeedback({
          type: "success",
          message: "Configuración global actualizada correctamente.",
        });
      } else {
        setFeedback({
          type: "error",
          message: result.error ?? "No se pudo guardar la configuración.",
        });
      }
    });
  }

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <p className="text-sm font-medium text-indigo-600">Mantenimiento · Empresa</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Configuración General
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Parámetros fiscales y de identidad corporativa del ERP.
        </p>
      </header>

      <main className="px-6 py-8 lg:px-8">
        {usingMockData && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Modo demostración: los cambios no se persisten en PostgreSQL.
          </div>
        )}

        {feedback && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8"
        >
          <div>
            <label htmlFor="empresa" className="mb-1.5 block text-sm font-medium text-slate-700">
              Razón social / Empresa *
            </label>
            <input
              id="empresa"
              type="text"
              required
              value={form.empresa}
              onChange={(e) => setForm((prev) => ({ ...prev, empresa: e.target.value }))}
              className={inputClassName}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="nombre_impuesto"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Nombre del impuesto *
              </label>
              <input
                id="nombre_impuesto"
                type="text"
                required
                value={form.nombre_impuesto}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nombre_impuesto: e.target.value }))
                }
                placeholder="Ej. IVA"
                className={inputClassName}
              />
            </div>
            <div>
              <label
                htmlFor="porcentaje_impuesto"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Porcentaje (%) *
              </label>
              <input
                id="porcentaje_impuesto"
                type="number"
                required
                min={0}
                max={100}
                step={0.01}
                value={form.porcentaje_impuesto}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    porcentaje_impuesto: Number.parseFloat(e.target.value) || 0,
                  }))
                }
                className={inputClassName}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="simbolo_moneda"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Símbolo de moneda *
              </label>
              <input
                id="simbolo_moneda"
                type="text"
                required
                maxLength={5}
                value={form.simbolo_moneda}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, simbolo_moneda: e.target.value }))
                }
                placeholder="Ej. Gs."
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="logo" className="mb-1.5 block text-sm font-medium text-slate-700">
                Ruta del logo
              </label>
              <input
                id="logo"
                type="text"
                value={form.logo ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, logo: e.target.value || null }))
                }
                placeholder="Ej. /img/logo-empresa.png"
                className={inputClassName}
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {isPending ? "Guardando..." : "Guardar Configuración"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
