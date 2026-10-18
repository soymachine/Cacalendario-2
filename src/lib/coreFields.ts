// Campos del formulario de deposición y micción que el profesional puede
// ocultar a un paciente (patient_links.hidden_fields) y tipos de registro
// permitidos (patient_links.entry_type_mode). Se usan en la configuración del
// paciente y en el modal de invitación de MW.

export type CoreSection = 'poop' | 'urine';

export interface CoreField {
  id: string;
  label: string;
  /** Título del grupo: solo en el primer campo de cada sección. */
  group: string | null;
  section: CoreSection;
}

export const CORE_FIELDS: CoreField[] = [
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

/** 'none' = no registra deposiciones ni micciones (solo comida). */
export type EntryTypeMode = 'both' | 'poop_only' | 'urine_only' | 'none';

/** Campos visibles en la configuración según el tipo de registro permitido. */
export function coreFieldsFor(mode: string): CoreField[] {
  if (mode === 'none') return [];
  return CORE_FIELDS.filter((f) =>
    !(mode === 'urine_only' && f.section === 'poop') && !(mode === 'poop_only' && f.section === 'urine'));
}
