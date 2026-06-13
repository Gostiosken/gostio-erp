export type TimbradoEstado = "1" | "0";

export interface Timbrado {
  idtimbrado: number;
  numero_timbrado: string;
  idsucursal: number;
  serie: string;
  numero_desde: number;
  numero_hasta: number;
  numero_actual: number;
  fecha_inicio: string;
  fecha_vencimiento: string;
  estado: TimbradoEstado;
}

export interface TimbradoInput {
  numero_timbrado: string;
  idsucursal: number;
  serie: string;
  numero_desde: number;
  numero_hasta: number;
  numero_actual: number;
  fecha_inicio: string;
  fecha_vencimiento: string;
  estado?: TimbradoEstado;
}

export interface ValidacionTimbradoResult {
  valido: boolean;
  mensaje?: string;
  idtimbrado?: number;
}

export function isTimbradoActivo(estado: string): boolean {
  return estado === "1";
}

export function getEstadoTimbradoLabel(estado: string): string {
  return estado === "1" ? "Activo" : "Inactivo";
}

export function formatRangoTimbrado(desde: number, hasta: number): string {
  return `${desde.toLocaleString("es-PY")} - ${hasta.toLocaleString("es-PY")}`;
}

export type AlertaVencimientoTimbrado = "ok" | "proximo" | "vencido";

export function getAlertaVencimiento(fechaVencimiento: string): AlertaVencimientoTimbrado {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const vencimiento = new Date(`${fechaVencimiento}T00:00:00`);
  if (Number.isNaN(vencimiento.getTime())) return "ok";

  const diffMs = vencimiento.getTime() - hoy.getTime();
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return "vencido";
  if (diffDias <= 30) return "proximo";
  return "ok";
}

export function getDiasParaVencimiento(fechaVencimiento: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vencimiento = new Date(`${fechaVencimiento}T00:00:00`);
  return Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}
