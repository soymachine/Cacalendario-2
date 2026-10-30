// Agentes simulados: cada uno con su propia sesión de Supabase (clave pública
// + login), haciendo las MISMAS llamadas que las apps. Así pasan por RLS,
// triggers y RPCs exactamente igual que un usuario real.
//
//   PatientAgent ↔ PA (mobile/): auth.tsx, sync.ts, foodPhotos.ts, push.ts, InviteModal
//   DoctorAgent  ↔ MW/MA (src/components/MedicsPanel.tsx, mobile-medics/src/lib/patients.ts)
//   Admin        ↔ solo el arnés (service_role): crear cuentas sin correo y
//                  ajustar fechas del servidor al reloj virtual. Nunca lo usa una app.
//
// Si cambia una de esas llamadas en las apps, cámbiala aquí también.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { foodPhotoPath, linkFoodConfig, patientDaysSinceLast } from '../../src/lib/food.ts';
import type { SimEntry } from './scenario.ts';

export interface SimEnv {
  url: string;
  anonKey: string;
  serviceKey: string;
}

const PASSWORD = 'sim-Password-123!';

function client(env: SimEnv, key: string): SupabaseClient {
  return createClient(env.url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Error de PostgREST/Auth convertido en excepción con contexto. */
function must<T>(what: string, res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data as T;
}

abstract class Agent {
  readonly sb: SupabaseClient;
  readonly email: string;
  userId = '';
  constructor(env: SimEnv, email: string) {
    this.sb = client(env, env.anonKey);
    this.email = email;
  }

  async signIn(): Promise<void> {
    const res = await this.sb.auth.signInWithPassword({ email: this.email, password: PASSWORD });
    if (res.error) throw new Error(`signIn ${this.email}: ${res.error.message}`);
    this.userId = res.data.user.id;
  }
}

// ── Paciente (PA) ─────────────────────────────────────────────────────────────

export class PatientAgent extends Agent {
  /** auth.tsx → signUp (sin is_doctor). */
  async signUp(): Promise<void> {
    must('signUp ' + this.email, await this.sb.auth.signUp({ email: this.email, password: PASSWORD }));
    await this.signIn();
  }

  /** InviteModal → patient_get_pending_invites. */
  async pendingInvites(): Promise<{ id: string; doctor_name: string; center_name: string }[]> {
    return must('patient_get_pending_invites', await this.sb.rpc('patient_get_pending_invites'));
  }

  /** InviteModal → patient_respond_to_invite. */
  async respondToInvite(linkId: string, accept: boolean): Promise<{ success: boolean; error?: string }> {
    return must('patient_respond_to_invite', await this.sb.rpc('patient_respond_to_invite', { p_link_id: linkId, p_accept: accept }));
  }

  /** push.ts → claim_push_subscription con un token de Expo. */
  async registerPush(): Promise<void> {
    const subscription = { type: 'expo', token: `ExponentPushToken[sim-${this.userId.slice(0, 8)}]`, platform: 'ios', timezone: 'Europe/Madrid' };
    must('claim_push_subscription', await this.sb.rpc('claim_push_subscription', { p_subscription: subscription }));
  }

  /** foodPhotos.ts → uploadFoodPhoto (JPEG, upsert). Devuelve la ruta. */
  async uploadPhoto(entryId: string): Promise<string> {
    const path = foodPhotoPath(this.userId, entryId);
    must('upload food photo', await this.sb.storage.from('food-photos').upload(path, TINY_JPEG, { contentType: 'image/jpeg', upsert: true }));
    return path;
  }

  /** sync.ts → saveEntryToCloud (misma fila y mismo onConflict). */
  async saveEntry(entry: SimEntry, photoPath: string | null = null): Promise<void> {
    must('saveEntryToCloud', await this.sb.from('entries').upsert(entryRow(this.userId, entry, photoPath), { onConflict: 'user_id,entry_id' }));
  }

  /** sync.ts → deleteEntryFromCloud. */
  async deleteEntry(entryId: string): Promise<void> {
    must('deleteEntryFromCloud', await this.sb.from('entries').delete().eq('user_id', this.userId).eq('entry_id', entryId));
  }

  /** sync.ts → fetchAllCloudEntries (paginado como la app). */
  async fetchOwnEntries(): Promise<Record<string, unknown>[]> {
    const all: Record<string, unknown>[] = [];
    for (let from = 0; ; from += 500) {
      const page = must('fetchAllCloudEntries', await this.sb.from('entries').select('*').eq('user_id', this.userId)
        .order('timestamp', { ascending: true }).range(from, from + 499));
      all.push(...page);
      if (page.length < 500) return all;
    }
  }
}

/** Fila que escribe saveEntryToCloud (mobile/src/lib/sync.ts). */
export function entryRow(userId: string, e: SimEntry, photoPath: string | null) {
  return {
    user_id: userId,
    entry_id: e.id,
    date: e.date,
    time: e.time,
    notes: e.notes,
    timestamp: e.timestamp,
    entry_type: e.entry_type,
    bristol: e.bristol,
    floats: e.floats,
    color: e.color,
    quantity: e.quantity,
    duration: e.duration,
    feces_texture: e.feces_texture,
    symptoms: e.symptoms,
    urine_type: e.urine_type,
    urine_quantity: e.urine_quantity,
    urine_color: e.urine_color,
    urine_characteristics: e.urine_characteristics,
    urine_urgency: e.urine_urgency,
    during_sleep: e.during_sleep,
    ...(e.entry_type === 'food' ? {
      food_meal_type: e.food_meal_type,
      food_description: e.food_description,
      food_portion: e.food_portion,
      food_tags: e.food_tags,
      food_photo_path: photoPath,
    } : {}),
  };
}

// ── Médico (MW / MA) ──────────────────────────────────────────────────────────

export interface DoctorPatientView {
  linkId: string;
  patientId: string | null;
  email: string | null;
  status: string;
  archived: boolean;
  lastEntryDate: string | null;
  daysSinceLast: number | null;
  link: Record<string, unknown>;
}

export class DoctorAgent extends Agent {
  /** mobile-medics auth.tsx → signUp con is_doctor + datos del centro. */
  async signUp(name: string, center: string, specialty: string): Promise<void> {
    must('signUp ' + this.email, await this.sb.auth.signUp({
      email: this.email,
      password: PASSWORD,
      options: { data: { is_doctor: true, name, center_name: center, specialty } },
    }));
    await this.signIn();
  }

  /** MedicsPanel bootstrap → doctor_self_register + lectura del perfil. */
  async bootstrap(name: string, center: string, specialty: string): Promise<Record<string, unknown>> {
    must('doctor_self_register', await this.sb.rpc('doctor_self_register', { p_name: name, p_center_name: center, p_specialty: specialty }));
    return must('doctors select', await this.sb.from('doctors').select('*, centers(name, image_url)').eq('id', this.userId).single());
  }

  async profile(): Promise<Record<string, unknown>> {
    return must('doctors select', await this.sb.from('doctors').select('*').eq('id', this.userId).single());
  }

  /** MedicsPanel → doctor_invite_patient (el correo de invitación lo manda una Edge Function aparte). */
  async invite(email: string): Promise<string> {
    const res = must<{ success: boolean; link_id?: string; error?: string }>('doctor_invite_patient',
      await this.sb.rpc('doctor_invite_patient', { p_patient_email: email }));
    if (!res.success || !res.link_id) throw new Error(`doctor_invite_patient: ${res.error}`);
    return res.link_id;
  }

  /** MedicsPanel → savePatientConfig (update del vínculo). */
  async savePatientConfig(linkId: string, patch: Record<string, unknown>): Promise<void> {
    must('savePatientConfig', await this.sb.from('patient_links').update(patch).eq('id', linkId));
  }

  /** MedicsPanel → archivar seguimiento. */
  async archive(linkId: string): Promise<void> {
    must('archive', await this.sb.from('patient_links').update({ doctor_unlinked: true, unlinked_at: new Date().toISOString() }).eq('id', linkId));
  }

  async addClinicalNote(linkId: string, note: string): Promise<void> {
    must('patient_clinical_notes insert', await this.sb.from('patient_clinical_notes').insert({ link_id: linkId, note }));
  }

  async addEntryNote(entryId: string, note: string): Promise<void> {
    must('entry_doctor_notes upsert', await this.sb.from('entry_doctor_notes')
      .upsert({ doctor_id: this.userId, entry_id: entryId, note }, { onConflict: 'doctor_id,entry_id' }));
  }

  /** Port de loadPatients (mobile-medics/src/lib/patients.ts ↔ MedicsPanel). */
  async loadPatients(): Promise<DoctorPatientView[]> {
    const links = must('patient_links select', await this.sb.from('patient_links').select('*')
      .eq('doctor_id', this.userId).order('invited_at', { ascending: false }));
    return Promise.all(links.map(async (p: Record<string, any>) => {
      let lastEntryDate: string | null = null;
      let daysSinceLast: number | null = null;
      if (p.patient_id) {
        const lastDateOf = async (type: 'core' | 'food') => {
          let q = this.sb.from('entries').select('date').eq('user_id', p.patient_id).order('date', { ascending: false }).limit(1);
          q = type === 'food' ? q.eq('entry_type', 'food') : q.neq('entry_type', 'food');
          if (p.doctor_unlinked && p.unlinked_at) q = q.lte('created_at', p.unlinked_at);
          const { data } = await q.maybeSingle();
          return (data?.date as string | undefined) ?? null;
        };
        const [lastCore, lastFood] = await Promise.all([
          lastDateOf('core'),
          linkFoodConfig(p.food_config).enabled ? lastDateOf('food') : Promise.resolve(null),
        ]);
        lastEntryDate = [lastCore, lastFood].filter((d): d is string => !!d).sort().pop() ?? null;
        daysSinceLast = patientDaysSinceLast({
          entryTypeMode: p.entry_type_mode, foodConfig: p.food_config, lastCoreDate: lastCore, lastFoodDate: lastFood,
        });
      }
      return {
        linkId: p.id, patientId: p.patient_id, email: p.patient_email, status: p.status,
        archived: !!p.doctor_unlinked, lastEntryDate, daysSinceLast, link: p,
      };
    }));
  }

  /** MedicsPanel → loadPatientDetail (registros del paciente, recortados si está archivado). */
  async patientEntries(patientId: string, unlinkedAt: string | null): Promise<Record<string, unknown>[]> {
    let q = this.sb.from('entries').select('*').eq('user_id', patientId)
      .order('date', { ascending: false }).order('time', { ascending: false });
    if (unlinkedAt) q = q.lte('created_at', unlinkedAt);
    return must('patient entries', await q);
  }

  /** FoodPhotoThumb → createSignedUrl. */
  async signedPhotoUrl(path: string): Promise<string | null> {
    const { data, error } = await this.sb.storage.from('food-photos').createSignedUrl(path, 60);
    return error ? null : data.signedUrl;
  }
}

// ── Arnés (service_role) ──────────────────────────────────────────────────────

export class Admin {
  readonly sb: SupabaseClient;
  constructor(env: SimEnv) {
    this.sb = client(env, env.serviceKey);
  }

  /**
   * Las fechas que pone el servidor (created_at, accepted_at, unlinked_at,
   * test_plan_started_at…) se mueven al reloj virtual para que lo que depende
   * del tiempo real (semáforo, avisos de inactividad, trial) vea el mes simulado.
   */
  async setColumns(table: string, match: Record<string, string>, values: Record<string, unknown>): Promise<void> {
    let q = this.sb.from(table).update(values);
    for (const [k, v] of Object.entries(match)) q = q.eq(k, v);
    must(`backdate ${table}`, await q);
  }

  /** created_at de cada registro = momento en que el paciente lo apuntó. */
  async backdateEntries(userId: string, entries: SimEntry[]): Promise<void> {
    await Promise.all(entries.map((e) => this.setColumns('entries', { user_id: userId, entry_id: e.id },
      { created_at: new Date(e.timestamp).toISOString() })));
  }

  async rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
    return must(fn, await this.sb.rpc(fn, args));
  }
}

/** JPEG válido de 1×1 px: la foto de comida más pequeña posible. */
const TINY_JPEG = Uint8Array.from(atob(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==',
), (c) => c.charCodeAt(0));
