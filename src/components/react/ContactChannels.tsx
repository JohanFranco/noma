import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

/**
 * Canales de contacto de demostración. Ningún botón abre WhatsApp, marca un
 * teléfono ni envía correo: muestran qué ocurriría en un sitio real.
 */
const CHANNELS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    value: '+52 55 0000 0000',
    note: 'Respuesta en horario de oficina',
    action: 'Escribir por WhatsApp',
    demo: 'En un sitio real se abriría WhatsApp con este mensaje: “Hola, me interesa agendar una visita a una residencia de NÓMA.”',
  },
  {
    id: 'telefono',
    name: 'Teléfono',
    value: '+52 55 0000 0001',
    note: 'Lunes a sábado, 9:00 a 19:00',
    action: 'Llamar',
    demo: 'En un sitio real este botón iniciaría una llamada. El número mostrado es ficticio.',
  },
  {
    id: 'correo',
    name: 'Correo',
    value: 'visitas@noma.example',
    note: 'Respondemos en un día hábil',
    action: 'Escribir un correo',
    demo: 'En un sitio real se abriría tu cliente de correo. El dominio .example está reservado y no recibe mensajes.',
  },
];

export default function ContactChannels() {
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const c = CHANNELS.find((x) => x.id === open);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.fromTo(d, { clipPath: 'circle(0% at 0% 100%)' }, { clipPath: 'circle(150% at 0% 100%)', duration: 0.8, ease: 'power3.inOut' });
      }
    }
    if (!open && d.open) d.close();
  }, [open]);

  const copy = async (v: string) => {
    try { await navigator.clipboard.writeText(v); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* sin permiso de portapapeles */ }
  };

  return (
    <>
      <ul className="grid border-t border-papel/15">
        {CHANNELS.map((ch) => (
          <li key={ch.id} className="grid gap-4 border-b border-papel/15 py-7 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="text-sm text-bruma">{ch.name}</p>
              <p className="num mt-1 font-display text-[clamp(1.7rem,2.6vw,2.4rem)] leading-tight">{ch.value}</p>
              <p className="mt-1 text-sm text-bruma/80">{ch.note}</p>
            </div>
            <button type="button" className="btn btn--ghost w-fit text-papel" onClick={() => setOpen(ch.id)}>{ch.action}</button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(null)}
        onClick={(e) => { if (e.target === dialogRef.current) setOpen(null); }}
        className="m-auto w-[min(92vw,480px)] bg-papel p-0 text-pizarra backdrop:bg-noche/70 backdrop:backdrop-blur-sm"
        aria-labelledby="demo-t"
      >
        {c && (
          <div className="grid gap-5 p-8">
            <p className="text-sm text-musgo">Demostración</p>
            <p id="demo-t" className="font-display text-4xl leading-none">{c.name}</p>
            <p className="text-grafito">{c.demo}</p>
            <p className="num rounded-[2px] bg-caliza px-4 py-3">{c.value}</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn" onClick={() => setOpen(null)}>Entendido</button>
              <button type="button" className="btn btn--ghost" onClick={() => copy(c.value)}>{copied ? 'Copiado' : 'Copiar dato'}</button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
