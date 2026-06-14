"use client";

import Image from "next/image";
import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  Eye,
  Globe,
  MapPin,
  Phone,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import Toast from "@/components/ui/Toast";
import FabriColorLoader from "@/components/ui/FabriColorLoader";
import {
  getPedidosWeb,
  procesarPedidoWeb,
} from "@/lib/actions/admin-ecommerce";
import { formatMoneda } from "@/lib/format-moneda";
import { getEtiquetaTipoIva } from "@/lib/types/factura-ticket";
import type { PedidoWebAdmin } from "@/lib/types/admin-ecommerce";
import type { EstadoPedidoWeb } from "@/lib/types/ecommerce";

type PedidosWebManagerProps = {
  initialPedidos: PedidoWebAdmin[];
  loadError?: string;
  usingMockData?: boolean;
};

type FiltroEstadoPedido = "todos" | EstadoPedidoWeb;

const FILTROS_ESTADO: Array<{ id: FiltroEstadoPedido; etiqueta: string }> = [
  { id: "todos", etiqueta: "Todos" },
  { id: "Pendiente", etiqueta: "Pendientes" },
  { id: "Aceptado", etiqueta: "Aceptados" },
  { id: "Cancelado", etiqueta: "Cancelados" },
];

function parseUbicacionCliente(direccion: string | null): {
  ciudad: string;
  departamento: string;
} {
  if (!direccion) {
    return { ciudad: "—", departamento: "—" };
  }

  const partes = direccion.split(",").map((p) => p.trim()).filter(Boolean);
  if (partes.length >= 3) {
    return {
      ciudad: partes[partes.length - 2] ?? "—",
      departamento: partes[partes.length - 1] ?? "—",
    };
  }
  if (partes.length === 2) {
    return { ciudad: partes[0], departamento: partes[1] };
  }
  return { ciudad: partes[0] ?? "—", departamento: "—" };
}

function EstadoBadge({ estado }: { estado: EstadoPedidoWeb }) {
  if (estado === "Pendiente") {
    return (
      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-800 ring-1 ring-indigo-200">
        Pendiente
      </span>
    );
  }
  if (estado === "Aceptado") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
        Aceptado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800 ring-1 ring-rose-200">
      Cancelado
    </span>
  );
}

function DetalleIvaPanel({ pedido }: { pedido: PedidoWebAdmin }) {
  const { liquidacion } = pedido;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-800">Desglose IVA (Paraguay)</p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Gravada 10%</dt>
          <dd className="font-medium text-slate-900">{formatMoneda(liquidacion.gravada10)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">IVA 10%</dt>
          <dd className="font-medium text-slate-900">{formatMoneda(liquidacion.iva10)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Gravada 5%</dt>
          <dd className="font-medium text-slate-900">{formatMoneda(liquidacion.gravada5)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">IVA 5%</dt>
          <dd className="font-medium text-slate-900">{formatMoneda(liquidacion.iva5)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Exenta</dt>
          <dd className="font-medium text-slate-900">{formatMoneda(liquidacion.exenta)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Total IVA</dt>
          <dd className="font-semibold text-indigo-700">{formatMoneda(liquidacion.totalIva)}</dd>
        </div>
      </dl>
      <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-sm font-bold text-slate-900">
        <span>Total general</span>
        <span>{formatMoneda(liquidacion.totalGeneral)}</span>
      </div>
    </div>
  );
}

export default function PedidosWebManager({
  initialPedidos,
  loadError,
  usingMockData = false,
}: PedidosWebManagerProps) {
  const router = useRouter();
  const { session } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoWebAdmin[]>(initialPedidos);
  const [filtro, setFiltro] = useState<FiltroEstadoPedido>("todos");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [confirmando, setConfirmando] = useState<{
    idpedido: number;
    accion: "APROBAR" | "RECHAZAR";
  } | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [isRefreshing, startRefresh] = useTransition();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({ visible: false, message: "", type: "success" });

  const pendientesCount = useMemo(
    () => pedidos.filter((p) => p.estado === "Pendiente").length,
    [pedidos]
  );

  const pedidosFiltrados = useMemo(() => {
    if (filtro === "todos") return pedidos;
    return pedidos.filter((p) => p.estado === filtro);
  }, [pedidos, filtro]);

  const recargarPedidos = useCallback(() => {
    startRefresh(async () => {
      const result = await getPedidosWeb();
      if (result.success && result.data) {
        setPedidos(result.data);
      }
      router.refresh();
    });
  }, [router]);

  const ejecutarAccion = useCallback(
    (idpedido: number, accion: "APROBAR" | "RECHAZAR") => {
      const idusuario = session?.usuario.idusuario;
      if (!idusuario) {
        setToast({
          visible: true,
          message: "Sesión no válida. Vuelva a iniciar sesión.",
          type: "error",
        });
        return;
      }

      setProcessingId(idpedido);
      setConfirmando(null);

      startTransition(async () => {
        const result = await procesarPedidoWeb(idpedido, accion, idusuario);

        if (!result.success || !result.data) {
          setToast({
            visible: true,
            message: result.error ?? "No se pudo procesar el pedido.",
            type: "error",
          });
          setProcessingId(null);
          return;
        }

        setPedidos((prev) =>
          prev.map((pedido) =>
            pedido.idpedido === idpedido
              ? {
                  ...pedido,
                  estado: result.data!.estado,
                  idventa: result.data!.idventa ?? pedido.idventa,
                }
              : pedido
          )
        );

        setToast({
          visible: true,
          message:
            accion === "APROBAR"
              ? "Venta registrada con éxito. Inventario descontado."
              : "Pedido web rechazado correctamente.",
          type: "success",
        });

        setProcessingId(null);
        recargarPedidos();
      });
    },
    [session?.usuario.idusuario, recargarPedidos]
  );

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-600">
              <span>Fabri</span>
              <span className="text-indigo-600">Color</span> ERP
            </p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
              <Globe className="h-6 w-6 text-indigo-600" aria-hidden />
              Pedidos Web
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Gestión de pedidos entrantes desde la tienda FabriColor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {usingMockData && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                Modo demostración
              </span>
            )}
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Pendientes
              </p>
              <p className="text-2xl font-black text-indigo-900">{pendientesCount}</p>
            </div>
          </div>
        </div>

        <div
          className="mt-5 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Filtrar pedidos por estado"
        >
          {FILTROS_ESTADO.map((item) => {
            const activo = filtro === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={activo}
                onClick={() => setFiltro(item.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activo
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {item.etiqueta}
              </button>
            );
          })}
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {loadError && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {loadError}
          </div>
        )}

        {isRefreshing && pedidos.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <FabriColorLoader size={44} label="Cargando pedidos web" />
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Globe className="mx-auto h-10 w-10 text-slate-300" aria-hidden />
            <p className="mt-3 text-base font-semibold text-slate-700">
              No hay pedidos en este filtro
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Los pedidos de la tienda web aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pedidosFiltrados.map((pedido) => {
              const ubicacion = parseUbicacionCliente(pedido.cliente.direccion);
              const expandido = expandedId === pedido.idpedido;
              const procesando = processingId === pedido.idpedido && isPending;

              return (
                <article
                  key={pedido.idpedido}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                >
                  <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-center lg:p-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Pedido
                      </p>
                      <p className="text-lg font-bold text-slate-900">#{pedido.idpedido}</p>
                      <p className="mt-1 text-sm text-slate-500">{pedido.fecha}</p>
                      <div className="mt-2">
                        <EstadoBadge estado={pedido.estado} />
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Cliente
                      </p>
                      <p className="font-semibold text-slate-900">{pedido.cliente.nombre}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {pedido.cliente.tipo_documento}: {pedido.cliente.num_documento}
                      </p>
                      {pedido.cliente.telefono && (
                        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                          <Phone className="h-3.5 w-3.5" />
                          {pedido.cliente.telefono}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Ubicación
                      </p>
                      <p className="flex items-start gap-1 text-sm text-slate-700">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                        <span>
                          {ubicacion.ciudad}
                          {ubicacion.departamento !== "—" && (
                            <> · {ubicacion.departamento}</>
                          )}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:items-end">
                      <div className="text-left sm:text-right">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Total
                        </p>
                        <p className="text-xl font-black text-slate-900">
                          {formatMoneda(pedido.total)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expandido ? null : pedido.idpedido)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        <Eye className="h-4 w-4" />
                        Ver detalles
                        <ChevronDown
                          className={`h-4 w-4 transition ${expandido ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                  </div>

                  {expandido && (
                    <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-4 sm:px-5">
                      <p className="text-sm font-semibold text-slate-800">
                        Productos del carrito
                      </p>
                      <div className="mt-3 overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                              <th className="px-2 py-2">Artículo</th>
                              <th className="px-2 py-2">Código</th>
                              <th className="px-2 py-2">IVA</th>
                              <th className="px-2 py-2 text-right">Cant.</th>
                              <th className="px-2 py-2 text-right">P. unit.</th>
                              <th className="px-2 py-2 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pedido.detalles.map((detalle) => (
                              <tr
                                key={detalle.iddetalle_pedido}
                                className="border-b border-slate-100 last:border-0"
                              >
                                <td className="px-2 py-2 font-medium text-slate-800">
                                  {detalle.nombreArticulo}
                                </td>
                                <td className="px-2 py-2 text-slate-500">
                                  {detalle.codigo ?? "—"}
                                </td>
                                <td className="px-2 py-2 text-slate-600">
                                  {getEtiquetaTipoIva(detalle.tipo_iva)}
                                </td>
                                <td className="px-2 py-2 text-right">{detalle.cantidad}</td>
                                <td className="px-2 py-2 text-right">
                                  {formatMoneda(detalle.precio_venta)}
                                </td>
                                <td className="px-2 py-2 text-right font-semibold">
                                  {formatMoneda(detalle.subtotal)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <DetalleIvaPanel pedido={pedido} />

                      {pedido.estado === "Pendiente" && (
                        <div className="mt-4 flex flex-wrap gap-3">
                          {confirmando?.idpedido === pedido.idpedido ? (
                            <div className="w-full rounded-xl border border-slate-200 bg-white p-4">
                              <p className="text-sm font-semibold text-slate-800">
                                {confirmando.accion === "APROBAR"
                                  ? "¿Aprobar pedido y registrar venta con descuento de inventario?"
                                  : "¿Rechazar este pedido web?"}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  disabled={procesando}
                                  onClick={() =>
                                    ejecutarAccion(pedido.idpedido, confirmando.accion)
                                  }
                                  className={
                                    confirmando.accion === "APROBAR"
                                      ? "inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                                      : "inline-flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-600 disabled:opacity-60"
                                  }
                                >
                                  {procesando ? (
                                    <Image
                                      src="/logo-light.png"
                                      alt=""
                                      width={56}
                                      height={14}
                                      className="h-3.5 w-auto animate-pulse"
                                      aria-hidden
                                    />
                                  ) : (
                                    "Confirmar"
                                  )}
                                </button>
                                <button
                                  type="button"
                                  disabled={procesando}
                                  onClick={() => setConfirmando(null)}
                                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  setConfirmando({
                                    idpedido: pedido.idpedido,
                                    accion: "APROBAR",
                                  })
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Aprobar y Facturar
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  setConfirmando({
                                    idpedido: pedido.idpedido,
                                    accion: "RECHAZAR",
                                  })
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
                              >
                                <XCircle className="h-4 w-4" />
                                Rechazar Pedido
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {pedido.idventa && (
                        <p className="mt-3 text-sm text-emerald-700">
                          Venta registrada: #{pedido.idventa}
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  );
}
