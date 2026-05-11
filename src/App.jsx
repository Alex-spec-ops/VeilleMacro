import React, { useReducer, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, CheckCircle2, Loader2 } from 'lucide-react';

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
const C = {
  bg:         '#0f172a',   // slate-900
  card:       '#1e293b',   // slate-800
  cardDeep:   '#162032',
  border:     '#334155',   // slate-700
  text:       '#f1f5f9',   // slate-100
  textMuted:  '#94a3b8',   // slate-400
  textDim:    '#475569',   // slate-600
  // Status
  statusIdle: '#6b7280',
  statusRun:  '#3b82f6',
  statusOk:   '#10b981',
  statusErr:  '#ef4444',
  statusWarn: '#f59e0b',
  // Agent brands
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
  p1s: 0,       p1e: 25_000,
  p2s: 25_000,  p2e: 37_000,
  p3s: 37_000,  p3e: 55_000,
  p4s: 55_000,  p4e: 56_500,
  end: 56_500,
};

/* ─────────────────────────────────────────────
   AGENT DEFINITIONS
───────────────────────────────────────────── */
const AGENTS = {
  collector: {
    id:'collector', name:'macro_research_collector',
    label:'Collecte Sources', emoji:'🔍', color:C.blue,
    duration:25_000, start:T.p1s, end:T.p1e,
    desc:'Collecte et agrège les sources macro-économiques mondiales via APIs et scraping.',
    steps:['Initialisation des connecteurs API…','Connexion Bloomberg Terminal, Reuters…','Collecte données Fed, BCE, BNS, BoJ…','Scraping actualités (47 sources)…','Agrégation corpus documentaire…','Déduplication & validation croisée…','Indexation vectorielle terminée ✓'],
  },
  synthesis: {
    id:'synthesis', name:'comparative_synthesis_agent',
    label:'Analyse Comparative', emoji:'⚖️', color:C.violet,
    duration:12_000, start:T.p2s, end:T.p2e,
    desc:'Analyse comparative multi-sources avec LLM — détection signaux macro.',
    steps:['Chargement corpus (2 847 documents)…','Analyse de sentiment marchés…','Comparaison indicateurs YoY / QoQ…','Détection signaux macro-économiques…','Scoring divergences inter-banques…','Génération synthèse analytique LLM…'],
  },
  dashboard: {
    id:'dashboard', name:'dashboard_generator_agent',
    label:'Dashboard TSX', emoji:'📊', color:C.green,
    duration:18_000, start:T.p3s, end:T.p3s+18_000,
    desc:'Génération du dashboard React/TSX interactif avec visualisations Recharts.',
    steps:['Structuration données visualisation…','Génération composants Recharts…','Compilation dashboard TSX…','Tree-shaking & optimisation bundle…','Injection données temps-réel…','Export artefact HTML/TSX…'],
  },
  pdf: {
    id:'pdf', name:'pdf_report_generator',
    label:'Rapport PDF', emoji:'📄', color:C.amber,
    duration:16_000, start:T.p3s, end:T.p3s+16_000,
    desc:'Génération du rapport PDF exécutif haute qualité, 48 pages, signatures numériques.',
    steps:['Chargement template LaTeX…','Injection données analytiques…','Rendu graphiques 300 dpi…','Compilation PDF/A-2b…','Signature numérique & métadonnées…','Export rapport final (48 pages)…'],
  },
};
const ORDER = ['collector','synthesis','dashboard','pdf'];

/* ─────────────────────────────────────────────
   LOG HELPERS
───────────────────────────────────────────── */
const AGENT_EMOJI = {
  'Orchestrateur':                '🎯',
  'macro_research_collector':     '🔍',
  'comparative_synthesis_agent':  '⚖️',
  'dashboard_generator_agent':    '📊',
  'pdf_report_generator':         '📄',
};

// type: 'info' | 'success' | 'warning' | 'error'
function logEntry(agent, message, type = 'info') {
  return {
    id:    Date.now() + Math.random(),
    agent, message, type,
    emoji: AGENT_EMOJI[agent] ?? '🤖',
    ts:    new Date(),
  };
}

const LOG_COLORS = {
  success: C.statusOk,
  error:   C.statusErr,
  warning: C.statusWarn,
  info:    C.statusRun,
};

/* ─────────────────────────────────────────────
   REDUCER
───────────────────────────────────────────── */
const mkAgent = () => ({ status:'idle', progress:0, elapsed:0, currentStep:'', stepIdx:0 });

const INIT = {
  workflow:     'idle',
  phase:        0,
  agents:       Object.fromEntries(ORDER.map(id => [id, mkAgent()])),
  orchTask:     'En attente du démarrage…',
  logs:         [],
  emailSent:    false,
  totalElapsed: 0,
  completedAt:  null,
};

function stepForPct(pct, len) {
  return Math.min(Math.floor((pct / 100) * len), len - 1);
}

function reducer(state, action) {
  switch (action.type) {

    case 'START': return {
      ...INIT,
      workflow: 'running',
      phase:    1,
      orchTask: 'Phase 1 — Initialisation collecte sources…',
      logs: [logEntry('Orchestrateur','Workflow MacroSynthAI démarré — Phase 1 initialisée','info')],
    };

    case 'TICK': {
      const { ms } = action;
      const ag   = { ...state.agents };
      const logs = [...state.logs];
      let phase  = state.phase;
      let orchTask = state.orchTask;
      let emailSent = state.emailSent;
      let workflow  = state.workflow;
      let completedAt = state.completedAt;

      // Phase 1 – collector
      const col = AGENTS.collector;
      if (ms >= col.start && ms < col.end) {
        const pct = Math.min(100, ((ms - col.start) / col.duration) * 100);
        const si  = stepForPct(pct, col.steps.length);
        if (si !== ag.collector.stepIdx && si > 0)
          logs.push(logEntry('macro_research_collector', col.steps[si-1], 'info'));
        ag.collector = { status:'running', progress:pct, elapsed:ms-col.start, currentStep:col.steps[si]??col.steps.at(-1), stepIdx:si };
      }
      if (ms >= col.end && ag.collector.status !== 'completed') {
        ag.collector = { status:'completed', progress:100, elapsed:col.duration, currentStep:col.steps.at(-1), stepIdx:col.steps.length-1 };
        logs.push(logEntry('macro_research_collector','✓ Collecte terminée — 2 847 documents indexés','success'));
        phase    = 2;
        orchTask = 'Phase 2 — Analyse comparative en cours…';
        logs.push(logEntry('Orchestrateur','Transition Phase 2 → comparative_synthesis_agent','info'));
      }

      // Phase 2 – synthesis
      const syn = AGENTS.synthesis;
      if (ms >= syn.start && ms < syn.end) {
        const pct = Math.min(100, ((ms - syn.start) / syn.duration) * 100);
        const si  = stepForPct(pct, syn.steps.length);
        if (si !== ag.synthesis.stepIdx && si > 0)
          logs.push(logEntry('comparative_synthesis_agent', syn.steps[si-1], 'info'));
        ag.synthesis = { status:'running', progress:pct, elapsed:ms-syn.start, currentStep:syn.steps[si]??syn.steps.at(-1), stepIdx:si };
      }
      if (ms >= syn.end && ag.synthesis.status !== 'completed') {
        ag.synthesis = { status:'completed', progress:100, elapsed:syn.duration, currentStep:syn.steps.at(-1), stepIdx:syn.steps.length-1 };
        logs.push(logEntry('comparative_synthesis_agent','✓ Synthèse générée — 14 signaux macro détectés','success'));
        phase    = 3;
        orchTask = 'Phase 3 — Génération Dashboard TSX ∥ Rapport PDF…';
        logs.push(logEntry('Orchestrateur','Fork parallèle → dashboard_generator + pdf_report_generator','info'));
      }

      // Phase 3 – dashboard + pdf parallel
      for (const id of ['dashboard','pdf']) {
        const def = AGENTS[id];
        if (ms >= def.start && ms < def.end) {
          const pct = Math.min(100, ((ms - def.start) / def.duration) * 100);
          const si  = stepForPct(pct, def.steps.length);
          if (si !== ag[id].stepIdx && si > 0)
            logs.push(logEntry(def.name, def.steps[si-1], 'info'));
          ag[id] = { status:'running', progress:pct, elapsed:ms-def.start, currentStep:def.steps[si]??def.steps.at(-1), stepIdx:si };
        }
        if (ms >= def.end && ag[id].status !== 'completed') {
          ag[id] = { status:'completed', progress:100, elapsed:def.duration, currentStep:def.steps.at(-1), stepIdx:def.steps.length-1 };
          const msg = id === 'dashboard'
            ? '✓ Dashboard TSX généré — 12 composants, 847 KB'
            : '✓ Rapport PDF généré — 48 pages, 3.2 MB';
          logs.push(logEntry(def.name, msg, 'success'));
        }
      }

      // Phase 4 – email
      if (ms >= T.p4s && !emailSent) {
        emailSent = true;
        phase     = 4;
        orchTask  = 'Phase 4 — Envoi email board@veillemacro.io…';
        logs.push(logEntry('Orchestrateur','📧 Email envoyé — dashboard + rapport PDF joints','success'));
      }

      // Done
      if (ms >= T.end && workflow !== 'completed') {
        workflow    = 'completed';
        orchTask    = '✓ Workflow terminé avec succès';
        completedAt = Date.now();
        logs.push(logEntry('Orchestrateur',`Workflow MacroSynthAI complété en ${(ms/1000).toFixed(1)}s — tous les agents OK`,'success'));
      }

      return {
        ...state, workflow, phase, agents:ag,
        orchTask, logs:logs.slice(-80),
        emailSent, totalElapsed:ms, completedAt,
      };
    }

    case 'RESET': return { ...INIT, completedAt: state.completedAt };

    default: return state;
  }
}

/* ─────────────────────────────────────────────
   FORMATTERS
───────────────────────────────────────────── */
function fmtS(ms) {
  return `${(ms/1000).toFixed(1)}s`;
}
function fmtClock(ms) {
  const s  = Math.floor(ms/1000);
  const cs = Math.floor((ms%1000)/10).toString().padStart(2,'0');
  return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}.${cs}`;
}
function timeAgo(ts) {
  if (!ts) return null;
  const s = Math.floor((Date.now()-ts)/1000);
  if (s < 5)  return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  return `${Math.floor(s/3600)}h ago`;
}

/* ─────────────────────────────────────────────
   SHARED ATOMS
───────────────────────────────────────────── */
function Pill({ label, color, bg, dot, check }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'3px 10px', borderRadius:99,
      fontSize:11, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase',
      color, background:bg, border:`1px solid ${color}40`,
    }}>
      {dot  && <span className="blink" style={{ width:6,height:6,borderRadius:'50%',background:color,display:'inline-block' }} />}
      {check && <CheckCircle2 size={10} />}
      {label}
    </span>
  );
}

function StatusPill({ status }) {
  const M = {
    idle:      { label:'Idle',     color:C.statusIdle, bg:'#1f2937', dot:false, check:false },
    running:   { label:'Running',  color:C.statusRun,  bg:'#172554', dot:true,  check:false },
    completed: { label:'Success',  color:C.statusOk,   bg:'#052e16', dot:false, check:true  },
    error:     { label:'Error',    color:C.statusErr,  bg:'#450a0a', dot:false, check:false },
    pending:   { label:'Pending',  color:C.statusWarn, bg:'#451a03', dot:true,  check:false },
  };
  const m = M[status] ?? M.idle;
  return <Pill {...m} />;
}

function ProgressBar({ pct, gradient, color, h=6 }) {
  return (
    <div style={{ height:h, background:`${color}22`, borderRadius:99, overflow:'hidden', position:'relative' }}>
      <div style={{
        height:'100%', width:`${pct}%`,
        background: gradient ?? `linear-gradient(90deg,${color}99,${color})`,
        borderRadius:99, transition:'width 0.25s ease',
        position:'relative', boxShadow:`0 0 8px 1px ${color}55`,
      }}>
        <span style={{
          position:'absolute', inset:0,
          background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)',
          animation:'beam 1.6s linear infinite', borderRadius:99,
        }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HEADER
───────────────────────────────────────────── */
function AppHeader({ workflow, totalElapsed, completedAt }) {
  const lastRun = timeAgo(completedAt);
  const globalStatus = workflow === 'completed' ? 'completed'
                     : workflow === 'running'   ? 'running'
                     :                           'idle';
  return (
    <header style={{
      background:   'rgba(15,23,42,0.97)',
      borderBottom: `1px solid ${C.border}`,
      backdropFilter:'blur(16px)',
      position:'sticky', top:0, zIndex:50,
      padding:'0 28px', height:60,
      display:'flex', alignItems:'center', justifyContent:'space-between',
    }}>
      {/* Left: Brand */}
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ fontSize:22 }}>🎯</span>
        <div>
          <div style={{
            fontSize:16, fontWeight:800, letterSpacing:'-0.02em',
            background:'linear-gradient(90deg,#ec4899,#3b82f6)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            backgroundClip:'text',
          }}>
            MacroSynthAI
          </div>
          <div style={{ fontSize:10, color:C.textDim, letterSpacing:'0.06em', marginTop:1 }}>
            AGENT ORCHESTRATION PLATFORM
          </div>
        </div>
      </div>

      {/* Right: Status + timestamp */}
      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        {workflow === 'running' && (
          <span style={{ fontFamily:'monospace', fontSize:13, color:C.statusRun, fontWeight:600, letterSpacing:'0.04em' }}>
            <span className="blink" style={{ display:'inline-block',width:7,height:7,borderRadius:'50%',background:C.statusRun,marginRight:6,verticalAlign:'middle' }} />
            {fmtClock(totalElapsed)}
          </span>
        )}
        <StatusPill status={globalStatus} />
        <div style={{ fontSize:11, color:C.textDim, textAlign:'right', lineHeight:1.4 }}>
          <div>Last run</div>
          <div style={{ color: lastRun ? C.textMuted : C.textDim }}>
            {lastRun ?? '—'}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────
   ORCHESTRATOR CARD
───────────────────────────────────────────── */
function OrchestratorCard({ workflow, phase, orchTask, totalElapsed, onLaunch, onReset }) {
  const running   = workflow === 'running';
  const completed = workflow === 'completed';

  const globalPct = Math.min(100, (totalElapsed / T.end) * 100);

  const phaseSteps = {
    0: { n:0, desc:'Prêt à démarrer' },
    1: { n:1, desc:'Collecte des sources macro-économiques' },
    2: { n:2, desc:'Analyse comparative multi-sources' },
    3: { n:3, desc:'Génération Dashboard TSX + Rapport PDF' },
    4: { n:4, desc:'Envoi email board@veillemacro.io' },
  };
  const step = phaseSteps[phase] ?? phaseSteps[0];

  return (
    <div style={{
      background:   C.card,
      border:       `1.5px solid ${running ? C.pink+'88' : completed ? C.statusOk+'66' : C.pink+'33'}`,
      borderRadius: 20,
      padding:      '28px 32px',
      position:     'relative', overflow:'hidden',
      boxShadow:    running ? `0 0 48px -8px ${C.pink}40` : completed ? `0 0 24px -8px ${C.statusOk}30` : 'none',
      transition:   'box-shadow 0.5s ease, border-color 0.4s ease',
    }}>
      {/* BG grid */}
      <div style={{
        position:'absolute', inset:0, opacity:0.025, pointerEvents:'none',
        backgroundImage:'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
        backgroundSize:'40px 40px',
      }} />
      {/* Pink glow corner */}
      <div style={{
        position:'absolute', top:-60, right:-60,
        width:200, height:200, borderRadius:'50%',
        background:`radial-gradient(circle,${C.pink}18 0%,transparent 70%)`,
        pointerEvents:'none',
      }} />

      <div style={{ position:'relative' }}>
        {/* Top row: identity + status */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ position:'relative' }}>
              {running && <span className="pulse-ring" style={{ position:'absolute',inset:-7,borderRadius:'50%',border:`2px solid ${C.pink}` }} />}
              <div style={{
                width:54, height:54, borderRadius:16,
                background:`linear-gradient(135deg,${C.pink}22,${C.violet}22)`,
                border:`1.5px solid ${running?C.pink+'66':C.pink+'33'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:26,
              }}>
                {running ? <Loader2 size={24} color={C.pink} className="spin" /> : '🎯'}
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, color:C.textMuted, letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:4 }}>
                Orchestrateur principal
              </div>
              <div style={{ fontSize:19, fontWeight:800, letterSpacing:'-0.01em' }}>
                <span className={running?'shimmer-text':''} style={{ color: running?undefined:completed?C.statusOk:C.text }}>
                  🎯 Orchestrator
                </span>
              </div>
              <div style={{ fontSize:11, color:C.textMuted, fontFamily:'monospace', marginTop:3 }}>
                macro_synthesis_orchestrator
              </div>
            </div>
          </div>
          <StatusPill status={running?'running':completed?'completed':'idle'} />
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:12, fontWeight:600, color:running?C.pink:completed?C.statusOk:C.textDim }}>
              {globalPct.toFixed(1)}%
            </span>
            <span style={{ fontSize:11, color:C.textMuted }}>
              {running ? fmtClock(totalElapsed) : completed ? `${fmtS(T.end)} total` : `~${fmtS(T.end)} estimé`}
            </span>
          </div>
          <ProgressBar
            pct={globalPct}
            gradient="linear-gradient(90deg,#ec4899,#8b5cf6,#3b82f6)"
            color={C.pink}
            h={8}
          />
        </div>

        {/* Current step */}
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          background:`${C.pink}0c`, border:`1px solid ${C.pink}22`,
          borderRadius:10, padding:'9px 14px', marginBottom:22,
          fontSize:12, color: running?C.pink:completed?C.statusOk:C.textMuted,
          fontFamily:'monospace',
        }}>
          {running
            ? <Loader2 size={11} color={C.pink} className="spin" />
            : completed
              ? <CheckCircle2 size={11} color={C.statusOk} />
              : <span style={{ width:11, height:11, borderRadius:'50%', background:C.textDim, display:'inline-block', flexShrink:0 }} />
          }
          {phase > 0
            ? <span>Current: <strong>Step {step.n}/4</strong> — {step.desc}</span>
            : <span>{orchTask}</span>
          }
        </div>

        {/* Buttons */}
        <div style={{ display:'flex', gap:10 }}>
          <button
            onClick={onLaunch}
            disabled={running}
            style={{
              flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              padding:'11px 0', borderRadius:12, border:'none', cursor:running?'not-allowed':'pointer',
              background: running
                ? `linear-gradient(135deg,${C.pink}44,${C.blue}44)`
                : 'linear-gradient(135deg,#ec4899,#8b5cf6,#3b82f6)',
              color:'#fff', fontSize:14, fontWeight:700,
              opacity: running ? 0.6 : 1,
              boxShadow: running ? 'none' : '0 4px 20px -4px rgba(236,72,153,0.5)',
              transition:'opacity 0.2s,box-shadow 0.2s,transform 0.1s',
            }}
            onMouseDown={e=>{ if(!running) e.currentTarget.style.transform='scale(0.98)'; }}
            onMouseUp={e=>{ e.currentTarget.style.transform='scale(1)'; }}
          >
            {running ? <><Loader2 size={15} className="spin"/>Running…</> : <>🚀 Launch MacroSynthAI</>}
          </button>
          <button
            onClick={onReset}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'11px 18px', borderRadius:12,
              background:'transparent', border:`1px solid ${C.border}`,
              cursor:'pointer', color:C.textMuted, fontSize:13, fontWeight:600,
              transition:'border-color 0.2s,color 0.2s,transform 0.1s',
            }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.text; e.currentTarget.style.color=C.text; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.textMuted; }}
            onMouseDown={e=>{ e.currentTarget.style.transform='scale(0.97)'; }}
            onMouseUp={e=>{ e.currentTarget.style.transform='scale(1)'; }}
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
───────────────────────────────────────────── */
function AgentCard({ def, ag }) {
  const { emoji, label, name, color, duration, desc } = def;
  const running   = ag.status === 'running';
  const completed = ag.status === 'completed';

  const borderColor = running   ? color
                    : completed ? C.statusOk
                    :             C.border;

  /* Timer display */
  let timerNode;
  if (running) {
    timerNode = (
      <span style={{ display:'flex', alignItems:'center', gap:5, color, fontWeight:700, fontSize:13, fontFamily:'monospace' }}>
        <span className="blink" style={{ width:6,height:6,borderRadius:'50%',background:color,display:'inline-block' }} />
        {fmtS(ag.elapsed)}
        <span style={{ color:C.textDim, fontWeight:400 }}>/ {fmtS(duration)}</span>
      </span>
    );
  } else if (completed) {
    timerNode = (
      <span style={{ color:C.statusOk, fontWeight:700, fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
        <CheckCircle2 size={12} /> Completed in {fmtS(duration)}
      </span>
    );
  } else {
    timerNode = (
      <span style={{ color:C.textDim, fontSize:12, fontStyle:'italic' }}>Waiting…</span>
    );
  }

  return (
    <div style={{
      background:   C.card,
      border:       `1px solid ${borderColor}`,
      borderRadius: 16,
      padding:      '18px 20px',
      position:     'relative', overflow:'hidden',
      boxShadow:    running ? `0 0 20px -6px ${color}44` : 'none',
      transition:   'border-color 0.4s ease, box-shadow 0.4s ease',
    }}>
      {/* Glow top line */}
      {running && (
        <div style={{
          position:'absolute', top:0, left:0, right:0, height:2,
          background:`linear-gradient(90deg,transparent,${color},transparent)`,
          animation:'beam 2s linear infinite',
        }} />
      )}

      {/* Header row */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:42, height:42, borderRadius:11,
            background:`${color}18`, border:`1px solid ${color}44`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:20, position:'relative', flexShrink:0,
          }}>
            {running
              ? <Loader2 size={18} color={color} className="spin" />
              : <span style={{ filter: ag.status==='idle'?'grayscale(1) opacity(0.35)':'none' }}>{emoji}</span>
            }
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:C.text, lineHeight:1.2 }}>{label}</div>
            <div style={{ fontSize:9, color:C.textMuted, fontFamily:'monospace', marginTop:3, letterSpacing:'0.02em' }}>{name}</div>
          </div>
        </div>
        <StatusPill status={ag.status} />
      </div>

      {/* Description */}
      <p style={{ fontSize:11, color:C.textMuted, margin:'0 0 12px', lineHeight:1.6 }}>{desc}</p>

      {/* Progress */}
      <ProgressBar pct={ag.progress} color={ag.status==='idle'?C.textDim:color} h={5} />

      {/* Timer */}
      <div style={{ marginTop:10 }}>
        {timerNode}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   EXECUTION LOG
───────────────────────────────────────────── */
function ExecutionLog({ logs }) {
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [logs.length]);

  return (
    <div style={{
      background:   C.card,
      border:       `1px solid ${C.border}`,
      borderRadius: 16,
      overflow:     'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding:'12px 20px', borderBottom:`1px solid ${C.border}`,
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:14 }}>📋</span>
          <span style={{ fontSize:12, fontWeight:700, color:C.text, letterSpacing:'0.03em' }}>
            Execution Log
          </span>
        </div>
        <span style={{
          fontSize:11, color:C.textMuted,
          background:C.cardDeep, border:`1px solid ${C.border}`,
          padding:'2px 8px', borderRadius:6,
        }}>
          {logs.length} entries
        </span>
      </div>

      {/* Entries */}
      <div style={{
        maxHeight:300, overflowY:'auto', padding:'4px 0',
        scrollbarWidth:'thin', scrollbarColor:`${C.border} transparent`,
      }}>
        {logs.length === 0 ? (
          <div style={{ textAlign:'center', color:C.textDim, fontSize:12, padding:'36px 0', fontStyle:'italic' }}>
            Waiting for workflow to start…
          </div>
        ) : (
          logs.map((entry, i) => {
            const col = LOG_COLORS[entry.type] ?? C.statusRun;
            return (
              <div
                key={entry.id}
                className="slide-in"
                style={{
                  display:'flex', alignItems:'baseline', gap:0,
                  padding:'5px 20px',
                  borderBottom: i < logs.length-1 ? `1px solid ${C.border}33` : 'none',
                  fontSize:12, lineHeight:1.5, fontFamily:'monospace',
                }}
              >
                {/* Timestamp */}
                <span style={{ color:C.textDim, fontSize:11, flexShrink:0, marginRight:10 }}>
                  [{entry.ts.toTimeString().slice(0,8)}]
                </span>
                {/* Emoji */}
                <span style={{ fontSize:13, flexShrink:0, marginRight:8, lineHeight:1 }}>
                  {entry.emoji}
                </span>
                {/* Agent */}
                <span style={{
                  color:col, fontWeight:700, flexShrink:0,
                  minWidth:220, fontSize:11, marginRight:8,
                }}>
                  [{entry.agent}]
                </span>
                {/* Message */}
                <span style={{ color: entry.type==='success'?C.statusOk:entry.type==='error'?C.statusErr:entry.type==='warning'?C.statusWarn:C.text, fontSize:11 }}>
                  {entry.message}
                </span>
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
  const [state, dispatch] = useReducer(reducer, INIT);
  const startRef = useRef(null);
  const rafRef   = useRef(null);

  const tick = useCallback(() => {
    if (!startRef.current) return;
    const ms = Date.now() - startRef.current;
    dispatch({ type:'TICK', ms });
    if (ms < T.end + 500) rafRef.current = requestAnimationFrame(tick);
  }, []);

  const handleLaunch = useCallback(() => {
    if (state.workflow === 'running') return;
    dispatch({ type:'START' });
    startRef.current = Date.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [state.workflow, tick]);

  const handleReset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = null;
    dispatch({ type:'RESET' });
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const { workflow, phase, agents, orchTask, logs, totalElapsed, completedAt } = state;

  return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.text, fontFamily:"'SF Mono','Fira Code','Consolas',monospace" }}>

      <AppHeader workflow={workflow} totalElapsed={totalElapsed} completedAt={completedAt} />

      <main style={{
        maxWidth:1100, margin:'0 auto', padding:'28px 24px',
        display:'flex', flexDirection:'column', gap:24,
      }}>

        {/* ── Orchestrator card ── */}
        <OrchestratorCard
          workflow={workflow}
          phase={phase}
          orchTask={orchTask}
          totalElapsed={totalElapsed}
          onLaunch={handleLaunch}
          onReset={handleReset}
        />

        {/* ── 3-col grid: Collector, Synthesis, Dashboard ── */}
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(3,1fr)',
          gap:16,
        }}>
          {['collector','synthesis','dashboard'].map(id => (
            <AgentCard key={id} def={AGENTS[id]} ag={agents[id]} />
          ))}
        </div>

        {/* ── PDF alone ── */}
        <AgentCard def={AGENTS.pdf} ag={agents.pdf} />

        {/* ── Execution Log ── */}
        <ExecutionLog logs={logs} />

        {/* Footer */}
        <div style={{ textAlign:'center', color:C.textDim, fontSize:10, letterSpacing:'0.05em', paddingBottom:8 }}>
          MacroSynthAI · Agent Orchestration Platform · {new Date().getFullYear()}
        </div>

      </main>
    </div>
  );
}
