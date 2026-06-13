"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import Modal from "@/components/ui/Modal";
import {
  createVenta,
  getCorrelativoComprobante,
  getStockDisponible,
} from "@/lib/actions/venta";
import type { Cliente } from "@/lib/types/persona";
import type { LoteDisponible, TipoComprobanteVenta, TipoVenta } from "@/lib/types/venta";
import {
  calcularTotalesVenta,
  formatMonedaVenta,
  TIPOS_COMPROBANTE_VENTA,
  TIPOS_VENTA,
} from "@/lib/types/venta";

type VentaLineItem = {
  key: string;
  lote: LoteDisponible;
  cantidad: number;
  precio_venta: number;
  descuento: number;
};

type NuevaVentaFormProps = {
  clientes: Cliente[];
  usingMockData?: boolean;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

const labelClassName = "mb-1 block text-xs font-medium text-slate-600";

export default function NuevaVentaForm({
  clientes,
  usingMockData = false,
}: NuevaVentaFormProps) {
  const router = useRouter();
  const { session } = useAuth();
  const [lotes, setLotes] = useState<LoteDisponible[]>([]);
  const [idcliente, setIdcliente] = useState<number>(clientes[0]?.idpersona ?? 0);
  const [tipoVenta, setTipoVenta] = useState<TipoVenta>("Contado");
  const [tipoComprobante, setTipoComprobante] =
    useState<TipoComprobanteVenta>("Boleta");
  const [serie, setSerie] = useState("");
  const [numero, setNumero] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const porcentajeImpuesto = 10;
  const [items, setItems] = useState<VentaLineItem[]>([]);
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
        iddetalle_ingreso: item.lote.iddetalle_ingreso,
        cantidad: item.cantidad,
        precio_venta: item.precio_venta,
        descuento: item.descuento,
      })),
    [items]
  );

  const totales = useMemo(
    () => calcularTotalesVenta(detallesInput, porcentajeImpuesto),
    [detallesInput, porcentajeImpuesto]
  );

  const lotesFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    const idsEnCarrito = new Set(items.map((item) => item.lote.iddetalle_ingreso));
    return lotes
      .filter((lote) => lote.stock_actual > 0)
      .filter((lote) => !idsEnCarrito.has(lote.iddetalle_ingreso))
      .filter(
        (lote) =>
          !term ||
          lote.nombreArticulo.toLowerCase().includes(term) ||
          lote.codigo.toLowerCase().includes(term)
      );
  }, [lotes, busqueda, items]);

  useEffect(() => {
    if (!session) return;

    getStockDisponible(session.idsucursal).then((result) => {
      if (result.success && result.data) {
        setLotes(result.data);
      }
    });
  }, [session]);

  useEffect(() => {
    if (!session) return;

    getCorrelativoComprobante(session.idsucursal, tipoComprobante).then((result) => {
      if (result.success && result.data) {
        setSerie(result.data.serie);
        setNumero(result.data.numero);
      }
    });
  }, [session, tipoComprobante]);

  function updateItem(key: string, patch: Partial<VentaLineItem>) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const updated = { ...item, ...patch };
        if (patch.cantidad !== undefined) {
          updated.cantidad = Math.min(
            Math.max(1, patch.cantidad),
            item.lote.stock_actual
          );
        }
        return updated;
      })
    );
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }

  function addLote(lote: LoteDisponible) {
    setItems((prev) => [
      ...prev,
      {
        key: `lote-${lote.iddetalle_ingreso}-${Date.now()}`,
        lote,
        cantidad: 1,
        precio_venta: lote.precio_ventapublico,
        descuento: 0,
      },
    ]);
    setCatalogOpen(false);
    setBusqueda("");
  }

  function actualizarStockLocal(
    ventaDetalles: { iddetalle_ingreso: number; cantidad: number }[]
  ) {
    setLotes((prev) =>
      prev.map((lote) => {
        const vendido = ventaDetalles.find(
          (d) => d.iddetalle_ingreso === lote.iddetalle_ingreso
        );
        if (!vendido) return lote;
        return {
          ...lote,
          stock_actual: lote.stock_actual - vendido.cantidad,
        };
      })
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!session) {
      setFeedback({ type: "error", message: "Sesión no válida." });
      return;
    }

    if (!idcliente) {
      setFeedback({ type: "error", message: "Seleccione un cliente." });
      return;
    }

    if (items.length === 0) {
      setFeedback({ type: "error", message: "Agregue productos a la venta." });
      return;
    }

    for (const item of items) {
      if (item.cantidad > item.lote.stock_actual) {
        setFeedback({
          type: "error",
          message: `Cantidad excede el stock de "${item.lote.nombreArticulo}".`,
        });
        return;
      }
    }

    startTransition(async () => {
      const result = await createVenta({
        cabecera: {
          idcliente,
          idusuario: session.usuario.idusuario,
          idsucursal: session.idsucursal,
          tipo_venta: tipoVenta,
          tipo_comprobante: tipoComprobante,
          serie_comprobante: serie,
          num_comprobante: numero,
          fecha,
          porcentaje_impuesto: porcentajeImpuesto,
        },
        detalles: detallesInput,
      });

      if (result.success) {
        actualizarStockLocal(detallesInput);
        setItems([]);
        setFeedback({
          type: "success",
          message: `Venta procesada correctamente. Comprobante ${serie}-${numero}.`,
        });

        const correlativo = await getCorrelativoComprobante(
          session.idsucursal,
          tipoComprobante
        );
        if (correlativo.success && correlativo.data) {
          setSerie(correlativo.data.serie);
          setNumero(correlativo.data.numero);
        }

        router.refresh();
      } else {
        setFeedback({
          type: "error",
          message: result.error ?? "No se pudo procesar la venta.",
        });
      }
    });
  }

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <div>
          <p className="text-sm font-medium text-indigo-600">Fase 4 · Punto de Venta</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nueva Venta</h1>
          <p className="mt-1 text-sm text-slate-500">
            Sucursal:{" "}
            <span className="font-medium text-slate-700">
              {session?.sucursalNombre ?? "—"}
            </span>
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 px-6 py-8 lg:px-8">
        {usingMockData && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Modo demostración: el stock se actualiza en memoria al procesar la venta.
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
            Datos de la venta
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label htmlFor="cliente" className={labelClassName}>
                Cliente *
              </label>
              <select
                id="cliente"
                required
                value={idcliente || ""}
                onChange={(e) => setIdcliente(Number(e.target.value))}
                className={inputClassName}
              >
                {clientes.length === 0 ? (
                  <option value="">Sin clientes</option>
                ) : (
                  clientes.map((cliente) => (
                    <option key={cliente.idpersona} value={cliente.idpersona}>
                      {cliente.nombre}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label htmlFor="tipo_venta" className={labelClassName}>
                Tipo de venta *
              </label>
              <select
                id="tipo_venta"
                value={tipoVenta}
                onChange={(e) => setTipoVenta(e.target.value as TipoVenta)}
                className={inputClassName}
              >
                {TIPOS_VENTA.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
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
                  setTipoComprobante(e.target.value as TipoComprobanteVenta)
                }
                className={inputClassName}
              >
                {TIPOS_COMPROBANTE_VENTA.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="serie" className={labelClassName}>
                Serie (auto)
              </label>
              <input
                id="serie"
                readOnly
                value={serie}
                className={`${inputClassName} bg-slate-50`}
              />
            </div>
            <div>
              <label htmlFor="numero" className={labelClassName}>
                Número (auto)
              </label>
              <input
                id="numero"
                readOnly
                value={numero}
                className={`${inputClassName} bg-slate-50`}
              />
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
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Productos a vender
            </h2>
            <button
              type="button"
              onClick={() => setCatalogOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              + Agregar del inventario
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase text-slate-500">
                  <th className="px-3 py-3">Producto / Lote</th>
                  <th className="px-3 py-3">Stock</th>
                  <th className="px-3 py-3">Cantidad</th>
                  <th className="px-3 py-3">P. Venta</th>
                  <th className="px-3 py-3">Descuento</th>
                  <th className="px-3 py-3">Subtotal</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                      Agregue lotes con stock disponible desde el inventario.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.key}>
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-900">
                          {item.lote.nombreArticulo}
                        </p>
                        <p className="text-xs text-slate-500">
                          Lote #{item.lote.iddetalle_ingreso} · Cód. {item.lote.codigo}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {item.lote.stock_actual}
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min={1}
                          max={item.lote.stock_actual}
                          value={item.cantidad}
                          onChange={(e) =>
                            updateItem(item.key, {
                              cantidad: Number(e.target.value) || 1,
                            })
                          }
                          className={`${inputClassName} w-20`}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.precio_venta}
                          onChange={(e) =>
                            updateItem(item.key, {
                              precio_venta: Number(e.target.value) || 0,
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
                          value={item.descuento}
                          onChange={(e) =>
                            updateItem(item.key, {
                              descuento: Number(e.target.value) || 0,
                            })
                          }
                          className={`${inputClassName} w-24`}
                        />
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-800">
                        {formatMonedaVenta(
                          item.cantidad * item.precio_venta - item.descuento
                        )}
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
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:min-w-[340px]">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Resumen de pago
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd className="font-medium">{formatMonedaVenta(totales.subtotalBruto)}</dd>
              </div>
              <div className="flex justify-between text-red-600">
                <dt>Descuento total</dt>
                <dd className="font-medium">
                  -{formatMonedaVenta(totales.descuentoTotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Base imponible</dt>
                <dd className="font-medium">{formatMonedaVenta(totales.subtotalNeto)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">IVA ({porcentajeImpuesto}%)</dt>
                <dd className="font-medium">{formatMonedaVenta(totales.impuesto)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base">
                <dt className="font-semibold text-slate-800">Neto a pagar</dt>
                <dd className="font-bold text-emerald-700">
                  {formatMonedaVenta(totales.total)}
                </dd>
              </div>
            </dl>
          </div>

          <button
            type="submit"
            disabled={isPending || items.length === 0 || clientes.length === 0}
            className="inline-flex h-14 items-center justify-center rounded-xl bg-emerald-600 px-10 text-base font-bold text-white shadow-lg transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 lg:self-end"
          >
            {isPending ? "Procesando..." : "Procesar Venta"}
          </button>
        </section>
      </form>

      <Modal
        open={catalogOpen}
        title="Inventario disponible"
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
            placeholder="Buscar por nombre o código..."
            className={inputClassName}
          />
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {lotesFiltrados.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No hay lotes con stock disponible.
              </p>
            ) : (
              lotesFiltrados.map((lote) => (
                <button
                  key={lote.iddetalle_ingreso}
                  type="button"
                  onClick={() => addLote(lote)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{lote.nombreArticulo}</p>
                    <p className="text-xs text-slate-500">
                      Lote #{lote.iddetalle_ingreso} · Stock: {lote.stock_actual} · Cód.{" "}
                      {lote.codigo}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-700">
                      {formatMonedaVenta(lote.precio_ventapublico)}
                    </p>
                    <p className="text-xs text-slate-400">Agregar</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
