import NuevaVentaForm from "@/components/ventas/NuevaVentaForm";
import { getClientes } from "@/lib/actions/persona";

export default async function NuevaVentaPage() {
  const clientesResult = await getClientes();

  return (
    <NuevaVentaForm
      clientes={clientesResult.data ?? []}
      usingMockData={clientesResult.usingMockData}
    />
  );
}
