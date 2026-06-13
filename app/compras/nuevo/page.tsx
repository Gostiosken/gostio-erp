import NuevoIngresoForm from "@/components/compras/NuevoIngresoForm";
import { getArticulos } from "@/lib/actions/articulo";
import { getProveedores } from "@/lib/actions/persona";

export default async function NuevoIngresoPage() {
  const [proveedoresResult, articulosResult] = await Promise.all([
    getProveedores(),
    getArticulos(),
  ]);

  return (
    <NuevoIngresoForm
      proveedores={proveedoresResult.data ?? []}
      articulos={articulosResult.data ?? []}
      usingMockData={
        proveedoresResult.usingMockData || articulosResult.usingMockData
      }
    />
  );
}
