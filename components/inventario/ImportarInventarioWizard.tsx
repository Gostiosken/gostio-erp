"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import Toast from "@/components/ui/Toast";
import { procesarImportacionMasiva } from "@/lib/actions/importador-inventario";
import { formatMoneda } from "@/lib/format-moneda";
import {
  leerArchivoExcel,
  mapearColumnasAInput,
  obtenerFilasValidasParaImportacion,
  type CampoImportacionInventario,
  type FilaExcelMapeada,
  type MapeoColumnasImportacion,
} from "@/lib/utils/excel-parser";

type PasoWizard = 1 | 2 | 3;

type CampoMapeoDefinicion = {
  clave: CampoImportacionInventario;
  etiqueta: string;
  requerido: boolean;
};

const CAMPOS_MAPEO: CampoMapeoDefinicion[] = [
  { clave: "codigoBarra", etiqueta: "Código de Barra", requerido: true },
  { clave: "nombre", etiqueta: "Nombre", requerido: true },
  { clave: "costoBruto", etiqueta: "Costo Bruto", requerido: false },
  { clave: "precioVentaPublico", etiqueta: "Precio de Venta", requerido: false },
  { clave: "stockInicial", etiqueta: "Stock Inicial", requerido: false },
  { clave: "tasaIva", etiqueta: "Tasa de IVA", requerido: false },
  { clave: "nombreCategoria", etiqueta: "Categoría", requerido: false },
  { clave: "tipo", etiqueta: "Tipo (PRODUCTO / SERVICIO)", requerido: false },
];

const SUGERENCIAS_MAPEO: Record<CampoImportacionInventario, string[]> = {
  codigoBarra: ["CODIGO", "CODIGO_BARRA", "BARCODE", "SKU", "EAN", "COD"],
  nombre: ["NOMBRE", "DESCRIPCION", "DESCRIPCION_INSUMO", "PRODUCTO", "ARTICULO"],
  descripcion: ["DESCRIPCION", "DETALLE", "OBSERVACION"],
  costoBruto: ["PRECIO_COSTO", "COSTO", "COSTO_BRUTO", "PRECIO_COMPRA"],
  precioVentaPublico: ["PRECIO_VENTA", "PRECIO", "PVP", "PRECIO_PUBLICO"],
  stockInicial: ["STOCK", "STOCK_FISICO", "CANTIDAD", "EXISTENCIA"],
  tasaIva: ["IVA", "TASA_IVA", "TIPO_IVA"],
  nombreCategoria: ["CATEGORIA", "RUBRO", "FAMILIA"],
  tipo: ["TIPO", "TIPO_ARTICULO", "PRODUCTO_SERVICIO"],
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

function normalizarTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function sugerirMapeoInicial(columnas: string[]): MapeoColumnasImportacion {
  const mapeo: MapeoColumnasImportacion = {};
  const columnasNormalizadas = columnas.map((col) => ({
    original: col,
    normalizada: normalizarTexto(col),
  }));

  for (const campo of CAMPOS_MAPEO) {
    const candidatos = SUGERENCIAS_MAPEO[campo.clave] ?? [];
    const coincidencia = columnasNormalizadas.find((col) =>
      candidatos.some(
        (candidato) =>
          col.normalizada === candidato ||
          col.normalizada.includes(candidato) ||
          candidato.includes(col.normalizada)
      )
    );

    if (coincidencia) {
      mapeo[campo.clave] = coincidencia.original;
    }
  }

  return mapeo;
}

function formatearValorPreview(valor: string | number | null | undefined): string {
  if (valor == null || valor === "") return "—";
  if (typeof valor === "number") return formatMoneda(valor);
  const numerico = Number(String(valor).replace(/[^\d.-]/g, ""));
  if (!Number.isNaN(numerico) && /^\d/.test(String(valor).trim())) {
    return formatMoneda(numerico);
  }
  return String(valor);
}

function ExcelIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h8M8 9h2" />
    </svg>
  );
}

function PasoIndicador({ pasoActual }: { pasoActual: PasoWizard }) {
  const pasos = [
    { numero: 1, titulo: "Cargar archivo" },
    { numero: 2, titulo: "Mapear columnas" },
    { numero: 3, titulo: "Validar e importar" },
  ] as const;

  return (
    <ol className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {pasos.map((paso, index) => {
        const activo = pasoActual === paso.numero;
        const completado = pasoActual > paso.numero;

        return (
          <li key={paso.numero} className="flex flex-1 items-center gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                activo
                  ? "bg-indigo-600 text-white"
                  : completado
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {completado ? "✓" : paso.numero}
            </div>
            <div>
              <p
                className={`text-sm font-semibold ${
                  activo ? "text-indigo-700" : "text-slate-700"
                }`}
              >
                {paso.titulo}
              </p>
            </div>
            {index < pasos.length - 1 && (
              <div className="hidden h-px flex-1 bg-slate-200 sm:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function ImportarInventarioWizard() {
  const router = useRouter();
  const { session } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [paso, setPaso] = useState<PasoWizard>(1);
  const [archivoNombre, setArchivoNombre] = useState<string | null>(null);
  const [columnas, setColumnas] = useState<string[]>([]);
  const [filasCrudas, setFilasCrudas] = useState<Record<string, unknown>[]>([]);
  const [mapeo, setMapeo] = useState<MapeoColumnasImportacion>({});
  const [filasMapeadas, setFilasMapeadas] = useState<FilaExcelMapeada[]>([]);
  const [dragActivo, setDragActivo] = useState(false);
  const [leyendoArchivo, setLeyendoArchivo] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [errorImportacion, setErrorImportacion] = useState<string | null>(null);
  const [progresoImportacion, setProgresoImportacion] = useState(0);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({ visible: false, message: "", type: "success" });

  const [isPending, startTransition] = useTransition();

  const contadores = useMemo(() => {
    const validas = filasMapeadas.filter((fila) => !fila.tieneError).length;
    const errores = filasMapeadas.filter((fila) => fila.tieneError).length;
    return { validas, errores, total: filasMapeadas.length };
  }, [filasMapeadas]);

  const filasPreview = useMemo(() => filasMapeadas.slice(0, 10), [filasMapeadas]);
  const filasValidas = useMemo(
    () => obtenerFilasValidasParaImportacion(filasMapeadas),
    [filasMapeadas]
  );

  const puedeValidarMapeo = Boolean(mapeo.codigoBarra && mapeo.nombre);
  const controlesDeshabilitados = leyendoArchivo || isPending;

  const procesarArchivo = useCallback(async (archivo: File) => {
    setLeyendoArchivo(true);
    setErrorCarga(null);

    try {
      const resultado = await leerArchivoExcel(archivo);
      setArchivoNombre(archivo.name);
      setColumnas(resultado.columnas);
      setFilasCrudas(resultado.filasCrudas);
      setMapeo(sugerirMapeoInicial(resultado.columnas));
      setFilasMapeadas([]);
      setPaso(2);
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "No se pudo leer el archivo.";
      setErrorCarga(mensaje);
    } finally {
      setLeyendoArchivo(false);
    }
  }, []);

  function onArchivoSeleccionado(lista: FileList | null) {
    const archivo = lista?.[0];
    if (!archivo) return;
    void procesarArchivo(archivo);
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActivo(false);
    if (controlesDeshabilitados) return;

    const archivo = event.dataTransfer.files?.[0];
    if (archivo) void procesarArchivo(archivo);
  }

  function aplicarMapeoYValidar() {
    if (!puedeValidarMapeo) {
      setErrorCarga("Debe mapear al menos Código de Barra y Nombre.");
      return;
    }

    const resultado = mapearColumnasAInput(filasCrudas, mapeo);
    setFilasMapeadas(resultado);
    setErrorCarga(null);
    setPaso(3);
  }

  function confirmarImportacion() {
    if (!session?.idsucursal || filasValidas.length === 0) return;

    setErrorImportacion(null);
    setProgresoImportacion(12);

    const intervalo = window.setInterval(() => {
      setProgresoImportacion((prev) => (prev >= 92 ? prev : prev + 7));
    }, 350);

    startTransition(async () => {
      try {
        const resultado = await procesarImportacionMasiva(
          session.idsucursal,
          filasValidas
        );

        window.clearInterval(intervalo);
        setProgresoImportacion(100);

        if (!resultado.success || !resultado.data) {
          setErrorImportacion(resultado.error ?? "La importación no se completó.");
          setToast({
            visible: true,
            type: "error",
            message: resultado.error ?? "Error al importar inventario.",
          });
          return;
        }

        const { exitosas, fallidas } = resultado.data;
        const mensaje =
          fallidas > 0
            ? `Importación parcial: ${exitosas} producto(s) cargados, ${fallidas} con error.`
            : `Importación exitosa: ${exitosas} producto(s) cargados.`;

        setToast({ visible: true, type: "success", message: mensaje });

        window.setTimeout(() => {
          router.push("/almacen/articulos");
        }, 1800);
      } catch {
        window.clearInterval(intervalo);
        setProgresoImportacion(0);
        setErrorImportacion("Error inesperado durante la importación.");
        setToast({
          visible: true,
          type: "error",
          message: "Error inesperado durante la importación.",
        });
      }
    });
  }

  return (
    <div className="min-h-full bg-slate-50">
      <header className="app-no-print border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              Inventario · Importación Masiva
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Importar desde Excel
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Cargue un archivo .xlsx, .xls o .csv y sincronice su catálogo con stock
              por sucursal.
            </p>
          </div>
          <Link
            href="/almacen/articulos"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Volver al catálogo
          </Link>
        </div>
      </header>

      <main className="app-no-print px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <PasoIndicador pasoActual={paso} />

          {session && (
            <p className="mb-6 text-sm text-slate-600">
              Sucursal destino:{" "}
              <span className="font-semibold text-slate-900">
                {session.sucursalNombre}
              </span>
            </p>
          )}

          {paso === 1 && (
            <section>
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!controlesDeshabilitados) setDragActivo(true);
                }}
                onDragLeave={() => setDragActivo(false)}
                onDrop={onDrop}
                className={`flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
                  dragActivo
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-slate-300 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/40"
                } ${controlesDeshabilitados ? "pointer-events-none opacity-60" : ""}`}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    inputRef.current?.click();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Zona para cargar archivo Excel"
              >
                <div
                  className={`mb-4 rounded-2xl p-4 ${
                    dragActivo ? "bg-indigo-100 text-indigo-700" : "bg-white text-emerald-600"
                  }`}
                >
                  <ExcelIcon />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Arrastre su archivo Excel aquí
                </h2>
                <p className="mt-2 max-w-md text-sm text-slate-500">
                  También puede hacer clic para seleccionar un archivo .xlsx, .xls o
                  .csv desde su equipo.
                </p>
                {leyendoArchivo && (
                  <div className="mt-5 flex items-center gap-2 text-sm font-medium text-indigo-700">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                    Leyendo columnas del archivo...
                  </div>
                )}
              </div>

              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                className="hidden"
                disabled={controlesDeshabilitados}
                onChange={(event) => onArchivoSeleccionado(event.target.files)}
              />

              {errorCarga && (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {errorCarga}
                </p>
              )}
            </section>
          )}

          {paso === 2 && (
            <section>
              <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Archivo cargado:{" "}
                <span className="font-semibold text-slate-900">{archivoNombre}</span>
                {" · "}
                {filasCrudas.length.toLocaleString("es-PY")} fila(s) detectada(s)
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid-cols-2">
                  <div className="px-4 py-3">Campo FabriColor ERP</div>
                  <div className="px-4 py-3">Columna del Excel</div>
                </div>

                {CAMPOS_MAPEO.map((campo) => (
                  <div
                    key={campo.clave}
                    className="grid grid-cols-1 items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 md:grid-cols-2"
                  >
                    <div className="text-sm font-medium text-slate-800">
                      {campo.etiqueta}
                      {campo.requerido && (
                        <span className="ml-1 text-red-500" title="Obligatorio">
                          *
                        </span>
                      )}
                    </div>
                    <select
                      value={mapeo[campo.clave] ?? ""}
                      onChange={(event) =>
                        setMapeo((prev) => ({
                          ...prev,
                          [campo.clave]: event.target.value || undefined,
                        }))
                      }
                      disabled={controlesDeshabilitados}
                      className={inputClassName}
                    >
                      <option value="">— Sin mapear —</option>
                      {columnas.map((columna) => (
                        <option key={columna} value={columna}>
                          {columna}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setPaso(1)}
                  disabled={controlesDeshabilitados}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={aplicarMapeoYValidar}
                  disabled={!puedeValidarMapeo || controlesDeshabilitados}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Aplicar Mapeo y Validar
                </button>
              </div>

              {errorCarga && (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {errorCarga}
                </p>
              )}
            </section>
          )}

          {paso === 3 && (
            <section>
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Productos listos para importar
                  </p>
                  <p className="mt-2 text-3xl font-bold text-emerald-700">
                    {contadores.validas.toLocaleString("es-PY")}
                  </p>
                </div>
                <div
                  className={`rounded-2xl border p-4 ${
                    contadores.errores > 0
                      ? "border-red-200 bg-red-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      contadores.errores > 0 ? "text-red-700" : "text-slate-500"
                    }`}
                  >
                    Registros con errores de formato
                  </p>
                  <p
                    className={`mt-2 text-3xl font-bold ${
                      contadores.errores > 0 ? "text-red-600" : "text-slate-700"
                    }`}
                  >
                    {contadores.errores.toLocaleString("es-PY")}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Vista previa (primeras 10 filas)
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                        <th className="px-4 py-3">Fila</th>
                        <th className="px-4 py-3">Código</th>
                        <th className="px-4 py-3">Nombre</th>
                        <th className="px-4 py-3">Costo</th>
                        <th className="px-4 py-3">Precio</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3">IVA</th>
                        <th className="px-4 py-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filasPreview.map((fila) => (
                        <tr
                          key={`${fila.indice}-${fila.datos.codigoBarra}`}
                          className={
                            fila.tieneError ? "bg-red-50/80" : "hover:bg-slate-50/60"
                          }
                        >
                          <td className="px-4 py-3 text-slate-500">{fila.indice}</td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {fila.datos.codigoBarra || "—"}
                          </td>
                          <td className="px-4 py-3">{fila.datos.nombre || "—"}</td>
                          <td className="px-4 py-3">
                            {formatearValorPreview(fila.datos.costoBruto)}
                          </td>
                          <td className="px-4 py-3">
                            {formatearValorPreview(fila.datos.precioVentaPublico)}
                          </td>
                          <td className="px-4 py-3">
                            {String(fila.datos.stockInicial ?? "—")}
                          </td>
                          <td className="px-4 py-3">{String(fila.datos.tasaIva)}</td>
                          <td className="px-4 py-3">
                            {fila.tieneError ? (
                              <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                                {fila.mensajeError}
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                Listo
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {isPending && (
                <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm font-medium text-indigo-800">
                    <span>Procesando importación masiva...</span>
                    <span>{progresoImportacion}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-indigo-100">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                      style={{ width: `${progresoImportacion}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-indigo-700">
                    No cierre esta ventana. La base de datos está procesando los lotes.
                  </p>
                </div>
              )}

              {errorImportacion && (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {errorImportacion}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setPaso(2)}
                  disabled={controlesDeshabilitados}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Ajustar mapeo
                </button>
                <button
                  type="button"
                  onClick={confirmarImportacion}
                  disabled={
                    filasValidas.length === 0 || controlesDeshabilitados || !session
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Importando...
                    </>
                  ) : (
                    "Confirmar e Iniciar Importación Masiva"
                  )}
                </button>
              </div>
            </section>
          )}
        </div>
      </main>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  );
}
