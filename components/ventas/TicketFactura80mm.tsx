"use client";

import type { TicketFacturaData } from "@/lib/types/factura-ticket";
import {
  formatGsEntero,
  getEtiquetaTipoIva,
} from "@/lib/types/factura-ticket";

type TicketFactura80mmProps = {
  data: TicketFacturaData;
  className?: string;
};

function LineaSeparadora() {
  return <div className="my-1 border-t border-dashed border-black" />;
}

export default function TicketFactura80mm({
  data,
  className = "",
}: TicketFactura80mmProps) {
  const { emisor, cliente, items, liquidacion } = data;

  return (
    <div
      className={`ticket-print-root mx-auto w-[80mm] max-w-[80mm] bg-white p-[2mm] font-mono text-[9px] leading-tight text-black ${className}`}
    >
      <div className="text-center">
        <p className="text-[11px] font-bold uppercase">{emisor.razon_social}</p>
        <p>RUC: {emisor.ruc_emisor}</p>
        <p className="px-1">{emisor.direccion}</p>
      </div>

      <LineaSeparadora />

      <div className="text-center">
        <p className="text-[10px] font-bold uppercase">
          {data.tipo_comprobante === "Factura" ? "Factura" : data.tipo_comprobante}
        </p>
        <p>
          Timbrado N° {emisor.numero_timbrado}
        </p>
        <p>Vigente hasta: {emisor.fecha_vencimiento_timbrado}</p>
        <p className="mt-1 text-[11px] font-bold">
          N° {data.num_factura}
        </p>
        <p className="text-[8px]">
          Est. {emisor.establecimiento} · Punto {emisor.punto_expedicion}
        </p>
        <p>Fecha: {data.fecha}</p>
      </div>

      <LineaSeparadora />

      <div>
        <p className="font-bold">CLIENTE</p>
        <p>{cliente.nombre}</p>
        <p>
          {cliente.tipo_documento}: {cliente.num_documento}
        </p>
      </div>

      <LineaSeparadora />

      <table className="w-full border-collapse text-[8px]">
        <thead>
          <tr className="border-b border-black">
            <th className="py-0.5 text-left font-bold">Descripción</th>
            <th className="py-0.5 text-right font-bold">Cant</th>
            <th className="py-0.5 text-right font-bold">IVA</th>
            <th className="py-0.5 text-right font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const subtotal =
              item.cantidad * item.precio_venta - (item.descuento ?? 0);
            return (
              <tr key={`${item.nombre}-${index}`} className="align-top">
                <td className="py-0.5 pr-1">
                  <span className="block break-words">{item.nombre}</span>
                  <span className="text-[7px] text-gray-700">
                    {formatGsEntero(item.precio_venta)} c/u
                  </span>
                </td>
                <td className="py-0.5 text-right">{item.cantidad}</td>
                <td className="py-0.5 text-right">{getEtiquetaTipoIva(item.tipo_iva)}</td>
                <td className="py-0.5 text-right whitespace-nowrap">
                  {formatGsEntero(subtotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <LineaSeparadora />

      <div className="text-right">
        <p className="text-[12px] font-bold">
          TOTAL GENERAL: {formatGsEntero(liquidacion.totalGeneral)}
        </p>
      </div>

      <LineaSeparadora />

      <div className="text-[8px]">
        <p className="mb-1 text-center font-bold uppercase">Liquidación IVA</p>
        {liquidacion.gravada10 > 0 && (
          <div className="flex justify-between gap-2">
            <span>Grav. 10%:</span>
            <span>{formatGsEntero(liquidacion.gravada10)}</span>
          </div>
        )}
        {liquidacion.iva10 > 0 && (
          <div className="flex justify-between gap-2">
            <span>IVA 10%:</span>
            <span>{formatGsEntero(liquidacion.iva10)}</span>
          </div>
        )}
        {liquidacion.gravada5 > 0 && (
          <div className="flex justify-between gap-2">
            <span>Grav. 5%:</span>
            <span>{formatGsEntero(liquidacion.gravada5)}</span>
          </div>
        )}
        {liquidacion.iva5 > 0 && (
          <div className="flex justify-between gap-2">
            <span>IVA 5%:</span>
            <span>{formatGsEntero(liquidacion.iva5)}</span>
          </div>
        )}
        {liquidacion.exenta > 0 && (
          <div className="flex justify-between gap-2">
            <span>Exentas:</span>
            <span>{formatGsEntero(liquidacion.exenta)}</span>
          </div>
        )}
        <div className="mt-1 flex justify-between gap-2 font-bold">
          <span>Total IVA:</span>
          <span>{formatGsEntero(liquidacion.totalIva)}</span>
        </div>
      </div>

      <LineaSeparadora />

      <p className="text-center text-[7px]">
        Documento generado por FabriColor ERP · DNIT Paraguay
      </p>
    </div>
  );
}
