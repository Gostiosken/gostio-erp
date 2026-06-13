import { CLIENTES_MOCK } from "@/lib/data/clientes-mock";
import { VENTAS_MOCK } from "@/lib/data/ventas-mock";
import type { Credito } from "@/lib/types/credito";
import {
  calcularSaldoPendiente,
  formatComprobante,
  type VentaPendienteCobro,
} from "@/lib/types/credito";

export const CREDITOS_MOCK: Credito[] = [
  {
    idcredito: 1,
    idventa: 2,
    fecha: "2026-06-12",
    total_pago: 200.0,
  },
  {
    idcredito: 2,
    idventa: 2,
    fecha: "2026-06-15",
    total_pago: 100.0,
  },
  {
    idcredito: 3,
    idventa: 3,
    fecha: "2026-06-14",
    total_pago: 118.0,
  },
];

let mockCreditoCounter = CREDITOS_MOCK.length;

export function getNextMockCreditoId(): number {
  mockCreditoCounter += 1;
  return mockCreditoCounter;
}

export function getCreditosMockByVenta(idventa: number): Credito[] {
  return CREDITOS_MOCK.filter((credito) => credito.idventa === idventa).sort(
    (a, b) => a.fecha.localeCompare(b.fecha)
  );
}

export function getTotalPagadoMock(idventa: number): number {
  return CREDITOS_MOCK.filter((c) => c.idventa === idventa).reduce(
    (acc, c) => acc + c.total_pago,
    0
  );
}

export function getVentasPendientesMock(
  idsucursal: number
): VentaPendienteCobro[] {
  const pendientes: VentaPendienteCobro[] = [];

  for (const venta of VENTAS_MOCK) {
    if (venta.idsucursal !== idsucursal || venta.tipo_venta !== "Credito") {
      continue;
    }

    const totalPagado = getTotalPagadoMock(venta.idventa);
    const saldoPendiente = calcularSaldoPendiente(venta.total, totalPagado);

    if (venta.total > totalPagado) {
      const cliente =
        venta.cliente ??
        CLIENTES_MOCK.find((c) => c.idpersona === venta.idcliente);

      pendientes.push({
        idventa: venta.idventa,
        fecha: venta.fecha,
        idcliente: venta.idcliente,
        clienteNombre: cliente?.nombre ?? "Cliente",
        tipo_comprobante: venta.tipo_comprobante,
        serie_comprobante: venta.serie_comprobante,
        num_comprobante: venta.num_comprobante,
        comprobante: formatComprobante(
          venta.serie_comprobante,
          venta.num_comprobante
        ),
        totalVenta: venta.total,
        totalPagado,
        saldoPendiente,
      });
    }
  }

  return pendientes.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function registrarAbonoMock(
  idventa: number,
  totalPago: number
): Credito | null {
  const venta = VENTAS_MOCK.find((v) => v.idventa === idventa);
  if (!venta || venta.tipo_venta !== "Credito") return null;

  const totalPagado = getTotalPagadoMock(idventa);
  const saldo = calcularSaldoPendiente(venta.total, totalPagado);

  if (totalPago <= 0 || totalPago > saldo) return null;

  const nuevo: Credito = {
    idcredito: getNextMockCreditoId(),
    idventa,
    fecha: new Date().toISOString().slice(0, 10),
    total_pago: Number(totalPago.toFixed(2)),
  };

  CREDITOS_MOCK.push(nuevo);
  return nuevo;
}
