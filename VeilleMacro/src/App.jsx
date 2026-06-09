import React, { useState, useEffect, useRef } from 'react';
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

const WS = 'OB71pA6Ve5';

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
              fullName:          'MacroSynthAI Dashboard',
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

  const periodValid = !!(period.start && period.end && new Date(period.start) < new Date(period.end));
  const launchOk    = orchStatus === 'success' ? true : (periodValid && !!orchSId);
  const isActive    = orchStatus !== 'idle';

  return (
    <div style={{ background: '#f0f0eb', minHeight: '100vh', fontFamily: "'Inter','Helvetica Neue',sans-serif", color: '#1a1a1a' }}>
      <Header status={orchStatus} lastRun={lastRun} />

      {view === 'dashboard' ? (
        <>
          <div style={{ padding: '14px 32px', background: '#fff', borderBottom: `1px solid ${C.border}` }}>
            <button
              onClick={() => setView('orchestrator')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#555', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              ← Retour à l'orchestrateur
            </button>
          </div>
          <SynthesisDashboard state={synthesis} period={{ start: period.start, end: period.end }} />
        </>
      ) : (
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 80px' }}>

          {cfgError && (
            <div style={{ marginBottom: 24, padding: '12px 20px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, fontSize: 13, color: '#991B1B', fontWeight: 600 }}>
              ⚠ {cfgError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
              {PIPELINE.map(k => (
                <AgentCard key={k} agent={agents[k]} config={AGENT_CFG[k]} />
              ))}
            </div>

            <PipelineChart agents={agents} />
            <ExecutionLog logs={logs} />
          </div>
        </main>
      )}
    </div>
  );
}
