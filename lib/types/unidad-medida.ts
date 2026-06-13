import type { RegistroEstado } from "@/lib/types/categoria";
import { getEstadoLabel, isRegistroActivo } from "@/lib/types/categoria";

export type { RegistroEstado };
export { getEstadoLabel, isRegistroActivo };

export interface UnidadMedidaInput {
  nombre: string;
  prefijo: string;
  estado?: RegistroEstado;
}

export interface UnidadMedida extends UnidadMedidaInput {
  idunidad_medida: number;
  estado: RegistroEstado;
}
