"use server";

import { revalidatePath } from "next/cache";
import { dbReadError, mockReadResult, shouldUseMockData } from "@/lib/action-db";
import { getPrisma } from "@/lib/prisma";
import {
  getIngresosMockBySucursal,
  getNextMockIngresoId,
  INGRESOS_MOCK,
} from "@/lib/data/ingresos-mock";
import { PROVEEDORES_MOCK } from "@/lib/data/proveedores-mock";
import type { ActionResult } from "@/lib/types/action";
import type {
  CreateIngresoInput,
  DetalleIngreso,
  Ingreso,
} from "@/lib/types/ingreso";
import { calcularTotalesIngreso } from "@/lib/types/ingreso";

const COMPRAS_PATH = "/compras/nuevo";

function mapDetalleIngreso(detalle: {
  iddetalle_ingreso: number;
  idingreso: number;
  idarticulo: number;
  codigo: string;
  serie: string | null;
  descripcion: string | null;
  stock_ingreso: number;
  stock_actual: number;
  precio_compra: { toString(): string };
  precio_ventadistribuidor: { toString(): string };
  precio_ventapublico: { toString(): string };
  articulo?: { idarticulo: number; nombre: string };
}): DetalleIngreso {
  return {
    iddetalle_ingreso: detalle.iddetalle_ingreso,
    idingreso: detalle.idingreso,
    idarticulo: detalle.idarticulo,
    codigo: detalle.codigo,
    serie: detalle.serie,
    descripcion: detalle.descripcion,
    stock_ingreso: detalle.stock_ingreso,
    stock_actual: detalle.stock_actual,
    precio_compra: Number(detalle.precio_compra),
    precio_ventadistribuidor: Number(detalle.precio_ventadistribuidor),
    precio_ventapublico: Number(detalle.precio_ventapublico),
    articulo: detalle.articulo,
  };
}

function mapIngreso(ingreso: {
  idingreso: number;
  idusuario: number;
  idsucursal: number;
  idproveedor: number;
  tipo_comprobante: string;
  serie_comprobante: string;
  num_comprobante: string;
  fecha: Date;
  impuesto: { toString(): string };
  total: { toString(): string };
  estado: string;
  proveedor?: { idpersona: number; nombre: string; num_documento: string };
  detalles?: Array<{
    iddetalle_ingreso: number;
    idingreso: number;
    idarticulo: number;
    codigo: string;
    serie: string | null;
    descripcion: string | null;
    stock_ingreso: number;
    stock_actual: number;
    precio_compra: { toString(): string };
    precio_ventadistribuidor: { toString(): string };
    precio_ventapublico: { toString(): string };
    articulo?: { idarticulo: number; nombre: string };
  }>;
}): Ingreso {
  return {
    idingreso: ingreso.idingreso,
    idusuario: ingreso.idusuario,
    idsucursal: ingreso.idsucursal,
    idproveedor: ingreso.idproveedor,
    tipo_comprobante: ingreso.tipo_comprobante,
    serie_comprobante: ingreso.serie_comprobante,
    num_comprobante: ingreso.num_comprobante,
    fecha: ingreso.fecha.toISOString().slice(0, 10),
    impuesto: Number(ingreso.impuesto),
    total: Number(ingreso.total),
    estado: ingreso.estado,
    proveedor: ingreso.proveedor,
    detalles: ingreso.detalles?.map(mapDetalleIngreso),
  };
}

export async function getIngresos(
  idsucursal: number
): Promise<ActionResult<Ingreso[]>> {
  if (!idsucursal) {
    return { success: false, error: "Sucursal no válida." };
  }

  if (shouldUseMockData()) {
    return mockReadResult(getIngresosMockBySucursal(idsucursal));
  }

  try {
    const ingresos = await getPrisma().ingreso.findMany({
      where: { idsucursal },
      include: {
        proveedor: {
          select: { idpersona: true, nombre: true, num_documento: true },
        },
        detalles: {
          include: {
            articulo: {
              select: { idarticulo: true, nombre: true },
            },
          },
        },
      },
      orderBy: { idingreso: "desc" },
    });

    return {
      success: true,
      data: ingresos.map(mapIngreso),
    };
  } catch (error) {
    if (shouldUseMockData()) return mockReadResult(getIngresosMockBySucursal(idsucursal));
    return dbReadError<Ingreso[]>("No se pudieron obtener los ingresos de compra.", error);
  }
}

export async function createIngreso(
  input: CreateIngresoInput
): Promise<ActionResult<Ingreso>> {
  const { cabecera, detalles } = input;

  if (!detalles.length) {
    return { success: false, error: "Debe agregar al menos un artículo al ingreso." };
  }

  const { impuesto, total } = calcularTotalesIngreso(
    detalles,
    cabecera.porcentaje_impuesto
  );

  if (shouldUseMockData()) {
    const proveedor = PROVEEDORES_MOCK.find(
      (item) => item.idpersona === cabecera.idproveedor
    );
    const nuevoId = getNextMockIngresoId();

    const mockIngreso: Ingreso = {
      idingreso: nuevoId,
      idusuario: cabecera.idusuario,
      idsucursal: cabecera.idsucursal,
      idproveedor: cabecera.idproveedor,
      tipo_comprobante: cabecera.tipo_comprobante,
      serie_comprobante: cabecera.serie_comprobante,
      num_comprobante: cabecera.num_comprobante,
      fecha: cabecera.fecha,
      impuesto,
      total,
      estado: "Aceptado",
      proveedor: proveedor
        ? {
            idpersona: proveedor.idpersona,
            nombre: proveedor.nombre,
            num_documento: proveedor.num_documento,
          }
        : undefined,
      detalles: detalles.map((detalle, index) => ({
        iddetalle_ingreso: index + 1,
        idingreso: nuevoId,
        idarticulo: detalle.idarticulo,
        codigo: detalle.codigo,
        serie: detalle.serie ?? null,
        descripcion: detalle.descripcion ?? null,
        stock_ingreso: detalle.stock_ingreso,
        stock_actual: detalle.stock_ingreso,
        precio_compra: detalle.precio_compra,
        precio_ventadistribuidor: detalle.precio_ventadistribuidor,
        precio_ventapublico: detalle.precio_ventapublico,
      })),
    };

    INGRESOS_MOCK.unshift(mockIngreso);

    return {
      success: true,
      data: mockIngreso,
      usingMockData: true,
    };
  }

  try {
    const ingreso = await getPrisma().$transaction(async (tx) => {
      const nuevoIngreso = await tx.ingreso.create({
        data: {
          idusuario: cabecera.idusuario,
          idsucursal: cabecera.idsucursal,
          idproveedor: cabecera.idproveedor,
          tipo_comprobante: cabecera.tipo_comprobante,
          serie_comprobante: cabecera.serie_comprobante.trim(),
          num_comprobante: cabecera.num_comprobante.trim(),
          fecha: new Date(cabecera.fecha),
          impuesto,
          total,
          estado: "Aceptado",
        },
      });

      await tx.detalleIngreso.createMany({
        data: detalles.map((detalle) => ({
          idingreso: nuevoIngreso.idingreso,
          idarticulo: detalle.idarticulo,
          codigo: detalle.codigo.trim(),
          serie: detalle.serie?.trim() || null,
          descripcion: detalle.descripcion?.trim() || null,
          stock_ingreso: detalle.stock_ingreso,
          stock_actual: detalle.stock_ingreso,
          precio_compra: detalle.precio_compra,
          precio_ventadistribuidor: detalle.precio_ventadistribuidor,
          precio_ventapublico: detalle.precio_ventapublico,
        })),
      });

      return tx.ingreso.findUnique({
        where: { idingreso: nuevoIngreso.idingreso },
        include: {
          proveedor: {
            select: { idpersona: true, nombre: true, num_documento: true },
          },
          detalles: {
            include: {
              articulo: {
                select: { idarticulo: true, nombre: true },
              },
            },
          },
        },
      });
    });

    if (!ingreso) {
      return { success: false, error: "No se pudo recuperar el ingreso creado." };
    }

    revalidatePath(COMPRAS_PATH);
    return { success: true, data: mapIngreso(ingreso) };
  } catch {
    return {
      success: false,
      error: "No se pudo registrar el ingreso de compra.",
    };
  }
}
