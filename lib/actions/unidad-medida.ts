"use server";

import { revalidatePath } from "next/cache";
import { dbReadError, mockReadResult, shouldUseMockData } from "@/lib/action-db";
import { getPrisma } from "@/lib/prisma";
import { UNIDADES_MOCK } from "@/lib/data/unidades-mock";
import type { ActionResult } from "@/lib/types/action";
import type { UnidadMedida, UnidadMedidaInput } from "@/lib/types/unidad-medida";

function mapUnidadMedida(unidad: {
  idunidad_medida: number;
  nombre: string;
  prefijo: string;
  estado: string;
}): UnidadMedida {
  return {
    idunidad_medida: unidad.idunidad_medida,
    nombre: unidad.nombre,
    prefijo: unidad.prefijo,
    estado: unidad.estado as UnidadMedida["estado"],
  };
}

export async function getUnidadesMedida(): Promise<ActionResult<UnidadMedida[]>> {
  if (shouldUseMockData()) {
    return mockReadResult(UNIDADES_MOCK);
  }

  try {
    const unidades = await getPrisma().unidadMedida.findMany({
      orderBy: { idunidad_medida: "asc" },
    });

    return {
      success: true,
      data: unidades.map(mapUnidadMedida),
    };
  } catch (error) {
    if (shouldUseMockData()) return mockReadResult(UNIDADES_MOCK);
    return dbReadError<UnidadMedida[]>("No se pudieron obtener las unidades de medida.", error);
  }
}

export async function getUnidadMedidaById(
  id: number
): Promise<ActionResult<UnidadMedida>> {
  if (shouldUseMockData()) {
    const unidad = UNIDADES_MOCK.find((item) => item.idunidad_medida === id);
    if (!unidad) {
      return { success: false, error: "Unidad de medida no encontrada." };
    }
    return mockReadResult(unidad);
  }

  try {
    const unidad = await getPrisma().unidadMedida.findUnique({
      where: { idunidad_medida: id },
    });

    if (!unidad) {
      return { success: false, error: "Unidad de medida no encontrada." };
    }

    return { success: true, data: mapUnidadMedida(unidad) };
  } catch (error) {
    if (shouldUseMockData()) {
      const unidad = UNIDADES_MOCK.find((item) => item.idunidad_medida === id);
      if (!unidad) return { success: false, error: "Unidad de medida no encontrada." };
      return mockReadResult(unidad);
    }
    return dbReadError<UnidadMedida>("No se pudo obtener la unidad de medida.", error);
  }
}

export async function createUnidadMedida(
  input: UnidadMedidaInput
): Promise<ActionResult<UnidadMedida>> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para registrar unidades de medida.",
      usingMockData: true,
    };
  }

  try {
    const unidad = await getPrisma().unidadMedida.create({
      data: {
        nombre: input.nombre.trim(),
        prefijo: input.prefijo.trim(),
        estado: input.estado ?? "1",
      },
    });

    revalidatePath("/mantenimiento/unidades");
    return { success: true, data: mapUnidadMedida(unidad) };
  } catch {
    return {
      success: false,
      error: "No se pudo crear la unidad de medida.",
    };
  }
}

export async function updateUnidadMedida(
  id: number,
  input: UnidadMedidaInput
): Promise<ActionResult<UnidadMedida>> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para editar unidades de medida.",
      usingMockData: true,
    };
  }

  try {
    const unidad = await getPrisma().unidadMedida.update({
      where: { idunidad_medida: id },
      data: {
        nombre: input.nombre.trim(),
        prefijo: input.prefijo.trim(),
        estado: input.estado ?? "1",
      },
    });

    revalidatePath("/mantenimiento/unidades");
    return { success: true, data: mapUnidadMedida(unidad) };
  } catch {
    return {
      success: false,
      error: "No se pudo actualizar la unidad de medida.",
    };
  }
}

export async function deleteUnidadMedida(id: number): Promise<ActionResult> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para eliminar unidades de medida.",
      usingMockData: true,
    };
  }

  try {
    await getPrisma().unidadMedida.delete({
      where: { idunidad_medida: id },
    });

    revalidatePath("/mantenimiento/unidades");
    return { success: true };
  } catch {
    return {
      success: false,
      error:
        "No se pudo eliminar la unidad de medida. Puede tener artículos asociados.",
    };
  }
}
