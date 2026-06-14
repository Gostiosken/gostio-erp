import type { TipoIvaParaguay } from "@/lib/types/factura-ticket";

export const CART_STORAGE_KEY = "fabricolor-ecommerce-cart";

export interface CartItem {
  idarticulo: number;
  iddetalle_ingreso: number;
  nombre: string;
  precio: number;
  cantidad: number;
  stock_max: number;
  tipo_iva: TipoIvaParaguay;
  categoria: string;
  imagen: string | null;
}

export type CategoriaFiltroTienda =
  | "todos"
  | "insumos"
  | "tintas"
  | "vinilos"
  | "maquinarias";

export const FILTROS_CATEGORIA: Array<{
  id: CategoriaFiltroTienda;
  etiqueta: string;
}> = [
  { id: "todos", etiqueta: "Todos" },
  { id: "insumos", etiqueta: "Insumos" },
  { id: "tintas", etiqueta: "Tintas" },
  { id: "vinilos", etiqueta: "Vinilos" },
  { id: "maquinarias", etiqueta: "Maquinarias" },
];

export const DEPARTAMENTOS_PARAGUAY = [
  "Asunción",
  "Alto Paraguay",
  "Alto Paraná",
  "Amambay",
  "Boquerón",
  "Caaguazú",
  "Caazapá",
  "Canindeyú",
  "Central",
  "Concepción",
  "Cordillera",
  "Guairá",
  "Itapúa",
  "Misiones",
  "Ñeembucú",
  "Paraguarí",
  "Presidente Hayes",
  "San Pedro",
] as const;

export const WEB_USUARIO_SISTEMA = 1;
export const WEB_SUCURSAL_MATRIZ = 1;

export function filtrarProductosPorCategoria<
  T extends { categoria: { idcategoria: number; nombre: string } },
>(productos: T[], filtro: CategoriaFiltroTienda): T[] {
  if (filtro === "todos") return productos;
  if (filtro === "tintas") {
    return productos.filter((p) => p.categoria.idcategoria === 10);
  }
  if (filtro === "vinilos") {
    return productos.filter((p) => p.categoria.idcategoria === 11);
  }
  if (filtro === "maquinarias") {
    return productos.filter((p) => p.categoria.idcategoria === 12);
  }
  return productos.filter(
    (p) => p.categoria.idcategoria === 10 || p.categoria.idcategoria === 11
  );
}
