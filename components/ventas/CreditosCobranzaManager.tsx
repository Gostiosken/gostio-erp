"use client";

import { useEffect, useState, useTransition } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import Modal from "@/components/ui/Modal";
import {
  getHistorialAbonos,
  getVentasPendientes,
  registrarAbono,
} from "@/lib/actions/credito";
import type { Credito, VentaPendienteCobro } from "@/lib/types/credito";
import { formatMonedaCredito } from "@/lib/types/credito";

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

export default function CreditosCobranzaManager() {
  const { session } = useAuth();
  const [pendientes, setPendientes] = useState<VentaPendienteCobro[]>([]);
  const [usingMockData, setUsingMockData] = useState(false);
  const [selected, setSelected] = useState<VentaPendienteCobro | null>(null);
  const [historial, setHistorial] = useState<Credito[]>([]);
  const [montoAbono, setMontoAbono] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  useEffect(() => {
    if (!session) return;

    getVentasPendientes(session.idsucursal).then((result) => {
      if (result.success && result.data) {
        setPendientes(result.data);
        setUsingMockData(Boolean(result.usingMockData));
      }
    });
  }, [session]);

  async function recargarPendientes() {
    if (!session) return;

    const result = await getVentasPendientes(session.idsucursal);
    if (result.success && result.data) {
      setPendientes(result.data);
      setUsingMockData(Boolean(result.usingMockData));
    }
  }

  async function abrirModalAbono(venta: VentaPendienteCobro) {
    setSelected(venta);
    setMontoAbono("");
    setModalOpen(true);
    setLoadingHistorial(true);

    const result = await getHistorialAbonos(venta.idventa);
    setHistorial(result.data ?? []);
    setLoadingHistorial(false);
  }

  function cerrarModal() {
    setModalOpen(false);
    setSelected(null);
    setHistorial([]);
    setMontoAbono("");
  }

  function handleRegistrarAbono(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;

    const monto = Number.parseFloat(montoAbono);
    if (Number.isNaN(monto) || monto <= 0) {
      setFeedback({ type: "error", message: "Ingrese un monto válido." });
      return;
    }

    if (monto > selected.saldoPendiente) {
      setFeedback({
        type: "error",
        message: `El abono no puede superar el saldo pendiente (${formatMonedaCredito(selected.saldoPendiente)}).`,
      });
      return;
    }

    startTransition(async () => {
      const result = await registrarAbono(selected.idventa, monto);

      if (result.success) {
        setFeedback({
          type: "success",
          message: `Abono de ${formatMonedaCredito(monto)} registrado correctamente.`,
        });
        cerrarModal();
        await recargarPendientes();
      } else {
        setFeedback({
          type: "error",
          message: result.error ?? "No se pudo registrar el abono.",
        });
      }
    });
  }

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <div>
          <p className="text-sm font-medium text-indigo-600">Fase 4 · Cobranzas</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cuentas por Cobrar
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ventas al crédito con saldo pendiente · Sucursal:{" "}
            <span className="font-medium text-slate-700">
              {session?.sucursalNombre ?? "—"}
            </span>
          </p>
        </div>
      </header>

      <main className="px-6 py-8 lg:px-8">
        {usingMockData && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Modo demostración: los abonos se registran en datos simulados en memoria.
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

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-5 py-3.5 font-semibold text-slate-600">
                    Fecha Venta
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">Cliente</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600">
                    Comprobante
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600 text-right">
                    Total Venta
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600 text-right">
                    Total Pagado
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-slate-600 text-right">
                    Saldo Pendiente
                  </th>
                  <th className="px-5 py-3.5 text-right font-semibold text-slate-600">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendientes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center text-slate-500">
                      No hay ventas al crédito con deuda pendiente en esta sucursal.
                    </td>
                  </tr>
                ) : (
                  pendientes.map((venta) => (
                    <tr key={venta.idventa} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4 text-slate-700">{venta.fecha}</td>
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {venta.clienteNombre}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                          {venta.comprobante}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-slate-800">
                        {formatMonedaCredito(venta.totalVenta)}
                      </td>
                      <td className="px-5 py-4 text-right text-emerald-700">
                        {formatMonedaCredito(venta.totalPagado)}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-red-600">
                        {formatMonedaCredito(venta.saldoPendiente)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => abrirModalAbono(venta)}
                          className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                        >
                          Registrar Pago / Abono
                        </button>
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
        open={modalOpen}
        title="Registrar abono de crédito"
        onClose={cerrarModal}
      >
        {selected && (
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-900">{selected.clienteNombre}</p>
              <p className="mt-1 text-slate-600">
                Comprobante: {selected.comprobante} · Venta del {selected.fecha}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="font-semibold">{formatMonedaCredito(selected.totalVenta)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Pagado</p>
                  <p className="font-semibold text-emerald-700">
                    {formatMonedaCredito(selected.totalPagado)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Saldo</p>
                  <p className="font-semibold text-red-600">
                    {formatMonedaCredito(selected.saldoPendiente)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">
                Historial de abonos
              </h3>
              {loadingHistorial ? (
                <p className="text-sm text-slate-500">Cargando historial...</p>
              ) : historial.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                  Sin abonos previos registrados.
                </p>
              ) : (
                <ul className="max-h-40 space-y-2 overflow-y-auto">
                  {historial.map((abono) => (
                    <li
                      key={abono.idcredito}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm"
                    >
                      <span className="text-slate-600">{abono.fecha}</span>
                      <span className="font-medium text-emerald-700">
                        {formatMonedaCredito(abono.total_pago)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form onSubmit={handleRegistrarAbono} className="space-y-4 border-t border-slate-100 pt-4">
              <div>
                <label htmlFor="monto_abono" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nuevo abono (Gs.) *
                </label>
                <input
                  id="monto_abono"
                  type="number"
                  min={0.01}
                  max={selected.saldoPendiente}
                  step={0.01}
                  required
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(e.target.value)}
                  placeholder={`Máx. ${selected.saldoPendiente.toFixed(2)}`}
                  className={inputClassName}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Saldo pendiente: {formatMonedaCredito(selected.saldoPendiente)}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                >
                  {isPending ? "Registrando..." : "Confirmar Abono"}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
