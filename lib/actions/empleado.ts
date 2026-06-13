"use server";

import { revalidatePath } from "next/cache";
import { dbReadError, mockReadResult, shouldUseMockData } from "@/lib/action-db";
import { EMPLEADOS_MOCK } from "@/lib/data/usuarios-mock";
import { getPrisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/types/action";
import type { Empleado, EmpleadoInput, EmpleadoListado } from "@/lib/types/usuario";

const EMPLEADOS_PATH = "/mantenimiento/empleados";

function mapEmpleado(empleado: {
  idempleado: number;
  nombre: string;
  apellidos: string;
  tipo_documento: string;
  num_documento: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  foto: string | null;
  estado: string;
}): Empleado {
  return {
    idempleado: empleado.idempleado,
    nombre: empleado.nombre,
    apellidos: empleado.apellidos,
    tipo_documento: empleado.tipo_documento,
    num_documento: empleado.num_documento,
    direccion: empleado.direccion,
    telefono: empleado.telefono,
    email: empleado.email,
    foto: empleado.foto,
    estado: empleado.estado as Empleado["estado"],
  };
}

function mapEmpleadoListado(
  empleado: Empleado,
  login?: string | null
): EmpleadoListado {
  return { ...empleado, login: login ?? null };
}

export async function getEmpleados(): Promise<ActionResult<EmpleadoListado[]>> {
  if (shouldUseMockData()) {
    return mockReadResult(
      EMPLEADOS_MOCK.map((empleado) => mapEmpleadoListado(empleado, null))
    );
  }

  try {
    const empleados = await getPrisma().empleado.findMany({
      where: { estado: "1" },
      include: {
        usuarios: {
          where: { estado: "1" },
          select: { login: true },
          take: 1,
        },
      },
      orderBy: { idempleado: "asc" },
    });

    return {
      success: true,
      data: empleados.map((empleado) =>
        mapEmpleadoListado(
          mapEmpleado(empleado),
          empleado.usuarios[0]?.login ?? null
        )
      ),
    };
  } catch (error) {
    if (shouldUseMockData()) {
      return mockReadResult(
        EMPLEADOS_MOCK.map((empleado) => mapEmpleadoListado(empleado, null))
      );
    }
    return dbReadError<EmpleadoListado[]>("No se pudieron obtener los empleados.", error);
  }
}

export async function createEmpleado(
  input: EmpleadoInput
): Promise<ActionResult<Empleado>> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para registrar empleados.",
      usingMockData: true,
    };
  }

  try {
    const empleado = await getPrisma().empleado.create({
      data: {
        nombre: input.nombre.trim(),
        apellidos: input.apellidos.trim(),
        tipo_documento: input.tipo_documento,
        num_documento: input.num_documento.trim(),
        direccion: input.direccion?.trim() || null,
        telefono: input.telefono?.trim() || null,
        email: input.email?.trim() || null,
        foto: input.foto?.trim() || null,
        estado: input.estado ?? "1",
      },
    });

    revalidatePath(EMPLEADOS_PATH);
    return { success: true, data: mapEmpleado(empleado) };
  } catch {
    return { success: false, error: "No se pudo registrar el empleado." };
  }
}

export async function updateEmpleado(
  id: number,
  input: EmpleadoInput
): Promise<ActionResult<Empleado>> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para editar empleados.",
      usingMockData: true,
    };
  }

  try {
    const empleado = await getPrisma().empleado.update({
      where: { idempleado: id },
      data: {
        nombre: input.nombre.trim(),
        apellidos: input.apellidos.trim(),
        tipo_documento: input.tipo_documento,
        num_documento: input.num_documento.trim(),
        direccion: input.direccion?.trim() || null,
        telefono: input.telefono?.trim() || null,
        email: input.email?.trim() || null,
        foto: input.foto?.trim() || null,
        estado: input.estado ?? "1",
      },
    });

    revalidatePath(EMPLEADOS_PATH);
    revalidatePath("/mantenimiento/usuarios");
    return { success: true, data: mapEmpleado(empleado) };
  } catch {
    return { success: false, error: "No se pudo actualizar el empleado." };
  }
}

export async function deleteEmpleado(id: number): Promise<ActionResult> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para eliminar empleados.",
      usingMockData: true,
    };
  }

  try {
    await getPrisma().empleado.update({
      where: { idempleado: id },
      data: { estado: "0" },
    });

    revalidatePath(EMPLEADOS_PATH);
    return { success: true };
  } catch {
    return {
      success: false,
      error: "No se pudo eliminar el empleado. Puede tener un usuario vinculado.",
    };
  }
}
