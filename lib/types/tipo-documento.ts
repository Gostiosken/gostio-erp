export type TipoDocumentoEstado = "1" | "0";

export const OPERACIONES_TIPO_DOCUMENTO = ["Persona", "Comprobante"] as const;

export type OperacionTipoDocumento = (typeof OPERACIONES_TIPO_DOCUMENTO)[number];

export interface TipoDocumento {
  idtipo_documento: number;
  documento: string;
  operacion: OperacionTipoDocumento;
  estado: TipoDocumentoEstado;
}

export interface TipoDocumentoInput {
  documento: string;
  operacion: OperacionTipoDocumento;
  estado?: TipoDocumentoEstado;
}

export function isOperacionTipoDocumento(
  value: string
): value is OperacionTipoDocumento {
  return OPERACIONES_TIPO_DOCUMENTO.includes(value as OperacionTipoDocumento);
}

export function isTipoDocumentoActivo(estado: string): boolean {
  return estado === "1";
}

export function getEstadoTipoDocumentoLabel(estado: string): string {
  return estado === "1" ? "Activo" : "Inactivo";
}

export function getOperacionBadgeClass(operacion: OperacionTipoDocumento): string {
  return operacion === "Persona"
    ? "bg-sky-100 text-sky-800"
    : "bg-violet-100 text-violet-800";
}
