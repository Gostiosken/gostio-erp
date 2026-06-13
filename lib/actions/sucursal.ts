"use server";

import { revalidatePath } from "next/cache";
import { dbReadError, mockReadResult, shouldUseMockData } from "@/lib/action-db";
import { SUCURSALES_MOCK } from "@/lib/data/sucursales-mock";
import { getPrisma } from "@/lib/prisma";
import type { Sucursal, SucursalInput } from "@/lib/types/sucursal";

export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
  usingMockData?: boolean;
};

function mapSucursal(sucursal: {
  idsucursal: number;
  razon_social: string;
  tipo_documento: string;
  num_documento: string;
  direccion: string;
  telefono: string;
  email: string | null;
  representante: string | null;
  logo: string | null;
  estado: string;
}): Sucursal {
  return {
    idsucursal: sucursal.idsucursal,
    razon_social: sucursal.razon_social,
    tipo_documento: sucursal.tipo_documento as Sucursal["tipo_documento"],
    num_documento: sucursal.num_documento,
    direccion: sucursal.direccion,
    telefono: sucursal.telefono,
    email: sucursal.email,
    representante: sucursal.representante,
    logo: sucursal.logo,
    estado: sucursal.estado as Sucursal["estado"],
  };
}

export async function getSucursales(): Promise<ActionResult<Sucursal[]>> {
  if (shouldUseMockData()) {
    return mockReadResult(SUCURSALES_MOCK);
  }

  try {
    const sucursales = await getPrisma().sucursal.findMany({
      orderBy: { idsucursal: "asc" },
    });

    return {
      success: true,
      data: sucursales.map(mapSucursal),
    };
  } catch (error) {
    if (shouldUseMockData()) return mockReadResult(SUCURSALES_MOCK);
    return dbReadError<Sucursal[]>("No se pudieron obtener las sucursales.", error);
  }
}

export async function getSucursalById(
  id: number
): Promise<ActionResult<Sucursal>> {
  if (shouldUseMockData()) {
    const sucursal = SUCURSALES_MOCK.find((item) => item.idsucursal === id);
    if (!sucursal) {
      return { success: false, error: "Sucursal no encontrada." };
    }
    return { success: true, data: sucursal, usingMockData: true };
  }

  try {
    const sucursal = await getPrisma().sucursal.findUnique({
      where: { idsucursal: id },
    });

    if (!sucursal) {
      return { success: false, error: "Sucursal no encontrada." };
    }

    return { success: true, data: mapSucursal(sucursal) };
  } catch (error) {
    if (shouldUseMockData()) {
      const sucursal = SUCURSALES_MOCK.find((item) => item.idsucursal === id);
      if (!sucursal) return { success: false, error: "Sucursal no encontrada." };
      return mockReadResult(sucursal);
    }
    return dbReadError<Sucursal>("No se pudo obtener la sucursal.", error);
  }
}

export async function createSucursal(
  input: SucursalInput
): Promise<ActionResult<Sucursal>> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para registrar sucursales.",
      usingMockData: true,
    };
  }

  try {
    const sucursal = await getPrisma().sucursal.create({
      data: {
        razon_social: input.razon_social.trim(),
        tipo_documento: input.tipo_documento,
        num_documento: input.num_documento.trim(),
        direccion: input.direccion.trim(),
        telefono: input.telefono.trim(),
        email: input.email?.trim() || null,
        representante: input.representante?.trim() || null,
        logo: input.logo?.trim() || null,
        estado: input.estado ?? "1",
      },
    });

    revalidatePath("/mantenimiento/sucursales");
    return { success: true, data: mapSucursal(sucursal) };
  } catch {
    return {
      success: false,
      error: "No se pudo crear la sucursal. Verifique la conexión a la base de datos.",
    };
  }
}

export async function updateSucursal(
  id: number,
  input: SucursalInput
): Promise<ActionResult<Sucursal>> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para editar sucursales.",
      usingMockData: true,
    };
  }

  try {
    const sucursal = await getPrisma().sucursal.update({
      where: { idsucursal: id },
      data: {
        razon_social: input.razon_social.trim(),
        tipo_documento: input.tipo_documento,
        num_documento: input.num_documento.trim(),
        direccion: input.direccion.trim(),
        telefono: input.telefono.trim(),
        email: input.email?.trim() || null,
        representante: input.representante?.trim() || null,
        logo: input.logo?.trim() || null,
        estado: input.estado ?? "1",
      },
    });

    revalidatePath("/mantenimiento/sucursales");
    return { success: true, data: mapSucursal(sucursal) };
  } catch {
    return {
      success: false,
      error: "No se pudo actualizar la sucursal.",
    };
  }
}

export async function toggleEstadoSucursal(
  id: number
): Promise<ActionResult<Sucursal>> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para cambiar el estado.",
      usingMockData: true,
    };
  }

  try {
    const actual = await getPrisma().sucursal.findUnique({
      where: { idsucursal: id },
    });

    if (!actual) {
      return { success: false, error: "Sucursal no encontrada." };
    }

    const nuevoEstado = actual.estado === "1" ? "0" : "1";

    const sucursal = await getPrisma().sucursal.update({
      where: { idsucursal: id },
      data: { estado: nuevoEstado },
    });

    revalidatePath("/mantenimiento/sucursales");
    return { success: true, data: mapSucursal(sucursal) };
  } catch {
    return {
      success: false,
      error: "No se pudo cambiar el estado de la sucursal.",
    };
  }
}

export async function deleteSucursal(id: number): Promise<ActionResult> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para eliminar sucursales.",
      usingMockData: true,
    };
  }

  try {
    await getPrisma().sucursal.delete({
      where: { idsucursal: id },
    });

    revalidatePath("/mantenimiento/sucursales");
    return { success: true };
  } catch {
    return {
      success: false,
      error: "No se pudo eliminar la sucursal. Puede tener registros asociados.",
    };
  }
}
