/**
 * Fotografías de stock con licencia Unsplash, servidas desde su CDN con
 * recorte, formato moderno (AVIF/WebP) y calidad ajustada por tamaño.
 */
const BASE = 'https://images.unsplash.com/photo-';

export function img(id: string, w = 1600, h?: number, q = 72): string {
  const params = new URLSearchParams({ auto: 'format', fit: 'crop', w: String(w), q: String(q) });
  if (h) params.set('h', String(h));
  return `${BASE}${id}?${params.toString()}`;
}

/** srcset responsivo con relación de aspecto opcional (ancho/alto). */
export function srcset(id: string, widths = [480, 800, 1200, 1600, 2200], ratio?: number, q = 70): string {
  return widths
    .map((w) => `${img(id, w, ratio ? Math.round(w / ratio) : undefined, q)} ${w}w`)
    .join(', ');
}
