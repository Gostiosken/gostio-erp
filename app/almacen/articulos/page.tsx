import ArticulosManager from "@/components/almacen/ArticulosManager";
import { getArticulos } from "@/lib/actions/articulo";
import { getCategorias } from "@/lib/actions/categoria";
import { getUnidadesMedida } from "@/lib/actions/unidad-medida";
import { isRegistroActivo } from "@/lib/types/categoria";

export default async function ArticulosPage() {
  const [articulosResult, categoriasResult, unidadesResult] = await Promise.all([
    getArticulos(),
    getCategorias(),
    getUnidadesMedida(),
  ]);

  const categoriasActivas =
    categoriasResult.data?.filter((categoria) => isRegistroActivo(categoria.estado)) ??
    [];
  const unidadesActivas =
    unidadesResult.data?.filter((unidad) => isRegistroActivo(unidad.estado)) ?? [];

  return (
    <ArticulosManager
      initialArticulos={articulosResult.data ?? []}
      categoriasActivas={categoriasActivas}
      unidadesActivas={unidadesActivas}
      usingMockData={
        articulosResult.usingMockData ||
        categoriasResult.usingMockData ||
        unidadesResult.usingMockData
      }
    />
  );
}
