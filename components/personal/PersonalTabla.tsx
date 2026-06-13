"use client";

import EmpleadoAvatar from "@/components/personal/EmpleadoAvatar";
import { getEmpleadoApellidosNombres } from "@/lib/types/usuario";
import type { EmpleadoListado } from "@/lib/types/usuario";

type PersonalTablaProps = {
  registros: EmpleadoListado[];
  mostrarLogin?: boolean;
  onEditar: (empleado: EmpleadoListado) => void;
  onEliminar: (empleado: EmpleadoListado) => void;
  processingId?: number | null;
  isPending?: boolean;
  emptyMessage?: string;
};

export default function PersonalTabla({
  registros,
  mostrarLogin = true,
  onEditar,
  onEliminar,
  processingId = null,
  isPending = false,
  emptyMessage = "No hay registros para mostrar.",
}: PersonalTablaProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto w-full whitespace-nowrap">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="w-14 px-4 py-3.5 font-semibold text-slate-600">N°</th>
              <th className="px-4 py-3.5 font-semibold text-slate-600">Apellidos y Nombres</th>
              <th className="px-4 py-3.5 font-semibold text-slate-600">Tipo Documento</th>
              <th className="px-4 py-3.5 font-semibold text-slate-600">N° Documento</th>
              <th className="px-4 py-3.5 font-semibold text-slate-600">Email</th>
              <th className="px-4 py-3.5 font-semibold text-slate-600">Teléfono</th>
              {mostrarLogin && (
                <th className="px-4 py-3.5 font-semibold text-slate-600">Login</th>
              )}
              <th className="px-4 py-3.5 font-semibold text-slate-600">Foto</th>
              <th className="px-4 py-3.5 text-right font-semibold text-slate-600">Opciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {registros.length === 0 ? (
              <tr>
                <td
                  colSpan={mostrarLogin ? 9 : 8}
                  className="px-5 py-14 text-center text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              registros.map((empleado, index) => (
                <tr key={empleado.idempleado} className="hover:bg-slate-50/50">
                  <td className="px-4 py-4 text-slate-500">{index + 1}</td>
                  <td className="px-4 py-4 font-medium text-slate-900">
                    {getEmpleadoApellidosNombres(empleado)}
                  </td>
                  <td className="px-4 py-4 text-slate-700">{empleado.tipo_documento}</td>
                  <td className="px-4 py-4 font-mono text-slate-700">{empleado.num_documento}</td>
                  <td className="px-4 py-4 text-slate-600">{empleado.email ?? "—"}</td>
                  <td className="px-4 py-4 text-slate-600">{empleado.telefono ?? "—"}</td>
                  {mostrarLogin && (
                    <td className="px-4 py-4">
                      {empleado.login ? (
                        <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                          {empleado.login}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-4">
                    <EmpleadoAvatar
                      nombre={empleado.nombre}
                      apellidos={empleado.apellidos}
                      foto={empleado.foto}
                    />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEditar(empleado)}
                        className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:px-3 sm:py-1.5"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onEliminar(empleado)}
                        disabled={processingId === empleado.idempleado || isPending}
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60 sm:px-3 sm:py-1.5"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
