import Image from "next/image";

type FabriColorLoaderProps = {
  /** Altura visual del isotipo/logotipo en píxeles. */
  size?: number;
  /** `dark` para fondos claros, `light` para fondos oscuros. */
  variant?: "dark" | "light";
  label?: string;
  className?: string;
};

const LOGO_SOURCES = {
  dark: "/logo-dark.png",
  light: "/logo-light.png",
} as const;

/** Indicador de carga con isotipo FabriColor y parpadeo suave. */
export default function FabriColorLoader({
  size = 40,
  variant = "dark",
  label = "Cargando",
  className = "",
}: FabriColorLoaderProps) {
  const aspectWidth = Math.round(size * 4.5);

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Image
        src={LOGO_SOURCES[variant]}
        alt=""
        width={aspectWidth}
        height={size}
        className="h-auto w-auto animate-pulse"
        style={{ height: size, width: "auto", maxWidth: aspectWidth }}
        priority
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
