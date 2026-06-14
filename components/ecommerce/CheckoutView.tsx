"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import FabriColorLoader from "@/components/ui/FabriColorLoader";
import { useCart } from "@/components/ecommerce/CartProvider";
import {
  ensureClienteWeb,
  registrarPedidoWeb,
} from "@/lib/actions/ecommerce";
import { formatMoneda } from "@/lib/format-moneda";
import {
  DEPARTAMENTOS_PARAGUAY,
  WEB_SUCURSAL_MATRIZ,
  WEB_USUARIO_SISTEMA,
} from "@/lib/ecommerce/cart-types";
import type { ResultadoPedidoWeb } from "@/lib/types/ecommerce";

type CheckoutFormState = {
  nombre: string;
  tipo_documento: "RUC" | "CI";
  num_documento: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  departamento: string;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

export default function CheckoutView() {
  const { items, subtotalFormateado, clearCart, isHydrated } = useCart();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoPedidoWeb | null>(null);
  const [form, setForm] = useState<CheckoutFormState>({
    nombre: "",
    tipo_documento: "RUC",
    num_documento: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    departamento: DEPARTAMENTOS_PARAGUAY[0],
  });

  if (!isHydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <FabriColorLoader size={44} label="Inicializando carrito" />
      </div>
    );
  }

  if (resultado) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-8 text-center shadow-lg sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" aria-hidden />
          </div>
          <h1 className="mt-5 text-2xl font-black text-slate-900 sm:text-3xl">
            ¡Pedido confirmado!
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Número de pedido:{" "}
            <span className="font-bold text-emerald-700">#{resultado.idpedido}</span>
          </p>
          <p className="mt-4 text-base leading-relaxed text-slate-700">
            Tu pedido quedó en estado{" "}
            <strong className="text-indigo-700">Pendiente</strong>. Nos pondremos en
            contacto contigo para coordinar el pago y envío por transportadora.
          </p>
          <p className="mt-4 text-lg font-bold text-slate-900">
            Total: {formatMoneda(resultado.total)}
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-500"
          >
            Volver a la tienda
          </Link>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Tu carrito está vacío</h1>
        <p className="mt-2 text-sm text-slate-500">
          Agregá productos desde el catálogo antes de confirmar el pedido.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Ir al catálogo
        </Link>
      </section>
    );
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const direccionCompleta = [
        form.direccion.trim(),
        form.ciudad.trim(),
        form.departamento,
      ]
        .filter(Boolean)
        .join(", ");

      const clienteResult = await ensureClienteWeb({
        nombre: form.nombre,
        tipo_documento: form.tipo_documento,
        num_documento: form.num_documento,
        telefono: form.telefono,
        direccion: direccionCompleta,
      });

      if (!clienteResult.success || !clienteResult.data) {
        setError(clienteResult.error ?? "No se pudieron guardar los datos del cliente.");
        return;
      }

      const pedidoResult = await registrarPedidoWeb({
        idcliente: clienteResult.data.idcliente,
        idsucursal: WEB_SUCURSAL_MATRIZ,
        idusuario: WEB_USUARIO_SISTEMA,
        detalles: items.map((item) => ({
          iddetalle_ingreso: item.iddetalle_ingreso,
          cantidad: item.cantidad,
          precio_venta: item.precio,
          tipo_iva: item.tipo_iva,
        })),
      });

      if (!pedidoResult.success || !pedidoResult.data) {
        setError(pedidoResult.error ?? "No se pudo registrar el pedido.");
        return;
      }

      clearCart();
      setResultado(pedidoResult.data);
    });
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Seguir comprando
      </Link>

      <h1 className="mt-4 text-2xl font-black text-slate-900 sm:text-3xl">
        Finalizar pedido
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Completá tus datos para coordinar pago y envío en Paraguay.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-3"
        >
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <User className="h-5 w-5 text-indigo-600" />
            Datos del cliente
          </h2>

          <div>
            <label htmlFor="nombre" className="mb-1.5 block text-sm font-medium text-slate-700">
              Nombre / Razón Social *
            </label>
            <input
              id="nombre"
              required
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className={inputClassName}
              placeholder="Ej. Serigráfica del Sur S.A."
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tipo_documento" className="mb-1.5 block text-sm font-medium text-slate-700">
                Tipo de documento *
              </label>
              <select
                id="tipo_documento"
                value={form.tipo_documento}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    tipo_documento: e.target.value as "RUC" | "CI",
                  }))
                }
                className={inputClassName}
                disabled={isPending}
              >
                <option value="RUC">RUC</option>
                <option value="CI">Cédula de Identidad</option>
              </select>
            </div>
            <div>
              <label htmlFor="num_documento" className="mb-1.5 block text-sm font-medium text-slate-700">
                RUC o Cédula *
              </label>
              <input
                id="num_documento"
                required
                value={form.num_documento}
                onChange={(e) =>
                  setForm((f) => ({ ...f, num_documento: e.target.value }))
                }
                className={inputClassName}
                placeholder="Ej. 80012345-6"
                disabled={isPending}
              />
            </div>
          </div>

          <div>
            <label htmlFor="telefono" className="mb-1.5 block text-sm font-medium text-slate-700">
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                Teléfono *
              </span>
            </label>
            <input
              id="telefono"
              required
              type="tel"
              value={form.telefono}
              onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              className={inputClassName}
              placeholder="Ej. 0981 123 456"
              disabled={isPending}
            />
          </div>

          <h2 className="flex items-center gap-2 pt-2 text-lg font-bold text-slate-900">
            <MapPin className="h-5 w-5 text-indigo-600" />
            Envío
          </h2>

          <div>
            <label htmlFor="direccion" className="mb-1.5 block text-sm font-medium text-slate-700">
              Dirección de envío *
            </label>
            <input
              id="direccion"
              required
              value={form.direccion}
              onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
              className={inputClassName}
              placeholder="Calle, número, barrio"
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ciudad" className="mb-1.5 block text-sm font-medium text-slate-700">
                Ciudad *
              </label>
              <input
                id="ciudad"
                required
                value={form.ciudad}
                onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value }))}
                className={inputClassName}
                placeholder="Ej. Fernando de la Mora"
                disabled={isPending}
              />
            </div>
            <div>
              <label htmlFor="departamento" className="mb-1.5 block text-sm font-medium text-slate-700">
                Departamento *
              </label>
              <select
                id="departamento"
                required
                value={form.departamento}
                onChange={(e) =>
                  setForm((f) => ({ ...f, departamento: e.target.value }))
                }
                className={inputClassName}
                disabled={isPending}
              >
                {DEPARTAMENTOS_PARAGUAY.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Image
                  src="/logo-light.png"
                  alt=""
                  width={72}
                  height={18}
                  className="h-[18px] w-auto animate-pulse"
                  aria-hidden
                />
                Procesando pedido...
              </>
            ) : (
              "Confirmar Pedido Web"
            )}
          </button>
        </form>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2 lg:h-fit">
          <h2 className="text-lg font-bold text-slate-900">Resumen</h2>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li
                key={item.iddetalle_ingreso}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-800">{item.nombre}</p>
                  <p className="text-slate-500">Cant. {item.cantidad}</p>
                </div>
                <p className="shrink-0 font-semibold text-slate-900">
                  {formatMoneda(item.precio * item.cantidad)}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="font-medium text-slate-600">Subtotal</span>
            <span className="text-xl font-black text-slate-900">
              {subtotalFormateado}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            El IVA y total final se calculan al confirmar según tipo de producto
            (10%, 5% o Exenta).
          </p>
        </aside>
      </div>
    </section>
  );
}
