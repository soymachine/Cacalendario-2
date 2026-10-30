// Gráficos de la sección Simulaciones de /admin. SVG/HTML a mano (sin
// librería): barras ≤24px con 2px de separación, colores de serie en orden
// fijo, leyenda siempre visible, tooltip al pasar el ratón o con el foco del
// teclado y vista de tabla. Los estados llevan icono + texto, nunca solo color.

import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { SimDay, SimPersona, SimRunRow } from '../../lib/simReport';

// ── Tokens (panel de admin: solo modo claro) ──
export const viz = {
  surface: '#ffffff',
  ink: '#111111',
  ink2: '#555555',
  muted: '#888888',
  grid: '#ECECEA',
  empty: '#F1F1EE',
  // Categóricos, en orden fijo (validados: deposición/micción/comida)
  poop: '#2a78d6',
  urine: '#eb6834',
  food: '#1baf7a',
  // Estado (reservados, siempre con icono + texto)
  good: '#0ca30c',
  warning: '#fab219',
  critical: '#d03b3b',
  // Secuencial azul (claro → oscuro) para el mapa de actividad
  seq: ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#104281'],
};

export const TYPE_META = [
  { key: 'poop', label: 'Deposiciones', color: viz.poop },
  { key: 'urine', label: 'Micciones', color: viz.urine },
  { key: 'food', label: 'Comidas', color: viz.food },
] as const;

const fmtDay = (date: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('es-ES', opts);

// ── Tooltip compartido ──

interface Tip { x: number; y: number; content: ReactNode }

function useTooltip() {
  const ref = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const show = (e: { clientX?: number; clientY?: number; currentTarget: Element }, content: ReactNode) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    // Con teclado no hay puntero: se ancla a la marca enfocada.
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX || r.left + r.width / 2) - box.left;
    const y = (e.clientY || r.top) - box.top;
    setTip({ x, y, content });
  };
  const hide = () => setTip(null);
  const layer = tip && (
    <div role="tooltip" style={{
      position: 'absolute', left: Math.min(tip.x + 12, (ref.current?.clientWidth ?? 600) - 220), top: Math.max(0, tip.y - 12),
      transform: 'translateY(-100%)', pointerEvents: 'none', zIndex: 5,
      background: '#fff', border: `1px solid ${viz.grid}`, borderRadius: 10, boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
      padding: '8px 10px', fontSize: 12, color: viz.ink, minWidth: 160, maxWidth: 240,
    }}>{tip.content}</div>
  );
  return { ref, show, hide, layer };
}

/** Fila de tooltip: valor delante (fuerte), etiqueta detrás, clave de línea del color de la serie. */
export function TipRow({ color, value, label }: { color?: string; value: ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, lineHeight: '18px' }}>
      {color && <span style={{ width: 10, height: 2, background: color, borderRadius: 1, flexShrink: 0 }} />}
      <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</strong>
      <span style={{ color: viz.ink2 }}>{label}</span>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; shape?: 'rect' | 'line' }[] }) {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' as const, fontSize: 12, color: viz.ink2 }}>
      {items.map((i) => (
        <span key={i.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={i.shape === 'line'
            ? { width: 14, height: 2, background: i.color, borderRadius: 1 }
            : { width: 10, height: 10, background: i.color, borderRadius: 3 }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

// ── Estado de una ejecución ──

export const RUN_STATUS = {
  pass: { icon: '✔', label: 'Correcta', color: viz.good },
  fail: { icon: '✘', label: 'Con fallos', color: viz.critical },
  error: { icon: '⚠', label: 'No terminó', color: viz.warning },
} as const;

export function StatusPill({ status }: { status: keyof typeof RUN_STATUS }) {
  const m = RUN_STATUS[status] ?? RUN_STATUS.error;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999,
      background: `${m.color}1A`, color: viz.ink, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' as const,
    }}>
      <span style={{ color: m.color, fontWeight: 900 }}>{m.icon}</span>{m.label}
    </span>
  );
}

// ── Calendario de ejecuciones (una celda por día del periodo) ──

export function RunCalendar({ runs, days, selected, onSelect }: {
  runs: SimRunRow[]; days: number; selected: string | null; onSelect: (date: string | null) => void;
}) {
  const { ref, show, hide, layer } = useTooltip();
  const byDay = new Map<string, SimRunRow[]>();
  for (const r of runs) {
    const k = localDate(r.created_at);
    byDay.set(k, [...(byDay.get(k) ?? []), r]);
  }
  const today = new Date();
  const cells = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    return localDate(d.toISOString(), d);
  });
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
        {cells.map((date) => {
          const list = byDay.get(date) ?? [];
          const bad = list.filter((r) => r.status !== 'pass').length;
          const color = !list.length ? viz.empty : bad ? viz.critical : viz.good;
          const content = (
            <>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{fmtDay(date, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
              {list.length
                ? <>
                    <TipRow value={list.length} label={list.length === 1 ? 'ejecución' : 'ejecuciones'} />
                    <TipRow value={bad ? `✘ ${bad}` : '✔'} label={bad ? 'con fallos' : 'todas correctas'} />
                  </>
                : <span style={{ color: viz.ink2 }}>Sin ejecuciones</span>}
            </>
          );
          return (
            <button key={date} type="button" aria-label={`${date}: ${list.length} ejecuciones, ${bad} con fallos`}
              onClick={() => list.length && onSelect(selected === date ? null : date)}
              onMouseMove={(e) => show(e, content)} onMouseLeave={hide} onFocus={(e) => show(e, content)} onBlur={hide}
              style={{
                width: 22, height: 22, borderRadius: 5, border: 'none', padding: 0, background: color,
                cursor: list.length ? 'pointer' : 'default', color: '#fff', fontSize: 10, fontWeight: 800,
                outline: selected === date ? `2px solid ${viz.ink}` : 'none', outlineOffset: 2,
              }}>
              {list.length > 1 ? list.length : ''}
            </button>
          );
        })}
      </div>
      {layer}
    </div>
  );
}

/** Fecha local (YYYY-MM-DD) de un instante. */
export function localDate(iso: string, d: Date = new Date(iso)): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Registros por día del mes virtual (columnas apiladas por tipo) ──

export function DailyEntriesChart({ daily }: { daily: SimDay[] }) {
  const { ref, show, hide, layer } = useTooltip();
  const [table, setTable] = useState(false);
  const W = 900, H = 230, padL = 34, padR = 8, padT = 16, padB = 28;
  const max = Math.max(1, ...daily.map((d) => d.poop + d.urine + d.food));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const band = (W - padL - padR) / daily.length;
  const bw = Math.min(24, band - 4);
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / top);
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12, flexWrap: 'wrap' as const }}>
        <Legend items={[...TYPE_META.map((t) => ({ label: t.label, color: t.color })), { label: 'Día con errores', color: viz.critical }]} />
        <button type="button" onClick={() => setTable(!table)} style={toggleBtn}>{table ? 'Ver gráfico' : 'Ver tabla'}</button>
      </div>
      {table ? (
        <DataTable
          head={['Día', 'Deposiciones', 'Micciones', 'Comidas', 'Fotos', 'Ediciones', 'Borrados', 'Reenvíos', 'Errores']}
          rows={daily.map((d) => [`${d.day} · ${fmtDay(d.date)}`, d.poop, d.urine, d.food, d.photos, d.edits, d.deletes, d.resends, d.errors])}
        />
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Registros guardados por día del mes simulado" style={{ display: 'block' }}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke={viz.grid} strokeWidth={1} />
              <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={viz.muted} style={{ fontVariantNumeric: 'tabular-nums' }}>{t}</text>
            </g>
          ))}
          {daily.map((d, i) => {
            const x = padL + i * band + (band - bw) / 2;
            const segs = TYPE_META.map((t) => ({ ...t, v: d[t.key] })).filter((s) => s.v > 0);
            let acc = 0;
            const total = d.poop + d.urine + d.food;
            const content = (
              <>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Día {d.day} · {fmtDay(d.date, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                {TYPE_META.map((t) => <TipRow key={t.key} color={t.color} value={d[t.key]} label={t.label.toLowerCase()} />)}
                <TipRow value={total} label="en total" />
                {d.edits > 0 && <TipRow value={d.edits} label={d.edits === 1 ? 'edición' : 'ediciones'} />}
                {d.deletes > 0 && <TipRow value={d.deletes} label={d.deletes === 1 ? 'borrado' : 'borrados'} />}
                {d.resends > 0 && <TipRow value={d.resends} label={d.resends === 1 ? 'reenvío' : 'reenvíos'} />}
                {d.errors > 0 && <TipRow color={viz.critical} value={`✘ ${d.errors}`} label="errores" />}
              </>
            );
            return (
              <g key={d.day} tabIndex={0} role="img" aria-label={`Día ${d.day}: ${total} registros`}
                onMouseMove={(e) => show(e, content)} onMouseLeave={hide} onFocus={(e) => show(e, content)} onBlur={hide}
                style={{ outline: 'none', cursor: 'default' }}>
                <rect x={padL + i * band} y={padT} width={band} height={H - padT - padB} fill="transparent" />
                {segs.map((sg, j) => {
                  const y0 = y(acc), y1 = y(acc + sg.v);
                  acc += sg.v;
                  const isTop = j === segs.length - 1;
                  // 2px de superficie entre segmentos; solo el de arriba lleva la punta redondeada
                  const h = Math.max(0, y0 - y1 - (j > 0 ? 2 : 0));
                  return isTop
                    ? <path key={sg.key} d={roundTopRect(x, y1, bw, h, Math.min(4, h))} fill={sg.color} />
                    : <rect key={sg.key} x={x} y={y1} width={bw} height={h} fill={sg.color} />;
                })}
                {d.errors > 0 && <circle cx={x + bw / 2} cy={y(total) - 9} r={4} fill={viz.critical} stroke={viz.surface} strokeWidth={2} />}
                {(i % 5 === 0 || i === daily.length - 1) && (
                  <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize={11} fill={viz.muted}>{fmtDay(d.date)}</text>
                )}
              </g>
            );
          })}
        </svg>
      )}
      {layer}
    </div>
  );
}

// ── Actividad por paciente y día (mapa de calor) ──

const binOf = (n: number) => (n <= 0 ? -1 : n === 1 ? 0 : n === 2 ? 1 : n === 3 ? 2 : n <= 5 ? 3 : n <= 8 ? 4 : 5);
const BIN_LABELS = ['1', '2', '3', '4–5', '6–8', '9+'];

export function PersonaHeatmap({ personas, simStart }: { personas: SimPersona[]; simStart: string }) {
  const { ref, show, hide, layer } = useTooltip();
  const days = personas[0]?.daily.length ?? 0;
  const dateOf = (i: number) => {
    const d = new Date(`${simStart}T12:00:00`);
    d.setDate(d.getDate() + i);
    return localDate(d.toISOString(), d);
  };
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const, alignItems: 'center', fontSize: 12, color: viz.ink2, marginBottom: 10 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: viz.empty }} /> <span style={{ marginRight: 6 }}>0</span>
          {viz.seq.map((c, i) => (
            <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginRight: 4 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: c }} />{BIN_LABELS[i]}
            </span>
          ))}
          <span style={{ marginLeft: 2 }}>registros al día</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 3, height: 14, background: viz.ink, borderRadius: 1 }} /> el médico archiva el seguimiento
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, border: `1.5px dashed ${viz.muted}` }} /> antes de responder la invitación
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `150px repeat(${days}, minmax(10px, 1fr))`, gap: 2, alignItems: 'center' }}>
        {personas.map((p) => (
          <Row key={p.key}>
            <div style={{ fontSize: 12, color: viz.ink, fontWeight: 600, paddingRight: 8, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.role}>
              {p.name}
            </div>
            {p.daily.map((d, i) => {
              const n = d.poop + d.urine + d.food;
              const bin = binOf(n);
              const beforeInvite = i < p.invite.day;
              const archived = p.archiveDay !== null && i === p.archiveDay;
              const content = (
                <>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{p.name} · día {i} ({fmtDay(dateOf(i))})</div>
                  {n === 0 && <span style={{ color: viz.ink2 }}>Sin registros</span>}
                  {TYPE_META.filter((t) => d[t.key] > 0).map((t) => <TipRow key={t.key} color={t.color} value={d[t.key]} label={t.label.toLowerCase()} />)}
                  {d.bristol !== null && <TipRow value={d.bristol} label="Bristol medio" />}
                  {beforeInvite && <div style={{ color: viz.ink2, marginTop: 4 }}>Aún no había respondido la invitación</div>}
                  {archived && <div style={{ color: viz.ink2, marginTop: 4 }}>El médico archiva el seguimiento (12:00)</div>}
                </>
              );
              return (
                <div key={i} tabIndex={0} role="img" aria-label={`${p.name}, día ${i}: ${n} registros`}
                  onMouseMove={(e) => show(e, content)} onMouseLeave={hide} onFocus={(e) => show(e, content)} onBlur={hide}
                  style={{
                    height: 18, borderRadius: 3, outline: 'none',
                    background: bin < 0 ? viz.empty : viz.seq[bin],
                    boxShadow: archived ? `inset 3px 0 0 ${viz.ink}` : undefined,
                    border: beforeInvite ? `1.5px dashed ${viz.muted}` : undefined,
                    boxSizing: 'border-box' as const,
                  }} />
              );
            })}
          </Row>
        ))}
        <div />
        {Array.from({ length: days }, (_, i) => (
          <div key={i} style={{ fontSize: 10, color: viz.muted, textAlign: 'center' as const, whiteSpace: 'nowrap' as const, overflow: 'visible' }}>
            {i % 5 === 0 ? fmtDay(dateOf(i)) : ''}
          </div>
        ))}
      </div>
      {layer}
    </div>
  );
}

const Row = ({ children }: { children: ReactNode }) => <>{children}</>;

// ── Bristol medio diario (sparkline por paciente) ──

export function BristolSpark({ daily }: { daily: SimPersona['daily'] }) {
  const pts = daily.map((d, i) => ({ i, v: d.bristol }));
  if (!pts.some((p) => p.v !== null)) return <span style={{ color: viz.muted, fontSize: 12 }}>—</span>;
  const W = 120, H = 34, pad = 3;
  const x = (i: number) => pad + (i / Math.max(1, daily.length - 1)) * (W - pad * 2);
  const y = (v: number) => pad + ((7 - v) / 6) * (H - pad * 2);
  // Tramos continuos (los días sin deposición cortan la línea)
  const segments: string[] = [];
  let cur = '';
  for (const p of pts) {
    if (p.v === null) { if (cur) segments.push(cur); cur = ''; continue; }
    cur += `${cur ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`;
  }
  if (cur) segments.push(cur);
  const vals = pts.filter((p) => p.v !== null).map((p) => p.v as number);
  const avg = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <svg width={W} height={H} role="img" aria-label={`Bristol medio ${avg}, entre ${Math.min(...vals)} y ${Math.max(...vals)}`}>
        <rect x={0} y={y(5)} width={W} height={y(3) - y(5)} fill={viz.good} opacity={0.1} />
        {segments.map((d, i) => <path key={i} d={d} fill="none" stroke={viz.poop} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />)}
        {pts.filter((p, i) => p.v !== null && (pts[i - 1]?.v ?? null) === null && (pts[i + 1]?.v ?? null) === null).map((p) => (
          <circle key={p.i} cx={x(p.i)} cy={y(p.v as number)} r={2} fill={viz.poop} />
        ))}
      </svg>
      <span style={{ fontSize: 12, color: viz.ink2, fontVariantNumeric: 'tabular-nums' }}>{avg}</span>
    </span>
  );
}

// ── Barra segmentada fina (reparto de registros por tipo) ──

export function TypeSplit({ totals }: { totals: { poop: number; urine: number; food: number } }) {
  const total = totals.poop + totals.urine + totals.food;
  if (!total) return <span style={{ color: viz.muted, fontSize: 12 }}>0</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, width: '100%' }}
      title={TYPE_META.map((t) => `${t.label}: ${totals[t.key]}`).join(' · ')}>
      <span style={{ display: 'flex', gap: 2, height: 8, width: 90, flexShrink: 0 }}>
        {TYPE_META.filter((t) => totals[t.key] > 0).map((t) => (
          <span key={t.key} style={{ flex: totals[t.key], background: t.color, borderRadius: 999 }} />
        ))}
      </span>
      <span style={{ fontSize: 13, color: viz.ink, fontVariantNumeric: 'tabular-nums' }}>{total}</span>
    </span>
  );
}

// ── Tabla de datos (vista accesible de los gráficos) ──

export function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div style={{ overflowX: 'auto' as const, maxHeight: 360, overflowY: 'auto' as const }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 12 }}>
        <thead>
          <tr>{head.map((h) => <th key={h} style={{ textAlign: 'left' as const, padding: '6px 8px', color: viz.muted, fontWeight: 700, borderBottom: `1px solid ${viz.grid}`, position: 'sticky' as const, top: 0, background: viz.surface }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} style={{ padding: '5px 8px', color: viz.ink, borderBottom: `1px solid ${viz.grid}`, fontVariantNumeric: 'tabular-nums' }}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const toggleBtn: CSSProperties = {
  padding: '6px 12px', borderRadius: 999, border: 'none', background: '#00000010', color: '#444',
  fontSize: 12, fontWeight: 600, cursor: 'pointer',
};

function niceStep(max: number): number {
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

function roundTopRect(x: number, y: number, w: number, h: number, r: number): string {
  if (h <= 0) return '';
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}
