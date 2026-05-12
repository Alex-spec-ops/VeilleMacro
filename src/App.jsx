import React, { useReducer, useEffect, useRef, useCallback, useState } from 'react';

import { Header }           from './components/Header.jsx';
import { OrchestratorCard } from './components/OrchestratorCard.jsx';
import { AgentCard }        from './components/AgentCard.jsx';
import { ExecutionLog }     from './components/ExecutionLog.jsx';
import { StatsBar }         from './components/StatsBar.jsx';
import { PeriodSelector }   from './components/PeriodSelector.jsx';

import { C }                        from './constants.js';
import { inferLogType, sleep }      from './utils.js';
import { callGemini }               from './gemini.js';

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

  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

  try {
    if (geminiKey && def.geminiPrompt) {
      // ── Mode ① : Gemini API ────────────────────────────────────
      log('🤖 Gemini API (gemini-2.0-flash) — generating execution trace…', 'info');

      let responseText;
      try {
        responseText = await callGemini(def.geminiPrompt, signal);
      } catch (apiErr) {
        if (apiErr.cancelled) throw apiErr;            // propagate reset
        log(`⚠️ Gemini API error: ${apiErr.message} — falling back to simulation`, 'warning');
        responseText = null;
      }

      if (responseText) {
        // Stream each response line with a small delay for readability
        const lines = responseText.split('\n').map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
          if (signal.cancelled) return;
          log(line, inferLogType(line));
          await sleepC(150, signal);
        }
      } else {
        // Fallback within Gemini mode: run simulation
        await runSimulation(def, dispatch, signal);
      }

    } else {
      // ── Mode ② : Simulation ────────────────────────────────────
      await runSimulation(def, dispatch, signal);
    }

  } finally {
    clearInterval(durationInterval);
  }

  // ── Success ──────────────────────────────────────────────────
  const finalDuration = Date.now() - t0;
  dispatch({ type: 'UPDATE_AGENT', agent: agentId, status: 'success', duration: finalDuration });
  log(def.doneMsg, inferLogType(def.doneMsg));
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
    log(`Étape 1 → appel macro_research_collector — période : ${periodStr}`);
    await runAgent('collector', dispatch, signal, period);
    log('✅ [QC Étape 1] research_data stocké — 14 sources analysées ≥ 2 ✓', 'success');

    // ── Étape 2 : Synthèse comparative ───────────────────────────
    upd(32, 'Étape 2/4 — comparative_synthesis_agent');
    log('Étape 2 → appel comparative_synthesis_agent — input : research_data (14 sources)…');
    await runAgent('synthesis', dispatch, signal, period);
    log('✅ [QC Étape 2] synthesis_data stocké — 5 convergences ✓ · 4 nouvelles idées ✓', 'success');

    // ── Étapes 3 + 3B : fork parallèle ───────────────────────────
    upd(52, 'Étapes 3+3B/4 — dashboard_generator_agent ∥ pdf_report_generator');
    log('Étape 3 + 3B — fork parallèle → dashboard_generator_agent ∥ pdf_report_generator');
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
  const [state, dispatch] = useReducer(reducer, initialState);
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  const signalRef = useRef({ cancelled: false });
  const clockRef  = useRef(null);

  const dateRangeValid = dateRange.start && dateRange.end
    && new Date(dateRange.start) < new Date(dateRange.end);

  /* ── Cleanup on unmount ─────────────────── */
  useEffect(() => () => {
    signalRef.current.cancelled = true;
    clearInterval(clockRef.current);
  }, []);

  /* ── startWorkflow ──────────────────────── */
  const startWorkflow = useCallback(async () => {
    if (state.globalStatus === 'running') return;
    if (!dateRangeValid) return;

    const signal = { cancelled: false };
    signalRef.current = signal;
    clockRef.current  = setInterval(() => {}, 100);

    dispatch({ type: 'START_WORKFLOW' });
    await runWorkflow(dispatch, signal, dateRange);

    clearInterval(clockRef.current);
  }, [state.globalStatus, dateRange, dateRangeValid]);

  const hasRun = state.globalStatus === 'success';

  return (
    <div
      style={{
        minHeight:  '100vh',
        background: C.bg,
        color:      C.text,
        fontFamily: "'Inter','Helvetica Neue',-apple-system,BlinkMacSystemFont,sans-serif",
      }}
    >
      <Header status={state.globalStatus} lastRun={state.lastRun} />

      <main
        style={{
          maxWidth:      1440,
          margin:        '0 auto',
          padding:       '28px 32px',
          display:       'flex',
          flexDirection: 'column',
          gap:           24,
        }}
      >
        {/* ── Stats Bar ── */}
        <StatsBar isActive={hasRun} />

        {/* ── Period Selector ── */}
        <PeriodSelector
          startDate={dateRange.start}
          endDate={dateRange.end}
          onChange={setDateRange}
          disabled={state.globalStatus === 'running'}
        />

        {/* ── Orchestrator ── */}
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
          }}
        />

        {/* ── Agent cards — 3-col grid, 4th wraps to next row ── */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap:                 24,
          }}
        >
          <AgentCard agent={state.agents.collector} config={AGENTS.collector} />
          <AgentCard agent={state.agents.synthesis} config={AGENTS.synthesis} />
          <AgentCard agent={state.agents.dashboard} config={AGENTS.dashboard} />
          <AgentCard agent={state.agents.pdf}       config={AGENTS.pdf} />
        </div>

        {/* ── Execution Log ── */}
        <ExecutionLog logs={state.logs} />

        {/* ── Footer ── */}
        <div
          style={{
            textAlign:   'center',
            color:       '#666666',
            fontSize:    11,
            paddingBottom: 8,
          }}
        >
          MacroSynthAI · Agent Orchestration Platform · {new Date().getFullYear()}
        </div>
      </main>
    </div>
  );
}
