"use client";

import { useState, useTransition } from "react";
import {
  createSucursal,
  toggleEstadoSucursal,
  updateSucursal,
} from "@/lib/actions/sucursal";
import type { Sucursal, SucursalInput } from "@/lib/types/sucursal";
import SucursalCard from "./SucursalCard";
import SucursalForm, {
  EMPTY_SUCURSAL_FORM,
  sucursalToForm,
} from "./SucursalForm";
import SucursalModal from "./SucursalModal";

type SucursalesManagerProps = {
  initialSucursales: Sucursal[];
  usingMockData?: boolean;
};

type ModalMode = "create" | "edit" | null;

export default function SucursalesManager({
  initialSucursales,
  usingMockData = false,
}: SucursalesManagerProps) {
  const [sucursales, setSucursales] = useState<Sucursal[]>(initialSucursales);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);
  const [form, setForm] = useState<SucursalInput>(EMPTY_SUCURSAL_FORM);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreateModal() {
    setEditingSucursal(null);
    setForm(EMPTY_SUCURSAL_FORM);
    setModalMode("create");
    setFeedback(null);
  }

  function openEditModal(sucursal: Sucursal) {
    setEditingSucursal(sucursal);
    setForm(sucursalToForm(sucursal));
    setModalMode("edit");
    setFeedback(null);
  }

  function closeModal() {
    setModalMode(null);
    setEditingSucursal(null);
    setForm(EMPTY_SUCURSAL_FORM);
  }

  function handleCreateMock(input: SucursalInput) {
    const nuevaSucursal: Sucursal = {
      idsucursal: Math.max(0, ...sucursales.map((s) => s.idsucursal)) + 1,
      ...input,
      email: input.email || null,
      representante: input.representante || null,
      logo: input.logo || null,
      estado: input.estado ?? "1",
    };
    setSucursales((prev) => [...prev, nuevaSucursal]);
    setFeedback({
      type: "success",
      message: "Sucursal registrada (modo demostración).",
    });
    closeModal();
  }

  function handleUpdateMock(id: number, input: SucursalInput) {
    setSucursales((prev) =>
      prev.map((item) =>
        item.idsucursal === id
          ? {
              ...item,
              ...input,
              email: input.email || null,
              representante: input.representante || null,
              logo: input.logo || null,
            }
          : item
      )
    );
    setFeedback({
      type: "success",
      message: "Sucursal actualizada (modo demostración).",
    });
    closeModal();
  }

  function handleToggleMock(sucursal: Sucursal) {
    setSucursales((prev) =>
      prev.map((item) =>
        item.idsucursal === sucursal.idsucursal
          ? { ...item, estado: item.estado === "1" ? "0" : "1" }
          : item
      )
    );
    setFeedback({
      type: "success",
      message: `Estado de "${sucursal.razon_social}" actualizado (modo demostración).`,
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      if (modalMode === "create") {
        if (usingMockData) {
          handleCreateMock(form);
          return;
        }

        const result = await createSucursal(form);
        if (result.success && result.data) {
          setSucursales((prev) => [...prev, result.data!]);
          setFeedback({ type: "success", message: "Sucursal registrada correctamente." });
          closeModal();
        } else {
          setFeedback({
            type: "error",
            message: result.error ?? "Error al registrar la sucursal.",
          });
        }
        return;
      }

      if (modalMode === "edit" && editingSucursal) {
        if (usingMockData) {
          handleUpdateMock(editingSucursal.idsucursal, form);
          return;
        }

        const result = await updateSucursal(editingSucursal.idsucursal, form);
        if (result.success && result.data) {
          setSucursales((prev) =>
            prev.map((item) =>
              item.idsucursal === result.data!.idsucursal ? result.data! : item
            )
          );
          setFeedback({ type: "success", message: "Sucursal actualizada correctamente." });
          closeModal();
        } else {
          setFeedback({
            type: "error",
            message: result.error ?? "Error al actualizar la sucursal.",
          });
        }
      }
    });
  }

  function handleToggleEstado(sucursal: Sucursal) {
    setProcessingId(sucursal.idsucursal);

    startTransition(async () => {
      if (usingMockData) {
        handleToggleMock(sucursal);
        setProcessingId(null);
        return;
      }

      const result = await toggleEstadoSucursal(sucursal.idsucursal);
      if (result.success && result.data) {
        setSucursales((prev) =>
          prev.map((item) =>
            item.idsucursal === result.data!.idsucursal ? result.data! : item
          )
        );
        setFeedback({
          type: "success",
          message: `Estado de "${sucursal.razon_social}" actualizado.`,
        });
      } else {
        setFeedback({
          type: "error",
          message: result.error ?? "Error al cambiar el estado.",
        });
      }
      setProcessingId(null);
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-medium text-indigo-600">Fase 1 · Configuración Global</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Gestión de Sucursales
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Administre las sucursales de su empresa y su información fiscal.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
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
            Registrar Nueva Sucursal
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {usingMockData && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Modo demostración: se muestran datos simulados. Configure{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
              DATABASE_URL
            </code>{" "}
            y ejecute las migraciones para conectar con PostgreSQL.
          </div>
        )}

        {feedback && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : feedback.type === "error"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-sky-200 bg-sky-50 text-sky-800"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Sucursales registradas
            </h2>
            <p className="text-sm text-slate-500">
              {sucursales.length} sucursal{sucursales.length !== 1 ? "es" : ""} en total
            </p>
          </div>
        </div>

        {sucursales.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-7 w-7"
              >
                <path d="M3 21h18M5 21V7l7-4 7 4v14" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              No hay sucursales registradas
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Comience registrando su primera sucursal para el ERP.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-6 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Registrar Nueva Sucursal
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {sucursales.map((sucursal) => (
              <SucursalCard
                key={sucursal.idsucursal}
                sucursal={sucursal}
                onEdit={openEditModal}
                onToggleEstado={handleToggleEstado}
                isProcessing={processingId === sucursal.idsucursal || isPending}
              />
            ))}
          </div>
        )}
      </main>

      <SucursalModal
        open={modalMode !== null}
        title={
          modalMode === "edit"
            ? "Editar Sucursal"
            : "Registrar Nueva Sucursal"
        }
        onClose={closeModal}
      >
        <SucursalForm
          form={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          submitLabel={modalMode === "edit" ? "Guardar Cambios" : "Registrar Sucursal"}
          isSubmitting={isPending}
        />
      </SucursalModal>
    </div>
  );
}
