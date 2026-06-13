import UnidadesManager from "@/components/mantenimiento/UnidadesManager";
import { getUnidadesMedida } from "@/lib/actions/unidad-medida";

export default async function UnidadesPage() {
  const result = await getUnidadesMedida();

  return (
    <UnidadesManager
      initialUnidades={result.data ?? []}
      usingMockData={result.usingMockData}
    />
  );
}
