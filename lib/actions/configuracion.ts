"use server";

import { revalidatePath } from "next/cache";
import { dbReadError, mockReadResult, shouldUseMockData } from "@/lib/action-db";
import { CONFIGURACION_MOCK } from "@/lib/data/configuracion-mock";
import { getPrisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/types/action";
import type {
  ConfiguracionGlobal,
  ConfiguracionGlobalInput,
} from "@/lib/types/configuracion";

const CONFIGURACION_PATH = "/mantenimiento/configuracion";

function mapConfiguracion(config: {
  idglobal: number;
  empresa: string;
  nombre_impuesto: string;
  porcentaje_impuesto: { toString(): string };
  simbolo_moneda: string;
  logo: string | null;
}): ConfiguracionGlobal {
  return {
    idglobal: config.idglobal,
    empresa: config.empresa,
    nombre_impuesto: config.nombre_impuesto,
    porcentaje_impuesto: Number(config.porcentaje_impuesto),
    simbolo_moneda: config.simbolo_moneda,
    logo: config.logo,
  };
}

export async function getConfiguracion(): Promise<ActionResult<ConfiguracionGlobal>> {
  if (shouldUseMockData()) {
    return mockReadResult(CONFIGURACION_MOCK);
  }

  try {
    const config = await getPrisma().configuracionGlobal.findFirst({
      orderBy: { idglobal: "asc" },
    });

    if (!config) {
      return {
        success: false,
        error: "No hay configuración global registrada. Ejecute el seed de la base de datos.",
      };
    }

    return { success: true, data: mapConfiguracion(config) };
  } catch (error) {
    if (shouldUseMockData()) return mockReadResult(CONFIGURACION_MOCK);
    return dbReadError<ConfiguracionGlobal>(
      "No se pudo obtener la configuración global.",
      error
    );
  }
}

export async function updateConfiguracion(
  input: ConfiguracionGlobalInput
): Promise<ActionResult<ConfiguracionGlobal>> {
  if (!input.empresa.trim()) {
    return { success: false, error: "El nombre de la empresa es obligatorio." };
  }

  if (!input.nombre_impuesto.trim()) {
    return { success: false, error: "El nombre del impuesto es obligatorio." };
  }

  if (input.porcentaje_impuesto < 0 || input.porcentaje_impuesto > 100) {
    return { success: false, error: "El porcentaje de impuesto debe estar entre 0 y 100." };
  }

  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para actualizar la configuración.",
      usingMockData: true,
    };
  }

  try {
    const actual = await getPrisma().configuracionGlobal.findFirst({
      orderBy: { idglobal: "asc" },
    });

    if (!actual) {
      const creada = await getPrisma().configuracionGlobal.create({
        data: {
          empresa: input.empresa.trim(),
          nombre_impuesto: input.nombre_impuesto.trim(),
          porcentaje_impuesto: input.porcentaje_impuesto,
          simbolo_moneda: input.simbolo_moneda.trim(),
          logo: input.logo?.trim() || null,
        },
      });

      revalidatePath(CONFIGURACION_PATH);
      return { success: true, data: mapConfiguracion(creada) };
    }

    const actualizada = await getPrisma().configuracionGlobal.update({
      where: { idglobal: actual.idglobal },
      data: {
        empresa: input.empresa.trim(),
        nombre_impuesto: input.nombre_impuesto.trim(),
        porcentaje_impuesto: input.porcentaje_impuesto,
        simbolo_moneda: input.simbolo_moneda.trim(),
        logo: input.logo?.trim() || null,
      },
    });

    revalidatePath(CONFIGURACION_PATH);
    return { success: true, data: mapConfiguracion(actualizada) };
  } catch {
    return {
      success: false,
      error: "No se pudo actualizar la configuración global.",
    };
  }
}
