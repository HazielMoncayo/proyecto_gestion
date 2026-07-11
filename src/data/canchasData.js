// Datos maestros de las canchas y sus subcanchas.
// Se comparte entre Estudiante y Encargado para mantener todo sincronizado.

export const canchasDemo = [
  {
    id: 'futbol-principal',
    nombre: 'Cancha de Fútbol Principal',
    ubicacion: 'Zona Deportiva A',
    capacidad: 22,
    tipo: 'Fútbol 11',
    categoria: 'futbol',
    emoji: '🏟️',
    subcanchas: [
      { id: 'fp-1', nombre: 'Cancha 1' },
      { id: 'fp-2', nombre: 'Cancha 2' },
      { id: 'fp-3', nombre: 'Cancha 3' },
    ]
  },
  {
    id: 'futbol-sala',
    nombre: 'Cancha de Fútbol Sala',
    ubicacion: 'Zona Deportiva B',
    capacidad: 14,
    tipo: 'Fútbol Sala',
    categoria: 'futbol',
    emoji: '⚽',
    subcanchas: [
      { id: 'fs-1', nombre: 'Cancha 1 · La Bombonera' },
      { id: 'multiuso-basquet-futsal', nombre: 'Cancha 2 · Multiuso' },
    ]
  },
  {
    id: 'baloncesto',
    nombre: 'Cancha de Baloncesto',
    ubicacion: 'Zona Deportiva C',
    capacidad: 10,
    tipo: 'Baloncesto',
    categoria: 'basquet',
    emoji: '🏀',
    subcanchas: [
      { id: 'bq-1', nombre: 'Cancha 1' },
      { id: 'bq-2', nombre: 'Cancha 2' },
      { id: 'multiuso-basquet-futsal', nombre: 'Cancha 3 · Multiuso' },
    ]
  },
  {
    id: 'voleibol',
    nombre: 'Cancha de Voleibol',
    ubicacion: 'Zona Deportiva D',
    capacidad: 12,
    tipo: 'Voleibol',
    categoria: 'voleibol',
    emoji: '🏐',
    subcanchas: [
      { id: 'vb-1', nombre: 'Cancha 1' },
      { id: 'vb-2', nombre: 'Cancha 2' },
      { id: 'vb-3', nombre: 'Cancha 3' },
    ]
  },
];

// Genera las horas del día, de 08:00 a 20:00, en formato "08:00 - 09:00"
// Se excluye el bloque de 13:00 - 14:00 (hora de almuerzo, no se puede reservar en la Poli)
export const generarHorasDelDia = () => {
  const horas = [];
  for (let h = 8; h <= 20; h++) {
    if (h === 13) continue;
    const inicio = `${h.toString().padStart(2, '0')}:00`;
    const fin = `${(h + 1).toString().padStart(2, '0')}:00`;
    horas.push({ inicio, fin, label: `${inicio} - ${fin}` });
  }
  return horas;
};

// Busca a qué cancha principal y subcancha pertenece un cancha_id guardado en la BD
export const buscarInfoSubcancha = (subcanchaId) => {
  for (const cancha of canchasDemo) {
    const sub = cancha.subcanchas.find(s => s.id === subcanchaId);
    if (sub) {
      return { canchaPrincipal: cancha, subcancha: sub };
    }
  }
  return null;
};

// Qué implementos se descuentan del inventario según la categoría de la cancha
export const IMPLEMENTOS_POR_CATEGORIA = {
  futbol: [
    { item_key: 'balon_futbol', cantidad: 1 }
  ],
  basquet: [
    { item_key: 'balon_basquet', cantidad: 1 },
    { item_key: 'chaleco_deportivo', cantidad: 1 }
  ],
  voleibol: [
    { item_key: 'balon_voley', cantidad: 1 },
    { item_key: 'red_voley', cantidad: 1 }
  ]
};

export const CATEGORIA_LABELS = {
  futbol: 'Fútbol',
  basquet: 'Baloncesto',
  voleibol: 'Voleibol'
};