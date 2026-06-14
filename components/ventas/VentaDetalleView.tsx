"use client";

import Link from "next/link";
import ImprimirTicketButton from "@/components/ventas/ImprimirTicketButton";
import TicketFactura80mm from "@/components/ventas/TicketFactura80mm";
import type { VentaRegistro } from "@/lib/types/venta";
import { formatMonedaVenta } from "@/lib/types/venta";
import { getEtiquetaTipoIva } from "@/lib/types/factura-ticket";

type VentaDetalleViewProps = {
  venta: VentaRegistro;
};

export default function VentaDetalleView({ venta }: VentaDetalleViewProps) {
  const comprobante =
    venta.num_factura ?? `${venta.serie_comprobante}-${venta.num_comprobante}`;

  return (
    <div className="min-h-full bg-slate-50">
      <header className="app-no-print border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">Ventas · Detalle</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Venta #{venta.idventa}
            </h1>
            <p className="mt-1 font-mono text-sm text-slate-600">{comprobante}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {venta.ticket && <ImprimirTicketButton ticket={venta.ticket} />}
            <Link
              href="/ventas/nueva"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Nueva venta
            </Link>
          </div>
        </div>
      </header>

      <main className="app-no-print space-y-6 px-6 py-8 lg:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-slate-500">Cliente</p>
            <p className="mt-1 font-semibold text-slate-900">
              {venta.cliente?.nombre ?? "—"}
            </p>
            {venta.cliente?.num_documento && (
              <p className="text-sm text-slate-600">
                {venta.cliente.tipo_documento}: {venta.cliente.num_documento}
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-slate-500">Fecha</p>
            <p className="mt-1 font-semibold text-slate-900">{venta.fecha}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-slate-500">Tipo</p>
            <p className="mt-1 font-semibold text-slate-900">
              {venta.tipo_comprobante} · {venta.tipo_venta}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-slate-500">Total</p>
            <p className="mt-1 text-lg font-bold text-emerald-700">
              {formatMonedaVenta(venta.total)}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase text-slate-500">
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Cant.</th>
                  <th className="px-4 py-3">P. Unit.</th>
                  <th className="px-4 py-3">IVA</th>
                  <th className="px-4 py-3">Desc.</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(venta.detalles ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Sin detalle de productos.
                    </td>
                  </tr>
                ) : (
                  venta.detalles?.map((detalle) => (
                    <tr key={detalle.iddetalle_pedido}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {detalle.nombreArticulo ?? `Lote #${detalle.iddetalle_ingreso}`}
                      </td>
                      <td className="px-4 py-3">{detalle.cantidad}</td>
                      <td className="px-4 py-3">
                        {formatMonedaVenta(detalle.precio_venta)}
                      </td>
                      <td className="px-4 py-3">
                        {getEtiquetaTipoIva(detalle.tipo_iva)}
                      </td>
                      <td className="px-4 py-3">
                        {formatMonedaVenta(detalle.descuento ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatMonedaVenta(
                          detalle.cantidad * detalle.precio_venta -
                            (detalle.descuento ?? 0)
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {venta.ticket && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Vista previa del ticket (80mm)
            </h2>
            <div className="flex justify-center overflow-x-auto rounded-xl border border-dashed border-slate-200 bg-slate-100 p-4">
              <TicketFactura80mm data={venta.ticket} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
