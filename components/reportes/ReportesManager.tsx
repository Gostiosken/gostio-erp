"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  getLibroIvaVentas,
  getReporteRentabilidad,
} from "@/lib/actions/reportes";
import { descargarCsvLibroIva } from "@/lib/export-libro-iva-csv";
import { formatMoneda } from "@/lib/format-moneda";
import type { Sucursal } from "@/lib/types/sucursal";
import { isSucursalActiva } from "@/lib/types/sucursal";
import type {
  LibroIvaVentasDetalle,
  ReporteRentabilidad,
} from "@/lib/types/reportes";
import { MESES_REPORTE } from "@/lib/types/reportes";

type ReportesManagerProps = {
  sucursales: Sucursal[];
  usingMockData?: boolean;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

const labelClassName = "mb-1 block text-xs font-medium text-slate-600";

function primerDiaMes(anio: number, mes: number): string {
  return `${anio}-${String(mes).padStart(2, "0")}-01`;
}

function ultimoDiaMes(anio: number, mes: number): string {
  const ultimo = new Date(anio, mes, 0);
  return ultimo.toISOString().slice(0, 10);
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`} />
  );
}

function KpiCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <SkeletonBlock className="mb-3 h-4 w-32" />
      <SkeletonBlock className="h-8 w-40" />
      <SkeletonBlock className="mt-2 h-3 w-24" />
    </div>
  );
}

function TablaSkeleton({ filas = 5 }: { filas?: number }) {
  return (
    <div className="space-y-3">
      <SkeletonBlock className="h-10 w-full" />
      {Array.from({ length: filas }).map((_, index) => (
        <SkeletonBlock key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

type KpiCardProps = {
  titulo: string;
  valor: string;
  subtitulo?: string;
  destacado?: boolean;
  positivo?: boolean;
};

function KpiCard({ titulo, valor, subtitulo, destacado, positivo }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {titulo}
      </p>
      <p
        className={`mt-2 text-2xl font-bold tracking-tight ${
          destacado
            ? positivo
              ? "text-emerald-600"
              : "text-red-600"
            : "text-slate-900"
        }`}
      >
        {valor}
      </p>
      {subtitulo && (
        <p
          className={`mt-1 text-sm ${
            destacado && positivo
              ? "font-semibold text-emerald-600"
              : destacado && !positivo
                ? "font-semibold text-red-600"
                : "text-slate-500"
          }`}
        >
          {subtitulo}
        </p>
      )}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

export default function ReportesManager({
  sucursales,
  usingMockData = false,
}: ReportesManagerProps) {
  const { session } = useAuth();
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth() + 1;

  const sucursalesActivas = useMemo(
    () => sucursales.filter((s) => isSucursalActiva(s.estado)),
    [sucursales]
  );

  const [idsucursal, setIdsucursal] = useState(
    session?.idsucursal ?? sucursalesActivas[0]?.idsucursal ?? 0
  );
  const [mesIva, setMesIva] = useState(mesActual);
  const [anioIva, setAnioIva] = useState(anioActual);
  const [fechaInicio, setFechaInicio] = useState(primerDiaMes(anioActual, mesActual));
  const [fechaFin, setFechaFin] = useState(ultimoDiaMes(anioActual, mesActual));

  const [rentabilidad, setRentabilidad] = useState<ReporteRentabilidad | null>(null);
  const [libroIva, setLibroIva] = useState<LibroIvaVentasDetalle | null>(null);
  const [loadingRentabilidad, setLoadingRentabilidad] = useState(true);
  const [loadingLibroIva, setLoadingLibroIva] = useState(true);
  const [errorRentabilidad, setErrorRentabilidad] = useState<string | null>(null);
  const [errorLibroIva, setErrorLibroIva] = useState<string | null>(null);

  useEffect(() => {
    if (session?.idsucursal && !idsucursal) {
      setIdsucursal(session.idsucursal);
    }
  }, [session, idsucursal]);

  const cargarRentabilidad = useCallback(async () => {
    if (!idsucursal) return;
    setLoadingRentabilidad(true);
    setErrorRentabilidad(null);

    const result = await getReporteRentabilidad(idsucursal, fechaInicio, fechaFin);
    if (result.success && result.data) {
      setRentabilidad(result.data);
    } else {
      setRentabilidad(null);
      setErrorRentabilidad(result.error ?? "No se pudo cargar el reporte.");
    }
    setLoadingRentabilidad(false);
  }, [idsucursal, fechaInicio, fechaFin]);

  const cargarLibroIva = useCallback(async () => {
    if (!idsucursal) return;
    setLoadingLibroIva(true);
    setErrorLibroIva(null);

    const result = await getLibroIvaVentas(idsucursal, mesIva, anioIva);
    if (result.success && result.data) {
      setLibroIva(result.data);
    } else {
      setLibroIva(null);
      setErrorLibroIva(result.error ?? "No se pudo cargar el libro IVA.");
    }
    setLoadingLibroIva(false);
  }, [idsucursal, mesIva, anioIva]);

  useEffect(() => {
    cargarRentabilidad();
  }, [cargarRentabilidad]);

  useEffect(() => {
    cargarLibroIva();
  }, [cargarLibroIva]);

  const nombreSucursal =
    sucursalesActivas.find((s) => s.idsucursal === idsucursal)?.razon_social ?? "—";

  const aniosDisponibles = useMemo(() => {
    const lista = [anioActual, anioActual - 1, anioActual - 2];
    return [...new Set(lista)];
  }, [anioActual]);

  return (
    <div className="min-h-full bg-slate-50">
      <header className="app-no-print border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <div>
          <p className="text-sm font-medium text-indigo-600">Administración · Reportes</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Centro de Reportes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Análisis de rentabilidad y libro IVA ventas conforme a la DNIT Paraguay.
          </p>
        </div>
      </header>

      <main className="app-no-print space-y-6 px-6 py-8 lg:px-8">
        {usingMockData && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Modo demostración: los reportes utilizan datos simulados en memoria.
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Filtros generales
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <label htmlFor="sucursal" className={labelClassName}>
                Sucursal
              </label>
              <select
                id="sucursal"
                value={idsucursal || ""}
                onChange={(e) => setIdsucursal(Number(e.target.value))}
                className={inputClassName}
              >
                {sucursalesActivas.length === 0 ? (
                  <option value="">Sin sucursales activas</option>
                ) : (
                  sucursalesActivas.map((sucursal) => (
                    <option key={sucursal.idsucursal} value={sucursal.idsucursal}>
                      {sucursal.razon_social}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="flex items-end">
              <p className="text-sm text-slate-600">
                Consultando:{" "}
                <span className="font-semibold text-slate-900">{nombreSucursal}</span>
              </p>
            </div>
          </div>
        </section>

        <Tabs defaultValue="rentabilidad">
          <TabsList>
            <TabsTrigger value="rentabilidad">Dashboard de Rentabilidad</TabsTrigger>
            <TabsTrigger value="libro-iva">Libro IVA Ventas (DNIT)</TabsTrigger>
          </TabsList>

          <TabsContent value="rentabilidad">
            <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Periodo de rentabilidad
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:max-w-xl">
                <div>
                  <label htmlFor="fecha_inicio" className={labelClassName}>
                    Fecha inicio
                  </label>
                  <input
                    id="fecha_inicio"
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label htmlFor="fecha_fin" className={labelClassName}>
                    Fecha fin
                  </label>
                  <input
                    id="fecha_fin"
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>
            </section>

            {errorRentabilidad && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {errorRentabilidad}
              </div>
            )}

            {loadingRentabilidad ? (
              <div className="grid gap-4 md:grid-cols-3">
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
              </div>
            ) : rentabilidad ? (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <KpiCard
                    titulo="Total Ingresos por Ventas"
                    valor={formatMoneda(rentabilidad.totalIngresosVentas)}
                    subtitulo={`${rentabilidad.cantidadVentas} ventas · ${rentabilidad.cantidadLineas} líneas`}
                  />
                  <KpiCard
                    titulo="Total Costo de Mercadería (CMV)"
                    valor={formatMoneda(rentabilidad.totalCostoMercaderiaVendida)}
                    subtitulo="Costo de compra de lotes vendidos"
                  />
                  <KpiCard
                    titulo="Margen de Utilidad Bruta"
                    valor={formatMoneda(rentabilidad.margenUtilidadBruta)}
                    subtitulo={`${rentabilidad.margenUtilidadPorcentaje}% sobre ingresos`}
                    destacado
                    positivo={rentabilidad.margenUtilidadBruta >= 0}
                  />
                </div>

                <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Top 5 productos más vendidos
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Del {rentabilidad.fechaInicio} al {rentabilidad.fechaFin}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[880px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase text-slate-500">
                          <th className="px-5 py-3">#</th>
                          <th className="px-5 py-3">Producto</th>
                          <th className="px-5 py-3 text-right">Cantidad</th>
                          <th className="px-5 py-3 text-right">Ingresos</th>
                          <th className="px-5 py-3 text-right">CMV</th>
                          <th className="px-5 py-3 text-right">Margen</th>
                          <th className="px-5 py-3 text-right">Margen %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rentabilidad.topProductos.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                              No hay ventas con detalle en el periodo seleccionado.
                            </td>
                          </tr>
                        ) : (
                          rentabilidad.topProductos.map((producto, index) => (
                            <tr key={producto.idarticulo} className="hover:bg-slate-50/50">
                              <td className="px-5 py-3 font-medium text-slate-500">
                                {index + 1}
                              </td>
                              <td className="px-5 py-3 font-medium text-slate-900">
                                {producto.nombre}
                              </td>
                              <td className="px-5 py-3 text-right">
                                {producto.cantidadVendida.toLocaleString("es-PY")}
                              </td>
                              <td className="px-5 py-3 text-right font-medium">
                                {formatMoneda(producto.ingresosGenerados)}
                              </td>
                              <td className="px-5 py-3 text-right text-slate-600">
                                {formatMoneda(producto.costoMercaderia)}
                              </td>
                              <td
                                className={`px-5 py-3 text-right font-semibold ${
                                  producto.margenBruto >= 0
                                    ? "text-emerald-700"
                                    : "text-red-600"
                                }`}
                              >
                                {formatMoneda(producto.margenBruto)}
                              </td>
                              <td
                                className={`px-5 py-3 text-right font-semibold ${
                                  producto.margenPorcentaje >= 0
                                    ? "text-emerald-700"
                                    : "text-red-600"
                                }`}
                              >
                                {producto.margenPorcentaje}%
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="libro-iva">
            <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
              <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:max-w-lg">
                <div>
                  <label htmlFor="mes_iva" className={labelClassName}>
                    Mes
                  </label>
                  <select
                    id="mes_iva"
                    value={mesIva}
                    onChange={(e) => setMesIva(Number(e.target.value))}
                    className={inputClassName}
                  >
                    {MESES_REPORTE.map((mes) => (
                      <option key={mes.valor} value={mes.valor}>
                        {mes.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="anio_iva" className={labelClassName}>
                    Año
                  </label>
                  <select
                    id="anio_iva"
                    value={anioIva}
                    onChange={(e) => setAnioIva(Number(e.target.value))}
                    className={inputClassName}
                  >
                    {aniosDisponibles.map((anio) => (
                      <option key={anio} value={anio}>
                        {anio}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                disabled={!libroIva || loadingLibroIva}
                onClick={() => libroIva && descargarCsvLibroIva(libroIva)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <DownloadIcon />
                Exportar Libro IVA
              </button>
            </section>

            {errorLibroIva && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {errorLibroIva}
              </div>
            )}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Libro IVA Ventas
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {libroIva?.periodo.etiqueta ?? `${MESES_REPORTE[mesIva - 1]?.nombre} ${anioIva}`}
                  {" · "}
                  Facturas legales con timbrado DNIT
                </p>
              </div>

              {loadingLibroIva ? (
                <div className="p-5">
                  <TablaSkeleton filas={6} />
                </div>
              ) : libroIva ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1180px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                        <th className="px-4 py-3 font-semibold">Fecha</th>
                        <th className="px-4 py-3 font-semibold">Nro. Comprobante</th>
                        <th className="px-4 py-3 font-semibold">RUC</th>
                        <th className="px-4 py-3 font-semibold">Cliente</th>
                        <th className="px-4 py-3 text-right font-semibold">Exentas</th>
                        <th className="px-4 py-3 text-right font-semibold">Grav. 5%</th>
                        <th className="px-4 py-3 text-right font-semibold">IVA 5%</th>
                        <th className="px-4 py-3 text-right font-semibold">Grav. 10%</th>
                        <th className="px-4 py-3 text-right font-semibold">IVA 10%</th>
                        <th className="px-4 py-3 text-right font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {libroIva.filas.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                            No hay facturas legales registradas en este periodo.
                          </td>
                        </tr>
                      ) : (
                        libroIva.filas.map((fila) => (
                          <tr key={fila.idventa} className="hover:bg-slate-50/60">
                            <td className="px-4 py-3 whitespace-nowrap">{fila.fecha}</td>
                            <td className="px-4 py-3 font-mono text-xs font-medium text-indigo-700">
                              {fila.numComprobante}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs">{fila.rucCliente}</td>
                            <td className="px-4 py-3 max-w-[200px] truncate" title={fila.nombreCliente}>
                              {fila.nombreCliente}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">
                              {formatMoneda(fila.exentas)}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">
                              {formatMoneda(fila.gravadas5)}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">
                              {formatMoneda(fila.iva5)}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">
                              {formatMoneda(fila.gravadas10)}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">
                              {formatMoneda(fila.iva10)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                              {formatMoneda(fila.totalFacturado)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {libroIva.filas.length > 0 && (
                      <tfoot>
                        <tr className="border-t-2 border-indigo-200 bg-indigo-50/70 font-semibold text-slate-900">
                          <td className="px-4 py-3" colSpan={4}>
                            TOTALES DEL PERIODO
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {formatMoneda(libroIva.totales.exentas)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {formatMoneda(libroIva.totales.gravadas5)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {formatMoneda(libroIva.totales.iva5)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {formatMoneda(libroIva.totales.gravadas10)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {formatMoneda(libroIva.totales.iva10)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-indigo-800">
                            {formatMoneda(libroIva.totales.totalFacturado)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              ) : null}
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
