import { INGRESOS_MOCK } from "@/lib/data/ingresos-mock";
import { normalizarTipoIva } from "@/lib/types/factura-ticket";
import type { ProductoEcommerce } from "@/lib/types/ecommerce";
import type { CreatePedidoWebStore, ResultadoPedidoWeb, EstadoPedidoWeb } from "@/lib/types/ecommerce";
import { calcularTotalesVentaMultiIva } from "@/lib/types/factura-ticket";
import { obtenerStockMock } from "@/lib/data/stock-mock";

/** IDs de artículos del catálogo web (rubro serigrafía). */
export const ARTICULOS_ECOMMERCE_IDS = [10, 11, 12, 13, 14, 15] as const;

const PRODUCTOS_SERIGRAFIA: ProductoEcommerce[] = [
  {
    idarticulo: 10,
    iddetalle_ingreso: 10,
    nombre: "Tinta Plastisol Negra 1L",
    descripcion:
      "Tinta plastisol de alta opacidad para serigrafía textil. Secado rápido y excelente cubrimiento sobre algodón y poliéster.",
    imagen: "/img/ecommerce/tinta-plastisol-negra.jpg",
    precio_ventapublico: 185_000,
    stock_actual: 48,
    tipo_iva: "10",
    categoria: { idcategoria: 10, nombre: "Tintas Serigrafía" },
    unidadMedida: { idunidad_medida: 4, nombre: "Litro", prefijo: "Lt" },
    codigo: "TINTA-PLS-NEG-1L",
  },
  {
    idarticulo: 11,
    iddetalle_ingreso: 11,
    nombre: "Tinta Base Agua Cyan 500ml",
    descripcion:
      "Tinta base agua ecológica color cyan para impresión sobre textiles claros. Libre de ftalatos.",
    imagen: "/img/ecommerce/tinta-agua-cyan.jpg",
    precio_ventapublico: 95_000,
    stock_actual: 32,
    tipo_iva: "10",
    categoria: { idcategoria: 10, nombre: "Tintas Serigrafía" },
    unidadMedida: { idunidad_medida: 4, nombre: "Litro", prefijo: "Lt" },
    codigo: "TINTA-AGU-CYA-500",
  },
  {
    idarticulo: 12,
    iddetalle_ingreso: 12,
    nombre: "Vinilo Textil Transfer Rojo 50cm",
    descripcion:
      "Rollo de vinilo textil termotransferible rojo brillante, ancho 50 cm. Ideal para estampados personalizados.",
    imagen: "/img/ecommerce/vinilo-textil-rojo.jpg",
    precio_ventapublico: 120_000,
    stock_actual: 25,
    tipo_iva: "10",
    categoria: { idcategoria: 11, nombre: "Vinilos Textiles" },
    unidadMedida: { idunidad_medida: 6, nombre: "Metro", prefijo: "Mt" },
    codigo: "VIN-TXT-ROJ-50",
  },
  {
    idarticulo: 13,
    iddetalle_ingreso: 13,
    nombre: "Vinilo PU Flex Blanco 30cm",
    descripcion:
      "Vinilo poliuretano flexible blanco para corte y transfer en camisetas deportivas.",
    imagen: "/img/ecommerce/vinilo-pu-blanco.jpg",
    precio_ventapublico: 78_000,
    stock_actual: 40,
    tipo_iva: "10",
    categoria: { idcategoria: 11, nombre: "Vinilos Textiles" },
    unidadMedida: { idunidad_medida: 6, nombre: "Metro", prefijo: "Mt" },
    codigo: "VIN-PU-BLA-30",
  },
  {
    idarticulo: 14,
    iddetalle_ingreso: 14,
    nombre: "Plotter de Corte 60cm Pro",
    descripcion:
      "Plotter de corte profesional 60 cm con servo motor, presión ajustable y software incluido para vinilos y stencils.",
    imagen: "/img/ecommerce/plotter-corte-60.jpg",
    precio_ventapublico: 4_850_000,
    stock_actual: 3,
    tipo_iva: "5",
    categoria: { idcategoria: 12, nombre: "Maquinaria Serigrafía" },
    unidadMedida: { idunidad_medida: 1, nombre: "Unidad", prefijo: "Und" },
    codigo: "PLOT-60-PRO",
  },
  {
    idarticulo: 15,
    iddetalle_ingreso: 15,
    nombre: "Mesa Serigráfica 4 Colores",
    descripcion:
      "Mesa manual de serigrafía con sistema de microregistro, 4 estaciones de color y carro deslizante.",
    imagen: "/img/ecommerce/mesa-serigrafia-4c.jpg",
    precio_ventapublico: 2_350_000,
    stock_actual: 2,
    tipo_iva: "5",
    categoria: { idcategoria: 12, nombre: "Maquinaria Serigrafía" },
    codigo: "MESA-SERI-4C",
    unidadMedida: { idunidad_medida: 1, nombre: "Unidad", prefijo: "Und" },
  },
];

export function getProductosEcommerceMock(idsucursal: number): ProductoEcommerce[] {
  if (idsucursal !== 1) {
    return [];
  }

  return PRODUCTOS_SERIGRAFIA.map((producto) => {
    const stock = obtenerStockMock(producto.iddetalle_ingreso);
    return {
      ...producto,
      stock_actual: stock > 0 ? stock : producto.stock_actual,
    };
  });
}

type PedidoWebMock = {
  idpedido: number;
  origen: "WEB";
  estado: EstadoPedidoWeb;
  idsucursal: number;
  idcliente: number;
  idusuario: number;
  fecha: string;
  detalles: CreatePedidoWebStore["detalles"];
  resultado: ResultadoPedidoWeb;
  idventa?: number | null;
};

export const PEDIDOS_WEB_MOCK: PedidoWebMock[] = [];

let mockPedidoWebCounter = 100;

export function getNextMockPedidoWebId(): number {
  mockPedidoWebCounter += 1;
  return mockPedidoWebCounter;
}

export function registrarPedidoWebMock(
  input: CreatePedidoWebStore
): ResultadoPedidoWeb | { error: string } {
  if (!input.detalles.length) {
    return { error: "El carrito no contiene productos." };
  }

  for (const detalle of input.detalles) {
    const stock = obtenerStockMock(detalle.iddetalle_ingreso);
    if (stock < detalle.cantidad) {
      return {
        error: `Stock insuficiente para el lote #${detalle.iddetalle_ingreso}.`,
      };
    }
  }

  const detallesConIva = input.detalles.map((d) => ({
    ...d,
    tipo_iva: normalizarTipoIva(d.tipo_iva ?? "10"),
  }));

  const { impuesto, total, liquidacion } = calcularTotalesVentaMultiIva(detallesConIva);
  const idpedido = getNextMockPedidoWebId();

  const resultado: ResultadoPedidoWeb = {
    idpedido,
    impuesto,
    total,
    liquidacion,
  };

  PEDIDOS_WEB_MOCK.unshift({
    idpedido,
    origen: "WEB",
    estado: "Pendiente",
    idsucursal: input.idsucursal,
    idcliente: input.idcliente,
    idusuario: input.idusuario,
    fecha: input.fecha ?? new Date().toISOString().slice(0, 10),
    detalles: detallesConIva,
    resultado,
  });

  return resultado;
}

/** Sincroniza lotes mock con el catálogo serigrafía (sucursal matriz). */
export function seedIngresosEcommerceMock(): void {
  const ingresoMatriz = INGRESOS_MOCK.find((i) => i.idsucursal === 1);
  if (!ingresoMatriz) return;

  const detallesSerigrafia = PRODUCTOS_SERIGRAFIA.map((p) => ({
    iddetalle_ingreso: p.iddetalle_ingreso,
    idingreso: ingresoMatriz.idingreso,
    idarticulo: p.idarticulo,
    codigo: p.codigo,
    serie: null,
    descripcion: p.nombre,
    stock_ingreso: p.stock_actual,
    stock_actual: p.stock_actual,
    precio_compra: Math.round(p.precio_ventapublico * 0.65),
    precio_ventadistribuidor: Math.round(p.precio_ventapublico * 0.85),
    precio_ventapublico: p.precio_ventapublico,
    articulo: { idarticulo: p.idarticulo, nombre: p.nombre },
  }));

  const idsExistentes = new Set(
    (ingresoMatriz.detalles ?? []).map((d) => d.iddetalle_ingreso)
  );

  for (const detalle of detallesSerigrafia) {
    if (!idsExistentes.has(detalle.iddetalle_ingreso)) {
      ingresoMatriz.detalles = [...(ingresoMatriz.detalles ?? []), detalle];
    }
  }
}

seedIngresosEcommerceMock();
