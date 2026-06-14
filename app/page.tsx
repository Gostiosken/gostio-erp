import type { Metadata } from "next";
import { getProductosEcommerce } from "@/lib/actions/ecommerce";
import TiendaView from "@/components/ecommerce/TiendaView";

export const metadata: Metadata = {
  title: "FabriColor | Tienda de Insumos y Maquinaria",
  description:
    "FabriColor — Tienda online de tintas, vinilos textiles y maquinaria para serigrafía en Paraguay.",
};

export default async function TiendaPage() {
  const resultado = await getProductosEcommerce();

  return (
    <TiendaView
      productos={resultado.data ?? []}
      error={resultado.success ? undefined : resultado.error}
      usingMockData={resultado.usingMockData}
    />
  );
}
