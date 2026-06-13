"use client";

import Image from "next/image";

type EmpleadoAvatarProps = {
  nombre: string;
  apellidos: string;
  foto?: string | null;
  size?: number;
};

function resolveFotoSrc(foto?: string | null): string | null {
  if (!foto?.trim()) return null;
  const value = foto.trim();
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return value.startsWith("/") ? value : `/${value}`;
}

function getIniciales(nombre: string, apellidos: string): string {
  const partes = `${apellidos} ${nombre}`.trim().split(/\s+/);
  return partes
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");
}

export default function EmpleadoAvatar({
  nombre,
  apellidos,
  foto,
  size = 40,
}: EmpleadoAvatarProps) {
  const src = resolveFotoSrc(foto);
  const label = `${apellidos}, ${nombre}`.trim();

  if (src) {
    return (
      <Image
        src={src}
        alt={`Foto de ${nombre} ${apellidos}`}
        width={size}
        height={size}
        unoptimized
        className="rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-slate-200"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full border-2 border-white bg-indigo-100 text-xs font-bold text-indigo-700 shadow-sm ring-1 ring-indigo-200"
      style={{ width: size, height: size }}
      title={label}
      aria-label={label}
    >
      {getIniciales(nombre, apellidos)}
    </div>
  );
}
