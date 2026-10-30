// Los 9 pacientes simulados (y su médico). Cada perfil ejercita una parte
// distinta del producto: adherencia, semáforo, comidas con foto, solo orina,
// edición/borrado, invitación rechazada, seguimiento archivado…
//
// Los días son índices del mes virtual (0 = primer día, 29 = hoy).

import type { FoodTrackingConfig } from '../../src/lib/food.ts';

export type EntryTypeMode = 'both' | 'poop_only' | 'urine_only' | 'none';

export interface Persona {
  key: string;
  name: string;
  /** Qué parte del producto pone a prueba. */
  role: string;
  invite: { respond: 'accept' | 'reject'; day: number };
  /** Configuración que el médico guarda en el vínculo ese día (MW → savePatientConfig). */
  doctorConfig?: {
    day: number;
    entryTypeMode?: EntryTypeMode;
    food?: Partial<Pick<FoodTrackingConfig, 'frequency' | 'reminders'>> & { enabled: true };
    semaforo?: { green: number; red: number };
    tags?: string[];
  };
  /** El médico archiva el seguimiento ese día (doctor_unlinked). */
  archiveDay?: number;
  /** Último día en que registra (abandono). */
  lastActiveDay?: number;
  /** Probabilidad de no registrar nada un día. */
  skipProb: number;
  poop?: {
    perDay: [number, number];
    /** Bristol por tramo de días: el primero cuyo `until` cubre el día. */
    bristol: { until: number; values: number[] }[];
    symptomsProb: number;
    symptoms: string[];
    durations: ('short' | 'medium' | 'long')[];
  };
  urine?: { perDay: [number, number]; nightProb: number; urgency: [number, number]; leakProb: number };
  meals?: { prob: number; photoProb: number };
  /** Comportamiento de "corrige registros": editar, borrar, reenviar (reintento offline). */
  fixes?: { editProb: number; deleteProb: number; resendProb: number };
  /** Registra un token de push (Expo) al entrar en la app. */
  push: boolean;
}

export const DOCTOR = {
  key: 'doctor',
  name: 'Dra. Simulación',
  center: 'Consulta Simulada',
  specialty: 'Digestivo',
};

const NORMAL_BRISTOL = [{ until: 99, values: [3, 4, 4, 4, 5] }];

export const PERSONAS: Persona[] = [
  {
    key: 'laura',
    name: 'Laura Constante',
    role: 'Adherente: registra a diario y sigue la pauta de comidas con fotos',
    invite: { respond: 'accept', day: 0 },
    doctorConfig: {
      day: 1,
      food: {
        enabled: true,
        frequency: { type: 'all_meals', daily_target: 3, meals: ['breakfast', 'lunch', 'dinner'] },
      },
      tags: ['SII'],
    },
    skipProb: 0,
    poop: { perDay: [1, 2], bristol: NORMAL_BRISTOL, symptomsProb: 0.1, symptoms: ['gases', 'bloating'], durations: ['short', 'medium'] },
    meals: { prob: 0.95, photoProb: 0.3 },
    push: true,
  },
  {
    key: 'marcos',
    name: 'Marcos Olvidadizo',
    role: 'Se salta días al azar: semáforo variable y huecos en la línea temporal',
    invite: { respond: 'accept', day: 0 },
    skipProb: 0.45,
    poop: { perDay: [1, 1], bristol: NORMAL_BRISTOL, symptomsProb: 0.05, symptoms: ['gases'], durations: ['short', 'medium'] },
    push: true,
  },
  {
    key: 'carmen',
    name: 'Carmen Abandona',
    role: 'Deja de registrar el día 9: semáforo rojo y aviso de inactividad',
    invite: { respond: 'accept', day: 0 },
    lastActiveDay: 9,
    skipProb: 0.1,
    poop: { perDay: [1, 2], bristol: NORMAL_BRISTOL, symptomsProb: 0.1, symptoms: ['abdominal_pain'], durations: ['medium'] },
    push: true,
  },
  {
    key: 'javier',
    name: 'Javier Brote',
    role: 'Brote de diarrea (Bristol 6-7, varias al día, síntomas) entre los días 5 y 15',
    invite: { respond: 'accept', day: 1 },
    skipProb: 0.05,
    poop: {
      perDay: [2, 5],
      bristol: [{ until: 4, values: [4, 5] }, { until: 15, values: [6, 7, 7] }, { until: 99, values: [4, 5, 5] }],
      symptomsProb: 0.6,
      symptoms: ['abdominal_pain', 'cramp', 'mucus', 'gases', 'fever'],
      durations: ['short'],
    },
    push: true,
  },
  {
    key: 'elena',
    name: 'Elena Estreñida',
    role: 'Estreñimiento (Bristol 1-2 cada 2-3 días) con umbrales de semáforo propios',
    invite: { respond: 'accept', day: 2 },
    doctorConfig: { day: 3, semaforo: { green: 3, red: 5 }, tags: ['Estreñimiento'] },
    skipProb: 0.6,
    poop: { perDay: [1, 1], bristol: [{ until: 99, values: [1, 2, 2, 3] }], symptomsProb: 0.5, symptoms: ['bloating', 'laxative_use', 'rectal_pain'], durations: ['long', 'long', 'medium'] },
    push: false,
  },
  {
    key: 'pablo',
    name: 'Pablo Urología',
    role: 'Solo micciones (entry_type_mode urine_only), con nocturia y escapes',
    invite: { respond: 'accept', day: 0 },
    doctorConfig: { day: 1, entryTypeMode: 'urine_only', tags: ['Urología'] },
    skipProb: 0.1,
    urine: { perDay: [4, 8], nightProb: 0.6, urgency: [2, 5], leakProb: 0.15 },
    push: true,
  },
  {
    key: 'sofia',
    name: 'Sofía Corrige',
    role: 'Edita y borra registros y reenvía el mismo registro (reintento sin conexión)',
    invite: { respond: 'accept', day: 0 },
    skipProb: 0.15,
    poop: { perDay: [1, 3], bristol: NORMAL_BRISTOL, symptomsProb: 0.15, symptoms: ['gases', 'heartburn'], durations: ['short', 'medium', 'long'] },
    urine: { perDay: [0, 2], nightProb: 0.1, urgency: [1, 3], leakProb: 0 },
    fixes: { editProb: 0.15, deleteProb: 0.1, resendProb: 0.2 },
    push: true,
  },
  {
    key: 'andres',
    name: 'Andrés Rechaza',
    role: 'Rechaza la invitación pero usa la app: el médico no debe ver nada suyo',
    invite: { respond: 'reject', day: 1 },
    skipProb: 0.2,
    poop: { perDay: [1, 2], bristol: NORMAL_BRISTOL, symptomsProb: 0, symptoms: [], durations: ['medium'] },
    push: true,
  },
  {
    key: 'lucia',
    name: 'Lucía Archivada',
    role: 'El médico archiva su seguimiento el día 15: solo ve lo anterior y no hay avisos',
    invite: { respond: 'accept', day: 0 },
    archiveDay: 15,
    skipProb: 0.1,
    poop: { perDay: [1, 2], bristol: NORMAL_BRISTOL, symptomsProb: 0.05, symptoms: ['gases'], durations: ['medium'] },
    push: true,
  },
];
