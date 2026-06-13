export type UsuarioEstado = "1" | "0";

export interface MenuPermisos {
  mnu_almacen: number;
  mnu_compras: number;
  mnu_ventas: number;
  mnu_mantenimiento: number;
  mnu_seguridad: number;
  mnu_admin: number;
}

export type MenuPermisoKey = keyof MenuPermisos;

export interface Empleado {
  idempleado: number;
  nombre: string;
  apellidos: string;
  tipo_documento: string;
  num_documento: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  foto: string | null;
  estado: UsuarioEstado;
}

export interface EmpleadoInput {
  nombre: string;
  apellidos: string;
  tipo_documento: string;
  num_documento: string;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  foto?: string | null;
  estado?: UsuarioEstado;
}

export interface EmpleadoListado extends Empleado {
  login?: string | null;
}

export interface Usuario extends MenuPermisos {
  idusuario: number;
  idempleado: number;
  idsucursal: number;
  login: string;
  tipo: string;
  estado: UsuarioEstado;
  empleado: Empleado;
}

export interface UsuarioInput extends MenuPermisos {
  idempleado?: number;
  idsucursal: number;
  login: string;
  clave: string;
  tipo: string;
  estado?: UsuarioEstado;
  empleado?: EmpleadoInput;
}

export interface UsuarioPublic extends MenuPermisos {
  idusuario: number;
  idempleado: number;
  idsucursal: number;
  login: string;
  tipo: string;
  estado: UsuarioEstado;
}

export interface AuthSession {
  usuario: UsuarioPublic;
  empleado: Empleado;
  idsucursal: number;
  sucursalNombre: string;
}

export interface LoginResult {
  success: boolean;
  data?: AuthSession;
  error?: string;
  usingMockData?: boolean;
}

export function getEmpleadoNombreCompleto(empleado: Empleado): string {
  return `${empleado.nombre} ${empleado.apellidos}`.trim();
}

export function getEmpleadoApellidosNombres(empleado: Empleado): string {
  return `${empleado.apellidos}, ${empleado.nombre}`.trim();
}

export function isUsuarioActivo(estado: string): boolean {
  return estado === "1";
}

export function hasMenuPermiso(
  usuario: Pick<UsuarioPublic, MenuPermisoKey>,
  permiso: MenuPermisoKey
): boolean {
  if (usuario.mnu_admin === 1) return true;
  return usuario[permiso] === 1;
}

export function toUsuarioPublic(
  usuario: Omit<Usuario, "empleado"> & { empleado?: Empleado }
): UsuarioPublic {
  return {
    idusuario: usuario.idusuario,
    idempleado: usuario.idempleado,
    idsucursal: usuario.idsucursal,
    login: usuario.login,
    tipo: usuario.tipo,
    estado: usuario.estado,
    mnu_almacen: usuario.mnu_almacen,
    mnu_compras: usuario.mnu_compras,
    mnu_ventas: usuario.mnu_ventas,
    mnu_mantenimiento: usuario.mnu_mantenimiento,
    mnu_seguridad: usuario.mnu_seguridad,
    mnu_admin: usuario.mnu_admin,
  };
}
