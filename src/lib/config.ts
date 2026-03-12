export const BASE = import.meta.env.BASE_URL;

export function asset(path: string): string {
  const base = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
  return `${base}${path}`;
}
