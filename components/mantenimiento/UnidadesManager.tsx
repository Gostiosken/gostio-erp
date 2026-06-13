"use client";

import { useState, useTransition } from "react";
import Modal, {
  modalCancelButtonClassName,
  modalFormFooterClassName,
  modalSubmitButtonClassName,
} from "@/components/ui/Modal";
import {
  createUnidadMedida,
  deleteUnidadMedida,
  updateUnidadMedida,
} from "@/lib/actions/unidad-medida";
import type { UnidadMedida, UnidadMedidaInput } from "@/lib/types/unidad-medida";
import { getEstadoLabel, isRegistroActivo } from "@/lib/types/unidad-medida";

type UnidadesManagerProps = {
  initialUnidades: UnidadMedida[];
  usingMockData?: boolean;
};

const EMPTY_FORM: UnidadMedidaInput = { nombre: "", prefijo: "", estado: "1" };

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

type ModalMode = "create" | "edit" | null;

export default function UnidadesManager({
  initialUnidades,
  usingMockData = false,
}: UnidadesManagerProps) {
  const [unidades, setUnidades] = useState<UnidadMedida[]>(initialUnidades);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<UnidadMedida | null>(null);
  const [form, setForm] = useState<UnidadMedidaInput>(EMPTY_FORM);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalMode("create");
    setFeedback(null);
  }

  function openEdit(unidad: UnidadMedida) {
    setEditing(unidad);
    setForm({
      nombre: unidad.nombre,
      prefijo: unidad.prefijo,
      estado: unidad.estado,
    });
    setModalMode("edit");
    setFeedback(null);
  }

  function closeModal() {
    setModalMode(null);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      if (modalMode === "create") {
        if (usingMockData) {
          const nueva: UnidadMedida = {
            idunidad_medida:
              Math.max(0, ...unidades.map((u) => u.idunidad_medida)) + 1,
            nombre: form.nombre.trim(),
            prefijo: form.prefijo.trim(),
            estado: form.estado ?? "1",
          };
          setUnidades((prev) => [...prev, nueva]);
          setFeedback({
            type: "success",
            message: "Unidad registrada (modo demostración).",
          });
          closeModal();
          return;
        }

        const result = await createUnidadMedida(form);
        if (result.success && result.data) {
          setUnidades((prev) => [...prev, result.data!]);
          setFeedback({ type: "success", message: "Unidad registrada correctamente." });
          closeModal();
        } else {
          setFeedback({ type: "error", message: result.error ?? "Error al registrar." });
        }
        return;
      }

      if (modalMode === "edit" && editing) {
        if (usingMockData) {
          setUnidades((prev) =>
            prev.map((item) =>
              item.idunidad_medida === editing.idunidad_medida
                ? {
                    ...item,
                    nombre: form.nombre.trim(),
                    prefijo: form.prefijo.trim(),
                    estado: form.estado ?? "1",
                  }
                : item
            )
          );
          setFeedback({
            type: "success",
            message: "Unidad actualizada (modo demostración).",
          });
          closeModal();
          return;
        }

        const result = await updateUnidadMedida(editing.idunidad_medida, form);
        if (result.success && result.data) {
          setUnidades((prev) =>
            prev.map((item) =>
              item.idunidad_medida === result.data!.idunidad_medida
                ? result.data!
                : item
            )
          );
          setFeedback({ type: "success", message: "Unidad actualizada correctamente." });
          closeModal();
        } else {
          setFeedback({ type: "error", message: result.error ?? "Error al actualizar." });
        }
      }
    });
  }

  function handleDelete(unidad: UnidadMedida) {
    if (!confirm(`¿Eliminar la unidad "${unidad.nombre}" (${unidad.prefijo})?`)) return;

    setProcessingId(unidad.idunidad_medida);
    startTransition(async () => {
      if (usingMockData) {
        setUnidades((prev) =>
          prev.filter((item) => item.idunidad_medida !== unidad.idunidad_medida)
        );
        setFeedback({ type: "success", message: "Unidad eliminada (modo demostración)." });
        setProcessingId(null);
        return;
      }

      const result = await deleteUnidadMedida(unidad.idunidad_medida);
      if (result.success) {
        setUnidades((prev) =>
          prev.filter((item) => item.idunidad_medida !== unidad.idunidad_medida)
        );
        setFeedback({ type: "success", message: "Unidad eliminada correctamente." });
      } else {
        setFeedback({ type: "error", message: result.error ?? "Error al eliminar." });
      }
      setProcessingId(null);
    });
  }

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-600">Fase 1 · Tablas Generales</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Unidades de Medida
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Defina las unidades y prefijos para el inventario.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nueva Unidad
          </button>
        </div>
      </header>

      <main className="px-6 py-8 lg:px-8">
        {usingMockData && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Modo demostración: datos simulados activos.
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
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-5 py-3.5 font-semibold text-slate-600">#</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600">Nombre</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600">Prefijo</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600">Estado</th>
                <th className="px-5 py-3.5 text-right font-semibold text-slate-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unidades.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    No hay unidades de medida registradas.
                  </td>
                </tr>
              ) : (
                unidades.map((unidad, index) => (
                  <tr key={unidad.idunidad_medida} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4 text-slate-400">{index + 1}</td>
                    <td className="px-5 py-4 font-medium text-slate-900">{unidad.nombre}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-lg bg-indigo-50 px-2.5 py-1 font-mono text-xs font-semibold text-indigo-700">
                        {unidad.prefijo}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isRegistroActivo(unidad.estado)
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {getEstadoLabel(unidad.estado)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(unidad)}
                          disabled={processingId === unidad.idunidad_medida || isPending}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-60"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(unidad)}
                          disabled={processingId === unidad.idunidad_medida || isPending}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          Eliminar
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
        title={modalMode === "edit" ? "Editar Unidad de Medida" : "Nueva Unidad de Medida"}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nombre" className="mb-1.5 block text-sm font-medium text-slate-700">
              Nombre *
            </label>
            <input
              id="nombre"
              type="text"
              required
              maxLength={30}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={inputClassName}
              placeholder="Ej. Unidad"
            />
          </div>
          <div>
            <label htmlFor="prefijo" className="mb-1.5 block text-sm font-medium text-slate-700">
              Prefijo *
            </label>
            <input
              id="prefijo"
              type="text"
              required
              maxLength={5}
              value={form.prefijo}
              onChange={(e) => setForm({ ...form, prefijo: e.target.value })}
              className={inputClassName}
              placeholder="Ej. Und"
            />
            <p className="mt-1 text-xs text-slate-500">
              Abreviatura corta (máx. 5 caracteres). Ej: Unidad → Und, Caja → Cja
            </p>
          </div>
          <div>
            <label htmlFor="estado" className="mb-1.5 block text-sm font-medium text-slate-700">
              Estado
            </label>
            <select
              id="estado"
              value={form.estado ?? "1"}
              onChange={(e) =>
                setForm({ ...form, estado: e.target.value as UnidadMedidaInput["estado"] })
              }
              className={inputClassName}
            >
              <option value="1">Activo</option>
              <option value="0">Inactivo</option>
            </select>
          </div>
          <div className={modalFormFooterClassName}>
            <button type="button" onClick={closeModal} className={modalCancelButtonClassName}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={modalSubmitButtonClassName}
            >
              {isPending ? "Guardando..." : modalMode === "edit" ? "Guardar Cambios" : "Registrar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
