import UsuariosManager from "@/components/mantenimiento/UsuariosManager";
import { getUsuarios } from "@/lib/actions/usuario";

export default async function UsuariosPage() {
  const result = await getUsuarios();

  return (
    <UsuariosManager
      initialUsuarios={result.data ?? []}
      usingMockData={result.usingMockData}
    />
  );
}
