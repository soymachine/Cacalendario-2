// Bristol Stool Scale - 7 types
// https://en.wikipedia.org/wiki/Bristol_stool_scale

export interface BristolType {
  type: number;       // 1-7
  emoji: string;
  label: string;
  description: string;
  color: string;       // bar color for charts
}

export const BRISTOL_SCALE: BristolType[] = [
  {
    type: 1,
    emoji: '🫘',
    label: 'Tipo 1',
    description: 'Trozos duros separados',
    color: '#8B4513',
  },
  {
    type: 2,
    emoji: '🪵',
    label: 'Tipo 2',
    description: 'En forma de salchicha grumosa',
    color: '#6B3410',
  },
  {
    type: 3,
    emoji: '🌭',
    label: 'Tipo 3',
    description: 'Salchicha con grietas',
    color: '#A0522D',
  },
  {
    type: 4,
    emoji: '🍌',
    label: 'Tipo 4',
    description: 'Suave y lisa como serpiente',
    color: '#DAA520',
  },
  {
    type: 5,
    emoji: '🫧',
    label: 'Tipo 5',
    description: 'Trozos blandos con bordes',
    color: '#CD853F',
  },
  {
    type: 6,
    emoji: '☁️',
    label: 'Tipo 6',
    description: 'Pastosa y blanda',
    color: '#D2B48C',
  },
  {
    type: 7,
    emoji: '💧',
    label: 'Tipo 7',
    description: 'Completamente líquida',
    color: '#DEB887',
  },
];

export function getBristolType(type: number | null | undefined): BristolType | null {
  if (!type || type < 1 || type > 7) return null;
  return BRISTOL_SCALE[type - 1];
}

export function getBristolHealthLabel(type: number): string {
  if (type <= 2) return 'Estreñimiento';
  if (type <= 5) return 'Normal';
  return 'Diarrea';
}

export function getBristolHealthColor(type: number): string {
  if (type <= 2) return '#c0392b';
  if (type <= 5) return '#27ae60';
  return '#e67e22';
}
