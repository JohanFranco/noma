/**
 * Datos arquitectónicos del Ático Lumen.
 * Una sola fuente para el plano SVG y para la maqueta 3D del recorrido:
 * coordenadas en metros, x hacia el oriente, z hacia el norte (la terraza está en z < 0).
 */

export type RoomId = 'vestibulo' | 'sala' | 'cocina' | 'recamara' | 'bano' | 'estudio' | 'terraza';

export type HotspotKind = 'Material' | 'Acabado' | 'Mobiliario' | 'Iluminación' | 'Arquitectura' | 'Amenidad';

export interface Hotspot {
  id: string;
  kind: HotspotKind;
  title: string;
  text: string;
  pos: [number, number, number];
}

export interface TourRoom {
  id: RoomId;
  name: string;
  area: number;
  summary: string;
  photo: string;
  cam: [number, number, number];
  yaw: number;
  links: { to: RoomId; pos: [number, number] }[];
  hotspots: Hotspot[];
}

export interface PlanShape {
  id: string;
  name: string;
  room: RoomId;
  rect: [number, number, number, number];
  area: number;
  outdoor?: boolean;
}

export interface Opening {
  from: number;
  to: number;
  bottom?: number;
  top?: number;
  glass?: boolean;
  door?: 'swing' | 'closed' | 'elevator';
  /** lado hacia el que abre la hoja: 1 = normal del muro, -1 = opuesto */
  side?: 1 | -1;
}

export interface Wall {
  a: [number, number];
  b: [number, number];
  t: number;
  openings?: Opening[];
  finish?: 'nogal' | 'travertino' | 'marmol';
  /** Cara a la que se aplica el acabado: lado de +normal o -normal */
  finishSide?: 1 | -1;
}

export const H = 3.2;

export const BOUNDS = { minX: 0, maxX: 22, minZ: -5, maxZ: 14 };

export const walls: Wall[] = [
  // Fachada norte
  {
    a: [0, 14], b: [22, 14], t: 0.3,
    openings: [
      { from: 1.2, to: 5.8, bottom: 0.45, top: 2.85, glass: true },
      { from: 8, to: 10, bottom: 1.7, top: 2.7, glass: true },
      { from: 12.5, to: 14.5, top: 2.7, door: 'elevator' },
      { from: 16.5, to: 19, bottom: 0.45, top: 2.85, glass: true },
    ],
  },
  // Fachada poniente (muro de nogal en sala)
  { a: [0, 0], b: [0, 14], t: 0.3, finish: 'nogal', finishSide: -1 },
  // Fachada oriente: cristal en cocina
  { a: [22, 0], b: [22, 14], t: 0.3, openings: [{ from: 0.6, to: 6.0, bottom: 0.0, top: 3.0, glass: true }] },
  // Sala | recámara
  { a: [0, 8], b: [7, 8], t: 0.16, openings: [{ from: 5.2, to: 6.3, top: 2.45, door: 'swing' }] },
  // Sala | baño
  { a: [7, 8], b: [11, 8], t: 0.16 },
  // Cocina | vestíbulo y estudio
  { a: [11, 8], b: [22, 8], t: 0.16, openings: [{ from: 1.2, to: 4.2, top: 2.9 }] },
  // Sala | cocina
  { a: [11, 0], b: [11, 8], t: 0.16, openings: [{ from: 1.4, to: 6.6, top: 2.9 }] },
  // Recámara | baño (muro de mármol del lado del baño)
  { a: [7, 8], b: [7, 14], t: 0.16, openings: [{ from: 1.0, to: 2.1, top: 2.45, door: 'swing' }], finish: 'marmol', finishSide: -1 },
  // Baño | vestíbulo (travertino del lado del vestíbulo)
  { a: [11, 8], b: [11, 14], t: 0.16, finish: 'travertino', finishSide: -1 },
  // Vestíbulo | estudio
  { a: [16, 8], b: [16, 14], t: 0.16, openings: [{ from: 1.0, to: 2.0, top: 2.45, door: 'swing', side: -1 }] },
  // Baño de huéspedes
  { a: [19.5, 11], b: [22, 11], t: 0.12 },
  { a: [19.5, 11], b: [19.5, 14], t: 0.12, openings: [{ from: 0.4, to: 1.2, top: 2.3, door: 'closed' }] },
];

/** Cancelería corrida hacia la terraza (z = 0) */
export const glassFront = { z: 0, from: 0, to: 22, mullionEvery: 2.2 };

export const planShapes: PlanShape[] = [
  { id: 'terraza', name: 'Terraza', room: 'terraza', rect: [0, -5, 22, 5], area: 110, outdoor: true },
  { id: 'sala', name: 'Sala', room: 'sala', rect: [0, 0, 11, 8], area: 88 },
  { id: 'cocina', name: 'Cocina y comedor', room: 'cocina', rect: [11, 0, 11, 8], area: 88 },
  { id: 'recamara', name: 'Suite principal', room: 'recamara', rect: [0, 8, 7, 6], area: 42 },
  { id: 'bano', name: 'Baño principal', room: 'bano', rect: [7, 8, 4, 6], area: 24 },
  { id: 'vestibulo', name: 'Vestíbulo', room: 'vestibulo', rect: [11, 8, 5, 6], area: 30 },
  { id: 'estudio', name: 'Estudio de huéspedes', room: 'estudio', rect: [16, 8, 3.5, 6], area: 21 },
  { id: 'estudio-b', name: 'Estudio de huéspedes', room: 'estudio', rect: [19.5, 8, 2.5, 3], area: 7.5 },
  { id: 'bano-h', name: 'Baño de huéspedes', room: 'estudio', rect: [19.5, 11, 2.5, 3], area: 7.5 },
];

export const rooms: TourRoom[] = [
  {
    id: 'vestibulo',
    name: 'Vestíbulo',
    area: 30,
    summary: 'El elevador privado abre directamente aquí. Un muro de travertino recibe y orienta hacia la cocina.',
    photo: '1600210491369-e753d80a41f3',
    cam: [13.6, 1.6, 12.2],
    yaw: 0.15,
    links: [
      { to: 'cocina', pos: [13.6, 8.6] },
      { to: 'estudio', pos: [15.4, 9.5] },
    ],
    hotspots: [
      { id: 'elevador', kind: 'Amenidad', title: 'Elevador privado', text: 'Llega directo al departamento con tarjeta de acceso. Las puertas son de latón envejecido con acabado satinado.', pos: [13.5, 1.6, 13.8] },
      { id: 'travertino', kind: 'Material', title: 'Muro de travertino', text: 'Placas de travertino romano de 3 m de altura, colocadas a hueso y sin juntas visibles.', pos: [11.15, 1.9, 9.4] },
      { id: 'escultura', kind: 'Mobiliario', title: 'Nicho de exposición', text: 'Repisa de nogal con iluminación rasante, pensada para una pieza de colección.', pos: [15.5, 1.35, 8.65] },
    ],
  },
  {
    id: 'sala',
    name: 'Sala',
    area: 88,
    summary: 'Once metros de cristal corrido hacia la terraza. El muro de nogal con chimenea lineal ordena el espacio.',
    photo: '1600585154084-4e5fe7c39198',
    cam: [7.6, 1.6, 4.6],
    yaw: 1.35,
    links: [
      { to: 'cocina', pos: [10.2, 4] },
      { to: 'recamara', pos: [5.75, 7.3] },
      { to: 'terraza', pos: [3.6, 0.7] },
    ],
    hotspots: [
      { id: 'chimenea', kind: 'Arquitectura', title: 'Chimenea lineal de gas', text: 'Quemador de 2.4 m empotrado en el muro de nogal. Se enciende desde la escena “Noche” de la domótica.', pos: [0.2, 0.75, 4] },
      { id: 'nogal', kind: 'Material', title: 'Muro de nogal americano', text: 'Chapa de nogal a hilo sobre tablero estructural; la veta continúa entre paneles.', pos: [0.2, 2.4, 6.4] },
      { id: 'sofa', kind: 'Mobiliario', title: 'Sofá modular en lino', text: 'Sofá en L de 4.2 m, tapizado en lino lavado color piedra. Incluido en la venta.', pos: [3.6, 0.9, 3.2] },
      { id: 'lampara', kind: 'Iluminación', title: 'Lámpara de arco', text: 'Arco de latón con pantalla de mármol. Regulada a 2700 K en la escena nocturna.', pos: [6.1, 2.1, 2.2] },
      { id: 'cancel', kind: 'Arquitectura', title: 'Cancelería de 3.2 m', text: 'Hojas corredizas de cristal extraclaro con perfil oculto en piso y plafón.', pos: [8.6, 2.2, 0.15] },
    ],
  },
  {
    id: 'cocina',
    name: 'Cocina y comedor',
    area: 88,
    summary: 'Una isla de granito de una sola pieza y un comedor para diez personas frente a la ciudad.',
    photo: '1600607686527-6fb886090705',
    cam: [12.6, 1.6, 6.7],
    yaw: -0.95,
    links: [
      { to: 'sala', pos: [11.8, 4] },
      { to: 'vestibulo', pos: [13.6, 7.4] },
      { to: 'terraza', pos: [18.5, 0.7] },
    ],
    hotspots: [
      { id: 'isla', kind: 'Material', title: 'Isla de granito negro absoluto', text: 'Una sola pieza de 4.2 m con acabado cepillado. Esconde parrilla de inducción y extractor descendente.', pos: [17, 1.0, 5.4] },
      { id: 'pendientes', kind: 'Iluminación', title: 'Pendientes de latón', text: 'Tres luminarias de vidrio soplado con cuerpo de latón, a 2700 K.', pos: [17, 2.35, 5.4] },
      { id: 'gabinetes', kind: 'Acabado', title: 'Gabinetes de roble', text: 'Frentes de roble rift sin jaladeras; la apertura es por presión.', pos: [20.5, 1.5, 7.8] },
      { id: 'mesa', kind: 'Mobiliario', title: 'Mesa de comedor', text: 'Nogal macizo, 3.6 m, para diez personas. Diseño a medida del estudio.', pos: [16, 0.9, 2.3] },
      { id: 'cava', kind: 'Amenidad', title: 'Cava climatizada', text: 'Vitrina de 600 botellas a 13 °C, integrada en el muro oriente.', pos: [21.3, 1.5, 7.0] },
    ],
  },
  {
    id: 'recamara',
    name: 'Suite principal',
    area: 42,
    summary: 'La cama mira al norte, hacia la luz más estable del día. Persianas automatizadas oscurecen la habitación por completo.',
    photo: '1616594039964-ae9021a400a0',
    cam: [5.6, 1.6, 9.2],
    yaw: 2.3,
    links: [
      { to: 'sala', pos: [5.75, 8.6] },
      { to: 'bano', pos: [6.5, 9.6] },
    ],
    hotspots: [
      { id: 'cabecera', kind: 'Material', title: 'Cabecera de nogal', text: 'El muro completo es la cabecera: nogal con buró flotante integrado.', pos: [0.2, 1.6, 11] },
      { id: 'ventana', kind: 'Arquitectura', title: 'Ventana al norte', text: 'Luz difusa todo el día. Persiana enrollable blackout motorizada dentro del plafón.', pos: [3.5, 2.2, 13.8] },
      { id: 'buros', kind: 'Iluminación', title: 'Lámparas de buró', text: 'Lámparas de alabastro, regulables desde la cabecera.', pos: [0.8, 0.9, 12.6] },
      { id: 'banca', kind: 'Mobiliario', title: 'Banca de pie de cama', text: 'Banca tapizada en piel natural color tabaco.', pos: [3.6, 0.6, 11] },
    ],
  },
  {
    id: 'bano',
    name: 'Baño principal',
    area: 24,
    summary: 'Muros de mármol, tina exenta bajo una ventana alta y doble lavabo flotante.',
    photo: '1620626011761-996317b8d101',
    cam: [8, 1.6, 9.2],
    yaw: -2.75,
    links: [{ to: 'recamara', pos: [7.6, 9.6] }],
    hotspots: [
      { id: 'tina', kind: 'Mobiliario', title: 'Tina exenta', text: 'Tina de piedra mineral fundida, 1.8 m, bajo la ventana alta.', pos: [9, 0.6, 12.6] },
      { id: 'marmol', kind: 'Material', title: 'Mármol Calacatta', text: 'Muros y piso en mármol con veta continua (book-matched).', pos: [7.1, 2.2, 12] },
      { id: 'espejo', kind: 'Iluminación', title: 'Espejo retroiluminado', text: 'Luz perimetral sin sombras para el arreglo personal.', pos: [10.85, 1.7, 10.5] },
      { id: 'griferia', kind: 'Acabado', title: 'Grifería de latón', text: 'Grifería de muro en latón envejecido, cepillado a mano.', pos: [10.7, 1.05, 10.0] },
    ],
  },
  {
    id: 'estudio',
    name: 'Estudio de huéspedes',
    area: 36,
    summary: 'Estudio con sofá cama y baño propio. Funciona como segunda recámara.',
    photo: '1600566753086-00f18fb6b3ea',
    cam: [17.2, 1.6, 9.4],
    yaw: -2.2,
    links: [{ to: 'vestibulo', pos: [16.6, 9.5] }],
    hotspots: [
      { id: 'escritorio', kind: 'Mobiliario', title: 'Escritorio bajo ventana', text: 'Cubierta de nogal de 2.2 m con cableado oculto.', pos: [17.7, 1.0, 13.4] },
      { id: 'banoh', kind: 'Arquitectura', title: 'Baño de huéspedes', text: 'Baño completo de 7.5 m² con regadera de piso. Fuera del alcance de esta maqueta.', pos: [19.55, 1.4, 11.8] },
      { id: 'librero', kind: 'Acabado', title: 'Librero empotrado', text: 'Librero de roble a lo largo del muro poniente.', pos: [16.15, 1.8, 12] },
    ],
  },
  {
    id: 'terraza',
    name: 'Terraza',
    area: 110,
    summary: 'Veintidós metros de terraza con alberca de borde infinito sobre Polanco.',
    photo: '1613553507747-5f8d62ad5904',
    cam: [8.5, 1.6, -1.4],
    yaw: -0.75,
    links: [
      { to: 'sala', pos: [3.6, -0.7] },
      { to: 'cocina', pos: [18.5, -0.7] },
    ],
    hotspots: [
      { id: 'alberca', kind: 'Amenidad', title: 'Alberca de borde infinito', text: '9 m de largo, climatizada con bomba de calor. El borde se pierde contra el horizonte.', pos: [16.5, 0.4, -3.4] },
      { id: 'barandal', kind: 'Arquitectura', title: 'Barandal de cristal', text: 'Cristal templado laminado de 1.1 m, sin postes.', pos: [6, 1.0, -4.95] },
      { id: 'deck', kind: 'Material', title: 'Deck de ipe', text: 'Madera de ipe con tratamiento de aceite, resistente al sol y a la lluvia.', pos: [4.5, 0.05, -2.5] },
      { id: 'luzexterior', kind: 'Iluminación', title: 'Luz rasante exterior', text: 'Perfil LED oculto bajo la jardinera; ilumina la terraza sin deslumbrar.', pos: [0.4, 0.5, -3] },
    ],
  },
];

export const roomById = Object.fromEntries(rooms.map((r) => [r.id, r])) as Record<RoomId, TourRoom>;
