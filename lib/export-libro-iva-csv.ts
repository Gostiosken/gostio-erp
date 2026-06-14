import type { LibroIvaVentasDetalle } from "@/lib/types/reportes";

function escaparCsv(valor: string): string {
  if (/[",\n\r]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

function celdaTexto(valor: string): string {
  return escaparCsv(valor);
}

function celdaNumero(valor: number): string {
  return String(Math.round(valor));
}

export function generarCsvLibroIva(libro: LibroIvaVentasDetalle): string {
  const encabezados = [
    "Fecha",
    "Nro. Comprobante",
    "RUC",
    "Cliente",
    "Exentas",
    "Gravadas 5%",
    "IVA 5%",
    "Gravadas 10%",
    "IVA 10%",
    "Total Facturado",
  ];

  const filas = libro.filas.map((fila) =>
    [
      celdaTexto(fila.fecha),
      celdaTexto(fila.numComprobante),
      celdaTexto(fila.rucCliente),
      celdaTexto(fila.nombreCliente),
      celdaNumero(fila.exentas),
      celdaNumero(fila.gravadas5),
      celdaNumero(fila.iva5),
      celdaNumero(fila.gravadas10),
      celdaNumero(fila.iva10),
      celdaNumero(fila.totalFacturado),
    ].join(",")
  );

  const totales = libro.totales;
  const filaTotales = [
    celdaTexto("TOTALES"),
    celdaTexto(""),
    celdaTexto(""),
    celdaTexto(""),
    celdaNumero(totales.exentas),
    celdaNumero(totales.gravadas5),
    celdaNumero(totales.iva5),
    celdaNumero(totales.gravadas10),
    celdaNumero(totales.iva10),
    celdaNumero(totales.totalFacturado),
  ].join(",");

  return [encabezados.join(","), ...filas, filaTotales].join("\r\n");
}

export function descargarCsvLibroIva(
  libro: LibroIvaVentasDetalle,
  nombreArchivo?: string
): void {
  const contenido = generarCsvLibroIva(libro);
  const blob = new Blob(["\uFEFF", contenido], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  const periodo = libro.periodo.etiqueta.replace(/\s+/g, "_").toLowerCase();
  enlace.href = url;
  enlace.download =
    nombreArchivo ?? `libro_iva_ventas_${periodo}_sucursal_${libro.idsucursal}.csv`;
  enlace.click();
  URL.revokeObjectURL(url);
}
