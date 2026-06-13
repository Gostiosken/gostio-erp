import ProveedoresManager from "@/components/compras/ProveedoresManager";
import { getProveedores } from "@/lib/actions/persona";

export default async function ProveedoresPage() {
  const result = await getProveedores();

  return (
    <ProveedoresManager
      initialProveedores={result.data ?? []}
      usingMockData={result.usingMockData}
    />
  );
}
