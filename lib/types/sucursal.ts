export type TipoDocumento = "RUC" | "DNI";

export type SucursalEstado = "1" | "0";

export interface SucursalInput {
  razon_social: string;
  tipo_documento: TipoDocumento;
  num_documento: string;
  direccion: string;
  telefono: string;
  email?: string | null;
  representante?: string | null;
  logo?: string | null;
  estado?: SucursalEstado;
}

export interface Sucursal extends SucursalInput {
  idsucursal: number;
  estado: SucursalEstado;
}

export const TIPOS_DOCUMENTO: TipoDocumento[] = ["RUC", "DNI"];

export function isSucursalActiva(estado: string): boolean {
  return estado === "1";
}

export function getEstadoLabel(estado: string): string {
  return isSucursalActiva(estado) ? "Activo" : "Inactivo";
}
