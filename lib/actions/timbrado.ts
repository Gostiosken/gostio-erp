"use server";

import { revalidatePath } from "next/cache";
import { dbReadError, mockReadResult, shouldUseMockData } from "@/lib/action-db";
import {
  getTimbradosMockBySucursal,
  TIMBRADOS_MOCK,
} from "@/lib/data/timbrados-mock";
import { getPrisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/types/action";
import type {
  Timbrado,
  TimbradoInput,
  ValidacionTimbradoResult,
} from "@/lib/types/timbrado";

const TIMBRADOS_PATH = "/mantenimiento/timbrados";

function mapTimbrado(timbrado: {
  idtimbrado: number;
  numero_timbrado: string;
  idsucursal: number;
  razon_social: string;
  ruc_emisor: string;
  direccion: string;
  establecimiento: string;
  punto_expedicion: string;
  serie: string;
  numero_desde: number;
  numero_hasta: number;
  numero_actual: number;
  fecha_inicio: Date;
  fecha_vencimiento: Date;
  estado: string;
}): Timbrado {
  return {
    idtimbrado: timbrado.idtimbrado,
    numero_timbrado: timbrado.numero_timbrado,
    idsucursal: timbrado.idsucursal,
    razon_social: timbrado.razon_social,
    ruc_emisor: timbrado.ruc_emisor,
    direccion: timbrado.direccion,
    establecimiento: timbrado.establecimiento,
    punto_expedicion: timbrado.punto_expedicion,
    serie: timbrado.serie,
    numero_desde: timbrado.numero_desde,
    numero_hasta: timbrado.numero_hasta,
    numero_actual: timbrado.numero_actual,
    fecha_inicio: timbrado.fecha_inicio.toISOString().slice(0, 10),
    fecha_vencimiento: timbrado.fecha_vencimiento.toISOString().slice(0, 10),
    estado: timbrado.estado as Timbrado["estado"],
  };
}

function parseFechaInput(fecha: string): Date {
  return new Date(`${fecha}T00:00:00`);
}

function validarRangoNumeros(
  numero_desde: number,
  numero_hasta: number,
  numero_actual: number
): string | null {
  if (numero_desde < 1) {
    return "El número inicial del rango debe ser mayor a cero.";
  }
  if (numero_hasta < numero_desde) {
    return "El número final debe ser mayor o igual al número inicial.";
  }
  if (numero_actual < numero_desde || numero_actual > numero_hasta) {
    return "El correlativo actual debe estar dentro del rango autorizado.";
  }
  return null;
}

function validarFechasTimbrado(
  fecha_inicio: string,
  fecha_vencimiento: string
): string | null {
  const inicio = parseFechaInput(fecha_inicio);
  const vencimiento = parseFechaInput(fecha_vencimiento);

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(vencimiento.getTime())) {
    return "Las fechas ingresadas no son válidas.";
  }

  if (vencimiento < inicio) {
    return "La fecha de vencimiento no puede ser anterior a la fecha de inicio.";
  }

  return null;
}

function validarTimbradoEnMemoria(
  timbrados: Timbrado[],
  idsucursal: number,
  numero: number
): ValidacionTimbradoResult {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const activos = timbrados.filter(
    (t) => t.idsucursal === idsucursal && t.estado === "1"
  );

  if (activos.length === 0) {
    return {
      valido: false,
      mensaje: "No hay timbrados activos para esta sucursal.",
    };
  }

  const timbrado = activos.find(
    (t) => numero >= t.numero_desde && numero <= t.numero_hasta
  );

  if (!timbrado) {
    return {
      valido: false,
      mensaje: "El número de comprobante no está dentro de ningún rango de timbrado activo.",
    };
  }

  const vencimiento = parseFechaInput(timbrado.fecha_vencimiento);
  if (hoy > vencimiento) {
    return {
      valido: false,
      mensaje: `El timbrado ${timbrado.numero_timbrado} está vencido (${timbrado.fecha_vencimiento}).`,
      idtimbrado: timbrado.idtimbrado,
    };
  }

  if (numero > timbrado.numero_hasta) {
    return {
      valido: false,
      mensaje: `El correlativo ${numero} supera el límite autorizado (${timbrado.numero_hasta}).`,
      idtimbrado: timbrado.idtimbrado,
    };
  }

  if (timbrado.numero_actual >= timbrado.numero_hasta) {
    return {
      valido: false,
      mensaje: "El correlativo actual ya alcanzó el límite máximo del timbrado.",
      idtimbrado: timbrado.idtimbrado,
    };
  }

  if (numero < timbrado.numero_actual) {
    return {
      valido: false,
      mensaje: `El correlativo ${numero} es menor al correlativo actual (${timbrado.numero_actual}).`,
      idtimbrado: timbrado.idtimbrado,
    };
  }

  return { valido: true, idtimbrado: timbrado.idtimbrado };
}

export async function getTimbrados(
  idsucursal: number
): Promise<ActionResult<Timbrado[]>> {
  if (shouldUseMockData()) {
    return mockReadResult(getTimbradosMockBySucursal(idsucursal));
  }

  try {
    const timbrados = await getPrisma().timbrado.findMany({
      where: { idsucursal },
      orderBy: { idtimbrado: "desc" },
    });

    return {
      success: true,
      data: timbrados.map(mapTimbrado),
    };
  } catch (error) {
    if (shouldUseMockData()) {
      return mockReadResult(getTimbradosMockBySucursal(idsucursal));
    }
    return dbReadError<Timbrado[]>("No se pudieron obtener los timbrados.", error);
  }
}

export async function getTimbradoById(
  id: number
): Promise<ActionResult<Timbrado>> {
  if (shouldUseMockData()) {
    const timbrado = TIMBRADOS_MOCK.find((t) => t.idtimbrado === id);
    if (!timbrado) {
      return { success: false, error: "Timbrado no encontrado." };
    }
    return mockReadResult(timbrado);
  }

  try {
    const timbrado = await getPrisma().timbrado.findUnique({
      where: { idtimbrado: id },
    });

    if (!timbrado) {
      return { success: false, error: "Timbrado no encontrado." };
    }

    return { success: true, data: mapTimbrado(timbrado) };
  } catch (error) {
    if (shouldUseMockData()) {
      const timbrado = TIMBRADOS_MOCK.find((t) => t.idtimbrado === id);
      if (!timbrado) return { success: false, error: "Timbrado no encontrado." };
      return mockReadResult(timbrado);
    }
    return dbReadError<Timbrado>("No se pudo obtener el timbrado.", error);
  }
}

export async function createTimbrado(
  input: TimbradoInput
): Promise<ActionResult<Timbrado>> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para registrar timbrados.",
      usingMockData: true,
    };
  }

  const errorRango = validarRangoNumeros(
    input.numero_desde,
    input.numero_hasta,
    input.numero_actual
  );
  if (errorRango) return { success: false, error: errorRango };

  const errorFechas = validarFechasTimbrado(
    input.fecha_inicio,
    input.fecha_vencimiento
  );
  if (errorFechas) return { success: false, error: errorFechas };

  try {
    const timbrado = await getPrisma().timbrado.create({
      data: {
        numero_timbrado: input.numero_timbrado.trim(),
        idsucursal: input.idsucursal,
        razon_social: input.razon_social.trim(),
        ruc_emisor: input.ruc_emisor.trim(),
        direccion: input.direccion.trim(),
        establecimiento: input.establecimiento.trim().padStart(3, "0").slice(-3),
        punto_expedicion: input.punto_expedicion.trim().padStart(3, "0").slice(-3),
        serie: input.serie.trim(),
        numero_desde: input.numero_desde,
        numero_hasta: input.numero_hasta,
        numero_actual: input.numero_actual,
        fecha_inicio: parseFechaInput(input.fecha_inicio),
        fecha_vencimiento: parseFechaInput(input.fecha_vencimiento),
        estado: input.estado ?? "1",
      },
    });

    revalidatePath(TIMBRADOS_PATH);
    return { success: true, data: mapTimbrado(timbrado) };
  } catch {
    return {
      success: false,
      error: "No se pudo registrar el timbrado.",
    };
  }
}

export async function updateTimbrado(
  id: number,
  input: TimbradoInput
): Promise<ActionResult<Timbrado>> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para editar timbrados.",
      usingMockData: true,
    };
  }

  const errorRango = validarRangoNumeros(
    input.numero_desde,
    input.numero_hasta,
    input.numero_actual
  );
  if (errorRango) return { success: false, error: errorRango };

  const errorFechas = validarFechasTimbrado(
    input.fecha_inicio,
    input.fecha_vencimiento
  );
  if (errorFechas) return { success: false, error: errorFechas };

  try {
    const timbrado = await getPrisma().timbrado.update({
      where: { idtimbrado: id },
      data: {
        numero_timbrado: input.numero_timbrado.trim(),
        idsucursal: input.idsucursal,
        razon_social: input.razon_social.trim(),
        ruc_emisor: input.ruc_emisor.trim(),
        direccion: input.direccion.trim(),
        establecimiento: input.establecimiento.trim().padStart(3, "0").slice(-3),
        punto_expedicion: input.punto_expedicion.trim().padStart(3, "0").slice(-3),
        serie: input.serie.trim(),
        numero_desde: input.numero_desde,
        numero_hasta: input.numero_hasta,
        numero_actual: input.numero_actual,
        fecha_inicio: parseFechaInput(input.fecha_inicio),
        fecha_vencimiento: parseFechaInput(input.fecha_vencimiento),
        estado: input.estado ?? "1",
      },
    });

    revalidatePath(TIMBRADOS_PATH);
    return { success: true, data: mapTimbrado(timbrado) };
  } catch {
    return {
      success: false,
      error: "No se pudo actualizar el timbrado.",
    };
  }
}

export async function toggleEstadoTimbrado(
  id: number
): Promise<ActionResult<Timbrado>> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para cambiar el estado.",
      usingMockData: true,
    };
  }

  try {
    const actual = await getPrisma().timbrado.findUnique({
      where: { idtimbrado: id },
    });

    if (!actual) {
      return { success: false, error: "Timbrado no encontrado." };
    }

    const timbrado = await getPrisma().timbrado.update({
      where: { idtimbrado: id },
      data: { estado: actual.estado === "1" ? "0" : "1" },
    });

    revalidatePath(TIMBRADOS_PATH);
    return { success: true, data: mapTimbrado(timbrado) };
  } catch {
    return {
      success: false,
      error: "No se pudo cambiar el estado del timbrado.",
    };
  }
}

export async function validarComprobantePorTimbrado(
  idsucursal: number,
  numero: number
): Promise<ActionResult<ValidacionTimbradoResult>> {
  if (!Number.isInteger(numero) || numero < 1) {
    return {
      success: true,
      data: {
        valido: false,
        mensaje: "El número de comprobante no es válido.",
      },
    };
  }

  if (shouldUseMockData()) {
    return {
      success: true,
      data: validarTimbradoEnMemoria(TIMBRADOS_MOCK, idsucursal, numero),
      usingMockData: true,
    };
  }

  try {
    const timbrados = await getPrisma().timbrado.findMany({
      where: { idsucursal, estado: "1" },
      orderBy: { idtimbrado: "desc" },
    });

    const resultado = validarTimbradoEnMemoria(
      timbrados.map(mapTimbrado),
      idsucursal,
      numero
    );

    return { success: true, data: resultado };
  } catch (error) {
    if (shouldUseMockData()) {
      return {
        success: true,
        data: validarTimbradoEnMemoria(TIMBRADOS_MOCK, idsucursal, numero),
        usingMockData: true,
      };
    }
    return dbReadError<ValidacionTimbradoResult>(
      "No se pudo validar el comprobante contra el timbrado.",
      error
    );
  }
}
