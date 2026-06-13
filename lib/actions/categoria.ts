"use server";

import { revalidatePath } from "next/cache";
import { dbReadError, mockReadResult, shouldUseMockData } from "@/lib/action-db";
import { getPrisma } from "@/lib/prisma";
import { CATEGORIAS_MOCK } from "@/lib/data/categorias-mock";
import type { ActionResult } from "@/lib/types/action";
import type { Categoria, CategoriaInput } from "@/lib/types/categoria";

function mapCategoria(categoria: {
  idcategoria: number;
  nombre: string;
  estado: string;
}): Categoria {
  return {
    idcategoria: categoria.idcategoria,
    nombre: categoria.nombre,
    estado: categoria.estado as Categoria["estado"],
  };
}

export async function getCategorias(): Promise<ActionResult<Categoria[]>> {
  if (shouldUseMockData()) {
    return mockReadResult(CATEGORIAS_MOCK);
  }

  try {
    const categorias = await getPrisma().categoria.findMany({
      orderBy: { idcategoria: "asc" },
    });

    return {
      success: true,
      data: categorias.map(mapCategoria),
    };
  } catch (error) {
    if (shouldUseMockData()) return mockReadResult(CATEGORIAS_MOCK);
    return dbReadError<Categoria[]>("No se pudieron obtener las categorías.", error);
  }
}

export async function getCategoriaById(
  id: number
): Promise<ActionResult<Categoria>> {
  if (shouldUseMockData()) {
    const categoria = CATEGORIAS_MOCK.find((item) => item.idcategoria === id);
    if (!categoria) {
      return { success: false, error: "Categoría no encontrada." };
    }
    return mockReadResult(categoria);
  }

  try {
    const categoria = await getPrisma().categoria.findUnique({
      where: { idcategoria: id },
    });

    if (!categoria) {
      return { success: false, error: "Categoría no encontrada." };
    }

    return { success: true, data: mapCategoria(categoria) };
  } catch (error) {
    if (shouldUseMockData()) {
      const categoria = CATEGORIAS_MOCK.find((item) => item.idcategoria === id);
      if (!categoria) return { success: false, error: "Categoría no encontrada." };
      return mockReadResult(categoria);
    }
    return dbReadError<Categoria>("No se pudo obtener la categoría.", error);
  }
}

export async function createCategoria(
  input: CategoriaInput
): Promise<ActionResult<Categoria>> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para registrar categorías.",
      usingMockData: true,
    };
  }

  try {
    const categoria = await getPrisma().categoria.create({
      data: {
        nombre: input.nombre.trim(),
        estado: input.estado ?? "1",
      },
    });

    revalidatePath("/mantenimiento/categorias");
    return { success: true, data: mapCategoria(categoria) };
  } catch {
    return {
      success: false,
      error: "No se pudo crear la categoría.",
    };
  }
}

export async function updateCategoria(
  id: number,
  input: CategoriaInput
): Promise<ActionResult<Categoria>> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para editar categorías.",
      usingMockData: true,
    };
  }

  try {
    const categoria = await getPrisma().categoria.update({
      where: { idcategoria: id },
      data: {
        nombre: input.nombre.trim(),
        estado: input.estado ?? "1",
      },
    });

    revalidatePath("/mantenimiento/categorias");
    return { success: true, data: mapCategoria(categoria) };
  } catch {
    return {
      success: false,
      error: "No se pudo actualizar la categoría.",
    };
  }
}

export async function deleteCategoria(id: number): Promise<ActionResult> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para eliminar categorías.",
      usingMockData: true,
    };
  }

  try {
    await getPrisma().categoria.delete({
      where: { idcategoria: id },
    });

    revalidatePath("/mantenimiento/categorias");
    return { success: true };
  } catch {
    return {
      success: false,
      error:
        "No se pudo eliminar la categoría. Puede tener artículos asociados.",
    };
  }
}
