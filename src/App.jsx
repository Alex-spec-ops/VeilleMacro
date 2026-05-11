import React, { useReducer, useEffect, useRef, useCallback, useState } from 'react';
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
  statusPend: '#f59e0b',
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
   AGENT DEFINITIONS
───────────────────────────────────────────── */
const AGENTS = {
  collector: {
    id: 'collector', name: 'macro_research_collector',
    label: 'Collecte Sources', emoji: '🔍', color: C.blue,
    simulatedDuration: 25_000,
    desc: 'Collecte et agrège les sources macro-économiques mondiales via APIs et scraping.',
    logs: [
      '🔍 Searching for Jurrien Timmer publications...',
      '✅ Found Timmer publication (15/04/2026)',
      '🔍 Searching for Michael Cembalest publications...',
      '✅ Found EOTM publication (10/04/2026)',
      '🔍 Searching for Jeremy Grantham...',
      '❌ No recent publication from Grantham',
      '📊 Analysis: 4/6 sources collected successfully',
    ],
    doneMsg: '✅ Collector completed — 4/6 sources collected',
  },
  synthesis: {
    id: 'synthesis', name: 'comparative_synthesis_agent',
    label: 'Analyse Comparative', emoji: '⚖️', color: C.violet,
    simulatedDuration: 12_000,
    desc: 'Analyse comparative multi-sources avec LLM — détection signaux macro.',
    logs: [
      '🔄 Analyzing convergences across sources...',
      '✅ Identified 3 strategic convergences',
      '🔄 Analyzing divergences...',
      '✅ Identified 2 notable divergences',
      '💡 Extracted 5 new investment ideas',
      '⚠️ Aggregated 4 risk signals',
    ],
    doneMsg: '✅ Synthesis completed — 5 ideas, 4 risk signals',
  },
  dashboard: {
    id: 'dashboard', name: 'dashboard_generator_agent',
    label: 'Dashboard TSX', emoji: '📊', color: C.green,
    simulatedDuration: 18_000,
    desc: 'Génération du dashboard React/TSX interactif avec visualisations Recharts.',
    logs: [
      '⚙️ Loading dashboard template...',
      '📝 Generating TSX code...',
      '🎨 Applying shadcn/ui components...',
      '📊 Embedding synthesis data...',
      '✅ Dashboard generated (1247 lines)',
      '🚀 Deploying to Dust Frame...',
    ],
    doneMsg: '✅ Dashboard deployed — 1247 lines, Dust Frame',
  },
  pdf: {
    id: 'pdf', name: 'pdf_report_generator',
    label: 'Rapport PDF', emoji: '📄', color: C.amber,
    simulatedDuration: 16_000,
    desc: 'Génération du rapport PDF exécutif haute qualité, 48 pages, signatures numériques.',
    logs: [
      '📄 Initializing ReportLab...',
      '📝 Generating Page 1: Executive Summary...',
      '📊 Rendering dashboard table...',
      '📝 Generating Page 2: Convergences...',
      '📝 Generating Page 3: Risks & Authors...',
      '✅ PDF generated (3 pages, 245KB)',
    ],
    doneMsg: '✅ PDF report generated — 3 pages, 245 KB',
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
        lastRun:      state.lastRun,
      };

    case 'UPDATE_AGENT':
      return {
        ...state,
        agents: {
          ...state.agents,
          [action.agent]: { status: action.status, duration: action.duration },
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
            logType:   action.logType,
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
      return { ...initialState, lastRun: state.lastRun };

    default:
      return state;
  }
}

/* ─────────────────────────────────────────────
   SIMULATION HELPERS
───────────────────────────────────────────── */

/** Basic sleep — no cancellation. */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Cancellable sleep: polls every POLL ms.
 * Throws { cancelled: true } if signal.cancelled before ms elapse.
 */
function sleepC(ms, signal) {
  const POLL = 150;
  return new Promise((resolve, reject) => {
    let remaining = ms;
    const step = () => {
      if (signal.cancelled) {
        const e = new Error('cancelled');
        e.cancelled = true;
        return reject(e);
      }
      if (remaining <= 0) return resolve();
      const wait = Math.min(POLL, remaining);
      remaining -= wait;
      setTimeout(step, wait);
    };
    step();
  });
}

/**
 * Infer log type from message prefix emoji.
 * ✅ → success | ❌ → error | ⚠️ → warning | anything else → info
 */
function inferLogType(msg) {
  if (msg.startsWith('✅')) return 'success';
  if (msg.startsWith('❌')) return 'error';
  if (msg.startsWith('⚠️')) return 'warning';
  return 'info';
}

/**
 * runAgent(agentId, dispatch, signal, config?)
 *
 * Lifecycle:
 *   1. status → 'pending'  (1 s)
 *   2. status → 'running'  (simulatedDuration ms)
 *      → dispatches progressive log messages
 *      → dispatches UPDATE_AGENT every 100 ms with current elapsed
 *   3. status → 'success'  (final duration)
 */
async function runAgent(agentId, dispatch, signal, config = {}) {
  const def = AGENTS[agentId];

  // ── 1. Pending ──────────────────────────────
  dispatch({ type: 'UPDATE_AGENT', agent: agentId, status: 'pending', duration: 0 });
  dispatch({
    type: 'ADD_LOG', timestamp: new Date(),
    agent: def.name, message: `⏳ ${def.label} — initialisation en cours…`, logType: 'info',
  });
  await sleepC(1_000, signal);

  // ── 2. Running ──────────────────────────────
  const t0 = Date.now();
  dispatch({ type: 'UPDATE_AGENT', agent: agentId, status: 'running', duration: 0 });
  dispatch({
    type: 'ADD_LOG', timestamp: new Date(),
    agent: def.name, message: `▶ ${def.label} démarré`, logType: 'info',
  });

  // Schedule progressive log messages evenly across simulatedDuration
  const stepDelay = def.simulatedDuration / (def.logs.length + 1);
  const logTimers = def.logs.map((msg, i) =>
    setTimeout(() => {
      if (signal.cancelled) return;
      dispatch({ type: 'ADD_LOG', timestamp: new Date(), agent: def.name, message: msg, logType: inferLogType(msg) });
    }, stepDelay * (i + 1)),
  );

  // Update duration every 100 ms so the progress bar animates smoothly
  const durationInterval = setInterval(() => {
    if (signal.cancelled) return;
    dispatch({ type: 'UPDATE_AGENT', agent: agentId, status: 'running', duration: Date.now() - t0 });
  }, 100);

  try {
    await sleepC(def.simulatedDuration, signal);
  } finally {
    clearInterval(durationInterval);
    logTimers.forEach(clearTimeout);
  }

  // ── 3. Success ──────────────────────────────
  dispatch({ type: 'UPDATE_AGENT', agent: agentId, status: 'success', duration: def.simulatedDuration });
  dispatch({
    type: 'ADD_LOG', timestamp: new Date(),
    agent: def.name, message: def.doneMsg, logType: inferLogType(def.doneMsg),
  });
}

/**
 * startWorkflow(dispatch, signal)
 *
 * Sequential orchestration:
 *   5%  → Step 1/4 → collector
 *   35% → Step 2/4 → synthesis
 *   55% → Step 3/4 → dashboard ∥ pdf
 *   95% → Step 4/4 → sleep(2s) → email
 *   100% → COMPLETE_WORKFLOW
 */
async function startWorkflow(dispatch, signal) {
  const upd = (progress, currentStep) =>
    dispatch({ type: 'UPDATE_PROGRESS', progress, currentStep });

  const log = (message, logType = 'info') =>
    dispatch({ type: 'ADD_LOG', timestamp: new Date(), agent: 'Orchestrateur', message, logType });

  try {
    // ── Init ────────────────────────────────
    log('🚀 MacroSynthAI workflow initiated');

    // ── Step 1: Source collection ────────────
    upd(5, 'Step 1/4: Source collection');
    log('Phase 1 → macro_research_collector');
    await runAgent('collector', dispatch, signal);

    // ── Step 2: Comparative synthesis ────────
    upd(35, 'Step 2/4: Comparative synthesis');
    log('Phase 2 → comparative_synthesis_agent');
    await runAgent('synthesis', dispatch, signal);

    // ── Step 3: Parallel outputs ─────────────
    upd(55, 'Step 3/4: Generating outputs');
    log('Phase 3 — fork parallèle → dashboard_generator + pdf_report_generator');
    await Promise.all([
      runAgent('dashboard', dispatch, signal),
      runAgent('pdf',       dispatch, signal),
    ]);

    // ── Step 4: Send email ───────────────────
    upd(95, 'Step 4/4: Sending email');
    log('Envoi email → board@veillemacro.io…');
    await sleepC(2_000, signal);
    log('📧 Email sent — dashboard + PDF report attached', 'success');

    // ── Complete ─────────────────────────────
    upd(100, null);
    log('✅ Workflow completed successfully', 'success');
    dispatch({ type: 'COMPLETE_WORKFLOW' });

  } catch (e) {
    if (!e.cancelled) throw e;
    // Cancelled — RESET already dispatched by handleReset; nothing to do here.
  }
}

/* ─────────────────────────────────────────────
   FORMATTERS
───────────────────────────────────────────── */
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
    idle:    { label: 'Idle',    color: C.statusIdle, bg: '#1f2937', dot: false, check: false },
    pending: { label: 'Pending', color: C.statusPend, bg: '#451a03', dot: true,  check: false },
    running: { label: 'Running', color: C.statusRun,  bg: '#172554', dot: true,  check: false },
    success: { label: 'Success', color: C.statusOk,   bg: '#052e16', dot: false, check: true  },
    error:   { label: 'Error',   color: C.statusErr,  bg: '#450a0a', dot: false, check: false },
  };
  const m = M[status] ?? M.idle;
  return <Pill {...m} />;
}

function ProgressBar({ pct, gradient, color, h = 6 }) {
  const active = pct > 0 && pct < 100;
  return (
    <div style={{ height: h, background: `${color}22`, borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: gradient ?? `linear-gradient(90deg,${color}99,${color})`,
        borderRadius: 99, transition: 'width 0.3s ease',
        position: 'relative',
        boxShadow: active ? `0 0 8px 1px ${color}55` : 'none',
      }}>
        {active && (
          <span style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)',
            animation: 'beam 1.6s linear infinite', borderRadius: 99,
          }} />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HEADER
───────────────────────────────────────────── */
function AppHeader({ globalStatus, lastRun, elapsed }) {
  const isRunning = globalStatus === 'running';
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
function OrchestratorCard({ globalStatus, progress, currentStep, elapsed, onLaunch, onReset }) {
  const running   = globalStatus === 'running';
  const completed = globalStatus === 'success';

  return (
    <div style={{
      background: C.card,
      border: `1.5px solid ${running ? C.pink + '88' : completed ? C.statusOk + '66' : C.pink + '33'}`,
      borderRadius: 20, padding: '28px 32px',
      position: 'relative', overflow: 'hidden',
      boxShadow: running ? `0 0 48px -8px ${C.pink}40` : completed ? `0 0 24px -8px ${C.statusOk}30` : 'none',
      transition: 'box-shadow 0.5s ease, border-color 0.4s ease',
    }}>
      {/* BG decorations */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.025, pointerEvents: 'none', backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle,${C.pink}18 0%,transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ position: 'relative' }}>
        {/* Identity */}
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

        {/* Progress bar — driven by state.progress */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: running ? C.pink : completed ? C.statusOk : C.textDim }}>
              {progress.toFixed(1)}%
            </span>
            <span style={{ fontSize: 11, color: C.textMuted }}>
              {running ? fmtClock(elapsed) : completed ? '56.5s total' : '~56.5s estimé'}
            </span>
          </div>
          <ProgressBar pct={progress} gradient="linear-gradient(90deg,#ec4899,#8b5cf6,#3b82f6)" color={C.pink} h={8} />
        </div>

        {/* Current step — driven by state.currentStep */}
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
          <span>{currentStep ?? (completed ? 'Workflow terminé avec succès ✓' : 'Prêt à démarrer le workflow…')}</span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onLaunch}
            disabled={running}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '11px 0', borderRadius: 12, border: 'none', cursor: running ? 'not-allowed' : 'pointer',
              background: running
                ? `linear-gradient(135deg,${C.pink}44,${C.blue}44)`
                : 'linear-gradient(135deg,#ec4899,#8b5cf6,#3b82f6)',
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
   ag.status: 'idle' | 'pending' | 'running' | 'success'
   ag.duration: elapsed ms (running) or final ms (success)
───────────────────────────────────────────── */
function AgentCard({ def, ag }) {
  const { emoji, label, name, color, simulatedDuration, desc } = def;
  const isPending  = ag.status === 'pending';
  const isRunning  = ag.status === 'running';
  const isSuccess  = ag.status === 'success';

  // Per-agent progress derived from ag.duration
  const pct = isSuccess  ? 100
            : isRunning  ? Math.min(99, (ag.duration / simulatedDuration) * 100)
            : isPending  ? 0
            :              0;

  // Timer display
  let timerNode;
  if (isPending) {
    timerNode = (
      <span style={{ color: C.statusPend, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
        <span className="blink" style={{ width: 6, height: 6, borderRadius: '50%', background: C.statusPend, display: 'inline-block' }} />
        Initialisation…
      </span>
    );
  } else if (isRunning) {
    timerNode = (
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, color, fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>
        <span className="blink" style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
        {fmtS(ag.duration)}
        <span style={{ color: C.textDim, fontWeight: 400 }}>/ {fmtS(simulatedDuration)}</span>
      </span>
    );
  } else if (isSuccess) {
    timerNode = (
      <span style={{ color: C.statusOk, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
        <CheckCircle2 size={12} /> Completed in {fmtS(simulatedDuration)}
      </span>
    );
  } else {
    timerNode = (
      <span style={{ color: C.textDim, fontSize: 12, fontStyle: 'italic' }}>Waiting…</span>
    );
  }

  const activeBorder = isPending ? C.statusPend : isRunning ? color : isSuccess ? C.statusOk : C.border;

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${activeBorder}`,
      borderRadius: 16, padding: '18px 20px',
      position: 'relative', overflow: 'hidden',
      boxShadow: isRunning ? `0 0 20px -6px ${color}44` : isPending ? `0 0 12px -4px ${C.statusPend}33` : 'none',
      transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
    }}>
      {/* Top glow line */}
      {(isRunning || isPending) && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg,transparent,${isRunning ? color : C.statusPend},transparent)`,
          animation: 'beam 2s linear infinite',
        }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: `${color}18`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
            {isRunning
              ? <Loader2 size={18} color={color} className="spin" />
              : isPending
                ? <Loader2 size={18} color={C.statusPend} className="spin" />
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
            const msgColor   = entry.logType === 'success' ? C.statusOk
                             : entry.logType === 'error'   ? C.statusErr
                             : entry.logType === 'warning' ? C.statusWarn
                             :                               C.text;
            const agentColor = LOG_COLORS[entry.logType] ?? C.statusRun;
            const ts = (entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp))
              .toTimeString().slice(0, 8);

            return (
              <div
                key={entry.id}
                className="slide-in"
                style={{
                  display: 'flex', alignItems: 'baseline',
                  padding: '5px 20px',
                  borderBottom: i < logs.length - 1 ? `1px solid ${C.border}33` : 'none',
                  fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6,
                }}
              >
                <span style={{ color: C.textDim, flexShrink: 0, marginRight: 8 }}>[{ts}]</span>
                <span style={{ fontSize: 13, flexShrink: 0, marginRight: 6, lineHeight: 1 }}>
                  {AGENT_EMOJI[entry.agent] ?? '🤖'}
                </span>
                <span style={{ color: agentColor, fontWeight: 700, flexShrink: 0, minWidth: 220, marginRight: 8 }}>
                  [{entry.agent}]
                </span>
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
  const [state, dispatch]   = useReducer(reducer, initialState);
  const [elapsed, setElapsed] = useState(0);  // display clock (ms)

  const startRef  = useRef(null);  // workflow start Date.now()
  const signalRef = useRef({ cancelled: false });
  const clockRef  = useRef(null);  // setInterval id for the header clock

  /* ── Launch ────────────────────────────── */
  const handleLaunch = useCallback(async () => {
    if (state.globalStatus === 'running') return;

    // Fresh signal for this run
    const signal = { cancelled: false };
    signalRef.current = signal;

    // Start display clock
    startRef.current = Date.now();
    setElapsed(0);
    clockRef.current = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 100);

    dispatch({ type: 'START_WORKFLOW' });

    await startWorkflow(dispatch, signal);

    // Stop clock when workflow ends (success or cancel)
    clearInterval(clockRef.current);
  }, [state.globalStatus]);

  /* ── Reset ─────────────────────────────── */
  const handleReset = useCallback(() => {
    signalRef.current.cancelled = true; // interrupt any sleepC
    clearInterval(clockRef.current);
    startRef.current = null;
    setElapsed(0);
    dispatch({ type: 'RESET' });
  }, []);

  /* ── Cleanup on unmount ─────────────────── */
  useEffect(() => () => {
    signalRef.current.cancelled = true;
    clearInterval(clockRef.current);
  }, []);

  const { globalStatus, lastRun, progress, currentStep, agents, logs } = state;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'SF Mono','Fira Code','Consolas',monospace" }}>

      <AppHeader
        globalStatus={globalStatus}
        lastRun={lastRun}
        elapsed={elapsed}
      />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        <OrchestratorCard
          globalStatus={globalStatus}
          progress={progress}
          currentStep={currentStep}
          elapsed={elapsed}
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

        <ExecutionLog logs={logs} />

        <div style={{ textAlign: 'center', color: C.textDim, fontSize: 10, letterSpacing: '0.05em', paddingBottom: 8 }}>
          MacroSynthAI · Agent Orchestration Platform · {new Date().getFullYear()}
        </div>

      </main>
    </div>
  );
}
