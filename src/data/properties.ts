import { planShapes, roomById } from './lumen';

export type PropertyType = 'Penthouse' | 'Residencia' | 'Casa' | 'Loft' | 'Departamento';

export interface Photo {
  id: string;
  alt: string;
  caption: string;
}

export interface PlanRoom {
  id: string;
  name: string;
  /** Rectángulo en metros: x, z, ancho, fondo */
  rect: [number, number, number, number];
  note: string;
  photo?: string;
  outdoor?: boolean;
}

export interface Property {
  slug: string;
  name: string;
  type: PropertyType;
  city: string;
  district: string;
  price: number;
  area: number;
  terrace: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  level: string;
  year: number;
  architect: string;
  tagline: string;
  intro: string;
  story: string[];
  cover: Photo;
  gallery: Photo[];
  amenities: string[];
  finishes: { name: string; detail: string; swatch: string }[];
  plan: { width: number; depth: number; rooms: PlanRoom[] };
  hasTour?: boolean;
  tone: string;
}

const P = {
  lumenLiving: '1600573472550-8090b5e0745e',
  lumenSala: '1600585154084-4e5fe7c39198',
  lumenKitchen: '1600607686527-6fb886090705',
  lumenLounge: '1600607687939-ce8a6c25118c',
  lumenDining: '1600607687920-4e2a09cf159d',
  lumenBed: '1616594039964-ae9021a400a0',
  lumenBath: '1620626011761-996317b8d101',
  lumenTerrace: '1613553507747-5f8d62ad5904',
  lumenTower: '1511818966892-d7d671e672a2',
  lumenStair: '1600566753086-00f18fb6b3ea',
  lumenGallery: '1600210491369-e753d80a41f3',
};

export const properties: Property[] = [
  {
    slug: 'atico-lumen',
    name: 'Ático Lumen',
    type: 'Penthouse',
    city: 'Ciudad de México',
    district: 'Polanco',
    price: 68_400_000,
    area: 308,
    terrace: 110,
    bedrooms: 2,
    bathrooms: 2,
    parking: 4,
    level: 'Piso 32',
    year: 2025,
    architect: 'Estudio Lintel',
    tagline: 'Un piso entero orientado al poniente, donde la tarde entra hasta la cocina.',
    intro:
      'Lumen ocupa la última planta de una torre de 32 niveles sobre Campos Elíseos. Veintidós metros de cristal corrido separan la sala y la cocina de una terraza con alberca de borde infinito.',
    story: [
      'El proyecto parte de una sola idea: que la luz recorra la casa en el mismo orden en que se vive el día. Por la mañana ilumina la suite principal; al mediodía, la galería de acceso; al atardecer, toda la zona social.',
      'Estudio Lintel eliminó los pasillos. Cada espacio se abre al siguiente a través de vanos de piso a techo, y los muros que quedan son de travertino o de nogal, nunca de tablaroca pintada.',
      'De noche, la iluminación indirecta convierte la ciudad en el elemento principal del interior. Puedes comprobarlo en el recorrido virtual con el modo noche.',
    ],
    cover: { id: P.lumenLiving, alt: 'Estancia a doble altura con muro de cristal y escalera flotante', caption: 'Estancia principal al atardecer' },
    gallery: [
      { id: P.lumenSala, alt: 'Sala con muro de nogal y chimenea lineal', caption: 'Sala con muro de nogal' },
      { id: P.lumenKitchen, alt: 'Cocina con isla de piedra y gabinetes de roble', caption: 'Cocina abierta y comedor' },
      { id: P.lumenDining, alt: 'Comedor junto a cancelería de piso a techo', caption: 'Comedor frente a la terraza' },
      { id: P.lumenBed, alt: 'Recámara principal en tonos oscuros con iluminación cálida', caption: 'Suite principal' },
      { id: P.lumenBath, alt: 'Baño con tina exenta y muros claros', caption: 'Baño principal' },
      { id: P.lumenTerrace, alt: 'Alberca enmarcada por cancelería de cristal', caption: 'Terraza con alberca' },
      { id: P.lumenLounge, alt: 'Estancia con sofá bajo y vista abierta', caption: 'Estancia de lectura' },
      { id: P.lumenTower, alt: 'Fachada de una torre vista desde abajo', caption: 'La torre, nivel 32' },
    ],
    amenities: [
      'Elevador privado con acceso directo al vestíbulo',
      'Alberca de borde infinito climatizada en terraza',
      'Cuatro cajones de estacionamiento con carga para auto eléctrico',
      'Bodega climatizada para vino de 600 botellas',
      'Domótica de iluminación, persianas y clima por escenas',
      'Spa, gimnasio y sala de cine en el nivel 30',
      'Seguridad y recepción 24 horas',
    ],
    finishes: [
      { name: 'Travertino romano', detail: 'Pisos en placas de 120 × 60 cm, acabado apomazado, sin juntas visibles.', swatch: '#d9d0c1' },
      { name: 'Nogal americano', detail: 'Muros de sala y cabecera en chapa de nogal con veta a hilo.', swatch: '#5d4433' },
      { name: 'Granito negro absoluto', detail: 'Isla de cocina de 4.2 m en una sola pieza, acabado cepillado.', swatch: '#22262a' },
      { name: 'Latón envejecido', detail: 'Herrajes, griferías y perfiles de iluminación hechos a medida.', swatch: '#a88a5a' },
      { name: 'Cristal extraclaro', detail: 'Cancelería corrediza de 3.2 m de altura con perfil oculto.', swatch: '#c9d6d9' },
    ],
    plan: {
      width: 22,
      depth: 19,
      rooms: planShapes.map((s) => ({
        id: s.id,
        name: s.name,
        rect: s.rect,
        note: `${s.area} m². ${roomById[s.room].summary.split('.')[0]}.`,
        photo: roomById[s.room].photo,
        outdoor: s.outdoor,
      })),
    },
    hasTour: true,
    tone: '#2a3135',
  },
  {
    slug: 'casa-duna',
    name: 'Casa Duna',
    type: 'Residencia',
    city: 'Los Cabos',
    district: 'Pedregal',
    price: 92_000_000,
    area: 620,
    terrace: 340,
    bedrooms: 5,
    bathrooms: 6,
    parking: 4,
    level: 'Dos niveles sobre acantilado',
    year: 2024,
    architect: 'Taller Ferrer Solana',
    tagline: 'Volúmenes blancos apilados sobre la roca, con el Pacífico como único vecino.',
    intro:
      'Casa Duna se escalona en tres plataformas sobre el acantilado del Pedregal. Cada recámara tiene terraza propia y vista directa al arco de Cabo San Lucas.',
    story: [
      'La casa está construida en concreto aparente pintado a la cal, la misma técnica que protege a las construcciones costeras del salitre.',
      'La alberca principal mide 24 metros y corre paralela al horizonte. Desde la sala, el borde del agua coincide con la línea del mar.',
    ],
    cover: { id: '1600596542815-ffad4c1539a9', alt: 'Residencia blanca con alberca al atardecer', caption: 'Fachada poniente' },
    gallery: [
      { id: '1613977257363-707ba9348227', alt: 'Volúmenes blancos frente a una alberca', caption: 'Plataforma de la alberca' },
      { id: '1512917774080-9991f1c4c750', alt: 'Casa blanca con alberca rodeada de palmeras', caption: 'Jardín de palmas' },
      { id: '1613490493576-7fde63acd811', alt: 'Residencia contemporánea con terrazas', caption: 'Terrazas superiores' },
      { id: '1613545325278-f24b0cae1224', alt: 'Interior blanco con dobles alturas', caption: 'Estancia a doble altura' },
      { id: '1599809275671-b5942cabc7a2', alt: 'Alberca al atardecer junto a la casa', caption: 'Atardecer en la terraza' },
    ],
    amenities: ['Alberca de 24 m con borde infinito', 'Casa de huéspedes independiente', 'Acceso privado a playa', 'Cava subterránea', 'Paneles solares y planta desaladora', 'Cocina exterior con horno de leña'],
    finishes: [
      { name: 'Concreto a la cal', detail: 'Fachadas encaladas a mano, mantenimiento anual mínimo.', swatch: '#efede6' },
      { name: 'Chukum', detail: 'Recubrimiento maya en baños y alberca, impermeable y natural.', swatch: '#d8cbb3' },
      { name: 'Parota', detail: 'Puertas pivotantes de 3 m en madera maciza.', swatch: '#7a5236' },
    ],
    plan: {
      width: 30,
      depth: 18,
      rooms: [
        { id: 'estancia', name: 'Estancia', rect: [0, 0, 12, 9], note: 'Doble altura con vista al mar' },
        { id: 'cocina', name: 'Cocina', rect: [12, 0, 8, 9], note: 'Isla de chukum y cava' },
        { id: 'comedor', name: 'Comedor', rect: [20, 0, 10, 9], note: 'Mesa para 14 personas' },
        { id: 'suite', name: 'Suite principal', rect: [0, 9, 11, 9], note: 'Terraza y baño con jardín' },
        { id: 'rec2', name: 'Recámara 2', rect: [11, 9, 7, 9], note: 'Baño completo' },
        { id: 'rec3', name: 'Recámara 3', rect: [18, 9, 6, 9], note: 'Baño completo' },
        { id: 'servicio', name: 'Servicio', rect: [24, 9, 6, 9], note: 'Lavandería y cuarto de servicio' },
        { id: 'alberca', name: 'Alberca', rect: [0, -6, 30, 6], note: '24 m de borde infinito', outdoor: true },
      ],
    },
    tone: '#c9c3b6',
  },
  {
    slug: 'residencia-ambar',
    name: 'Residencia Ámbar',
    type: 'Casa',
    city: 'Valle de Bravo',
    district: 'Avándaro',
    price: 41_800_000,
    area: 480,
    terrace: 160,
    bedrooms: 4,
    bathrooms: 4,
    parking: 3,
    level: 'Una planta en el bosque',
    year: 2023,
    architect: 'Estudio Lintel',
    tagline: 'Una casa baja de madera quemada que, de noche, se enciende entre los pinos.',
    intro:
      'Ámbar se extiende en una sola planta sobre un terreno de 2,800 m² en Avándaro. Sus fachadas de madera carbonizada desaparecen en el bosque durante el día.',
    story: [
      'La madera de la fachada se trató con la técnica japonesa del yakisugi: quemada en superficie para resistir la humedad del bosque durante décadas.',
      'Un patio central reúne la luz y conecta todas las habitaciones sin pasillos cerrados.',
    ],
    cover: { id: '1600585153490-76fb20a32601', alt: 'Casa oscura de madera iluminada de noche', caption: 'Fachada norte, de noche' },
    gallery: [
      { id: '1600585154340-be6161a56a0c', alt: 'Casa contemporánea con jardín al anochecer', caption: 'Jardín y terraza' },
      { id: '1600585154526-990dced4db0d', alt: 'Fachada oscura con ventanales', caption: 'Detalle de fachada' },
      { id: '1600573472592-401b489a3cdc', alt: 'Fachada de madera y volumen blanco', caption: 'Acceso principal' },
      { id: '1600607688066-890987f18a86', alt: 'Baño con lavabo de madera', caption: 'Baño de la suite' },
      { id: '1600210492486-724fe5c67fb0', alt: 'Estancia luminosa con plantas', caption: 'Estancia junto al patio' },
    ],
    amenities: ['Patio central con árbol de liquidámbar', 'Chimenea de doble cara', 'Sauna de cedro', 'Captación de agua pluvial', 'Huerto y invernadero', 'Muelle compartido en la presa'],
    finishes: [
      { name: 'Cedro yakisugi', detail: 'Fachadas de madera carbonizada de forma artesanal.', swatch: '#2b2622' },
      { name: 'Piedra volcánica', detail: 'Pisos de recinto negro con acabado flameado.', swatch: '#3e3d3b' },
      { name: 'Encino blanco', detail: 'Plafones y carpintería interior.', swatch: '#b59c7c' },
    ],
    plan: {
      width: 28,
      depth: 20,
      rooms: [
        { id: 'estancia', name: 'Estancia', rect: [0, 0, 11, 8], note: 'Chimenea de doble cara' },
        { id: 'patio', name: 'Patio central', rect: [11, 0, 7, 8], note: 'Liquidámbar de 12 m', outdoor: true },
        { id: 'cocina', name: 'Cocina y comedor', rect: [18, 0, 10, 8], note: 'Abierta al jardín' },
        { id: 'suite', name: 'Suite principal', rect: [0, 8, 10, 12], note: 'Sauna y vestidor' },
        { id: 'rec2', name: 'Recámara 2', rect: [10, 8, 6, 12], note: 'Vista al bosque' },
        { id: 'rec3', name: 'Recámaras 3 y 4', rect: [16, 8, 12, 12], note: 'Baño compartido' },
      ],
    },
    tone: '#2b2723',
  },
  {
    slug: 'loft-travertino',
    name: 'Loft Travertino',
    type: 'Loft',
    city: 'Monterrey',
    district: 'San Pedro Garza García',
    price: 18_900_000,
    area: 196,
    terrace: 24,
    bedrooms: 2,
    bathrooms: 2,
    parking: 2,
    level: 'Piso 14',
    year: 2024,
    architect: 'Arquitectura Mireles',
    tagline: 'Una planta libre de 6 metros de altura frente a la Sierra Madre.',
    intro:
      'Antes fue una bodega industrial. Hoy es un loft de techos altos con un mezzanine de acero que flota sobre la cocina, con la Sierra Madre enmarcada en cada ventana.',
    story: [
      'Se conservó la estructura de concreto original y se añadió un único material nuevo: travertino en pisos, cocina y baños.',
      'El mezzanine alberga la recámara principal y se sostiene de cuatro tensores de acero, sin columnas en la planta baja.',
    ],
    cover: { id: '1600585152220-90363fe7e115', alt: 'Cocina de planta libre con bancos altos', caption: 'Cocina bajo el mezzanine' },
    gallery: [
      { id: '1600121848594-d8644e57abab', alt: 'Estancia en tonos grises con muebles bajos', caption: 'Estancia' },
      { id: '1600210491369-e753d80a41f3', alt: 'Sala blanca con obra de arte en muro', caption: 'Muro de exposición' },
      { id: '1586023492125-27b2c045efd7', alt: 'Rincón de lectura con sillón amarillo', caption: 'Rincón de lectura' },
      { id: '1595526114035-0d45ed16cfbf', alt: 'Recámara luminosa con cama baja', caption: 'Recámara en mezzanine' },
      { id: '1600489000022-c2086d79f9d4', alt: 'Cocina oscura con barra', caption: 'Barra de desayuno' },
    ],
    amenities: ['Techos de 6 m de altura', 'Mezzanine suspendido de acero', 'Terraza con vista a la Sierra Madre', 'Roof garden y alberca comunitaria', 'Coworking en planta baja'],
    finishes: [
      { name: 'Travertino Navona', detail: 'Pisos, barra y baños en un solo material.', swatch: '#d7cbb6' },
      { name: 'Acero pavonado', detail: 'Escalera, barandal y tensores del mezzanine.', swatch: '#34383b' },
      { name: 'Concreto original', detail: 'Columnas y losa restauradas y selladas.', swatch: '#9a9893' },
    ],
    plan: {
      width: 18,
      depth: 12,
      rooms: [
        { id: 'estancia', name: 'Estancia', rect: [0, 0, 9, 7], note: 'Doble altura de 6 m' },
        { id: 'cocina', name: 'Cocina', rect: [9, 0, 9, 7], note: 'Bajo el mezzanine' },
        { id: 'rec', name: 'Recámara de huéspedes', rect: [0, 7, 7, 5], note: 'Baño completo' },
        { id: 'bano', name: 'Baño', rect: [7, 7, 4, 5], note: 'Travertino de piso a techo' },
        { id: 'terraza', name: 'Terraza', rect: [11, 7, 7, 5], note: 'Vista a la sierra', outdoor: true },
      ],
    },
    tone: '#d7cbb6',
  },
  {
    slug: 'departamento-cenit',
    name: 'Departamento Cenit',
    type: 'Departamento',
    city: 'Ciudad de México',
    district: 'Lomas de Chapultepec',
    price: 24_500_000,
    area: 235,
    terrace: 38,
    bedrooms: 3,
    bathrooms: 3,
    parking: 3,
    level: 'Piso 18',
    year: 2026,
    architect: 'Taller Ferrer Solana',
    tagline: 'Tres recámaras en esquina, con luz por dos fachadas a toda hora.',
    intro:
      'Cenit ocupa la esquina nororiente del piso 18. La planta en L abre la zona social hacia el bosque de Chapultepec y deja las recámaras hacia la calma del oriente.',
    story: [
      'Las ventanas de esquina, sin columna, se lograron con una losa en voladizo de cuatro metros.',
      'Entrega prevista en marzo de 2026, con posibilidad de elegir entre dos paletas de acabados.',
    ],
    cover: { id: '1515263487990-61b07816b324', alt: 'Fachada oscura de edificio residencial con balcones', caption: 'La torre en Lomas' },
    gallery: [
      { id: '1616486338812-3dadae4b4ace', alt: 'Sala luminosa con sofá curvo', caption: 'Sala en esquina' },
      { id: '1631049307264-da0ec9d70304', alt: 'Recámara con cabecera tapizada', caption: 'Recámara principal' },
      { id: '1604014237800-1c9102c219da', alt: 'Comedor con mesa de madera', caption: 'Comedor' },
      { id: '1600566752355-35792bedcfea', alt: 'Interior contemporáneo con luz natural', caption: 'Estancia familiar' },
      { id: '1545324418-cc1a3fa10c00', alt: 'Edificio de departamentos contra el cielo', caption: 'Fachada oriente' },
    ],
    amenities: ['Ventanas de esquina sin columna', 'Gimnasio y alberca semiolímpica', 'Ludoteca y jardín', 'Bodega privada', 'Pet spa'],
    finishes: [
      { name: 'Roble europeo', detail: 'Duela de ingeniería en espiga.', swatch: '#b8946a' },
      { name: 'Mármol Calacatta', detail: 'Cubiertas de cocina y baño principal.', swatch: '#ece9e3' },
      { name: 'Aluminio champaña', detail: 'Cancelería de alto desempeño térmico.', swatch: '#b9ab92' },
    ],
    plan: {
      width: 20,
      depth: 14,
      rooms: [
        { id: 'sala', name: 'Sala y comedor', rect: [0, 0, 11, 7], note: 'Ventana de esquina de 11 m' },
        { id: 'cocina', name: 'Cocina', rect: [11, 0, 5, 7], note: 'Cocina abierta con desayunador' },
        { id: 'terraza', name: 'Terraza', rect: [16, 0, 4, 7], note: 'Vista al bosque', outdoor: true },
        { id: 'suite', name: 'Recámara principal', rect: [0, 7, 8, 7], note: 'Vestidor y baño' },
        { id: 'rec2', name: 'Recámara 2', rect: [8, 7, 6, 7], note: 'Baño completo' },
        { id: 'rec3', name: 'Recámara 3', rect: [14, 7, 6, 7], note: 'Baño completo' },
      ],
    },
    tone: '#39434a',
  },
  {
    slug: 'villa-sal',
    name: 'Villa Sal',
    type: 'Residencia',
    city: 'Tulum',
    district: 'Aldea Zamá',
    price: 33_600_000,
    area: 390,
    terrace: 210,
    bedrooms: 3,
    bathrooms: 4,
    parking: 2,
    level: 'Dos niveles en la selva',
    year: 2025,
    architect: 'Arquitectura Mireles',
    tagline: 'Una casa de patios, donde la selva entra por el techo.',
    intro:
      'Villa Sal se organiza alrededor de tres patios abiertos. La alberca atraviesa la planta baja y separa la zona social de las recámaras.',
    story: [
      'Los muros son de block de piedra caliza local y se dejaron sin pintar para que envejezcan con la humedad.',
      'Una terraza en la azotea, por encima del dosel de la selva, permite ver el mar a cuatro kilómetros.',
    ],
    cover: { id: '1582268611958-ebfd161ef9cf', alt: 'Casa contemporánea con alberca y fachada de cristal', caption: 'Patio de la alberca' },
    gallery: [
      { id: '1580587771525-78b9dba3b914', alt: 'Casa moderna con volúmenes blancos', caption: 'Fachada principal' },
      { id: '1600210491892-03d54c0aaf87', alt: 'Estancia blanca con ventanas en arco', caption: 'Estancia con arcos' },
      { id: '1600566753376-12c8ab7fb75b', alt: 'Casa iluminada al anochecer', caption: 'Al anochecer' },
      { id: '1600607688969-a5bfcd646154', alt: 'Casa entre árboles con terraza', caption: 'Terraza entre la vegetación' },
      { id: '1600566753190-17f0baa2a6c3', alt: 'Fachada con luz cálida al atardecer', caption: 'Acceso' },
    ],
    amenities: ['Alberca que cruza la casa', 'Rooftop con vista al mar', 'Temazcal', 'Cocina exterior', 'Servicio de administración para renta vacacional'],
    finishes: [
      { name: 'Piedra caliza', detail: 'Muros de block de piedra local sin aplanado.', swatch: '#cfc4ad' },
      { name: 'Chukum', detail: 'Alberca y regaderas exteriores.', swatch: '#d1c2a4' },
      { name: 'Tzalam', detail: 'Celosías y puertas de madera tropical.', swatch: '#6b4a32' },
    ],
    plan: {
      width: 24,
      depth: 16,
      rooms: [
        { id: 'estancia', name: 'Estancia', rect: [0, 0, 10, 7], note: 'Abierta a dos patios' },
        { id: 'alberca', name: 'Alberca', rect: [10, 0, 4, 16], note: 'Cruza toda la casa', outdoor: true },
        { id: 'cocina', name: 'Cocina', rect: [0, 7, 10, 9], note: 'Cocina abierta y comedor' },
        { id: 'suite', name: 'Suite principal', rect: [14, 0, 10, 8], note: 'Regadera exterior' },
        { id: 'rec', name: 'Recámaras 2 y 3', rect: [14, 8, 10, 8], note: 'Patio compartido' },
      ],
    },
    tone: '#cfc4ad',
  },
];

export const getProperty = (slug: string) => properties.find((p) => p.slug === slug);

export const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export const formatMillions = (n: number) =>
  `${new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(n / 1_000_000)} millones`;

export const cities = [...new Set(properties.map((p) => p.city))];
export const types = [...new Set(properties.map((p) => p.type))] as PropertyType[];
