"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/ui/Modal";
import {
  createCliente,
  deleteCliente,
  updateCliente,
} from "@/lib/actions/persona";
import type { Cliente, PersonaInput } from "@/lib/types/persona";
import { getPersonaEstadoLabel, isPersonaActiva } from "@/lib/types/persona";

type ClientesManagerProps = {
  initialClientes: Cliente[];
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

export default function ClientesManager({
  initialClientes,
  usingMockData = false,
}: ClientesManagerProps) {
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<Cliente | null>(null);
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

  function openEdit(cliente: Cliente) {
    setEditing(cliente);
    setForm({
      nombre: cliente.nombre,
      tipo_documento: cliente.tipo_documento,
      num_documento: cliente.num_documento,
      direccion: cliente.direccion ?? "",
      telefono: cliente.telefono ?? "",
      email: cliente.email ?? "",
      estado: cliente.estado,
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
          const nuevo: Cliente = {
            idpersona: Math.max(100, ...clientes.map((c) => c.idpersona)) + 1,
            tipo_persona: "Cliente",
            nombre: form.nombre.trim(),
            tipo_documento: form.tipo_documento,
            num_documento: form.num_documento.trim(),
            direccion: form.direccion?.trim() || null,
            telefono: form.telefono?.trim() || null,
            email: form.email?.trim() || null,
            estado: form.estado ?? "1",
          };
          setClientes((prev) => [...prev, nuevo]);
          setFeedback({
            type: "success",
            message: "Cliente registrado (modo demostración).",
          });
          closeModal();
          return;
        }

        const result = await createCliente(form);
        if (result.success && result.data) {
          setClientes((prev) => [...prev, result.data!]);
          setFeedback({ type: "success", message: "Cliente registrado correctamente." });
          closeModal();
        } else {
          setFeedback({ type: "error", message: result.error ?? "Error al registrar." });
        }
        return;
      }

      if (modalMode === "edit" && editing) {
        if (usingMockData) {
          setClientes((prev) =>
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
            message: "Cliente actualizado (modo demostración).",
          });
          closeModal();
          return;
        }

        const result = await updateCliente(editing.idpersona, form);
        if (result.success && result.data) {
          setClientes((prev) =>
            prev.map((item) =>
              item.idpersona === result.data!.idpersona ? result.data! : item
            )
          );
          setFeedback({ type: "success", message: "Cliente actualizado correctamente." });
          closeModal();
        } else {
          setFeedback({ type: "error", message: result.error ?? "Error al actualizar." });
        }
      }
    });
  }

  function handleDelete(cliente: Cliente) {
    if (!confirm(`¿Eliminar al cliente "${cliente.nombre}"?`)) return;

    setProcessingId(cliente.idpersona);
    startTransition(async () => {
      if (usingMockData) {
        setClientes((prev) =>
          prev.filter((item) => item.idpersona !== cliente.idpersona)
        );
        setFeedback({
          type: "success",
          message: "Cliente eliminado (modo demostración).",
        });
        setProcessingId(null);
        return;
      }

      const result = await deleteCliente(cliente.idpersona);
      if (result.success) {
        setClientes((prev) =>
          prev.filter((item) => item.idpersona !== cliente.idpersona)
        );
        setFeedback({ type: "success", message: "Cliente eliminado correctamente." });
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
            <p className="text-sm font-medium text-indigo-600">Fase 4 · Ventas</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clientes</h1>
            <p className="mt-1 text-sm text-slate-500">
              Administración de clientes para facturación y créditos.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            Nuevo Cliente
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
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                      No hay clientes registrados.
                    </td>
                  </tr>
                ) : (
                  clientes.map((cliente) => (
                    <tr key={cliente.idpersona} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {cliente.nombre}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {cliente.tipo_documento}: {cliente.num_documento}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {cliente.direccion ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {cliente.telefono ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {cliente.email ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isPersonaActiva(cliente.estado)
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {getPersonaEstadoLabel(cliente.estado)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(cliente)}
                            disabled={processingId === cliente.idpersona || isPending}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-60"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cliente)}
                            disabled={processingId === cliente.idpersona || isPending}
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
        title={modalMode === "edit" ? "Editar Cliente" : "Nuevo Cliente"}
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
