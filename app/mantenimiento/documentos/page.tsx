import TiposDocumentoManager from "@/components/mantenimiento/TiposDocumentoManager";
import { getTiposDocumento } from "@/lib/actions/tipo-documento";

export default async function TiposDocumentoPage() {
  const result = await getTiposDocumento();

  return (
    <TiposDocumentoManager
      initialTipos={result.data ?? []}
      usingMockData={result.usingMockData}
    />
  );
}
