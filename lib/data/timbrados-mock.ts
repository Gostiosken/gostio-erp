import type { Timbrado } from "@/lib/types/timbrado";
import { formatNumeroFactura } from "@/lib/types/factura-ticket";

export const TIMBRADOS_MOCK: Timbrado[] = [
  {
    idtimbrado: 1,
    numero_timbrado: "12345678",
    idsucursal: 1,
    razon_social: "FabriColor Casa Matriz S.A.",
    ruc_emisor: "80012345-6",
    direccion: "Av. Mariscal López 1234, Asunción",
    establecimiento: "001",
    punto_expedicion: "001",
    serie: "001",
    numero_desde: 1,
    numero_hasta: 5000,
    numero_actual: 41,
    fecha_inicio: "2026-01-01",
    fecha_vencimiento: "2026-12-31",
    estado: "1",
  },
];

export function getTimbradosMockBySucursal(idsucursal: number): Timbrado[] {
  return TIMBRADOS_MOCK.filter((t) => t.idsucursal === idsucursal);
}

export function getTimbradoActivoMock(idsucursal: number): Timbrado | null {
  return (
    TIMBRADOS_MOCK.find((t) => t.idsucursal === idsucursal && t.estado === "1") ??
    null
  );
}

export function avanzarTimbradoMock(idsucursal: number): {
  timbrado: Timbrado;
  secuencial: number;
  num_factura: string;
} | null {
  const timbrado = getTimbradoActivoMock(idsucursal);
  if (!timbrado) return null;

  const secuencial = timbrado.numero_actual + 1;
  if (secuencial > timbrado.numero_hasta) return null;

  timbrado.numero_actual = secuencial;
  const num_factura = formatNumeroFactura(
    timbrado.establecimiento,
    timbrado.punto_expedicion,
    secuencial
  );

  return { timbrado, secuencial, num_factura };
}

export function getSiguienteNumeroFacturaMock(idsucursal: number): string | null {
  const timbrado = getTimbradoActivoMock(idsucursal);
  if (!timbrado) return null;

  const secuencial = timbrado.numero_actual + 1;
  if (secuencial > timbrado.numero_hasta) return null;

  return formatNumeroFactura(
    timbrado.establecimiento,
    timbrado.punto_expedicion,
    secuencial
  );
}
