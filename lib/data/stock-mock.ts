import { INGRESOS_MOCK } from "@/lib/data/ingresos-mock";
import type { LoteDisponible } from "@/lib/types/venta";
import type { TipoComprobanteVenta } from "@/lib/types/venta";
import {
  getTipoDocumentoId,
  incrementarNumeroComprobante,
} from "@/lib/types/venta";

type DocumentoSucursalMock = {
  idsucursal: number;
  idtipo_documento: number;
  ultima_serie: string;
  ultimo_numero: string;
};

export const DOCUMENTOS_SUCURSAL_MOCK: DocumentoSucursalMock[] = [
  {
    idsucursal: 1,
    idtipo_documento: 1,
    ultima_serie: "F001",
    ultimo_numero: "00000120",
  },
  {
    idsucursal: 1,
    idtipo_documento: 2,
    ultima_serie: "B001",
    ultimo_numero: "00000045",
  },
  {
    idsucursal: 2,
    idtipo_documento: 1,
    ultima_serie: "F002",
    ultimo_numero: "00000080",
  },
  {
    idsucursal: 2,
    idtipo_documento: 2,
    ultima_serie: "B002",
    ultimo_numero: "00000030",
  },
  {
    idsucursal: 3,
    idtipo_documento: 1,
    ultima_serie: "F003",
    ultimo_numero: "00000010",
  },
  {
    idsucursal: 3,
    idtipo_documento: 2,
    ultima_serie: "B003",
    ultimo_numero: "00000005",
  },
];

export function getCorrelativoMock(
  idsucursal: number,
  tipoComprobante: TipoComprobanteVenta
) {
  const idtipo = getTipoDocumentoId(tipoComprobante);
  const doc = DOCUMENTOS_SUCURSAL_MOCK.find(
    (item) => item.idsucursal === idsucursal && item.idtipo_documento === idtipo
  );

  if (!doc) {
    return {
      serie: tipoComprobante === "Factura" ? "F001" : "B001",
      numero: "00000001",
      siguienteNumero: "00000002",
    };
  }

  const siguienteNumero = incrementarNumeroComprobante(doc.ultimo_numero);
  return {
    serie: doc.ultima_serie,
    numero: siguienteNumero,
    siguienteNumero: incrementarNumeroComprobante(siguienteNumero),
  };
}

export function avanzarCorrelativoMock(
  idsucursal: number,
  tipoComprobante: TipoComprobanteVenta,
  numeroUsado: string
): void {
  const idtipo = getTipoDocumentoId(tipoComprobante);
  const doc = DOCUMENTOS_SUCURSAL_MOCK.find(
    (item) => item.idsucursal === idsucursal && item.idtipo_documento === idtipo
  );
  if (doc) {
    doc.ultimo_numero = numeroUsado;
  }
}

export function getLotesDisponiblesMock(idsucursal: number): LoteDisponible[] {
  const lotes: LoteDisponible[] = [];

  for (const ingreso of INGRESOS_MOCK.filter(
    (item) => item.idsucursal === idsucursal
  )) {
    for (const detalle of ingreso.detalles ?? []) {
      if (detalle.stock_actual > 0) {
        lotes.push({
          iddetalle_ingreso: detalle.iddetalle_ingreso,
          idarticulo: detalle.idarticulo,
          nombreArticulo: detalle.articulo?.nombre ?? detalle.descripcion ?? "Artículo",
          codigo: detalle.codigo,
          serie: detalle.serie ?? null,
          descripcion: detalle.descripcion ?? null,
          stock_actual: detalle.stock_actual,
          precio_ventapublico: detalle.precio_ventapublico,
          tipo_iva: "10",
        });
      }
    }
  }

  return lotes;
}

export function restarStockMock(
  iddetalle_ingreso: number,
  cantidad: number
): boolean {
  for (const ingreso of INGRESOS_MOCK) {
    for (const detalle of ingreso.detalles ?? []) {
      if (detalle.iddetalle_ingreso === iddetalle_ingreso) {
        if (detalle.stock_actual < cantidad) return false;
        detalle.stock_actual -= cantidad;
        return true;
      }
    }
  }
  return false;
}

export function obtenerStockMock(iddetalle_ingreso: number): number {
  for (const ingreso of INGRESOS_MOCK) {
    for (const detalle of ingreso.detalles ?? []) {
      if (detalle.iddetalle_ingreso === iddetalle_ingreso) {
        return detalle.stock_actual;
      }
    }
  }
  return 0;
}
