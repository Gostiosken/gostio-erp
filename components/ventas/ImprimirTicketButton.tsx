"use client";

import { useCallback } from "react";
import type { TicketFacturaData } from "@/lib/types/factura-ticket";
import TicketFactura80mm from "@/components/ventas/TicketFactura80mm";

type ImprimirTicketButtonProps = {
  ticket: TicketFacturaData;
  className?: string;
};

function PrinterIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />
      <rect x="6" y="14" width="12" height="8" rx="1" />
    </svg>
  );
}

export default function ImprimirTicketButton({
  ticket,
  className = "",
}: ImprimirTicketButtonProps) {
  const handlePrint = useCallback(() => {
    document.body.classList.add("printing-ticket");

    const cleanup = () => {
      document.body.classList.remove("printing-ticket");
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);
    window.print();
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={handlePrint}
        className={`inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${className}`}
      >
        <PrinterIcon />
        Imprimir Ticket
      </button>

      <div
        aria-hidden
        className="ticket-print-root pointer-events-none fixed -left-[9999px] top-0"
      >
        <TicketFactura80mm data={ticket} />
      </div>
    </>
  );
}
