// /admin → Simulaciones: informes del simulador funcional (tests/sim,
// `npm run sim`). Listado por día y detalle de cada mes simulado: registros por
// día, actividad de cada paciente, cómo lo ve el médico, comprobaciones y
// errores. Los datos llegan por admin_list_sim_runs / admin_get_sim_run
// (supabase/migrations/20261101_sim_runs.sql); el formato, en lib/simReport.ts.

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { supabaseAdmin as supabase } from '../../lib/supabase';
import { SIM_SCHEDULE_UTC, type SimCheckStatus, type SimReport, type SimRunRow, type SimSchedule } from '../../lib/simReport';
import { SectionHeader, StatCard, s } from './ui';
import {
  BristolSpark, DailyEntriesChart, DataTable, localDate, PersonaHeatmap, RUN_STATUS, RunCalendar, StatusPill,
  toggleBtn, TypeSplit, viz,
} from './simCharts';

const SEMAFORO = {
  green: { label: 'Verde', color: '#3F9E6E' },
  orange: { label: 'Ámbar', color: '#E09F3C' },
  red: { label: 'Rojo', color: '#D26464' },
  gray: { label: 'Sin datos', color: '#B9C2C5' },
} as const;

const CHECK_STATUS: Record<SimCheckStatus, { icon: string; label: string; color: string }> = {
  pass: { icon: '✔', label: 'Correcta', color: viz.good },
  fail: { icon: '✘', label: 'Falla', color: viz.critical },
  warn: { icon: '⚠', label: 'Aviso', color: viz.warning },
  known: { icon: '⚠', label: 'Conocido', color: viz.warning },
  fixed: { icon: '★', label: 'Ya corregido', color: viz.good },
};

const STATUS_EMOJI = { pass: '✅', fail: '❌', error: '⚠️' } as const;

const MODE_LABEL: Record<string, string> = {
  both: 'Deposición y micción', poop_only: 'Solo deposición', urine_only: 'Solo micción', none: 'Solo comidas',
};

const time = (iso: string) => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
const longDay = (date: string) => {
  const t = new Date(`${date}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const shortDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
const ago = (iso: string) => {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  return h < 48 ? `hace ${h} h` : `hace ${Math.round(h / 24)} días`;
};

export default function SimulationsSection() {
  const [days, setDays] = useState(30);
  const [statusFilter, setStatusFilter] = useState<'all' | 'problems'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'ci' | 'local'>('all');
  const [dayFilter, setDayFilter] = useState<string | null>(null);
  const [runs, setRuns] = useState<SimRunRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError('');
    const { data, error } = await supabase.rpc('admin_list_sim_runs', { p_days: days });
    if (error) setLoadError(error.message);
    else setRuns((data ?? []) as SimRunRow[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [days]);

  const filtered = useMemo(() => (runs ?? []).filter((r) =>
    (statusFilter === 'all' || r.status !== 'pass')
    && (sourceFilter === 'all' || r.source === sourceFilter)), [runs, statusFilter, sourceFilter]);

  if (openId) return <RunDetail id={openId} onBack={() => setOpenId(null)} onDeleted={() => { setOpenId(null); load(); }} />;

  const groups = new Map<string, SimRunRow[]>();
  for (const r of filtered) {
    const k = localDate(r.created_at);
    if (dayFilter && k !== dayFilter) continue;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const ok = filtered.filter((r) => r.status === 'pass').length;
  const last = filtered[0];
  const avgDur = filtered.length ? filtered.reduce((n, r) => n + Number(r.duration_s ?? 0), 0) / filtered.length : 0;

  return (
    <>
      <SectionHeader
        title="Simulaciones"
        subtitle="Un médico y 9 pacientes simulados viven un mes en un Supabase de pruebas, con las mismas llamadas que las apps (npm run sim)"
        actions={<button onClick={load} style={s.headerBtn}>🔄 Actualizar</button>}
      />

      <ScheduleCard />

      {/* Filtros: una fila, encima de todo lo que acotan */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
        <select value={days} onChange={(e) => { setDays(Number(e.target.value)); setDayFilter(null); }}
          style={{ ...s.filterTab, backgroundColor: '#fff', color: '#444' }}>
          <option value={7}>Últimos 7 días</option>
          <option value={30}>Últimos 30 días</option>
          <option value={90}>Últimos 90 días</option>
        </select>
        {([['all', 'Todas'], ['problems', 'Solo con fallos']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setStatusFilter(id)}
            style={{ ...s.filterTab, backgroundColor: statusFilter === id ? '#274867' : '#fff', color: statusFilter === id ? '#fff' : '#666' }}>
            {label}
          </button>
        ))}
        {([['all', 'Cualquier origen'], ['ci', 'GitHub Actions'], ['local', 'Local']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setSourceFilter(id)}
            style={{ ...s.filterTab, backgroundColor: sourceFilter === id ? '#274867' : '#fff', color: sourceFilter === id ? '#fff' : '#666' }}>
            {label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#888' }}>{loading ? 'Cargando…' : `${filtered.length} ejecuciones`}</span>
      </div>

      {loadError && <div style={{ ...s.card, padding: 16, color: '#BB4E4E', fontSize: 14 }}>No se han podido cargar las simulaciones: {loadError}</div>}

      <div style={{ opacity: loading && runs ? 0.5 : 1, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column' as const, gap: 24 }}>
        <div style={s.statsRow}>
          <StatCard emoji="🧪" label="EJECUCIONES" value={String(filtered.length)} sub={`en ${days} días`} />
          <StatCard emoji="✅" label="CORRECTAS" value={filtered.length ? `${Math.round((ok / filtered.length) * 100)} %` : '—'}
            sub={filtered.length ? `${ok} de ${filtered.length}` : undefined} />
          <StatCard emoji={last ? STATUS_EMOJI[last.status] : '—'} label="ÚLTIMA" value={last ? RUN_STATUS[last.status].label : '—'}
            sub={last ? `${ago(last.created_at)} · ${last.summary.checks?.pass ?? 0}/${last.summary.checks?.total ?? 0} comprobaciones` : undefined} dark />
          <StatCard emoji="⏱️" label="DURACIÓN MEDIA" value={filtered.length ? `${avgDur.toFixed(1)} s` : '—'} />
        </div>

        <div style={{ ...s.card, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, gap: 12, flexWrap: 'wrap' as const }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Ejecuciones por día</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                <span style={{ color: viz.good, fontWeight: 800 }}>■</span> todas correctas ·{' '}
                <span style={{ color: viz.critical, fontWeight: 800 }}>■</span> alguna con fallos ·{' '}
                <span style={{ color: '#ccc', fontWeight: 800 }}>■</span> sin ejecuciones · pulsa un día para filtrar
              </div>
            </div>
            {dayFilter && <button onClick={() => setDayFilter(null)} style={toggleBtn}>Quitar filtro: {shortDate(dayFilter)} ✕</button>}
          </div>
          <RunCalendar runs={filtered} days={days} selected={dayFilter} onSelect={setDayFilter} />
        </div>

        {runs && groups.size === 0 && (
          <div style={{ ...s.card, padding: 24, color: '#888', fontSize: 14 }}>
            No hay simulaciones en este periodo. Se lanzan con <code>npm run sim</code> (o el cron de GitHub Actions) y aparecen aquí al terminar.
          </div>
        )}

        {[...groups.entries()].map(([date, list]) => {
          const bad = list.filter((r) => r.status !== 'pass').length;
          return (
            <div key={date} style={s.card}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #00000015', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{longDay(date)}</div>
                <div style={{ fontSize: 12, color: '#888' }}>
                  {list.length} {list.length === 1 ? 'ejecución' : 'ejecuciones'}
                  {bad > 0 ? <> · <span style={{ color: viz.critical, fontWeight: 800 }}>✘</span> {bad} con fallos</> : <> · <span style={{ color: viz.good, fontWeight: 800 }}>✔</span> todas correctas</>}
                </div>
              </div>
              <div style={{ display: 'flex', padding: '8px 20px', backgroundColor: '#00000008', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase' as const, gap: 12 }}>
                <span style={{ width: 54 }}>Hora</span>
                <span style={{ width: 120 }}>Estado</span>
                <span style={{ flex: 2 }}>Comprobaciones</span>
                <span style={{ flex: 1 }}>Registros</span>
                <span style={{ flex: 1 }}>Mes simulado</span>
                <span style={{ flex: 1 }}>Origen</span>
                <span style={{ width: 60, textAlign: 'right' as const }}>Duración</span>
              </div>
              {list.map((r, i) => <RunRow key={r.id} run={r} last={i === list.length - 1} onOpen={() => setOpenId(r.id)} />)}
            </div>
          );
        })}
      </div>
    </>
  );
}

function RunRow({ run: r, last, onOpen }: { run: SimRunRow; last: boolean; onOpen: () => void }) {
  const c = r.summary.checks;
  return (
    <button type="button" onClick={onOpen} style={{
      display: 'block', width: '100%', textAlign: 'left' as const, background: 'none', border: 'none', cursor: 'pointer',
      padding: '12px 20px', borderBottom: last ? 'none' : '1px solid #00000010', font: 'inherit',
    }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#00000005')} onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
        <span style={{ width: 54, color: '#555', fontVariantNumeric: 'tabular-nums' }}>{time(r.created_at)}</span>
        <span style={{ width: 120 }}><StatusPill status={r.status} /></span>
        <span style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'flex', gap: 2, height: 8, width: 110, flexShrink: 0 }}>
            {c && c.pass > 0 && <span style={{ flex: c.pass, background: viz.good, borderRadius: 999 }} />}
            {c && c.fail > 0 && <span style={{ flex: c.fail, background: viz.critical, borderRadius: 999 }} />}
            {c && c.warn + c.known > 0 && <span style={{ flex: c.warn + c.known, background: viz.warning, borderRadius: 999 }} />}
          </span>
          <span style={{ color: '#111', fontVariantNumeric: 'tabular-nums' }}>{c ? `${c.pass}/${c.total}` : '—'}</span>
          {c && c.fail > 0 && <span style={{ color: '#555' }}>· {c.fail} {c.fail === 1 ? 'falla' : 'fallan'}</span>}
          {(r.summary.errors ?? 0) > 0 && <span style={{ color: '#555' }}>· {r.summary.errors} errores</span>}
        </span>
        <span style={{ flex: 1, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{r.summary.entries ?? '—'}</span>
        <span style={{ flex: 1, color: '#555' }}>
          {r.sim_start && r.sim_end ? `${shortDate(r.sim_start)} → ${shortDate(r.sim_end)}` : '—'}
          <span style={{ display: 'block', fontSize: 11, color: '#999' }}>semilla {r.seed}</span>
        </span>
        <span style={{ flex: 1, color: '#555', minWidth: 0 }}>
          {r.source === 'ci' ? 'GitHub Actions' : 'Local'}
          {r.git_sha && (
            <span title={`${r.git_sha}${r.git_ref ? ` · ${r.git_ref}` : ''}`}
              style={{ display: 'block', fontSize: 11, color: '#999', fontFamily: 'monospace', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
              {r.git_sha.slice(0, 7)}{r.git_ref ? ` · ${r.git_ref}` : ''}
            </span>
          )}
        </span>
        <span style={{ width: 60, textAlign: 'right' as const, color: '#555', fontVariantNumeric: 'tabular-nums' }}>{r.duration_s != null ? `${Number(r.duration_s).toFixed(1)} s` : '—'}</span>
      </div>
      {(r.summary.failed ?? []).length > 0 && (
        <div style={{ marginLeft: 66 + 132, marginTop: 6, fontSize: 12, color: '#555' }}>
          {(r.summary.failed ?? []).map((f) => (
            <div key={f}><span style={{ color: viz.critical, fontWeight: 800 }}>✘</span> {f}</div>
          ))}
        </div>
      )}
    </button>
  );
}

// ── Ejecución diaria (cron de GitHub Actions) ──

const WORKFLOW_URL = 'https://github.com/soymachine/cacalendario-2/actions/workflows/sim.yml';

/** Próxima ejecución del cron (GitHub puede retrasarla unos minutos). */
function nextScheduledRun(now = new Date()): Date {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), SIM_SCHEDULE_UTC.hour, SIM_SCHEDULE_UTC.minute));
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

function ScheduleCard() {
  const [schedule, setSchedule] = useState<SimSchedule | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase.rpc('admin_get_sim_schedule');
      if (err) setError(err.message);
      else setSchedule(data as SimSchedule);
    })();
  }, []);

  const toggle = async () => {
    if (!schedule) return;
    setSaving(true);
    setError('');
    const { data, error: err } = await supabase.rpc('admin_set_sim_schedule', { p_enabled: !schedule.enabled });
    if (err) setError(err.message);
    else setSchedule(data as SimSchedule);
    setSaving(false);
  };

  const next = nextScheduledRun();
  const nextText = next.toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const dailyAt = next.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const changed = schedule?.updated_by
    ? `${schedule.enabled ? 'Reanudada' : 'Pausada'} por ${schedule.updated_by} el ${new Date(schedule.updated_at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
    : null;

  return (
    <div style={{ ...s.card, padding: 20, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' as const }}>
      <div style={{ flex: 1, minWidth: 280 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Ejecución diaria automática</span>
          {schedule && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              background: `${schedule.enabled ? viz.good : viz.warning}1F`, color: '#111',
            }}>
              <span style={{ color: schedule.enabled ? viz.good : '#B7791F', fontWeight: 900 }}>{schedule.enabled ? '▶' : '⏸️'}</span>
              {schedule.enabled ? 'Activa' : 'En pausa'}
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: '#555', marginTop: 6, lineHeight: 1.5 }}>
          {!schedule && !error && 'Cargando…'}
          {schedule?.enabled && <>Se lanza cada día a las {dailyAt} desde GitHub Actions. Próxima: <strong>{nextText}</strong> (GitHub puede retrasarla unos minutos).</>}
          {schedule && !schedule.enabled && <>No se lanzará hasta que la reanudes. El cron sigue despertándose cada día, pero termina sin simular.</>}
          {changed && <span style={{ display: 'block', fontSize: 12, color: '#888' }}>{changed}</span>}
          <span style={{ display: 'block', fontSize: 12, color: '#888' }}>
            Para lanzarla ahora: <a href={WORKFLOW_URL} target="_blank" rel="noreferrer" style={{ color: '#3C7DB8' }}>GitHub → Actions → Simulación funcional</a> → Run workflow (ignora la pausa).
          </span>
        </div>
        {error && <div style={{ fontSize: 13, color: '#BB4E4E', marginTop: 6 }}>No se ha podido {schedule ? 'cambiar' : 'consultar'} el estado: {error}</div>}
      </div>
      {schedule && (
        <button onClick={toggle} disabled={saving}
          style={{
            padding: '10px 20px', borderRadius: 999, border: 'none', fontSize: 14, fontWeight: 600,
            cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1,
            backgroundColor: schedule.enabled ? '#fff' : '#274867', color: schedule.enabled ? '#274867' : '#fff',
            boxShadow: schedule.enabled ? 'inset 0 0 0 1.5px #274867' : 'none',
          }}>
          {saving ? 'Guardando…' : schedule.enabled ? '⏸️ Pausar' : '▶ Reanudar'}
        </button>
      )}
    </div>
  );
}

// ── Detalle de una ejecución ──

function RunDetail({ id, onBack, onDeleted }: { id: string; onBack: () => void; onDeleted: () => void }) {
  const [report, setReport] = useState<SimReport | null>(null);
  const [loadError, setLoadError] = useState('');
  const [checkFilter, setCheckFilter] = useState<'all' | 'problems'>('all');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('admin_get_sim_run', { p_id: id });
      if (error) setLoadError(error.message);
      else if (!data) setLoadError('La ejecución ya no existe');
      else setReport((data as { report: SimReport }).report);
    })();
  }, [id]);

  const download = () => {
    if (!report) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulacion-${report.runId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const remove = async () => {
    if (!confirm('¿Borrar esta simulación? No se puede deshacer.')) return;
    const { error } = await supabase.rpc('admin_delete_sim_run', { p_id: id });
    if (error) alert(error.message);
    else onDeleted();
  };

  const header = (
    <SectionHeader
      title="Simulación"
      subtitle={report ? `${longDay(localDate(report.startedAt))} · ${time(report.startedAt)} · run ${report.runId}` : 'Cargando…'}
      actions={<>
        <button onClick={onBack} style={s.headerBtn}>← Volver</button>
        {report && <button onClick={download} style={s.headerBtn}>⬇️ Descargar JSON</button>}
        {report && <button onClick={remove} style={s.headerBtn}>🗑️ Borrar</button>}
      </>}
    />
  );
  if (loadError) return <>{header}<div style={{ ...s.card, padding: 16, color: '#BB4E4E', fontSize: 14 }}>No se ha podido cargar: {loadError}</div></>;
  if (!report) return header;

  const r = report;
  const c = r.summary.checks;
  const areas = [...new Set(r.checks.map((x) => x.area))];
  const shownChecks = r.checks.filter((x) => checkFilter === 'all' || x.status !== 'pass');
  const phases = [
    { label: 'Altas e invitaciones', v: r.phases.setupS, color: '#86b6ef' },
    { label: 'Mes simulado', v: r.phases.simulateS, color: '#2a78d6' },
    { label: 'Comprobaciones', v: r.phases.checksS, color: '#104281' },
  ];

  return (
    <>
      {header}

      {/* Resumen */}
      <div style={{ ...s.card, padding: 20, display: 'flex', flexWrap: 'wrap' as const, gap: '14px 32px', alignItems: 'center' }}>
        <StatusPill status={r.status} />
        <Meta label="Mes simulado" value={`${shortDate(r.simStart)} → ${shortDate(r.simEnd)} (${r.days} días)`} />
        <Meta label="Semilla" value={String(r.seed)} hint={`SIM_SEED=${r.seed} npm run sim`} />
        <Meta label="Origen" value={r.source === 'ci' ? 'GitHub Actions' : 'Local'} />
        <Meta label="Commit" value={r.git.sha ? `${r.git.sha.slice(0, 7)}${r.git.ref ? ` · ${r.git.ref}` : ''}` : '—'} mono />
        <Meta label="Entorno" value={`Node ${r.env.node} · ${r.env.tz}`} />
        {r.doctor && <Meta label="Médico al acabar" value={`plan ${r.doctor.plan} · ${r.doctor.trialDaysLeft === null ? 'sin trial' : `${r.doctor.trialDaysLeft} ${r.doctor.trialDaysLeft === 1 ? 'día' : 'días'} de trial`} · semáforo ${r.doctor.semaforoGreen}/${r.doctor.semaforoRed}`} />}
      </div>
      {r.fatal && (
        <div style={{ ...s.card, padding: 16, fontSize: 14, color: '#111' }}>
          <span style={{ color: viz.warning, fontWeight: 900 }}>⚠</span> La simulación no pudo completarse: <code>{r.fatal}</code>
        </div>
      )}

      <div style={s.statsRow}>
        <StatCard emoji={c.fail ? '❌' : '✅'} label="COMPROBACIONES" value={`${c.pass}/${c.total}`}
          sub={c.fail ? `${c.fail} ${c.fail === 1 ? 'falla' : 'fallan'}` : c.warn + c.known ? `${c.warn + c.known} avisos` : 'todas correctas'} dark={c.fail > 0} />
        <StatCard emoji="📝" label="REGISTROS" value={String(r.summary.entries)} sub={`${r.summary.actions} acciones de ${r.summary.personas} pacientes`} />
        <StatCard emoji={r.summary.errors ? '⚠️' : '✅'} label="ERRORES" value={String(r.summary.errors)} sub="llamadas que fallaron durante el mes" />
        <StatCard emoji="⏱️" label="DURACIÓN" value={`${r.durationS.toFixed(1)} s`} sub={phases.map((p) => `${p.v.toFixed(1)} s`).join(' · ')} />
      </div>

      {/* Fases */}
      <Card title="Tiempo por fase" subtitle="Cuánto tarda cada parte de la ejecución">
        <div style={{ display: 'flex', gap: 2, height: 28 }}>
          {phases.filter((p) => p.v > 0).map((p) => (
            <div key={p.label} title={`${p.label}: ${p.v.toFixed(1)} s`}
              style={{ flex: p.v, background: p.color, borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 8, minWidth: 0, overflow: 'hidden' }}>
              {p.v / r.durationS > 0.18 && <span style={{ color: '#fff', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' as const }}>{Math.round((p.v / r.durationS) * 100)} %</span>}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: '#555', flexWrap: 'wrap' as const }}>
          {phases.map((p) => (
            <span key={p.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: p.color }} />{p.label} · {p.v.toFixed(1)} s
            </span>
          ))}
        </div>
      </Card>

      <Card title="Registros por día" subtitle="Lo que los 9 pacientes dejaron guardado cada día del mes simulado">
        <DailyEntriesChart daily={r.daily} />
      </Card>

      <Card title="Actividad de cada paciente" subtitle="Registros por paciente y día: se ven el abandono, los huecos, la invitación rechazada y el archivado">
        <PersonaHeatmap personas={r.personas} simStart={r.simStart} />
      </Card>

      {/* Pacientes */}
      <div style={s.card}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #00000015' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Pacientes</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Qué hizo cada uno y cómo lo ve el médico al terminar el mes</div>
        </div>
        <div style={{ overflowX: 'auto' as const }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#00000008' }}>
                {['Paciente', 'Invitación', 'Registros', 'Fotos', 'Ediciones · borrados · reenvíos', 'Días activos', 'Bristol diario', 'Semáforo', 'Ve el médico', 'Aviso'].map((h) => (
                  <th key={h} style={{ textAlign: 'left' as const, padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.personas.map((p) => {
                const sem = p.doctorView.semaforo ? SEMAFORO[p.doctorView.semaforo] : null;
                return (
                  <tr key={p.key} style={{ borderTop: '1px solid #00000010', verticalAlign: 'top' as const }}>
                    <td style={{ ...td, minWidth: 220 }}>
                      <div style={{ fontWeight: 600, color: '#111' }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{p.role}</div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                        {MODE_LABEL[p.entryTypeMode] ?? p.entryTypeMode}{p.foodTracking ? ' · pauta de comidas' : ''}
                      </div>
                    </td>
                    <td style={td}>
                      {p.invite.respond === 'accept' ? `Acepta el día ${p.invite.day}` : `Rechaza el día ${p.invite.day}`}
                      {p.archiveDay !== null && <div style={{ fontSize: 12, color: '#888' }}>Archivado el día {p.archiveDay}</div>}
                    </td>
                    <td style={{ ...td, minWidth: 130 }}><TypeSplit totals={p.totals} /></td>
                    <td style={tdNum}>{p.totals.photos}</td>
                    <td style={tdNum}>{p.totals.edits} · {p.totals.deletes} · {p.totals.resends}</td>
                    <td style={tdNum}>{p.activeDays}/{r.days}</td>
                    <td style={td}><BristolSpark daily={p.daily} /></td>
                    <td style={td}>
                      {sem ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' as const }}>
                          <span style={{ width: 10, height: 10, borderRadius: 5, background: sem.color }} />
                          {sem.label}{p.doctorView.daysSinceLast !== null ? ` · ${p.doctorView.daysSinceLast} d` : ''}
                        </span>
                      ) : <span style={{ color: '#999' }}>{p.doctorView.status === 'rejected' ? 'Rechazó' : '—'}</span>}
                    </td>
                    <td style={tdNum}>{p.doctorView.visibleEntries ?? 0}{p.doctorView.archived ? <div style={{ fontSize: 11, color: '#999' }}>hasta el archivo</div> : null}</td>
                    <td style={td}>{p.inactivityPush ? '🔔 Sí' : <span style={{ color: '#999' }}>No</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprobaciones */}
      <div style={s.card}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #00000015', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Comprobaciones ({c.pass}/{c.total})</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Lo que se verifica al acabar el mes, agrupado por área</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {([['all', 'Todas'], ['problems', 'Solo problemas']] as const).map(([fid, label]) => (
              <button key={fid} onClick={() => setCheckFilter(fid)}
                style={{ ...s.filterTab, backgroundColor: checkFilter === fid ? '#274867' : '#00000010', color: checkFilter === fid ? '#fff' : '#666' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {areas.map((area) => {
          const items = shownChecks.filter((x) => x.area === area);
          if (!items.length) return null;
          const all = r.checks.filter((x) => x.area === area);
          const okN = all.filter((x) => x.status === 'pass' || x.status === 'fixed').length;
          return (
            <div key={area}>
              <div style={{ padding: '10px 20px', backgroundColor: '#00000008', fontSize: 12, fontWeight: 700, color: '#555', display: 'flex', justifyContent: 'space-between' }}>
                <span>{area}</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{okN}/{all.length}</span>
              </div>
              {items.map((x) => {
                const m = CHECK_STATUS[x.status];
                return (
                  <div key={x.name} style={{ display: 'flex', gap: 12, padding: '9px 20px', borderTop: '1px solid #00000008', fontSize: 13, alignItems: 'flex-start' }}>
                    <span style={{ width: 110, flexShrink: 0, whiteSpace: 'nowrap' as const }}><span style={{ color: m.color, fontWeight: 900 }}>{m.icon}</span> {m.label}</span>
                    <span style={{ flex: 1, color: '#111' }}>
                      {x.name}
                      {x.detail && x.status !== 'pass' && <span style={{ display: 'block', fontSize: 12, color: '#666', marginTop: 2, wordBreak: 'break-word' as const }}>{x.detail}</span>}
                    </span>
                    <span style={{ width: 60, textAlign: 'right' as const, color: '#999', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{x.ms != null ? `${x.ms} ms` : ''}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
        {!shownChecks.length && <div style={{ padding: 20, fontSize: 14, color: '#888' }}><span style={{ color: viz.good, fontWeight: 900 }}>✔</span> Ninguna comprobación con problemas</div>}
      </div>

      {/* Errores */}
      <Card title={`Errores durante la simulación (${r.errors.length})`} subtitle="Llamadas a Supabase que fallaron mientras los agentes vivían el mes">
        {r.errors.length === 0
          ? <div style={{ fontSize: 14, color: '#888' }}><span style={{ color: viz.good, fontWeight: 900 }}>✔</span> Ninguna</div>
          : <DataTable head={['Día', 'Acción', 'Error']} rows={r.errors.map((e) => [e.day === null ? '—' : `${e.day} · ${shortDate(r.daily[e.day]?.date ?? r.simStart)}`, e.what, e.message])} />}
      </Card>
    </>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div style={{ ...s.card, padding: 20 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{title}</div>
      <div style={{ fontSize: 12, color: '#888', marginTop: 4, marginBottom: 16 }}>{subtitle}</div>
      {children}
    </div>
  );
}

function Meta({ label, value, hint, mono }: { label: string; value: string; hint?: string; mono?: boolean }) {
  return (
    <div title={hint}>
      <div style={{ fontSize: 10, fontWeight: 900, color: '#00000066', letterSpacing: 0.5, textTransform: 'uppercase' as const }}>{label}</div>
      <div style={{ fontSize: 13, color: '#111', marginTop: 2, fontFamily: mono ? 'monospace' : undefined }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: '#999', fontFamily: 'monospace', marginTop: 1 }}>{hint}</div>}
    </div>
  );
}

const td: CSSProperties = { padding: '10px 12px', color: '#333' };
const tdNum: CSSProperties = { ...td, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' as const };
