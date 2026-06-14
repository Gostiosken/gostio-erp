"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import Modal, {
  modalCancelButtonClassName,
  modalFormFooterClassName,
  modalSubmitButtonClassName,
} from "@/components/ui/Modal";
import {
  createArticulo,
  deleteArticulo,
  updateArticulo,
} from "@/lib/actions/articulo";
import { buildMockArticulo } from "@/lib/data/articulos-mock";
import type { Articulo, ArticuloInput } from "@/lib/types/articulo";
import {
  getArticuloEstadoLabel,
  isArticuloActivo,
} from "@/lib/types/articulo";
import type { Categoria } from "@/lib/types/categoria";
import type { UnidadMedida } from "@/lib/types/unidad-medida";

type ArticulosManagerProps = {
  initialArticulos: Articulo[];
  categoriasActivas: Categoria[];
  unidadesActivas: UnidadMedida[];
  usingMockData?: boolean;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

const labelClassName = "mb-1.5 block text-sm font-medium text-slate-700";

type ModalMode = "create" | "edit" | null;

function createEmptyForm(
  categorias: Categoria[],
  unidades: UnidadMedida[]
): ArticuloInput {
  return {
    idcategoria: categorias[0]?.idcategoria ?? 0,
    idunidad_medida: unidades[0]?.idunidad_medida ?? 0,
    nombre: "",
    descripcion: "",
    imagen: "",
    estado: "1",
  };
}

function articuloToForm(articulo: Articulo): ArticuloInput {
  return {
    idcategoria: articulo.idcategoria,
    idunidad_medida: articulo.idunidad_medida,
    nombre: articulo.nombre,
    descripcion: articulo.descripcion ?? "",
    imagen: articulo.imagen ?? "",
    estado: articulo.estado,
  };
}

function ArticuloImagen({ imagen, nombre }: { imagen: string | null; nombre: string }) {
  if (imagen) {
    return (
      <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <Image
          src={imagen}
          alt={nombre}
          fill
          className="object-cover"
          unoptimized
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-400">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    </div>
  );
}

export default function ArticulosManager({
  initialArticulos,
  categoriasActivas,
  unidadesActivas,
  usingMockData = false,
}: ArticulosManagerProps) {
  const emptyForm = useMemo(
    () => createEmptyForm(categoriasActivas, unidadesActivas),
    [categoriasActivas, unidadesActivas]
  );

  const [articulos, setArticulos] = useState<Articulo[]>(initialArticulos);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<Articulo | null>(null);
  const [form, setForm] = useState<ArticuloInput>(emptyForm);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const canManage =
    categoriasActivas.length > 0 && unidadesActivas.length > 0;

  function openCreate() {
    if (!canManage) {
      setFeedback({
        type: "error",
        message:
          "Registre al menos una categoría y una unidad de medida activas antes de crear artículos.",
      });
      return;
    }
    setEditing(null);
    setForm(createEmptyForm(categoriasActivas, unidadesActivas));
    setModalMode("create");
    setFeedback(null);
  }

  function openEdit(articulo: Articulo) {
    setEditing(articulo);
    setForm(articuloToForm(articulo));
    setModalMode("edit");
    setFeedback(null);
  }

  function closeModal() {
    setModalMode(null);
    setEditing(null);
    setForm(emptyForm);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.idcategoria || !form.idunidad_medida) {
      setFeedback({
        type: "error",
        message: "Seleccione una categoría y una unidad de medida válidas.",
      });
      return;
    }

    startTransition(async () => {
      if (modalMode === "create") {
        if (usingMockData) {
          const nuevo = buildMockArticulo(
            Math.max(0, ...articulos.map((a) => a.idarticulo)) + 1,
            form
          );
          if (!nuevo) {
            setFeedback({
              type: "error",
              message: "Categoría o unidad de medida no válida.",
            });
            return;
          }
          setArticulos((prev) => [...prev, nuevo]);
          setFeedback({
            type: "success",
            message: "Artículo registrado (modo demostración).",
          });
          closeModal();
          return;
        }

        const result = await createArticulo(form);
        if (result.success && result.data) {
          setArticulos((prev) => [...prev, result.data!]);
          setFeedback({
            type: "success",
            message: "Artículo registrado correctamente.",
          });
          closeModal();
        } else {
          setFeedback({
            type: "error",
            message: result.error ?? "Error al registrar el artículo.",
          });
        }
        return;
      }

      if (modalMode === "edit" && editing) {
        if (usingMockData) {
          const actualizado = buildMockArticulo(editing.idarticulo, form);
          if (!actualizado) {
            setFeedback({
              type: "error",
              message: "Categoría o unidad de medida no válida.",
            });
            return;
          }
          setArticulos((prev) =>
            prev.map((item) =>
              item.idarticulo === editing.idarticulo ? actualizado : item
            )
          );
          setFeedback({
            type: "success",
            message: "Artículo actualizado (modo demostración).",
          });
          closeModal();
          return;
        }

        const result = await updateArticulo(editing.idarticulo, form);
        if (result.success && result.data) {
          setArticulos((prev) =>
            prev.map((item) =>
              item.idarticulo === result.data!.idarticulo ? result.data! : item
            )
          );
          setFeedback({
            type: "success",
            message: "Artículo actualizado correctamente.",
          });
          closeModal();
        } else {
          setFeedback({
            type: "error",
            message: result.error ?? "Error al actualizar el artículo.",
          });
        }
      }
    });
  }

  function handleDelete(articulo: Articulo) {
    if (
      !confirm(
        `¿Eliminar el artículo "${articulo.nombre}"? Se marcará como eliminado (estado N).`
      )
    ) {
      return;
    }

    setProcessingId(articulo.idarticulo);
    startTransition(async () => {
      if (usingMockData) {
        setArticulos((prev) =>
          prev.filter((item) => item.idarticulo !== articulo.idarticulo)
        );
        setFeedback({
          type: "success",
          message: "Artículo eliminado (modo demostración).",
        });
        setProcessingId(null);
        return;
      }

      const result = await deleteArticulo(articulo.idarticulo);
      if (result.success) {
        setArticulos((prev) =>
          prev.filter((item) => item.idarticulo !== articulo.idarticulo)
        );
        setFeedback({
          type: "success",
          message: "Artículo eliminado correctamente.",
        });
      } else {
        setFeedback({
          type: "error",
          message: result.error ?? "Error al eliminar el artículo.",
        });
      }
      setProcessingId(null);
    });
  }

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              Fase 1 · Catálogo de Artículos
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Artículos / Almacén
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Catálogo de productos vinculados a categorías y unidades de medida.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/inventario/importar"
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M8 13h8M8 17h5" />
              </svg>
              Importar desde Excel
            </Link>
            <button
              type="button"
              onClick={openCreate}
              disabled={!canManage}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Registrar Artículo
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {usingMockData && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Modo demostración: datos simulados activos.
          </div>
        )}

        {!canManage && (
          <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Configure categorías y unidades de medida activas en Mantenimiento para
            poder registrar artículos.
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

        {articulos.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500 shadow-sm md:hidden">
            No hay artículos registrados.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {articulos.map((articulo) => (
              <article
                key={articulo.idarticulo}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex gap-4">
                  <ArticuloImagen
                    imagen={articulo.imagen ?? null}
                    nombre={articulo.nombre}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{articulo.nombre}</p>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">
                      #{String(articulo.idarticulo).padStart(4, "0")}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {articulo.categoria.nombre}
                    </p>
                    <span
                      className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isArticuloActivo(articulo.estado)
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {getArticuloEstadoLabel(articulo.estado)}
                    </span>
                  </div>
                </div>
                {articulo.descripcion && (
                  <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                    {articulo.descripcion}
                  </p>
                )}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => openEdit(articulo)}
                    disabled={processingId === articulo.idarticulo || isPending}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-60"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(articulo)}
                    disabled={processingId === articulo.idarticulo || isPending}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
          <div className="overflow-x-auto w-full whitespace-nowrap">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Imagen</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Código</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">
                    Artículo
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">
                    Categoría
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">
                    Unidad
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Estado</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-slate-600">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {articulos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                      No hay artículos registrados.
                    </td>
                  </tr>
                ) : (
                  articulos.map((articulo) => (
                    <tr key={articulo.idarticulo} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4">
                        <ArticuloImagen
                          imagen={articulo.imagen ?? null}
                          nombre={articulo.nombre}
                        />
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">
                        #{String(articulo.idarticulo).padStart(4, "0")}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">{articulo.nombre}</p>
                        {articulo.descripcion && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                            {articulo.descripcion}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {articulo.categoria.nombre}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-slate-700">{articulo.unidadMedida.nombre}</span>
                        <span className="ml-1.5 inline-flex rounded-md bg-indigo-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-indigo-700">
                          {articulo.unidadMedida.prefijo}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isArticuloActivo(articulo.estado)
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {getArticuloEstadoLabel(articulo.estado)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(articulo)}
                            disabled={
                              processingId === articulo.idarticulo || isPending
                            }
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-60"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(articulo)}
                            disabled={
                              processingId === articulo.idarticulo || isPending
                            }
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
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
      </main>

      <Modal
        open={modalMode !== null}
        title={modalMode === "edit" ? "Editar Artículo" : "Registrar Artículo"}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nombre" className={labelClassName}>
              Nombre del Artículo *
            </label>
            <input
              id="nombre"
              type="text"
              required
              maxLength={50}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={inputClassName}
              placeholder="Ej. Arroz Extra 1kg"
            />
          </div>

          <div>
            <label htmlFor="descripcion" className={labelClassName}>
              Descripción
            </label>
            <textarea
              id="descripcion"
              rows={3}
              value={form.descripcion ?? ""}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className={inputClassName}
              placeholder="Descripción detallada del producto..."
            />
          </div>

          <div>
            <label htmlFor="imagen" className={labelClassName}>
              Imagen (URL o ruta)
            </label>
            <input
              id="imagen"
              type="text"
              maxLength={150}
              value={form.imagen ?? ""}
              onChange={(e) => setForm({ ...form, imagen: e.target.value })}
              className={inputClassName}
              placeholder="/productos/arroz.png"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="idcategoria" className={labelClassName}>
                Categoría *
              </label>
              <select
                id="idcategoria"
                required
                value={form.idcategoria || ""}
                onChange={(e) =>
                  setForm({ ...form, idcategoria: Number(e.target.value) })
                }
                className={inputClassName}
              >
                {categoriasActivas.map((categoria) => (
                  <option key={categoria.idcategoria} value={categoria.idcategoria}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="idunidad_medida" className={labelClassName}>
                Unidad de Medida *
              </label>
              <select
                id="idunidad_medida"
                required
                value={form.idunidad_medida || ""}
                onChange={(e) =>
                  setForm({ ...form, idunidad_medida: Number(e.target.value) })
                }
                className={inputClassName}
              >
                {unidadesActivas.map((unidad) => (
                  <option key={unidad.idunidad_medida} value={unidad.idunidad_medida}>
                    {unidad.nombre} ({unidad.prefijo})
                  </option>
                ))}
              </select>
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
              {isPending
                ? "Guardando..."
                : modalMode === "edit"
                  ? "Guardar Cambios"
                  : "Registrar Artículo"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
