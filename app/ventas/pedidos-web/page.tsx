import PedidosWebManager from "@/components/ventas/PedidosWebManager";
import { getPedidosWeb } from "@/lib/actions/admin-ecommerce";

export default async function PedidosWebPage() {
  const result = await getPedidosWeb();

  return (
    <PedidosWebManager
      initialPedidos={result.data ?? []}
      loadError={result.success ? undefined : result.error}
      usingMockData={result.usingMockData}
    />
  );
}
