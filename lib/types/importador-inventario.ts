export type TipoArticuloImportacion = "PRODUCTO" | "SERVICIO";

export type TasaIvaImportacion = "10" | "5" | "EXENTA";

export interface FilaImportacionInput {
  codigoBarra: string;
  nombre: string;
  descripcion?: string | null;
  costoBruto: string | number;
  precioVentaPublico: string | number;
  stockInicial: string | number;
  tasaIva: string | number;
  nombreCategoria?: string | null;
  tipo: TipoArticuloImportacion | string;
}

export interface FilaImportacionNormalizada {
  indice: number;
  codigoBarra: string;
  nombre: string;
  descripcion: string | null;
  costoBruto: number;
  precioVentaPublico: number;
  stockInicial: number;
  tasaIva: TasaIvaImportacion;
  nombreCategoria: string | null;
  tipo: TipoArticuloImportacion;
}

export interface ErrorFilaImportacion {
  indice: number;
  codigoBarra: string;
  mensaje: string;
}

export interface ResultadoImportacionMasiva {
  idsucursal: number;
  totalFilas: number;
  exitosas: number;
  fallidas: number;
  errores: ErrorFilaImportacion[];
}
