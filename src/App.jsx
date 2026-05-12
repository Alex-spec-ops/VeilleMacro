import React, { useReducer, useEffect, useRef, useCallback } from 'react';

import { Header }           from './components/Header.jsx';
import { OrchestratorCard } from './components/OrchestratorCard.jsx';
import { AgentCard }        from './components/AgentCard.jsx';
import { ExecutionLog }     from './components/ExecutionLog.jsx';

import { C }                        from './constants.js';
import { inferLogType, sleep }      from './utils.js';

/* ─────────────────────────────────────────────
   AGENT DEFINITIONS  (metadata, no state)
───────────────────────────────────────────── */
const AGENTS = {
  collector: {
    id: 'collector', name: 'macro_research_collector',
    label: 'Collecte Sources', emoji: '🔍', color: C.blue,
    simulatedDuration: 48_000,
    desc: 'Collecte les publications récentes de 22 stratégistes macro via web_search & web_fetch. Analyse structurée JSON par source.',
    logs: [
      // ── Sources 1–3 (high priority) ──────────────────────────────
      '🔍 [1/22] web_search → Jurrien Timmer · Fidelity Insights (timmer-global-macro-view)…',
      '✅ [1/22] Timmer "Broadening Out" found — 28/04/2026 · web_fetch OK (4 200 tokens)',
      '🔍 [2/22] web_search → Michael Cembalest · EOTM (jpmorgan.com/am/eotm)…',
      '✅ [2/22] EOTM "The Debt Problem" found — 22/04/2026 · web_fetch OK (6 800 tokens)',
      '🔍 [3/22] web_search → Jeremy Grantham · GMO Quarterly Letter (gmo.com/europe)…',
      '❌ [3/22] No GMO publication in the requested period — added to sources_not_found',
      // ── Sources 4–8 ───────────────────────────────────────────────
      '🔍 [4/22] web_search → Marko Papic · BCA GeoMacro (bcaresearch.com)…',
      '✅ [4/22] BCA GeoMacro Strategy found — 25/04/2026 · web_fetch OK (3 100 tokens)',
      '🔍 [5/22] web_search → François Trahan · BMO Capital (capitalmarkets.bmo.com)…',
      '⚠️ [5/22] BMO paywall detected — partial metadata only (title + date extracted)',
      '🔍 [6/22] web_search → Howard Marks · Oaktree Memo (oaktreecapital.com/insights)…',
      '✅ [6/22] Marks Memo "On Bubble Watch" found — 15/04/2026 · web_fetch OK (5 400 tokens)',
      '🔍 [7/22] web_search → Albert Edwards · SG Global Strategy Weekly (sgmarkets.com)…',
      '✅ [7/22] Edwards "Ice Age Still Intact" found — 24/04/2026 · web_fetch OK (2 900 tokens)',
      '🔍 [8/22] web_search → Bill Ackman · Pershing Square letters (pershingsquareholdings.com)…',
      '❌ [8/22] No shareholder letter in period — added to sources_not_found',
      // ── Sources 9–15 (batch) ──────────────────────────────────────
      '🔍 [9-15/22] Batch scan: Elliott · Burniske · Asness · Saravelos · Currie · Kelly · Summers…',
      '✅ [11/22] Cliff Asness · AQR "Value Is Still Cheap" — 20/04/2026',
      '✅ [12/22] George Saravelos · DB FX note — 26/04/2026 (via x.com/GSaravelos)',
      '✅ [15/22] Larry Summers · Bloomberg op-ed — 24/04/2026',
      '❌ [9/22] Bob Elliott — no public post in period · [14/22] Kevin Kelly behind paywall',
      // ── Sources 16–22 (batch) ─────────────────────────────────────
      '🔍 [16-22/22] Batch scan: Mauboussin · El-Erian · Roubini · Andurand · Druckenmiller · Buffett · Pozsar…',
      '✅ [17/22] Mohamed El-Erian · Bloomberg "Fed Credibility" — 27/04/2026',
      '✅ [18/22] Nouriel Roubini · Project Syndicate — 21/04/2026',
      '✅ [21/22] Warren Buffett · BRK Annual Letter (berkshirehathaway.com) — 12/04/2026',
      '❌ [22/22] Zoltan Pozsar — account suspended · no accessible publication',
      // ── Final tally ───────────────────────────────────────────────
      '📊 Tally: 14 found · 3 partial (paywall) · 5 not found · 0 hallucinated',
    ],
    doneMsg: '✅ Collector completed — 14/22 sources · 3 partial · period 01/04–28/04/2026',
  },
  synthesis: {
    id: 'synthesis', name: 'comparative_synthesis_agent',
    label: 'Analyse Comparative', emoji: '⚖️', color: C.violet,
    simulatedDuration: 28_000,
    desc: 'Synthèse comparative croisée de qualité CIO : convergences ≥3 auteurs, divergences, nouvelles idées, risques agrégés.',
    logs: [
      // ── Chargement de l'input ─────────────────────────────────────
      '📥 Input received — collector JSON · 14 sources_analyzed · 5 sources_not_found',
      '🔄 Parsing asset_class_positioning for all 14 sources…',
      '✅ Positioning matrix built (14 × 6 asset classes)',

      // ── Section 1 : Convergences ──────────────────────────────────
      '🔎 [Convergences] Scanning 10 priority themes…',
      '✅ [Theme 1] Valorisations US — consensus Bear · 6 auteurs alignés (Timmer · Marks · Asness · Grantham partial · Edwards · Roubini)',
      '✅ [Theme 2] Géopolitique / risque Chine-Taiwan — consensus Risk-off · 4 auteurs (Cembalest · Papic · Saravelos · El-Erian)',
      '✅ [Theme 3] Actions internationales EAFE/EM — consensus Bull · 4 auteurs (Timmer · Asness · Papic · El-Erian)',
      '✅ [Theme 4] IA / Hyperscalers — consensus Neutre-prudent · 3 auteurs (Cembalest · Mauboussin · Timmer)',
      '✅ [Theme 5] Politique Fed trop restrictive — consensus critique · 3 auteurs (Summers · El-Erian · Roubini)',
      '⚠️ [Theme 6] Bitcoin/Crypto — données insuffisantes (< 2 sources) · skipped per CRITICAL_RULES',

      // ── Section 2 : Divergences ───────────────────────────────────
      '🔎 [Divergences] Identifying explicit contradictions…',
      '✅ [Div. 1] Crédit HY : Marks (opportuniste / Bull) ↔ Edwards (Ice Age Bear / spread compression insoutenable)',
      '✅ [Div. 2] Récession 2026 : Roubini · Summers (probabilité élevée 60 %) ↔ Timmer · Papic (soft landing, pas de récession)',
      '✅ [Div. 3] Dollar : Saravelos (USD faiblesse structurelle) ↔ El-Erian (USD résilience sous-estimée)',

      // ── Section 3 : Nouvelles idées ───────────────────────────────
      '💡 [Ideas] Extracting non-mainstream / counter-intuitive ideas…',
      '💡 [Idea 1] Timmer — Bitcoin comme couverture dépréciation monétaire, cycle 4 ans bull confirmé',
      '💡 [Idea 2] Cembalest — Power infrastructure (data centers / électricité) = meilleur proxy IA vs Mag7',
      '💡 [Idea 3] Asness — Value factor en Europe : décote historique vs croissance US, mean reversion probable',
      '💡 [Idea 4] Papic — Géopolitique comme opportunité (pas seulement risque) : Inde, Brésil, ASEAN',

      // ── Section 4 : Risques agrégés ───────────────────────────────
      '⚠️ [Risks] Aggregating risks mentioned by ≥ 2 authors…',
      '⚠️ [Risk 1] ÉLEVÉ — Concentration Mag7 · 5 auteurs · risk of mean reversion brutal',
      '⚠️ [Risk 2] ÉLEVÉ — Déficit fiscal US non soutenable · 4 auteurs · impact taux longs',
      '⚠️ [Risk 3] MOYEN — Récession consommation US · 3 auteurs · leading indicators se retournent',
      '⚠️ [Risk 4] MOYEN — Escalade géopolitique Chine/Taiwan · 3 auteurs · choc supply chains',

      // ── Finalisation ──────────────────────────────────────────────
      '📊 Summary: 5 convergences · 3 divergences · 4 new ideas · 4 aggregated risks',
      '✅ JSON synthesis_output serialized — general_sentiment: Mitigé (risk-on sélectif)',
    ],
    doneMsg: '✅ Synthesis completed — 5 convergences · 3 divergences · 4 ideas · 4 risks',
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
      return { ...initialState, globalStatus: 'running', progress: 0, lastRun: state.lastRun };

    case 'UPDATE_AGENT':
      return {
        ...state,
        agents: {
          ...state.agents,
          [action.agent]: { status: action.status, duration: action.duration },
        },
      };

    case 'UPDATE_PROGRESS':
      return { ...state, progress: action.progress, currentStep: action.currentStep };

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
      return { ...state, globalStatus: 'success', progress: 100, lastRun: Date.now(), currentStep: null };

    case 'RESET':
      return { ...initialState, lastRun: state.lastRun };

    default:
      return state;
  }
}

/* ─────────────────────────────────────────────
   SIMULATION HELPERS
───────────────────────────────────────────── */
/** Cancellable sleep — polls every 150 ms. */
function sleepC(ms, signal) {
  const POLL = 150;
  return new Promise((resolve, reject) => {
    let remaining = ms;
    const step = () => {
      if (signal.cancelled) {
        const e = new Error('cancelled'); e.cancelled = true; return reject(e);
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
 * runAgent(agentId, dispatch, signal, config?)
 *
 * 1. pending  (1 s)
 * 2. running  (simulatedDuration) — progressive logs, duration updates every 100 ms
 * 3. success
 */
async function runAgent(agentId, dispatch, signal) {
  const def = AGENTS[agentId];

  const log = (message, logType) =>
    dispatch({ type: 'ADD_LOG', timestamp: new Date(), agent: def.name, message, logType });

  // ── Pending ──────────────────────────────
  dispatch({ type: 'UPDATE_AGENT', agent: agentId, status: 'pending', duration: 0 });
  log(`⏳ ${def.label} — initialisation en cours…`, 'info');
  await sleepC(1_000, signal);

  // ── Running ──────────────────────────────
  const t0 = Date.now();
  dispatch({ type: 'UPDATE_AGENT', agent: agentId, status: 'running', duration: 0 });
  log(`▶ ${def.label} démarré`, 'info');

  // Schedule progressive logs evenly across simulatedDuration
  const stepDelay = def.simulatedDuration / (def.logs.length + 1);
  const logTimers = def.logs.map((msg, i) =>
    setTimeout(() => {
      if (signal.cancelled) return;
      dispatch({ type: 'ADD_LOG', timestamp: new Date(), agent: def.name, message: msg, logType: inferLogType(msg) });
    }, stepDelay * (i + 1)),
  );

  // Smooth progress bar — update duration every 100 ms
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

  // ── Success ──────────────────────────────
  dispatch({ type: 'UPDATE_AGENT', agent: agentId, status: 'success', duration: def.simulatedDuration });
  log(def.doneMsg, inferLogType(def.doneMsg));
}

/**
 * startWorkflow(dispatch, signal)
 *
 * Orchestrates the full sequential pipeline:
 *   5%  → Step 1/4 → runAgent('collector')
 *   35% → Step 2/4 → runAgent('synthesis')
 *   55% → Step 3/4 → Promise.all([runAgent('dashboard'), runAgent('pdf')])
 *   95% → Step 4/4 → sleep(2 s) → email log
 *   100% → COMPLETE_WORKFLOW
 */
async function runWorkflow(dispatch, signal) {
  const upd = (progress, currentStep) =>
    dispatch({ type: 'UPDATE_PROGRESS', progress, currentStep });

  const log = (message, logType = 'info') =>
    dispatch({ type: 'ADD_LOG', timestamp: new Date(), agent: 'Orchestrateur', message, logType });

  try {
    log('🚀 MacroSynthAI workflow initiated');

    upd(5,  'Step 1/4: Source collection');
    log('Phase 1 → macro_research_collector');
    await runAgent('collector', dispatch, signal);

    upd(35, 'Step 2/4: Comparative synthesis');
    log('Phase 2 → comparative_synthesis_agent');
    await runAgent('synthesis', dispatch, signal);

    upd(55, 'Step 3/4: Generating outputs');
    log('Phase 3 — fork parallèle → dashboard_generator + pdf_report_generator');
    await Promise.all([
      runAgent('dashboard', dispatch, signal),
      runAgent('pdf',       dispatch, signal),
    ]);

    upd(95, 'Step 4/4: Sending email');
    log('Envoi email → board@veillemacro.io…');
    await sleepC(2_000, signal);
    log('📧 Email sent — dashboard + PDF report attached', 'success');

    upd(100, null);
    log('✅ Workflow completed successfully', 'success');
    dispatch({ type: 'COMPLETE_WORKFLOW' });

  } catch (e) {
    if (!e.cancelled) throw e;
  }
}

/* ─────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────── */
export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const signalRef = useRef({ cancelled: false });
  const clockRef  = useRef(null);

  /* ── Cleanup on unmount ─────────────────── */
  useEffect(() => () => {
    signalRef.current.cancelled = true;
    clearInterval(clockRef.current);
  }, []);

  /* ── startWorkflow ──────────────────────── */
  const startWorkflow = useCallback(async () => {
    if (state.globalStatus === 'running') return;

    const signal = { cancelled: false };
    signalRef.current = signal;
    clockRef.current  = setInterval(() => {}, 100); // keep ref alive for cleanup

    dispatch({ type: 'START_WORKFLOW' });
    await runWorkflow(dispatch, signal);

    clearInterval(clockRef.current);
  }, [state.globalStatus]);

  return (
    <div
      style={{
        minHeight:  '100vh',
        background: C.bg,
        color:      C.text,
        fontFamily: "'SF Mono','Fira Code','Consolas',monospace",
      }}
    >
      <Header status={state.globalStatus} lastRun={state.lastRun} />

      <main
        style={{
          maxWidth:      1100,
          margin:        '0 auto',
          padding:       '28px 24px',
          display:       'flex',
          flexDirection: 'column',
          gap:           24,
        }}
      >
        <OrchestratorCard
          status={state.globalStatus}
          progress={state.progress}
          currentStep={state.currentStep}
          onLaunch={startWorkflow}
          onReset={() => {
            signalRef.current.cancelled = true;
            clearInterval(clockRef.current);
            dispatch({ type: 'RESET' });
          }}
        />

        {/* 3-col grid: Collector, Synthesis, Dashboard */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          <AgentCard agent={state.agents.collector} config={AGENTS.collector} />
          <AgentCard agent={state.agents.synthesis} config={AGENTS.synthesis} />
          <AgentCard agent={state.agents.dashboard} config={AGENTS.dashboard} />
        </div>

        {/* PDF — own row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          <AgentCard agent={state.agents.pdf} config={AGENTS.pdf} />
        </div>

        <ExecutionLog logs={state.logs} />

        <div
          style={{
            textAlign:     'center',
            color:         C.textDim,
            fontSize:      10,
            letterSpacing: '0.05em',
            paddingBottom: 8,
          }}
        >
          MacroSynthAI · Agent Orchestration Platform · {new Date().getFullYear()}
        </div>
      </main>
    </div>
  );
}
