export type PersonaEstado = "1" | "0";

export type TipoPersona = "Proveedor" | "Cliente";

export interface PersonaInput {
  nombre: string;
  tipo_documento: string;
  num_documento: string;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  estado?: PersonaEstado;
}

export interface Proveedor extends PersonaInput {
  idpersona: number;
  tipo_persona: "Proveedor";
  estado: PersonaEstado;
}

export interface Cliente extends PersonaInput {
  idpersona: number;
  tipo_persona: "Cliente";
  estado: PersonaEstado;
}

export function isPersonaActiva(estado: string): boolean {
  return estado === "1";
}

export function getPersonaEstadoLabel(estado: string): string {
  return isPersonaActiva(estado) ? "Activo" : "Inactivo";
}
