export const MAX_ARTICULO_IMAGEN_BYTES = 1_500_000;

export const ARTICULO_IMAGEN_TIPOS = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type ArticuloImagenMime = (typeof ARTICULO_IMAGEN_TIPOS)[number];

export function esImagenArticuloValida(file: File): string | null {
  if (!ARTICULO_IMAGEN_TIPOS.includes(file.type as ArticuloImagenMime)) {
    return "Solo se permiten imágenes JPG, PNG, WebP o GIF.";
  }

  if (file.size > MAX_ARTICULO_IMAGEN_BYTES) {
    return "La imagen no debe superar 1,5 MB.";
  }

  return null;
}

export function leerImagenComoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("No se pudo leer la imagen seleccionada."));
    };

    reader.onerror = () => {
      reject(new Error("Error al cargar la imagen."));
    };

    reader.readAsDataURL(file);
  });
}

export function esDataUrlImagen(valor: string): boolean {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(valor);
}

export function normalizarImagenArticulo(imagen?: string | null): string | null {
  const trimmed = imagen?.trim();
  if (!trimmed) return null;

  if (esDataUrlImagen(trimmed)) {
    if (trimmed.length > 3_000_000) {
      throw new Error("IMAGEN_DEMASIADO_GRANDE");
    }
    return trimmed;
  }

  return trimmed;
}

export function obtenerSrcImagenArticulo(imagen: string | null | undefined): string | null {
  if (!imagen?.trim()) return null;
  return imagen.trim();
}
