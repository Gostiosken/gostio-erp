import type { Articulo, ArticuloInput } from "@/lib/types/articulo";
import { CATEGORIAS_MOCK } from "@/lib/data/categorias-mock";
import { UNIDADES_MOCK } from "@/lib/data/unidades-mock";

export const ARTICULOS_MOCK: Articulo[] = [
  {
    idarticulo: 1,
    idcategoria: 1,
    idunidad_medida: 4,
    nombre: "Agua Mineral 625ml",
    descripcion: "Agua mineral sin gas, botella individual.",
    imagen: null,
    estado: "1",
    categoria: { idcategoria: 1, nombre: "Bebidas" },
    unidadMedida: { idunidad_medida: 4, nombre: "Litro", prefijo: "Lt" },
  },
  {
    idarticulo: 2,
    idcategoria: 2,
    idunidad_medida: 1,
    nombre: "Arroz Extra 1kg",
    descripcion: "Arroz blanco de grano largo.",
    imagen: null,
    estado: "1",
    categoria: { idcategoria: 2, nombre: "Abarrotes" },
    unidadMedida: { idunidad_medida: 1, nombre: "Unidad", prefijo: "Und" },
  },
  {
    idarticulo: 3,
    idcategoria: 3,
    idunidad_medida: 2,
    nombre: "Detergente Líquido",
    descripcion: "Detergente concentrado para ropa, presentación familiar.",
    imagen: null,
    estado: "1",
    categoria: { idcategoria: 3, nombre: "Limpieza" },
    unidadMedida: { idunidad_medida: 2, nombre: "Caja", prefijo: "Cja" },
  },
  {
    idarticulo: 4,
    idcategoria: 1,
    idunidad_medida: 2,
    nombre: "Gaseosa Cola 355ml x24",
    descripcion: "Pack de gaseosa en lata.",
    imagen: null,
    estado: "0",
    categoria: { idcategoria: 1, nombre: "Bebidas" },
    unidadMedida: { idunidad_medida: 2, nombre: "Caja", prefijo: "Cja" },
  },
  {
    idarticulo: 10,
    idcategoria: 10,
    idunidad_medida: 4,
    nombre: "Tinta Plastisol Negra 1L",
    descripcion:
      "Tinta plastisol de alta opacidad para serigrafía textil. Secado rápido y excelente cubrimiento.",
    imagen: "/img/ecommerce/tinta-plastisol-negra.jpg",
    estado: "1",
    categoria: { idcategoria: 10, nombre: "Tintas Serigrafía" },
    unidadMedida: { idunidad_medida: 4, nombre: "Litro", prefijo: "Lt" },
  },
  {
    idarticulo: 11,
    idcategoria: 10,
    idunidad_medida: 4,
    nombre: "Tinta Base Agua Cyan 500ml",
    descripcion: "Tinta base agua ecológica color cyan para textiles claros.",
    imagen: "/img/ecommerce/tinta-agua-cyan.jpg",
    estado: "1",
    categoria: { idcategoria: 10, nombre: "Tintas Serigrafía" },
    unidadMedida: { idunidad_medida: 4, nombre: "Litro", prefijo: "Lt" },
  },
  {
    idarticulo: 12,
    idcategoria: 11,
    idunidad_medida: 6,
    nombre: "Vinilo Textil Transfer Rojo 50cm",
    descripcion: "Vinilo termotransferible rojo brillante, ancho 50 cm.",
    imagen: "/img/ecommerce/vinilo-textil-rojo.jpg",
    estado: "1",
    categoria: { idcategoria: 11, nombre: "Vinilos Textiles" },
    unidadMedida: { idunidad_medida: 6, nombre: "Metro", prefijo: "Mt" },
  },
  {
    idarticulo: 13,
    idcategoria: 11,
    idunidad_medida: 6,
    nombre: "Vinilo PU Flex Blanco 30cm",
    descripcion: "Vinilo poliuretano flexible blanco para corte y transfer.",
    imagen: "/img/ecommerce/vinilo-pu-blanco.jpg",
    estado: "1",
    categoria: { idcategoria: 11, nombre: "Vinilos Textiles" },
    unidadMedida: { idunidad_medida: 6, nombre: "Metro", prefijo: "Mt" },
  },
  {
    idarticulo: 14,
    idcategoria: 12,
    idunidad_medida: 1,
    nombre: "Plotter de Corte 60cm Pro",
    descripcion: "Plotter profesional 60 cm con servo motor y software incluido.",
    imagen: "/img/ecommerce/plotter-corte-60.jpg",
    estado: "1",
    categoria: { idcategoria: 12, nombre: "Maquinaria Serigrafía" },
    unidadMedida: { idunidad_medida: 1, nombre: "Unidad", prefijo: "Und" },
  },
  {
    idarticulo: 15,
    idcategoria: 12,
    idunidad_medida: 1,
    nombre: "Mesa Serigráfica 4 Colores",
    descripcion: "Mesa manual con microregistro y 4 estaciones de color.",
    imagen: "/img/ecommerce/mesa-serigrafia-4c.jpg",
    estado: "1",
    categoria: { idcategoria: 12, nombre: "Maquinaria Serigrafía" },
    unidadMedida: { idunidad_medida: 1, nombre: "Unidad", prefijo: "Und" },
  },
];

export function getArticulosMockVisibles(): Articulo[] {
  return ARTICULOS_MOCK.filter((articulo) => articulo.estado !== "N");
}

export function buildMockArticulo(
  idarticulo: number,
  input: ArticuloInput
): Articulo | null {
  const categoria = CATEGORIAS_MOCK.find(
    (item) => item.idcategoria === input.idcategoria
  );
  const unidadMedida = UNIDADES_MOCK.find(
    (item) => item.idunidad_medida === input.idunidad_medida
  );

  if (!categoria || !unidadMedida) return null;

  return {
    idarticulo,
    idcategoria: input.idcategoria,
    idunidad_medida: input.idunidad_medida,
    nombre: input.nombre.trim(),
    descripcion: input.descripcion?.trim() || null,
    imagen: input.imagen?.trim() || null,
    estado: input.estado ?? "1",
    categoria: {
      idcategoria: categoria.idcategoria,
      nombre: categoria.nombre,
    },
    unidadMedida: {
      idunidad_medida: unidadMedida.idunidad_medida,
      nombre: unidadMedida.nombre,
      prefijo: unidadMedida.prefijo,
    },
  };
}
