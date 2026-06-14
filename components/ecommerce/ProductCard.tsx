"use client";

import Image from "next/image";
import { Package, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/ecommerce/CartProvider";
import { formatMoneda } from "@/lib/format-moneda";
import { normalizarTipoIva } from "@/lib/types/factura-ticket";
import type { ProductoEcommerce } from "@/lib/types/ecommerce";

type ProductCardProps = {
  producto: ProductoEcommerce;
};

export default function ProductCard({ producto }: ProductCardProps) {
  const { addItem } = useCart();
  const sinStock = producto.stock_actual < 1;

  const handleAgregar = () => {
    if (sinStock) return;

    addItem({
      idarticulo: producto.idarticulo,
      iddetalle_ingreso: producto.iddetalle_ingreso,
      nombre: producto.nombre,
      precio: producto.precio_ventapublico,
      stock_max: producto.stock_actual,
      tipo_iva: normalizarTipoIva(producto.tipo_iva),
      categoria: producto.categoria.nombre,
      imagen: producto.imagen,
    });
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
        {producto.imagen ? (
          <Image
            src={producto.imagen}
            alt={producto.nombre}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center">
          <Package className="h-12 w-12 text-slate-400/80" aria-hidden />
        </div>

        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold ${
            sinStock
              ? "bg-rose-100 text-rose-700"
              : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {sinStock ? "Sin stock" : `Stock: ${producto.stock_actual}`}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          {producto.categoria.nombre}
        </p>
        <h3 className="mt-1 line-clamp-2 text-base font-bold text-slate-900">
          {producto.nombre}
        </h3>
        {producto.descripcion && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-500">
            {producto.descripcion}
          </p>
        )}

        <div className="mt-auto pt-4">
          <p className="text-xl font-black text-slate-900">
            {formatMoneda(producto.precio_ventapublico)}
          </p>
          <button
            type="button"
            onClick={handleAgregar}
            disabled={sinStock}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            <ShoppingCart className="h-4 w-4" />
            {sinStock ? "No disponible" : "Agregar al carrito"}
          </button>
        </div>
      </div>
    </article>
  );
}
