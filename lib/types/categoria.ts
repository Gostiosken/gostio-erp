export type RegistroEstado = "1" | "0";

export interface CategoriaInput {
  nombre: string;
  estado?: RegistroEstado;
}

export interface Categoria extends CategoriaInput {
  idcategoria: number;
  estado: RegistroEstado;
}

export function isRegistroActivo(estado: string): boolean {
  return estado === "1";
}

export function getEstadoLabel(estado: string): string {
  return isRegistroActivo(estado) ? "Activo" : "Inactivo";
}
