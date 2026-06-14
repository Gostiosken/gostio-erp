"use server";

import { revalidatePath } from "next/cache";
import { dbReadError, mockReadResult, shouldUseMockData } from "@/lib/action-db";
import {
  getProductosEcommerceMock,
  registrarPedidoWebMock,
} from "@/lib/data/ecommerce-mock";
import { obtenerOCrearClienteWebMock } from "@/lib/data/clientes-mock";
import { getPrisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/types/action";
import {
  calcularTotalesVentaMultiIva,
  normalizarTipoIva,
  type TipoIvaParaguay,
} from "@/lib/types/factura-ticket";
import type {
  CreatePedidoWebStore,
  ProductoEcommerce,
  ResultadoPedidoWeb,
} from "@/lib/types/ecommerce";
import type { PersonaInput } from "@/lib/types/persona";

const ECOMMERCE_PATH = "/tienda";
const SUCURSAL_MATRIZ_FALLBACK = 1;

async function resolverSucursalEcommerce(
  idsucursal?: number
): Promise<number | null> {
  if (idsucursal && idsucursal > 0) {
    return idsucursal;
  }

  if (shouldUseMockData()) {
    return SUCURSAL_MATRIZ_FALLBACK;
  }

  try {
    const matriz = await getPrisma().sucursal.findFirst({
      where: { estado: "1" },
      orderBy: { idsucursal: "asc" },
      select: { idsucursal: true },
    });
    return matriz?.idsucursal ?? null;
  } catch {
    return null;
  }
}

function agruparLotesEnProductos(
  lotes: Array<{
    iddetalle_ingreso: number;
    idarticulo: number;
    codigo: string;
    stock_actual: number;
    precio_ventapublico: { toString(): string };
    articulo: {
      idarticulo: number;
      nombre: string;
      descripcion: string | null;
      imagen: string | null;
      tipo_iva: string;
      categoria: { idcategoria: number; nombre: string };
      unidadMedida: {
        idunidad_medida: number;
        nombre: string;
        prefijo: string;
      };
    };
  }>
): ProductoEcommerce[] {
  const mapa = new Map<number, ProductoEcommerce>();

  for (const lote of lotes) {
    const existente = mapa.get(lote.idarticulo);

    if (!existente) {
      mapa.set(lote.idarticulo, {
        idarticulo: lote.articulo.idarticulo,
        iddetalle_ingreso: lote.iddetalle_ingreso,
        nombre: lote.articulo.nombre,
        descripcion: lote.articulo.descripcion,
        imagen: lote.articulo.imagen,
        precio_ventapublico: Number(lote.precio_ventapublico),
        stock_actual: lote.stock_actual,
        tipo_iva: normalizarTipoIva(lote.articulo.tipo_iva),
        categoria: lote.articulo.categoria,
        unidadMedida: lote.articulo.unidadMedida,
        codigo: lote.codigo,
      });
      continue;
    }

    existente.stock_actual += lote.stock_actual;
    if (lote.stock_actual > 0 && existente.iddetalle_ingreso > lote.iddetalle_ingreso) {
      existente.iddetalle_ingreso = lote.iddetalle_ingreso;
      existente.precio_ventapublico = Number(lote.precio_ventapublico);
      existente.codigo = lote.codigo;
    }
  }

  return Array.from(mapa.values()).sort((a, b) => a.idarticulo - b.idarticulo);
}

export async function getProductosEcommerce(
  idsucursal?: number
): Promise<ActionResult<ProductoEcommerce[]>> {
  const sucursalId = await resolverSucursalEcommerce(idsucursal);

  if (!sucursalId) {
    return { success: false, error: "No se encontró una sucursal activa para el catálogo web." };
  }

  if (shouldUseMockData()) {
    return mockReadResult(getProductosEcommerceMock(sucursalId));
  }

  try {
    const lotes = await getPrisma().detalleIngreso.findMany({
      where: {
        ingreso: { idsucursal: sucursalId },
        articulo: { estado: "1" },
      },
      include: {
        articulo: {
          select: {
            idarticulo: true,
            nombre: true,
            descripcion: true,
            imagen: true,
            tipo_iva: true,
            categoria: {
              select: { idcategoria: true, nombre: true },
            },
            unidadMedida: {
              select: { idunidad_medida: true, nombre: true, prefijo: true },
            },
          },
        },
      },
      orderBy: { iddetalle_ingreso: "asc" },
    });

    const productos = agruparLotesEnProductos(lotes).filter(
      (producto) => producto.stock_actual > 0
    );

    return { success: true, data: productos };
  } catch (error) {
    if (shouldUseMockData()) {
      return mockReadResult(getProductosEcommerceMock(sucursalId));
    }
    return dbReadError<ProductoEcommerce[]>(
      "No se pudo obtener el catálogo del e-commerce.",
      error
    );
  }
}

async function resolverTipoIvaDetallesWeb(
  detalles: CreatePedidoWebStore["detalles"]
): Promise<
  Array<CreatePedidoWebStore["detalles"][number] & { tipo_iva: TipoIvaParaguay }>
> {
  if (shouldUseMockData()) {
    return detalles.map((d) => ({
      ...d,
      tipo_iva: normalizarTipoIva(d.tipo_iva ?? "10"),
    }));
  }

  const ids = detalles.map((d) => d.iddetalle_ingreso);
  const lotes = await getPrisma().detalleIngreso.findMany({
    where: { iddetalle_ingreso: { in: ids } },
    include: { articulo: { select: { tipo_iva: true } } },
  });
  const mapaIva = new Map(
    lotes.map((l) => [l.iddetalle_ingreso, normalizarTipoIva(l.articulo.tipo_iva)])
  );

  return detalles.map((d) => ({
    ...d,
    tipo_iva: normalizarTipoIva(d.tipo_iva ?? mapaIva.get(d.iddetalle_ingreso) ?? "10"),
  }));
}

export async function registrarPedidoWeb(
  input: CreatePedidoWebStore
): Promise<ActionResult<ResultadoPedidoWeb>> {
  if (!input.idcliente) {
    return { success: false, error: "Debe indicar el cliente del pedido web." };
  }

  if (!input.idsucursal) {
    return { success: false, error: "Debe indicar la sucursal de despacho." };
  }

  if (!input.idusuario) {
    return { success: false, error: "Debe indicar el usuario responsable del pedido." };
  }

  if (!input.detalles.length) {
    return { success: false, error: "El carrito no contiene productos." };
  }

  const detallesConIva = await resolverTipoIvaDetallesWeb(input.detalles);
  const { impuesto, total, liquidacion } = calcularTotalesVentaMultiIva(detallesConIva);

  if (shouldUseMockData()) {
    const resultado = registrarPedidoWebMock({
      ...input,
      detalles: detallesConIva,
    });

    if ("error" in resultado) {
      return { success: false, error: resultado.error, usingMockData: true };
    }

    return { success: true, data: resultado, usingMockData: true };
  }

  try {
    const pedido = await getPrisma().$transaction(async (tx) => {
      for (const detalle of detallesConIva) {
        const lote = await tx.detalleIngreso.findUnique({
          where: { iddetalle_ingreso: detalle.iddetalle_ingreso },
          select: {
            stock_actual: true,
            ingreso: { select: { idsucursal: true } },
          },
        });

        if (!lote) {
          throw new Error("LOTE_NO_ENCONTRADO");
        }

        if (lote.ingreso.idsucursal !== input.idsucursal) {
          throw new Error("LOTE_SUCURSAL_INVALIDA");
        }

        if (lote.stock_actual < detalle.cantidad) {
          throw new Error("STOCK_INSUFICIENTE");
        }
      }

      const fecha = input.fecha
        ? new Date(input.fecha)
        : new Date();

      const nuevoPedido = await tx.pedido.create({
        data: {
          idcliente: input.idcliente,
          idusuario: input.idusuario,
          idsucursal: input.idsucursal,
          tipo_pedido: "Contado",
          origen: "WEB",
          fecha,
          estado: "Pendiente",
        },
      });

      for (const detalle of detallesConIva) {
        await tx.detallePedido.create({
          data: {
            idpedido: nuevoPedido.idpedido,
            iddetalle_ingreso: detalle.iddetalle_ingreso,
            cantidad: detalle.cantidad,
            precio_venta: detalle.precio_venta,
            descuento: detalle.descuento ?? null,
            tipo_iva: detalle.tipo_iva,
          },
        });
      }

      return nuevoPedido;
    });

    revalidatePath(ECOMMERCE_PATH);

    return {
      success: true,
      data: {
        idpedido: pedido.idpedido,
        impuesto,
        total,
        liquidacion,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "STOCK_INSUFICIENTE") {
        return {
          success: false,
          error: "Stock insuficiente para uno o más productos del carrito.",
        };
      }
      if (error.message === "LOTE_NO_ENCONTRADO") {
        return { success: false, error: "Uno de los productos del carrito no existe." };
      }
      if (error.message === "LOTE_SUCURSAL_INVALIDA") {
        return {
          success: false,
          error: "Un producto del carrito no pertenece a la sucursal de despacho.",
        };
      }
    }

    return { success: false, error: "No se pudo registrar el pedido web." };
  }
}

export async function ensureClienteWeb(
  input: PersonaInput
): Promise<ActionResult<{ idcliente: number }>> {
  if (!input.nombre.trim()) {
    return { success: false, error: "El nombre o razón social es obligatorio." };
  }

  if (!input.num_documento.trim()) {
    return { success: false, error: "El RUC o cédula es obligatorio." };
  }

  if (shouldUseMockData()) {
    const cliente = obtenerOCrearClienteWebMock({
      nombre: input.nombre,
      tipo_documento: input.tipo_documento,
      num_documento: input.num_documento,
      direccion: input.direccion,
      telefono: input.telefono,
      email: input.email,
    });
    return mockReadResult({ idcliente: cliente.idpersona });
  }

  try {
    const documento = input.num_documento.trim();
    const existente = await getPrisma().persona.findFirst({
      where: {
        tipo_persona: "Cliente",
        num_documento: documento,
      },
      select: { idpersona: true },
    });

    if (existente) {
      await getPrisma().persona.update({
        where: { idpersona: existente.idpersona },
        data: {
          nombre: input.nombre.trim(),
          tipo_documento: input.tipo_documento,
          direccion: input.direccion?.trim() || null,
          telefono: input.telefono?.trim() || null,
          email: input.email?.trim() || null,
          estado: "1",
        },
      });
      return { success: true, data: { idcliente: existente.idpersona } };
    }

    const creado = await getPrisma().persona.create({
      data: {
        tipo_persona: "Cliente",
        nombre: input.nombre.trim(),
        tipo_documento: input.tipo_documento,
        num_documento: documento,
        direccion: input.direccion?.trim() || null,
        telefono: input.telefono?.trim() || null,
        email: input.email?.trim() || null,
        estado: input.estado ?? "1",
      },
      select: { idpersona: true },
    });

    return { success: true, data: { idcliente: creado.idpersona } };
  } catch (error) {
    return dbReadError<{ idcliente: number }>(
      "No se pudo registrar los datos del cliente.",
      error
    );
  }
}
