import type { Cliente } from "@/lib/types/persona";

export const CLIENTES_MOCK: Cliente[] = [
  {
    idpersona: 101,
    tipo_persona: "Cliente",
    nombre: "Comercial Los Andes S.A.C.",
    tipo_documento: "RUC",
    num_documento: "20555666777",
    direccion: "Av. Javier Prado 890, San Isidro",
    telefono: "01-555-4000",
    email: "compras@losandes.com",
    estado: "1",
  },
  {
    idpersona: 102,
    tipo_persona: "Cliente",
    nombre: "Bodega El Progreso",
    tipo_documento: "RUC",
    num_documento: "20199888777",
    direccion: "Mercado Central, Puesto 12",
    telefono: "01-555-4100",
    email: null,
    estado: "1",
  },
  {
    idpersona: 103,
    tipo_persona: "Cliente",
    nombre: "María Elena Quispe",
    tipo_documento: "DNI",
    num_documento: "44556677",
    direccion: "Calle Las Palmeras 234",
    telefono: "987654321",
    email: "maria.quispe@email.com",
    estado: "1",
  },
];

export function getClientesMockActivos(): Cliente[] {
  return CLIENTES_MOCK.filter((cliente) => cliente.estado === "1");
}

let mockClienteWebCounter = 200;

/** Resuelve o registra un cliente web en modo demostración. */
export function obtenerOCrearClienteWebMock(
  input: Pick<Cliente, "nombre" | "tipo_documento" | "num_documento" | "direccion" | "telefono" | "email">
): Cliente {
  const documento = input.num_documento.trim();
  const existente = CLIENTES_MOCK.find(
    (cliente) =>
      cliente.tipo_persona === "Cliente" && cliente.num_documento === documento
  );

  if (existente) {
    existente.nombre = input.nombre.trim();
    existente.tipo_documento = input.tipo_documento;
    existente.direccion = input.direccion?.trim() || null;
    existente.telefono = input.telefono?.trim() || null;
    existente.email = input.email?.trim() || null;
    return existente;
  }

  mockClienteWebCounter += 1;
  const nuevo: Cliente = {
    idpersona: mockClienteWebCounter,
    tipo_persona: "Cliente",
    nombre: input.nombre.trim(),
    tipo_documento: input.tipo_documento,
    num_documento: documento,
    direccion: input.direccion?.trim() || null,
    telefono: input.telefono?.trim() || null,
    email: input.email?.trim() || null,
    estado: "1",
  };

  CLIENTES_MOCK.push(nuevo);
  return nuevo;
}
