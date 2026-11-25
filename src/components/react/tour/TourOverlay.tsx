import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { rooms, roomById, walls, glassFront, planShapes, type RoomId, type Hotspot } from '../../../data/lumen';
import PlanSVG, { type Viewer } from '../PlanSVG';
import { img } from '../../../lib/img';

const Scene = lazy(() => import('./Scene'));

export type TourMode = '3d' | 'foto';

interface Props {
  startRoom: RoomId;
  intro: boolean;
  mode: TourMode;
  onClose: () => void;
}

const planRooms = planShapes.map((s) => ({ id: s.id, name: s.name, rect: s.rect, note: `${s.area} m²`, photo: roomById[s.room].photo, outdoor: s.outdoor }));
const groupOf = (id: string) => planShapes.find((s) => s.id === id)?.room ?? id;

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

export default function TourOverlay({ startRoom, intro, mode: initialMode, onClose }: Props) {
  const reduced = typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [mode, setMode] = useState<TourMode>(() => (initialMode === '3d' && !hasWebGL() ? 'foto' : initialMode));
  const [quality, setQuality] = useState<'alta' | 'ligera'>(() => {
    const lowCores = (navigator.hardwareConcurrency || 8) <= 4;
    const coarse = matchMedia('(pointer: coarse)').matches;
    const lowMem = ((navigator as any).deviceMemory ?? 8) <= 4;
    return coarse || lowCores || lowMem ? 'ligera' : 'alta';
  });
  const [room, setRoom] = useState<RoomId>(startRoom);
  const [arrived, setArrived] = useState<RoomId | null>(null);
  const [moving, setMoving] = useState(false);
  const [night, setNight] = useState(false);
  const [hotspot, setHotspot] = useState<Hotspot | null>(null);
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState(true);
  const [planOpen, setPlanOpen] = useState(() => matchMedia('(min-width: 1024px)').matches);
  const viewer = useRef<Viewer | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement[]>([]);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const prevFocus = useRef<Element | null>(null);
  const clockInit = useRef(true);

  // Apertura cinematográfica: barras de formato panorámico que se abren
  useEffect(() => {
    prevFocus.current = document.activeElement;
    window.dispatchEvent(new Event('noma:scroll-lock'));
    closeRef.current?.focus({ preventScroll: true });
    if (!reduced) {
      gsap.fromTo(rootRef.current, { clipPath: 'inset(50% 0% 50% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power4.inOut' });
    }
    return () => {
      window.dispatchEvent(new Event('noma:scroll-unlock'));
      (prevFocus.current as HTMLElement | null)?.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (!ready || reduced) return;
    gsap.fromTo(barsRef.current, { scaleY: 1 }, { scaleY: 0, duration: 1.6, ease: 'expo.inOut', delay: 0.2 });
  }, [ready]);

  const close = useCallback(() => {
    if (reduced) { onClose(); return; }
    gsap.timeline({ onComplete: onClose })
      .to(barsRef.current, { scaleY: 1, duration: 0.7, ease: 'expo.inOut' })
      .to(rootRef.current, { clipPath: 'inset(50% 0% 50% 0%)', duration: 0.7, ease: 'power4.inOut' }, '-=0.25');
  }, [onClose, reduced]);

  // Teclado: Escape cierra (o cierra la ficha abierta); Tab queda dentro del diálogo
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); if (hotspot) setHotspot(null); else close(); }
      if (e.key === 'Tab' && rootRef.current) {
        const f = [...rootRef.current.querySelectorAll<HTMLElement>('button, [tabindex="0"], a[href]')].filter((el) => el.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [hotspot, close]);

  // Título de la habitación al llegar
  useEffect(() => {
    if (!arrived || !titleRef.current || reduced) return;
    gsap.fromTo(titleRef.current.querySelectorAll('[data-t]'), { yPercent: 110 }, { yPercent: 0, stagger: 0.07, duration: 1, ease: 'expo.out' });
  }, [arrived]);

  // Reloj de la transición día/noche
  useEffect(() => {
    const el = clockRef.current;
    if (!el) return;
    if (clockInit.current) { clockInit.current = false; return; }
    const o = { m: night ? 17 * 60 + 40 : 21 * 60 + 30 };
    const to = night ? 21 * 60 + 30 : 17 * 60 + 40;
    const fmt = () => { const h = Math.floor(o.m / 60), m = Math.floor(o.m % 60); el.textContent = `${h}:${String(m).padStart(2, '0')}`; };
    if (reduced) { o.m = to; fmt(); return; }
    const t = gsap.to(o, { m: to, duration: 2.6, ease: 'power2.inOut', onUpdate: fmt });
    return () => { t.kill(); };
  }, [night]);

  const fade = useCallback((mid: () => void) => {
    const el = fadeRef.current;
    if (!el || reduced) { mid(); return; }
    gsap.timeline().to(el, { opacity: 1, duration: 0.45, ease: 'power2.in' }).add(mid).to(el, { opacity: 0, duration: 0.7, ease: 'power2.out' }, '+=0.1');
  }, [reduced]);

  const go = useCallback((id: RoomId) => {
    setHotspot(null);
    setHint(false);
    setRoom(id);
    if (mode === 'foto') setArrived(id);
  }, [mode]);

  const current = roomById[arrived ?? room];
  const isNight = night && mode === '3d';

  return (
    <div ref={rootRef} role="dialog" aria-modal="true" aria-label="Recorrido virtual del Ático Lumen" className="tour fixed inset-0 z-[90] overflow-hidden bg-noche text-papel" data-night={isNight}>
      {/* Escena */}
      <div className="absolute inset-0">
        {mode === '3d' ? (
          <Suspense fallback={null}>
            <Scene
              room={room}
              night={night}
              intro={intro}
              quality={quality}
              reduced={reduced}
              activeHotspot={hotspot?.id ?? null}
              viewer={viewer}
              fade={fade}
              onArrive={(id) => { setArrived(id); setMoving(false); }}
              onMoveStart={() => setMoving(true)}
              onHotspot={(h) => { setHotspot(h); setHint(false); }}
              onNavigate={go}
              onReady={() => setReady(true)}
              onQualityDrop={() => setQuality('ligera')}
            />
          </Suspense>
        ) : (
          <PhotoTour room={room} reduced={reduced} viewer={viewer} onReady={() => { setReady(true); setArrived(room); }} />
        )}
      </div>

      {/* Fundido para cortes y barras cinematográficas */}
      <div ref={fadeRef} className="pointer-events-none absolute inset-0 bg-noche opacity-0" aria-hidden="true" />
      <div aria-hidden="true">
        <div ref={(el) => { if (el) barsRef.current[0] = el; }} className="pointer-events-none absolute inset-x-0 top-0 h-1/2 origin-top bg-noche" />
        <div ref={(el) => { if (el) barsRef.current[1] = el; }} className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 origin-bottom bg-noche" />
      </div>

      {/* Cargando */}
      {!ready && (
        <div className="absolute inset-0 grid place-items-center" role="status">
          <div className="grid justify-items-center gap-5 text-center">
            <svg viewBox="0 0 40 40" className="tour-loader h-14 w-14 text-laton-claro" aria-hidden="true">
              <path className="door-symbol" d="M2 2H38V38H33M7 38H2V2M7 38V12" />
              <path className="door-symbol tour-loader-arc" d="M7 12A26 26 0 0 1 33 38" />
            </svg>
            <p className="text-sm text-bruma">{mode === '3d' ? 'Preparando la maqueta 3D' : 'Cargando fotografías'}</p>
          </div>
        </div>
      )}

      {/* Barra superior */}
      <div className="tour-ui pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-noche/70 to-transparent">
        <div className="flex flex-col-reverse gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 md:p-6">
          <div ref={titleRef} className="min-w-0">
            <p className="overflow-hidden text-sm text-papel/70"><span data-t className="block">Ático Lumen, {mode === '3d' ? 'maqueta 3D interactiva' : 'recorrido fotográfico'}</span></p>
            <p className="overflow-hidden font-display text-[clamp(2rem,4.5vw,3.6rem)] leading-[1.02]" aria-live="polite">
              <span data-t className="block">{current.name}</span>
            </p>
            <p className="num overflow-hidden text-sm text-papel/70"><span data-t className="block">{current.area} m²{moving ? ', en movimiento' : ''}</span></p>
          </div>
          <div className="pointer-events-auto flex shrink-0 flex-wrap items-center justify-end gap-2 self-end sm:self-auto">
            {mode === '3d' && (
              <button type="button" onClick={() => setNight((n) => !n)} aria-pressed={night} className="tour-btn" aria-label={night ? 'Cambiar a vista de día' : 'Cambiar a vista de noche'}>
                <span className="tour-daynight" data-night={night} aria-hidden="true"><span /></span>
                <span className="num" ref={clockRef}>17:40</span>
                <span className="hidden sm:inline">{night ? 'Noche' : 'Día'}</span>
              </button>
            )}
            <button ref={closeRef} type="button" onClick={close} className="tour-btn">
              Salir del recorrido
              <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Ficha del punto de interés: no detiene la exploración */}
      {hotspot && <HotspotCard h={hotspot} onClose={() => setHotspot(null)} reduced={reduced} />}

      {/* Ayuda inicial */}
      {ready && hint && arrived && mode === '3d' && (
        <div className="tour-hint pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-noche/70 px-5 py-3 text-center text-sm backdrop-blur" aria-hidden="true">
          Arrastra para mirar alrededor. Toca los puntos para ver detalles.
        </div>
      )}

      {/* Barra inferior: habitaciones, plano y modo */}
      <div className="tour-ui absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-noche/85 via-noche/40 to-transparent">
        <div className="flex flex-col-reverse gap-3 p-4 md:flex-row md:items-end md:justify-between md:p-6">
          <nav aria-label="Espacios del departamento" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
            {rooms.map((r) => (
              <button key={r.id} type="button" onClick={() => go(r.id)} aria-current={r.id === room ? 'true' : undefined} className="tour-room shrink-0">
                {r.name}
              </button>
            ))}
          </nav>
          <div className="flex items-end justify-between gap-3 md:justify-end">
            <div className="flex flex-wrap gap-2">
              <button type="button" className="tour-btn !text-xs" onClick={() => { setReady(false); setArrived(null); setMode((m) => (m === '3d' ? 'foto' : '3d')); }}>
                {mode === '3d' ? 'Versión fotográfica ligera' : 'Volver a la maqueta 3D'}
              </button>
              {mode === '3d' && (
                <button type="button" className="tour-btn !text-xs" aria-pressed={quality === 'alta'} onClick={() => setQuality((q) => (q === 'alta' ? 'ligera' : 'alta'))}>
                  Calidad {quality}
                </button>
              )}
            </div>
            <button type="button" className="tour-btn md:hidden" aria-expanded={planOpen} aria-controls="tour-plan" onClick={() => setPlanOpen((o) => !o)}>Plano</button>
          </div>
        </div>
      </div>

      {/* Minimapa sincronizado */}
      <div id="tour-plan" className={`tour-plan absolute right-4 top-48 z-20 w-[min(86vw,330px)] sm:top-28 rounded-[3px] bg-noche/75 p-3 text-papel/85 backdrop-blur-md transition-[opacity,transform] duration-500 md:right-6 md:top-32 ${planOpen ? 'opacity-100' : 'pointer-events-none -translate-y-2 opacity-0 md:pointer-events-auto md:translate-y-0 md:opacity-100'}`}>
        <div className="mb-2 flex items-center justify-between text-xs text-papel/70">
          <span>Plano, nivel 32</span>
          <span>Toca un espacio para ir</span>
        </div>
        <PlanSVG
          rooms={planRooms}
          walls={walls}
          glassFront={glassFront}
          activeId={room}
          groupOf={groupOf}
          onSelect={(id) => go(id as RoomId)}
          viewer={viewer}
          compact
          preview={false}
          actionLabel="Ir a este espacio"
          title="Plano del Ático Lumen, sincronizado con el recorrido"
        />
      </div>
    </div>
  );
}

function HotspotCard({ h, onClose, reduced }: { h: Hotspot; onClose: () => void; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduced) return;
    gsap.fromTo(ref.current, { clipPath: 'circle(0% at 0% 100%)', y: 12 }, { clipPath: 'circle(150% at 0% 100%)', y: 0, duration: 0.8, ease: 'power3.inOut' });
  }, [h.id]);
  return (
    <div ref={ref} className="absolute bottom-40 left-4 z-30 w-[min(88vw,380px)] bg-papel p-6 text-pizarra shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] md:bottom-32 md:left-6" role="region" aria-label={`Detalle: ${h.title}`} aria-live="polite">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-musgo">{h.kind}</p>
        <button type="button" onClick={onClose} className="-m-2 p-2 text-sm text-grafito hover:text-pizarra" aria-label="Cerrar detalle">
          <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" /></svg>
        </button>
      </div>
      <p className="mt-2 font-display text-3xl leading-none">{h.title}</p>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-grafito">{h.text}</p>
    </div>
  );
}

/* Versión ligera: fotografías de referencia por espacio, con desplazamiento lateral */
function PhotoTour({ room, reduced, viewer, onReady }: { room: RoomId; reduced: boolean; viewer: React.MutableRefObject<Viewer | null>; onReady: () => void }) {
  const r = roomById[room];
  const imgRef = useRef<HTMLImageElement>(null);
  const pan = useRef({ x: 0, down: false, lx: 0 });

  useEffect(() => {
    viewer.current = { x: r.cam[0], z: r.cam[2], yaw: r.yaw };
    pan.current.x = 0;
    const el = imgRef.current;
    if (!el) return;
    const done = () => {
      onReady();
      if (!reduced) gsap.fromTo(el, { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1.04, duration: 1.4, ease: 'expo.out' });
    };
    if (el.complete) done(); else el.addEventListener('load', done, { once: true });
  }, [room]);

  const onDown = (e: React.PointerEvent) => { pan.current.down = true; pan.current.lx = e.clientX; };
  const onMove = (e: React.PointerEvent) => {
    const p = pan.current;
    if (!p.down || !imgRef.current) return;
    p.x = Math.max(-6, Math.min(6, p.x + (e.clientX - p.lx) * 0.03));
    p.lx = e.clientX;
    imgRef.current.style.transform = `scale(1.04) translateX(${p.x}%)`;
    viewer.current = { x: r.cam[0], z: r.cam[2], yaw: r.yaw - p.x * 0.05 };
  };
  const onUp = () => { pan.current.down = false; };

  return (
    <div className="absolute inset-0 cursor-grab touch-pan-y overflow-hidden active:cursor-grabbing" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}>
      <img ref={imgRef} key={r.id} src={img(r.photo, 2200)} alt={`Fotografía de referencia: ${r.name}`} className="h-full w-full scale-[1.04] object-cover" draggable={false} />
      <div className="absolute inset-0 bg-gradient-to-b from-noche/30 via-transparent to-noche/50" />
      <div className="absolute bottom-44 left-4 z-10 max-w-md rounded-[3px] bg-noche/70 p-5 text-sm backdrop-blur md:bottom-36 md:left-6">
        <p className="leading-relaxed text-papel/90">{r.summary}</p>
        <ul className="mt-4 grid gap-1.5 text-papel/75">
          {r.hotspots.map((h) => <li key={h.id}><span className="text-laton-claro">{h.kind}.</span> {h.title}</li>)}
        </ul>
        <p className="mt-4 text-xs text-papel/55">Fotografía de referencia. Los puntos interactivos y el modo noche están en la maqueta 3D.</p>
      </div>
    </div>
  );
}
