import { lazy, Suspense, useEffect, useState } from 'react';
import PlanSVG from './PlanSVG';
import { walls, glassFront, planShapes, roomById, rooms, type RoomId } from '../../data/lumen';
import { img, srcset } from '../../lib/img';
import type { TourMode } from './tour/TourOverlay';

// El recorrido (y Three.js) se descarga solo cuando el usuario lo abre.
const TourOverlay = lazy(() => import('./tour/TourOverlay'));
const preload = () => { import('./tour/TourOverlay'); import('./tour/Scene'); };

const planRooms = planShapes.map((s) => ({
  id: s.id,
  name: s.name,
  rect: s.rect,
  note: `${s.area} m². ${roomById[s.room].summary}`,
  photo: roomById[s.room].photo,
  outdoor: s.outdoor,
}));
const groupOf = (id: string) => planShapes.find((s) => s.id === id)?.room ?? id;

export default function LumenExperience() {
  const [tour, setTour] = useState<{ room: RoomId; intro: boolean; mode: TourMode } | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('recorrido');
    if (q && q in roomById) setTour({ room: q as RoomId, intro: q === 'vestibulo', mode: '3d' });
  }, []);

  const open = (room: RoomId, mode: TourMode = '3d') => setTour({ room, intro: room === 'vestibulo' && mode === '3d', mode });
  const close = () => {
    setTour(null);
    const url = new URL(location.href);
    if (url.searchParams.has('recorrido')) { url.searchParams.delete('recorrido'); history.replaceState(history.state, '', url); }
  };

  return (
    <div className="grid gap-16 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-7">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
          <h3 className="display-s">Plano interactivo</h3>
          <p className="text-sm text-bruma">Pasa el cursor por un espacio. Al elegirlo, entras a él en el recorrido.</p>
        </div>
        <div className="text-papel/80">
          <PlanSVG
            rooms={planRooms}
            walls={walls}
            glassFront={glassFront}
            groupOf={groupOf}
            onSelect={(id) => open(id as RoomId)}
            actionLabel="Entrar a este espacio en el recorrido"
            title="Plano interactivo del Ático Lumen"
          />
        </div>
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Espacios del recorrido">
          {rooms.map((r) => (
            <li key={r.id}>
              <button type="button" className="tour-room" onClick={() => open(r.id)} onPointerEnter={preload}>
                {r.name}, {r.area} m²
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="lg:col-span-4 lg:col-start-9">
        <button
          type="button"
          onClick={() => open('vestibulo')}
          onPointerEnter={preload}
          onFocus={preload}
          className="group relative block w-full overflow-hidden bg-grafito text-left"
          aria-label="Iniciar el recorrido virtual desde el elevador privado"
        >
          <img src={img('1613553507747-5f8d62ad5904', 1000)} srcSet={srcset('1613553507747-5f8d62ad5904', [500, 800, 1100], 0.8)} sizes="(min-width:1024px) 30vw, 92vw" alt="" loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-[1.6s] ease-[var(--ease-expo)] group-hover:scale-105" />
          <span className="absolute inset-0 bg-gradient-to-t from-noche/80 via-noche/10 to-transparent" />
          <span className="absolute inset-x-0 bottom-0 grid gap-3 p-6">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-papel text-noche transition-transform duration-700 ease-[var(--ease-expo)] group-hover:scale-110">
              <svg viewBox="0 0 16 16" className="ml-0.5 h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M4 2l10 6-10 6z" /></svg>
            </span>
            <span className="font-display text-3xl leading-none">Iniciar recorrido</span>
            <span className="text-sm text-papel/75">Entras desde el elevador privado. Siete espacios, día y noche.</span>
          </span>
        </button>
        <div className="mt-6 grid gap-4 text-sm text-bruma">
          <p>
            Maqueta 3D generada en tiempo real a partir del plano. Representa la distribución, la orientación y la luz; el mobiliario y los acabados son ilustrativos.
          </p>
          <button type="button" className="link-line w-fit text-papel" onClick={() => open('sala', 'foto')}>
            Abrir la versión fotográfica ligera
          </button>
        </div>
      </div>

      {tour && (
        <Suspense fallback={<div className="fixed inset-0 z-[90] bg-noche" />}>
          <TourOverlay startRoom={tour.room} intro={tour.intro} mode={tour.mode} onClose={close} />
        </Suspense>
      )}
    </div>
  );
}
