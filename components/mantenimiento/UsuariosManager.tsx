"use client";

import { useMemo, useState, useTransition } from "react";
import Modal, {
  modalCancelButtonClassName,
  modalFormFooterClassName,
  modalSubmitButtonClassName,
} from "@/components/ui/Modal";
import PersonalTabla from "@/components/personal/PersonalTabla";
import { deleteUsuario, updateUsuario } from "@/lib/actions/usuario";
import type { EmpleadoListado, Usuario, UsuarioInput } from "@/lib/types/usuario";

type UsuariosManagerProps = {
  initialUsuarios: Usuario[];
  usingMockData?: boolean;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

export default function UsuariosManager({
  initialUsuarios,
  usingMockData = false,
}: UsuariosManagerProps) {
  const [usuarios, setUsuarios] = useState(initialUsuarios);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState<UsuarioInput | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const listado = useMemo<EmpleadoListado[]>(
    () =>
      usuarios.map((usuario) => ({
        ...usuario.empleado,
        login: usuario.login,
      })),
    [usuarios]
  );

  function openEdit(usuarioRow: EmpleadoListado) {
    const usuario = usuarios.find((u) => u.idempleado === usuarioRow.idempleado);
    if (!usuario) return;

    setEditing(usuario);
    setForm({
      idsucursal: usuario.idsucursal,
      login: usuario.login,
      clave: "",
      tipo: usuario.tipo,
      estado: usuario.estado,
      mnu_almacen: usuario.mnu_almacen,
      mnu_compras: usuario.mnu_compras,
      mnu_ventas: usuario.mnu_ventas,
      mnu_mantenimiento: usuario.mnu_mantenimiento,
      mnu_seguridad: usuario.mnu_seguridad,
      mnu_admin: usuario.mnu_admin,
      empleado: {
        nombre: usuario.empleado.nombre,
        apellidos: usuario.empleado.apellidos,
        tipo_documento: usuario.empleado.tipo_documento,
        num_documento: usuario.empleado.num_documento,
        direccion: usuario.empleado.direccion,
        telefono: usuario.empleado.telefono,
        email: usuario.empleado.email,
        foto: usuario.empleado.foto,
        estado: usuario.empleado.estado,
      },
    });
    setFeedback(null);
  }

  function closeModal() {
    setEditing(null);
    setForm(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || !form) return;

    startTransition(async () => {
      if (usingMockData) {
        setUsuarios((prev) =>
          prev.map((u) =>
            u.idusuario === editing.idusuario
              ? {
                  ...u,
                  login: form.login,
                  tipo: form.tipo,
                  empleado: { ...u.empleado, ...form.empleado! },
                }
              : u
          )
        );
        setFeedback({ type: "success", message: "Usuario actualizado (demo)." });
        closeModal();
        return;
      }

      const result = await updateUsuario(editing.idusuario, form);
      if (result.success && result.data) {
        setUsuarios((prev) =>
          prev.map((u) => (u.idusuario === result.data!.idusuario ? result.data! : u))
        );
        setFeedback({ type: "success", message: "Usuario actualizado correctamente." });
        closeModal();
      } else {
        setFeedback({ type: "error", message: result.error ?? "Error al actualizar." });
      }
    });
  }

  function handleDelete(usuarioRow: EmpleadoListado) {
    const usuario = usuarios.find((u) => u.idempleado === usuarioRow.idempleado);
    if (!usuario) return;
    if (!confirm(`¿Eliminar el usuario "${usuario.login}"?`)) return;

    setProcessingId(usuario.idempleado);
    startTransition(async () => {
      if (usingMockData) {
        setUsuarios((prev) => prev.filter((u) => u.idusuario !== usuario.idusuario));
        setFeedback({ type: "success", message: "Usuario eliminado (demo)." });
        setProcessingId(null);
        return;
      }

      const result = await deleteUsuario(usuario.idusuario);
      if (result.success) {
        setUsuarios((prev) => prev.filter((u) => u.idusuario !== usuario.idusuario));
        setFeedback({ type: "success", message: "Usuario eliminado correctamente." });
      } else {
        setFeedback({ type: "error", message: result.error ?? "No se pudo eliminar." });
      }
      setProcessingId(null);
    });
  }

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <div>
          <p className="text-sm font-medium text-indigo-600">Mantenimiento · Seguridad</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Usuarios del Sistema</h1>
          <p className="mt-1 text-sm text-slate-500">
            Cuentas de acceso vinculadas a empleados con avatar corporativo.
          </p>
        </div>
      </header>

      <main className="px-6 py-8 lg:px-8">
        {usingMockData && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Modo demostración activo.
          </div>
        )}

        {feedback && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <PersonalTabla
          registros={listado}
          mostrarLogin
          onEditar={openEdit}
          onEliminar={handleDelete}
          processingId={processingId}
          isPending={isPending}
          emptyMessage="No hay usuarios registrados."
        />
      </main>

      <Modal open={editing !== null} title="Editar usuario" onClose={closeModal}>
        {form && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Login *</label>
                <input
                  required
                  value={form.login}
                  onChange={(e) => setForm((p) => p && { ...p, login: e.target.value })}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Tipo *</label>
                <input
                  required
                  value={form.tipo}
                  onChange={(e) => setForm((p) => p && { ...p, tipo: e.target.value })}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Nombres *</label>
                <input
                  required
                  value={form.empleado?.nombre ?? ""}
                  onChange={(e) =>
                    setForm(
                      (p) =>
                        p && {
                          ...p,
                          empleado: { ...p.empleado!, nombre: e.target.value },
                        }
                    )
                  }
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Apellidos *</label>
                <input
                  required
                  value={form.empleado?.apellidos ?? ""}
                  onChange={(e) =>
                    setForm(
                      (p) =>
                        p && {
                          ...p,
                          empleado: { ...p.empleado!, apellidos: e.target.value },
                        }
                    )
                  }
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={form.empleado?.email ?? ""}
                  onChange={(e) =>
                    setForm(
                      (p) =>
                        p && {
                          ...p,
                          empleado: { ...p.empleado!, email: e.target.value },
                        }
                    )
                  }
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Teléfono</label>
                <input
                  value={form.empleado?.telefono ?? ""}
                  onChange={(e) =>
                    setForm(
                      (p) =>
                        p && {
                          ...p,
                          empleado: { ...p.empleado!, telefono: e.target.value },
                        }
                    )
                  }
                  className={inputClassName}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Ruta de foto</label>
                <input
                  value={form.empleado?.foto ?? ""}
                  onChange={(e) =>
                    setForm(
                      (p) =>
                        p && {
                          ...p,
                          empleado: { ...p.empleado!, foto: e.target.value },
                        }
                    )
                  }
                  placeholder="Ej. /img/empleados/admin.jpg"
                  className={inputClassName}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nueva contraseña (opcional)
                </label>
                <input
                  type="password"
                  value={form.clave}
                  onChange={(e) => setForm((p) => p && { ...p, clave: e.target.value })}
                  className={inputClassName}
                />
              </div>
            </div>
            <div className={modalFormFooterClassName}>
              <button type="button" onClick={closeModal} className={modalCancelButtonClassName}>
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className={modalSubmitButtonClassName}
              >
                {isPending ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
