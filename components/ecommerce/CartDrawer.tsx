"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/components/ecommerce/CartProvider";
import { formatMoneda } from "@/lib/format-moneda";

export default function CartDrawer() {
  const {
    items,
    itemCount,
    subtotalFormateado,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
  } = useCart();

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar carrito"
          onClick={closeCart}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
        />
      )}

      <aside
        id="carrito-lateral"
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className={`fixed right-0 top-0 z-[60] flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-indigo-600" aria-hidden />
            <h2 className="text-lg font-bold text-slate-900">Tu carrito</h2>
            {itemCount > 0 && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">
                {itemCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Cerrar panel del carrito"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <ShoppingBag className="h-12 w-12 text-slate-300" aria-hidden />
              <p className="text-sm text-slate-500">
                Tu carrito está vacío. Explorá el catálogo de serigrafía.
              </p>
              <button
                type="button"
                onClick={closeCart}
                className="text-sm font-semibold text-indigo-700 hover:text-indigo-800"
              >
                Seguir comprando
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.iddetalle_ingreso}
                  className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-200 to-slate-300">
                    {item.imagen ? (
                      <Image
                        src={item.imagen}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="64px"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs font-bold text-slate-500">
                        FC
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.nombre}
                    </p>
                    <p className="text-xs text-slate-500">{item.categoria}</p>
                    <p className="mt-1 text-sm font-bold text-indigo-700">
                      {formatMoneda(item.precio)}
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.iddetalle_ingreso,
                              item.cantidad - 1
                            )
                          }
                          className="inline-flex h-8 w-8 items-center justify-center text-slate-600 hover:bg-slate-50"
                          aria-label={`Reducir cantidad de ${item.nombre}`}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.iddetalle_ingreso,
                              item.cantidad + 1
                            )
                          }
                          disabled={item.cantidad >= item.stock_max}
                          className="inline-flex h-8 w-8 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                          aria-label={`Aumentar cantidad de ${item.nombre}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.iddetalle_ingreso)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50"
                        aria-label={`Quitar ${item.nombre} del carrito`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-slate-200 px-5 py-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-600">Subtotal</span>
              <span className="text-lg font-bold text-slate-900">
                {subtotalFormateado}
              </span>
            </div>
            <Link
              href="/carrito"
              onClick={closeCart}
              className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
            >
              Ir al checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
