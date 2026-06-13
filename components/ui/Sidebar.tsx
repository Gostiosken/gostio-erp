"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getEmpleadoNombreCompleto,
  hasMenuPermiso,
  type MenuPermisoKey,
} from "@/lib/types/usuario";

type NavItem = {
  label: string;
  href: string;
  permission: MenuPermisoKey;
  icon: React.ReactNode;
};

const DASHBOARD_ITEM: NavItem = {
  label: "Panel de Control",
  href: "/",
  permission: "mnu_admin",
  icon: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-10h8V3h-8v8Z" />
    </svg>
  ),
};

const MANTENIMIENTO_ITEMS: NavItem[] = [
  {
    label: "Configuración General",
    href: "/mantenimiento/configuracion",
    permission: "mnu_mantenimiento",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.51 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 5 15.09a1.7 1.7 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.51-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.51 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.07.5.07 1 0 1.51a1.7 1.7 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" />
      </svg>
    ),
  },
  {
    label: "Empleados",
    href: "/mantenimiento/empleados",
    permission: "mnu_mantenimiento",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Usuarios",
    href: "/mantenimiento/usuarios",
    permission: "mnu_seguridad",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path d="M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
        <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
        <rect x="16" y="3" width="5" height="5" rx="1" />
      </svg>
    ),
  },
  {
    label: "Gestión de Sucursales",
    href: "/mantenimiento/sucursales",
    permission: "mnu_mantenimiento",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    label: "Tipos de Documentos",
    href: "/mantenimiento/documentos",
    permission: "mnu_mantenimiento",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path d="M7 3h10v18H7V3Zm2 4h6M9 11h6M9 15h4" />
      </svg>
    ),
  },
  {
    label: "Categorías",
    href: "/mantenimiento/categorias",
    permission: "mnu_mantenimiento",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path d="M4 7h16M4 12h16M4 17h10" />
      </svg>
    ),
  },
  {
    label: "Parámetros de Timbrado",
    href: "/mantenimiento/timbrados",
    permission: "mnu_mantenimiento",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path d="M7 3h10v4H7V3Zm0 6h10v12H7V9Zm3 3h4M10 15h4" />
      </svg>
    ),
  },
  {
    label: "Unidades de Medida",
    href: "/mantenimiento/unidades",
    permission: "mnu_mantenimiento",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path d="M12 3v18M3 12h18" />
        <rect x="7" y="7" width="10" height="10" rx="1" />
      </svg>
    ),
  },
];

const ALMACEN_ITEMS: NavItem[] = [
  {
    label: "Artículos / Almacén",
    href: "/almacen/articulos",
    permission: "mnu_almacen",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
      </svg>
    ),
  },
];

const COMPRAS_ITEMS: NavItem[] = [
  {
    label: "Proveedores",
    href: "/compras/proveedores",
    permission: "mnu_compras",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Registro de Compras",
    href: "/compras/nuevo",
    permission: "mnu_compras",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M12 18v-6M9 15h6" />
      </svg>
    ),
  },
];

const VENTAS_ITEMS: NavItem[] = [
  {
    label: "Clientes",
    href: "/ventas/clientes",
    permission: "mnu_ventas",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    label: "Nueva Venta",
    href: "/ventas/nueva",
    permission: "mnu_ventas",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    label: "Cuentas por Cobrar",
    href: "/ventas/creditos",
    permission: "mnu_ventas",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
];

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = isActiveRoute(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition md:py-2.5 ${
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span className={active ? "text-white" : "text-slate-400"}>{item.icon}</span>
      {item.label}
    </Link>
  );
}

function filterItemsByPermiso(
  items: NavItem[],
  usuario: ReturnType<typeof useAuth>["session"]
): NavItem[] {
  if (!usuario) return [];
  return items.filter((item) => hasMenuPermiso(usuario.usuario, item.permission));
}

export default function Sidebar({
  mobileOpen = false,
  onMobileClose,
}: {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAuth();

  if (!session) return null;

  const mantenimientoVisible = filterItemsByPermiso(MANTENIMIENTO_ITEMS, session);
  const almacenVisible = filterItemsByPermiso(ALMACEN_ITEMS, session);
  const comprasVisible = filterItemsByPermiso(COMPRAS_ITEMS, session);
  const ventasVisible = filterItemsByPermiso(VENTAS_ITEMS, session);

  function handleNavigate() {
    onMobileClose?.();
  }

  function handleLogout() {
    onMobileClose?.();
    logout();
    router.replace("/login");
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-700 bg-slate-900 text-white transition-transform duration-300 ease-in-out md:static md:z-auto md:w-64 md:max-w-none md:shrink-0 md:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="border-b border-slate-700 px-5 py-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
              Gostio-ERP
            </p>
            <h1 className="mt-1 text-lg font-bold">Panel Principal</h1>
            <p className="mt-1 text-xs text-slate-400">Paraguay · IVA 10%</p>
          </div>
          <button
            type="button"
            onClick={onMobileClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white md:hidden"
            aria-label="Cerrar menú"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {(hasMenuPermiso(session.usuario, "mnu_admin") ||
          hasMenuPermiso(session.usuario, "mnu_ventas") ||
          hasMenuPermiso(session.usuario, "mnu_compras") ||
          hasMenuPermiso(session.usuario, "mnu_almacen") ||
          hasMenuPermiso(session.usuario, "mnu_mantenimiento")) && (
          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Inicio
            </p>
            <div className="space-y-1">
              <NavLink item={DASHBOARD_ITEM} pathname={pathname} onNavigate={handleNavigate} />
            </div>
          </div>
        )}

        {mantenimientoVisible.length > 0 && (
          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Mantenimiento
            </p>
            <div className="space-y-1">
              {mantenimientoVisible.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} onNavigate={handleNavigate} />
              ))}
            </div>
          </div>
        )}

        {almacenVisible.length > 0 && (
          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Almacén
            </p>
            <div className="space-y-1">
              {almacenVisible.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} onNavigate={handleNavigate} />
              ))}
            </div>
          </div>
        )}

        {comprasVisible.length > 0 && (
          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Compras / Ingresos
            </p>
            <div className="space-y-1">
              {comprasVisible.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} onNavigate={handleNavigate} />
              ))}
            </div>
          </div>
        )}

        {ventasVisible.length > 0 && (
          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ventas / Facturación
            </p>
            <div className="space-y-1">
              {ventasVisible.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} onNavigate={handleNavigate} />
              ))}
            </div>
          </div>
        )}

        {mantenimientoVisible.length === 0 &&
          almacenVisible.length === 0 &&
          comprasVisible.length === 0 &&
          ventasVisible.length === 0 && (
          <p className="px-3 text-sm text-slate-400">
            No tiene permisos de menú asignados.
          </p>
        )}
      </nav>

      <div className="border-t border-slate-700 px-4 py-4">
        <div className="rounded-xl bg-slate-800/80 px-3 py-3">
          <p className="truncate text-sm font-semibold text-white">
            {getEmpleadoNombreCompleto(session.empleado)}
          </p>
          <p className="mt-0.5 text-xs text-indigo-300">{session.usuario.tipo}</p>
          <p className="mt-2 truncate text-xs text-slate-400">
            {session.sucursalNombre}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 w-full rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-red-400 hover:bg-red-950/40 hover:text-red-200"
          >
            Cerrar Sesión
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-slate-500">Gostio-ERP · Paraguay</p>
      </div>
    </aside>
  );
}
