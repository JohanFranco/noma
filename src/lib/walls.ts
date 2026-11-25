import type { Opening, Wall } from '../data/lumen';
import { H } from '../data/lumen';

export interface Piece {
  /** distancia inicial y final a lo largo del muro */
  s0: number;
  s1: number;
  y0: number;
  y1: number;
  kind: 'solid' | 'glass';
}

export function wallFrame(w: Wall) {
  const dx = w.b[0] - w.a[0];
  const dz = w.b[1] - w.a[1];
  const len = Math.hypot(dx, dz);
  const ux = dx / len;
  const uz = dz / len;
  return { len, ux, uz, angle: Math.atan2(-dz, dx) };
}

/** Divide un muro en piezas sólidas (con dinteles y antepechos) y vidrios. */
export function wallPieces(w: Wall): Piece[] {
  const { len } = wallFrame(w);
  const ops = [...(w.openings ?? [])].sort((a, b) => a.from - b.from);
  const pieces: Piece[] = [];
  let cursor = 0;
  for (const o of ops) {
    if (o.from > cursor) pieces.push({ s0: cursor, s1: o.from, y0: 0, y1: H, kind: 'solid' });
    const bottom = o.bottom ?? 0;
    const top = o.top ?? H;
    if (bottom > 0) pieces.push({ s0: o.from, s1: o.to, y0: 0, y1: bottom, kind: 'solid' });
    if (top < H) pieces.push({ s0: o.from, s1: o.to, y0: top, y1: H, kind: 'solid' });
    if (o.glass) pieces.push({ s0: o.from, s1: o.to, y0: bottom, y1: top, kind: 'glass' });
    cursor = o.to;
  }
  if (cursor < len) pieces.push({ s0: cursor, s1: len, y0: 0, y1: H, kind: 'solid' });
  return pieces;
}

/** Segmentos de muro a nivel de piso (para el plano): sólidos y vanos. */
export function planSegments(w: Wall) {
  const { len, ux, uz } = wallFrame(w);
  const at = (s: number): [number, number] => [w.a[0] + ux * s, w.a[1] + uz * s];
  const ops = [...(w.openings ?? [])].sort((a, b) => a.from - b.from);
  const solids: [[number, number], [number, number]][] = [];
  const openings: { o: Opening; p0: [number, number]; p1: [number, number] }[] = [];
  let cursor = 0;
  for (const o of ops) {
    if (o.from > cursor) solids.push([at(cursor), at(o.from)]);
    // los vanos con antepecho (ventanas) siguen siendo muro en planta
    openings.push({ o, p0: at(o.from), p1: at(o.to) });
    cursor = o.to;
  }
  if (cursor < len) solids.push([at(cursor), at(len)]);
  return { solids, openings, ux, uz };
}
