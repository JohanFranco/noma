import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { properties, cities, types, formatPrice, type Property } from '../../data/properties';
import { img, srcset } from '../../lib/img';

gsap.registerPlugin(Flip);

const PRICE_MIN = 15;
const PRICE_MAX = 95;
const AREA_MAX = 650;

type Sort = 'destacadas' | 'precio-asc' | 'precio-desc' | 'superficie';

interface Filters {
  cities: string[];
  types: string[];
  price: [number, number];
  area: number;
  beds: number;
  sort: Sort;
}

const DEFAULTS: Filters = { cities: [], types: [], price: [PRICE_MIN, PRICE_MAX], area: 0, beds: 0, sort: 'destacadas' };

function readURL(): Filters {
  if (typeof window === 'undefined') return DEFAULTS;
  const q = new URLSearchParams(location.search);
  const list = (k: string) => (q.get(k) ? q.get(k)!.split(',').filter(Boolean) : []);
  const num = (k: string, d: number) => (q.get(k) && !Number.isNaN(Number(q.get(k))) ? Number(q.get(k)) : d);
  return {
    cities: list('ciudad').filter((c) => cities.includes(c)),
    types: list('tipo').filter((t) => (types as string[]).includes(t)),
    price: [num('desde', PRICE_MIN), num('hasta', PRICE_MAX)],
    area: num('m2', 0),
    beds: num('recamaras', 0),
    sort: (q.get('orden') as Sort) || 'destacadas',
  };
}

function writeURL(f: Filters) {
  const q = new URLSearchParams();
  if (f.cities.length) q.set('ciudad', f.cities.join(','));
  if (f.types.length) q.set('tipo', f.types.join(','));
  if (f.price[0] !== PRICE_MIN) q.set('desde', String(f.price[0]));
  if (f.price[1] !== PRICE_MAX) q.set('hasta', String(f.price[1]));
  if (f.area) q.set('m2', String(f.area));
  if (f.beds) q.set('recamaras', String(f.beds));
  if (f.sort !== 'destacadas') q.set('orden', f.sort);
  const s = q.toString();
  history.replaceState(history.state, '', s ? `?${s}` : location.pathname);
}

const matches = (p: Property, f: Filters) =>
  (!f.cities.length || f.cities.includes(p.city)) &&
  (!f.types.length || f.types.includes(p.type)) &&
  p.price / 1e6 >= f.price[0] && p.price / 1e6 <= f.price[1] &&
  p.area >= f.area &&
  p.bedrooms >= f.beds;

const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export default function Explorer() {
  const [f, setF] = useState<Filters>(DEFAULTS);
  const [panelOpen, setPanelOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  // Lee filtros del URL tras hidratar (evita diferencias con el HTML del servidor)
  useEffect(() => { setF(readURL()); setPanelOpen(matchMedia('(min-width: 768px)').matches); }, []);

  const update = (patch: Partial<Filters>) => {
    if (listRef.current && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      flipState.current = Flip.getState(listRef.current.querySelectorAll('[data-item], [data-item-media]'));
    }
    setF((prev) => {
      const next = { ...prev, ...patch };
      writeURL(next);
      return next;
    });
  };

  const ordered = useMemo(() => {
    const visible = properties.filter((p) => matches(p, f));
    const sorted = [...visible];
    if (f.sort === 'precio-asc') sorted.sort((a, b) => a.price - b.price);
    if (f.sort === 'precio-desc') sorted.sort((a, b) => b.price - a.price);
    if (f.sort === 'superficie') sorted.sort((a, b) => b.area - a.area);
    return sorted;
  }, [f]);
  const orderOf = new Map(ordered.map((p, i) => [p.slug, i]));

  useLayoutEffect(() => {
    const state = flipState.current;
    if (!state || !listRef.current) return;
    flipState.current = null;
    Flip.from(state, {
      targets: listRef.current.querySelectorAll('[data-item], [data-item-media]'),
      duration: 0.9,
      ease: 'expo.inOut',
      nested: true,
      absolute: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', delay: 0.25 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.96, duration: 0.45, ease: 'power2.in' }),
    });
  }, [f]);

  // Al bajar por los resultados, el panel de filtros se pliega para liberar la vista
  const openedAt = useRef(0);
  useEffect(() => { if (panelOpen) openedAt.current = window.scrollY; }, [panelOpen]);
  useEffect(() => {
    if (!panelOpen) return;
    const onScroll = () => {
      const list = listRef.current;
      if (!list) return;
      const pastTop = list.getBoundingClientRect().top < 120;
      if (pastTop && Math.abs(window.scrollY - openedAt.current) > 160) setPanelOpen(false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [panelOpen]);

  // Seguidor del cursor sobre las imágenes
  useEffect(() => {
    const el = followerRef.current;
    if (!el || !matchMedia('(pointer: fine)').matches) return;
    const qx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'expo.out' });
    const qy = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'expo.out' });
    const move = (e: PointerEvent) => { qx(e.clientX); qy(e.clientY); };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, []);
  const showFollower = (on: boolean) => {
    const el = followerRef.current;
    if (!el) return;
    gsap.to(el, { scale: on ? 1 : 0, opacity: on ? 1 : 0, duration: 0.5, ease: 'expo.out' });
  };

  const active = f.cities.length + f.types.length + (f.price[0] !== PRICE_MIN || f.price[1] !== PRICE_MAX ? 1 : 0) + (f.area ? 1 : 0) + (f.beds ? 1 : 0);

  return (
    <div className="explorer">
      {/* ── Filtros ── */}
      <div className="sticky top-0 z-30 -mx-[clamp(1.25rem,4vw,4rem)] border-b border-pizarra/10 bg-caliza/90 px-[clamp(1.25rem,4vw,4rem)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 py-4">
          <p className="num text-sm" aria-live="polite">
            <span className="font-display text-3xl align-[-0.12em]">{ordered.length}</span> de {properties.length} residencias
          </p>
          <div className="flex items-center gap-3">
            <label className="hidden items-center gap-2 text-sm sm:flex">
              <span className="text-grafito/80">Ordenar</span>
              <select value={f.sort} onChange={(e) => update({ sort: e.target.value as Sort })} className="rounded-full bg-papel px-4 py-2 ring-1 ring-pizarra/15">
                <option value="destacadas">Destacadas</option>
                <option value="precio-asc">Precio, menor a mayor</option>
                <option value="precio-desc">Precio, mayor a menor</option>
                <option value="superficie">Mayor superficie</option>
              </select>
            </label>
            <button type="button" className="chip" aria-expanded={panelOpen} aria-controls="filtros" onClick={() => setPanelOpen((o) => !o)}>
              Filtros{active ? ` (${active})` : ''}
              <svg viewBox="0 0 12 12" className={`h-3 w-3 transition-transform duration-500 ${panelOpen ? 'rotate-180' : ''}`} aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
            </button>
          </div>
        </div>

        <div id="filtros" className={`filters-panel grid transition-[grid-template-rows] duration-700 ease-[var(--ease-door)] ${panelOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden" inert={!panelOpen}>
            <div className="grid gap-8 pb-8 pt-2 md:grid-cols-2 xl:grid-cols-[1.3fr_1.2fr_1fr_1fr_0.9fr]">
              <fieldset>
                <legend className="label mb-3">Ubicación</legend>
                <div className="flex flex-wrap gap-2">
                  {cities.map((c) => (
                    <button key={c} type="button" className="chip" aria-pressed={f.cities.includes(c)} onClick={() => update({ cities: toggle(f.cities, c) })}>{c}</button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="label mb-3">Tipo de propiedad</legend>
                <div className="flex flex-wrap gap-2">
                  {types.map((t) => (
                    <button key={t} type="button" className="chip" aria-pressed={f.types.includes(t)} onClick={() => update({ types: toggle(f.types, t) })}>{t}</button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="label mb-3">Precio en millones de pesos</legend>
                <div className="range-dual relative h-10">
                  <div className="absolute inset-x-0 top-1/2 h-px bg-pizarra/20" />
                  <div className="absolute top-1/2 h-[2px] -translate-y-[0.5px] bg-pizarra" style={{ left: `${((f.price[0] - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100}%`, right: `${100 - ((f.price[1] - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100}%` }} />
                  <input aria-label="Precio mínimo en millones" type="range" min={PRICE_MIN} max={PRICE_MAX} step={1} value={f.price[0]}
                    onChange={(e) => update({ price: [Math.min(Number(e.target.value), f.price[1] - 1), f.price[1]] })} />
                  <input aria-label="Precio máximo en millones" type="range" min={PRICE_MIN} max={PRICE_MAX} step={1} value={f.price[1]}
                    onChange={(e) => update({ price: [f.price[0], Math.max(Number(e.target.value), f.price[0] + 1)] })} />
                </div>
                <p className="num mt-1 text-sm text-grafito">${f.price[0]} a ${f.price[1]} millones</p>
              </fieldset>
              <fieldset>
                <legend className="label mb-3">Superficie mínima</legend>
                <div className="range-single relative h-10">
                  <input aria-label="Superficie mínima en metros cuadrados" type="range" min={0} max={AREA_MAX} step={10} value={f.area} onChange={(e) => update({ area: Number(e.target.value) })} />
                </div>
                <p className="num mt-1 text-sm text-grafito">{f.area ? `Desde ${f.area} m²` : 'Cualquier superficie'}</p>
              </fieldset>
              <fieldset>
                <legend className="label mb-3">Recámaras</legend>
                <div className="flex flex-wrap gap-2">
                  {[0, 2, 3, 4].map((n) => (
                    <button key={n} type="button" className="chip num !px-3.5" aria-pressed={f.beds === n} onClick={() => update({ beds: n })}>{n ? `${n}+` : 'Todas'}</button>
                  ))}
                </div>
              </fieldset>
            </div>
            <div className="flex items-center justify-between gap-4 pb-6">
              <label className="flex items-center gap-2 text-sm sm:hidden">
                <span className="text-grafito/80">Ordenar</span>
                <select value={f.sort} onChange={(e) => update({ sort: e.target.value as Sort })} className="rounded-full bg-papel px-3 py-2 ring-1 ring-pizarra/15">
                  <option value="destacadas">Destacadas</option>
                  <option value="precio-asc">Precio ascendente</option>
                  <option value="precio-desc">Precio descendente</option>
                  <option value="superficie">Superficie</option>
                </select>
              </label>
              {active > 0 && <button type="button" className="link-line text-sm" onClick={() => update({ ...DEFAULTS, sort: f.sort })}>Quitar filtros</button>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Resultados ── */}
      <div ref={listRef} className="flex flex-col gap-28 py-20 md:gap-40 md:py-28">
        {properties.map((p) => {
          const i = orderOf.get(p.slug);
          const visible = i !== undefined;
          const flip = visible && i! % 2 === 1;
          return (
            <article
              key={p.slug}
              data-item
              data-flip-id={p.slug}
              className="explorer-item grid items-end gap-8 md:grid-cols-12"
              style={{ order: i ?? 99, display: visible ? undefined : 'none' }}
              aria-hidden={!visible}
            >
              <a
                href={`/residencias/${p.slug}`}
                data-item-media
                data-flip-id={`m-${p.slug}`}
                className={`group relative block overflow-hidden bg-grafito md:col-span-7 ${flip ? 'md:order-2 md:col-start-6' : ''}`}
                onPointerEnter={() => showFollower(true)}
                onPointerLeave={() => showFollower(false)}
                aria-label={`Ver ${p.name}`}
                tabIndex={visible ? 0 : -1}
              >
                <div className="relative aspect-[4/3] md:aspect-[16/11]" style={{ viewTransitionName: visible ? `prop-${p.slug}` : undefined }}>
                  <img
                    src={img(p.cover.id, 1400)}
                    srcSet={srcset(p.cover.id, [600, 1000, 1400, 2000])}
                    sizes="(min-width:768px) 58vw, 92vw"
                    alt={p.cover.alt}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.6s] ease-[var(--ease-expo)] group-hover:scale-[1.04]"
                  />
                </div>
                {p.hasTour && (
                  <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-papel/90 px-3.5 py-1.5 text-sm text-pizarra backdrop-blur">
                    <svg viewBox="0 0 40 40" className="h-4 w-4" aria-hidden="true"><path className="door-symbol" d="M7 38V12M7 12A26 26 0 0 1 33 38" /></svg>
                    Recorrido virtual
                  </span>
                )}
              </a>
              <div className={`md:col-span-4 ${flip ? 'md:order-1 md:col-start-1' : 'md:col-start-9'}`}>
                <p className="label">{p.type} en {p.district}, {p.city}</p>
                <h2 className="display-m mt-3"><a href={`/residencias/${p.slug}`} tabIndex={visible ? 0 : -1} className="hover:text-grafito">{p.name}</a></h2>
                <p className="mt-5 max-w-[36ch] text-grafito">{p.tagline}</p>
                <dl className="num mt-8 grid grid-cols-3 gap-4 border-t border-pizarra/15 pt-5 text-sm">
                  <div><dt className="text-grafito/70">Superficie</dt><dd className="mt-1 text-base">{p.area} m²</dd></div>
                  <div><dt className="text-grafito/70">Recámaras</dt><dd className="mt-1 text-base">{p.bedrooms}</dd></div>
                  <div><dt className="text-grafito/70">Baños</dt><dd className="mt-1 text-base">{p.bathrooms}</dd></div>
                </dl>
                <p className="num mt-6 font-display text-3xl">{formatPrice(p.price)}</p>
              </div>
            </article>
          );
        })}

        {ordered.length === 0 && (
          <div className="grid min-h-[40vh] place-content-center gap-6 text-center">
            <p className="display-m">Ninguna residencia cumple estos filtros.</p>
            <p className="text-grafito">Amplía el rango de precio o quita alguna ciudad.</p>
            <div><button type="button" className="btn" onClick={() => update({ ...DEFAULTS })}>Quitar filtros</button></div>
          </div>
        )}
      </div>

      <div ref={followerRef} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-40 -ml-12 -mt-12 grid h-24 w-24 scale-0 place-items-center rounded-full bg-laton text-sm text-noche opacity-0">
        Ver
      </div>
    </div>
  );
}
