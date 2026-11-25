import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { properties } from '../../data/properties';

/**
 * Solicitud de visita. Es una demostración: valida en el navegador y no envía
 * datos a ningún servidor ni contacta a nadie.
 */
interface Props { defaultProperty?: string; tone?: 'light' | 'dark'; compact?: boolean }

const SLOTS = ['10:00', '12:00', '16:00', '18:00'];

export default function VisitForm({ defaultProperty = '', tone = 'light', compact = false }: Props) {
  const [values, setValues] = useState({ name: '', email: '', phone: '', property: defaultProperty, date: '', slot: '', message: '', mode: 'presencial' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const set = (k: keyof typeof values, v: string) => {
    setValues((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (values.name.trim().length < 2) e.name = 'Escribe tu nombre.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) e.email = 'Escribe un correo válido, por ejemplo nombre@dominio.com.';
    if (values.phone && values.phone.replace(/\D/g, '').length < 10) e.phone = 'El teléfono debe tener al menos 10 dígitos.';
    if (!values.property) e.property = 'Elige una residencia.';
    if (!values.date) e.date = 'Elige una fecha.';
    else if (values.date < minDate) e.date = 'Elige una fecha a partir de mañana.';
    else if (new Date(values.date + 'T12:00').getDay() === 0) e.date = 'No hay visitas en domingo. Elige otro día.';
    if (!values.slot) e.slot = 'Elige un horario.';
    return e;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      const first = formRef.current?.querySelector<HTMLElement>(`[name="${Object.keys(e)[0]}"]`);
      first?.focus();
      return;
    }
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 900);
  };

  useEffect(() => {
    if (!sent) return;
    doneRef.current?.focus();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(doneRef.current, { clipPath: 'circle(0% at 0% 100%)' }, { clipPath: 'circle(142% at 0% 100%)', duration: 1.1, ease: 'power3.inOut' });
    gsap.from(doneRef.current!.querySelectorAll('[data-in]'), { y: 30, opacity: 0, stagger: 0.08, delay: 0.4, duration: 1, ease: 'expo.out' });
  }, [sent]);

  const dark = tone === 'dark';
  const prop = properties.find((p) => p.slug === values.property);
  const dateLabel = values.date ? new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(values.date + 'T12:00')) : '';

  if (sent) {
    return (
      <div ref={doneRef} tabIndex={-1} className={`grid gap-6 p-8 outline-none md:p-12 ${dark ? 'bg-papel text-pizarra' : 'bg-pizarra text-papel'}`} role="status">
        <svg data-in viewBox="0 0 40 40" className="h-12 w-12 text-laton" aria-hidden="true"><path className="door-symbol" d="M2 2H38V38H33M7 38H2V2M7 38V12" /><path className="door-symbol" d="M7 12A26 26 0 0 1 33 38" strokeDasharray="1.6 2.2" /></svg>
        <p data-in className="display-s">Solicitud registrada, {values.name.split(' ')[0]}.</p>
        <p data-in className="max-w-[44ch] opacity-80">
          Visita {values.mode} a {prop?.name} el {dateLabel} a las {values.slot}. En un sitio real, un asesor confirmaría a {values.email} en menos de un día hábil.
        </p>
        <p data-in className="text-sm opacity-60">Demostración: no se envió ningún dato ni se contactó a nadie.</p>
        <div data-in><button type="button" className="link-line text-sm" onClick={() => { setSent(false); setValues((v) => ({ ...v, date: '', slot: '', message: '' })); }}>Solicitar otra visita</button></div>
      </div>
    );
  }

  const err = (k: string) => errors[k] && <p id={`${k}-err`} className="error">{errors[k]}</p>;
  const aria = (k: string) => ({ 'aria-invalid': Boolean(errors[k]), 'aria-describedby': errors[k] ? `${k}-err` : undefined });

  return (
    <form ref={formRef} noValidate onSubmit={submit} className={`grid gap-8 ${compact ? '' : 'md:grid-cols-2'}`} aria-label="Solicitar una visita">
      <div className="field">
        <label htmlFor="vf-name">Nombre completo</label>
        <input id="vf-name" name="name" autoComplete="name" value={values.name} onChange={(e) => set('name', e.target.value)} {...aria('name')} />
        {err('name')}
      </div>
      <div className="field">
        <label htmlFor="vf-email">Correo electrónico</label>
        <input id="vf-email" name="email" type="email" autoComplete="email" value={values.email} onChange={(e) => set('email', e.target.value)} {...aria('email')} />
        {err('email')}
      </div>
      <div className="field">
        <label htmlFor="vf-phone">Teléfono (opcional)</label>
        <input id="vf-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" value={values.phone} onChange={(e) => set('phone', e.target.value)} {...aria('phone')} />
        {err('phone')}
      </div>
      <div className="field">
        <label htmlFor="vf-prop">Residencia</label>
        <select id="vf-prop" name="property" value={values.property} onChange={(e) => set('property', e.target.value)} {...aria('property')} className={dark ? '[&>option]:text-pizarra' : ''}>
          <option value="">Elige una residencia</option>
          {properties.map((p) => <option key={p.slug} value={p.slug}>{p.name}, {p.city}</option>)}
        </select>
        {err('property')}
      </div>
      <div className="field">
        <label htmlFor="vf-date">Fecha</label>
        <input id="vf-date" name="date" type="date" min={minDate} value={values.date} onChange={(e) => set('date', e.target.value)} {...aria('date')} className={dark ? '[color-scheme:dark]' : ''} />
        {err('date')}
      </div>
      <fieldset className="field" {...aria('slot')}>
        <legend className="mb-2 text-sm opacity-70">Horario</legend>
        <div className="flex flex-wrap gap-2">
          {SLOTS.map((s) => (
            <button key={s} type="button" name="slot" className="chip num" aria-pressed={values.slot === s} onClick={() => set('slot', s)}>{s}</button>
          ))}
        </div>
        {err('slot')}
      </fieldset>
      <fieldset className={`field ${compact ? '' : 'md:col-span-2'}`}>
        <legend className="mb-2 text-sm opacity-70">Tipo de visita</legend>
        <div className="flex flex-wrap gap-2">
          {[['presencial', 'Presencial'], ['por videollamada', 'Por videollamada']].map(([v, l]) => (
            <button key={v} type="button" className="chip" aria-pressed={values.mode === v} onClick={() => set('mode', v)}>{l}</button>
          ))}
        </div>
      </fieldset>
      <div className={`field ${compact ? '' : 'md:col-span-2'}`}>
        <label htmlFor="vf-msg">Mensaje (opcional)</label>
        <textarea id="vf-msg" name="message" rows={3} value={values.message} onChange={(e) => set('message', e.target.value)} placeholder="Cuéntanos qué buscas o con quién vendrás." className="resize-none placeholder:opacity-40" />
      </div>
      <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${compact ? '' : 'md:col-span-2'}`}>
        <p className="max-w-[46ch] text-sm opacity-60">Formulario de demostración: los datos no se envían a ningún servidor.</p>
        <button type="submit" className={`btn ${dark ? 'btn--light' : ''}`} disabled={sending} aria-busy={sending}>
          {sending ? 'Registrando…' : 'Solicitar visita'}
        </button>
      </div>
    </form>
  );
}
