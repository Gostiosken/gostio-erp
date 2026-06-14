"use server";

import { revalidatePath } from "next/cache";
import { shouldUseMockData } from "@/lib/action-db";
import { getPrisma } from "@/lib/prisma";
import { normalizarTipoIva } from "@/lib/types/factura-ticket";
import type { ActionResult } from "@/lib/types/action";
import type {
  ErrorFilaImportacion,
  FilaImportacionInput,
  FilaImportacionNormalizada,
  ResultadoImportacionMasiva,
  TasaIvaImportacion,
  TipoArticuloImportacion,
} from "@/lib/types/importador-inventario";

const CHUNK_SIZE = 100;
const STOCK_SERVICIO_VIRTUAL = 999_999;
const ARTICULOS_PATH = "/almacen/articulos";
const COMPRAS_PATH = "/compras/nuevo";

type PrismaTx = Parameters<
  Parameters<ReturnType<typeof getPrisma>["$transaction"]>[0]
>[0];

type LoteExistente = {
  iddetalle_ingreso: number;
  idarticulo: number;
  idsucursal: number;
  stock_actual: number;
};

type ContextoImportacion = {
  idcategoriaDefault: number;
  idunidadMedidaDefault: number;
  idusuario: number;
  idproveedor: number;
};

function limpiarMontoFinanciero(valor: string | number): number {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? Math.round(valor) : 0;
  }

  const texto = valor.trim();
  if (!texto) return 0;

  const sinMoneda = texto.replace(/Gs\.?/gi, "").trim();
  const tieneComaDecimal = /,\d{1,2}$/.test(sinMoneda);
  const normalizado = tieneComaDecimal
    ? sinMoneda.replace(/\./g, "").replace(",", ".")
    : sinMoneda.replace(/\./g, "").replace(/,/g, "");

  const soloNumeros = normalizado.replace(/[^\d.]/g, "");
  const parsed = Number.parseFloat(soloNumeros);

  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

function limpiarEntero(valor: string | number): number {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? Math.max(0, Math.round(valor)) : 0;
  }

  const monto = limpiarMontoFinanciero(valor);
  return Math.max(0, monto);
}

function normalizarTipoArticulo(valor: string): TipoArticuloImportacion {
  const upper = valor.trim().toUpperCase();
  return upper === "SERVICIO" ? "SERVICIO" : "PRODUCTO";
}

function normalizarTasaIva(valor: string | number): TasaIvaImportacion {
  const tipo = normalizarTipoIva(String(valor));
  if (tipo === "5") return "5";
  if (tipo === "EXENTA") return "EXENTA";
  return "10";
}

function normalizarNombreCategoria(nombre: string | null | undefined): string | null {
  const limpio = nombre?.trim();
  return limpio ? limpio.slice(0, 50) : null;
}

function validarYNormalizarFila(
  fila: FilaImportacionInput,
  indice: number
): { data?: FilaImportacionNormalizada; error?: ErrorFilaImportacion } {
  const codigoBarra = fila.codigoBarra?.trim();
  const nombre = fila.nombre?.trim();

  if (!codigoBarra) {
    return {
      error: {
        indice,
        codigoBarra: codigoBarra ?? "",
        mensaje: "El código de barra es obligatorio.",
      },
    };
  }

  if (!nombre) {
    return {
      error: {
        indice,
        codigoBarra,
        mensaje: "El nombre del artículo es obligatorio.",
      },
    };
  }

  const costoBruto = limpiarMontoFinanciero(fila.costoBruto);
  const precioVentaPublico = limpiarMontoFinanciero(fila.precioVentaPublico);

  if (costoBruto < 0 || precioVentaPublico < 0) {
    return {
      error: {
        indice,
        codigoBarra,
        mensaje: "Los montos de costo y precio no pueden ser negativos.",
      },
    };
  }

  const tipo = normalizarTipoArticulo(String(fila.tipo ?? "PRODUCTO"));
  const stockInicial = tipo === "SERVICIO" ? 0 : limpiarEntero(fila.stockInicial);

  return {
    data: {
      indice,
      codigoBarra: codigoBarra.slice(0, 50),
      nombre: nombre.slice(0, 50),
      descripcion: fila.descripcion?.trim() || null,
      costoBruto,
      precioVentaPublico,
      stockInicial,
      tasaIva: normalizarTasaIva(fila.tasaIva),
      nombreCategoria: normalizarNombreCategoria(fila.nombreCategoria),
      tipo,
    },
  };
}

function dividirEnChunks<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function resolverContextoImportacion(
  tx: PrismaTx,
  idsucursal: number
): Promise<ContextoImportacion> {
  const [categoriaDefault, unidadDefault, usuario, proveedor] = await Promise.all([
    tx.categoria.findFirst({
      where: { estado: "1" },
      orderBy: { idcategoria: "asc" },
    }),
    tx.unidadMedida.findFirst({
      where: { estado: "1" },
      orderBy: { idunidad_medida: "asc" },
    }),
    tx.usuario.findFirst({
      where: { idsucursal, estado: "1" },
      orderBy: { idusuario: "asc" },
    }),
    tx.persona.findFirst({
      where: { tipo_persona: "Proveedor", estado: "1" },
      orderBy: { idpersona: "asc" },
    }),
  ]);

  if (!categoriaDefault) {
    throw new Error("No hay categorías activas para asociar los artículos importados.");
  }

  if (!unidadDefault) {
    throw new Error("No hay unidades de medida activas para asociar los artículos importados.");
  }

  if (!usuario) {
    throw new Error("No hay usuarios activos en la sucursal seleccionada.");
  }

  let idproveedor = proveedor?.idpersona;

  if (!idproveedor) {
    const proveedorImportacion = await tx.persona.create({
      data: {
        tipo_persona: "Proveedor",
        nombre: "Importación Masiva",
        tipo_documento: "RUC",
        num_documento: "IMPORT-000",
        estado: "1",
      },
    });
    idproveedor = proveedorImportacion.idpersona;
  }

  return {
    idcategoriaDefault: categoriaDefault.idcategoria,
    idunidadMedidaDefault: unidadDefault.idunidad_medida,
    idusuario: usuario.idusuario,
    idproveedor,
  };
}

async function resolverCategoriasChunk(
  tx: PrismaTx,
  filas: FilaImportacionNormalizada[],
  idcategoriaDefault: number
): Promise<Map<string, number>> {
  const nombresUnicos = [
    ...new Set(
      filas
        .map((fila) => fila.nombreCategoria)
        .filter((nombre): nombre is string => Boolean(nombre))
    ),
  ];

  const mapa = new Map<string, number>();

  if (nombresUnicos.length === 0) {
    return mapa;
  }

  const existentes = await tx.categoria.findMany({
    where: { nombre: { in: nombresUnicos } },
    select: { idcategoria: true, nombre: true },
  });

  for (const categoria of existentes) {
    mapa.set(categoria.nombre.toLowerCase(), categoria.idcategoria);
  }

  for (const nombre of nombresUnicos) {
    const clave = nombre.toLowerCase();
    if (mapa.has(clave)) continue;

    const creada = await tx.categoria.create({
      data: { nombre, estado: "1" },
      select: { idcategoria: true, nombre: true },
    });
    mapa.set(clave, creada.idcategoria);
  }

  mapa.set("__default__", idcategoriaDefault);
  return mapa;
}

async function cargarLotesPorCodigo(
  tx: PrismaTx,
  codigos: string[]
): Promise<Map<string, LoteExistente[]>> {
  if (codigos.length === 0) return new Map();

  const lotes = await tx.detalleIngreso.findMany({
    where: { codigo: { in: codigos } },
    select: {
      iddetalle_ingreso: true,
      idarticulo: true,
      codigo: true,
      stock_actual: true,
      ingreso: { select: { idsucursal: true } },
    },
  });

  const mapa = new Map<string, LoteExistente[]>();

  for (const lote of lotes) {
    const actual = mapa.get(lote.codigo) ?? [];
    actual.push({
      iddetalle_ingreso: lote.iddetalle_ingreso,
      idarticulo: lote.idarticulo,
      idsucursal: lote.ingreso.idsucursal,
      stock_actual: lote.stock_actual,
    });
    mapa.set(lote.codigo, actual);
  }

  return mapa;
}

function obtenerIdCategoria(
  fila: FilaImportacionNormalizada,
  mapaCategorias: Map<string, number>,
  idcategoriaDefault: number
): number {
  if (!fila.nombreCategoria) return idcategoriaDefault;
  return mapaCategorias.get(fila.nombreCategoria.toLowerCase()) ?? idcategoriaDefault;
}

function obtenerLoteSucursal(
  lotes: LoteExistente[] | undefined,
  idsucursal: number
): LoteExistente | undefined {
  return lotes?.find((lote) => lote.idsucursal === idsucursal);
}

function obtenerArticuloReferencia(
  lotes: LoteExistente[] | undefined
): LoteExistente | undefined {
  return lotes?.[0];
}

async function procesarFilaImportacion(
  tx: PrismaTx,
  fila: FilaImportacionNormalizada,
  idsucursal: number,
  contexto: ContextoImportacion,
  mapaCategorias: Map<string, number>,
  lotesPorCodigo: Map<string, LoteExistente[]>,
  idingresoImportacion: number
): Promise<void> {
  const idcategoria = obtenerIdCategoria(
    fila,
    mapaCategorias,
    contexto.idcategoriaDefault
  );

  const lotesExistentes = lotesPorCodigo.get(fila.codigoBarra);
  const loteSucursal = obtenerLoteSucursal(lotesExistentes, idsucursal);
  const referenciaGlobal = obtenerArticuloReferencia(lotesExistentes);

  const precioDistribuidor = fila.precioVentaPublico;
  const esServicio = fila.tipo === "SERVICIO";
  const stockProducto = fila.stockInicial;

  if (loteSucursal) {
    await tx.articulo.update({
      where: { idarticulo: loteSucursal.idarticulo },
      data: {
        nombre: fila.nombre,
        descripcion: fila.descripcion,
        idcategoria,
        tipo_iva: fila.tasaIva,
        estado: "1",
      },
    });

    await tx.detalleIngreso.update({
      where: { iddetalle_ingreso: loteSucursal.iddetalle_ingreso },
      data: {
        precio_compra: fila.costoBruto,
        precio_ventadistribuidor: precioDistribuidor,
        precio_ventapublico: fila.precioVentaPublico,
        descripcion: fila.descripcion,
        ...(esServicio
          ? {}
          : {
              stock_actual: stockProducto,
              stock_ingreso: stockProducto,
            }),
      },
    });

    return;
  }

  let idarticulo = referenciaGlobal?.idarticulo;

  if (idarticulo) {
    await tx.articulo.update({
      where: { idarticulo },
      data: {
        nombre: fila.nombre,
        descripcion: fila.descripcion,
        idcategoria,
        tipo_iva: fila.tasaIva,
        estado: "1",
      },
    });
  } else {
    const articuloNuevo = await tx.articulo.create({
      data: {
        idcategoria,
        idunidad_medida: contexto.idunidadMedidaDefault,
        nombre: fila.nombre,
        descripcion: fila.descripcion,
        tipo_iva: fila.tasaIva,
        estado: "1",
      },
      select: { idarticulo: true },
    });
    idarticulo = articuloNuevo.idarticulo;
  }

  const stockIngreso = esServicio ? STOCK_SERVICIO_VIRTUAL : stockProducto;
  const stockActual = esServicio ? STOCK_SERVICIO_VIRTUAL : stockProducto;

  const nuevoLote = await tx.detalleIngreso.create({
    data: {
      idingreso: idingresoImportacion,
      idarticulo,
      codigo: fila.codigoBarra,
      serie: null,
      descripcion: fila.descripcion,
      stock_ingreso: stockIngreso,
      stock_actual: stockActual,
      precio_compra: fila.costoBruto,
      precio_ventadistribuidor: precioDistribuidor,
      precio_ventapublico: fila.precioVentaPublico,
    },
    select: {
      iddetalle_ingreso: true,
      idarticulo: true,
      codigo: true,
      stock_actual: true,
      ingreso: { select: { idsucursal: true } },
    },
  });

  const actuales = lotesPorCodigo.get(fila.codigoBarra) ?? [];
  actuales.push({
    iddetalle_ingreso: nuevoLote.iddetalle_ingreso,
    idarticulo: nuevoLote.idarticulo,
    idsucursal: nuevoLote.ingreso.idsucursal,
    stock_actual: nuevoLote.stock_actual,
  });
  lotesPorCodigo.set(fila.codigoBarra, actuales);
}

async function procesarChunk(
  idsucursal: number,
  filas: FilaImportacionNormalizada[],
  numeroChunk: number
): Promise<{ exitosas: number; errores: ErrorFilaImportacion[] }> {
  const prisma = getPrisma();
  const errores: ErrorFilaImportacion[] = [];
  let exitosas = 0;

  await prisma.$transaction(async (tx) => {
    const contexto = await resolverContextoImportacion(tx, idsucursal);
    const mapaCategorias = await resolverCategoriasChunk(
      tx,
      filas,
      contexto.idcategoriaDefault
    );

    const codigos = [...new Set(filas.map((fila) => fila.codigoBarra))];
    const lotesPorCodigo = await cargarLotesPorCodigo(tx, codigos);

    const ingresoImportacion = await tx.ingreso.create({
      data: {
        idusuario: contexto.idusuario,
        idsucursal,
        idproveedor: contexto.idproveedor,
        tipo_comprobante: "IMPORT",
        serie_comprobante: "IMP",
        num_comprobante: `${Date.now()}${numeroChunk}`.slice(-10),
        fecha: new Date(),
        impuesto: 0,
        total: 0,
        estado: "Aceptado",
      },
      select: { idingreso: true },
    });

    for (const fila of filas) {
      try {
        await procesarFilaImportacion(
          tx,
          fila,
          idsucursal,
          contexto,
          mapaCategorias,
          lotesPorCodigo,
          ingresoImportacion.idingreso
        );
        exitosas += 1;
      } catch (error) {
        const mensaje =
          error instanceof Error
            ? error.message
            : "Error desconocido al procesar la fila.";
        errores.push({
          indice: fila.indice,
          codigoBarra: fila.codigoBarra,
          mensaje,
        });
      }
    }
  });

  return { exitosas, errores };
}

export async function procesarImportacionMasiva(
  idsucursal: number,
  filas: FilaImportacionInput[]
): Promise<ActionResult<ResultadoImportacionMasiva>> {
  if (!idsucursal) {
    return { success: false, error: "Sucursal no válida." };
  }

  if (!filas.length) {
    return { success: false, error: "No se recibieron filas para importar." };
  }

  if (shouldUseMockData()) {
    return {
      success: false,
      error:
        "Base de datos no configurada. Configure DATABASE_URL para importar inventario.",
      usingMockData: true,
    };
  }

  const erroresValidacion: ErrorFilaImportacion[] = [];
  const filasNormalizadas: FilaImportacionNormalizada[] = [];

  filas.forEach((fila, index) => {
    const resultado = validarYNormalizarFila(fila, index + 1);
    if (resultado.error) {
      erroresValidacion.push(resultado.error);
      return;
    }
    if (resultado.data) {
      filasNormalizadas.push(resultado.data);
    }
  });

  if (!filasNormalizadas.length) {
    return {
      success: false,
      error: "Ninguna fila superó la validación inicial.",
      data: {
        idsucursal,
        totalFilas: filas.length,
        exitosas: 0,
        fallidas: filas.length,
        errores: erroresValidacion,
      },
    };
  }

  try {
    const chunks = dividirEnChunks(filasNormalizadas, CHUNK_SIZE);
    let exitosas = 0;
    const erroresProceso: ErrorFilaImportacion[] = [];

    console.log(
      `[Importador Inventario] Iniciando importación en sucursal ${idsucursal}: ${filasNormalizadas.length} filas válidas en ${chunks.length} lote(s).`
    );

    for (let i = 0; i < chunks.length; i += 1) {
      const chunk = chunks[i];
      console.log(
        `[Importador Inventario] Procesando lote ${i + 1}/${chunks.length} (${chunk.length} filas)...`
      );

      const resultadoChunk = await procesarChunk(idsucursal, chunk, i + 1);
      exitosas += resultadoChunk.exitosas;
      erroresProceso.push(...resultadoChunk.errores);

      console.log(
        `[Importador Inventario] Lote ${i + 1} finalizado: ${resultadoChunk.exitosas} éxito(s), ${resultadoChunk.errores.length} fallo(s).`
      );
    }

    const fallidas = erroresValidacion.length + erroresProceso.length;
    const resultado: ResultadoImportacionMasiva = {
      idsucursal,
      totalFilas: filas.length,
      exitosas,
      fallidas,
      errores: [...erroresValidacion, ...erroresProceso],
    };

    console.log(
      `[Importador Inventario] Importación finalizada. Total: ${resultado.totalFilas} | Éxitos: ${resultado.exitosas} | Fallos: ${resultado.fallidas}`
    );

    if (resultado.exitosas > 0) {
      revalidatePath(ARTICULOS_PATH);
      revalidatePath(COMPRAS_PATH);
    }

    return { success: true, data: resultado };
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error inesperado en la importación.";
    console.error("[Importador Inventario] Error crítico:", error);

    return {
      success: false,
      error: `No se pudo completar la importación masiva. ${mensaje}`,
    };
  }
}
