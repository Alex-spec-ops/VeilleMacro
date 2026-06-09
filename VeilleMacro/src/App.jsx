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
import { C } from './constants.js';
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

// Simulated pipeline start offsets (ms after launch)
const START_AT = {
  collector: 3_000,
  synthesis: 51_000,
  dashboard: 114_000,
  pdf:       147_000,
};

const TOTAL_SIM = 167_000;

const fresh = () =>
  Object.fromEntries(PIPELINE.map(k => [k, { status: 'idle', duration: 0 }]));

export function App() {
  const [orchStatus, setOrchStatus]   = useState('idle');
  const [progress,   setProgress]     = useState(0);
  const [step,       setStep]         = useState('');
  const [agents,     setAgents]       = useState(fresh);
  const [period,     setPeriod]       = useState({ start: null, end: null });
  const [logs,       setLogs]         = useState([]);
  const [view,       setView]         = useState('orchestrator');
  const [synthesis,  setSynthesis]    = useState({ text: '', conversationId: null });
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

  // ── Timers ──────────────────────────────────────────────────────────────────

  function killTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  }

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
      if (t0Ref.current) {
        setProgress(Math.min(98, ((now - t0Ref.current) / TOTAL_SIM) * 100));
      }
    }, 300);
  }

  function scheduleAgents() {
    for (const k of PIPELINE) {
      const off = START_AT[k];
      const dur = AGENT_CFG[k].simulatedDuration;

      // pending state ~1.5s before running
      if (off > 1500) {
        timersRef.current.push(
          setTimeout(() => setAgents(p => ({ ...p, [k]: { ...p[k], status: 'pending' } })), off - 1500)
        );
      }

      timersRef.current.push(setTimeout(() => {
        startsRef.current[k] = Date.now();
        setAgents(p => ({ ...p, [k]: { ...p[k], status: 'running', duration: 0 } }));
        addLog(k, 'info', `▶ ${AGENT_CFG[k].label}`);
        setStep(AGENT_CFG[k].label);
      }, off));

      timersRef.current.push(setTimeout(() => {
        const d = startsRef.current[k] ? Date.now() - startsRef.current[k] : dur;
        setAgents(p => ({ ...p, [k]: { status: 'success', duration: d } }));
        addLog(k, 'success', `✓ ${AGENT_CFG[k].label}`);
      }, off + dur));
    }
  }

  // ── State transitions ────────────────────────────────────────────────────────

  function completeAll(text, convId) {
    killTimers();
    const now = Date.now();
    setAgents(() =>
      Object.fromEntries(PIPELINE.map(k => [k, {
        status: 'success',
        duration: startsRef.current[k] ? now - startsRef.current[k] : AGENT_CFG[k].simulatedDuration,
      }]))
    );
    setProgress(100);
    setStep('');
    setOrchStatus('success');
    setSynthesis({ text, conversationId: convId });
    setLastRun(new Date());
    addLog('orchestrator', 'success', '✓ MacroSynthAI workflow terminé avec succès');
  }

  function failWith(msg) {
    killTimers();
    setOrchStatus('error');
    setStep('');
    addLog('orchestrator', 'error', `✗ ${msg}`);
  }

  // ── SSE parser ───────────────────────────────────────────────────────────────

  async function parseStream(body, signal) {
    const reader = body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    let text = '';
    let convId = null;
    let tokenBuf = '';
    let lastTokenLog = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') { completeAll(text, convId); return; }

          try {
            const evt = JSON.parse(raw);

            if (evt.type === 'user_message_success') {
              convId = evt.message?.conversation?.sId ?? convId;
              addLog('orchestrator', 'info', 'Message envoyé à Dust ✓');
            }

            if (evt.type === 'agent_message_created') {
              addLog('orchestrator', 'info', 'Réponse de l\'orchestrateur en cours…');
            }

            if (evt.type === 'generation_tokens') {
              const chunk = evt.tokens?.text ?? '';
              text += chunk;
              tokenBuf += chunk;
              const now = Date.now();
              if (now - lastTokenLog > 1800 && tokenBuf.trim()) {
                const snippet = tokenBuf.replace(/\n+/g, ' ').trim().slice(0, 110);
                if (snippet) addLog('orchestrator', 'debug', snippet + (tokenBuf.length > 110 ? '…' : ''));
                tokenBuf = '';
                lastTokenLog = now;
              }
            }

            if (evt.type === 'agent_message_success') {
              text = evt.message?.content ?? text;
              convId = convId ?? evt.conversation?.sId;
              completeAll(text, convId);
              return;
            }

            if (evt.type === 'agent_error') {
              failWith(evt.error?.message ?? 'Erreur agent Dust');
              return;
            }
          } catch { /* skip malformed JSON */ }
        }
      }
      completeAll(text, convId);
    } catch (err) {
      if (err.name !== 'AbortError') failWith(err.message);
    }
  }

  // ── Launch ───────────────────────────────────────────────────────────────────

  async function handleLaunch() {
    if (orchStatus === 'success') { setView('dashboard'); return; }

    if (!orchSId) {
      addLog('system', 'error', cfgError ?? 'Agents Dust non chargés — vérifie la connexion.');
      return;
    }

    killTimers();
    startsRef.current = {};
    t0Ref.current = Date.now();

    setLogs([]);
    setAgents(fresh());
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
    scheduleAgents();

    const prompt =
      `Effectue une analyse macro complète pour la période du ${sf} au ${ef}. ` +
      `Collecte les publications stratégiques récentes des principales maisons de recherche, ` +
      `analyse et synthétise les convergences et divergences entre analystes, ` +
      `génère les données structurées du dashboard CIO et le rapport PDF final de recherche.`;

    try {
      const res = await fetch(`/api/dust/w/${WS}/assistant/conversations`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
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

      const ct = res.headers.get('content-type') ?? '';
      addLog('orchestrator', 'info', 'Conversation Dust ouverte');

      if (ct.includes('event-stream')) {
        // Dust streamed the response directly
        await parseStream(res.body, ctrl.signal);
      } else {
        // Non-streaming JSON: find agent message, then stream its events
        const data = await res.json();
        const convSId = data.conversation?.sId;
        if (!convSId) throw new Error('Conversation ID manquant dans la réponse Dust');

        addLog('orchestrator', 'info', `Conversation : ${convSId}`);

        // Look for agent message in the initial response
        const msgs = (data.conversation?.content ?? []).flat();
        let agentMsgSId = msgs.find(m => m.type === 'agent_message')?.sId ?? null;

        // If not yet present, poll for it (Dust creates it asynchronously)
        if (!agentMsgSId) {
          addLog('orchestrator', 'info', 'Attente de la réponse de l\'orchestrateur…');
          for (let i = 0; i < 20 && !agentMsgSId; i++) {
            await new Promise(r => setTimeout(r, 1500));
            if (ctrl.signal.aborted) return;
            const r = await fetch(`/api/dust/w/${WS}/assistant/conversations/${convSId}`);
            if (r.ok) {
              const d = await r.json();
              const m = (d.conversation?.content ?? []).flat().find(x => x.type === 'agent_message');
              if (m) agentMsgSId = m.sId;
            }
          }
        }

        if (!agentMsgSId) throw new Error('Message agent introuvable après 30s de polling');

        addLog('orchestrator', 'info', 'Streaming de la réponse…');
        const evtRes = await fetch(
          `/api/dust/w/${WS}/assistant/conversations/${convSId}/messages/${agentMsgSId}/events`,
          { headers: { Accept: 'text/event-stream' }, signal: ctrl.signal }
        );
        if (!evtRes.ok) throw new Error(`Events stream ${evtRes.status}`);
        await parseStream(evtRes.body, ctrl.signal);
      }
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
    setView('orchestrator');
    setSynthesis({ text: '', conversationId: null });
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
        <Header status={orchStatus} lastRun={lastRun} />

        {view === 'dashboard' ? (
          <>
            <div className="border-b border-white/8 bg-gray-950/80 px-6 py-3 backdrop-blur-xl">
              <button
                onClick={() => setView('orchestrator')}
                className="flex items-center gap-2 text-sm font-semibold text-gray-400 transition-colors hover:text-white"
              >
                ← Retour à l'orchestrateur
              </button>
            </div>
            <SynthesisDashboard state={synthesis} period={{ start: period.start, end: period.end }} />
          </>
        ) : (
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
                onViewResults={() => setView('dashboard')}
                canLaunch={launchOk}
              />

              <StatsBar isActive={isActive} />

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
