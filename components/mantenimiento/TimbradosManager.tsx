"use client";

import { useEffect, useState, useTransition } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import Modal, {
  modalCancelButtonClassName,
  modalFormFooterClassName,
  modalSubmitButtonClassName,
} from "@/components/ui/Modal";
import {
  createTimbrado,
  getTimbrados,
  toggleEstadoTimbrado,
  updateTimbrado,
} from "@/lib/actions/timbrado";
import type { Timbrado, TimbradoInput } from "@/lib/types/timbrado";
import {
  formatRangoTimbrado,
  getAlertaVencimiento,
  getDiasParaVencimiento,
  getEstadoTimbradoLabel,
  isTimbradoActivo,
} from "@/lib/types/timbrado";

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

type ModalMode = "create" | "edit" | null;

function buildEmptyForm(idsucursal: number): TimbradoInput {
  const hoy = new Date().toISOString().slice(0, 10);
  return {
    numero_timbrado: "",
    idsucursal,
    serie: "",
    numero_desde: 1,
    numero_hasta: 1,
    numero_actual: 1,
    fecha_inicio: hoy,
    fecha_vencimiento: hoy,
    estado: "1",
  };
}

function VencimientoBadge({ fecha }: { fecha: string }) {
  const alerta = getAlertaVencimiento(fecha);
  const dias = getDiasParaVencimiento(fecha);

  if (alerta === "vencido") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
        Vencido
      </span>
    );
  }

  if (alerta === "proximo") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
        Vence en {dias} día{dias === 1 ? "" : "s"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      Vigente
    </span>
  );
}

function getRowAlertClass(fecha: string): string {
  const alerta = getAlertaVencimiento(fecha);
  if (alerta === "vencido") return "bg-red-50/80";
  if (alerta === "proximo") return "bg-amber-50/70";
  return "";
}

export default function TimbradosManager() {
  const { session } = useAuth();
  const [timbrados, setTimbrados] = useState<Timbrado[]>([]);
  const [usingMockData, setUsingMockData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<Timbrado | null>(null);
  const [form, setForm] = useState<TimbradoInput>(buildEmptyForm(1));
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!session) return;

    getTimbrados(session.idsucursal).then((result) => {
      if (result.success && result.data) {
        setTimbrados(result.data);
        setUsingMockData(Boolean(result.usingMockData));
      }
      setLoading(false);
    });
  }, [session]);

  function openCreate() {
    if (!session) return;
    setEditing(null);
    setForm(buildEmptyForm(session.idsucursal));
    setModalMode("create");
    setFeedback(null);
  }

  function openEdit(timbrado: Timbrado) {
    setEditing(timbrado);
    setForm({
      numero_timbrado: timbrado.numero_timbrado,
      idsucursal: timbrado.idsucursal,
      serie: timbrado.serie,
      numero_desde: timbrado.numero_desde,
      numero_hasta: timbrado.numero_hasta,
      numero_actual: timbrado.numero_actual,
      fecha_inicio: timbrado.fecha_inicio,
      fecha_vencimiento: timbrado.fecha_vencimiento,
      estado: timbrado.estado,
    });
    setModalMode("edit");
    setFeedback(null);
  }

  function closeModal() {
    setModalMode(null);
    setEditing(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;

    const payload: TimbradoInput = {
      ...form,
      idsucursal: session.idsucursal,
      numero_timbrado: form.numero_timbrado.trim(),
      serie: form.serie.trim(),
    };

    startTransition(async () => {
      if (modalMode === "create") {
        const result = await createTimbrado(payload);
        if (result.success && result.data) {
          setTimbrados((prev) => [result.data!, ...prev]);
          setFeedback({ type: "success", message: "Timbrado registrado correctamente." });
          closeModal();
        } else {
          setFeedback({ type: "error", message: result.error ?? "Error al registrar." });
        }
        return;
      }

      if (modalMode === "edit" && editing) {
        const result = await updateTimbrado(editing.idtimbrado, payload);
        if (result.success && result.data) {
          setTimbrados((prev) =>
            prev.map((item) =>
              item.idtimbrado === result.data!.idtimbrado ? result.data! : item
            )
          );
          setFeedback({ type: "success", message: "Timbrado actualizado correctamente." });
          closeModal();
        } else {
          setFeedback({ type: "error", message: result.error ?? "Error al actualizar." });
        }
      }
    });
  }

  function handleToggleEstado(timbrado: Timbrado) {
    const accion = isTimbradoActivo(timbrado.estado) ? "desactivar" : "activar";
    if (!confirm(`¿Desea ${accion} el timbrado ${timbrado.numero_timbrado}?`)) return;

    setProcessingId(timbrado.idtimbrado);
    startTransition(async () => {
      const result = await toggleEstadoTimbrado(timbrado.idtimbrado);
      if (result.success && result.data) {
        setTimbrados((prev) =>
          prev.map((item) =>
            item.idtimbrado === result.data!.idtimbrado ? result.data! : item
          )
        );
        setFeedback({
          type: "success",
          message: `Timbrado ${getEstadoTimbradoLabel(result.data.estado).toLowerCase()} correctamente.`,
        });
      } else {
        setFeedback({ type: "error", message: result.error ?? "No se pudo cambiar el estado." });
      }
      setProcessingId(null);
    });
  }

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">Mantenimiento · Timbrado</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Parámetros de Timbrado
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Sucursal:{" "}
              <span className="font-medium text-slate-700">
                {session?.sucursalNombre ?? "—"}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Cargar Parámetros de Timbrado
          </button>
        </div>
      </header>

      <main className="px-6 py-8 lg:px-8">
        {usingMockData && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Modo demostración: los timbrados se gestionan en datos simulados.
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

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto w-full whitespace-nowrap">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-5 py-3.5 font-semibold text-slate-600">N° Timbrado</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Serie</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Rango</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Correlativo Actual</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Vencimiento</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Estado</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center text-slate-500">
                      Cargando timbrados...
                    </td>
                  </tr>
                ) : timbrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center text-slate-500">
                      No hay timbrados registrados para esta sucursal.
                    </td>
                  </tr>
                ) : (
                  timbrados.map((timbrado) => (
                    <tr
                      key={timbrado.idtimbrado}
                      className={`hover:bg-slate-50/50 ${getRowAlertClass(timbrado.fecha_vencimiento)}`}
                    >
                      <td className="px-5 py-4 font-mono font-medium text-slate-900">
                        {timbrado.numero_timbrado}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                          {timbrado.serie}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {formatRangoTimbrado(timbrado.numero_desde, timbrado.numero_hasta)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-indigo-700">
                        {timbrado.numero_actual.toLocaleString("es-PY")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-slate-700">{timbrado.fecha_vencimiento}</span>
                          <VencimientoBadge fecha={timbrado.fecha_vencimiento} />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isTimbradoActivo(timbrado.estado)
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {getEstadoTimbradoLabel(timbrado.estado)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(timbrado)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleEstado(timbrado)}
                            disabled={processingId === timbrado.idtimbrado || isPending}
                            className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60"
                          >
                            {isTimbradoActivo(timbrado.estado) ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Modal
        open={modalMode !== null}
        title={
          modalMode === "create"
            ? "Cargar parámetros de timbrado"
            : "Editar parámetros de timbrado"
        }
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="numero_timbrado" className="mb-1.5 block text-sm font-medium text-slate-700">
                N° Timbrado *
              </label>
              <input
                id="numero_timbrado"
                type="text"
                required
                maxLength={20}
                value={form.numero_timbrado}
                onChange={(e) => setForm((prev) => ({ ...prev, numero_timbrado: e.target.value }))}
                placeholder="Ej. 12345678"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="serie" className="mb-1.5 block text-sm font-medium text-slate-700">
                Serie *
              </label>
              <input
                id="serie"
                type="text"
                required
                maxLength={7}
                value={form.serie}
                onChange={(e) => setForm((prev) => ({ ...prev, serie: e.target.value }))}
                placeholder="Ej. 001"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="numero_actual" className="mb-1.5 block text-sm font-medium text-slate-700">
                Correlativo actual *
              </label>
              <input
                id="numero_actual"
                type="number"
                required
                min={1}
                value={form.numero_actual}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, numero_actual: Number(e.target.value) }))
                }
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="numero_desde" className="mb-1.5 block text-sm font-medium text-slate-700">
                Número desde *
              </label>
              <input
                id="numero_desde"
                type="number"
                required
                min={1}
                value={form.numero_desde}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, numero_desde: Number(e.target.value) }))
                }
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="numero_hasta" className="mb-1.5 block text-sm font-medium text-slate-700">
                Número hasta *
              </label>
              <input
                id="numero_hasta"
                type="number"
                required
                min={1}
                value={form.numero_hasta}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, numero_hasta: Number(e.target.value) }))
                }
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="fecha_inicio" className="mb-1.5 block text-sm font-medium text-slate-700">
                Fecha de inicio *
              </label>
              <input
                id="fecha_inicio"
                type="date"
                required
                value={form.fecha_inicio}
                onChange={(e) => setForm((prev) => ({ ...prev, fecha_inicio: e.target.value }))}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="fecha_vencimiento" className="mb-1.5 block text-sm font-medium text-slate-700">
                Fecha de vencimiento *
              </label>
              <input
                id="fecha_vencimiento"
                type="date"
                required
                value={form.fecha_vencimiento}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, fecha_vencimiento: e.target.value }))
                }
                className={inputClassName}
              />
            </div>
          </div>

          <div className={modalFormFooterClassName}>
            <button
              type="button"
              onClick={closeModal}
              className={modalCancelButtonClassName}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={modalSubmitButtonClassName}
            >
              {isPending
                ? "Guardando..."
                : modalMode === "create"
                  ? "Registrar Timbrado"
                  : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
