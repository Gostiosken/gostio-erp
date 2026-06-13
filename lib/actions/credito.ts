"use server";

import { revalidatePath } from "next/cache";
import { dbReadError, mockReadResult, shouldUseMockData } from "@/lib/action-db";
import { getPrisma } from "@/lib/prisma";
import { CLIENTES_MOCK } from "@/lib/data/clientes-mock";
import {
  CREDITOS_MOCK,
  getCreditosMockByVenta,
  getVentasPendientesMock,
  registrarAbonoMock,
} from "@/lib/data/creditos-mock";
import type { ActionResult } from "@/lib/types/action";
import type {
  Credito,
  CreditoInput,
  VentaPendienteCobro,
} from "@/lib/types/credito";
import {
  calcularSaldoPendiente,
  formatComprobante,
} from "@/lib/types/credito";

const CREDITOS_PATH = "/ventas/creditos";

function mapCredito(credito: {
  idcredito: number;
  idventa: number;
  fecha: Date;
  total_pago: { toString(): string };
}): Credito {
  return {
    idcredito: credito.idcredito,
    idventa: credito.idventa,
    fecha: credito.fecha.toISOString().slice(0, 10),
    total_pago: Number(credito.total_pago),
  };
}

async function resolverNombreCliente(idcliente: number): Promise<string> {
  if (shouldUseMockData()) {
    const cliente = CLIENTES_MOCK.find((c) => c.idpersona === idcliente);
    return cliente?.nombre ?? "Cliente";
  }

  try {
    const cliente = await getPrisma().persona.findUnique({
      where: { idpersona: idcliente },
      select: { nombre: true },
    });
    return cliente?.nombre ?? "Cliente";
  } catch (error) {
    if (shouldUseMockData()) {
      const cliente = CLIENTES_MOCK.find((c) => c.idpersona === idcliente);
      return cliente?.nombre ?? "Cliente";
    }
    console.error("No se pudo obtener el nombre del cliente.", error);
    return "Cliente";
  }
}

export async function getCreditos(): Promise<ActionResult<Credito[]>> {
  if (shouldUseMockData()) {
    return mockReadResult([...CREDITOS_MOCK]);
  }

  try {
    const creditos = await getPrisma().credito.findMany({
      orderBy: { idcredito: "asc" },
    });
    return { success: true, data: creditos.map(mapCredito) };
  } catch (error) {
    if (shouldUseMockData()) return mockReadResult([...CREDITOS_MOCK]);
    return dbReadError<Credito[]>("No se pudieron obtener los créditos.", error);
  }
}

export async function getCreditoById(
  id: number
): Promise<ActionResult<Credito>> {
  if (shouldUseMockData()) {
    const credito = CREDITOS_MOCK.find((item) => item.idcredito === id);
    if (!credito) {
      return { success: false, error: "Abono no encontrado." };
    }
    return mockReadResult(credito);
  }

  try {
    const credito = await getPrisma().credito.findUnique({
      where: { idcredito: id },
    });
    if (!credito) {
      return { success: false, error: "Abono no encontrado." };
    }
    return { success: true, data: mapCredito(credito) };
  } catch (error) {
    if (shouldUseMockData()) {
      const credito = CREDITOS_MOCK.find((item) => item.idcredito === id);
      if (!credito) return { success: false, error: "Abono no encontrado." };
      return mockReadResult(credito);
    }
    return dbReadError<Credito>("No se pudo obtener el abono.", error);
  }
}

export async function createCredito(
  input: CreditoInput
): Promise<ActionResult<Credito>> {
  if (shouldUseMockData()) {
    const abono = registrarAbonoMock(input.idventa, input.total_pago);
    if (!abono) {
      return {
        success: false,
        error: "No se pudo registrar el abono en modo demostración.",
        usingMockData: true,
      };
    }
    return { success: true, data: abono, usingMockData: true };
  }

  try {
    const credito = await getPrisma().credito.create({
      data: {
        idventa: input.idventa,
        fecha: input.fecha ? new Date(input.fecha) : new Date(),
        total_pago: input.total_pago,
      },
    });
    revalidatePath(CREDITOS_PATH);
    return { success: true, data: mapCredito(credito) };
  } catch {
    return { success: false, error: "No se pudo crear el registro de crédito." };
  }
}

export async function updateCredito(
  id: number,
  input: CreditoInput
): Promise<ActionResult<Credito>> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error: "Base de datos no configurada.",
      usingMockData: true,
    };
  }

  try {
    const credito = await getPrisma().credito.update({
      where: { idcredito: id },
      data: {
        idventa: input.idventa,
        fecha: input.fecha ? new Date(input.fecha) : undefined,
        total_pago: input.total_pago,
      },
    });
    revalidatePath(CREDITOS_PATH);
    return { success: true, data: mapCredito(credito) };
  } catch {
    return { success: false, error: "No se pudo actualizar el abono." };
  }
}

export async function deleteCredito(id: number): Promise<ActionResult> {
  if (shouldUseMockData()) {
    return {
      success: false,
      error: "Base de datos no configurada.",
      usingMockData: true,
    };
  }

  try {
    await getPrisma().credito.delete({ where: { idcredito: id } });
    revalidatePath(CREDITOS_PATH);
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo eliminar el abono." };
  }
}

export async function getHistorialAbonos(
  idventa: number
): Promise<ActionResult<Credito[]>> {
  if (!idventa) {
    return { success: false, error: "Venta no válida." };
  }

  if (shouldUseMockData()) {
    return mockReadResult(getCreditosMockByVenta(idventa));
  }

  try {
    const abonos = await getPrisma().credito.findMany({
      where: { idventa },
      orderBy: { fecha: "asc" },
    });
    return { success: true, data: abonos.map(mapCredito) };
  } catch (error) {
    if (shouldUseMockData()) return mockReadResult(getCreditosMockByVenta(idventa));
    return dbReadError<Credito[]>("No se pudo obtener el historial de abonos.", error);
  }
}

export async function getVentasPendientes(
  idsucursal: number
): Promise<ActionResult<VentaPendienteCobro[]>> {
  if (!idsucursal) {
    return { success: false, error: "Sucursal no válida." };
  }

  if (shouldUseMockData()) {
    return mockReadResult(getVentasPendientesMock(idsucursal));
  }

  try {
    const ventas = await getPrisma().venta.findMany({
      where: {
        tipo_venta: "Credito",
        pedido: { idsucursal },
      },
      include: {
        creditos: true,
        pedido: { select: { idcliente: true } },
      },
      orderBy: { fecha: "desc" },
    });

    const pendientes: VentaPendienteCobro[] = [];

    for (const venta of ventas) {
      const totalVenta = Number(venta.total);
      const totalPagado = venta.creditos.reduce(
        (acc, c) => acc + Number(c.total_pago),
        0
      );

      if (totalVenta > totalPagado) {
        const clienteNombre = await resolverNombreCliente(venta.pedido.idcliente);
        pendientes.push({
          idventa: venta.idventa,
          fecha: venta.fecha.toISOString().slice(0, 10),
          idcliente: venta.pedido.idcliente,
          clienteNombre,
          tipo_comprobante: venta.tipo_comprobante,
          serie_comprobante: venta.serie_comprobante,
          num_comprobante: venta.num_comprobante,
          comprobante: formatComprobante(
            venta.serie_comprobante,
            venta.num_comprobante
          ),
          totalVenta,
          totalPagado: Number(totalPagado.toFixed(2)),
          saldoPendiente: calcularSaldoPendiente(totalVenta, totalPagado),
        });
      }
    }

    return { success: true, data: pendientes };
  } catch (error) {
    if (shouldUseMockData()) return mockReadResult(getVentasPendientesMock(idsucursal));
    return dbReadError<VentaPendienteCobro[]>(
      "No se pudieron obtener las ventas pendientes de cobro.",
      error
    );
  }
}

export async function registrarAbono(
  idventa: number,
  totalPago: number
): Promise<ActionResult<Credito>> {
  if (!idventa) {
    return { success: false, error: "Venta no válida." };
  }

  if (totalPago <= 0) {
    return { success: false, error: "El monto del abono debe ser mayor a cero." };
  }

  if (shouldUseMockData()) {
    const abono = registrarAbonoMock(idventa, totalPago);
    if (!abono) {
      return {
        success: false,
        error: "El abono supera el saldo pendiente o la venta no es válida.",
        usingMockData: true,
      };
    }
    revalidatePath(CREDITOS_PATH);
    return { success: true, data: abono, usingMockData: true };
  }

  try {
    const venta = await getPrisma().venta.findUnique({
      where: { idventa },
      include: { creditos: true },
    });

    if (!venta || venta.tipo_venta !== "Credito") {
      return { success: false, error: "La venta al crédito no existe." };
    }

    const totalVenta = Number(venta.total);
    const totalPagado = venta.creditos.reduce(
      (acc, c) => acc + Number(c.total_pago),
      0
    );
    const saldo = calcularSaldoPendiente(totalVenta, totalPagado);

    if (totalPago > saldo) {
      return {
        success: false,
        error: `El abono no puede superar el saldo pendiente (${saldo.toFixed(2)}).`,
      };
    }

    const credito = await getPrisma().credito.create({
      data: {
        idventa,
        fecha: new Date(),
        total_pago: totalPago,
      },
    });

    revalidatePath(CREDITOS_PATH);
    return { success: true, data: mapCredito(credito) };
  } catch {
    return { success: false, error: "No se pudo registrar el abono." };
  }
}
