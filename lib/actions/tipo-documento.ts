"use server";

import { revalidatePath } from "next/cache";
import { dbReadError, mockReadResult, shouldUseMockData } from "@/lib/action-db";
import { TIPOS_DOCUMENTO_MOCK } from "@/lib/data/tipos-documento-mock";
import { getPrisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/types/action";
import type {
  OperacionTipoDocumento,
  TipoDocumento,
  TipoDocumentoInput,
} from "@/lib/types/tipo-documento";
import { isOperacionTipoDocumento } from "@/lib/types/tipo-documento";

const DOCUMENTOS_PATH = "/mantenimiento/documentos";

function mapTipoDocumento(tipo: {
  idtipo_documento: number;
  documento: string;
  operacion: string;
  estado: string;
}): TipoDocumento {
  return {
    idtipo_documento: tipo.idtipo_documento,
    documento: tipo.documento,
    operacion: tipo.operacion as OperacionTipoDocumento,
    estado: tipo.estado as TipoDocumento["estado"],
  };
}

function validarInput(input: TipoDocumentoInput): string | null {
  if (!input.documento.trim()) {
    return "El nombre del documento es obligatorio.";
  }

  if (!isOperacionTipoDocumento(input.operacion)) {
    return "La operación debe ser 'Persona' o 'Comprobante'.";
  }

  return null;
}

export async function getTiposDocumento(): Promise<ActionResult<TipoDocumento[]>> {
  if (shouldUseMockData()) {
    return mockReadResult(TIPOS_DOCUMENTO_MOCK);
  }

  try {
    const tipos = await getPrisma().tipoDocumento.findMany({
      where: { estado: "1" },
      orderBy: { idtipo_documento: "asc" },
    });

    return {
      success: true,
      data: tipos.map(mapTipoDocumento),
    };
  } catch (error) {
    if (shouldUseMockData()) return mockReadResult(TIPOS_DOCUMENTO_MOCK);
    return dbReadError<TipoDocumento[]>(
      "No se pudieron obtener los tipos de documento.",
      error
    );
  }
}

export async function getTipoDocumentoById(
  id: number
): Promise<ActionResult<TipoDocumento>> {
  if (shouldUseMockData()) {
    const tipo = TIPOS_DOCUMENTO_MOCK.find((item) => item.idtipo_documento === id);
    if (!tipo) {
      return { success: false, error: "Tipo de documento no encontrado." };
    }
    return mockReadResult(tipo);
  }

  try {
    const tipo = await getPrisma().tipoDocumento.findUnique({
      where: { idtipo_documento: id },
    });

    if (!tipo) {
      return { success: false, error: "Tipo de documento no encontrado." };
    }

    return { success: true, data: mapTipoDocumento(tipo) };
  } catch (error) {
    if (shouldUseMockData()) {
      const tipo = TIPOS_DOCUMENTO_MOCK.find((item) => item.idtipo_documento === id);
      if (!tipo) return { success: false, error: "Tipo de documento no encontrado." };
      return mockReadResult(tipo);
    }
    return dbReadError<TipoDocumento>(
      "No se pudo obtener el tipo de documento.",
      error
    );
  }
}

export async function createTipoDocumento(
  input: TipoDocumentoInput
): Promise<ActionResult<TipoDocumento>> {
  const errorValidacion = validarInput(input);
  if (errorValidacion) return { success: false, error: errorValidacion };

  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para registrar tipos de documento.",
      usingMockData: true,
    };
  }

  try {
    const tipo = await getPrisma().tipoDocumento.create({
      data: {
        documento: input.documento.trim().toUpperCase(),
        operacion: input.operacion,
        estado: input.estado ?? "1",
      },
    });

    revalidatePath(DOCUMENTOS_PATH);
    return { success: true, data: mapTipoDocumento(tipo) };
  } catch {
    return {
      success: false,
      error: "No se pudo registrar el tipo de documento.",
    };
  }
}

export async function updateTipoDocumento(
  id: number,
  input: TipoDocumentoInput
): Promise<ActionResult<TipoDocumento>> {
  const errorValidacion = validarInput(input);
  if (errorValidacion) return { success: false, error: errorValidacion };

  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para editar tipos de documento.",
      usingMockData: true,
    };
  }

  try {
    const tipo = await getPrisma().tipoDocumento.update({
      where: { idtipo_documento: id },
      data: {
        documento: input.documento.trim().toUpperCase(),
        operacion: input.operacion,
        estado: input.estado ?? "1",
      },
    });

    revalidatePath(DOCUMENTOS_PATH);
    return { success: true, data: mapTipoDocumento(tipo) };
  } catch {
    return {
      success: false,
      error: "No se pudo actualizar el tipo de documento.",
    };
  }
}

export async function toggleEstadoTipoDocumento(
  id: number
): Promise<ActionResult<TipoDocumento>> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para cambiar el estado.",
      usingMockData: true,
    };
  }

  try {
    const actual = await getPrisma().tipoDocumento.findUnique({
      where: { idtipo_documento: id },
    });

    if (!actual) {
      return { success: false, error: "Tipo de documento no encontrado." };
    }

    const tipo = await getPrisma().tipoDocumento.update({
      where: { idtipo_documento: id },
      data: { estado: actual.estado === "1" ? "0" : "1" },
    });

    revalidatePath(DOCUMENTOS_PATH);
    return { success: true, data: mapTipoDocumento(tipo) };
  } catch {
    return {
      success: false,
      error: "No se pudo cambiar el estado del tipo de documento.",
    };
  }
}

export async function deleteTipoDocumento(id: number): Promise<ActionResult> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para eliminar tipos de documento.",
      usingMockData: true,
    };
  }

  try {
    await getPrisma().tipoDocumento.update({
      where: { idtipo_documento: id },
      data: { estado: "0" },
    });

    revalidatePath(DOCUMENTOS_PATH);
    return { success: true };
  } catch {
    return {
      success: false,
      error:
        "No se pudo eliminar el tipo de documento. Puede estar en uso por la sucursal.",
    };
  }
}
