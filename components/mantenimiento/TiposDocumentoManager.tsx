"use client";

import { useState, useTransition } from "react";
import Modal, {
  modalCancelButtonClassName,
  modalFormFooterClassName,
  modalSubmitButtonClassName,
} from "@/components/ui/Modal";
import {
  createTipoDocumento,
  deleteTipoDocumento,
  updateTipoDocumento,
} from "@/lib/actions/tipo-documento";
import type { TipoDocumento, TipoDocumentoInput } from "@/lib/types/tipo-documento";
import {
  getOperacionBadgeClass,
  OPERACIONES_TIPO_DOCUMENTO,
} from "@/lib/types/tipo-documento";

type TiposDocumentoManagerProps = {
  initialTipos: TipoDocumento[];
  usingMockData?: boolean;
};

const EMPTY_FORM: TipoDocumentoInput = {
  documento: "",
  operacion: "Persona",
  estado: "1",
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

type ModalMode = "create" | "edit" | null;

export default function TiposDocumentoManager({
  initialTipos,
  usingMockData = false,
}: TiposDocumentoManagerProps) {
  const [tipos, setTipos] = useState<TipoDocumento[]>(initialTipos);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<TipoDocumento | null>(null);
  const [form, setForm] = useState<TipoDocumentoInput>(EMPTY_FORM);
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

  function openEdit(tipo: TipoDocumento) {
    setEditing(tipo);
    setForm({
      documento: tipo.documento,
      operacion: tipo.operacion,
      estado: tipo.estado,
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
          const nuevo: TipoDocumento = {
            idtipo_documento:
              Math.max(0, ...tipos.map((t) => t.idtipo_documento)) + 1,
            documento: form.documento.trim().toUpperCase(),
            operacion: form.operacion,
            estado: form.estado ?? "1",
          };
          setTipos((prev) => [...prev, nuevo]);
          setFeedback({
            type: "success",
            message: "Tipo de documento registrado (modo demostración).",
          });
          closeModal();
          return;
        }

        const result = await createTipoDocumento(form);
        if (result.success && result.data) {
          setTipos((prev) => [...prev, result.data!]);
          setFeedback({
            type: "success",
            message: "Tipo de documento registrado correctamente.",
          });
          closeModal();
        } else {
          setFeedback({ type: "error", message: result.error ?? "Error al registrar." });
        }
        return;
      }

      if (modalMode === "edit" && editing) {
        if (usingMockData) {
          setTipos((prev) =>
            prev.map((item) =>
              item.idtipo_documento === editing.idtipo_documento
                ? {
                    ...item,
                    documento: form.documento.trim().toUpperCase(),
                    operacion: form.operacion,
                    estado: form.estado ?? "1",
                  }
                : item
            )
          );
          setFeedback({
            type: "success",
            message: "Tipo de documento actualizado (modo demostración).",
          });
          closeModal();
          return;
        }

        const result = await updateTipoDocumento(editing.idtipo_documento, form);
        if (result.success && result.data) {
          setTipos((prev) =>
            prev.map((item) =>
              item.idtipo_documento === result.data!.idtipo_documento
                ? result.data!
                : item
            )
          );
          setFeedback({
            type: "success",
            message: "Tipo de documento actualizado correctamente.",
          });
          closeModal();
        } else {
          setFeedback({ type: "error", message: result.error ?? "Error al actualizar." });
        }
      }
    });
  }

  function handleDelete(tipo: TipoDocumento) {
    if (!confirm(`¿Eliminar el tipo de documento "${tipo.documento}"?`)) return;

    setProcessingId(tipo.idtipo_documento);
    startTransition(async () => {
      if (usingMockData) {
        setTipos((prev) =>
          prev.filter((item) => item.idtipo_documento !== tipo.idtipo_documento)
        );
        setFeedback({
          type: "success",
          message: "Tipo de documento eliminado (modo demostración).",
        });
        setProcessingId(null);
        return;
      }

      const result = await deleteTipoDocumento(tipo.idtipo_documento);
      if (result.success) {
        setTipos((prev) =>
          prev.filter((item) => item.idtipo_documento !== tipo.idtipo_documento)
        );
        setFeedback({
          type: "success",
          message: "Tipo de documento eliminado correctamente.",
        });
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
            <p className="text-sm font-medium text-indigo-600">
              Mantenimiento · Documentos
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Tipos de Documentos y Operaciones
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Catálogo de documentos de identidad y comprobantes transaccionales.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Registrar Tipo de Documento
          </button>
        </div>
      </header>

      <main className="px-6 py-8 lg:px-8">
        {usingMockData && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Modo demostración: los tipos de documento se gestionan en datos simulados.
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
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="w-16 px-5 py-3.5 font-semibold text-slate-600">N°</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Documento</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Operación</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-slate-600">
                    Opciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tipos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-14 text-center text-slate-500">
                      No hay tipos de documento registrados.
                    </td>
                  </tr>
                ) : (
                  tipos.map((tipo, index) => (
                    <tr key={tipo.idtipo_documento} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4 text-slate-500">{index + 1}</td>
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {tipo.documento}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getOperacionBadgeClass(tipo.operacion)}`}
                        >
                          {tipo.operacion}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(tipo)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(tipo)}
                            disabled={processingId === tipo.idtipo_documento || isPending}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
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
        title={
          modalMode === "create"
            ? "Registrar tipo de documento"
            : "Editar tipo de documento"
        }
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="documento" className="mb-1.5 block text-sm font-medium text-slate-700">
              Documento *
            </label>
            <input
              id="documento"
              type="text"
              required
              maxLength={50}
              value={form.documento}
              onChange={(e) => setForm((prev) => ({ ...prev, documento: e.target.value }))}
              placeholder="Ej. RUC, FACTURA"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="operacion" className="mb-1.5 block text-sm font-medium text-slate-700">
              Operación *
            </label>
            <select
              id="operacion"
              required
              value={form.operacion}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  operacion: e.target.value as TipoDocumentoInput["operacion"],
                }))
              }
              className={inputClassName}
            >
              {OPERACIONES_TIPO_DOCUMENTO.map((operacion) => (
                <option key={operacion} value={operacion}>
                  {operacion}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Persona: identidad de clientes/proveedores · Comprobante: emisión transaccional.
            </p>
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
                  ? "Registrar"
                  : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
