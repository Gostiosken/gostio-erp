"use client";

import Link from "next/link";
import ImprimirTicketButton from "@/components/ventas/ImprimirTicketButton";
import type { VentaRegistro } from "@/lib/types/venta";
import { formatMonedaVenta } from "@/lib/types/venta";

type VentaExitoPanelProps = {
  venta: VentaRegistro;
  onNuevaVenta?: () => void;
};

export default function VentaExitoPanel({ venta, onNuevaVenta }: VentaExitoPanelProps) {
  const comprobante =
    venta.num_factura ?? `${venta.serie_comprobante}-${venta.num_comprobante}`;

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-800">
            Venta procesada correctamente
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            Comprobante{" "}
            <span className="font-mono font-bold">{comprobante}</span>
            {venta.cliente && (
              <>
                {" "}
                · Cliente: <span className="font-medium">{venta.cliente.nombre}</span>
              </>
            )}
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            Total: <span className="font-bold">{formatMonedaVenta(venta.total)}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {venta.ticket && <ImprimirTicketButton ticket={venta.ticket} />}
          <Link
            href={`/ventas/${venta.idventa}`}
            className="inline-flex items-center rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
          >
            Ver detalle
          </Link>
          {onNuevaVenta && (
            <button
              type="button"
              onClick={onNuevaVenta}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Nueva venta
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
