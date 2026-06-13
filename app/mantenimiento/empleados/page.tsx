import EmpleadosManager from "@/components/mantenimiento/EmpleadosManager";
import { getEmpleados } from "@/lib/actions/empleado";

export default async function EmpleadosPage() {
  const result = await getEmpleados();

  return (
    <EmpleadosManager
      initialEmpleados={result.data ?? []}
      usingMockData={result.usingMockData}
    />
  );
}
