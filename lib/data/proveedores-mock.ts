import type { Proveedor } from "@/lib/types/persona";

export const PROVEEDORES_MOCK: Proveedor[] = [
  {
    idpersona: 1,
    tipo_persona: "Proveedor",
    nombre: "Distribuidora Nacional S.A.C.",
    tipo_documento: "RUC",
    num_documento: "20111222333",
    direccion: "Av. Industrial 500, Lima",
    telefono: "01-555-1000",
    email: "ventas@distnacional.com",
    estado: "1",
  },
  {
    idpersona: 2,
    tipo_persona: "Proveedor",
    nombre: "Comercial Pérez E.I.R.L.",
    tipo_documento: "RUC",
    num_documento: "20444555666",
    direccion: "Jr. Comercio 120, Callao",
    telefono: "01-555-2000",
    email: "compras@perez.com",
    estado: "1",
  },
  {
    idpersona: 3,
    tipo_persona: "Proveedor",
    nombre: "Juan Carlos Vega",
    tipo_documento: "DNI",
    num_documento: "87654321",
    direccion: "Calle Los Olivos 45",
    telefono: "01-555-3000",
    email: null,
    estado: "1",
  },
];

export function getProveedoresMockActivos(): Proveedor[] {
  return PROVEEDORES_MOCK.filter((p) => p.estado === "1");
}
