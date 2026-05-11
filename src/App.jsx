import React, { useReducer, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, CheckCircle2, Loader2 } from 'lucide-react';

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
const C = {
  bg:         '#0f172a',
  card:       '#1e293b',
  cardDeep:   '#162032',
  border:     '#334155',
  text:       '#f1f5f9',
  textMuted:  '#94a3b8',
  textDim:    '#475569',
  statusIdle: '#6b7280',
  statusRun:  '#3b82f6',
  statusOk:   '#10b981',
  statusErr:  '#ef4444',
  statusWarn: '#f59e0b',
  blue:       '#3b82f6',
  violet:     '#8b5cf6',
  green:      '#10b981',
  amber:      '#f59e0b',
  pink:       '#ec4899',
  sky:        '#0ea5e9',
};

/* ─────────────────────────────────────────────
   TIMELINE (ms)
───────────────────────────────────────────── */
const T = {
  p1s: 0,      p1e: 25_000,
  p2s: 25_000, p2e: 37_000,
  p3s: 37_000, p3e: 55_000,
  p4s: 55_000, p4e: 56_500,
  end: 56_500,
};

/* ─────────────────────────────────────────────
   AGENT DEFINITIONS  (metadata only, no state)
───────────────────────────────────────────── */
const AGENTS = {
  collector: {
    id: 'collector', name: 'macro_research_collector',
    label: 'Collecte Sources', emoji: '🔍', color: C.blue,
    duration: 25_000, start: T.p1s, end: T.p1e,
    desc: 'Collecte et agrège les sources macro-économiques mondiales via APIs et scraping.',
    steps: [
      'Initialisation des connecteurs API…',
      'Connexion Bloomberg Terminal, Reuters…',
      'Collecte données Fed, BCE, BNS, BoJ…',
      'Scraping actualités (47 sources)…',
      'Agrégation corpus documentaire…',
      'Déduplication & validation croisée…',
      'Indexation vectorielle terminée ✓',
    ],
  },
  synthesis: {
    id: 'synthesis', name: 'comparative_synthesis_agent',
    label: 'Analyse Comparative', emoji: '⚖️', color: C.violet,
    duration: 12_000, start: T.p2s, end: T.p2e,
    desc: 'Analyse comparative multi-sources avec LLM — détection signaux macro.',
    steps: [
      'Chargement corpus (2 847 documents)…',
      'Analyse de sentiment marchés…',
      'Comparaison indicateurs YoY / QoQ…',
      'Détection signaux macro-économiques…',
      'Scoring divergences inter-banques…',
      'Génération synthèse analytique LLM…',
    ],
  },
  dashboard: {
    id: 'dashboard', name: 'dashboard_generator_agent',
    label: 'Dashboard TSX', emoji: '📊', color: C.green,
    duration: 18_000, start: T.p3s, end: T.p3s + 18_000,
    desc: 'Génération du dashboard React/TSX interactif avec visualisations Recharts.',
    steps: [
      'Structuration données visualisation…',
      'Génération composants Recharts…',
      'Compilation dashboard TSX…',
      'Tree-shaking & optimisation bundle…',
      'Injection données temps-réel…',
      'Export artefact HTML/TSX…',
    ],
  },
  pdf: {
    id: 'pdf', name: 'pdf_report_generator',
    label: 'Rapport PDF', emoji: '📄', color: C.amber,
    duration: 16_000, start: T.p3s, end: T.p3s + 16_000,
    desc: 'Génération du rapport PDF exécutif haute qualité, 48 pages, signatures numériques.',
    steps: [
      'Chargement template LaTeX…',
      'Injection données analytiques…',
      'Rendu graphiques 300 dpi…',
      'Compilation PDF/A-2b…',
      'Signature numérique & métadonnées…',
      'Export rapport final (48 pages)…',
    ],
  },
};

const ORDER = ['collector', 'synthesis', 'dashboard', 'pdf'];

const AGENT_EMOJI = {
  Orchestrateur:                '🎯',
  macro_research_collector:     '🔍',
  comparative_synthesis_agent:  '⚖️',
  dashboard_generator_agent:    '📊',
  pdf_report_generator:         '📄',
};

const LOG_COLORS = {
  success: C.statusOk,
  error:   C.statusErr,
  warning: C.statusWarn,
  info:    C.statusRun,
};

/* ─────────────────────────────────────────────
   STATE & REDUCER
───────────────────────────────────────────── */
const initialState = {
  globalStatus: 'idle',   // idle | running | success | error
  lastRun:      null,
  progress:     0,
  currentStep:  null,
  agents: {
    collector: { status: 'idle', duration: 0 },
    synthesis: { status: 'idle', duration: 0 },
    dashboard: { status: 'idle', duration: 0 },
    pdf:       { status: 'idle', duration: 0 },
  },
  logs: [],
};

function reducer(state, action) {
  switch (action.type) {

    case 'START_WORKFLOW':
      return {
        ...initialState,
        globalStatus: 'running',
        progress:     0,
        lastRun:      state.lastRun,   // preserve previous run timestamp
      };

    case 'UPDATE_AGENT':
      return {
        ...state,
        agents: {
          ...state.agents,
          [action.agent]: {
            status:   action.status,
            duration: action.duration,
          },
        },
      };

    case 'UPDATE_PROGRESS':
      return {
        ...state,
        progress:    action.progress,
        currentStep: action.currentStep,
      };

    case 'ADD_LOG':
      return {
        ...state,
        logs: [
          ...state.logs,
          {
            id:        Date.now() + Math.random(),
            timestamp: action.timestamp,
            agent:     action.agent,
            message:   action.message,
            logType:   action.logType,   // 'info' | 'success' | 'warning' | 'error'
          },
        ].slice(-80),
      };

    case 'COMPLETE_WORKFLOW':
      return {
        ...state,
        globalStatus: 'success',
        progress:     100,
        lastRun:      Date.now(),
        currentStep:  null,
      };

    case 'RESET':
      return {
        ...initialState,
        lastRun: state.lastRun,
      };

    default:
      return state;
  }
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function stepForPct(pct, len) {
  return Math.min(Math.floor((pct / 100) * len), len - 1);
}
function fmtS(ms)     { return `${(ms / 1000).toFixed(1)}s`; }
function fmtClock(ms) {
  const s  = Math.floor(ms / 1000);
  const cs = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}.${cs}`;
}
function timeAgo(ts) {
  if (!ts) return null;
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5)    return 'just now';
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

/* ─────────────────────────────────────────────
   SIMULATION — initial tracking snapshot
───────────────────────────────────────────── */
function mkSimState() {
  return {
    steps:     { collector: -1, synthesis: -1, dashboard: -1, pdf: -1 },
    started:   { collector: false, synthesis: false, dashboard: false, pdf: false },
    completed: { collector: false, synthesis: false, dashboard: false, pdf: false },
    emailDone:    false,
    workflowDone: false,
  };
}

/* ─────────────────────────────────────────────
   ATOMS
───────────────────────────────────────────── */
function Pill({ label, color, bg, dot, check }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
      color, background: bg, border: `1px solid ${color}40`,
    }}>
      {dot   && <span className="blink" style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />}
      {check && <CheckCircle2 size={10} />}
      {label}
    </span>
  );
}

function StatusPill({ status }) {
  const M = {
    idle:      { label: 'Idle',    color: C.statusIdle, bg: '#1f2937', dot: false, check: false },
    running:   { label: 'Running', color: C.statusRun,  bg: '#172554', dot: true,  check: false },
    completed: { label: 'Success', color: C.statusOk,   bg: '#052e16', dot: false, check: true  },
    success:   { label: 'Success', color: C.statusOk,   bg: '#052e16', dot: false, check: true  },
    error:     { label: 'Error',   color: C.statusErr,  bg: '#450a0a', dot: false, check: false },
  };
  const m = M[status] ?? M.idle;
  return <Pill {...m} />;
}

function ProgressBar({ pct, gradient, color, h = 6 }) {
  return (
    <div style={{ height: h, background: `${color}22`, borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: gradient ?? `linear-gradient(90deg,${color}99,${color})`,
        borderRadius: 99, transition: 'width 0.25s ease',
        position: 'relative', boxShadow: `0 0 8px 1px ${color}55`,
      }}>
        <span style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)',
          animation: 'beam 1.6s linear infinite', borderRadius: 99,
        }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HEADER
───────────────────────────────────────────── */
function AppHeader({ globalStatus, lastRun, elapsedRef }) {
  const isRunning = globalStatus === 'running';
  // elapsedRef.current is updated every rAF; reads are stable because
  // UPDATE_PROGRESS dispatches each frame, triggering re-render.
  const elapsed = elapsedRef.current;

  return (
    <header style={{
      background: 'rgba(15,23,42,0.97)', borderBottom: `1px solid ${C.border}`,
      backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 50,
      padding: '0 28px', height: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 22 }}>🎯</span>
        <div>
          <div style={{
            fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em',
            background: 'linear-gradient(90deg,#ec4899,#3b82f6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>MacroSynthAI</div>
          <div style={{ fontSize: 10, color: C.textDim, letterSpacing: '0.06em', marginTop: 1 }}>
            AGENT ORCHESTRATION PLATFORM
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {isRunning && (
          <span style={{ fontFamily: 'monospace', fontSize: 13, color: C.statusRun, fontWeight: 600 }}>
            <span className="blink" style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: C.statusRun, marginRight: 6, verticalAlign: 'middle' }} />
            {fmtClock(elapsed)}
          </span>
        )}
        <StatusPill status={globalStatus} />
        <div style={{ fontSize: 11, color: C.textDim, textAlign: 'right', lineHeight: 1.5 }}>
          <div>Last run</div>
          <div style={{ color: lastRun ? C.textMuted : C.textDim }}>{timeAgo(lastRun) ?? '—'}</div>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────
   ORCHESTRATOR CARD
───────────────────────────────────────────── */
function OrchestratorCard({ globalStatus, progress, currentStep, elapsedRef, onLaunch, onReset }) {
  const running   = globalStatus === 'running';
  const completed = globalStatus === 'success';
  const elapsed   = elapsedRef.current;

  return (
    <div style={{
      background: C.card,
      border: `1.5px solid ${running ? C.pink + '88' : completed ? C.statusOk + '66' : C.pink + '33'}`,
      borderRadius: 20, padding: '28px 32px',
      position: 'relative', overflow: 'hidden',
      boxShadow: running ? `0 0 48px -8px ${C.pink}40` : completed ? `0 0 24px -8px ${C.statusOk}30` : 'none',
      transition: 'box-shadow 0.5s ease, border-color 0.4s ease',
    }}>
      {/* Background decorations */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.025, pointerEvents: 'none', backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle,${C.pink}18 0%,transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ position: 'relative' }}>
        {/* Identity row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              {running && <span className="pulse-ring" style={{ position: 'absolute', inset: -7, borderRadius: '50%', border: `2px solid ${C.pink}` }} />}
              <div style={{ width: 54, height: 54, borderRadius: 16, background: `linear-gradient(135deg,${C.pink}22,${C.violet}22)`, border: `1.5px solid ${running ? C.pink + '66' : C.pink + '33'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                {running ? <Loader2 size={24} color={C.pink} className="spin" /> : '🎯'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 4 }}>Orchestrateur principal</div>
              <div className={running ? 'shimmer-text' : ''} style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.01em', color: running ? undefined : completed ? C.statusOk : C.text }}>
                🎯 Orchestrator
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: 'monospace', marginTop: 3 }}>macro_synthesis_orchestrator</div>
            </div>
          </div>
          <StatusPill status={globalStatus} />
        </div>

        {/* Progress bar — state.progress drives this */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: running ? C.pink : completed ? C.statusOk : C.textDim }}>
              {progress.toFixed(1)}%
            </span>
            <span style={{ fontSize: 11, color: C.textMuted }}>
              {running ? fmtClock(elapsed) : completed ? `${fmtS(T.end)} total` : `~${fmtS(T.end)} estimé`}
            </span>
          </div>
          <ProgressBar pct={progress} gradient="linear-gradient(90deg,#ec4899,#8b5cf6,#3b82f6)" color={C.pink} h={8} />
        </div>

        {/* Current step — state.currentStep */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: `${C.pink}0c`, border: `1px solid ${C.pink}22`,
          borderRadius: 10, padding: '9px 14px', marginBottom: 22,
          fontSize: 12, fontFamily: 'monospace',
          color: running ? C.pink : completed ? C.statusOk : C.textMuted,
        }}>
          {running
            ? <Loader2 size={11} color={C.pink} className="spin" />
            : completed
              ? <CheckCircle2 size={11} color={C.statusOk} />
              : <span style={{ width: 10, height: 10, borderRadius: '50%', background: C.textDim, display: 'inline-block', flexShrink: 0 }} />}
          <span>
            {currentStep ?? (completed ? 'Workflow terminé avec succès ✓' : 'Prêt à démarrer le workflow…')}
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onLaunch}
            disabled={running}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '11px 0', borderRadius: 12, border: 'none', cursor: running ? 'not-allowed' : 'pointer',
              background: running ? `linear-gradient(135deg,${C.pink}44,${C.blue}44)` : 'linear-gradient(135deg,#ec4899,#8b5cf6,#3b82f6)',
              color: '#fff', fontSize: 14, fontWeight: 700,
              opacity: running ? 0.6 : 1,
              boxShadow: running ? 'none' : '0 4px 20px -4px rgba(236,72,153,0.5)',
              transition: 'opacity 0.2s, box-shadow 0.2s, transform 0.1s',
            }}
            onMouseDown={e => { if (!running) e.currentTarget.style.transform = 'scale(0.98)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {running ? <><Loader2 size={15} className="spin" /> Running…</> : <>🚀 Launch MacroSynthAI</>}
          </button>
          <button
            onClick={onReset}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '11px 18px', borderRadius: 12,
              background: 'transparent', border: `1px solid ${C.border}`,
              cursor: 'pointer', color: C.textMuted, fontSize: 13, fontWeight: 600,
              transition: 'border-color 0.2s, color 0.2s, transform 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.text; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   AGENT CARD
   ag = { status: 'idle'|'running'|'completed', duration: ms }
───────────────────────────────────────────── */
function AgentCard({ def, ag }) {
  const { emoji, label, name, color, duration: totalDuration, desc } = def;
  const running   = ag.status === 'running';
  const completed = ag.status === 'completed';

  // Progress percentage derived from duration field
  const pct = completed ? 100
            : running   ? Math.min(100, (ag.duration / totalDuration) * 100)
            :              0;

  // Timer display
  let timerNode;
  if (running) {
    timerNode = (
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, color, fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>
        <span className="blink" style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
        {fmtS(ag.duration)}
        <span style={{ color: C.textDim, fontWeight: 400 }}>/ {fmtS(totalDuration)}</span>
      </span>
    );
  } else if (completed) {
    timerNode = (
      <span style={{ color: C.statusOk, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
        <CheckCircle2 size={12} /> Completed in {fmtS(ag.duration)}
      </span>
    );
  } else {
    timerNode = (
      <span style={{ color: C.textDim, fontSize: 12, fontStyle: 'italic' }}>Waiting…</span>
    );
  }

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${running ? color : completed ? C.statusOk : C.border}`,
      borderRadius: 16, padding: '18px 20px',
      position: 'relative', overflow: 'hidden',
      boxShadow: running ? `0 0 20px -6px ${color}44` : 'none',
      transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
    }}>
      {/* Top glow line when running */}
      {running && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${color},transparent)`, animation: 'beam 2s linear infinite' }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: `${color}18`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
            {running
              ? <Loader2 size={18} color={color} className="spin" />
              : <span style={{ filter: ag.status === 'idle' ? 'grayscale(1) opacity(0.35)' : 'none' }}>{emoji}</span>}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{label}</div>
            <div style={{ fontSize: 9, color: C.textMuted, fontFamily: 'monospace', marginTop: 3 }}>{name}</div>
          </div>
        </div>
        <StatusPill status={ag.status} />
      </div>

      <p style={{ fontSize: 11, color: C.textMuted, margin: '0 0 12px', lineHeight: 1.6 }}>{desc}</p>

      <ProgressBar pct={pct} color={ag.status === 'idle' ? C.textDim : color} h={5} />

      <div style={{ marginTop: 10 }}>{timerNode}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   EXECUTION LOG
   entry = { id, timestamp, agent, message, logType }
───────────────────────────────────────────── */
function ExecutionLog({ logs }) {
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>📋</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Execution Log</span>
        </div>
        <span style={{ fontSize: 11, color: C.textMuted, background: C.cardDeep, border: `1px solid ${C.border}`, padding: '2px 8px', borderRadius: 6 }}>
          {logs.length} entries
        </span>
      </div>

      <div style={{ maxHeight: 300, overflowY: 'auto', padding: '4px 0', scrollbarWidth: 'thin', scrollbarColor: `${C.border} transparent` }}>
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', color: C.textDim, fontSize: 12, padding: '36px 0', fontStyle: 'italic' }}>
            Waiting for workflow to start…
          </div>
        ) : (
          logs.map((entry, i) => {
            const msgColor = LOG_COLORS[entry.logType] ?? C.text;
            const agentColor = LOG_COLORS[entry.logType] ?? C.statusRun;
            const ts = entry.timestamp instanceof Date
              ? entry.timestamp.toTimeString().slice(0, 8)
              : new Date(entry.timestamp).toTimeString().slice(0, 8);
            return (
              <div
                key={entry.id}
                className="slide-in"
                style={{
                  display: 'flex', alignItems: 'baseline', gap: 0,
                  padding: '5px 20px',
                  borderBottom: i < logs.length - 1 ? `1px solid ${C.border}33` : 'none',
                  fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6,
                }}
              >
                {/* [HH:MM:SS] */}
                <span style={{ color: C.textDim, flexShrink: 0, marginRight: 8 }}>[{ts}]</span>
                {/* [emoji] */}
                <span style={{ fontSize: 13, flexShrink: 0, marginRight: 6, lineHeight: 1 }}>
                  {AGENT_EMOJI[entry.agent] ?? '🤖'}
                </span>
                {/* [Agent] */}
                <span style={{ color: agentColor, fontWeight: 700, flexShrink: 0, minWidth: 220, marginRight: 8 }}>
                  [{entry.agent}]
                </span>
                {/* Message */}
                <span style={{ color: msgColor }}>{entry.message}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────── */
export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const startRef  = useRef(null);   // workflow start timestamp
  const rafRef    = useRef(null);   // requestAnimationFrame id
  const simRef    = useRef(mkSimState()); // simulation tracking (not in state)
  const elapsedRef = useRef(0);     // current elapsed ms — read during render

  /* ── Simulation tick ─────────────────────── */
  const tick = useCallback(() => {
    if (!startRef.current) return;
    const ms  = Date.now() - startRef.current;
    const sim = simRef.current;

    // Persist elapsed for use in render (UPDATE_PROGRESS will trigger re-render)
    elapsedRef.current = ms;

    // ── Global progress & step label ──────────
    const progress = Math.min(100, (ms / T.end) * 100);
    let currentStep = null;
    if      (ms < T.p1e) currentStep = 'Step 1/4 — Collecte des sources macro-économiques';
    else if (ms < T.p2e) currentStep = 'Step 2/4 — Analyse comparative multi-sources';
    else if (ms < T.p3e) currentStep = 'Step 3/4 — Génération Dashboard TSX + Rapport PDF';
    else if (ms < T.end) currentStep = 'Step 4/4 — Envoi email board@veillemacro.io';

    dispatch({ type: 'UPDATE_PROGRESS', progress, currentStep });

    // ── Per-agent updates ─────────────────────
    for (const id of ORDER) {
      const def = AGENTS[id];

      // Agent starts
      if (ms >= def.start && ms < def.end && !sim.started[id]) {
        sim.started[id] = true;
        dispatch({ type: 'UPDATE_AGENT', agent: id, status: 'running', duration: 0 });
        dispatch({ type: 'ADD_LOG', timestamp: new Date(), agent: 'Orchestrateur', message: `→ ${def.name} démarré`, logType: 'info' });
      }

      // Agent running — update duration
      if (ms >= def.start && ms < def.end && sim.started[id] && !sim.completed[id]) {
        dispatch({ type: 'UPDATE_AGENT', agent: id, status: 'running', duration: ms - def.start });

        // Step log entries
        const pct = ((ms - def.start) / def.duration) * 100;
        const si  = stepForPct(pct, def.steps.length);
        if (si !== sim.steps[id] && si > 0) {
          sim.steps[id] = si;
          dispatch({ type: 'ADD_LOG', timestamp: new Date(), agent: def.name, message: def.steps[si - 1], logType: 'info' });
        }
      }

      // Agent completes
      if (ms >= def.end && !sim.completed[id]) {
        sim.completed[id] = true;
        dispatch({ type: 'UPDATE_AGENT', agent: id, status: 'completed', duration: def.duration });
        const doneMsg = {
          collector: '✓ Collecte terminée — 2 847 documents indexés',
          synthesis: '✓ Synthèse générée — 14 signaux macro détectés',
          dashboard: '✓ Dashboard TSX généré — 12 composants, 847 KB',
          pdf:       '✓ Rapport PDF généré — 48 pages, 3.2 MB',
        }[id];
        dispatch({ type: 'ADD_LOG', timestamp: new Date(), agent: def.name, message: doneMsg, logType: 'success' });
      }
    }

    // ── Phase transitions (orchestrator logs) ─
    if (ms >= T.p2s && ms < T.p2s + 200 && !sim._p2logged) {
      sim._p2logged = true;
      dispatch({ type: 'ADD_LOG', timestamp: new Date(), agent: 'Orchestrateur', message: 'Transition Phase 2 → comparative_synthesis_agent', logType: 'info' });
    }
    if (ms >= T.p3s && ms < T.p3s + 200 && !sim._p3logged) {
      sim._p3logged = true;
      dispatch({ type: 'ADD_LOG', timestamp: new Date(), agent: 'Orchestrateur', message: 'Fork parallèle → dashboard_generator + pdf_report_generator', logType: 'info' });
    }

    // ── Email ─────────────────────────────────
    if (ms >= T.p4s && !sim.emailDone) {
      sim.emailDone = true;
      dispatch({ type: 'ADD_LOG', timestamp: new Date(), agent: 'Orchestrateur', message: '📧 Email envoyé — board@veillemacro.io', logType: 'success' });
    }

    // ── Workflow complete ─────────────────────
    if (ms >= T.end && !sim.workflowDone) {
      sim.workflowDone = true;
      dispatch({ type: 'COMPLETE_WORKFLOW' });
      dispatch({ type: 'ADD_LOG', timestamp: new Date(), agent: 'Orchestrateur', message: `Workflow MacroSynthAI complété en ${(ms / 1000).toFixed(1)}s`, logType: 'success' });
      return; // stop loop
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []); // dispatch is stable — no deps needed

  /* ── Handlers ────────────────────────────── */
  const handleLaunch = useCallback(() => {
    if (state.globalStatus === 'running') return;
    simRef.current  = mkSimState();
    elapsedRef.current = 0;
    dispatch({ type: 'START_WORKFLOW' });
    dispatch({ type: 'ADD_LOG', timestamp: new Date(), agent: 'Orchestrateur', message: 'Workflow MacroSynthAI démarré — Phase 1 initialisée', logType: 'info' });
    startRef.current = Date.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [state.globalStatus, tick]);

  const handleReset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current   = null;
    elapsedRef.current = 0;
    simRef.current     = mkSimState();
    dispatch({ type: 'RESET' });
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  /* ── Destructure state ───────────────────── */
  const { globalStatus, lastRun, progress, currentStep, agents, logs } = state;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'SF Mono','Fira Code','Consolas',monospace" }}>

      <AppHeader globalStatus={globalStatus} lastRun={lastRun} elapsedRef={elapsedRef} />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Orchestrator */}
        <OrchestratorCard
          globalStatus={globalStatus}
          progress={progress}
          currentStep={currentStep}
          elapsedRef={elapsedRef}
          onLaunch={handleLaunch}
          onReset={handleReset}
        />

        {/* 3-col grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {['collector', 'synthesis', 'dashboard'].map(id => (
            <AgentCard key={id} def={AGENTS[id]} ag={agents[id]} />
          ))}
        </div>

        {/* PDF alone */}
        <AgentCard def={AGENTS.pdf} ag={agents.pdf} />

        {/* Log */}
        <ExecutionLog logs={logs} />

        <div style={{ textAlign: 'center', color: C.textDim, fontSize: 10, letterSpacing: '0.05em', paddingBottom: 8 }}>
          MacroSynthAI · Agent Orchestration Platform · {new Date().getFullYear()}
        </div>

      </main>
    </div>
  );
}
