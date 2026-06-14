import ReportesManager from "@/components/reportes/ReportesManager";
import { getSucursales } from "@/lib/actions/sucursal";

export default async function ReportesPage() {
  const result = await getSucursales();

  return (
    <ReportesManager
      sucursales={result.success && result.data ? result.data : []}
      usingMockData={result.usingMockData}
    />
  );
}
