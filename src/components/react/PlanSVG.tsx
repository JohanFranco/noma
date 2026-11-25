import { useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react';
import type { PlanRoom } from '../../data/properties';
import type { Wall } from '../../data/lumen';
import { planSegments } from '../../lib/walls';
import { img } from '../../lib/img';

export interface Viewer { x: number; z: number; yaw: number }

interface Props {
  rooms: PlanRoom[];
  walls?: Wall[];
  glassFront?: { z: number; from: number; to: number; mullionEvery: number };
  activeId?: string | null;
  /** id de grupo: varias formas pueden pertenecer al mismo espacio navegable */
  groupOf?: (roomId: string) => string;
  onSelect?: (id: string) => void;
  viewer?: RefObject<Viewer | null>;
  compact?: boolean;
  preview?: boolean;
  actionLabel?: string;
  className?: string;
  title?: string;
}

const S = 40;
const PAD = 44;

export default function PlanSVG({
  rooms, walls, glassFront, activeId, groupOf = (id) => id, onSelect, viewer,
  compact = false, preview = true, actionLabel, className = '', title = 'Plano arquitectónico',
}: Props) {
  const uid = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const coneRef = useRef<SVGGElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [drawn, setDrawn] = useState(false);

  const b = useMemo(() => {
    const xs = rooms.flatMap((r) => [r.rect[0], r.rect[0] + r.rect[2]]);
    const zs = rooms.flatMap((r) => [r.rect[1], r.rect[1] + r.rect[3]]);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
  }, [rooms]);
  const W = (b.maxX - b.minX) * S + PAD * 2;
  const Hh = (b.maxZ - b.minZ) * S + PAD * 2;
  const X = (x: number) => (x - b.minX) * S + PAD;
  const Y = (z: number) => (b.maxZ - z) * S + PAD;

  // Dibujo del plano al entrar en pantalla
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setDrawn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setDrawn(true); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Cono de visión sincronizado con la cámara del recorrido
  useEffect(() => {
    if (!viewer) return;
    let raf = 0;
    const tick = () => {
      const v = viewer.current;
      const g = coneRef.current;
      if (v && g) {
        const deg = (Math.atan2(Math.cos(v.yaw), -Math.sin(v.yaw)) * 180) / Math.PI;
        g.setAttribute('transform', `translate(${X(v.x)} ${Y(v.z)}) rotate(${deg})`);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  });

  const segs = useMemo(() => (walls ?? []).map((w) => ({ w, ...planSegments(w) })), [walls]);
  const hovered = rooms.find((r) => r.id === hover);
  const activeGroup = activeId ?? null;

  let drawIndex = 0;
  const drawStyle = () => ({ transitionDelay: `${(drawIndex++ % 40) * 45}ms` });

  return (
    <div className={`plan relative ${className}`} data-drawn={drawn} onPointerLeave={() => setHover(null)}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${Hh}`} className="block h-auto w-full" role="group" aria-labelledby={`${uid}-t`}>
        <title id={`${uid}-t`}>{title}</title>
        <defs>
          <pattern id={`${uid}-hatch`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="currentColor" strokeOpacity="0.14" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Habitaciones (zonas seleccionables) */}
        {rooms.map((r) => {
          const [x, z, w, d] = r.rect;
          const group = groupOf(r.id);
          const isActive = activeGroup === group;
          const isHover = hover ? groupOf(hover) === group : false;
          const interactive = Boolean(onSelect) || preview;
          return (
            <g
              key={r.id}
              className="plan-room"
              data-active={isActive}
              data-hover={isHover}
              role={onSelect ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={onSelect ? `${r.name}. ${actionLabel ?? 'Seleccionar'}` : interactive ? `${r.name}. ${r.note}` : undefined}
              aria-pressed={onSelect ? isActive : undefined}
              onPointerEnter={() => setHover(r.id)}
              onFocus={() => setHover(r.id)}
              onBlur={() => setHover(null)}
              onClick={() => onSelect?.(group)}
              onKeyDown={(e) => {
                if (onSelect && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelect(group); }
              }}
              style={{ cursor: onSelect ? 'pointer' : 'default' }}
            >
              <rect x={X(x)} y={Y(z + d)} width={w * S} height={d * S} className="plan-fill" fill={r.outdoor ? `url(#${uid}-hatch)` : 'transparent'} />
              <rect x={X(x)} y={Y(z + d)} width={w * S} height={d * S} className="plan-hl" />
              {!walls && (
                <rect x={X(x)} y={Y(z + d)} width={w * S} height={d * S} className="plan-stroke draw" fill="none" strokeWidth={r.outdoor ? 1.5 : 5} strokeDasharray={r.outdoor ? '6 6' : undefined} pathLength={1} style={drawStyle()} />
              )}
              {!compact && (r.id !== 'estudio-b') && (
                <text x={X(x + w / 2)} y={Y(z + d / 2)} className="plan-label" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: Math.min(15, (w * S * 0.86) / (r.name.length * 0.52)) }}>
                  {r.name}
                </text>
              )}
            </g>
          );
        })}

        {/* Muros reales (Lumen) */}
        {segs.map(({ w, solids, openings, ux, uz }, i) => (
          <g key={i} className="plan-walls" pointerEvents="none">
            {solids.map(([p0, p1], j) => (
              <line key={j} x1={X(p0[0])} y1={Y(p0[1])} x2={X(p1[0])} y2={Y(p1[1])} strokeWidth={w.t * S} className="plan-stroke draw" pathLength={1} style={drawStyle()} />
            ))}
            {openings.map(({ o, p0, p1 }, j) => {
              const width = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
              if (o.glass) {
                return (
                  <g key={j}>
                    <line x1={X(p0[0])} y1={Y(p0[1])} x2={X(p1[0])} y2={Y(p1[1])} strokeWidth={w.t * S} className="plan-glass-bg" />
                    <line x1={X(p0[0])} y1={Y(p0[1])} x2={X(p1[0])} y2={Y(p1[1])} strokeWidth={1.4} className="plan-thin draw" pathLength={1} style={drawStyle()} />
                  </g>
                );
              }
              if (o.door === 'swing' || o.door === 'closed') {
                const nx = -uz * (o.side ?? 1), nz = ux * (o.side ?? 1);
                const leaf: [number, number] = [p0[0] + nx * width, p0[1] + nz * width];
                const sweep = (nx * uz - nz * ux) > 0 ? 1 : 0;
                return (
                  <g key={j} className="plan-door">
                    <line x1={X(p0[0])} y1={Y(p0[1])} x2={X(leaf[0])} y2={Y(leaf[1])} strokeWidth={2} className="plan-thin draw" pathLength={1} style={drawStyle()} />
                    <path d={`M ${X(leaf[0])} ${Y(leaf[1])} A ${width * S} ${width * S} 0 0 ${sweep} ${X(p1[0])} ${Y(p1[1])}`} fill="none" strokeWidth={1} strokeDasharray="3 4" className="plan-thin" />
                  </g>
                );
              }
              if (o.door === 'elevator') {
                return (
                  <g key={j}>
                    <rect x={X(p0[0])} y={Y(p0[1] + 1.6)} width={width * S} height={1.6 * S} fill="none" strokeWidth={1.4} className="plan-thin" />
                    <line x1={X(p0[0])} y1={Y(p0[1] + 1.6)} x2={X(p1[0])} y2={Y(p0[1])} strokeWidth={1} className="plan-thin" />
                    <line x1={X(p1[0])} y1={Y(p0[1] + 1.6)} x2={X(p0[0])} y2={Y(p0[1])} strokeWidth={1} className="plan-thin" />
                  </g>
                );
              }
              return null;
            })}
          </g>
        ))}

        {glassFront && (
          <g pointerEvents="none">
            <line x1={X(glassFront.from)} y1={Y(glassFront.z)} x2={X(glassFront.to)} y2={Y(glassFront.z)} strokeWidth={3} className="plan-thin draw" pathLength={1} style={drawStyle()} />
            {Array.from({ length: Math.floor((glassFront.to - glassFront.from) / glassFront.mullionEvery) + 1 }, (_, k) => (
              <rect key={k} x={X(glassFront.from + k * glassFront.mullionEvery) - 4} y={Y(glassFront.z) - 4} width={8} height={8} className="plan-mullion" />
            ))}
          </g>
        )}

        {viewer && (
          <g ref={coneRef} pointerEvents="none" className="plan-viewer">
            <path d="M0 0 L120 -62 A136 136 0 0 1 120 62 Z" className="plan-cone" />
            <circle r="9" className="plan-dot" />
          </g>
        )}

        {/* Norte */}
        {!compact && (
          <g transform={`translate(${W - 22} 22)`} pointerEvents="none" className="plan-north">
            <circle r="14" fill="none" strokeWidth="1" className="plan-thin" />
            <path d="M0 -10 L4.5 5 L0 1.5 L-4.5 5 Z" className="plan-north-arrow" />
          </g>
        )}
      </svg>

      {preview && hovered && !compact && (
        <div
          className="plan-preview pointer-events-none absolute z-10 w-56 overflow-hidden rounded-[2px] bg-papel text-pizarra shadow-[0_30px_60px_-20px_rgba(14,23,29,0.45)]"
          style={{
            left: `${Math.min(Math.max((X(hovered.rect[0] + hovered.rect[2] / 2) / W) * 100, 16), 84)}%`,
            top: `${(Y(hovered.rect[1] + hovered.rect[3] / 2) / Hh) * 100}%`,
          }}
          aria-hidden="true"
        >
          {hovered.photo && (
            <img src={img(hovered.photo, 480, 300)} alt="" className="aspect-[16/10] w-full object-cover" loading="lazy" />
          )}
          <div className="grid gap-1 p-4">
            <p className="font-display text-2xl leading-none">{hovered.name}</p>
            <p className="text-sm leading-snug text-grafito">{hovered.note}</p>
            {onSelect && <p className="mt-1 text-sm text-laton">{actionLabel ?? 'Seleccionar'}</p>}
            {hovered.photo && <p className="text-[0.7rem] text-grafito/70">Fotografía de referencia</p>}
          </div>
        </div>
      )}
    </div>
  );
}
