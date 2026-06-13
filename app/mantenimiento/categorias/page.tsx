import CategoriasManager from "@/components/mantenimiento/CategoriasManager";
import { getCategorias } from "@/lib/actions/categoria";

export default async function CategoriasPage() {
  const result = await getCategorias();

  return (
    <CategoriasManager
      initialCategorias={result.data ?? []}
      usingMockData={result.usingMockData}
    />
  );
}
