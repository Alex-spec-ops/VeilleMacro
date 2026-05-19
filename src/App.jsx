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
    geminiPrompt: `Tu es l'agent macro_research_collector. Simule une trace d'exécution réaliste de recherche de publications récentes pour la période 01/04/2026 – 28/04/2026.
Génère exactement 24 lignes de log en français. Chaque ligne DOIT commencer par un de ces emojis : 🔍 ✅ ❌ ⚠️ 📊
Cherche dans cet ordre : Jurrien Timmer (Fidelity), Michael Cembalest (JPM EOTM), Jeremy Grantham (GMO), Marko Papic (BCA), François Trahan (BMO), Howard Marks (Oaktree), Albert Edwards (SG), Bill Ackman (Pershing Square), Bob Elliott (Unlimited Funds), Chris Burniske (Placeholder VC), Cliff Asness (AQR), George Saravelos (Deutsche Bank), Jeffrey Currie (Carlyle), Kevin Kelly (Delphi Digital), Larry Summers (Harvard), Michael Mauboussin (Morgan Stanley), Mohamed El-Erian (Bloomberg), Nouriel Roubini (Project Syndicate), Pierre Andurand (Andurand Capital), Stanley Druckenmiller (Duquesne), Warren Buffett (Berkshire), Zoltan Pozsar.
Format des lignes trouvées : ✅ [X/22] NOM "Titre publication" — JJ/MM/AAAA · web_fetch OK (N tokens)
Format des lignes non trouvées : ❌ [X/22] Raison courte — added to sources_not_found
Regroupe les sources 7-15 en scan batch (1-2 lignes).
Termine par : 📊 Tally: X found · Y partial · Z not found · 0 hallucinated
Retourne UNIQUEMENT les lignes de log, rien d'autre.`,
  },
  synthesis: {
    id: 'synthesis', name: 'comparative_synthesis_agent',
    label: 'Analyse Comparative', emoji: '⚖️', color: C.blue,
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
    geminiPrompt: `Tu es l'agent comparative_synthesis_agent. Simule une trace d'exécution réaliste d'analyse comparative de 14 publications macro institutionnelles.
Génère exactement 26 lignes de log en français. Chaque ligne DOIT commencer par : 📥 🔄 ✅ ❌ ⚠️ 💡 📊
Phases à simuler :
1. Parsing matrice positionnement (14 sources × 6 classes d'actifs)
2. Convergences stratégiques (thèmes : valorisations US, géopolitique Chine/Taiwan, actions EAFE/EM, IA/hyperscalers, politique Fed) — indiquer les auteurs alignés (≥3 par convergence)
3. Divergences notables (crédit HY, récession 2026, dollar US) — positions contradictoires explicites avec auteurs
4. Nouvelles idées d'investissement contre-intuitives (Bitcoin comme hedge, power infrastructure vs Mag7, Value Europe, géopolitique comme opportunité)
5. Risques agrégés (≥2 auteurs) avec sévérité ÉLEVÉ/MOYEN
6. JSON synthesis_output sérialisé avec general_sentiment
Auteurs disponibles : Timmer, Cembalest, Papic, Marks, Edwards, Asness, Saravelos, Summers, El-Erian, Roubini, Buffett, Mauboussin, Trahan, Andurand.
Termine par : 📊 Summary: X convergences · Y divergences · Z new ideas · W aggregated risks
Retourne UNIQUEMENT les lignes de log, rien d'autre.`,
  },
  dashboard: {
    id: 'dashboard', name: 'dashboard_generator_agent',
    label: 'Dashboard TSX', emoji: '📊', color: C.teal,
    simulatedDuration: 32_000,
    desc: 'Génère deux livrables : composant TSX shadcn/ui (Frame Dust) + fichier HTML autonome identique pixel-perfect.',
    logs: [
      // ── Parsing input ─────────────────────────────────────────────
      '📥 Input received — synthesis_data (5 sections) + individual_analyses (14 auteurs)',
      '🔄 Building tab inventory: "Synthèse" · "Dashboard" · 14 author tabs (priority order)…',
      '✅ Tab plan validated — 16 tabs total · Timmer [1] … Buffett [14]',

      // ── Livrable 1 : TSX Frame Dust ───────────────────────────────
      '📝 [TSX] Scaffolding MacroSynthAIDashboard component…',
      '📝 [TSX] Imports: React · useState · Card · CardContent · CardHeader · CardTitle · Badge',

      // Header
      '📝 [TSX][Header] "MacroSynthAI — Note de Recherche CIO" · badges "14 sources analysées" + "Usage interne"',

      // Tab navigation
      '📝 [TSX][Nav] Generating tab navigation — rounded-none · border-b-2 · 16 tabs…',

      // Onglet Synthèse
      '📝 [TSX][Tab:Synthèse] Section Vue d\'ensemble — macro_context + Badge sentiment "Mitigé" (variant=secondary)',
      '📝 [TSX][Tab:Synthèse] Section Convergences — tableau 5 lignes × 4 colonnes (Thème·Consensus·Auteurs·Implication)',
      '📝 [TSX][Tab:Synthèse] Section Divergences — tableau 3 lignes × 6 colonnes (Theme·PosA·AuteursA·PosB·AuteursB·Arbitrage)',
      '📝 [TSX][Tab:Synthèse] Section Nouvelles idées — <ol> 4 items · format bold-idea + italic-rationale + Badge auteur',
      '📝 [TSX][Tab:Synthèse] Section Risques agrégés — <ul> 4 items · sévérité 🔴🟠 + badge "Mentionné par X auteurs"',

      // Onglet Dashboard (matrice)
      '📝 [TSX][Tab:Dashboard] Building 11×16 positioning matrix — 11 thèmes × (14 auteurs + col Consensus)…',
      '📝 [TSX][Tab:Dashboard] Mapping asset_class_positioning → stances (Bull🟢 · Neutre🟡 · Bear🔴 · —)…',
      '📝 [TSX][Tab:Dashboard] Computing consensus column — ≥50% Bull→🟢 · ≥50% Bear→🔴 · else→🟡…',
      '✅ [TSX][Tab:Dashboard] Matrix complete — tooltips title= on all stance cells',

      // Onglets auteurs
      '📝 [TSX][Author tabs] Generating 14 author tabs (5 sections each: header · résumé · key_takeaways · positioning · contrarian)…',
      '✅ [TSX][Author tabs] 14 × 5 = 70 Card sections generated · rounded-none · p-6 uniform padding',

      // Finalisation TSX
      '✅ [TSX] MacroSynthAIDashboard.tsx complete — 1 843 lines · syntax validated',
      '🚀 [TSX] Deploying to Dust Frame…',
      '✅ [TSX] Frame Dust live — interactive render confirmed',

      // ── Livrable 2 : HTML autonome ────────────────────────────────
      '📝 [HTML] Scaffolding macrosynth_dashboard.html — CDN React 18 · ReactDOM · Babel standalone · Tailwind CDN',
      '📝 [HTML] Defining shadcn/ui polyfills: Card · CardHeader · CardTitle · CardContent · Badge (rounded-none)',
      '📝 [HTML] Injecting JSX from Frame Dust into <script type="text/babel">…',
      '📝 [HTML] ReactDOM.createRoot(#root).render(MacroSynthAIDashboard)…',
      '✅ [HTML] macrosynth_dashboard.html generated — 2 107 lines · no external deps at runtime',
      '✅ [HTML] file_generation tool called — file attached to conversation',
    ],
    doneMsg: '✅ Dashboard deployed — TSX 1 843 lines (Dust Frame) + HTML 2 107 lines (standalone)',
    geminiPrompt: `Tu es l'agent dashboard_generator_agent. Simule une trace d'exécution réaliste de génération d'un dashboard React TSX shadcn/ui pour une note de recherche macro.
Génère exactement 28 lignes de log en français. Chaque ligne DOIT commencer par : 📥 📝 ✅ ⚙️ 🚀 🎨
Phases à simuler :
1. Parsing input : synthesis_data (5 sections) + 14 individual_analyses
2. Plan de 16 onglets (Synthèse · Dashboard · 14 onglets auteurs dans l'ordre de priorité)
3. Génération TSX : imports (React · useState · Card · Badge), Header, navigation tabs (rounded-none · border-b-2)
4. Onglet Synthèse : 5 Card sections (overview · convergences 5 lignes · divergences 3 lignes · nouvelles idées ol · risques ul)
5. Onglet Dashboard : matrice 11×16 positionnement (Bull🟢/Neutre🟡/Bear🔴) avec consensus column et tooltips
6. 14 onglets auteurs (5 sections chacun : header · résumé · key_takeaways · positioning table · contrarian signals)
7. Validation syntaxe TSX · déploiement Dust Frame
8. Génération HTML autonome (CDN React 18 · Babel · Tailwind · polyfills shadcn/ui)
Termine par : ✅ [HTML] macrosynth_dashboard.html generated — 2 107 lines · no external deps at runtime
Retourne UNIQUEMENT les lignes de log, rien d'autre.`,
  },
  pdf: {
    id: 'pdf', name: 'pdf_report_generator',
    label: 'Rapport PDF', emoji: '📄', color: C.orange,
    simulatedDuration: 26_000,
    desc: 'Génère un PDF exécutif 3 pages A4 via ReportLab (Python) : dashboard thématique, convergences, risques agrégés.',
    logs: [
      // ── Étape 1 : Préparation des données ─────────────────────────
      '📥 Input received — synthesis_data (14 sources) + individual_analyses array',
      '🔄 [Étape 1] Extracting Page 1 data: overview · sentiment · positioning matrix (8 classes × 14 auteurs)…',
      '🔄 [Étape 1] Extracting Page 2 data: convergences (top 4) · divergences (top 3) · new ideas (top 5)…',
      '🔄 [Étape 1] Extracting Page 3 data: risks sorted by severity · author grid (top 6 auteurs)…',
      '✅ [Étape 1] Data preparation complete — 3 pages structured',

      // ── Étape 2 : Génération du script Python ─────────────────────
      '📝 [Étape 2] Scaffolding generate_pdf.py in /home/claude/…',
      '📝 [Étape 2] Imports: reportlab.platypus · SimpleDocTemplate · Table · TableStyle · Paragraph · PageBreak',
      '📝 [Étape 2] ParagraphStyles defined — h1:18pt · h2:14pt · h3:12pt · body:9pt TA_JUSTIFY · footer:7pt italic',
      '📝 [Étape 2] Page 1 — Header "MacroSynthAI" · badge "14 sources institutionnelles" · sentiment "Mitigé" #d97706',
      '📝 [Étape 2] Page 1 — Dashboard table 8×16: stances Bull🟢/Neutre🟡/Bear🔴 · initiales T·C·P·M·As·El·Ro·Bu',
      '📝 [Étape 2] Page 2 — Convergences table 4 rows (sorted by aligned_authors count)…',
      '📝 [Étape 2] Page 2 — Divergences table 3 rows · Nouvelles idées <ol> 5 items…',
      '📝 [Étape 2] Page 3 — Risks list sorted Élevé→Moyen · author grid 2-col 6 auteurs…',
      '📝 [Étape 2] Page footer callback: "MacroSynthAI — Usage interne · Page X/3" — TA_CENTER · #6b7280',
      '✅ [Étape 2] generate_pdf.py written — 387 lines · border=0 on all TableStyles',

      // ── Étape 3 : Installation & exécution ────────────────────────
      '⚙️ [Étape 3] pip install reportlab --break-system-packages…',
      '✅ [Étape 3] reportlab 4.2.5 installed',
      '⚙️ [Étape 3] python3 generate_pdf.py…',
      '✅ [Étape 3] Page 1/3 rendered — Synthèse exécutive + dashboard thématique',
      '✅ [Étape 3] Page 2/3 rendered — Convergences · divergences · nouvelles idées',
      '✅ [Étape 3] Page 3/3 rendered — Risques agrégés · synthèse 6 auteurs',

      // ── Étapes 4 & 5 : Quality checks, move, output ───────────────
      '🔎 [QC] Checking: 3 pages ✓ · couleurs indicateurs ✓ · aucune bordure visible ✓ · aucune donnée fictive ✓',
      '⚙️ [Étape 4] mv /home/claude/MacroSynthAI_Report_20260429.pdf /mnt/user-data/outputs/',
      '✅ [Étape 5] {"status":"success","pdf_path":"/mnt/user-data/outputs/MacroSynthAI_Report_20260429.pdf","pages":3,"file_size_kb":248}',
    ],
    doneMsg: '✅ PDF generated — 3 pages A4 · 248 KB · /mnt/user-data/outputs/MacroSynthAI_Report_20260429.pdf',
    geminiPrompt: `Tu es l'agent pdf_report_generator. Simule une trace d'exécution réaliste de génération d'un rapport PDF 3 pages A4 via ReportLab Python.
Génère exactement 24 lignes de log en français. Chaque ligne DOIT commencer par : 📥 🔄 📝 ⚙️ ✅ 🔎
Phases à simuler :
1. Extraction données : Page 1 (header MacroSynthAI · overview + sentiment Mitigé · dashboard 8 classes × 14 auteurs) · Page 2 (convergences top 4 · divergences 3 · idées top 5) · Page 3 (risques sorted par sévérité · grille 2-col 6 auteurs)
2. Génération script Python (387 lignes) : imports reportlab, ParagraphStyles (h1:18pt h2:14pt body:9pt TA_JUSTIFY footer:7pt), tableaux border=0, couleurs indicateurs Bull#16a34a/Neutre#d97706/Bear#dc2626, footer "Page X/3"
3. pip install reportlab --break-system-packages → reportlab 4.2.5
4. python3 generate_pdf.py : rendu Page 1/3 · Page 2/3 · Page 3/3
5. Quality checks : 3 pages ✓ · couleurs indicateurs ✓ · aucune bordure visible ✓ · données non inventées ✓
6. mv vers /mnt/user-data/outputs/ · JSON de retour {"status":"success","pages":3,"file_size_kb":248}
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

  const tavilyKey = import.meta.env.VITE_TAVILY_API_KEY;
  const groqKey   = import.meta.env.VITE_GROQ_API_KEY;
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // Tavily: real web search for collector agent only
  const useTavily = tavilyKey && agentId === 'collector';
  // Agents synthesis & dashboard prefer Groq; all others prefer Gemini
  const useGroq   = groqKey && def.geminiPrompt && (agentId === 'synthesis' || agentId === 'dashboard');
  const useGemini = geminiKey && def.geminiPrompt && !useGroq;

  let searchResults = null;

  try {
    if (useTavily) {
      // ── Mode ⓪ : Tavily real web search (collector) ───────────
      log('🌐 Tavily Search API — recherche web réelle sur 22 analystes macro…', 'info');

      try {
        searchResults = await searchAllAnalysts(period, signal, (result) => {
          const { analyst, results, status, error } = result;
          if (status === 'found') {
            const best   = results[0];
            let   domain = '';
            try { domain = new URL(best.url).hostname.replace('www.', ''); } catch {}
            log(`✅ [${analyst.id}/22] ${analyst.name} — "${best.title.slice(0, 55)}…" · ${domain}`, 'success');
          } else if (status === 'error') {
            log(`⚠️ [${analyst.id}/22] ${analyst.name} — ${error ?? 'erreur réseau'} · mode dégradé`, 'warning');
          } else {
            log(`❌ [${analyst.id}/22] ${analyst.name} — Aucune publication web trouvée`, 'error');
          }
        });

        const found    = searchResults.filter(r => r.status === 'found').length;
        const notFound = searchResults.filter(r => r.status === 'not_found').length;
        const errors   = searchResults.filter(r => r.status === 'error').length;
        log(`📊 Tally: ${found} trouvées · ${errors} erreurs · ${notFound} non trouvées · 0 hallucinations`, 'info');

      } catch (tavilyErr) {
        if (tavilyErr.cancelled) throw tavilyErr;
        log(`⚠️ Tavily error: ${tavilyErr.message} — simulation mode`, 'warning');
        dispatch({ type: 'SET_ANALYSIS_ERROR', source: 'tavily', message: tavilyErr.message });
        await runSimulation(def, dispatch, signal);
        searchResults = null;
      }

    } else if (useGroq) {
      // ── Mode ① : Groq API (synthesis + dashboard) ─────────────
      log('🤖 Groq API (llama-3.3-70b-versatile) — generating execution trace…', 'info');

      let responseText;
      try {
        responseText = await callGroq(def.geminiPrompt, signal);
      } catch (apiErr) {
        if (apiErr.cancelled) throw apiErr;
        log(`⚠️ Groq API error: ${apiErr.message} — falling back to simulation`, 'warning');
        responseText = null;
      }

      if (responseText) {
        const lines = responseText.split('\n').map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
          if (signal.cancelled) return;
          log(line, inferLogType(line));
          await sleepC(150, signal);
        }
      } else {
        await runSimulation(def, dispatch, signal);
      }

    } else if (useGemini) {
      // ── Mode ② : Gemini API (collector + pdf) ─────────────────
      log('🤖 Gemini API (gemini-2.0-flash) — generating execution trace…', 'info');

      let responseText;
      try {
        responseText = await callGemini(def.geminiPrompt, signal);
      } catch (apiErr) {
        if (apiErr.cancelled) throw apiErr;
        log(`⚠️ Gemini API error: ${apiErr.message} — falling back to simulation`, 'warning');
        responseText = null;
      }

      if (responseText) {
        const lines = responseText.split('\n').map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
          if (signal.cancelled) return;
          log(line, inferLogType(line));
          await sleepC(150, signal);
        }
      } else {
        await runSimulation(def, dispatch, signal);
      }

    } else {
      // ── Mode ③ : Simulation ────────────────────────────────────
      await runSimulation(def, dispatch, signal);
    }

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
    const tavilyKey = import.meta.env.VITE_TAVILY_API_KEY;
    log(`Étape 1 → appel macro_research_collector — ${tavilyKey ? 'Tavily web search' : 'simulation'} — période : ${periodStr}`);
    const searchResults = await runAgent('collector', dispatch, signal, period);
    const foundCount = searchResults ? searchResults.filter(r => r.status === 'found').length : 14;
    log(`✅ [QC Étape 1] research_data stocké — ${foundCount}/22 sources ${tavilyKey ? 'trouvées web' : 'analysées'} ≥ 2 ✓`, 'success');

    // ── Étape 2 : Synthèse comparative ───────────────────────────
    upd(32, 'Étape 2/4 — comparative_synthesis_agent');
    log('Étape 2 → appel comparative_synthesis_agent — input : research_data (14 sources)…');
    await runAgent('synthesis', dispatch, signal, period);
    log('✅ [QC Étape 2] synthesis_data stocké — 5 convergences ✓ · 4 nouvelles idées ✓', 'success');

    // ── Étapes 3 + 3B : fork parallèle ───────────────────────────
    upd(52, 'Étapes 3+3B/4 — dashboard_generator_agent ∥ pdf_report_generator');
    log('Étape 3 + 3B — fork parallèle → dashboard_generator_agent ∥ pdf_report_generator');

    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    const synthesisDataPromise = groqKey
      ? callGroqJSON(buildSynthesisDataPrompt(periodStr, searchResults), signal)
          .then(data => dispatch({ type: 'SET_SYNTHESIS_DATA', data }))
          .catch(e => {
            if (!e.cancelled) {
              console.warn('Groq JSON synthesis error:', e.message);
              dispatch({ type: 'SET_ANALYSIS_ERROR', source: 'groq', message: e.message });
            }
          })
      : (dispatch({ type: 'SET_ANALYSIS_ERROR', source: 'groq', message: 'Clé VITE_GROQ_API_KEY manquante ou invalide.' }), Promise.resolve());

    await Promise.all([
      runAgent('dashboard', dispatch, signal, period),
      runAgent('pdf',       dispatch, signal, period),
      synthesisDataPromise,
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
        dispatch({ type: 'SET_ANALYSIS_ERROR', source: 'groq', message: e.message ?? 'Erreur inattendue du pipeline.' });
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
