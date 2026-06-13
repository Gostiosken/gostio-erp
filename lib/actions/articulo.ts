"use server";

import { revalidatePath } from "next/cache";
import { dbReadError, mockReadResult, shouldUseMockData } from "@/lib/action-db";
import { getPrisma } from "@/lib/prisma";
import {
  ARTICULOS_MOCK,
  getArticulosMockVisibles,
} from "@/lib/data/articulos-mock";
import type { ActionResult } from "@/lib/types/action";
import type { Articulo, ArticuloInput } from "@/lib/types/articulo";

const ARTICULOS_PATH = "/almacen/articulos";

function mapArticulo(articulo: {
  idarticulo: number;
  idcategoria: number;
  idunidad_medida: number;
  nombre: string;
  descripcion: string | null;
  imagen: string | null;
  estado: string;
  categoria: { idcategoria: number; nombre: string };
  unidadMedida: { idunidad_medida: number; nombre: string; prefijo: string };
}): Articulo {
  return {
    idarticulo: articulo.idarticulo,
    idcategoria: articulo.idcategoria,
    idunidad_medida: articulo.idunidad_medida,
    nombre: articulo.nombre,
    descripcion: articulo.descripcion,
    imagen: articulo.imagen,
    estado: articulo.estado as Articulo["estado"],
    categoria: articulo.categoria,
    unidadMedida: articulo.unidadMedida,
  };
}

export async function getArticulos(): Promise<ActionResult<Articulo[]>> {
  if (shouldUseMockData()) {
    return mockReadResult(getArticulosMockVisibles());
  }

  try {
    const articulos = await getPrisma().articulo.findMany({
      where: { estado: { not: "N" } },
      include: {
        categoria: {
          select: { idcategoria: true, nombre: true },
        },
        unidadMedida: {
          select: { idunidad_medida: true, nombre: true, prefijo: true },
        },
      },
      orderBy: { idarticulo: "asc" },
    });

    return {
      success: true,
      data: articulos.map(mapArticulo),
    };
  } catch (error) {
    if (shouldUseMockData()) return mockReadResult(getArticulosMockVisibles());
    return dbReadError<Articulo[]>("No se pudieron obtener los artículos.", error);
  }
}

export async function getArticuloById(
  id: number
): Promise<ActionResult<Articulo>> {
  if (shouldUseMockData()) {
    const articulo = ARTICULOS_MOCK.find((item) => item.idarticulo === id);
    if (!articulo || articulo.estado === "N") {
      return { success: false, error: "Artículo no encontrado." };
    }
    return mockReadResult(articulo);
  }

  try {
    const articulo = await getPrisma().articulo.findFirst({
      where: { idarticulo: id, estado: { not: "N" } },
      include: {
        categoria: {
          select: { idcategoria: true, nombre: true },
        },
        unidadMedida: {
          select: { idunidad_medida: true, nombre: true, prefijo: true },
        },
      },
    });

    if (!articulo) {
      return { success: false, error: "Artículo no encontrado." };
    }

    return { success: true, data: mapArticulo(articulo) };
  } catch (error) {
    if (shouldUseMockData()) {
      const articulo = ARTICULOS_MOCK.find((item) => item.idarticulo === id);
      if (!articulo || articulo.estado === "N") {
        return { success: false, error: "Artículo no encontrado." };
      }
      return mockReadResult(articulo);
    }
    return dbReadError<Articulo>("No se pudo obtener el artículo.", error);
  }
}

export async function createArticulo(
  input: ArticuloInput
): Promise<ActionResult<Articulo>> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para registrar artículos.",
      usingMockData: true,
    };
  }

  try {
    const articulo = await getPrisma().articulo.create({
      data: {
        idcategoria: input.idcategoria,
        idunidad_medida: input.idunidad_medida,
        nombre: input.nombre.trim(),
        descripcion: input.descripcion?.trim() || null,
        imagen: input.imagen?.trim() || null,
        estado: input.estado ?? "1",
      },
      include: {
        categoria: {
          select: { idcategoria: true, nombre: true },
        },
        unidadMedida: {
          select: { idunidad_medida: true, nombre: true, prefijo: true },
        },
      },
    });

    revalidatePath(ARTICULOS_PATH);
    return { success: true, data: mapArticulo(articulo) };
  } catch {
    return {
      success: false,
      error: "No se pudo crear el artículo.",
    };
  }
}

export async function updateArticulo(
  id: number,
  input: ArticuloInput
): Promise<ActionResult<Articulo>> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para editar artículos.",
      usingMockData: true,
    };
  }

  try {
    const articulo = await getPrisma().articulo.update({
      where: { idarticulo: id },
      data: {
        idcategoria: input.idcategoria,
        idunidad_medida: input.idunidad_medida,
        nombre: input.nombre.trim(),
        descripcion: input.descripcion?.trim() || null,
        imagen: input.imagen?.trim() || null,
        estado: input.estado ?? "1",
      },
      include: {
        categoria: {
          select: { idcategoria: true, nombre: true },
        },
        unidadMedida: {
          select: { idunidad_medida: true, nombre: true, prefijo: true },
        },
      },
    });

    revalidatePath(ARTICULOS_PATH);
    return { success: true, data: mapArticulo(articulo) };
  } catch {
    return {
      success: false,
      error: "No se pudo actualizar el artículo.",
    };
  }
}

export async function deleteArticulo(id: number): Promise<ActionResult> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para eliminar artículos.",
      usingMockData: true,
    };
  }

  try {
    await getPrisma().articulo.update({
      where: { idarticulo: id },
      data: { estado: "N" },
    });

    revalidatePath(ARTICULOS_PATH);
    return { success: true };
  } catch {
    return {
      success: false,
      error: "No se pudo eliminar el artículo.",
    };
  }
}
