import type { Timbrado } from "@/lib/types/timbrado";

export const TIMBRADOS_MOCK: Timbrado[] = [
  {
    idtimbrado: 1,
    numero_timbrado: "12345678",
    idsucursal: 1,
    serie: "001",
    numero_desde: 1,
    numero_hasta: 5000,
    numero_actual: 120,
    fecha_inicio: "2026-01-01",
    fecha_vencimiento: "2026-12-31",
    estado: "1",
  },
];

export function getTimbradosMockBySucursal(idsucursal: number): Timbrado[] {
  return TIMBRADOS_MOCK.filter((t) => t.idsucursal === idsucursal);
}
