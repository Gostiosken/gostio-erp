"use client";

import { useEffect } from "react";

type ToastProps = {
  visible: boolean;
  message: string;
  type?: "success" | "error";
  onClose: () => void;
  durationMs?: number;
};

export default function Toast({
  visible,
  message,
  type = "success",
  onClose,
  durationMs = 4500,
}: ToastProps) {
  useEffect(() => {
    if (!visible) return;

    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [visible, durationMs, onClose]);

  if (!visible) return null;

  const esExito = type === "success";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[100] max-w-sm"
    >
      <div
        className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl ${
          esExito
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-red-200 bg-red-50 text-red-900"
        }`}
      >
        <span
          className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            esExito ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          }`}
        >
          {esExito ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {esExito ? "Operación completada" : "Ocurrió un problema"}
          </p>
          <p className="mt-0.5 text-sm opacity-90">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-current opacity-60 transition hover:opacity-100"
          aria-label="Cerrar notificación"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
