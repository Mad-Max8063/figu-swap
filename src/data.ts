import { SafeZone, UserProfile, Sticker, CityLocation } from './types';

export const TEAMS = [
  { id: 'FWC', name: 'Intro & Estadios', prefix: 'FWC', size: 15 },
  { id: 'ARG', name: 'Argentina', prefix: 'ARG', size: 20 },
  { id: 'BRA', name: 'Brasil', prefix: 'BRA', size: 20 },
  { id: 'FRA', name: 'Francia', prefix: 'FRA', size: 20 },
  { id: 'ESP', name: 'España', prefix: 'ESP', size: 20 },
  { id: 'GER', name: 'Alemania', prefix: 'GER', size: 20 },
  { id: 'URU', name: 'Uruguay', prefix: 'URU', size: 20 },
  { id: 'MEX', name: 'México', prefix: 'MEX', size: 20 },
  { id: 'MAR', name: 'Marruecos', prefix: 'MAR', size: 20 },
  { id: 'JPN', name: 'Japón', prefix: 'JPN', size: 20 },
  { id: 'CC', name: 'Especiales Coca-Cola', prefix: 'CC', size: 14 }
];

export const STAR_PLAYERS: Record<string, Record<number, string>> = {
  ARG: {
    2: 'Emiliano Martínez',
    3: 'Nahuel Molina',
    4: 'Cristian Romero',
    5: 'Nicolás Otamendi',
    6: 'Nicolás Tagliafico',
    7: 'Leonardo Balerdi',
    8: 'Enzo Fernández',
    9: 'Alexis Mac Allister 🌟',
    10: 'Rodrigo De Paul',
    11: 'Exequiel Palacios',
    12: 'Leandro Paredes',
    14: 'Nico Paz',
    15: 'Franco Mastantuono',
    16: 'Nicolás González',
    17: 'Lionel Messi ⭐',
    18: 'Lautaro Martínez',
    19: 'Julián Álvarez',
    20: 'Giuliano Simeone'
  },
  BRA: {
    2: 'Alisson Becker',
    4: 'Marquinhos',
    5: 'Éder Militão',
    9: 'Lucas Paquetá',
    10: 'Casemiro 🌟',
    11: 'Bruno Guimarães',
    14: 'Vinícius Jr ⭐',
    15: 'Rodrygo',
    19: 'Raphinha',
    20: 'Estêvão'
  },
  FRA: {
    2: 'Mike Maignan',
    3: 'Théo Hernandez',
    4: 'William Saliba',
    5: 'Jules Koundé',
    9: 'Aurélien Tchouaméni',
    10: 'Eduardo Camavinga',
    14: 'Michael Olise',
    15: 'Ousmane Dembélé',
    20: 'Kylian Mbappé ⭐'
  },
  ESP: {
    2: 'Unai Simón',
    3: 'Robin Le Normand',
    4: 'Aymeric Laporte',
    7: 'Dani Carvajal',
    8: 'Marc Cucurella',
    11: 'Pedri 🌟',
    12: 'Fabián Ruiz',
    15: 'Lamine Yamal ⭐',
    16: 'Dani Olmo',
    17: 'Nico Williams',
    19: 'Álvaro Morata'
  },
  GER: {
    2: 'Marc-André ter Stegen',
    3: 'Jonathan Tah',
    4: 'David Raum',
    5: 'Nico Schlotterbeck',
    6: 'Antonio Rüdiger',
    10: 'Joshua Kimmich 🌟',
    11: 'Florian Wirtz ⭐',
    15: 'Jamal Musiala ⭐',
    17: 'Kai Havertz',
    18: 'Leroy Sané'
  },
  URU: {
    2: 'Sergio Rochet',
    10: 'Federico Valverde ⭐',
    11: 'Giorgian De Arrascaeta',
    12: 'Rodrigo Bentancur',
    14: 'Manuel Ugarte',
    17: 'Darwin Núñez 🌟'
  },
  CC: {
    1: 'Trofeo Copa del Mundo',
    2: 'Mascota Oficial',
    3: 'Emblema Argentina',
    4: 'Emblema Brasil',
    5: 'Emblema Francia',
    10: 'Leyenda Lionel Messi (CC-10)',
    14: 'Estadio Final (CC-14)'
  }
};

// Function to get sticker details
export function getStickerName(prefix: string, number: number): string {
  if (STAR_PLAYERS[prefix] && STAR_PLAYERS[prefix][number]) {
    return STAR_PLAYERS[prefix][number];
  }
  // Generic labels
  if (prefix === 'FWC') {
    if (number === 1) return 'Logo de la Competición';
    if (number === 2) return 'Trofeo del Mundial';
    return `Estadio N° ${number - 2}`;
  }
  if (prefix === 'CC') {
    return `Coca-Cola Especial N° ${number}`;
  }
  
  const positions = ['Portero', 'Defensor', 'Mediocampista', 'Delantero'];
  const posIndex = number % 4;
  return `${positions[posIndex]} Titular N° ${number}`;
}

// Generate complete sticker list
export const ALL_STICKERS: Sticker[] = TEAMS.flatMap(team => {
  return Array.from({ length: team.size }, (_, i) => {
    const num = i + 1;
    const isSpecial = team.id === 'CC' || num === 10 || num === 1;
    return {
      id: `${team.prefix}-${num}`,
      team: team.name,
      number: num,
      name: getStickerName(team.prefix, num),
      isSpecial
    };
  });
});

export const SAFE_ZONES: SafeZone[] = [
  {
    id: 'sz-1',
    city: 'CABA',
    name: 'Parque Rivadavia (Caballito)',
    address: 'Av. Rivadavia 4800, CABA',
    coordinates: { lat: -34.6186, lng: -58.4357 },
    description: 'La cuna histórica del canje en Buenos Aires. Zona hiper concurrida los fines de semana bajo la arboleda.'
  },
  {
    id: 'sz-2',
    city: 'CABA',
    name: 'Parque Centenario (Caballito)',
    address: 'Av. Díaz Vélez 4800, CABA',
    coordinates: { lat: -34.6072, lng: -58.4348 },
    description: 'Punto oficial de canje junto al lago artificial. Presencia policial preventiva y gran concurrencia.'
  },
  {
    id: 'sz-3',
    city: 'CABA',
    name: 'Parque Chacabuco (Chacabuco)',
    address: 'Av. Asamblea y Emilio Mitre, CABA',
    coordinates: { lat: -34.6322, lng: -58.4411 },
    description: 'Zona segura al aire libre cerca de la estación de subte E. Ideal para tardes familiares.'
  },
  {
    id: 'sz-4',
    city: 'Rosario',
    name: 'CC Roberto Fontanarrosa (Mesa Mundialista)',
    address: 'San Martín 1080, Rosario',
    coordinates: { lat: -32.9479, lng: -60.6393 },
    description: 'Espacio cultural techado habilitado por el municipio sanlorencino. Mesas exclusivas de canje.'
  },
  {
    id: 'sz-5',
    city: 'Rosario',
    name: 'Puerto Joven (Costanera)',
    address: 'Av. Belgrano 950, Rosario',
    coordinates: { lat: -32.9461, lng: -60.6277 },
    description: 'Lugar abierto de gran visibilidad junto al Monumento a la Bandera. Punto seguro con guardias.'
  },
  {
    id: 'sz-6',
    city: 'Córdoba',
    name: 'Wöllen (Humberto Primo 630)',
    address: 'Humberto Primo 630, Córdoba',
    coordinates: { lat: -31.4086, lng: -64.1843 },
    description: 'Cafetería y heladería premium certificada. Mesas abiertas para coleccionistas con seguridad privada.'
  }
];

export const MOCK_REVIEWS: Record<string, any[]> = {
  u1: [
    { id: 'r1', reviewerName: 'Gonzalo Rossi', rating: 5, comment: 'Excelente intercambio en Parque Rivadavia. Súper puntual.', date: '2026-05-12' },
    { id: 'r2', reviewerName: 'Mariana Costa', rating: 4, comment: 'Todo bien, cambiamos 15 figuritas. Muy honesto.', date: '2026-05-18' }
  ],
  u2: [
    { id: 'r3', reviewerName: 'Esteban Lopez', rating: 5, comment: 'Intercambio súper seguro en Wöllen Córdoba, muy recomendado!', date: '2026-05-15' }
  ],
  u3: [
    { id: 'r4', reviewerName: 'Florencia Diaz', rating: 5, comment: 'Cambiamos a Messi CC por dos leyendas francesas. Un genio, súper confiable.', date: '2026-05-20' }
  ],
  u4: [
    { id: 'r5', reviewerName: 'Lucas Perez', rating: 3, comment: 'Llegó un poco tarde al CC Fontanarrosa pero las figuritas estaban en perfecto estado.', date: '2026-05-10' }
  ]
};

export const MOCK_COLLECTORS: UserProfile[] = [
  {
    uid: 'u2',
    displayName: 'Carlos "La Scaloneta" Gómez',
    email: 'carlos.scale@gmail.com',
    city: 'CABA',
    neighborhood: 'Almagro',
    reputation: 4.8,
    verified: true,
    bio: 'Coleccionando desde el Mundial 98. Cambios de canje seguro únicamente en Parque Centenario.',
    reviewsCount: 12,
    reviews: MOCK_REVIEWS.u1,
    stickerCounts: { tengo: 640, falta: 354, repetida: 45 },
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop'
  },
  {
    uid: 'u3',
    displayName: 'Sofía Fernandez',
    email: 'sofi.stickers@yahoo.com',
    city: 'Córdoba',
    neighborhood: 'Nueva Córdoba',
    reputation: 4.9,
    verified: true,
    bio: 'Faltan pocas de Europa! Nos juntamos en Wöllen Córdoba los miércoles y sábados.',
    reviewsCount: 4,
    reviews: MOCK_REVIEWS.u2,
    stickerCounts: { tengo: 820, falta: 174, repetida: 82 },
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop'
  },
  {
    uid: 'u4',
    displayName: 'Juan Cruz "RosarioCentral" Diotti',
    email: 'juancruz.r@hotmail.com',
    city: 'Rosario',
    neighborhood: 'Pichincha',
    reputation: 4.2,
    verified: false,
    bio: 'Buscando las especiales de Coca-Cola y el escudo de Rosario. CC Fontanarrosa o Costanera puerto.',
    reviewsCount: 3,
    reviews: MOCK_REVIEWS.u4,
    stickerCounts: { tengo: 450, falta: 544, repetida: 29 },
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop'
  },
  {
    uid: 'u5',
    displayName: 'Matias Rodriguez (Pibe Figus)',
    email: 'matiaspibe@gmail.com',
    city: 'CABA',
    neighborhood: 'Caballito',
    reputation: 5.0,
    verified: true,
    bio: 'Tengo a Messi duplicada! Busco repetidas raras del Grupo C y F. Solo Parque Rivadavia!',
    reviewsCount: 22,
    reviews: MOCK_REVIEWS.u3,
    stickerCounts: { tengo: 710, falta: 284, repetida: 62 },
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop'
  }
];
