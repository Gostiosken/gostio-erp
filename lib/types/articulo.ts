export type ArticuloEstado = "1" | "0" | "N";

export interface ArticuloCategoriaRelacion {
  idcategoria: number;
  nombre: string;
}

export interface ArticuloUnidadMedidaRelacion {
  idunidad_medida: number;
  nombre: string;
  prefijo: string;
}

export interface ArticuloInput {
  idcategoria: number;
  idunidad_medida: number;
  nombre: string;
  descripcion?: string | null;
  imagen?: string | null;
  estado?: ArticuloEstado;
}

export interface Articulo extends ArticuloInput {
  idarticulo: number;
  estado: ArticuloEstado;
  categoria: ArticuloCategoriaRelacion;
  unidadMedida: ArticuloUnidadMedidaRelacion;
}

export function isArticuloActivo(estado: string): boolean {
  return estado === "1";
}

export function isArticuloEliminado(estado: string): boolean {
  return estado === "N";
}

export function getArticuloEstadoLabel(estado: string): string {
  if (estado === "N") return "Eliminado";
  if (estado === "1") return "Activo";
  if (estado === "0") return "Inactivo";
  return estado;
}
