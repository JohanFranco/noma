import Lenis from 'lenis';
import { gsap, ScrollTrigger, SplitText, onPage, reducedMotion } from '../lib/motion';

/* ───────────── Desplazamiento suave (una sola instancia para todo el sitio) ───────────── */
let lenis: Lenis | null = null;
if (!reducedMotion()) {
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
(window as any).__lenis = lenis;

window.addEventListener('noma:scroll-lock', () => {
  lenis?.stop();
  document.documentElement.style.overflow = 'hidden';
});
window.addEventListener('noma:scroll-unlock', () => {
  lenis?.start();
  document.documentElement.style.overflow = '';
});

document.addEventListener('astro:after-swap', () => {
  document.documentElement.classList.add('js');
  if (reducedMotion()) document.documentElement.classList.add('reduced');
  lenis?.resize();
  if (!location.hash) lenis?.scrollTo(0, { immediate: true, force: true });
});

/* ───────────── Encabezado: se oculta al bajar, reaparece al subir ───────────── */
onPage(() => {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;
  let last = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    header.dataset.scrolled = String(y > 40);
    const menuOpen = header.dataset.menu === 'open';
    header.dataset.hidden = String(!menuOpen && y > 240 && y > last + 2);
    if (y < last - 2) header.dataset.hidden = 'false';
    last = y;
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Enlace activo
  header.querySelectorAll<HTMLAnchorElement>('a[data-nav]').forEach((a) => {
    const path = new URL(a.href).pathname;
    const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  // Menú móvil
  const toggle = header.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const panel = document.querySelector<HTMLElement>('[data-menu-panel]');
  let tl: gsap.core.Timeline | null = null;
  const setMenu = (open: boolean) => {
    if (!toggle || !panel) return;
    header.dataset.menu = open ? 'open' : 'closed';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    tl?.kill();
    if (open) {
      panel.hidden = false;
      window.dispatchEvent(new Event('noma:scroll-lock'));
      tl = gsap.timeline()
        .fromTo(panel, { clipPath: 'circle(0% at 100% 0%)' }, { clipPath: 'circle(150% at 100% 0%)', duration: reducedMotion() ? 0 : 0.9, ease: 'power4.inOut' })
        .fromTo(panel.querySelectorAll('[data-menu-item]'), { yPercent: 110 }, { yPercent: 0, stagger: 0.06, duration: 0.9 }, '-=0.45');
      panel.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
    } else {
      window.dispatchEvent(new Event('noma:scroll-unlock'));
      tl = gsap.timeline({ onComplete: () => { panel.hidden = true; } })
        .to(panel, { clipPath: 'circle(0% at 100% 0%)', duration: reducedMotion() ? 0 : 0.7, ease: 'power4.inOut' });
    }
  };
  const onToggle = () => setMenu(header.dataset.menu !== 'open');
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && header.dataset.menu === 'open') { setMenu(false); toggle?.focus(); } };
  toggle?.addEventListener('click', onToggle);
  document.addEventListener('keydown', onKey);
  panel?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  return () => {
    window.removeEventListener('scroll', onScroll);
    toggle?.removeEventListener('click', onToggle);
    document.removeEventListener('keydown', onKey);
    if (header.dataset.menu === 'open') {
      header.dataset.menu = 'closed';
      if (panel) panel.hidden = true;
      window.dispatchEvent(new Event('noma:scroll-unlock'));
    }
  };
});

/* ───────────── Revelados ligados al scroll ───────────── */
onPage(() => {
  if (reducedMotion()) return;
  const ctx = gsap.context(() => {
    // Titulares: líneas que emergen de una máscara
    document.querySelectorAll<HTMLElement>('[data-reveal="lines"]').forEach((el) => {
      const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
      gsap.set(el, { visibility: 'visible' });
      gsap.from(split.lines, {
        yPercent: 112,
        duration: 1.3,
        stagger: 0.09,
        ease: 'expo.out',
        delay: Number(el.dataset.delay || 0),
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });

    // Imágenes: se abren como una puerta desde la esquina inferior izquierda
    document.querySelectorAll<HTMLElement>('[data-reveal="door"]').forEach((el) => {
      const inner = el.querySelector('img');
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      tl.to(el, { clipPath: 'circle(142% at 0% 100%)', duration: 1.6, ease: 'power3.inOut' });
      if (inner) tl.from(inner, { scale: 1.25, duration: 2, ease: 'expo.out' }, 0.1);
    });

    // Parallax multicapa
    document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
      const depth = Number(el.dataset.parallax || 0.15);
      gsap.fromTo(el, { yPercent: -depth * 50 }, {
        yPercent: depth * 50,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement || el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  });
  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener('load', refresh, { once: true });
  return () => ctx.revert();
});
