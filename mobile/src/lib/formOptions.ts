// Shared clinical form options for RegisterScreen and EditScreen
// (the web app duplicates these constants in both screens).

export const FLOAT_OPTIONS = [
  { label: 'Flota', value: 'floats' as const, img: require('../assets/Flota_2.png') },
  { label: 'No flota', value: 'sinks' as const, img: require('../assets/Flota_1.png') },
  { label: 'Ambos', value: 'both' as const, img: require('../assets/Flota_3.png') },
];

export const COLOR_OPTIONS = [
  { hex: '#1A1A1A', label: 'Negro' },
  { hex: '#3B1F0E', label: 'Marrón oscuro' },
  { hex: '#7B4226', label: 'Marrón' },
  { hex: '#C4844A', label: 'Marrón claro' },
  { hex: '#D4B84A', label: 'Amarillo' },
  { hex: '#C0392B', label: 'Rojo' },
  { hex: '#9E9E9E', label: 'Gris' },
  { hex: '#F5F5F5', label: 'Blanco' },
];

export const URINE_COLOR_OPTIONS = [
  { hex: '#FDFBEA', label: 'Muy clara' },
  { hex: '#FFF59D', label: 'Pálida' },
  { hex: '#FFE033', label: 'Amarillo claro' },
  { hex: '#FFC107', label: 'Amarillo' },
  { hex: '#FF8F00', label: 'Ámbar' },
  { hex: '#5D4037', label: 'Marrón oscuro' },
  { hex: '#E53935', label: 'Rojizo' },
];

export const URINE_TYPE_OPTIONS = [
  { label: 'Voluntaria', value: 'voluntary' as const },
  { label: 'Escape sin aviso', value: 'involuntary_escape' as const },
  { label: 'Goteo continuo', value: 'involuntary_drip' as const },
];

export const URINE_CHARACTERISTICS = [
  { key: 'blood', label: 'Sangre' },
  { key: 'odor', label: 'Olor' },
  { key: 'pain', label: 'Dolor' },
  { key: 'turbid', label: 'Turbio' },
];

export const DURATION_OPTIONS = [
  { label: '<3 min', value: 'short' as const },
  { label: '3-5 min', value: 'medium' as const },
  { label: '>5 min', value: 'long' as const },
];

export const FECES_TEXTURE_OPTIONS = [
  { label: 'Dura/Seca', value: 'hard' as const },
  { label: 'Normal', value: 'normal' as const },
  { label: 'Blanda', value: 'soft' as const },
  { label: 'Suelta', value: 'loose' as const },
  { label: 'Líquida', value: 'liquid' as const },
  { label: 'Aceitosa', value: 'oily' as const },
];

export const SYMPTOMS = [
  { key: 'abdominal_pain', label: 'Dolor abdominal' },
  { key: 'bloating', label: 'Hinchazón' },
  { key: 'heartburn', label: 'Ardor' },
  { key: 'cramp', label: 'Calambre' },
  { key: 'rectal_pain', label: 'Dolor rectal' },
  { key: 'blood', label: 'Sangre' },
  { key: 'mucus', label: 'Moco' },
  { key: 'smelly', label: 'Maloliente' },
  { key: 'sticky', label: 'Pegajoso' },
  { key: 'stringy', label: 'Filamentoso' },
  { key: 'undigested', label: 'No digerido' },
  { key: 'gases', label: 'Gases' },
  { key: 'laxative_use', label: 'Uso de laxantes' },
  { key: 'astringent_agents', label: 'Agentes astringentes' },
  { key: 'fever', label: 'Fiebre' },
];
