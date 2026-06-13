"use client";

import { useState, useTransition } from "react";
import Modal, {
  modalCancelButtonClassName,
  modalFormFooterClassName,
  modalSubmitButtonClassName,
} from "@/components/ui/Modal";
import {
  createCategoria,
  deleteCategoria,
  updateCategoria,
} from "@/lib/actions/categoria";
import type { Categoria, CategoriaInput } from "@/lib/types/categoria";
import { getEstadoLabel, isRegistroActivo } from "@/lib/types/categoria";

type CategoriasManagerProps = {
  initialCategorias: Categoria[];
  usingMockData?: boolean;
};

const EMPTY_FORM: CategoriaInput = { nombre: "", estado: "1" };

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

type ModalMode = "create" | "edit" | null;

export default function CategoriasManager({
  initialCategorias,
  usingMockData = false,
}: CategoriasManagerProps) {
  const [categorias, setCategorias] = useState<Categoria[]>(initialCategorias);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [form, setForm] = useState<CategoriaInput>(EMPTY_FORM);
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

  function openEdit(categoria: Categoria) {
    setEditing(categoria);
    setForm({ nombre: categoria.nombre, estado: categoria.estado });
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
          const nueva: Categoria = {
            idcategoria: Math.max(0, ...categorias.map((c) => c.idcategoria)) + 1,
            nombre: form.nombre.trim(),
            estado: form.estado ?? "1",
          };
          setCategorias((prev) => [...prev, nueva]);
          setFeedback({ type: "success", message: "Categoría registrada (modo demostración)." });
          closeModal();
          return;
        }

        const result = await createCategoria(form);
        if (result.success && result.data) {
          setCategorias((prev) => [...prev, result.data!]);
          setFeedback({ type: "success", message: "Categoría registrada correctamente." });
          closeModal();
        } else {
          setFeedback({ type: "error", message: result.error ?? "Error al registrar." });
        }
        return;
      }

      if (modalMode === "edit" && editing) {
        if (usingMockData) {
          setCategorias((prev) =>
            prev.map((item) =>
              item.idcategoria === editing.idcategoria
                ? { ...item, nombre: form.nombre.trim(), estado: form.estado ?? "1" }
                : item
            )
          );
          setFeedback({ type: "success", message: "Categoría actualizada (modo demostración)." });
          closeModal();
          return;
        }

        const result = await updateCategoria(editing.idcategoria, form);
        if (result.success && result.data) {
          setCategorias((prev) =>
            prev.map((item) =>
              item.idcategoria === result.data!.idcategoria ? result.data! : item
            )
          );
          setFeedback({ type: "success", message: "Categoría actualizada correctamente." });
          closeModal();
        } else {
          setFeedback({ type: "error", message: result.error ?? "Error al actualizar." });
        }
      }
    });
  }

  function handleDelete(categoria: Categoria) {
    if (!confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) return;

    setProcessingId(categoria.idcategoria);
    startTransition(async () => {
      if (usingMockData) {
        setCategorias((prev) =>
          prev.filter((item) => item.idcategoria !== categoria.idcategoria)
        );
        setFeedback({ type: "success", message: "Categoría eliminada (modo demostración)." });
        setProcessingId(null);
        return;
      }

      const result = await deleteCategoria(categoria.idcategoria);
      if (result.success) {
        setCategorias((prev) =>
          prev.filter((item) => item.idcategoria !== categoria.idcategoria)
        );
        setFeedback({ type: "success", message: "Categoría eliminada correctamente." });
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Categorías</h1>
            <p className="mt-1 text-sm text-slate-500">
              Clasificación de artículos del inventario.
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
            Nueva Categoría
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
                <th className="px-5 py-3.5 font-semibold text-slate-600">Estado</th>
                <th className="px-5 py-3.5 text-right font-semibold text-slate-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categorias.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-slate-500">
                    No hay categorías registradas.
                  </td>
                </tr>
              ) : (
                categorias.map((categoria, index) => (
                  <tr key={categoria.idcategoria} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4 text-slate-400">{index + 1}</td>
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {categoria.nombre}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isRegistroActivo(categoria.estado)
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {getEstadoLabel(categoria.estado)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(categoria)}
                          disabled={processingId === categoria.idcategoria || isPending}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-60"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(categoria)}
                          disabled={processingId === categoria.idcategoria || isPending}
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
        title={modalMode === "edit" ? "Editar Categoría" : "Nueva Categoría"}
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
              maxLength={50}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={inputClassName}
              placeholder="Ej. Bebidas"
            />
          </div>
          <div>
            <label htmlFor="estado" className="mb-1.5 block text-sm font-medium text-slate-700">
              Estado
            </label>
            <select
              id="estado"
              value={form.estado ?? "1"}
              onChange={(e) =>
                setForm({ ...form, estado: e.target.value as CategoriaInput["estado"] })
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
