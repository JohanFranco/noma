import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);
gsap.defaults({ ease: 'expo.out', duration: 1.1 });

export { gsap, ScrollTrigger, SplitText };

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type Cleanup = void | (() => void);

/**
 * Ejecuta `init` en cada carga de página (incluida la navegación con View Transitions)
 * y limpia antes del siguiente intercambio de DOM.
 */
export function onPage(init: () => Cleanup) {
  let cleanup: Cleanup;
  // El DOM de cada página es un <body> nuevo: evita inicializar dos veces el mismo
  let initializedFor: HTMLElement | null = null;
  const run = () => {
    if (initializedFor === document.body) return;
    initializedFor = document.body;
    if (typeof cleanup === 'function') cleanup();
    cleanup = init();
  };
  document.addEventListener('astro:page-load', run);
  document.addEventListener('astro:before-swap', () => {
    if (typeof cleanup === 'function') cleanup();
    cleanup = undefined;
    initializedFor = null;
  });
  // Si el módulo se evaluó después del primer `astro:page-load`, inicializa ya.
  if (document.readyState !== 'loading') queueMicrotask(run);
}
