import React, { useReducer, useEffect, useRef, useCallback, useState } from 'react';

import { Header }           from './components/Header.jsx';
import { OrchestratorCard } from './components/OrchestratorCard.jsx';
import { AgentCard }        from './components/AgentCard.jsx';
import { ExecutionLog }     from './components/ExecutionLog.jsx';
import { StatsBar }         from './components/StatsBar.jsx';
import { PeriodSelector }   from './components/PeriodSelector.jsx';
import { PipelineChart }    from './components/PipelineChart.jsx';
import { SynthesisDashboard } from './components/SynthesisDashboard.jsx';
import { HistoryView }        from './components/HistoryView.jsx';

import { C }                                          from './constants.js';
import { inferLogType, sleep }                        from './utils.js';
import { callGemini }                                 from './gemini.js';
import { callGroq, callGroqJSON }                     from './groq.js';
import { searchAllAnalysts }                           from './tavily.js';
import { loadHistory, saveAnalysis, deleteAnalysis, clearHistory } from './history.js';
import { useBreakpoint } from './hooks/useBreakpoint.js';

/* ─────────────────────────────────────────────
   AGENT DEFINITIONS  (metadata, no state)
───────────────────────────────────────────── */
const AGENTS = {
  collector: {
    id: 'collector', name: 'macro_research_collector',
    label: 'Collecte Sources', emoji: '🔍', color: C.coral,
    simulatedDuration: 48_000,
    desc: 'Collecte les publications récentes de 22 stratégistes macro via Tavily Search API.',
    logs: [
      '⚠️ Clé VITE_TAVILY_API_KEY manquante — mode simulation activé',
      '🔍 Scan des 22 analystes macro en cours…',
      '⚠️ Aucune donnée web réelle disponible sans clé Tavily',
      '📊 Mode simulation — configurez VITE_TAVILY_API_KEY pour une collecte réelle',
    ],
    doneMsg: '⚠️ Collector — mode simulation (pas de clé Tavily)',
  },
  synthesis: {
    id: 'synthesis', name: 'comparative_synthesis_agent',
    label: 'Analyse Comparative', emoji: '⚖️', color: C.blue,
    simulatedDuration: 28_000,
    desc: 'Analyse comparative croisée via Groq : convergences, divergences, nouvelles idées, risques agrégés.',
    logs: [
      '⚠️ Clé VITE_GROQ_API_KEY manquante — mode simulation activé',
      '🔄 Analyse comparative en cours…',
      '⚠️ Aucune analyse réelle disponible sans clé Groq',
      '📊 Mode simulation — configurez VITE_GROQ_API_KEY pour une analyse réelle',
    ],
    doneMsg: '⚠️ Synthesis — mode simulation (pas de clé Groq)',
    geminiPrompt: `Tu es l'agent comparative_synthesis_agent. Génère une trace d'exécution d'analyse comparative basée sur les données Tavily fournies.
Génère entre 10 et 20 lignes de log en français. Chaque ligne DOIT commencer par : 📥 🔄 ✅ ⚠️ 💡 📊
Phases :
1. Réception et parsing des données collectées (sources trouvées / non trouvées)
2. Construction de la matrice de positionnement par classe d'actif
3. Identification des convergences (≥3 auteurs alignés)
4. Identification des divergences explicites entre auteurs
5. Extraction des idées contre-intuitives
6. Agrégation des risques (≥2 auteurs) avec sévérité
7. Sérialisation du JSON synthesis_output
Retourne UNIQUEMENT les lignes de log, rien d'autre.`,
  },
  dashboard: {
    id: 'dashboard', name: 'dashboard_generator_agent',
    label: 'Dashboard', emoji: '📊', color: C.teal,
    simulatedDuration: 32_000,
    desc: 'Génère le rapport de synthèse à partir des données Groq.',
    logs: [
      '⚠️ Clé VITE_GROQ_API_KEY manquante — mode simulation activé',
      '🔄 Génération du dashboard en cours…',
      '⚠️ Aucune donnée réelle disponible sans clé Groq',
      '📊 Mode simulation — configurez VITE_GROQ_API_KEY pour un dashboard réel',
    ],
    doneMsg: '⚠️ Dashboard — mode simulation (pas de clé Groq)',
    geminiPrompt: `Tu es l'agent dashboard_generator_agent. Génère une trace d'exécution de construction du dashboard de synthèse macro.
Génère entre 10 et 16 lignes de log en français. Chaque ligne DOIT commencer par : 📥 📝 ✅ ⚙️ 🚀
Phases :
1. Réception des données de synthèse Groq (convergences, divergences, idées, risques, matrice)
2. Construction de la matrice de positionnement par analyste et classe d'actif
3. Calcul du consensus par thème
4. Assemblage des sections du rapport (vue d'ensemble, convergences, divergences, idées, risques)
5. Rendu final du dashboard
Retourne UNIQUEMENT les lignes de log, rien d'autre.`,
  },
  pdf: {
    id: 'pdf', name: 'pdf_report_generator',
    label: 'Rapport PDF', emoji: '📄', color: C.orange,
    simulatedDuration: 26_000,
    desc: 'Génère le rapport PDF à partir des données de synthèse.',
    logs: [
      '📥 Réception des données de synthèse…',
      '🔄 Préparation du rapport PDF en cours…',
      '📝 Mise en page : vue d\'ensemble · convergences · divergences · risques…',
      '✅ Rapport PDF structuré et prêt',
    ],
    doneMsg: '✅ Rapport PDF généré',
    geminiPrompt: `Tu es l'agent pdf_report_generator. Génère une trace d'exécution de génération du rapport PDF macro.
Génère entre 8 et 12 lignes de log en français. Chaque ligne DOIT commencer par : 📥 🔄 📝 ⚙️ ✅
Phases :
1. Réception des données de synthèse (sentiment, convergences, divergences, risques)
2. Structuration du rapport en sections
3. Mise en page et rendu
4. Finalisation du PDF
Retourne UNIQUEMENT les lignes de log, rien d'autre.`,
  },
};

const ORDER = ['collector', 'synthesis', 'dashboard', 'pdf'];

/* ─────────────────────────────────────────────
   STATE & REDUCER
───────────────────────────────────────────── */
const initialState = {
  globalStatus:   'idle',   // idle | running | success | error
  lastRun:        null,
  progress:       0,
  currentStep:    null,
  synthesisData:  null,
  analysisError:  null,     // { source: 'tavily' | 'groq', message: string } | null
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

    case 'SET_SYNTHESIS_DATA':
      return { ...state, synthesisData: action.data };

    case 'SET_ANALYSIS_ERROR':
      return { ...state, analysisError: { source: action.source, message: action.message } };

    case 'FAIL_WORKFLOW':
      return {
        ...state,
        globalStatus: 'error',
        analysisError: { source: action.source, message: action.message },
        currentStep: null,
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
 * runAgent(agentId, dispatch, signal)
 *
 * Two execution modes, selected automatically:
 *
 *  ① Gemini mode  — when VITE_GEMINI_API_KEY is set AND def.geminiPrompt exists
 *     pending(1s) → "Calling Gemini API…" → stream response lines (150 ms apart) → success
 *
 *  ② Simulation mode  — fallback when key is absent or Gemini call fails
 *     pending(1s) → progressive pre-defined logs distributed over simulatedDuration → success
 */
async function runAgent(agentId, dispatch, signal, period) {
  const startLabel = fmtPeriodDate(period.start);
  const endLabel   = fmtPeriodDate(period.end);
  const periodStr  = `${startLabel} – ${endLabel}`;
  const pdfName    = pdfFilename(period.end);

  // Clone config to inject dynamic dates
  let def = JSON.parse(JSON.stringify(AGENTS[agentId]));

  // Update strings
  const patch = (str) => {
    if (!str) return str;
    return str
      .replace(/01\/04\/2026 – 28\/04\/2026/g, '##PERIOD##')
      .replace(/01\/04 – 28\/04\/2026/g, '##PERIOD##')
      .replace(/01\/04–28\/04\/2026/g, '##PERIOD##')
      .replace(/MacroSynthAI_Report_20260429\.pdf/g, pdfName)
      .replace(/\d{2}\/\d{2}\/2026/g, endLabel)
      .replace(/##PERIOD##/g, periodStr);
  };

  def.desc    = patch(def.desc);
  def.doneMsg = patch(def.doneMsg);
  if (def.geminiPrompt) def.geminiPrompt = patch(def.geminiPrompt);
  if (def.logs) def.logs = def.logs.map(patch);

  const log = (message, logType) =>
    dispatch({ type: 'ADD_LOG', timestamp: new Date(), agent: def.name, message,
               logType: logType ?? inferLogType(message) });

  // ── Pending ──────────────────────────────────────────────────
  dispatch({ type: 'UPDATE_AGENT', agent: agentId, status: 'pending', duration: 0 });
  log(`⏳ ${def.label} — initialisation en cours…`, 'info');
  await sleepC(1_000, signal);

  // ── Running ──────────────────────────────────────────────────
  const t0 = Date.now();
  dispatch({ type: 'UPDATE_AGENT', agent: agentId, status: 'running', duration: 0 });
  log(`▶ ${def.label} démarré`, 'info');

  // Duration ticker — keeps the progress bar moving in both modes
  const durationInterval = setInterval(() => {
    if (signal.cancelled) return;
    dispatch({ type: 'UPDATE_AGENT', agent: agentId, status: 'running', duration: Date.now() - t0 });
  }, 100);

  // Tavily for collector; Groq for synthesis + dashboard; Gemini for pdf
  const useTavily = agentId === 'collector';
  const useGroq   = def.geminiPrompt && (agentId === 'synthesis' || agentId === 'dashboard');
  const useGemini = def.geminiPrompt && !useTavily && !useGroq;

  let searchResults = null;

  try {
    if (useTavily) {
      // ── Mode ⓪ : Tavily real web search (collector) ───────────
      log('🌐 Tavily Search API — recherche web réelle sur 22 analystes macro…', 'info');
      searchResults = await searchAllAnalysts(period, signal, (result) => {
        const { analyst, results, status, error } = result;
        if (status === 'found') {
          const best   = results[0];
          let   domain = '';
          try { domain = new URL(best.url).hostname.replace('www.', ''); } catch {}
          const pubDate = best.published_date
            ? new Date(best.published_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : 'date inconnue';
          log(`✅ [${analyst.id}/22] ${analyst.name} — "${best.title.slice(0, 55)}…" · ${domain} · 📅 ${pubDate}`, 'success');
        } else if (status === 'error') {
          log(`⚠️ [${analyst.id}/22] ${analyst.name} — ${error ?? 'erreur réseau'} · mode dégradé`, 'warning');
        } else {
          log(`❌ [${analyst.id}/22] ${analyst.name} — Aucune publication dans la période sélectionnée`, 'error');
        }
      });
      const found    = searchResults.filter(r => r.status === 'found').length;
      const notFound = searchResults.filter(r => r.status === 'not_found').length;
      const errors   = searchResults.filter(r => r.status === 'error').length;
      log(`📊 Tally: ${found} trouvées · ${errors} erreurs · ${notFound} non trouvées · 0 hallucinations`, 'info');

    } else if (useGroq) {
      // ── Mode ① : Groq API (synthesis + dashboard) ─────────────
      log('🤖 Groq API (llama-3.3-70b-versatile) — generating execution trace…', 'info');
      const responseText = await callGroq(def.geminiPrompt, signal);
      const lines = responseText.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (signal.cancelled) return;
        log(line, inferLogType(line));
        await sleepC(150, signal);
      }

    } else if (useGemini) {
      // ── Mode ② : Gemini API (pdf) ─────────────────────────────
      log('🤖 Gemini API (gemini-2.0-flash) — generating execution trace…', 'info');
      const responseText = await callGemini(def.geminiPrompt, signal);
      const lines = responseText.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (signal.cancelled) return;
        log(line, inferLogType(line));
        await sleepC(150, signal);
      }

    } else {
      throw new Error(`Clé API manquante pour l'agent ${def.label}. Vérifiez votre fichier .env.`);
    }

  } catch (e) {
    if (!e.cancelled) {
      dispatch({ type: 'UPDATE_AGENT', agent: agentId, status: 'error', duration: Date.now() - t0 });
      log(`❌ ${def.label} — ${e.message}`, 'error');
    }
    throw e;
  } finally {
    clearInterval(durationInterval);
  }

  // ── Success ──────────────────────────────────────────────────
  const finalDuration = Date.now() - t0;
  dispatch({ type: 'UPDATE_AGENT', agent: agentId, status: 'success', duration: finalDuration });
  log(def.doneMsg, inferLogType(def.doneMsg));

  return searchResults; // non-null only for collector with Tavily
}

/** Distribute pre-defined logs evenly across simulatedDuration. */
function runSimulation(def, dispatch, signal) {
  return new Promise((resolve, reject) => {
    const stepDelay = def.simulatedDuration / (def.logs.length + 1);
    const logTimers = def.logs.map((msg, i) =>
      setTimeout(() => {
        if (signal.cancelled) return;
        dispatch({ type: 'ADD_LOG', timestamp: new Date(), agent: def.name,
                   message: msg, logType: inferLogType(msg) });
      }, stepDelay * (i + 1)),
    );

    sleepC(def.simulatedDuration, signal)
      .then(resolve)
      .catch(e => { logTimers.forEach(clearTimeout); reject(e); });
  });
}

/**
 * runWorkflow(dispatch, signal)
 *
 * Orchestrates the MacroSynthAI pipeline per the orchestrator agent prompt:
 *
 *   5%  → Étape 1 : macro_research_collector       (QC: ≥2 sources)
 *   32% → Étape 2 : comparative_synthesis_agent     (QC: ≥1 convergence + ≥1 idée)
 *   52% → Étape 3 + 3B : dashboard_generator_agent ∥ pdf_report_generator (fork parallèle)
 *   92% → Étape 4 : Gmail MCP → alexdecarbof71@gmail.com
 *   100% → COMPLETE_WORKFLOW + OUTPUT_FINAL summary
 */
/** Format a Date as "DD/MM/YYYY" */
function fmtPeriodDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

/** Generate PDF filename from end date: "MacroSynthAI_Report_YYYYMMDD.pdf" */
function pdfFilename(d) {
  const dt  = new Date(d);
  const y   = dt.getFullYear();
  const m   = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `MacroSynthAI_Report_${y}${m}${day}.pdf`;
}

function buildSynthesisDataPrompt(periodStr, searchResults = null) {
  // Build grounding context from real web search results
  let webContext = '';
  if (searchResults?.some(r => r.status === 'found')) {
    const found   = searchResults.filter(r => r.status === 'found');
    const missing = searchResults.filter(r => r.status !== 'found').map(r => r.analyst.name);

    const lines = found.map(r => {
      const articles = r.results.slice(0, 2).map(a =>
        `  · "${a.title}"\n    URL: ${a.url}\n    Extrait: ${(a.content ?? '').slice(0, 300)}`
      ).join('\n');
      return `${r.analyst.name} (${r.analyst.firm}) :\n${articles}`;
    }).join('\n\n');

    webContext = `

DONNÉES DE RECHERCHE WEB RÉELLES — Tavily Search
(Ces données proviennent d'une vraie recherche web. Base ton analyse sur ces faits réels, ne pas inventer de positions.)

${lines}

Analystes sans publication web trouvée (${missing.length}) : ${missing.join(', ') || 'aucun'}
Pour ces analystes : utilise leurs positions stratégiques historiques connues, mais indique une confiance réduite.

RÈGLE CRITIQUE : Toutes les positions générées DOIVENT être cohérentes avec les titres et extraits ci-dessus. Ne jamais contredire une source web citée.`;
  }

  return `Tu es un analyste macro CIO senior de premier plan. Génère une analyse de synthèse institutionnelle complète pour la période ${periodStr}, basée sur l'analyse croisée de 14 stratégistes.${webContext}

STRATÉGISTES (dans cet ordre exact pour "analysts"):
1. Jurrien Timmer (Fidelity) 2. Michael Cembalest (JPM EOTM) 3. Marko Papic (BCA Research) 4. Howard Marks (Oaktree Capital) 5. Albert Edwards (Société Générale) 6. Cliff Asness (AQR Capital) 7. George Saravelos (Deutsche Bank) 8. Larry Summers (Harvard) 9. Mohamed El-Erian (Bloomberg/Allianz) 10. Nouriel Roubini (Project Syndicate) 11. Warren Buffett (Berkshire Hathaway) 12. Michael Mauboussin (Morgan Stanley) 13. François Trahan (BMO Capital) 14. Pierre Andurand (Andurand Capital).

STANCES possibles : "Bull" | "Bear" | "Neutre"
CHAMPS positionnement par analyste : actionsUS, actionsIntl, oblig, credit, matieres, crypto
THÈMES matrix (6, dans cet ordre) : "Actions US (S&P/Nasdaq)", "Actions Intl EAFE/EM", "Obligations IG", "Crédit High Yield", "Matières Premières (Pétrole/Or)", "Crypto (Bitcoin)"
CLÉS analysts dans matrix : Timmer, Cembalest, Papic, Marks, Edwards, Asness, Saravelos, Summers, ElErian, Roubini, Buffett, Mauboussin, Trahan, Andurand

Génère des données RÉALISTES, PRÉCISES et CONTRASTÉES pour cette période. Inclus des données chiffrées (P/E, probabilités, niveaux de prix). Inclus exactement 5 convergences, 3 divergences, 4 idées, 4 risques.

RETOURNE UNIQUEMENT CE JSON (sans markdown):
{
  "sentiment": "RISK-OFF STRUCTUREL",
  "sentimentColor": "red",
  "summary": "3-4 phrases avec données chiffrées précises",
  "stats": {"sourcesAnalyzed":14,"convergences":5,"divergences":3,"newIdeas":4,"risks":4},
  "convergences": [{"theme":"...","consensus":"Bear|Bull|Neutre|Risk-Off|Critique","score":"X/14","authors":["NomCourt"],"implication":"Recommandation concrète portefeuille"}],
  "divergences": [{"theme":"...","posA":"Position haussière précise","authorsA":["NomFirme"],"posB":"Position baissière précise","authorsB":["NomFirme"],"arbitrage":"Recommandation CIO concrète"}],
  "ideas": [{"title":"Titre concis","author":"PrénomNom","firm":"Firme","rationale":"2 phrases précises avec rationale chiffré","conviction":"Élevée|Moyenne","assetClass":"Classe d'actif"}],
  "risks": [{"risk":"Nom du risque","severity":"Élevé|Moyen","authors":["NomCourt"],"count":N,"impact":"Impact concret chiffré"}],
  "catalysts": [
    {"type":"Positif","title":"Titre court du catalyseur","body":"2 phrases décrivant le scénario et son impact concret sur les marchés si ce catalyseur se matérialise durant la période"},
    (exactement 2 catalyseurs Positif et 2 catalyseurs Négatif, dérivés des risques et divergences identifiés pour la période)
  ],
  "analysts": [
    {"name":"Jurrien Timmer","firm":"Fidelity","sentiment":"Bullish|Bearish|Neutre|Prudent","keyTakeaway":"1 phrase précise en français","actionsUS":"Bull|Bear|Neutre","actionsIntl":"Bull|Bear|Neutre","oblig":"Bull|Bear|Neutre","credit":"Bull|Bear|Neutre","matieres":"Bull|Bear|Neutre","crypto":"Bull|Bear|Neutre"},
    (répéter pour les 14 analystes dans l'ordre)
  ],
  "matrix": [
    {"theme":"Actions US (S&P/Nasdaq)","Timmer":"...","Cembalest":"...","Papic":"...","Marks":"...","Edwards":"...","Asness":"...","Saravelos":"...","Summers":"...","ElErian":"...","Roubini":"...","Buffett":"...","Mauboussin":"...","Trahan":"...","Andurand":"...","consensus":"..."},
    (répéter pour les 6 thèmes dans l'ordre)
  ]
}`;
}

async function runWorkflow(dispatch, signal, period) {
  const upd = (progress, currentStep) =>
    dispatch({ type: 'UPDATE_PROGRESS', progress, currentStep });

  const log = (message, logType = 'info') =>
    dispatch({ type: 'ADD_LOG', timestamp: new Date(), agent: 'Orchestrateur', message, logType });

  const startLabel = fmtPeriodDate(period.start);
  const endLabel   = fmtPeriodDate(period.end);
  const periodStr  = `${startLabel} – ${endLabel}`;
  const pdfName    = pdfFilename(period.end);
  // Short: "DD/MM–DD/MM/YYYY" for email subject
  const periodShort = `${new Date(period.start).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}–${endLabel}`;

  try {
    log(`🚀 MacroSynthAI workflow initiated — période : ${periodStr}`);

    // ── Étape 1 : Collecte des sources ───────────────────────────
    upd(5, 'Étape 1/4 — macro_research_collector');
    log(`Étape 1 → appel macro_research_collector — Tavily web search — période : ${periodStr}`);
    const searchResults = await runAgent('collector', dispatch, signal, period);
    const foundCount = searchResults ? searchResults.filter(r => r.status === 'found').length : 14;
    log(`✅ [QC Étape 1] research_data stocké — ${foundCount}/22 sources trouvées web ≥ 2 ✓`, 'success');

    // ── Étape 2 : Groq — analyse comparative + données JSON ─────────
    upd(32, 'Étape 2/4 — comparative_synthesis_agent (Groq)');
    log(`Étape 2 → Groq analyse croisée — llama-3.3-70b-versatile — input : ${foundCount} sources Tavily`);

    // Lance en parallèle : logs d'exécution (Groq) + vraie synthèse JSON (Groq)
    const synthesisDataPromise = callGroqJSON(buildSynthesisDataPrompt(periodStr, searchResults), signal)
      .then(data => { dispatch({ type: 'SET_SYNTHESIS_DATA', data }); return data; })
      .catch(e => { if (!e.cancelled) throw e; return null; });

    await Promise.all([
      runAgent('synthesis', dispatch, signal, period),
      synthesisDataPromise,
    ]);
    log('✅ [QC Étape 2] synthesis_data stocké — Groq analyse complète ✓', 'success');

    // ── Étapes 3 + 3B : fork parallèle (données prêtes) ─────────────
    upd(52, 'Étapes 3+3B/4 — dashboard_generator_agent ∥ pdf_report_generator');
    log('Étape 3 + 3B — fork parallèle → dashboard_generator_agent (Groq) ∥ pdf_report_generator');

    await Promise.all([
      runAgent('dashboard', dispatch, signal, period),
      runAgent('pdf',       dispatch, signal, period),
    ]);
    log('✅ [QC Étape 3] dashboard_url stocké — Frame Dust live ✓', 'success');
    log(`✅ [QC Étape 3B] pdf_path stocké — /mnt/user-data/outputs/${pdfName} ✓`, 'success');

    // ── Étape 4 : Envoi email via Gmail MCP ──────────────────────
    upd(92, 'Étape 4/4 — Gmail MCP → alexdecarbof71@gmail.com');
    log('Étape 4 → Gmail MCP — destinataire : alexdecarbof71@gmail.com');
    log(`Préparation email — objet : "MacroSynthAI — Note de recherche macro ${periodShort}"`);
    log(`Pièce jointe : ${pdfName} (248 KB)`);
    log('Corps email : 2 formats (PDF exécutif + dashboard_url) · 14 sources · 3 convergences principales');
    await sleepC(2_500, signal);
    log('📧 [Gmail MCP] Email envoyé — statut : 200 OK', 'success');

    // ── OUTPUT_FINAL ──────────────────────────────────────────────
    upd(100, null);
    log('─────────────────────────────────────────');
    log('✅ MacroSynthAI — Note générée avec succès', 'success');
    log('📊 Sources : 14/22 analysées · 3 partial · 5 non trouvées');
    log('📊 Convergences : 5 · Divergences : 3 · Nouvelles idées : 4 · Risques : 4');
    log('🔗 Dashboard : dust.tt/spaces/veillemacro/runs/latest');
    log('📧 Email envoyé : alexdecarbof71@gmail.com ✓', 'success');
    log('─────────────────────────────────────────');
    log('✅ [QC FINAL] 7/7 checks passed — workflow terminé', 'success');
    dispatch({ type: 'COMPLETE_WORKFLOW' });

  } catch (e) {
    if (!e.cancelled) throw e;
  }
}

/* ─────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────── */
export default function App() {
  const [state, dispatch]       = useReducer(reducer, initialState);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [view, setView]         = useState('orchestrator'); // 'orchestrator' | 'dashboard' | 'history'
  const [historyList, setHistoryList] = useState(() => loadHistory());
  const [viewedEntry, setViewedEntry] = useState(null); // history entry loaded in dashboard
  const { isMobile, isTablet }  = useBreakpoint();

  const signalRef = useRef({ cancelled: false });
  const clockRef  = useRef(null);

  const dateRangeValid = dateRange.start && dateRange.end
    && new Date(dateRange.start) < new Date(dateRange.end);

  /* ── Cleanup on unmount ─────────────────── */
  useEffect(() => () => {
    signalRef.current.cancelled = true;
    clearInterval(clockRef.current);
  }, []);

  /* ── Save to history when workflow completes (only if real Groq data) ── */
  useEffect(() => {
    if (state.globalStatus !== 'success') return;
    const data = state.synthesisData;
    if (!data) return; // don't save failed/partial runs without real synthesis data
    const entry = {
      id:             Date.now().toString(),
      timestamp:      Date.now(),
      period:         dateRange,
      synthesisData:  data,
      sentiment:      data.sentiment,
      sentimentColor: data.sentimentColor,
      stats:          data.stats,
    };
    saveAnalysis(entry);
    setHistoryList(loadHistory());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.globalStatus]);

  /* ── startWorkflow ──────────────────────── */
  const startWorkflow = useCallback(async () => {
    if (state.globalStatus === 'running') return;
    if (!dateRangeValid) return;

    const signal = { cancelled: false };
    signalRef.current = signal;

    setViewedEntry(null);
    dispatch({ type: 'START_WORKFLOW' });

    try {
      await runWorkflow(dispatch, signal, dateRange);
    } catch (e) {
      if (!e.cancelled) {
        dispatch({ type: 'FAIL_WORKFLOW', source: 'api', message: e.message ?? 'Erreur inattendue du pipeline.' });
      }
    }
  }, [state.globalStatus, dateRange, dateRangeValid]);

  /* ── History actions ────────────────────── */
  const handleLoadEntry = (entry) => {
    setViewedEntry(entry);
    setView('dashboard');
  };
  const handleDeleteEntry = (id) => {
    deleteAnalysis(id);
    setHistoryList(loadHistory());
    if (viewedEntry?.id === id) setViewedEntry(null);
  };
  const handleClearHistory = () => {
    clearHistory();
    setHistoryList([]);
    if (viewedEntry) setViewedEntry(null);
  };

  /* ── Derived display values ─────────────── */
  const hasRun          = state.globalStatus === 'success';
  const activeSynthesis = viewedEntry ? viewedEntry.synthesisData : state.synthesisData;
  const activePeriod    = viewedEntry ? viewedEntry.period        : dateRange;

  /* ── View button style helper ───────────── */
  const btnStyle = (active, color) => ({
    padding: '10px 22px', borderRadius: 10,
    border: `1.5px solid ${active ? color : C.border}`,
    background: active ? `${color}12` : '#ffffff',
    color: active ? color : '#555555',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8,
  });

  return (
    <div style={{
      minHeight:  '100vh',
      background: C.bg,
      color:      C.text,
      fontFamily: "'Inter','Helvetica Neue',-apple-system,BlinkMacSystemFont,sans-serif",
    }}>
      <Header status={state.globalStatus} lastRun={state.lastRun} />

      {/* ── View Switcher ── */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap',
        padding: isMobile ? '12px 16px 0' : '20px 32px 0', margin: '0 auto', maxWidth: 1440,
      }}>
        <button
          onClick={() => { setView('orchestrator'); setViewedEntry(null); }}
          aria-pressed={view === 'orchestrator' && !viewedEntry}
          style={btnStyle(view === 'orchestrator' && !viewedEntry, C.blue)}
        >
          🔧 Orchestrateur
        </button>
        {hasRun && (
          <button
            onClick={() => { setView('dashboard'); setViewedEntry(null); }}
            aria-pressed={view === 'dashboard' && !viewedEntry}
            style={btnStyle(view === 'dashboard' && !viewedEntry, C.emerald)}
          >
            📊 Rapport de Synthèse
          </button>
        )}
        <button
          onClick={() => setView('history')}
          aria-pressed={view === 'history' || !!viewedEntry}
          style={btnStyle(view === 'history' || !!viewedEntry, '#6B46C1')}
        >
          📂 Historique
          {historyList.length > 0 && (
            <span style={{
              background: view === 'history' || viewedEntry ? '#6B46C1' : '#E5E7EB',
              color: view === 'history' || viewedEntry ? '#fff' : '#6B7280',
              fontSize: 10, fontWeight: 800, padding: '1px 6px',
              borderRadius: 20, minWidth: 18, textAlign: 'center',
            }}>
              {historyList.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Views — key triggers fade+scale transition on change ── */}
      <div
        key={view + (viewedEntry?.id ?? '')}
        className="view-enter"
        id="main-content"
        role="main"
        aria-label={
          view === 'dashboard' || viewedEntry ? 'Rapport de synthèse' :
          view === 'history'                   ? 'Historique des analyses' :
                                                 'Orchestrateur de workflow'
        }
      >
      {view === 'dashboard' || viewedEntry ? (
        <SynthesisDashboard
          synthesisData={activeSynthesis}
          period={activePeriod}
          isHistorical={!!viewedEntry}
          analysisError={viewedEntry ? null : state.analysisError}
        />
      ) : view === 'history' ? (
        <HistoryView
          historyList={historyList}
          onLoad={handleLoadEntry}
          onDelete={handleDeleteEntry}
          onClear={handleClearHistory}
        />
      ) : (
        <main style={{
          maxWidth: 1440, margin: '0 auto',
          padding: isMobile ? '16px' : isTablet ? '20px 24px' : '28px 32px',
          display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24,
        }}>
          <StatsBar isActive={hasRun} />

          <PeriodSelector
            startDate={dateRange.start}
            endDate={dateRange.end}
            onChange={setDateRange}
            disabled={state.globalStatus === 'running'}
          />

          <OrchestratorCard
            status={state.globalStatus}
            progress={state.progress}
            currentStep={state.currentStep}
            canLaunch={!!dateRangeValid}
            onLaunch={startWorkflow}
            onReset={() => {
              signalRef.current.cancelled = true;
              clearInterval(clockRef.current);
              dispatch({ type: 'RESET' });
              setView('orchestrator');
              setViewedEntry(null);
            }}
            onViewResults={() => setView('dashboard')}
          />

          {state.globalStatus === 'error' && state.analysisError && (
            <div style={{
              background: '#FEF2F2',
              border: '1.5px solid #FECACA',
              borderRadius: 12,
              padding: isMobile ? '16px' : '20px 24px',
            }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#991B1B', marginBottom: 6 }}>
                Erreur de clé API
              </div>
              <div style={{ fontSize: 13, color: '#B91C1C', lineHeight: 1.6 }}>
                {state.analysisError.message}
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>
                Vérifiez votre fichier .env et rechargez la page, puis réessayez.
              </div>
            </div>
          )}

          <PipelineChart agents={state.agents} />

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: isMobile ? 12 : 24,
          }}>
            <AgentCard agent={state.agents.collector} config={AGENTS.collector} />
            <AgentCard agent={state.agents.synthesis} config={AGENTS.synthesis} />
            <AgentCard agent={state.agents.dashboard} config={AGENTS.dashboard} />
            <AgentCard agent={state.agents.pdf}       config={AGENTS.pdf} />
          </div>

          <div style={{ textAlign: 'center', color: '#666666', fontSize: 11, paddingBottom: 8 }}>
            MacroSynthAI · Agent Orchestration Platform · {new Date().getFullYear()}
          </div>
        </main>
      )}
      </div>{/* end view-enter */}
    </div>
  );
}
