"use server";

import { revalidatePath } from "next/cache";
import { dbReadError, mockReadResult, shouldUseMockData } from "@/lib/action-db";
import { getPrisma } from "@/lib/prisma";
import {
  getProveedoresMockActivos,
  PROVEEDORES_MOCK,
} from "@/lib/data/proveedores-mock";
import {
  CLIENTES_MOCK,
  getClientesMockActivos,
} from "@/lib/data/clientes-mock";
import type { ActionResult } from "@/lib/types/action";
import type { PersonaInput, Proveedor, Cliente } from "@/lib/types/persona";

const PROVEEDORES_PATH = "/compras/proveedores";
const CLIENTES_PATH = "/ventas/clientes";
const TIPO_PROVEEDOR = "Proveedor";
const TIPO_CLIENTE = "Cliente";

function mapProveedor(persona: {
  idpersona: number;
  tipo_persona: string;
  nombre: string;
  tipo_documento: string;
  num_documento: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  estado: string;
}): Proveedor {
  return {
    idpersona: persona.idpersona,
    tipo_persona: "Proveedor",
    nombre: persona.nombre,
    tipo_documento: persona.tipo_documento,
    num_documento: persona.num_documento,
    direccion: persona.direccion,
    telefono: persona.telefono,
    email: persona.email,
    estado: persona.estado as Proveedor["estado"],
  };
}

function mapCliente(persona: {
  idpersona: number;
  tipo_persona: string;
  nombre: string;
  tipo_documento: string;
  num_documento: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  estado: string;
}): Cliente {
  return {
    idpersona: persona.idpersona,
    tipo_persona: "Cliente",
    nombre: persona.nombre,
    tipo_documento: persona.tipo_documento,
    num_documento: persona.num_documento,
    direccion: persona.direccion,
    telefono: persona.telefono,
    email: persona.email,
    estado: persona.estado as Cliente["estado"],
  };
}

export async function getProveedores(): Promise<ActionResult<Proveedor[]>> {
  if (shouldUseMockData()) {
    return mockReadResult(getProveedoresMockActivos());
  }

  try {
    const proveedores = await getPrisma().persona.findMany({
      where: { tipo_persona: TIPO_PROVEEDOR, estado: "1" },
      orderBy: { idpersona: "asc" },
    });

    return {
      success: true,
      data: proveedores.map(mapProveedor),
    };
  } catch (error) {
    if (shouldUseMockData()) return mockReadResult(getProveedoresMockActivos());
    return dbReadError<Proveedor[]>("No se pudieron obtener los proveedores.", error);
  }
}

export async function getProveedorById(
  id: number
): Promise<ActionResult<Proveedor>> {
  if (shouldUseMockData()) {
    const proveedor = PROVEEDORES_MOCK.find(
      (item) => item.idpersona === id && item.estado === "1"
    );
    if (!proveedor) {
      return { success: false, error: "Proveedor no encontrado." };
    }
    return mockReadResult(proveedor);
  }

  try {
    const proveedor = await getPrisma().persona.findFirst({
      where: {
        idpersona: id,
        tipo_persona: TIPO_PROVEEDOR,
        estado: "1",
      },
    });

    if (!proveedor) {
      return { success: false, error: "Proveedor no encontrado." };
    }

    return { success: true, data: mapProveedor(proveedor) };
  } catch (error) {
    if (shouldUseMockData()) {
      const proveedor = PROVEEDORES_MOCK.find((item) => item.idpersona === id);
      if (!proveedor) return { success: false, error: "Proveedor no encontrado." };
      return mockReadResult(proveedor);
    }
    return dbReadError<Proveedor>("No se pudo obtener el proveedor.", error);
  }
}

export async function createProveedor(
  input: PersonaInput
): Promise<ActionResult<Proveedor>> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para registrar proveedores.",
      usingMockData: true,
    };
  }

  try {
    const proveedor = await getPrisma().persona.create({
      data: {
        tipo_persona: TIPO_PROVEEDOR,
        nombre: input.nombre.trim(),
        tipo_documento: input.tipo_documento,
        num_documento: input.num_documento.trim(),
        direccion: input.direccion?.trim() || null,
        telefono: input.telefono?.trim() || null,
        email: input.email?.trim() || null,
        estado: input.estado ?? "1",
      },
    });

    revalidatePath(PROVEEDORES_PATH);
    return { success: true, data: mapProveedor(proveedor) };
  } catch {
    return {
      success: false,
      error: "No se pudo crear el proveedor.",
    };
  }
}

export async function updateProveedor(
  id: number,
  input: PersonaInput
): Promise<ActionResult<Proveedor>> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para editar proveedores.",
      usingMockData: true,
    };
  }

  try {
    const proveedor = await getPrisma().persona.update({
      where: { idpersona: id },
      data: {
        nombre: input.nombre.trim(),
        tipo_documento: input.tipo_documento,
        num_documento: input.num_documento.trim(),
        direccion: input.direccion?.trim() || null,
        telefono: input.telefono?.trim() || null,
        email: input.email?.trim() || null,
        estado: input.estado ?? "1",
      },
    });

    revalidatePath(PROVEEDORES_PATH);
    return { success: true, data: mapProveedor(proveedor) };
  } catch {
    return {
      success: false,
      error: "No se pudo actualizar el proveedor.",
    };
  }
}

export async function deleteProveedor(id: number): Promise<ActionResult> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para eliminar proveedores.",
      usingMockData: true,
    };
  }

  try {
    await getPrisma().persona.update({
      where: { idpersona: id },
      data: { estado: "0" },
    });

    revalidatePath(PROVEEDORES_PATH);
    return { success: true };
  } catch {
    return {
      success: false,
      error: "No se pudo eliminar el proveedor. Puede tener compras asociadas.",
    };
  }
}

export async function getClientes(): Promise<ActionResult<Cliente[]>> {
  if (shouldUseMockData()) {
    return mockReadResult(getClientesMockActivos());
  }

  try {
    const clientes = await getPrisma().persona.findMany({
      where: { tipo_persona: TIPO_CLIENTE, estado: "1" },
      orderBy: { idpersona: "asc" },
    });

    return {
      success: true,
      data: clientes.map(mapCliente),
    };
  } catch (error) {
    if (shouldUseMockData()) return mockReadResult(getClientesMockActivos());
    return dbReadError<Cliente[]>("No se pudieron obtener los clientes.", error);
  }
}

export async function getClienteById(
  id: number
): Promise<ActionResult<Cliente>> {
  if (shouldUseMockData()) {
    const cliente = CLIENTES_MOCK.find(
      (item) => item.idpersona === id && item.estado === "1"
    );
    if (!cliente) {
      return { success: false, error: "Cliente no encontrado." };
    }
    return mockReadResult(cliente);
  }

  try {
    const cliente = await getPrisma().persona.findFirst({
      where: {
        idpersona: id,
        tipo_persona: TIPO_CLIENTE,
        estado: "1",
      },
    });

    if (!cliente) {
      return { success: false, error: "Cliente no encontrado." };
    }

    return { success: true, data: mapCliente(cliente) };
  } catch (error) {
    if (shouldUseMockData()) {
      const cliente = CLIENTES_MOCK.find((item) => item.idpersona === id);
      if (!cliente) return { success: false, error: "Cliente no encontrado." };
      return mockReadResult(cliente);
    }
    return dbReadError<Cliente>("No se pudo obtener el cliente.", error);
  }
}

export async function createCliente(
  input: PersonaInput
): Promise<ActionResult<Cliente>> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para registrar clientes.",
      usingMockData: true,
    };
  }

  try {
    const cliente = await getPrisma().persona.create({
      data: {
        tipo_persona: TIPO_CLIENTE,
        nombre: input.nombre.trim(),
        tipo_documento: input.tipo_documento,
        num_documento: input.num_documento.trim(),
        direccion: input.direccion?.trim() || null,
        telefono: input.telefono?.trim() || null,
        email: input.email?.trim() || null,
        estado: input.estado ?? "1",
      },
    });

    revalidatePath(CLIENTES_PATH);
    return { success: true, data: mapCliente(cliente) };
  } catch {
    return {
      success: false,
      error: "No se pudo crear el cliente.",
    };
  }
}

export async function updateCliente(
  id: number,
  input: PersonaInput
): Promise<ActionResult<Cliente>> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para editar clientes.",
      usingMockData: true,
    };
  }

  try {
    const cliente = await getPrisma().persona.update({
      where: { idpersona: id },
      data: {
        nombre: input.nombre.trim(),
        tipo_documento: input.tipo_documento,
        num_documento: input.num_documento.trim(),
        direccion: input.direccion?.trim() || null,
        telefono: input.telefono?.trim() || null,
        email: input.email?.trim() || null,
        estado: input.estado ?? "1",
      },
    });

    revalidatePath(CLIENTES_PATH);
    return { success: true, data: mapCliente(cliente) };
  } catch {
    return {
      success: false,
      error: "No se pudo actualizar el cliente.",
    };
  }
}

export async function deleteCliente(id: number): Promise<ActionResult> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para eliminar clientes.",
      usingMockData: true,
    };
  }

  try {
    await getPrisma().persona.update({
      where: { idpersona: id },
      data: { estado: "0" },
    });

    revalidatePath(CLIENTES_PATH);
    return { success: true };
  } catch {
    return {
      success: false,
      error: "No se pudo eliminar el cliente. Puede tener ventas asociadas.",
    };
  }
}
