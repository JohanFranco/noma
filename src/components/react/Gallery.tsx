import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import type { Photo } from '../../data/properties';
import { img, srcset } from '../../lib/img';

/**
 * Galería horizontal: se arrastra con el puntero (con inercia), con la rueda,
 * con los botones o con el teclado. Cada foto abre un visor a pantalla completa.
 */
export default function Gallery({ photos, name }: { photos: Photo[]; name: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const drag = useRef({ down: false, x: 0, scroll: 0, moved: 0, v: 0, lastX: 0, lastT: 0 });

  const onScroll = () => {
    const t = trackRef.current;
    if (!t) return;
    setProgress(t.scrollLeft / Math.max(1, t.scrollWidth - t.clientWidth));
  };

  const scrollByCard = (dir: 1 | -1) => {
    const t = trackRef.current;
    if (!t) return;
    const card = t.querySelector<HTMLElement>('[data-card]');
    const step = (card?.offsetWidth ?? 600) + 24;
    t.scrollTo({ left: t.scrollLeft + dir * step, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  // Arrastre con inercia (solo ratón; en táctil se usa el scroll nativo)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !trackRef.current) return;
    const d = drag.current;
    gsap.killTweensOf(trackRef.current);
    Object.assign(d, { down: true, x: e.clientX, scroll: trackRef.current.scrollLeft, moved: 0, v: 0, lastX: e.clientX, lastT: performance.now() });
  };
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      const t = trackRef.current;
      if (!d.down || !t) return;
      const dx = e.clientX - d.x;
      d.moved = Math.max(d.moved, Math.abs(dx));
      t.scrollLeft = d.scroll - dx;
      const now = performance.now();
      d.v = (e.clientX - d.lastX) / Math.max(1, now - d.lastT);
      d.lastX = e.clientX; d.lastT = now;
      if (d.moved > 4) t.dataset.dragging = 'true';
    };
    const up = () => {
      const d = drag.current;
      const t = trackRef.current;
      if (!d.down || !t) return;
      d.down = false;
      setTimeout(() => { if (t) t.dataset.dragging = 'false'; }, 0);
      if (Math.abs(d.v) > 0.1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.to(t, { scrollLeft: t.scrollLeft - d.v * 420, duration: 1.2, ease: 'expo.out' });
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, []);

  // Visor
  const close = useCallback(() => setOpen(null), []);
  useEffect(() => {
    if (open === null) return;
    window.dispatchEvent(new Event('noma:scroll-lock'));
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') setOpen((o) => (o === null ? o : (o + 1) % photos.length));
      if (e.key === 'ArrowLeft') setOpen((o) => (o === null ? o : (o - 1 + photos.length) % photos.length));
    };
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('keydown', key); window.dispatchEvent(new Event('noma:scroll-unlock')); };
  }, [open === null, close, photos.length]);

  return (
    <div className="gallery">
      <div className="wrap mb-8 flex items-end justify-between gap-6">
        <p className="num text-sm text-bruma">{photos.length} fotografías. Arrastra o usa las flechas.</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => scrollByCard(-1)} className="grid h-12 w-12 place-items-center rounded-full ring-1 ring-papel/30 transition hover:bg-papel hover:text-pizarra" aria-label="Fotografía anterior">
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true"><path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
          </button>
          <button type="button" onClick={() => scrollByCard(1)} className="grid h-12 w-12 place-items-center rounded-full ring-1 ring-papel/30 transition hover:bg-papel hover:text-pizarra" aria-label="Fotografía siguiente">
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        className="gallery-track no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto px-[clamp(1.25rem,4vw,4rem)] pb-2 md:snap-none"
        tabIndex={0}
        role="region"
        aria-label={`Galería de ${name}`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); scrollByCard(1); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); scrollByCard(-1); }
        }}
      >
        {photos.map((p, i) => (
          <figure key={p.id} data-card className={`m-0 shrink-0 snap-start ${i % 3 === 1 ? 'w-[72vw] md:w-[30vw]' : 'w-[86vw] md:w-[46vw]'}`}>
            <button
              type="button"
              className="group relative block w-full overflow-hidden bg-grafito"
              onClick={(e) => { if (trackRef.current?.dataset.dragging === 'true') { e.preventDefault(); return; } setOpen(i); }}
              aria-label={`Ampliar: ${p.caption}`}
            >
              <img
                src={img(p.id, 1200)}
                srcSet={srcset(p.id, [600, 900, 1300, 1800], i % 3 === 1 ? 0.8 : 1.45)}
                sizes="(min-width:768px) 46vw, 86vw"
                alt={p.alt}
                loading="lazy"
                draggable={false}
                className={`w-full object-cover transition-transform duration-[1.4s] ease-[var(--ease-expo)] group-hover:scale-[1.03] ${i % 3 === 1 ? 'aspect-[4/5]' : 'aspect-[16/11]'}`}
              />
            </button>
            <figcaption className="mt-3 flex justify-between gap-4 text-sm text-bruma">
              <span>{p.caption}</span>
              <span className="num">{i + 1}/{photos.length}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="wrap mt-8" aria-hidden="true">
        <div className="h-px bg-papel/15"><div className="h-px origin-left bg-laton transition-transform duration-300" style={{ transform: `scaleX(${Math.max(0.06, progress)})` }} /></div>
      </div>

      {open !== null && <Lightbox photos={photos} index={open} setIndex={setOpen} onClose={close} />}
    </div>
  );
}

function Lightbox({ photos, index, setIndex, onClose }: { photos: Photo[]; index: number; setIndex: (n: number) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const p = photos[index];

  useEffect(() => {
    closeRef.current?.focus();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(ref.current, { clipPath: 'circle(0% at 0% 100%)' }, { clipPath: 'circle(142% at 0% 100%)', duration: 0.9, ease: 'power3.inOut' });
  }, []);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(imgRef.current, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'expo.out' });
  }, [index]);

  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label={p.caption} className="fixed inset-0 z-[80] flex flex-col bg-noche/97 text-papel"
      onKeyDown={(e) => {
        if (e.key !== 'Tab') return;
        const f = ref.current?.querySelectorAll<HTMLElement>('button');
        if (!f?.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }}>
      <div className="wrap flex h-20 shrink-0 items-center justify-between">
        <p className="num text-sm text-bruma">{index + 1} de {photos.length}</p>
        <button ref={closeRef} type="button" onClick={onClose} className="link-line text-sm">Cerrar</button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 md:px-24">
        <img ref={imgRef} key={p.id} src={img(p.id, 2200)} alt={p.alt} className="max-h-full max-w-full object-contain" />
        <button type="button" onClick={() => setIndex((index - 1 + photos.length) % photos.length)} className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-noche/60 ring-1 ring-papel/30 md:left-8" aria-label="Fotografía anterior">
          <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true"><path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
        </button>
        <button type="button" onClick={() => setIndex((index + 1) % photos.length)} className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-noche/60 ring-1 ring-papel/30 md:right-8" aria-label="Fotografía siguiente">
          <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
        </button>
      </div>
      <p className="wrap py-6 text-center font-display text-2xl">{p.caption}</p>
    </div>
  );
}
