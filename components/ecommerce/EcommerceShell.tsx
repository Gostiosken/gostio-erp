"use client";

import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard, LogIn, Menu, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/ecommerce/CartProvider";
import CartDrawer from "@/components/ecommerce/CartDrawer";

export default function EcommerceShell({ children }: { children: React.ReactNode }) {
  const { itemCount, toggleCart } = useCart();
  const { session } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex shrink-0 transition-transform duration-300 ease-out hover:scale-105"
            aria-label="FabriColor — Inicio"
          >
            <Image
              src="/logo-dark.png"
              alt="FabriColor"
              width={180}
              height={40}
              priority
              className="h-10 w-auto"
            />
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <Link
              href="/#catalogo"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Catálogo
            </Link>
            {session ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <LayoutDashboard className="h-4 w-4" />
                FabriColor ERP
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <LogIn className="h-4 w-4" />
                Acceso ERP
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleCart}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600"
              aria-label={`Abrir carrito${itemCount > 0 ? `, ${itemCount} artículos` : ""}`}
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 md:hidden"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-slate-100 px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              <Link
                href="/#catalogo"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Catálogo
              </Link>
              {session ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  FabriColor ERP
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <LogIn className="h-4 w-4" />
                  Acceso ERP
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <Image
              src="/logo-light.png"
              alt="FabriColor"
              width={160}
              height={36}
              className="h-9 w-auto"
            />
            <p className="mt-3 text-sm text-slate-400">
              Proveedor líder de insumos para serigrafía y maquinaria industrial en
              Paraguay.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/login" className="hover:text-white">
              FabriColor ERP
            </Link>
            <Link href="/ventas/nueva" className="hover:text-white">
              Punto de venta
            </Link>
          </div>
        </div>
      </footer>

      <CartDrawer />
    </div>
  );
}
