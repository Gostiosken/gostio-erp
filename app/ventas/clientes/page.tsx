import ClientesManager from "@/components/ventas/ClientesManager";
import { getClientes } from "@/lib/actions/persona";

export default async function ClientesPage() {
  const result = await getClientes();

  return (
    <ClientesManager
      initialClientes={result.data ?? []}
      usingMockData={result.usingMockData}
    />
  );
}
