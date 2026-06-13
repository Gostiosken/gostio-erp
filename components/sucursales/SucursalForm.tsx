"use client";

import type { Sucursal, SucursalInput, TipoDocumento } from "@/lib/types/sucursal";
import { TIPOS_DOCUMENTO } from "@/lib/types/sucursal";
import {
  modalCancelButtonClassName,
  modalFormFooterClassName,
  modalSubmitButtonClassName,
} from "@/components/ui/Modal";

export const EMPTY_SUCURSAL_FORM: SucursalInput = {
  razon_social: "",
  tipo_documento: "RUC",
  num_documento: "",
  direccion: "",
  telefono: "",
  email: "",
  representante: "",
  logo: "",
  estado: "1",
};

type SucursalFormProps = {
  form: SucursalInput;
  onChange: (form: SucursalInput) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
  submitLabel: string;
  isSubmitting?: boolean;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

const labelClassName = "mb-1.5 block text-sm font-medium text-slate-700";

export function sucursalToForm(sucursal: Sucursal): SucursalInput {
  return {
    razon_social: sucursal.razon_social,
    tipo_documento: sucursal.tipo_documento,
    num_documento: sucursal.num_documento,
    direccion: sucursal.direccion,
    telefono: sucursal.telefono,
    email: sucursal.email ?? "",
    representante: sucursal.representante ?? "",
    logo: sucursal.logo ?? "",
    estado: sucursal.estado,
  };
}

export default function SucursalForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  isSubmitting = false,
}: SucursalFormProps) {
  function updateField<K extends keyof SucursalInput>(
    field: K,
    value: SucursalInput[K]
  ) {
    onChange({ ...form, [field]: value });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="razon_social" className={labelClassName}>
            Razón Social *
          </label>
          <input
            id="razon_social"
            type="text"
            required
            maxLength={150}
            value={form.razon_social}
            onChange={(e) => updateField("razon_social", e.target.value)}
            className={inputClassName}
            placeholder="Ej. Distribuidora Lima Norte S.A.C."
          />
        </div>

        <div>
          <label htmlFor="tipo_documento" className={labelClassName}>
            Tipo de Documento *
          </label>
          <select
            id="tipo_documento"
            required
            value={form.tipo_documento}
            onChange={(e) =>
              updateField("tipo_documento", e.target.value as TipoDocumento)
            }
            className={inputClassName}
          >
            {TIPOS_DOCUMENTO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="num_documento" className={labelClassName}>
            Número de Documento *
          </label>
          <input
            id="num_documento"
            type="text"
            required
            maxLength={20}
            value={form.num_documento}
            onChange={(e) => updateField("num_documento", e.target.value)}
            className={inputClassName}
            placeholder={form.tipo_documento === "RUC" ? "20123456789" : "12345678"}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="direccion" className={labelClassName}>
            Dirección *
          </label>
          <input
            id="direccion"
            type="text"
            required
            maxLength={100}
            value={form.direccion}
            onChange={(e) => updateField("direccion", e.target.value)}
            className={inputClassName}
            placeholder="Av. Principal 123, Distrito"
          />
        </div>

        <div>
          <label htmlFor="telefono" className={labelClassName}>
            Teléfono *
          </label>
          <input
            id="telefono"
            type="tel"
            required
            maxLength={20}
            value={form.telefono}
            onChange={(e) => updateField("telefono", e.target.value)}
            className={inputClassName}
            placeholder="01-555-0101"
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClassName}>
            Correo Electrónico
          </label>
          <input
            id="email"
            type="email"
            maxLength={70}
            value={form.email ?? ""}
            onChange={(e) => updateField("email", e.target.value)}
            className={inputClassName}
            placeholder="contacto@empresa.com"
          />
        </div>

        <div>
          <label htmlFor="representante" className={labelClassName}>
            Representante Legal
          </label>
          <input
            id="representante"
            type="text"
            maxLength={150}
            value={form.representante ?? ""}
            onChange={(e) => updateField("representante", e.target.value)}
            className={inputClassName}
            placeholder="Nombre del representante"
          />
        </div>

        <div>
          <label htmlFor="logo" className={labelClassName}>
            Logo (URL o ruta)
          </label>
          <input
            id="logo"
            type="text"
            maxLength={50}
            value={form.logo ?? ""}
            onChange={(e) => updateField("logo", e.target.value)}
            className={inputClassName}
            placeholder="/logos/sucursal.png"
          />
        </div>
      </div>

      <div className={modalFormFooterClassName}>
        {onCancel && (
          <button type="button" onClick={onCancel} className={modalCancelButtonClassName}>
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className={modalSubmitButtonClassName}
        >
          {isSubmitting ? "Guardando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
