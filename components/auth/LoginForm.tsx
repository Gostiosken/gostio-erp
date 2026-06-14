"use client";

import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { loginUsuario } from "@/lib/actions/usuario";
import type { Sucursal } from "@/lib/types/sucursal";
import { isSucursalActiva } from "@/lib/types/sucursal";

type LoginFormProps = {
  sucursales: Sucursal[];
  usingMockData?: boolean;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:py-2.5";

export default function LoginForm({ sucursales, usingMockData = false }: LoginFormProps) {
  const { login } = useAuth();
  const [loginValue, setLoginValue] = useState("");
  const [clave, setClave] = useState("");
  const [idsucursal, setIdsucursal] = useState<number>(
    sucursales.find((s) => isSucursalActiva(s.estado))?.idsucursal ?? 0
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sucursalesActivas = sucursales.filter((s) => isSucursalActiva(s.estado));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    let loginExitoso = false;

    try {
      const result = await loginUsuario(loginValue, clave, idsucursal);

      if (!result.success || !result.data) {
        setError(result.error ?? "No se pudo iniciar sesión.");
        return;
      }

      login(result.data);
      loginExitoso = true;
      window.location.assign("/dashboard");
    } catch {
      setError("Ocurrió un error inesperado. Intente nuevamente.");
    } finally {
      if (!loginExitoso) {
        setIsSubmitting(false);
      }
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden flex-1 overflow-hidden bg-slate-900 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.35),_transparent_55%)]" />
        <div className="relative z-10 p-12">
          <div className="animate-fabricolor-reveal">
            <Image
              src="/logo-light.png"
              alt="FabriColor ERP"
              width={220}
              height={52}
              priority
              className="h-12 w-auto"
            />
          </div>
          <p className="mt-6 max-w-md text-lg text-slate-300 animate-fabricolor-reveal [animation-delay:120ms]">
            Gestión empresarial para serigrafía en Paraguay
          </p>
          <p className="mt-4 max-w-lg text-slate-300 animate-fabricolor-reveal [animation-delay:220ms]">
            Acceda al sistema con sus credenciales y seleccione la sucursal en la que
            trabajará durante esta sesión.
          </p>
        </div>
        <div className="relative z-10 border-t border-slate-700/80 p-12 text-sm text-slate-400">
          FabriColor ERP · Paraguay
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-[480px] lg:shrink-0 lg:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Image
              src="/logo-dark.png"
              alt="FabriColor ERP"
              width={180}
              height={40}
              priority
              className="h-10 w-auto animate-fabricolor-reveal"
            />
            <h2 className="mt-4 text-2xl font-bold text-slate-900">Iniciar sesión</h2>
          </div>

          <div className="mb-8 hidden lg:block">
            <h2 className="text-2xl font-bold text-slate-900">Iniciar sesión</h2>
            <p className="mt-2 text-sm text-slate-500">
              Ingrese sus credenciales para acceder al panel.
            </p>
          </div>

          {usingMockData && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Modo demo: use <strong>admin</strong> / <strong>admin</strong>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login" className="mb-1.5 block text-sm font-medium text-slate-700">
                Usuario
              </label>
              <input
                id="login"
                type="text"
                required
                autoComplete="username"
                value={loginValue}
                onChange={(e) => setLoginValue(e.target.value)}
                className={inputClassName}
                placeholder="Ej. admin"
              />
            </div>

            <div>
              <label htmlFor="clave" className="mb-1.5 block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <input
                id="clave"
                type="password"
                required
                autoComplete="current-password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                className={inputClassName}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label
                htmlFor="idsucursal"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Sucursal de trabajo
              </label>
              <select
                id="idsucursal"
                required
                value={idsucursal || ""}
                onChange={(e) => setIdsucursal(Number(e.target.value))}
                className={inputClassName}
              >
                {sucursalesActivas.length === 0 ? (
                  <option value="">Sin sucursales activas</option>
                ) : (
                  sucursalesActivas.map((sucursal) => (
                    <option key={sucursal.idsucursal} value={sucursal.idsucursal}>
                      {sucursal.razon_social}
                    </option>
                  ))
                )}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || sucursalesActivas.length === 0}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400 lg:hidden">
            FabriColor ERP · Paraguay
          </p>
        </div>
      </div>
    </div>
  );
}
