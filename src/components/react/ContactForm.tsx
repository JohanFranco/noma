import { useState } from 'react';

/** Formulario general de contacto (demostración: no envía datos). */
export default function ContactForm() {
  const [v, setV] = useState({ name: '', email: '', topic: 'Comprar una residencia', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (v.name.trim().length < 2) er.name = 'Escribe tu nombre.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) er.email = 'Escribe un correo válido.';
    if (v.message.trim().length < 10) er.message = 'Cuéntanos un poco más (al menos 10 caracteres).';
    setErrors(er);
    if (Object.keys(er).length) { document.getElementById(`cf-${Object.keys(er)[0]}`)?.focus(); return; }
    setDone(true);
  };

  if (done) {
    return (
      <div role="status" className="grid gap-4 border-t border-pizarra/20 pt-8">
        <p className="display-s">Mensaje registrado.</p>
        <p className="text-grafito">Tema: {v.topic}. En un sitio real responderíamos a {v.email}.</p>
        <p className="text-sm text-grafito/70">Demostración: no se envió ningún dato.</p>
        <button type="button" className="link-line w-fit text-sm" onClick={() => { setDone(false); setV({ ...v, message: '' }); }}>Escribir otro mensaje</button>
      </div>
    );
  }

  const a = (k: string) => ({ 'aria-invalid': Boolean(errors[k]), 'aria-describedby': errors[k] ? `cf-${k}-e` : undefined });
  return (
    <form noValidate onSubmit={submit} className="grid gap-8 md:grid-cols-2" aria-label="Formulario de contacto">
      <div className="field">
        <label htmlFor="cf-name">Nombre</label>
        <input id="cf-name" autoComplete="name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} {...a('name')} />
        {errors.name && <p id="cf-name-e" className="error">{errors.name}</p>}
      </div>
      <div className="field">
        <label htmlFor="cf-email">Correo electrónico</label>
        <input id="cf-email" type="email" autoComplete="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} {...a('email')} />
        {errors.email && <p id="cf-email-e" className="error">{errors.email}</p>}
      </div>
      <div className="field md:col-span-2">
        <label htmlFor="cf-topic">Tema</label>
        <select id="cf-topic" value={v.topic} onChange={(e) => setV({ ...v, topic: e.target.value })}>
          {['Comprar una residencia', 'Vender con NÓMA', 'Prensa y colaboraciones', 'Otro tema'].map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="field md:col-span-2">
        <label htmlFor="cf-message">Mensaje</label>
        <textarea id="cf-message" rows={4} className="resize-none" value={v.message} onChange={(e) => setV({ ...v, message: e.target.value })} {...a('message')} />
        {errors.message && <p id="cf-message-e" className="error">{errors.message}</p>}
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:col-span-2">
        <p className="text-sm text-grafito/70">Formulario de demostración: los datos no se envían.</p>
        <button type="submit" className="btn">Enviar mensaje</button>
      </div>
    </form>
  );
}
