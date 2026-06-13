import type { Empleado, Usuario } from "@/lib/types/usuario";

export type UsuarioMockRecord = Usuario & { clave: string };

export const EMPLEADOS_MOCK: Empleado[] = [
  {
    idempleado: 1,
    nombre: "Administrador",
    apellidos: "Sistema",
    tipo_documento: "DNI",
    num_documento: "00000000",
    direccion: "Oficina Central",
    telefono: "01-555-0000",
    email: "admin@mi-erp.com",
    foto: null,
    estado: "1",
  },
  {
    idempleado: 2,
    nombre: "Lucía",
    apellidos: "Ramírez Torres",
    tipo_documento: "DNI",
    num_documento: "12345678",
    direccion: "Av. Principal 100",
    telefono: "01-555-0101",
    email: "lucia.ramirez@mi-erp.com",
    foto: null,
    estado: "1",
  },
];

export const USUARIOS_MOCK: UsuarioMockRecord[] = [
  {
    idusuario: 1,
    idempleado: 1,
    idsucursal: 1,
    login: "admin",
    clave: "admin",
    tipo: "Administrador",
    estado: "1",
    mnu_almacen: 1,
    mnu_compras: 1,
    mnu_ventas: 1,
    mnu_mantenimiento: 1,
    mnu_seguridad: 1,
    mnu_admin: 1,
    empleado: EMPLEADOS_MOCK[0],
  },
  {
    idusuario: 2,
    idempleado: 2,
    idsucursal: 2,
    login: "almacen",
    clave: "almacen",
    tipo: "Almacenero",
    estado: "1",
    mnu_almacen: 1,
    mnu_compras: 0,
    mnu_ventas: 0,
    mnu_mantenimiento: 0,
    mnu_seguridad: 0,
    mnu_admin: 0,
    empleado: EMPLEADOS_MOCK[1],
  },
];

export function findMockUsuarioByLogin(login: string): UsuarioMockRecord | undefined {
  return USUARIOS_MOCK.find(
    (usuario) =>
      usuario.login.toLowerCase() === login.toLowerCase() && usuario.estado === "1"
  );
}
