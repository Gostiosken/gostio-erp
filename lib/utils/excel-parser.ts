import * as XLSX from "xlsx";
import type { FilaImportacionInput } from "@/lib/types/importador-inventario";

export interface ResultadoLecturaExcel {
  columnas: string[];
  filasCrudas: Record<string, unknown>[];
}

/** Claves de FilaImportacionInput que el usuario puede mapear desde el Excel. */
export type CampoImportacionInventario = keyof FilaImportacionInput;

export type MapeoColumnasImportacion = Partial<
  Record<CampoImportacionInventario, string>
>;

export interface FilaExcelMapeada {
  /** Número de fila en la hoja (1 = cabecera, 2 = primera fila de datos). */
  indice: number;
  datos: FilaImportacionInput;
  tieneError: boolean;
  mensajeError?: string;
}

const CAMPOS_REQUERIDOS: CampoImportacionInventario[] = ["codigoBarra", "nombre"];

const VALORES_POR_DEFECTO: Pick<
  FilaImportacionInput,
  "costoBruto" | "precioVentaPublico" | "stockInicial" | "tasaIva" | "tipo"
> = {
  costoBruto: 0,
  precioVentaPublico: 0,
  stockInicial: 0,
  tasaIva: "10",
  tipo: "PRODUCTO",
};

function normalizarValorCelda(valor: unknown): string | number {
  if (valor == null) return "";
  if (typeof valor === "number") return valor;
  if (typeof valor === "boolean") return valor ? "1" : "0";
  return String(valor).trim();
}

function extraerColumnasDesdeHoja(worksheet: XLSX.WorkSheet): string[] {
  const filasHeader = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    range: 0,
    blankrows: false,
    defval: "",
  });

  const primeraFila = filasHeader[0] ?? [];
  return primeraFila
    .map((celda) => String(celda ?? "").trim())
    .filter((nombre) => nombre.length > 0);
}

function extraerFilasCrudas(worksheet: XLSX.WorkSheet): Record<string, unknown>[] {
  const filas = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
    blankrows: false,
  });

  return filas.map((fila) => {
    const normalizada: Record<string, unknown> = {};
    for (const [clave, valor] of Object.entries(fila)) {
      normalizada[String(clave).trim()] = normalizarValorCelda(valor);
    }
    return normalizada;
  });
}

function validarExtensionArchivo(nombreArchivo: string): void {
  const extension = nombreArchivo.split(".").pop()?.toLowerCase();
  if (!extension || !["xlsx", "xls", "csv"].includes(extension)) {
    throw new Error(
      "Formato no soportado. Utilice archivos .xlsx, .xls o .csv."
    );
  }
}

/**
 * Lee un archivo Excel/CSV desde el navegador y devuelve cabeceras + filas en JSON.
 */
export async function leerArchivoExcel(archivo: File): Promise<ResultadoLecturaExcel> {
  if (!archivo || archivo.size === 0) {
    throw new Error("El archivo seleccionado está vacío.");
  }

  validarExtensionArchivo(archivo.name);

  const buffer = await archivo.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: false,
    dense: false,
  });

  const nombrePrimeraHoja = workbook.SheetNames[0];
  if (!nombrePrimeraHoja) {
    throw new Error("El archivo no contiene hojas de cálculo.");
  }

  const worksheet = workbook.Sheets[nombrePrimeraHoja];
  if (!worksheet) {
    throw new Error("No se pudo leer la primera hoja del archivo.");
  }

  const columnas = extraerColumnasDesdeHoja(worksheet);
  const filasCrudas = extraerFilasCrudas(worksheet);

  if (columnas.length === 0) {
    throw new Error("La primera fila del archivo no contiene nombres de columnas.");
  }

  return { columnas, filasCrudas };
}

function obtenerValorMapeado(
  fila: Record<string, unknown>,
  columnaExcel: string | undefined
): string | number {
  if (!columnaExcel) return "";
  const valor = fila[columnaExcel];
  return normalizarValorCelda(valor);
}

function validarFilaMapeada(
  datos: FilaImportacionInput,
  mapeo: MapeoColumnasImportacion
): { tieneError: boolean; mensajeError?: string } {
  const errores: string[] = [];

  if (!String(datos.codigoBarra ?? "").trim()) {
    errores.push("Código de barra ausente");
  }

  if (!String(datos.nombre ?? "").trim()) {
    errores.push("Nombre del artículo ausente");
  }

  for (const campo of CAMPOS_REQUERIDOS) {
    if (!mapeo[campo]) {
      errores.push(`No se mapeó la columna obligatoria "${campo}"`);
    }
  }

  if (errores.length === 0) {
    return { tieneError: false };
  }

  return {
    tieneError: true,
    mensajeError: errores.join(" · "),
  };
}

/**
 * Transforma filas crudas del Excel al tipo FilaImportacionInput usando el mapeo del usuario.
 * Marca filas inválidas antes de enviarlas al backend.
 */
export function mapearColumnasAInput(
  filasCrudas: Record<string, unknown>[],
  mapeo: MapeoColumnasImportacion
): FilaExcelMapeada[] {
  return filasCrudas.map((fila, index) => {
    const datos: FilaImportacionInput = {
      codigoBarra: String(obtenerValorMapeado(fila, mapeo.codigoBarra)),
      nombre: String(obtenerValorMapeado(fila, mapeo.nombre)),
      descripcion: mapeo.descripcion
        ? String(obtenerValorMapeado(fila, mapeo.descripcion)) || null
        : null,
      costoBruto: mapeo.costoBruto
        ? obtenerValorMapeado(fila, mapeo.costoBruto)
        : VALORES_POR_DEFECTO.costoBruto,
      precioVentaPublico: mapeo.precioVentaPublico
        ? obtenerValorMapeado(fila, mapeo.precioVentaPublico)
        : VALORES_POR_DEFECTO.precioVentaPublico,
      stockInicial: mapeo.stockInicial
        ? obtenerValorMapeado(fila, mapeo.stockInicial)
        : VALORES_POR_DEFECTO.stockInicial,
      tasaIva: mapeo.tasaIva
        ? obtenerValorMapeado(fila, mapeo.tasaIva)
        : VALORES_POR_DEFECTO.tasaIva,
      nombreCategoria: mapeo.nombreCategoria
        ? String(obtenerValorMapeado(fila, mapeo.nombreCategoria)) || null
        : null,
      tipo: mapeo.tipo
        ? String(obtenerValorMapeado(fila, mapeo.tipo)) || VALORES_POR_DEFECTO.tipo
        : VALORES_POR_DEFECTO.tipo,
    };

    const validacion = validarFilaMapeada(datos, mapeo);

    return {
      indice: index + 2,
      datos,
      tieneError: validacion.tieneError,
      mensajeError: validacion.mensajeError,
    };
  });
}

/** Filtra únicamente las filas válidas listas para procesarImportacionMasiva. */
export function obtenerFilasValidasParaImportacion(
  filasMapeadas: FilaExcelMapeada[]
): FilaImportacionInput[] {
  return filasMapeadas.filter((fila) => !fila.tieneError).map((fila) => fila.datos);
}

/** Filas rechazadas en la pre-validación del cliente. */
export function obtenerFilasConErrorPrevalidacion(
  filasMapeadas: FilaExcelMapeada[]
): Array<{ indice: number; mensaje: string; codigoBarra: string }> {
  return filasMapeadas
    .filter((fila) => fila.tieneError)
    .map((fila) => ({
      indice: fila.indice,
      mensaje: fila.mensajeError ?? "Fila inválida",
      codigoBarra: fila.datos.codigoBarra,
    }));
}
