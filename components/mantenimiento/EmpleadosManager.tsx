"use client";

import { useState, useTransition } from "react";
import Modal, {
  modalCancelButtonClassName,
  modalFormFooterClassName,
  modalSubmitButtonClassName,
} from "@/components/ui/Modal";
import PersonalTabla from "@/components/personal/PersonalTabla";
import {
  createEmpleado,
  deleteEmpleado,
  updateEmpleado,
} from "@/lib/actions/empleado";
import type { EmpleadoInput, EmpleadoListado } from "@/lib/types/usuario";

type EmpleadosManagerProps = {
  initialEmpleados: EmpleadoListado[];
  usingMockData?: boolean;
};

const EMPTY_FORM: EmpleadoInput = {
  nombre: "",
  apellidos: "",
  tipo_documento: "DNI",
  num_documento: "",
  direccion: "",
  telefono: "",
  email: "",
  foto: "",
  estado: "1",
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

type ModalMode = "create" | "edit" | null;

export default function EmpleadosManager({
  initialEmpleados,
  usingMockData = false,
}: EmpleadosManagerProps) {
  const [empleados, setEmpleados] = useState(initialEmpleados);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<EmpleadoListado | null>(null);
  const [form, setForm] = useState<EmpleadoInput>(EMPTY_FORM);
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

  function openEdit(empleado: EmpleadoListado) {
    setEditing(empleado);
    setForm({
      nombre: empleado.nombre,
      apellidos: empleado.apellidos,
      tipo_documento: empleado.tipo_documento,
      num_documento: empleado.num_documento,
      direccion: empleado.direccion ?? "",
      telefono: empleado.telefono ?? "",
      email: empleado.email ?? "",
      foto: empleado.foto ?? "",
      estado: empleado.estado,
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
          const nuevo: EmpleadoListado = {
            idempleado: Math.max(0, ...empleados.map((e) => e.idempleado)) + 1,
            ...form,
            direccion: form.direccion || null,
            telefono: form.telefono || null,
            email: form.email || null,
            foto: form.foto || null,
            estado: form.estado ?? "1",
            login: null,
          };
          setEmpleados((prev) => [...prev, nuevo]);
          setFeedback({ type: "success", message: "Empleado registrado (demo)." });
          closeModal();
          return;
        }

        const result = await createEmpleado(form);
        if (result.success && result.data) {
          setEmpleados((prev) => [...prev, { ...result.data!, login: null }]);
          setFeedback({ type: "success", message: "Empleado registrado correctamente." });
          closeModal();
        } else {
          setFeedback({ type: "error", message: result.error ?? "Error al registrar." });
        }
        return;
      }

      if (modalMode === "edit" && editing) {
        if (usingMockData) {
          setEmpleados((prev) =>
            prev.map((item) =>
              item.idempleado === editing.idempleado
                ? {
                    ...item,
                    ...form,
                    direccion: form.direccion || null,
                    telefono: form.telefono || null,
                    email: form.email || null,
                    foto: form.foto || null,
                  }
                : item
            )
          );
          setFeedback({ type: "success", message: "Empleado actualizado (demo)." });
          closeModal();
          return;
        }

        const result = await updateEmpleado(editing.idempleado, form);
        if (result.success && result.data) {
          setEmpleados((prev) =>
            prev.map((item) =>
              item.idempleado === result.data!.idempleado
                ? { ...result.data!, login: item.login }
                : item
            )
          );
          setFeedback({ type: "success", message: "Empleado actualizado correctamente." });
          closeModal();
        } else {
          setFeedback({ type: "error", message: result.error ?? "Error al actualizar." });
        }
      }
    });
  }

  function handleDelete(empleado: EmpleadoListado) {
    if (!confirm(`¿Eliminar al empleado ${empleado.apellidos}, ${empleado.nombre}?`)) return;

    setProcessingId(empleado.idempleado);
    startTransition(async () => {
      if (usingMockData) {
        setEmpleados((prev) => prev.filter((e) => e.idempleado !== empleado.idempleado));
        setFeedback({ type: "success", message: "Empleado eliminado (demo)." });
        setProcessingId(null);
        return;
      }

      const result = await deleteEmpleado(empleado.idempleado);
      if (result.success) {
        setEmpleados((prev) => prev.filter((e) => e.idempleado !== empleado.idempleado));
        setFeedback({ type: "success", message: "Empleado eliminado correctamente." });
      } else {
        setFeedback({ type: "error", message: result.error ?? "No se pudo eliminar." });
      }
      setProcessingId(null);
    });
  }

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">Mantenimiento · Personal</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Empleados</h1>
            <p className="mt-1 text-sm text-slate-500">
              Directorio de trabajadores con soporte de fotografía.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Registrar Empleado
          </button>
        </div>
      </header>

      <main className="px-6 py-8 lg:px-8">
        {usingMockData && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Modo demostración activo.
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

        <PersonalTabla
          registros={empleados}
          mostrarLogin
          onEditar={openEdit}
          onEliminar={handleDelete}
          processingId={processingId}
          isPending={isPending}
          emptyMessage="No hay empleados registrados."
        />
      </main>

      <Modal
        open={modalMode !== null}
        title={modalMode === "create" ? "Registrar empleado" : "Editar empleado"}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Nombres *</label>
              <input
                required
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Apellidos *</label>
              <input
                required
                value={form.apellidos}
                onChange={(e) => setForm((p) => ({ ...p, apellidos: e.target.value }))}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Tipo doc. *</label>
              <input
                required
                value={form.tipo_documento}
                onChange={(e) => setForm((p) => ({ ...p, tipo_documento: e.target.value }))}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">N° documento *</label>
              <input
                required
                value={form.num_documento}
                onChange={(e) => setForm((p) => ({ ...p, num_documento: e.target.value }))}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Teléfono</label>
              <input
                value={form.telefono ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
                className={inputClassName}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Ruta de foto (URL o /public)
              </label>
              <input
                value={form.foto ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, foto: e.target.value }))}
                placeholder="Ej. /img/empleados/juan-perez.jpg"
                className={inputClassName}
              />
            </div>
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
              {isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
