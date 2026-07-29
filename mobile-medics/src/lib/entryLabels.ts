// Portado de src/components/MedicsPanel.tsx (constantes de etiquetado) —
// mantener sincronizado a mano.
export const FLOATS_LABEL: Record<string, string> = { floats: 'Flota', sinks: 'Hunde', both: 'Flota y hunde' };
export const DURATION_LABEL: Record<string, string> = { short: '< 3 min', medium: '3–5 min', long: '> 5 min' };
export const SYMPTOM_LABEL: Record<string, string> = {
  abdominal_pain: 'Dolor abdominal', bloating: 'Hinchazón', heartburn: 'Ardor', cramp: 'Calambre',
  rectal_pain: 'Dolor rectal', blood: 'Sangre', mucus: 'Moco', smelly: 'Maloliente',
  sticky: 'Pegajoso', stringy: 'Filamentoso', undigested: 'No digerido',
};
export const URINE_TYPE_LABEL: Record<string, string> = {
  voluntary: 'Voluntaria', involuntary_escape: 'Escape', involuntary_drip: 'Goteo',
};
export const URINE_CHAR_LABEL: Record<string, string> = {
  blood: 'Sangre', odor: 'Olor', pain: 'Dolor',
};
export const BRISTOL_LABEL: Record<number, string> = {
  1: 'Separados duros', 2: 'Grumoso duro', 3: 'Fisurado',
  4: 'Suave (ideal)', 5: 'Blandos', 6: 'Pastoso', 7: 'Líquido',
};

export const ENTRY_TYPE_FIELDS: { id: string; label: string; group: string | null; section: 'poop' | 'urine' }[] = [
  { id: 'bristol', label: 'Bristol', group: 'Deposición', section: 'poop' },
  { id: 'color', label: 'Color', group: null, section: 'poop' },
  { id: 'floats', label: 'Flotación', group: null, section: 'poop' },
  { id: 'quantity', label: 'Cantidad', group: null, section: 'poop' },
  { id: 'duration', label: 'Duración', group: null, section: 'poop' },
  { id: 'symptoms', label: 'Síntomas', group: null, section: 'poop' },
  { id: 'urine_type', label: 'Tipo de micción', group: 'Micción', section: 'urine' },
  { id: 'urine_quantity', label: 'Cantidad (ml)', group: null, section: 'urine' },
  { id: 'urine_color', label: 'Color', group: null, section: 'urine' },
  { id: 'urine_characteristics', label: 'Características', group: null, section: 'urine' },
];
