import SucursalesManager from "@/components/sucursales/SucursalesManager";
import { getSucursales } from "@/lib/actions/sucursal";

export default async function SucursalesPage() {
  const result = await getSucursales();
  const sucursales = result.data ?? [];

  return (
    <SucursalesManager
      initialSucursales={sucursales}
      usingMockData={result.usingMockData}
    />
  );
}
