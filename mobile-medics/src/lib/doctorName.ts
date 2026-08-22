// Cómo se llama en pantalla al profesional que usa el panel.
//
// Copia de src/lib/doctorName.ts (fuente canónica). Mantener sincronizado a
// mano: si tocas algo aquí, replícalo allá (ver CLAUDE.md).
//
// Dos motivos para no anteponer "Dr." en la interfaz:
//
//   1. Fluxia no la usan solo médicos — nutrición, enfermería o fisioterapia
//      también llevan pacientes— y el prefijo fijo, además, presupone el
//      género.
//   2. El campo `doctors.name` es libre y mucha gente escribe ahí el título
//      ("Dr Moya"), así que anteponerlo otra vez producía "Dr. Dr Moya".

const TITLE_RE = /^(?:dr|dra|d|dña|doctor|doctora|prof|profa|sr|sra)\.?\s+/i;

/** Quita el título de cortesía si el nombre lo trae escrito dentro. */
export function stripTitle(name: string | null | undefined): string {
  return (name || '').replace(TITLE_RE, '').trim();
}

/** Nombre de pila, sin título, para saludos ("Hola, Dani"). Cadena vacía si no hay nombre. */
export function professionalFirstName(name: string | null | undefined): string {
  return stripTitle(name).split(' ')[0] || '';
}
