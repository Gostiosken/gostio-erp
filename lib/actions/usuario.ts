"use server";

import { revalidatePath } from "next/cache";
import { dbReadError, mockReadResult, shouldUseMockData } from "@/lib/action-db";
import { getPrisma } from "@/lib/prisma";
import { SUCURSALES_MOCK } from "@/lib/data/sucursales-mock";
import {
  findMockUsuarioByLogin,
  USUARIOS_MOCK,
  type UsuarioMockRecord,
} from "@/lib/data/usuarios-mock";
import type { ActionResult } from "@/lib/types/action";
import type {
  AuthSession,
  Empleado,
  LoginResult,
  Usuario,
  UsuarioInput,
} from "@/lib/types/usuario";
import { toUsuarioPublic } from "@/lib/types/usuario";

const USUARIOS_PATH = "/mantenimiento/usuarios";

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

function mapUsuario(usuario: {
  idusuario: number;
  idempleado: number;
  idsucursal: number;
  login: string;
  tipo: string;
  mnu_almacen: number;
  mnu_compras: number;
  mnu_ventas: number;
  mnu_mantenimiento: number;
  mnu_seguridad: number;
  mnu_admin: number;
  estado: string;
  empleado: {
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
  };
}): Usuario {
  return {
    idusuario: usuario.idusuario,
    idempleado: usuario.idempleado,
    idsucursal: usuario.idsucursal,
    login: usuario.login,
    tipo: usuario.tipo,
    estado: usuario.estado as Usuario["estado"],
    mnu_almacen: usuario.mnu_almacen,
    mnu_compras: usuario.mnu_compras,
    mnu_ventas: usuario.mnu_ventas,
    mnu_mantenimiento: usuario.mnu_mantenimiento,
    mnu_seguridad: usuario.mnu_seguridad,
    mnu_admin: usuario.mnu_admin,
    empleado: mapEmpleado(usuario.empleado),
  };
}

function mapMockUsuario(record: UsuarioMockRecord): Usuario {
  return {
    idusuario: record.idusuario,
    idempleado: record.idempleado,
    idsucursal: record.idsucursal,
    login: record.login,
    tipo: record.tipo,
    estado: record.estado,
    mnu_almacen: record.mnu_almacen,
    mnu_compras: record.mnu_compras,
    mnu_ventas: record.mnu_ventas,
    mnu_mantenimiento: record.mnu_mantenimiento,
    mnu_seguridad: record.mnu_seguridad,
    mnu_admin: record.mnu_admin,
    empleado: record.empleado,
  };
}

async function resolveSucursalNombre(idsucursal: number): Promise<string> {
  if (shouldUseMockData()) {
    const sucursal = SUCURSALES_MOCK.find((item) => item.idsucursal === idsucursal);
    return sucursal?.razon_social ?? "Sucursal";
  }

  try {
    const sucursal = await getPrisma().sucursal.findUnique({
      where: { idsucursal },
      select: { razon_social: true },
    });
    return sucursal?.razon_social ?? "Sucursal";
  } catch (error) {
    if (shouldUseMockData()) {
      const sucursal = SUCURSALES_MOCK.find((item) => item.idsucursal === idsucursal);
      return sucursal?.razon_social ?? "Sucursal";
    }
    console.error("No se pudo obtener el nombre de la sucursal.", error);
    return "Sucursal";
  }
}

function buildAuthSession(
  usuario: Usuario,
  idsucursal: number,
  sucursalNombre: string
): AuthSession {
  return {
    usuario: toUsuarioPublic(usuario),
    empleado: usuario.empleado,
    idsucursal,
    sucursalNombre,
  };
}

function validateCredentials(
  storedClave: string,
  providedClave: string
): boolean {
  return storedClave === providedClave;
}

export async function getUsuarios(): Promise<ActionResult<Usuario[]>> {
  if (shouldUseMockData()) {
    return mockReadResult(USUARIOS_MOCK.map(mapMockUsuario));
  }

  try {
    const usuarios = await getPrisma().usuario.findMany({
      where: { estado: "1" },
      include: { empleado: true },
      orderBy: { idusuario: "asc" },
    });

    return {
      success: true,
      data: usuarios.map(mapUsuario),
    };
  } catch (error) {
    if (shouldUseMockData()) return mockReadResult(USUARIOS_MOCK.map(mapMockUsuario));
    return dbReadError<Usuario[]>("No se pudieron obtener los usuarios.", error);
  }
}

export async function getUsuarioById(
  id: number
): Promise<ActionResult<Usuario>> {
  if (shouldUseMockData()) {
    const usuario = USUARIOS_MOCK.find((item) => item.idusuario === id);
    if (!usuario) {
      return { success: false, error: "Usuario no encontrado." };
    }
    return mockReadResult(mapMockUsuario(usuario));
  }

  try {
    const usuario = await getPrisma().usuario.findUnique({
      where: { idusuario: id },
      include: { empleado: true },
    });

    if (!usuario) {
      return { success: false, error: "Usuario no encontrado." };
    }

    return { success: true, data: mapUsuario(usuario) };
  } catch (error) {
    if (shouldUseMockData()) {
      const usuario = USUARIOS_MOCK.find((item) => item.idusuario === id);
      if (!usuario) return { success: false, error: "Usuario no encontrado." };
      return mockReadResult(mapMockUsuario(usuario));
    }
    return dbReadError<Usuario>("No se pudo obtener el usuario.", error);
  }
}

export async function createUsuario(
  input: UsuarioInput
): Promise<ActionResult<Usuario>> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para registrar usuarios.",
      usingMockData: true,
    };
  }

  try {
    const usuario = await getPrisma().$transaction(async (tx) => {
      let idempleado = input.idempleado;

      if (!idempleado) {
        if (!input.empleado) {
          throw new Error("MISSING_EMPLEADO");
        }

        const empleado = await tx.empleado.create({
          data: {
            nombre: input.empleado.nombre.trim(),
            apellidos: input.empleado.apellidos.trim(),
            tipo_documento: input.empleado.tipo_documento,
            num_documento: input.empleado.num_documento.trim(),
            direccion: input.empleado.direccion?.trim() || null,
            telefono: input.empleado.telefono?.trim() || null,
            email: input.empleado.email?.trim() || null,
            foto: input.empleado.foto?.trim() || null,
            estado: input.empleado.estado ?? "1",
          },
        });
        idempleado = empleado.idempleado;
      }

      return tx.usuario.create({
        data: {
          idempleado,
          idsucursal: input.idsucursal,
          login: input.login.trim(),
          clave: input.clave,
          tipo: input.tipo.trim(),
          mnu_almacen: input.mnu_almacen,
          mnu_compras: input.mnu_compras,
          mnu_ventas: input.mnu_ventas,
          mnu_mantenimiento: input.mnu_mantenimiento,
          mnu_seguridad: input.mnu_seguridad,
          mnu_admin: input.mnu_admin,
          estado: input.estado ?? "1",
        },
        include: { empleado: true },
      });
    });

    revalidatePath(USUARIOS_PATH);
    revalidatePath("/mantenimiento/empleados");
    return { success: true, data: mapUsuario(usuario) };
  } catch (error) {
    if (error instanceof Error && error.message === "MISSING_EMPLEADO") {
      return {
        success: false,
        error: "Debe indicar un empleado existente o los datos de uno nuevo.",
      };
    }
    return {
      success: false,
      error: "No se pudo crear el usuario.",
    };
  }
}

export async function updateUsuario(
  id: number,
  input: UsuarioInput
): Promise<ActionResult<Usuario>> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para editar usuarios.",
      usingMockData: true,
    };
  }

  try {
    const actual = await getPrisma().usuario.findUnique({
      where: { idusuario: id },
      select: { idempleado: true },
    });

    if (!actual) {
      return { success: false, error: "Usuario no encontrado." };
    }

    if (input.empleado) {
      await getPrisma().empleado.update({
        where: { idempleado: actual.idempleado },
        data: {
          nombre: input.empleado.nombre.trim(),
          apellidos: input.empleado.apellidos.trim(),
          tipo_documento: input.empleado.tipo_documento,
          num_documento: input.empleado.num_documento.trim(),
          direccion: input.empleado.direccion?.trim() || null,
          telefono: input.empleado.telefono?.trim() || null,
          email: input.empleado.email?.trim() || null,
          foto: input.empleado.foto?.trim() || null,
          estado: input.empleado.estado ?? "1",
        },
      });
    }

    const usuario = await getPrisma().usuario.update({
      where: { idusuario: id },
      data: {
        idsucursal: input.idsucursal,
        login: input.login.trim(),
        ...(input.clave ? { clave: input.clave } : {}),
        tipo: input.tipo.trim(),
        mnu_almacen: input.mnu_almacen,
        mnu_compras: input.mnu_compras,
        mnu_ventas: input.mnu_ventas,
        mnu_mantenimiento: input.mnu_mantenimiento,
        mnu_seguridad: input.mnu_seguridad,
        mnu_admin: input.mnu_admin,
        estado: input.estado ?? "1",
      },
      include: { empleado: true },
    });

    revalidatePath(USUARIOS_PATH);
    revalidatePath("/mantenimiento/empleados");
    return { success: true, data: mapUsuario(usuario) };
  } catch {
    return {
      success: false,
      error: "No se pudo actualizar el usuario.",
    };
  }
}

export async function deleteUsuario(id: number): Promise<ActionResult> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para eliminar usuarios.",
      usingMockData: true,
    };
  }

  try {
    await getPrisma().usuario.update({
      where: { idusuario: id },
      data: { estado: "0" },
    });

    revalidatePath(USUARIOS_PATH);
    return { success: true };
  } catch {
    return {
      success: false,
      error: "No se pudo eliminar el usuario.",
    };
  }
}

export async function loginUsuario(
  login: string,
  clave: string,
  idsucursal: number
): Promise<LoginResult> {
  const loginNormalizado = login.trim();
  const claveNormalizada = clave;

  if (!loginNormalizado || !claveNormalizada) {
    return { success: false, error: "Ingrese usuario y contraseña." };
  }

  if (!idsucursal) {
    return { success: false, error: "Seleccione una sucursal de trabajo." };
  }

  if (shouldUseMockData()) {
    const mockUsuario = findMockUsuarioByLogin(loginNormalizado);

    if (!mockUsuario || !validateCredentials(mockUsuario.clave, claveNormalizada)) {
      return {
        success: false,
        error: "Usuario o contraseña incorrectos.",
        usingMockData: true,
      };
    }

    const sucursal = SUCURSALES_MOCK.find((item) => item.idsucursal === idsucursal);
    if (!sucursal || sucursal.estado !== "1") {
      return {
        success: false,
        error: "La sucursal seleccionada no está disponible.",
        usingMockData: true,
      };
    }

    const usuario = mapMockUsuario(mockUsuario);
    return {
      success: true,
      data: buildAuthSession(usuario, idsucursal, sucursal.razon_social),
      usingMockData: true,
    };
  }

  try {
    const usuario = await getPrisma().usuario.findFirst({
      where: {
        login: loginNormalizado,
        estado: "1",
        empleado: { estado: "1" },
      },
      include: { empleado: true },
    });

    if (!usuario || !validateCredentials(usuario.clave, claveNormalizada)) {
      return { success: false, error: "Usuario o contraseña incorrectos." };
    }

    const sucursal = await getPrisma().sucursal.findFirst({
      where: { idsucursal, estado: "1" },
      select: { razon_social: true },
    });

    if (!sucursal) {
      return { success: false, error: "La sucursal seleccionada no está disponible." };
    }

    return {
      success: true,
      data: buildAuthSession(
        mapUsuario(usuario),
        idsucursal,
        sucursal.razon_social
      ),
    };
  } catch (error) {
    if (shouldUseMockData()) {
      const mockUsuario = findMockUsuarioByLogin(loginNormalizado);

      if (!mockUsuario || !validateCredentials(mockUsuario.clave, claveNormalizada)) {
        return {
          success: false,
          error: "Usuario o contraseña incorrectos.",
          usingMockData: true,
        };
      }

      const sucursalNombre = await resolveSucursalNombre(idsucursal);
      return {
        success: true,
        data: buildAuthSession(mapMockUsuario(mockUsuario), idsucursal, sucursalNombre),
        usingMockData: true,
      };
    }
    return dbReadError<AuthSession>("No se pudo iniciar sesión.", error);
  }
}
