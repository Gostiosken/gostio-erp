"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { ImagePlus, Upload, X } from "lucide-react";
import {
  esImagenArticuloValida,
  leerImagenComoDataUrl,
  obtenerSrcImagenArticulo,
} from "@/lib/utils/articulo-imagen";

type ArticuloImagenUploadProps = {
  value: string | null | undefined;
  onChange: (imagen: string | null) => void;
  disabled?: boolean;
};

export default function ArticuloImagenUpload({
  value,
  onChange,
  disabled = false,
}: ArticuloImagenUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const previewSrc = obtenerSrcImagenArticulo(value);

  const procesarArchivo = useCallback(
    async (file: File) => {
      const validacion = esImagenArticuloValida(file);
      if (validacion) {
        setError(validacion);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const dataUrl = await leerImagenComoDataUrl(file);
        onChange(dataUrl);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se pudo procesar la imagen."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [onChange]
  );

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await procesarArchivo(file);
    event.target.value = "";
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled || isLoading) return;

    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await procesarArchivo(file);
  };

  return (
    <div className="space-y-3">
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed p-4 transition ${
          isDragging
            ? "border-indigo-400 bg-indigo-50/80"
            : "border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/30"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={disabled || isLoading}
          onChange={handleFileChange}
          aria-label="Subir imagen del artículo"
        />

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {previewSrc ? (
              <Image
                src={previewSrc}
                alt="Vista previa del artículo"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                <ImagePlus className="h-8 w-8" aria-hidden />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-sm font-semibold text-slate-800">
              Imagen del producto
            </p>
            <p className="mt-1 text-xs text-slate-500">
              JPG, PNG, WebP o GIF · máximo 1,5 MB
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <button
                type="button"
                disabled={disabled || isLoading}
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {isLoading ? "Procesando..." : "Subir desde dispositivo"}
              </button>
              {previewSrc && (
                <button
                  type="button"
                  disabled={disabled || isLoading}
                  onClick={() => {
                    onChange(null);
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                  Quitar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
