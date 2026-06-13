import ConfiguracionManager from "@/components/mantenimiento/ConfiguracionManager";
import { getConfiguracion } from "@/lib/actions/configuracion";
import { CONFIGURACION_DEFAULT } from "@/lib/types/configuracion";

export default async function ConfiguracionPage() {
  const result = await getConfiguracion();

  return (
    <ConfiguracionManager
      initialConfig={result.data ?? CONFIGURACION_DEFAULT}
      usingMockData={result.usingMockData}
    />
  );
}
