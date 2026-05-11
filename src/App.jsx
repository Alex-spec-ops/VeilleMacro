import React, { useReducer, useEffect, useRef, useCallback } from 'react';
import {
  Play, RotateCcw, CheckCircle2, Loader2,
  Mail, Activity, Send, Cpu, GitMerge, Radio,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const C = {
  // Backgrounds
  bg:          '#0f172a',   // slate-900
  surface:     '#0b1120',
  card:        '#1e293b',   // slate-800
  cardHover:   '#263348',
  // Borders
  border:      '#334155',   // slate-700
  borderActive:'rgba(59,130,246,0.5)',
  // Text
  text:        '#f1f5f9',   // slate-100
  textMuted:   '#94a3b8',   // slate-400
  textDim:     '#475569',   // slate-600
  // Status
  statusIdle:  '#6b7280',   // gray-500
  statusPend:  '#f59e0b',   // amber-500
  statusRun:   '#3b82f6',   // blue-500
  statusOk:    '#10b981',   // green-500
  statusErr:   '#ef4444',   // red-500
  // Agent brand colors
  blue:        '#3b82f6',   // collector
  violet:      '#8b5cf6',   // synthesis
  green:       '#10b981',   // dashboard
  amber:       '#f59e0b',   // pdf
  pink:        '#ec4899',   // orchestrator
  // Utility
  sky:         '#0ea5e9',
  red:         '#ef4444',
};

/* Workflow timeline (ms):
   0      → 25 000  : Phase 1 – collector
   25 000 → 37 000  : Phase 2 – synthesis
   37 000 → 55 000  : Phase 3 – dashboard (18 s) + pdf (16 s) in parallel
   55 000 → 56 500  : Phase 4 – email                                      */
const TIMELINE = {
  phase1Start:  0,
  phase1End:    25_000,
  phase2Start:  25_000,
  phase2End:    37_000,
  phase3Start:  37_000,
  phase3End:    55_000,   // max(18s, 16s) after phase3Start
  emailStart:   55_000,
  emailEnd:     56_500,
  totalDone:    56_500,
};

const AGENT_DEFS = {
  collector: {
    id:       'collector',
    name:     'macro_research_collector',
    label:    'Collecte Sources',
    duration: 25_000,
    start:    TIMELINE.phase1Start,
    end:      TIMELINE.phase1End,
    emoji:    '🔍',
    color:    C.blue,
    phase:    1,
    desc:     'Collecte et agrège les sources macro-économiques mondiales',
    steps: [
      'Initialisation des connecteurs API…',
      'Connexion Bloomberg Terminal, Reuters…',
      'Collecte données Fed, BCE, BNS, BoJ…',
      'Scraping actualités économiques (47 sources)…',
      'Agrégation corpus documentaire…',
      'Déduplication & validation croisée…',
      'Indexation vectorielle terminée ✓',
    ],
  },
  synthesis: {
    id:       'synthesis',
    name:     'comparative_synthesis_agent',
    label:    'Analyse Comparative',
    duration: 12_000,
    start:    TIMELINE.phase2Start,
    end:      TIMELINE.phase2End,
    emoji:    '⚖️',
    color:    C.violet,
    phase:    2,
    desc:     'Analyse et synthèse comparative multi-sources avec LLM',
    steps: [
      'Chargement corpus (2 847 documents)…',
      'Analyse de sentiment marchés financiers…',
      'Comparaison indicateurs YoY / QoQ…',
      'Détection signaux macro-économiques…',
      'Scoring divergences inter-banques centrales…',
      'Génération synthèse analytique LLM…',
    ],
  },
  dashboard: {
    id:       'dashboard',
    name:     'dashboard_generator_agent',
    label:    'Dashboard TSX',
    duration: 18_000,
    start:    TIMELINE.phase3Start,
    end:      TIMELINE.phase3Start + 18_000,
    emoji:    '📊',
    color:    C.green,
    phase:    3,
    desc:     'Génération du dashboard React/TSX interactif avec Recharts',
    steps: [
      'Structuration des données de visualisation…',
      'Génération composants Recharts (12 graphiques)…',
      'Compilation dashboard TSX…',
      'Tree-shaking & optimisation bundle…',
      'Injection données temps-réel…',
      'Export artefact HTML/TSX…',
    ],
  },
  pdf: {
    id:       'pdf',
    name:     'pdf_report_generator',
    label:    'Rapport PDF',
    duration: 16_000,
    start:    TIMELINE.phase3Start,
    end:      TIMELINE.phase3Start + 16_000,
    emoji:    '📄',
    color:    C.amber,
    phase:    3,
    desc:     'Génération du rapport PDF exécutif haute qualité',
    steps: [
      'Chargement template LaTeX professionnel…',
      'Injection données analytiques…',
      'Rendu graphiques haute résolution (300 dpi)…',
      'Compilation PDF/A-2b…',
      'Signature numérique & métadonnées…',
      'Export rapport final (48 pages)…',
    ],
  },
};

const AGENT_ORDER = ['collector', 'synthesis', 'dashboard', 'pdf'];

/* ─────────────────────────────────────────────
   REDUCER
───────────────────────────────────────────── */
const initialAgentState = (id) => ({
  status:      'idle',   // idle | running | completed
  progress:    0,
  currentStep: '',
  elapsed:     0,
  stepIdx:     0,
});

const initialState = {
  workflow:    'idle',   // idle | running | completed
  phase:       0,
  agents:      Object.fromEntries(AGENT_ORDER.map(id => [id, initialAgentState(id)])),
  orchestrator:{ status: 'idle', task: 'En attente du démarrage…' },
  logs:        [],
  emailSent:   false,
  totalElapsed:0,
};

function reducer(state, action) {
  switch (action.type) {
    case 'START':
      return {
        ...initialState,
        workflow:     'running',
        phase:        1,
        orchestrator: { status: 'running', task: 'Démarrage Phase 1 — Collecte sources…' },
        logs: [logEntry('Orchestrateur', 'Workflow démarré — Phase 1 initialisée', C.pink)],
      };

    case 'TICK': {
      const { elapsed } = action;
      const newAgents  = { ...state.agents };
      const logs       = [...state.logs];
      let   phase      = state.phase;
      let   orchTask   = state.orchestrator.task;
      let   emailSent  = state.emailSent;
      let   workflow   = state.workflow;

      // ── Phase 1: collector ──────────────────
      const col = AGENT_DEFS.collector;
      if (elapsed >= col.start && elapsed < col.end) {
        const progress = Math.min(100, ((elapsed - col.start) / col.duration) * 100);
        const stepIdx  = stepForProgress(progress, col.steps.length);
        const changed  = stepIdx !== newAgents.collector.stepIdx;
        newAgents.collector = {
          status:      'running',
          progress,
          elapsed:     elapsed - col.start,
          currentStep: col.steps[stepIdx] ?? col.steps.at(-1),
          stepIdx,
        };
        if (changed && stepIdx > 0)
          logs.push(logEntry('macro_research_collector', col.steps[stepIdx - 1], C.blue));
      }
      if (elapsed >= col.end && newAgents.collector.status !== 'completed') {
        newAgents.collector = { status: 'completed', progress: 100, elapsed: col.duration, currentStep: col.steps.at(-1), stepIdx: col.steps.length - 1 };
        logs.push(logEntry('macro_research_collector', '✓ Collecte terminée — 2 847 documents indexés', C.green));
        phase    = 2;
        orchTask = 'Démarrage Phase 2 — Analyse comparative…';
        logs.push(logEntry('Orchestrateur', 'Transition Phase 2 → comparative_synthesis_agent', C.pink));
      }

      // ── Phase 2: synthesis ──────────────────
      const syn = AGENT_DEFS.synthesis;
      if (elapsed >= syn.start && elapsed < syn.end) {
        const progress = Math.min(100, ((elapsed - syn.start) / syn.duration) * 100);
        const stepIdx  = stepForProgress(progress, syn.steps.length);
        const changed  = stepIdx !== newAgents.synthesis.stepIdx;
        newAgents.synthesis = {
          status:      'running',
          progress,
          elapsed:     elapsed - syn.start,
          currentStep: syn.steps[stepIdx] ?? syn.steps.at(-1),
          stepIdx,
        };
        if (changed && stepIdx > 0)
          logs.push(logEntry('comparative_synthesis_agent', syn.steps[stepIdx - 1], C.violet));
      }
      if (elapsed >= syn.end && newAgents.synthesis.status !== 'completed') {
        newAgents.synthesis = { status: 'completed', progress: 100, elapsed: syn.duration, currentStep: syn.steps.at(-1), stepIdx: syn.steps.length - 1 };
        logs.push(logEntry('comparative_synthesis_agent', '✓ Synthèse générée — 14 signaux macro détectés', C.green));
        phase    = 3;
        orchTask = 'Phase 3 — Dashboard TSX ∥ Rapport PDF (parallèle)…';
        logs.push(logEntry('Orchestrateur', 'Fork parallèle → dashboard_generator + pdf_report_generator', C.pink));
      }

      // ── Phase 3: dashboard + pdf (parallel) ─
      for (const agentId of ['dashboard', 'pdf']) {
        const def = AGENT_DEFS[agentId];
        if (elapsed >= def.start && elapsed < def.end) {
          const progress = Math.min(100, ((elapsed - def.start) / def.duration) * 100);
          const stepIdx  = stepForProgress(progress, def.steps.length);
          const changed  = stepIdx !== newAgents[agentId].stepIdx;
          newAgents[agentId] = {
            status:      'running',
            progress,
            elapsed:     elapsed - def.start,
            currentStep: def.steps[stepIdx] ?? def.steps.at(-1),
            stepIdx,
          };
          if (changed && stepIdx > 0)
            logs.push(logEntry(def.name, def.steps[stepIdx - 1], def.color));
        }
        if (elapsed >= def.end && newAgents[agentId].status !== 'completed') {
          newAgents[agentId] = { status: 'completed', progress: 100, elapsed: def.duration, currentStep: def.steps.at(-1), stepIdx: def.steps.length - 1 };
          const msg = agentId === 'dashboard'
            ? '✓ Dashboard TSX généré — 12 composants, 847 KB'
            : '✓ Rapport PDF généré — 48 pages, 3.2 MB';
          logs.push(logEntry(def.name, msg, C.green));
        }
      }

      // ── Phase 4: email ───────────────────────
      if (elapsed >= TIMELINE.emailStart && !emailSent) {
        emailSent = true;
        phase     = 4;
        orchTask  = '✓ Envoi email — dashboard + rapport PDF joints';
        logs.push(logEntry('Orchestrateur', '📧 Email envoyé — destinataires: board@veillemacro.io', C.sky));
      }

      // ── Done ─────────────────────────────────
      if (elapsed >= TIMELINE.totalDone && workflow !== 'completed') {
        workflow = 'completed';
        orchTask = '✓ Workflow terminé avec succès — 56.5 s';
        logs.push(logEntry('Orchestrateur', `Workflow complété en ${(elapsed / 1000).toFixed(1)}s — tous les agents OK`, C.green));
      }

      return {
        ...state,
        workflow,
        phase,
        agents:       newAgents,
        orchestrator: { status: workflow === 'completed' ? 'completed' : 'running', task: orchTask },
        logs:         logs.slice(-60),
        emailSent,
        totalElapsed: elapsed,
      };
    }

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

function stepForProgress(pct, count) {
  return Math.min(Math.floor((pct / 100) * count), count - 1);
}

function logEntry(agent, message, color) {
  return { id: Date.now() + Math.random(), agent, message, color, ts: new Date() };
}

/* ─────────────────────────────────────────────
   HELPERS / FORMATTERS
───────────────────────────────────────────── */
function formatMs(ms) {
  if (ms < 1000) return `${ms}ms`;
  const s = (ms / 1000).toFixed(1);
  return `${s}s`;
}

function formatClock(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  const cs = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
  return `${m}:${s}.${cs}`;
}

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const S = {
  app: {
    minHeight:   '100vh',
    background:  C.bg,
    color:       C.text,
    display:     'flex',
    flexDirection:'column',
    gap:         0,
  },
  header: {
    background:   'rgba(15,23,42,0.96)',
    borderBottom: `1px solid ${C.border}`,
    backdropFilter: 'blur(12px)',
    position:     'sticky',
    top:          0,
    zIndex:       50,
    padding:      '0 24px',
    height:       64,
    display:      'flex',
    alignItems:   'center',
    justifyContent:'space-between',
  },
  main: {
    flex:    1,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap:    '20px',
    maxWidth: 1400,
    margin:  '0 auto',
    width:   '100%',
  },
  card: (extra = {}) => ({
    background:   C.card,
    border:       `1px solid ${C.border}`,
    borderRadius: 16,
    padding:      '20px 24px',
    ...extra,
  }),
  badge: (color, bg) => ({
    display:      'inline-flex',
    alignItems:   'center',
    gap:          6,
    padding:      '4px 12px',
    borderRadius: 20,
    fontSize:     11,
    fontWeight:   600,
    letterSpacing:'0.05em',
    textTransform:'uppercase',
    color,
    background:   bg,
    border:       `1px solid ${color}33`,
  }),
  progressTrack: (color) => ({
    height:         6,
    background:     `${color}22`,
    borderRadius:   99,
    overflow:       'hidden',
    position:       'relative',
  }),
  progressBar: (pct, color, running) => ({
    height:       '100%',
    width:        `${pct}%`,
    background:   `linear-gradient(90deg, ${color}cc, ${color})`,
    borderRadius: 99,
    transition:   'width 0.2s ease',
    position:     'relative',
    boxShadow:    running ? `0 0 8px 2px ${color}66` : 'none',
  }),
};

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */

/* Status Badge */
function StatusBadge({ status }) {
  const cfg = {
    idle:      { label: 'En attente',  color: C.statusIdle, bg: '#1f2937'  },
    running:   { label: 'En cours',    color: C.statusRun,  bg: '#172554'  },
    completed: { label: 'Terminé',     color: C.statusOk,   bg: '#064e3b'  },
    pending:   { label: 'En attente',  color: C.statusPend, bg: '#451a03'  },
    error:     { label: 'Erreur',      color: C.statusErr,  bg: '#450a0a'  },
  };
  const { label, color, bg } = cfg[status] ?? cfg.idle;
  return (
    <span style={S.badge(color, bg)}>
      {status === 'running' && <span className="blink" style={{ width:6, height:6, borderRadius:'50%', background:color, display:'inline-block' }} />}
      {status === 'completed' && <CheckCircle2 size={11} />}
      {status === 'idle' && <span style={{ width:6, height:6, borderRadius:'50%', background:color, display:'inline-block' }} />}
      {label}
    </span>
  );
}

/* Progress Bar */
function ProgressBar({ pct, color, running }) {
  return (
    <div style={S.progressTrack(color)}>
      <div style={S.progressBar(pct, color, running)}>
        {running && (
          <span style={{
            position:'absolute', top:0, left:0, right:0, bottom:0,
            background:'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
            animation: 'beam 1.5s linear infinite',
            borderRadius: 99,
          }} />
        )}
      </div>
    </div>
  );
}

/* Agent Card */
function AgentCard({ def, state: ag, totalElapsed }) {
  const { emoji, name, label, color, duration, desc, steps } = def;
  const running   = ag.status === 'running';
  const completed = ag.status === 'completed';
  const active    = running || completed;

  const remaining = running ? Math.max(0, duration - ag.elapsed) : 0;

  const borderColor = running   ? color
                    : completed ? C.green
                    :             C.border;

  return (
    <div
      className={active ? 'fade-in' : ''}
      style={{
        background:   C.card,
        border:       `1px solid ${borderColor}`,
        borderRadius: 16,
        padding:      '20px',
        position:     'relative',
        overflow:     'hidden',
        transition:   'border-color 0.4s ease',
        boxShadow:    running ? `0 0 24px -4px ${color}44` : 'none',
      }}
    >
      {/* Pulse ring behind icon when running */}
      {running && (
        <span className="pulse-ring" style={{
          position:'absolute', top:20, left:20,
          width:40, height:40, borderRadius:'50%',
          border:`2px solid ${color}`,
          pointerEvents:'none',
        }} />
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:40, height:40, borderRadius:10,
            background:`${color}18`,
            border:`1px solid ${color}44`,
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0, position:'relative',
          }}>
            {running
              ? <Loader2 size={18} color={color} className="spin" />
              : <span style={{ fontSize:18, lineHeight:1, filter: ag.status === 'idle' ? 'grayscale(1) opacity(0.4)' : 'none' }}>{emoji}</span>
            }
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color: C.text, letterSpacing:'0.01em' }}>{label}</div>
            <div style={{ fontSize:10, color: C.textMuted, fontFamily:'monospace', marginTop:2 }}>{name}</div>
          </div>
        </div>
        <StatusBadge status={ag.status} />
      </div>

      {/* Description */}
      <div style={{ fontSize:11, color:C.textMuted, marginBottom:14, lineHeight:1.5 }}>{desc}</div>

      {/* Progress */}
      <div style={{ marginBottom:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ fontSize:11, color: active ? color : C.textDim, fontWeight:600 }}>
            {ag.progress.toFixed(1)}%
          </span>
          {running && (
            <span style={{ fontSize:11, color: C.textMuted }}>
              ≈ {formatMs(remaining)} restant
            </span>
          )}
          {completed && (
            <span style={{ fontSize:11, color: C.green }}>
              ✓ {formatMs(duration)}
            </span>
          )}
          {ag.status === 'idle' && (
            <span style={{ fontSize:11, color: C.textDim }}>
              durée ~{formatMs(duration)}
            </span>
          )}
        </div>
        <ProgressBar pct={ag.progress} color={active ? color : C.textDim} running={running} />
      </div>

      {/* Current step */}
      {active && (
        <div style={{
          fontSize:11, color: running ? color : C.textMuted,
          fontFamily:'monospace',
          background:`${color}0a`,
          border:`1px solid ${color}22`,
          borderRadius:8, padding:'6px 10px',
          display:'flex', alignItems:'center', gap:6,
          marginTop:6,
        }}>
          {running
            ? <Loader2 size={10} className="spin" color={color} />
            : <CheckCircle2 size={10} color={C.green} />}
          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {ag.currentStep || (ag.status === 'idle' ? '—' : steps[0])}
          </span>
        </div>
      )}

      {/* Steps mini timeline */}
      {ag.status !== 'idle' && (
        <div style={{ display:'flex', gap:3, marginTop:12 }}>
          {steps.map((_, i) => {
            const done = i < ag.stepIdx;
            const curr = i === ag.stepIdx && running;
            return (
              <div key={i} style={{
                flex:1, height:3, borderRadius:99,
                background: done ? color : curr ? `${color}88` : `${color}22`,
                transition:'background 0.3s ease',
              }} />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* Orchestrator Panel */
function OrchestratorPanel({ state: orch, phase, totalElapsed, workflow }) {
  const running   = workflow === 'running';
  const completed = workflow === 'completed';

  const phaseLabels = {
    0: '—',
    1: 'Phase 1 — Collecte sources',
    2: 'Phase 2 — Analyse comparative',
    3: 'Phase 3 — Génération parallèle',
    4: 'Phase 4 — Envoi email',
  };

  return (
    <div style={{
      background:   `linear-gradient(135deg, ${C.bg} 0%, ${C.card} 100%)`,
      border:       `1px solid ${running ? C.pink + '66' : completed ? C.statusOk + '66' : C.border}`,
      borderRadius: 20,
      padding:      '24px 28px',
      position:     'relative',
      overflow:     'hidden',
      boxShadow:    running ? `0 0 40px -8px ${C.pink}44` : 'none',
      transition:   'box-shadow 0.5s ease',
    }}>
      {/* Background grid decoration */}
      <div style={{
        position:'absolute', inset:0, opacity:0.03,
        backgroundImage:'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
        backgroundSize:'32px 32px',
        pointerEvents:'none',
      }} />

      <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
        {/* Left: Identity */}
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ position:'relative' }}>
            {running && (
              <span className="pulse-ring" style={{
                position:'absolute', inset:-6, borderRadius:'50%',
                border:`2px solid ${C.pink}`,
              }} />
            )}
            <div style={{
              width:52, height:52, borderRadius:14,
              background:    running   ? `linear-gradient(135deg, ${C.pink}33, ${C.violet}33)` : `${C.border}22`,
              border:        `1.5px solid ${running ? C.pink + '88' : completed ? C.statusOk + '66' : C.border}`,
              display:       'flex', alignItems:'center', justifyContent:'center',
            }}>
              <GitMerge size={22} color={running ? C.pink : completed ? C.statusOk : C.textMuted} />
            </div>
          </div>
          <div>
            <div style={{ fontSize:10, color:C.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>
              Orchestrateur principal
            </div>
            <div className={running ? 'shimmer-text' : ''} style={{
              fontSize:18, fontWeight:700,
              color: running ? undefined : completed ? C.statusOk : C.text,
            }}>
              macro_synthesis_orchestrator  🎯
            </div>
            <div style={{ fontSize:12, color:C.textMuted, marginTop:3 }}>
              {orch.task}
            </div>
          </div>
        </div>

        {/* Right: Stats */}
        <div style={{ display:'flex', gap:20, alignItems:'center', flexWrap:'wrap' }}>
          {/* Phase */}
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:10, color:C.textMuted, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>Phase</div>
            <div style={{
              fontSize:13, fontWeight:700, color: phase > 0 ? C.statusRun : C.textDim,
              background: phase > 0 ? `${C.statusRun}18` : 'transparent',
              border: `1px solid ${phase > 0 ? C.statusRun + '44' : C.border}`,
              borderRadius:8, padding:'4px 12px',
            }}>
              {phase > 0 ? phaseLabels[phase] : 'Inactif'}
            </div>
          </div>
          {/* Timer */}
          <div style={{ textAlign:'center', minWidth:100 }}>
            <div style={{ fontSize:10, color:C.textMuted, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>Temps écoulé</div>
            <div style={{
              fontSize:20, fontWeight:700, fontFamily:'monospace',
              color: running ? C.text : completed ? C.statusOk : C.textDim,
              letterSpacing:'0.05em',
            }}>
              {formatClock(totalElapsed)}
            </div>
          </div>
          {/* Status */}
          <StatusBadge status={running ? 'running' : completed ? 'completed' : 'idle'} />
        </div>
      </div>
    </div>
  );
}

/* Workflow Pipeline SVG Diagram */
function PipelineDiagram({ agentStates, emailSent, workflow }) {
  const nodes = [
    { id:'collector', label:'Collector',  color: C.blue,   x:60  },
    { id:'synthesis', label:'Synthesis',  color: C.violet, x:220 },
    { id:'dashboard', label:'Dashboard',  color: C.green,  x:380, y:-30 },
    { id:'pdf',       label:'PDF Report', color: C.amber,  x:380, y:30  },
    { id:'email',     label:'Email',      color: C.sky,    x:540 },
  ];

  const getStatus = (id) => {
    if (id === 'email') return emailSent ? 'completed' : 'idle';
    return agentStates[id]?.status ?? 'idle';
  };

  const isActive = (id) => ['running','completed'].includes(getStatus(id));

  return (
    <div style={{
      background:   C.card,
      border:       `1px solid ${C.border}`,
      borderRadius: 16,
      padding:      '20px 28px',
      overflow:     'hidden',
    }}>
      <div style={{ fontSize:11, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
        <Activity size={12} /> Workflow Pipeline
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:0, overflowX:'auto', paddingBottom:4 }}>
        {/* Collector */}
        <PipelineNode id="collector" def={AGENT_DEFS.collector} status={getStatus('collector')} />
        <PipelineArrow active={isActive('collector')} color={C.blue} />

        {/* Synthesis */}
        <PipelineNode id="synthesis" def={AGENT_DEFS.synthesis} status={getStatus('synthesis')} />
        <PipelineArrow active={isActive('synthesis')} color={C.violet} fork />

        {/* Fork: Dashboard + PDF */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'center' }}>
          <PipelineNode id="dashboard" def={AGENT_DEFS.dashboard} status={getStatus('dashboard')} compact />
          <div style={{ height:1, width:60, background:`${C.border}` }} />
          <PipelineNode id="pdf" def={AGENT_DEFS.pdf} status={getStatus('pdf')} compact />
        </div>

        <PipelineArrow
          active={getStatus('dashboard') === 'completed' && getStatus('pdf') === 'completed'}
          color={C.pink}
          join
        />

        {/* Email */}
        <EmailNode sent={emailSent} />
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:16, marginTop:16, flexWrap:'wrap' }}>
        {[
          { label:'Inactif',    color:C.textDim    },
          { label:'En cours',   color:C.statusRun  },
          { label:'Terminé',    color:C.statusOk   },
          { label:'Parallèle',  color:C.pink, extra:'fork ∥' },
        ].map(({ label, color, extra }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:C.textMuted }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:color, display:'inline-block' }} />
            {label}{extra ? ` (${extra})` : ''}
          </div>
        ))}
      </div>
    </div>
  );
}

function PipelineNode({ id, def, status, compact }) {
  const { emoji, label, color } = def;
  const running   = status === 'running';
  const completed = status === 'completed';
  const active    = running || completed;
  const nodeColor = completed ? C.statusOk : running ? color : C.textDim;
  const sz        = compact ? 36 : 44;
  const iconSz    = compact ? 16 : 20;

  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      alignItems:    'center',
      gap:           6,
      flexShrink:    0,
    }}>
      <div style={{ position:'relative' }}>
        {running && (
          <span className="pulse-ring" style={{
            position:'absolute', inset:-5,
            borderRadius:'50%', border:`1.5px solid ${color}`,
          }} />
        )}
        <div style={{
          width:sz, height:sz, borderRadius:compact ? 10 : 12,
          background:   `${nodeColor}18`,
          border:       `1.5px solid ${nodeColor}66`,
          display:      'flex', alignItems:'center', justifyContent:'center',
          transition:   'all 0.4s ease',
          boxShadow:    running ? `0 0 16px -2px ${color}55` : 'none',
        }}>
          {completed
            ? <CheckCircle2 size={iconSz} color={C.statusOk} />
            : running
              ? <Loader2 size={iconSz} color={color} className="spin" />
              : <span style={{ fontSize: iconSz, lineHeight:1, filter:'grayscale(1) opacity(0.4)' }}>{emoji}</span>
          }
        </div>
      </div>
      <span style={{
        fontSize:9, fontWeight:600,
        color: active ? nodeColor : C.textDim,
        textTransform:'uppercase', letterSpacing:'0.05em',
        maxWidth:70, textAlign:'center', lineHeight:1.2,
      }}>
        {label}
      </span>
    </div>
  );
}

function PipelineArrow({ active, color, fork, join }) {
  return (
    <div style={{
      display:     'flex',
      alignItems:  'center',
      padding:     '0 8px',
      flexShrink:  0,
    }}>
      {fork && <GitMerge size={14} color={active ? color : C.textDim} style={{ transform:'rotate(180deg)' }} />}
      {join && <GitMerge size={14} color={active ? color : C.textDim} />}
      {!fork && !join && (
        <svg width="32" height="12" viewBox="0 0 32 12">
          <line
            x1="0" y1="6" x2="24" y2="6"
            stroke={active ? color : C.textDim}
            strokeWidth="1.5"
            strokeDasharray={active ? "6 3" : "0"}
            className={active ? 'flow-path' : ''}
            style={{ transition:'stroke 0.4s ease' }}
          />
          <polyline
            points="20,2 28,6 20,10"
            fill="none"
            stroke={active ? color : C.textDim}
            strokeWidth="1.5"
            style={{ transition:'stroke 0.4s ease' }}
          />
        </svg>
      )}
    </div>
  );
}

function EmailNode({ sent }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0 }}>
      <div style={{ position:'relative' }}>
        {sent && (
          <span className="pulse-ring" style={{
            position:'absolute', inset:-5, borderRadius:'50%',
            border:`1.5px solid ${C.sky}`,
            animationIterationCount: 2,
          }} />
        )}
        <div style={{
          width:44, height:44, borderRadius:12,
          background:   sent ? `${C.sky}18` : `${C.textDim}18`,
          border:       `1.5px solid ${sent ? C.sky + '66' : C.textDim + '33'}`,
          display:      'flex', alignItems:'center', justifyContent:'center',
          boxShadow:    sent ? `0 0 20px -4px ${C.sky}55` : 'none',
          transition:   'all 0.5s ease',
        }}>
          {sent
            ? <Send size={20} color={C.sky} />
            : <Mail size={20} color={C.textDim} />
          }
        </div>
      </div>
      <span style={{
        fontSize:9, fontWeight:600,
        color: sent ? C.sky : C.textDim,
        textTransform:'uppercase', letterSpacing:'0.05em',
      }}>
        {sent ? 'Email ✓' : 'Email'}
      </span>
    </div>
  );
}

/* Activity Log */
function ActivityLog({ logs }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div style={{
      background:   C.card,
      border:       `1px solid ${C.border}`,
      borderRadius: 16,
      overflow:     'hidden',
    }}>
      <div style={{
        padding:      '14px 20px',
        borderBottom: `1px solid ${C.border}`,
        display:      'flex', alignItems:'center', gap:8,
      }}>
        <Radio size={12} color={C.textMuted} />
        <span style={{ fontSize:11, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.08em' }}>
          Journal d'activité
        </span>
        <span style={{ marginLeft:'auto', fontSize:11, color:C.textMuted }}>
          {logs.length} entrées
        </span>
      </div>
      <div style={{
        height:         220,
        overflowY:      'auto',
        padding:        '8px 0',
        scrollbarWidth: 'thin',
        scrollbarColor: `${C.border} transparent`,
      }}>
        {logs.length === 0 && (
          <div style={{ textAlign:'center', color:C.textDim, fontSize:12, padding:40 }}>
            En attente du démarrage du workflow…
          </div>
        )}
        {logs.map((entry, i) => (
          <div
            key={entry.id}
            className="slide-in"
            style={{
              display:       'flex',
              alignItems:    'flex-start',
              gap:           10,
              padding:       '5px 20px',
              fontSize:      11,
              lineHeight:    1.5,
              borderBottom:  i < logs.length - 1 ? `1px solid ${C.border}` : 'none',
              animationDelay:`${Math.min(i * 0.02, 0.3)}s`,
            }}
          >
            <span style={{
              color:      C.textMuted,
              fontFamily: 'monospace',
              fontSize:   10,
              flexShrink: 0,
              paddingTop: 1,
            }}>
              {entry.ts.toTimeString().slice(0, 8)}
            </span>
            <span style={{
              color:       entry.color,
              fontWeight:  600,
              flexShrink:  0,
              fontSize:    10,
              paddingTop:  1,
              minWidth:    160,
            }}>
              {entry.agent}
            </span>
            <span style={{ color:C.text, fontFamily:'monospace', fontSize:10 }}>
              {entry.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SUMMARY STATS BAR
───────────────────────────────────────────── */
function StatsBar({ state }) {
  const { agents, workflow, totalElapsed, emailSent } = state;

  const completedCount = Object.values(agents).filter(a => a.status === 'completed').length;
  const runningCount   = Object.values(agents).filter(a => a.status === 'running').length;
  const totalPct       = Object.values(agents).reduce((s, a) => s + a.progress, 0) / 4;

  const stats = [
    { label:'Agents actifs',    value: runningCount,              color: C.statusRun  },
    { label:'Agents complétés', value: `${completedCount} / 4`,  color: C.statusOk   },
    { label:'Progression',      value: `${totalPct.toFixed(0)}%`, color: C.violet     },
    { label:'Email envoyé',     value: emailSent ? 'Oui ✓' : 'Non', color: emailSent ? C.sky : C.textMuted },
    { label:'Temps total',      value: formatClock(totalElapsed), color: C.text       },
    { label:'Statut',           value: workflow === 'completed' ? 'Terminé ✓' : workflow === 'running' ? 'En cours' : 'Inactif', color: workflow === 'completed' ? C.statusOk : workflow === 'running' ? C.statusRun : C.textMuted },
  ];

  return (
    <div style={{
      display:      'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap:          1,
      background:   C.border,
      borderRadius: 14,
      overflow:     'hidden',
      border:       `1px solid ${C.border}`,
    }}>
      {stats.map(({ label, value, color }) => (
        <div key={label} style={{
          background: C.card,
          padding:    '14px 18px',
          textAlign:  'center',
        }}>
          <div style={{ fontSize:10, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>
            {label}
          </div>
          <div style={{ fontSize:17, fontWeight:700, color, fontFamily:'monospace' }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const startTimeRef      = useRef(null);
  const rafRef            = useRef(null);
  const lastElapsedRef    = useRef(0);

  const tick = useCallback(() => {
    if (!startTimeRef.current) return;
    const elapsed = Date.now() - startTimeRef.current;
    lastElapsedRef.current = elapsed;
    dispatch({ type: 'TICK', elapsed });
    if (elapsed < TIMELINE.totalDone + 500) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, []);

  const handleStart = useCallback(() => {
    if (state.workflow === 'running') return;
    dispatch({ type: 'START' });
    startTimeRef.current = Date.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [state.workflow, tick]);

  const handleReset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startTimeRef.current = null;
    dispatch({ type: 'RESET' });
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const { workflow, phase, agents, orchestrator, logs, emailSent, totalElapsed } = state;
  const running   = workflow === 'running';
  const completed = workflow === 'completed';

  return (
    <div style={S.app}>
      {/* ── HEADER ── */}
      <header style={S.header}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{
            width:34, height:34, borderRadius:9,
            background:'linear-gradient(135deg, #4f46e5, #8b5cf6)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Cpu size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:C.text, lineHeight:1 }}>VeilleMacro</div>
            <div style={{ fontSize:10, color:C.textMuted, marginTop:2, letterSpacing:'0.05em' }}>
              Agent Orchestration Visualizer
            </div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ fontSize:10, color:C.textMuted, letterSpacing:'0.06em', textTransform:'uppercase' }}>
            Durée totale estimée: 56.5 s
          </div>

          {!running && !completed && (
            <button
              onClick={handleStart}
              style={{
                display:     'flex', alignItems:'center', gap:7,
                padding:     '9px 20px',
                borderRadius:10,
                background:  'linear-gradient(135deg, #4f46e5, #7c3aed)',
                border:      'none', cursor:'pointer',
                color:       '#fff', fontSize:13, fontWeight:600,
                boxShadow:   '0 4px 14px -2px rgba(79,70,229,0.5)',
                transition:  'transform 0.1s, box-shadow 0.1s',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Play size={14} />
              Démarrer Workflow
            </button>
          )}

          {running && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span className="blink" style={{ width:8, height:8, borderRadius:'50%', background:C.statusRun, display:'inline-block' }} />
              <span style={{ fontSize:12, color:C.statusRun, fontFamily:'monospace', fontWeight:600 }}>
                {formatClock(totalElapsed)}
              </span>
            </div>
          )}

          {(running || completed) && (
            <button
              onClick={handleReset}
              style={{
                display:     'flex', alignItems:'center', gap:6,
                padding:     '8px 16px',
                borderRadius:10,
                background:  'transparent',
                border:      `1px solid ${C.border}`,
                cursor:      'pointer',
                color:       C.textMuted, fontSize:12,
                transition:  'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.text; e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
            >
              <RotateCcw size={12} />
              Réinitialiser
            </button>
          )}
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={S.main}>

        {/* Stats bar */}
        <StatsBar state={state} />

        {/* Orchestrator */}
        <OrchestratorPanel
          state={orchestrator}
          phase={phase}
          totalElapsed={totalElapsed}
          workflow={workflow}
        />

        {/* Pipeline diagram */}
        <PipelineDiagram agentStates={agents} emailSent={emailSent} workflow={workflow} />

        {/* Agent Cards Grid */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap:                 16,
        }}>
          {AGENT_ORDER.map(id => (
            <AgentCard
              key={id}
              def={AGENT_DEFS[id]}
              state={agents[id]}
              totalElapsed={totalElapsed}
            />
          ))}
        </div>

        {/* Activity Log */}
        <ActivityLog logs={logs} />

        {/* Footer */}
        <div style={{
          textAlign:  'center',
          color:      C.textDim,
          fontSize:   10,
          letterSpacing:'0.05em',
          paddingBottom: 8,
        }}>
          VeilleMacro · Agent Orchestration · {new Date().getFullYear()}
        </div>

      </main>
    </div>
  );
}
