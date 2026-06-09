import React, { useState, useEffect, useRef } from 'react';
import { ParticleCanvas } from './components/ui/particle-canvas-1.tsx';
import AnimatedShaderBackground from './components/ui/animated-shader-background.tsx';
import { Header } from './components/Header.jsx';
import { OrchestratorCard } from './components/OrchestratorCard.jsx';
import { AgentCard } from './components/AgentCard.jsx';
import { StatsBar } from './components/StatsBar.jsx';
import { PipelineChart } from './components/PipelineChart.jsx';
import { ExecutionLog } from './components/ExecutionLog.jsx';
import { PeriodSelector } from './components/PeriodSelector.jsx';
import { SynthesisDashboard } from './components/SynthesisDashboard.jsx';
import { DustDashboard } from './components/DustDashboard.jsx';
import { HistoryPanel } from './components/HistoryPanel.jsx';
import { C } from './constants.js';

const HISTORY_KEY = 'macrosynth_history';
import { nanoid } from './utils.js';

const WS = 'vTiqcjUPSf';

const PIPELINE = ['collector', 'synthesis', 'dashboard', 'pdf'];

export const AGENT_CFG = {
  collector: {
    emoji: '🔍',
    label: 'Macro Research Collector',
    name: 'macro_research_collector',
    color: C.coral,
    simulatedDuration: 45_000,
    desc: 'Collecte et structure les publications stratégiques des principales maisons de recherche.',
  },
  synthesis: {
    emoji: '⚖️',
    label: 'Comparative Synthesis Agent',
    name: 'comparative_synthesis_agent',
    color: C.blue,
    simulatedDuration: 60_000,
    desc: 'Analyse et compare les positions des analystes pour dégager les convergences et divergences.',
  },
  dashboard: {
    emoji: '📊',
    label: 'Dashboard Generator',
    name: 'dashboard_generator_agent',
    color: C.teal,
    simulatedDuration: 30_000,
    desc: 'Structure les données pour le dashboard CIO avec scores et matrices de convergence.',
  },
  pdf: {
    emoji: '📄',
    label: 'PDF Report Generator',
    name: 'pdf_report_generator',
    color: C.orange,
    simulatedDuration: 20_000,
    desc: 'Génère le rapport PDF final de recherche CIO.',
  },
};

// Map a Dust run_agent functionCallName (ex. "macro_research_collector__run_…")
// back to its pipeline step, so we track the REAL active sub-agent rather than
// guessing from token text.
const NAME_TO_STEP = Object.fromEntries(
  Object.entries(AGENT_CFG).map(([k, cfg]) => [cfg.name, k])
);
function stepFromFunctionCall(fcn) {
  if (!fcn) return null;
  for (const [name, k] of Object.entries(NAME_TO_STEP)) {
    if (fcn.startsWith(name)) return k;
  }
  return null;
}

const fresh = () =>
  Object.fromEntries(PIPELINE.map(k => [k, { status: 'idle', duration: 0 }]));

export function App() {
  const [orchStatus, setOrchStatus]   = useState('idle');
  const [progress,   setProgress]     = useState(0);
  const [step,       setStep]         = useState('');
  const [agents,     setAgents]       = useState(fresh);
  const [period,     setPeriod]       = useState({ start: null, end: null });
  const [logs,       setLogs]         = useState([]);
  // Navigation stack — back button pops to previous view
  const [navStack,   setNavStack]     = useState(['orchestrator']);
  const view = navStack[navStack.length - 1];

  const [synthesis,  setSynthesis]    = useState({ text: '', conversationId: null });
  const [errorMsg,   setErrorMsg]     = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history,    setHistory]      = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'); }
    catch { return []; }
  });
  const [lastRun,    setLastRun]      = useState(null);
  const [orchSId,    setOrchSId]      = useState(null);
  const [cfgError,   setCfgError]     = useState(null);

  const timersRef = useRef([]);
  const tickRef   = useRef(null);
  const startsRef = useRef({});
  const t0Ref     = useRef(null);
  const abortRef  = useRef(null);

  // Fetch orchestrator sId on mount
  useEffect(() => {
    const tryFetch = (qs) =>
      fetch(`/api/dust/w/${WS}/assistant/agent_configurations${qs}`)
        .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
        .then(d => (d.agentConfigurations ?? []).find(c => c.name === 'macro_synthesis_orchestrator'));

    tryFetch('?view=published')
      .then(cfg => cfg ?? tryFetch(''))
      .then(cfg => {
        if (cfg) setOrchSId(cfg.sId);
        else setCfgError('"macro_synthesis_orchestrator" introuvable dans Dust.');
      })
      .catch(err => setCfgError(`Connexion Dust échouée : ${err.message}`));
  }, []);

  const addLog = (agent, logType, message) =>
    setLogs(p => [...p, { id: nanoid(), timestamp: new Date(), agent, logType, message }]);

  // ── Navigation ───────────────────────────────────────────────────────────────

  function navigate(newView) {
    setNavStack(prev => {
      if (prev[prev.length - 1] === newView) return prev;
      return [...prev, newView];
    });
  }

  function goBack() {
    setNavStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  }

  // ── History ──────────────────────────────────────────────────────────────────

  function saveToHistory(entry) {
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, 50);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  function deleteHistoryEntry(id) {
    setHistory(prev => {
      const updated = prev.filter(e => e.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }

  function openHistoryEntry(entry, dest) {
    setSynthesis({ text: entry.text ?? '', conversationId: entry.conversationId });
    if (entry.period) setPeriod({ start: new Date(entry.period.start), end: new Date(entry.period.end) });
    setHistoryOpen(false);
    navigate(dest);
  }

  // ── Real-time agent tracking ─────────────────────────────────────────────────

  function killTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  }

  // Ticker: only updates durations for already-running agents (no fake progress)
  function startTicker() {
    tickRef.current = setInterval(() => {
      const now = Date.now();
      setAgents(prev => {
        let changed = false;
        const next = { ...prev };
        for (const k of PIPELINE) {
          if (next[k].status === 'running' && startsRef.current[k]) {
            const d = now - startsRef.current[k];
            if (next[k].duration !== d) { next[k] = { ...next[k], duration: d }; changed = true; }
          }
        }
        return changed ? next : prev;
      });
    }, 500);
  }

  function activateStep(k) {
    if (!startsRef.current[k]) {
      startsRef.current[k] = Date.now();
      setAgents(p => {
        // Mark previous steps done, current as running
        const next = { ...p };
        const idx = PIPELINE.indexOf(k);
        for (let i = 0; i < idx; i++) {
          const prev = PIPELINE[i];
          if (next[prev].status === 'running' || next[prev].status === 'pending') {
            const dur = startsRef.current[prev] ? Date.now() - startsRef.current[prev] : 0;
            next[prev] = { status: 'success', duration: dur };
          }
        }
        next[k] = { status: 'running', duration: 0 };
        return next;
      });
      addLog(k, 'info', `▶ ${AGENT_CFG[k].label}`);
      setStep(AGENT_CFG[k].label);
      setProgress(p => Math.max(p, PIPELINE.indexOf(k) * 22 + 8));
    }
  }

  // A sub-agent finished (agent_action_success) — mark its step done.
  function completeStep(k, durMs) {
    setAgents(p => {
      if (p[k].status === 'success') return p;
      const dur = durMs != null ? durMs : (startsRef.current[k] ? Date.now() - startsRef.current[k] : 0);
      return { ...p, [k]: { status: 'success', duration: dur } };
    });
    addLog(k, 'success', `✓ ${AGENT_CFG[k].label}`);
    setProgress(p => Math.max(p, (PIPELINE.indexOf(k) + 1) * 22 + 8));
  }

  // ── State transitions ────────────────────────────────────────────────────────

  function completeAll(text, convId) {
    killTimers();
    const now = Date.now();
    setAgents(() =>
      Object.fromEntries(PIPELINE.map(k => [k, {
        status: 'success',
        duration: startsRef.current[k] ? now - startsRef.current[k] : 0,
      }]))
    );
    setProgress(100);
    setStep('');
    setOrchStatus('success');
    setSynthesis({ text, conversationId: convId });
    setLastRun(new Date());
    addLog('orchestrator', 'success', '✓ MacroSynthAI workflow terminé avec succès');
    saveToHistory({
      id:             nanoid(),
      date:           new Date().toISOString(),
      period:         { start: period.start?.toISOString(), end: period.end?.toISOString() },
      conversationId: convId,
      text,
      preview:        text.slice(0, 250).replace(/#+\s*/g, '').trim(),
    });
  }

  function failWith(msg) {
    killTimers();
    setOrchStatus('error');
    setStep('');
    setErrorMsg(msg);
    navigate('error');
    addLog('orchestrator', 'error', `✗ ${msg}`);
  }

  // ── Conversation polling ─────────────────────────────────────────────────────
  // Un run complet (4 sous-agents + recherches web + email) dépasse largement les
  // limites d'un flux SSE tenu à travers une fonction serverless (timeout client,
  // body-timeout undici amont, maxDuration Vercel). On interroge donc l'état de la
  // conversation par petites requêtes courtes — immunisées contre ces timeouts.
  // Le tableau `actions` de l'agent_message expose en direct functionCallName +
  // status + executionDurationMs, ce qui suffit à piloter les cartes.

  async function pollConversation(convSId, signal) {
    const POLL_MS = 6000;
    const MAX_MS  = 20 * 60 * 1000;   // garde-fou : 20 min
    const startedAt = Date.now();
    const notified  = new Set();      // steps déjà loggés "en cours"

    while (Date.now() - startedAt < MAX_MS) {
      await new Promise(r => setTimeout(r, POLL_MS));
      if (signal.aborted) return;

      let d;
      try {
        const r = await fetch(`/api/dust/w/${WS}/assistant/conversations/${convSId}`, { signal });
        if (!r.ok) continue;          // hoquet transitoire — on retente au tick suivant
        d = await r.json();
      } catch (err) {
        if (err.name === 'AbortError') return;
        continue;                     // coupure réseau — on retente
      }

      const msg = (d.conversation?.content ?? [])
        .flat()
        .reverse()
        .find(m => m.type === 'agent_message');
      if (!msg) continue;

      // Piloter les cartes depuis les actions run_agent enregistrées
      for (const act of msg.actions ?? []) {
        if (act.internalMCPServerName !== 'run_agent') continue;
        const k = stepFromFunctionCall(act.functionCallName);
        if (!k) continue;
        if (act.status === 'succeeded') {
          completeStep(k, act.executionDurationMs);
        } else {
          activateStep(k);
          if (!notified.has(k)) {
            const lbl = act.displayLabels?.running;
            addLog(k, 'debug', lbl ? `… ${lbl}` : `… ${AGENT_CFG[k].label} en cours`);
            notified.add(k);
          }
        }
      }

      if (msg.status === 'succeeded') { completeAll(msg.content ?? '', convSId); return; }
      if (msg.status === 'failed' || msg.error) {
        failWith(msg.error?.message ?? 'Erreur agent Dust');
        return;
      }
    }

    failWith('Délai dépassé (20 min) — le workflow Dust tourne toujours côté serveur. Réessaie de consulter la conversation plus tard.');
  }

  // ── Launch ───────────────────────────────────────────────────────────────────

  async function handleLaunch() {
    if (orchStatus === 'success') { navigate('dashboard'); return; }

    if (!orchSId) {
      addLog('system', 'error', cfgError ?? 'Agents Dust non chargés — vérifie la connexion.');
      return;
    }

    killTimers();
    startsRef.current = {};
    // t0 tracked via startsRef

    setLogs([]);
    // All agents start as pending — will become running when Dust actually mentions them
    setAgents(Object.fromEntries(PIPELINE.map(k => [k, { status: 'pending', duration: 0 }])));
    setProgress(0);
    setStep('Connexion Dust…');
    setOrchStatus('running');

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const sf = period.start.toLocaleDateString('fr-FR');
    const ef = period.end.toLocaleDateString('fr-FR');

    addLog('orchestrator', 'info', `🚀 MacroSynthAI — ${sf} → ${ef}`);
    addLog('orchestrator', 'info', `Orchestrateur : macro_synthesis_orchestrator (${orchSId})`);

    startTicker();

    const prompt =
      `Effectue une analyse macro complète pour la période du ${sf} au ${ef}. ` +
      `Collecte les publications stratégiques récentes des principales maisons de recherche, ` +
      `analyse et synthétise les convergences et divergences entre analystes, ` +
      `génère les données structurées du dashboard CIO et le rapport PDF final de recherche.`;

    try {
      // POST en JSON (pas de SSE) : on récupère juste l'ID de conversation,
      // puis on suit l'avancement par polling.
      const res = await fetch(`/api/dust/w/${WS}/assistant/conversations`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:      `MacroSynthAI ${sf}–${ef}`,
          visibility: 'unlisted',
          message: {
            content: prompt,
            context: {
              timezone:          'Europe/Paris',
              username:          'macrosynth_dashboard',
              fullName:          'Alexandre de Carbonnières',
              email:             'alexdecarbof71@gmail.com',
              profilePictureUrl: null,
            },
            mentions: [{ configurationId: orchSId }],
          },
        }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Dust ${res.status} : ${txt.slice(0, 200)}`);
      }

      const data = await res.json();
      const convSId = data.conversation?.sId;
      if (!convSId) throw new Error('Conversation ID manquant dans la réponse Dust');

      addLog('orchestrator', 'info', `Conversation Dust ouverte : ${convSId}`);
      addLog('orchestrator', 'info', 'Suivi de l\'exécution (polling)…');

      await pollConversation(convSId, ctrl.signal);
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
      failWith(err.message);
    }
  }

  function handleReset() {
    killTimers();
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setOrchStatus('idle');
    setProgress(0);
    setStep('');
    setAgents(fresh());
    setLogs([]);
    setNavStack(['orchestrator']);
    setSynthesis({ text: '', conversationId: null });
    setErrorMsg('');
    startsRef.current = {};
    t0Ref.current = null;
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const [showLog, setShowLog] = useState(false);

  const periodValid = !!(period.start && period.end && new Date(period.start) < new Date(period.end));
  const launchOk    = orchStatus === 'success' ? true : (periodValid && !!orchSId);
  const isActive    = orchStatus !== 'idle';

  return (
    <div className="relative min-h-screen bg-gray-950 font-sans text-gray-100">

      {/* ── Layered background ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* Layer 1 — Aurora shader (Three.js WebGL) */}
        <AnimatedShaderBackground />
        {/* Layer 2 — WebGL coloured particles following mouse */}
        <ParticleCanvas
          maxParticles={orchStatus === 'running' ? 500 : 100}
          particleSizeMin={2}
          particleSizeMax={orchStatus === 'running' ? 5 : 3}
          speedScale={orchStatus === 'running' ? 2 : 0.8}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10">
        <Header
          status={orchStatus}
          lastRun={lastRun}
          canGoBack={navStack.length > 1}
          onBack={goBack}
          onDustClick={() => view === 'dust' ? goBack() : navigate('dust')}
          dustActive={view === 'dust'}
          onHistoryClick={() => setHistoryOpen(true)}
          historyCount={history.length}
        />

        {/* ── History Panel (slide-over) ── */}
        <HistoryPanel
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          history={history}
          onOpen={openHistoryEntry}
          onDelete={deleteHistoryEntry}
          onClear={clearHistory}
        />

        {/* ── Dust Dashboard ── */}
        {view === 'dust' && (
          <DustDashboard conversationId={synthesis?.conversationId} />
        )}

        {/* ── Error view ── */}
        {view === 'error' && (
          <div className="flex min-h-[80vh] items-center justify-center px-6">
            <div className="w-full max-w-lg text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 mx-auto text-4xl">⚠</div>
              <h2 className="mb-3 text-2xl font-bold text-white">Erreur Dust</h2>
              <p className="mb-6 text-sm leading-relaxed text-gray-400">Le workflow n'a pas pu se terminer.</p>
              <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/8 px-5 py-4 text-left">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-red-400">Message d'erreur</div>
                <p className="font-mono text-sm text-red-300 break-all">{errorMsg}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button onClick={handleReset} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5">
                  🔄 Réessayer
                </button>
                <button onClick={goBack} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-gray-400 transition-all hover:bg-white/10 hover:text-white">
                  ← Retour
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Dashboard view ── */}
        {view === 'dashboard' && (
          <SynthesisDashboard state={synthesis} period={{ start: period.start, end: period.end }} />
        )}

        {/* ── Orchestrator view ── */}
        {view === 'orchestrator' && (
          <main className="mx-auto max-w-6xl px-6 py-8 pb-20">

            {cfgError && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">
                <span className="text-base">⚠</span> {cfgError}
              </div>
            )}

            <div className="flex flex-col gap-5">
              <PeriodSelector
                startDate={period.start}
                endDate={period.end}
                onChange={({ start, end }) => setPeriod({ start, end })}
                disabled={orchStatus === 'running'}
              />

              <OrchestratorCard
                status={orchStatus}
                progress={progress}
                currentStep={step}
                onLaunch={handleLaunch}
                onReset={handleReset}
                onViewResults={() => navigate('dashboard')}
                canLaunch={launchOk}
              />

              <StatsBar isActive={isActive} synthesis={synthesis} />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {PIPELINE.map(k => (
                  <AgentCard key={k} agent={agents[k]} config={AGENT_CFG[k]} />
                ))}
              </div>

              <PipelineChart agents={agents} />

              {/* Execution Log — toggle */}
              <div>
                <button
                  onClick={() => setShowLog(v => !v)}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-400 transition-all hover:bg-white/10 hover:text-gray-200"
                >
                  <span className="font-mono">{showLog ? '▼' : '▶'}</span>
                  Execution Log
                  {logs.length > 0 && (
                    <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold text-violet-400">
                      {logs.length}
                    </span>
                  )}
                </button>
                {showLog && (
                  <div className="mt-3">
                    <ExecutionLog logs={logs} />
                  </div>
                )}
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

