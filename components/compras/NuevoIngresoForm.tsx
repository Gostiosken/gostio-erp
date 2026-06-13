"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import Modal from "@/components/ui/Modal";
import { createIngreso } from "@/lib/actions/ingreso";
import type { Articulo } from "@/lib/types/articulo";
import {
  calcularTotalesIngreso,
  formatMoneda,
  TIPOS_COMPROBANTE_COMPRA,
  type TipoComprobanteCompra,
} from "@/lib/types/ingreso";
import type { Proveedor } from "@/lib/types/persona";

type CompraLineItem = {
  key: string;
  idarticulo: number;
  nombreArticulo: string;
  codigo: string;
  serie: string;
  descripcion: string;
  stock_ingreso: number;
  precio_compra: number;
  precio_ventadistribuidor: number;
  precio_ventapublico: number;
};

type NuevoIngresoFormProps = {
  proveedores: Proveedor[];
  articulos: Articulo[];
  usingMockData?: boolean;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

const labelClassName = "mb-1 block text-xs font-medium text-slate-600";

function createLineItem(articulo: Articulo): CompraLineItem {
  return {
    key: `${articulo.idarticulo}-${Date.now()}-${Math.random()}`,
    idarticulo: articulo.idarticulo,
    nombreArticulo: articulo.nombre,
    codigo: String(articulo.idarticulo).padStart(4, "0"),
    serie: "",
    descripcion: articulo.descripcion ?? articulo.nombre,
    stock_ingreso: 1,
    precio_compra: 0,
    precio_ventadistribuidor: 0,
    precio_ventapublico: 0,
  };
}

export default function NuevoIngresoForm({
  proveedores,
  articulos,
  usingMockData = false,
}: NuevoIngresoFormProps) {
  const router = useRouter();
  const { session } = useAuth();
  const [idproveedor, setIdproveedor] = useState<number>(
    proveedores[0]?.idpersona ?? 0
  );
  const [tipoComprobante, setTipoComprobante] =
    useState<TipoComprobanteCompra>("Factura");
  const [serie, setSerie] = useState("F001");
  const [numero, setNumero] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [porcentajeImpuesto, setPorcentajeImpuesto] = useState(10);
  const [items, setItems] = useState<CompraLineItem[]>([]);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const detallesInput = useMemo(
    () =>
      items.map((item) => ({
        idarticulo: item.idarticulo,
        codigo: item.codigo,
        serie: item.serie || null,
        descripcion: item.descripcion || null,
        stock_ingreso: item.stock_ingreso,
        precio_compra: item.precio_compra,
        precio_ventadistribuidor: item.precio_ventadistribuidor,
        precio_ventapublico: item.precio_ventapublico,
      })),
    [items]
  );

  const totales = useMemo(
    () => calcularTotalesIngreso(detallesInput, porcentajeImpuesto),
    [detallesInput, porcentajeImpuesto]
  );

  const articulosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return articulos;
    return articulos.filter(
      (articulo) =>
        articulo.nombre.toLowerCase().includes(term) ||
        articulo.categoria.nombre.toLowerCase().includes(term)
    );
  }, [articulos, busqueda]);

  function updateItem(key: string, patch: Partial<CompraLineItem>) {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item))
    );
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }

  function addArticulo(articulo: Articulo) {
    setItems((prev) => [...prev, createLineItem(articulo)]);
    setCatalogOpen(false);
    setBusqueda("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!session) {
      setFeedback({ type: "error", message: "Sesión no válida. Vuelva a iniciar sesión." });
      return;
    }

    if (!idproveedor) {
      setFeedback({ type: "error", message: "Seleccione un proveedor." });
      return;
    }

    if (items.length === 0) {
      setFeedback({ type: "error", message: "Agregue al menos un artículo a la compra." });
      return;
    }

    startTransition(async () => {
      const result = await createIngreso({
        cabecera: {
          idusuario: session.usuario.idusuario,
          idsucursal: session.idsucursal,
          idproveedor,
          tipo_comprobante: tipoComprobante,
          serie_comprobante: serie,
          num_comprobante: numero,
          fecha,
          porcentaje_impuesto: porcentajeImpuesto,
        },
        detalles: detallesInput,
      });

      if (result.success) {
        setFeedback({
          type: "success",
          message: usingMockData
            ? `Ingreso registrado (demo) #${result.data?.idingreso}.`
            : `Ingreso #${result.data?.idingreso} registrado correctamente.`,
        });
        setItems([]);
        setNumero("");
        setTimeout(() => router.refresh(), 800);
      } else {
        setFeedback({
          type: "error",
          message: result.error ?? "No se pudo guardar el ingreso.",
        });
      }
    });
  }

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <div>
          <p className="text-sm font-medium text-indigo-600">Fase 3 · Compras e Ingreso</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Registro de Compras
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sucursal activa:{" "}
            <span className="font-medium text-slate-700">
              {session?.sucursalNombre ?? "—"}
            </span>
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 px-6 py-8 lg:px-8">
        {usingMockData && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Modo demostración: el ingreso se simula localmente si no hay base de datos.
          </div>
        )}

        {feedback && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Datos del comprobante
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="md:col-span-2 xl:col-span-1">
              <label htmlFor="proveedor" className={labelClassName}>
                Proveedor *
              </label>
              <select
                id="proveedor"
                required
                value={idproveedor || ""}
                onChange={(e) => setIdproveedor(Number(e.target.value))}
                className={inputClassName}
              >
                {proveedores.length === 0 ? (
                  <option value="">Sin proveedores</option>
                ) : (
                  proveedores.map((proveedor) => (
                    <option key={proveedor.idpersona} value={proveedor.idpersona}>
                      {proveedor.nombre}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label htmlFor="tipo_comprobante" className={labelClassName}>
                Tipo comprobante *
              </label>
              <select
                id="tipo_comprobante"
                value={tipoComprobante}
                onChange={(e) =>
                  setTipoComprobante(e.target.value as TipoComprobanteCompra)
                }
                className={inputClassName}
              >
                {TIPOS_COMPROBANTE_COMPRA.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="fecha" className={labelClassName}>
                Fecha *
              </label>
              <input
                id="fecha"
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="serie" className={labelClassName}>
                Serie *
              </label>
              <input
                id="serie"
                required
                maxLength={7}
                value={serie}
                onChange={(e) => setSerie(e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="numero" className={labelClassName}>
                Número *
              </label>
              <input
                id="numero"
                required
                maxLength={10}
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className={inputClassName}
                placeholder="00001234"
              />
            </div>
            <div>
              <label htmlFor="impuesto" className={labelClassName}>
                Impuesto (%) *
              </label>
              <input
                id="impuesto"
                type="number"
                min={0}
                max={100}
                step={0.01}
                required
                value={porcentajeImpuesto}
                onChange={(e) => setPorcentajeImpuesto(Number(e.target.value))}
                className={inputClassName}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Detalle de artículos
            </h2>
            <button
              type="button"
              onClick={() => setCatalogOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              + Agregar del catálogo
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase text-slate-500">
                  <th className="px-3 py-3">Artículo</th>
                  <th className="px-3 py-3">Cantidad</th>
                  <th className="px-3 py-3">Código</th>
                  <th className="px-3 py-3">Serie</th>
                  <th className="px-3 py-3">P. Compra</th>
                  <th className="px-3 py-3">P. Distrib.</th>
                  <th className="px-3 py-3">P. Público</th>
                  <th className="px-3 py-3">Subtotal</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-slate-500">
                      No hay artículos en la compra. Use el catálogo para agregar productos.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.key}>
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-900">{item.nombreArticulo}</p>
                        <input
                          type="text"
                          value={item.descripcion}
                          onChange={(e) =>
                            updateItem(item.key, { descripcion: e.target.value })
                          }
                          className={`${inputClassName} mt-1`}
                          placeholder="Descripción"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min={1}
                          value={item.stock_ingreso}
                          onChange={(e) =>
                            updateItem(item.key, {
                              stock_ingreso: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          className={`${inputClassName} w-20`}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={item.codigo}
                          onChange={(e) => updateItem(item.key, { codigo: e.target.value })}
                          className={`${inputClassName} w-32`}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={item.serie}
                          onChange={(e) => updateItem(item.key, { serie: e.target.value })}
                          className={`${inputClassName} w-28`}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.precio_compra}
                          onChange={(e) =>
                            updateItem(item.key, {
                              precio_compra: Number(e.target.value) || 0,
                            })
                          }
                          className={`${inputClassName} w-24`}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.precio_ventadistribuidor}
                          onChange={(e) =>
                            updateItem(item.key, {
                              precio_ventadistribuidor: Number(e.target.value) || 0,
                            })
                          }
                          className={`${inputClassName} w-24`}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.precio_ventapublico}
                          onChange={(e) =>
                            updateItem(item.key, {
                              precio_ventapublico: Number(e.target.value) || 0,
                            })
                          }
                          className={`${inputClassName} w-24`}
                        />
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-800">
                        {formatMoneda(item.stock_ingreso * item.precio_compra)}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:min-w-[320px]">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Totales
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd className="font-medium text-slate-900">
                  {formatMoneda(totales.subtotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Impuesto ({porcentajeImpuesto}%)</dt>
                <dd className="font-medium text-slate-900">
                  {formatMoneda(totales.impuesto)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base">
                <dt className="font-semibold text-slate-700">Total</dt>
                <dd className="font-bold text-indigo-700">{formatMoneda(totales.total)}</dd>
              </div>
            </dl>
          </div>

          <button
            type="submit"
            disabled={isPending || items.length === 0 || proveedores.length === 0}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-indigo-600 px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 lg:self-end"
          >
            {isPending ? "Guardando ingreso..." : "Guardar Ingreso"}
          </button>
        </section>
      </form>

      <Modal
        open={catalogOpen}
        title="Catálogo de artículos"
        onClose={() => {
          setCatalogOpen(false);
          setBusqueda("");
        }}
      >
        <div className="space-y-4">
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o categoría..."
            className={inputClassName}
          />
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {articulosFiltrados.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                No se encontraron artículos.
              </p>
            ) : (
              articulosFiltrados.map((articulo) => (
                <button
                  key={articulo.idarticulo}
                  type="button"
                  onClick={() => addArticulo(articulo)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{articulo.nombre}</p>
                    <p className="text-xs text-slate-500">
                      {articulo.categoria.nombre} · {articulo.unidadMedida.prefijo}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600">Agregar</span>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
