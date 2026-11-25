# NÓMA — Arquitectura para quedarse

Marca inmobiliaria ficticia de residencias contemporáneas en México. Proyecto de portafolio de Johan Franco.

```
npm install
npm run dev       # http://localhost:4321
npm run build && npm run preview
```

## Stack

Astro 7 (páginas estáticas + View Transitions) · React 19 (islas) · TypeScript · Tailwind CSS 4 · GSAP 3 (ScrollTrigger, SplitText, Flip) · Lenis · Three.js con React Three Fiber y drei.

## Qué hay

| Ruta | Contenido |
| --- | --- |
| `/` | Apertura con el símbolo, hero cinematográfico (Ken Burns, parallax de puntero en tres capas, cambio de foto “en puerta”), historia de marca fijada al scroll, galería horizontal fijada, plano del Lumen que se dibuja en perspectiva |
| `/residencias` | Explorador: ubicación, tipo, rango de precio, superficie mínima, recámaras y orden. Estado en la URL, animación Flip al filtrar |
| `/residencias/[slug]` | Portada con imagen compartida desde el catálogo, datos, relato con parallax, plano, galería arrastrable con visor, amenidades, acabados, solicitud de visita |
| `/residencias/atico-lumen` | Además: plano interactivo y recorrido virtual 3D |
| `/marca` | Identidad: símbolo, paleta, tipografía, voz y movimiento |
| `/contacto` | Visita, canales (WhatsApp, teléfono, correo) y formulario |

## Recorrido virtual del Ático Lumen

- **Maqueta 3D generada en tiempo real** (no fotografías deformadas). La misma fuente de datos (`src/data/lumen.ts`) genera los muros del plano SVG y los de la escena, así que el plano y el recorrido siempre coinciden.
- Entrada desde el elevador privado, mirada con ratón, táctil o flechas, zoom con rueda o `+`/`-`.
- Siete espacios; caminata entre espacios contiguos y fundido entre los no contiguos.
- Minimapa con cono de visión sincronizado con la cámara; cada espacio del plano es seleccionable.
- Día (17:40) y noche (21:30) con iluminación dinámica: sol, lámparas, chimenea, alberca y ciudad.
- 28 puntos de interés (materiales, acabados, mobiliario, iluminación, arquitectura, amenidades).
- Versión fotográfica ligera, identificada como tal, y detección de WebGL y de dispositivos modestos (calidad ligera sin sombras).
- Three.js solo se descarga al abrir el recorrido (chunk aparte).

## Honestidad del demo

- Residencias, precios, teléfonos y correos son ficticios (`.example` es un dominio reservado). Ningún botón contacta a nadie; los formularios validan y muestran una confirmación de demostración.
- Las fotografías son de Unsplash y sirven como referencia visual; la maqueta 3D es ilustrativa.

## Accesibilidad y rendimiento

`prefers-reduced-motion` desactiva desplazamiento suave, pines y caminatas (los cambios son directos). Presentación del hero con pausa. Diálogos con foco atrapado y cierre con `Escape`. Imágenes responsivas en AVIF/WebP desde el CDN.
