import { Factory, Paintbrush, Palette, Sparkles } from "lucide-react";

export default function StoreBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white">
      <div className="absolute inset-0 opacity-25">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-indigo-500 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-indigo-600 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-200">
              <Sparkles className="h-3.5 w-3.5" />
              FabriColor · Proveedor líder
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              <span className="text-white">Fabri</span>
              <span className="text-indigo-400">Color</span>
              <span className="mt-2 block text-2xl font-bold text-slate-200 sm:text-3xl lg:text-4xl">
                Insumos para serigrafía, tintas textiles y maquinaria industrial
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Distribuidor especializado en tintas plastisol y base agua, vinilos
              textiles, plotters y equipos profesionales. Stock en tiempo real desde
              nuestro almacén matriz en Paraguay.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <Palette className="h-6 w-6 text-indigo-400" aria-hidden />
              <p className="mt-3 text-sm font-bold">Tintas textiles</p>
              <p className="mt-1 text-xs text-slate-400">
                Plastisol, base agua y formulaciones de alta cobertura.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <Paintbrush className="h-6 w-6 text-indigo-400" aria-hidden />
              <p className="mt-3 text-sm font-bold">Vinilos y transfer</p>
              <p className="mt-1 text-xs text-slate-400">
                PU flex, termotransferibles y materiales de corte.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur sm:col-span-3 lg:col-span-1 xl:col-span-1">
              <Factory className="h-6 w-6 text-indigo-400" aria-hidden />
              <p className="mt-3 text-sm font-bold">Maquinaria industrial</p>
              <p className="mt-1 text-xs text-slate-400">
                Plotters, mesas serigráficas y equipos de producción.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
