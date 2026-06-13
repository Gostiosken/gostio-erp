import LoginForm from "@/components/auth/LoginForm";
import { getSucursales } from "@/lib/actions/sucursal";

export default async function LoginPage() {
  const result = await getSucursales();

  return (
    <LoginForm
      sucursales={result.data ?? []}
      usingMockData={result.usingMockData}
    />
  );
}
