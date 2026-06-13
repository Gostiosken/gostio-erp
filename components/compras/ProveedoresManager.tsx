"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/ui/Modal";
import {
  createProveedor,
  deleteProveedor,
  updateProveedor,
} from "@/lib/actions/persona";
import type { PersonaInput, Proveedor } from "@/lib/types/persona";
import { getPersonaEstadoLabel, isPersonaActiva } from "@/lib/types/persona";

type ProveedoresManagerProps = {
  initialProveedores: Proveedor[];
  usingMockData?: boolean;
};

const EMPTY_FORM: PersonaInput = {
  nombre: "",
  tipo_documento: "RUC",
  num_documento: "",
  direccion: "",
  telefono: "",
  email: "",
  estado: "1",
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

const labelClassName = "mb-1.5 block text-sm font-medium text-slate-700";

type ModalMode = "create" | "edit" | null;

export default function ProveedoresManager({
  initialProveedores,
  usingMockData = false,
}: ProveedoresManagerProps) {
  const [proveedores, setProveedores] = useState<Proveedor[]>(initialProveedores);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [form, setForm] = useState<PersonaInput>(EMPTY_FORM);
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

  function openEdit(proveedor: Proveedor) {
    setEditing(proveedor);
    setForm({
      nombre: proveedor.nombre,
      tipo_documento: proveedor.tipo_documento,
      num_documento: proveedor.num_documento,
      direccion: proveedor.direccion ?? "",
      telefono: proveedor.telefono ?? "",
      email: proveedor.email ?? "",
      estado: proveedor.estado,
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
          const nuevo: Proveedor = {
            idpersona: Math.max(0, ...proveedores.map((p) => p.idpersona)) + 1,
            tipo_persona: "Proveedor",
            nombre: form.nombre.trim(),
            tipo_documento: form.tipo_documento,
            num_documento: form.num_documento.trim(),
            direccion: form.direccion?.trim() || null,
            telefono: form.telefono?.trim() || null,
            email: form.email?.trim() || null,
            estado: form.estado ?? "1",
          };
          setProveedores((prev) => [...prev, nuevo]);
          setFeedback({
            type: "success",
            message: "Proveedor registrado (modo demostración).",
          });
          closeModal();
          return;
        }

        const result = await createProveedor(form);
        if (result.success && result.data) {
          setProveedores((prev) => [...prev, result.data!]);
          setFeedback({ type: "success", message: "Proveedor registrado correctamente." });
          closeModal();
        } else {
          setFeedback({ type: "error", message: result.error ?? "Error al registrar." });
        }
        return;
      }

      if (modalMode === "edit" && editing) {
        if (usingMockData) {
          setProveedores((prev) =>
            prev.map((item) =>
              item.idpersona === editing.idpersona
                ? {
                    ...item,
                    nombre: form.nombre.trim(),
                    tipo_documento: form.tipo_documento,
                    num_documento: form.num_documento.trim(),
                    direccion: form.direccion?.trim() || null,
                    telefono: form.telefono?.trim() || null,
                    email: form.email?.trim() || null,
                    estado: form.estado ?? "1",
                  }
                : item
            )
          );
          setFeedback({
            type: "success",
            message: "Proveedor actualizado (modo demostración).",
          });
          closeModal();
          return;
        }

        const result = await updateProveedor(editing.idpersona, form);
        if (result.success && result.data) {
          setProveedores((prev) =>
            prev.map((item) =>
              item.idpersona === result.data!.idpersona ? result.data! : item
            )
          );
          setFeedback({ type: "success", message: "Proveedor actualizado correctamente." });
          closeModal();
        } else {
          setFeedback({ type: "error", message: result.error ?? "Error al actualizar." });
        }
      }
    });
  }

  function handleDelete(proveedor: Proveedor) {
    if (!confirm(`¿Eliminar al proveedor "${proveedor.nombre}"?`)) return;

    setProcessingId(proveedor.idpersona);
    startTransition(async () => {
      if (usingMockData) {
        setProveedores((prev) =>
          prev.filter((item) => item.idpersona !== proveedor.idpersona)
        );
        setFeedback({
          type: "success",
          message: "Proveedor eliminado (modo demostración).",
        });
        setProcessingId(null);
        return;
      }

      const result = await deleteProveedor(proveedor.idpersona);
      if (result.success) {
        setProveedores((prev) =>
          prev.filter((item) => item.idpersona !== proveedor.idpersona)
        );
        setFeedback({ type: "success", message: "Proveedor eliminado correctamente." });
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
            <p className="text-sm font-medium text-indigo-600">Fase 3 · Compras</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Proveedores</h1>
            <p className="mt-1 text-sm text-slate-500">
              Gestión de personas con tipo Proveedor para compras e ingresos.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            Nuevo Proveedor
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Nombre</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Documento</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Dirección</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Teléfono</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Email</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Estado</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-slate-600">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proveedores.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                      No hay proveedores registrados.
                    </td>
                  </tr>
                ) : (
                  proveedores.map((proveedor) => (
                    <tr key={proveedor.idpersona} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {proveedor.nombre}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {proveedor.tipo_documento}: {proveedor.num_documento}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {proveedor.direccion ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {proveedor.telefono ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {proveedor.email ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isPersonaActiva(proveedor.estado)
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {getPersonaEstadoLabel(proveedor.estado)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(proveedor)}
                            disabled={processingId === proveedor.idpersona || isPending}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-60"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(proveedor)}
                            disabled={processingId === proveedor.idpersona || isPending}
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
        title={modalMode === "edit" ? "Editar Proveedor" : "Nuevo Proveedor"}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nombre" className={labelClassName}>
              Nombre / Razón Social *
            </label>
            <input
              id="nombre"
              required
              maxLength={150}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={inputClassName}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tipo_documento" className={labelClassName}>
                Tipo Documento *
              </label>
              <select
                id="tipo_documento"
                value={form.tipo_documento}
                onChange={(e) => setForm({ ...form, tipo_documento: e.target.value })}
                className={inputClassName}
              >
                <option value="RUC">RUC</option>
                <option value="DNI">DNI</option>
              </select>
            </div>
            <div>
              <label htmlFor="num_documento" className={labelClassName}>
                Número *
              </label>
              <input
                id="num_documento"
                required
                maxLength={20}
                value={form.num_documento}
                onChange={(e) => setForm({ ...form, num_documento: e.target.value })}
                className={inputClassName}
              />
            </div>
          </div>
          <div>
            <label htmlFor="direccion" className={labelClassName}>
              Dirección
            </label>
            <input
              id="direccion"
              maxLength={100}
              value={form.direccion ?? ""}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              className={inputClassName}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="telefono" className={labelClassName}>
                Teléfono
              </label>
              <input
                id="telefono"
                maxLength={20}
                value={form.telefono ?? ""}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="email" className={labelClassName}>
                Email
              </label>
              <input
                id="email"
                type="email"
                maxLength={70}
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClassName}
              />
            </div>
          </div>
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {isPending ? "Guardando..." : modalMode === "edit" ? "Guardar Cambios" : "Registrar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
