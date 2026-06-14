"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/ecommerce/ProductCard";
import StoreBanner from "@/components/ecommerce/StoreBanner";
import {
  FILTROS_CATEGORIA,
  filtrarProductosPorCategoria,
  type CategoriaFiltroTienda,
} from "@/lib/ecommerce/cart-types";
import type { ProductoEcommerce } from "@/lib/types/ecommerce";

type TiendaViewProps = {
  productos: ProductoEcommerce[];
  error?: string;
  usingMockData?: boolean;
};

export default function TiendaView({
  productos,
  error,
  usingMockData,
}: TiendaViewProps) {
  const [filtro, setFiltro] = useState<CategoriaFiltroTienda>("todos");

  const productosFiltrados = useMemo(
    () => filtrarProductosPorCategoria(productos, filtro),
    [productos, filtro]
  );

  return (
    <>
      <StoreBanner />

      <section id="catalogo" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Catálogo</h2>
            <p className="mt-1 text-sm text-slate-500">
              Productos disponibles para compra web con stock en tiempo real.
            </p>
          </div>

          {usingMockData && (
            <span className="inline-flex w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800 ring-1 ring-indigo-200">
              Modo demostración
            </span>
          )}
        </div>

        <div
          className="mt-6 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Filtrar por categoría"
        >
          {FILTROS_CATEGORIA.map((item) => {
            const activo = filtro === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={activo}
                onClick={() => setFiltro(item.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activo
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {item.etiqueta}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {productosFiltrados.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-base font-semibold text-slate-700">
              No hay productos en esta categoría
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Probá otro filtro o volvé más tarde.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {productosFiltrados.map((producto) => (
              <ProductCard key={producto.idarticulo} producto={producto} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
