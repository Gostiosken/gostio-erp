import { notFound } from "next/navigation";
import VentaDetalleView from "@/components/ventas/VentaDetalleView";
import { getVentaById } from "@/lib/actions/venta";

type PageProps = {
  params: Promise<{ idventa: string }>;
};

export default async function VentaDetallePage({ params }: PageProps) {
  const { idventa } = await params;
  const id = Number.parseInt(idventa, 10);

  if (!Number.isInteger(id) || id < 1) {
    notFound();
  }

  const result = await getVentaById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <VentaDetalleView venta={result.data} />;
}
