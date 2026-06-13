import type { TipoDocumento } from "@/lib/types/tipo-documento";

export const TIPOS_DOCUMENTO_MOCK: TipoDocumento[] = [
  { idtipo_documento: 1, documento: "RUC", operacion: "Persona", estado: "1" },
  { idtipo_documento: 2, documento: "DNI", operacion: "Persona", estado: "1" },
  { idtipo_documento: 3, documento: "NIC", operacion: "Persona", estado: "1" },
  { idtipo_documento: 4, documento: "CEDULA", operacion: "Persona", estado: "1" },
  { idtipo_documento: 5, documento: "FACTURA", operacion: "Comprobante", estado: "1" },
  { idtipo_documento: 6, documento: "BOLETA", operacion: "Comprobante", estado: "1" },
  { idtipo_documento: 7, documento: "TICKET", operacion: "Comprobante", estado: "1" },
  {
    idtipo_documento: 8,
    documento: "GUIA-REMISION",
    operacion: "Comprobante",
    estado: "1",
  },
];
