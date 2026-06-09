import React, { useState } from 'react';
import { PdfReportModal } from './PdfReportModal.jsx';
import { useBreakpoint } from '../hooks/useBreakpoint.js';

/* ── Fallback data (used when Groq key absent or call failed) ─────── */
const FALLBACK = {
  sentiment:      'RISK-OFF STRUCTUREL',
  sentimentColor: 'red',
  summary:
    "L'analyse croisée des 14 publications stratégiques révèle une dégradation marquée du sentiment macro global. Le consensus converge vers une prudence extrême sur les actions US (8/14 analystes Bear), face à un S&P 500 valorisé à 22× les bénéfices forward — soit une prime de 35% vs la médiane historique. Les marchés internationaux (EAFE/EM) bénéficient d'un regain d'intérêt relatif (6 stratégistes Bull), portés par la décote structurelle et la rotation géographique. La géopolitique (Chine/Taiwan, Moyen-Orient) reste le principal catalyseur de risque tail, avec un pétrole jugé structurellement sous-évalué par Andurand.",
  stats: { sourcesAnalyzed: 14, convergences: 5, divergences: 3, newIdeas: 4, risks: 4 },
  convergences: [
    {
      theme:      'Valorisations US — S&P 500 (22× Fwd P/E)',
      consensus:  'Bear',
      score:      '8/14',
      authors:    ['Marks', 'Edwards', 'Asness', 'Cembalest', 'Roubini', 'Summers', 'El-Erian', 'Trahan'],
      implication: 'Réduire exposition large cap US — rotation défensive (XLV, XLU) et géographique (EAFE)',
    },
    {
      theme:      'Actions Internationales EAFE/EM — décote relative',
      consensus:  'Bull',
      score:      '6/14',
      authors:    ['Timmer', 'Asness', 'Papic', 'El-Erian', 'Saravelos', 'Trahan'],
      implication: 'Surpondérer Europe value et EM hors Chine (Inde, ASEAN, Brésil)',
    },
    {
      theme:      'Risque Géopolitique Chine/Taiwan — sous-estimé',
      consensus:  'Risk-Off',
      score:      '5/14',
      authors:    ['Cembalest', 'Papic', 'Saravelos', 'El-Erian', 'Andurand'],
      implication: 'Couverture via pétrole physique, or, et longs USD safe-haven (CHF, JPY)',
    },
    {
      theme:      'IA / Hyperscalers Mag7 — prudence sur la valorisation',
      consensus:  'Neutre',
      score:      '4/14',
      authors:    ['Cembalest', 'Mauboussin', 'Timmer', 'Marks'],
      implication: 'Pivoter vers infra IA (data centers, énergie, utilities) vs exposition directe Mag7',
    },
    {
      theme:      'Politique Fed — resserrement prolongé sous-estimé',
      consensus:  'Critique',
      score:      '3/14',
      authors:    ['Summers', 'El-Erian', 'Roubini'],
      implication: 'Duration courte, TIPS, attention aux taux longs (T10 risque > 5,5%)',
    },
  ],
  divergences: [
    {
      theme:     'Crédit High Yield',
      posA:      'Opportuniste — spreads HY attractifs à 350bp, Bull sélectif sur BB',
      authorsA:  ['Marks (Oaktree)'],
      posB:      'Ice Age intact — compression spreads insoutenable, Bear structurel sur le segment',
      authorsB:  ['Edwards (SG)'],
      arbitrage: 'Arbitrage CIO : sélectivité maximale — surpondérer IG, éviter HY CCC et B-',
    },
    {
      theme:     'Récession USA 2026',
      posA:      'Soft landing confirmé — pas de récession, atterrissage en douceur H2 2026',
      authorsA:  ['Timmer (Fidelity)', 'Papic (BCA)'],
      posB:      'Probabilité récession 60%+ — leading indicators (PMI, LEI) retournement Q3',
      authorsB:  ['Roubini (PS)', 'Summers (Harvard)'],
      arbitrage: 'Arbitrage CIO : réduire beta — surpondérer défensives (XLP, XLV, XLU) vs cycliques',
    },
    {
      theme:     'Dollar US (DXY)',
      posA:      'USD résilience structurelle sous-estimée — différentiel taux favorable au dollar',
      authorsA:  ['El-Erian (Bloomberg)'],
      posB:      'USD faiblesse inévitable — twin deficits + réduction réserves mondiales USD',
      authorsB:  ['Saravelos (DB)'],
      arbitrage: 'Arbitrage CIO : diversification devises — EUR, JPY, CHF, or physique en couverture',
    },
  ],
  ideas: [
    {
      title:      'Bitcoin — couverture dépréciation monétaire long terme',
      author:     'Jurrien Timmer',
      firm:       'Fidelity',
      rationale:  'Cycle 4 ans bull confirmé par les métriques on-chain (MVRV, NVT). BTC comme hedge contre le débasement du dollar US à long terme — allocation satellite institutionnelle de 1-3% recommandée, avec rééquilibrage trimestriel.',
      conviction: 'Élevée',
      assetClass: 'Crypto / Alternatives',
    },
    {
      title:      'Power Infrastructure — proxy IA supérieur aux Magnificent 7',
      author:     'Michael Cembalest',
      firm:       'JPM EOTM',
      rationale:  "Data centers, réseaux électriques et équipementiers énergétiques captent la croissance IA sans la valorisation excessive des Mag7 (P/E moyen 35×). Le ratio risque/rendement sur 18-24 mois est nettement supérieur via des utilities comme Vistra ou Constellation Energy.",
      conviction: 'Élevée',
      assetClass: 'Actions Thématiques (Infra IA)',
    },
    {
      title:      'Value Europe — décote historique vs US Growth',
      author:     'Cliff Asness',
      firm:       'AQR Capital',
      rationale:  "Le spread Value/Growth en Europe est au plus haut depuis 20 ans (z-score +2,3). La mean reversion est statistiquement inévitable sur 3-5 ans. Les small/mid caps européennes (MSCI Europe Small Cap) offrent le meilleur point d'entrée avec un P/B de 1,2× vs 4,1× pour le S&P 500.",
      conviction: 'Élevée',
      assetClass: 'Actions Europe (Value / Small Cap)',
    },
    {
      title:      'Géopolitique = opportunité — Inde, Brésil, ASEAN',
      author:     'Marko Papic',
      firm:       'BCA Research',
      rationale:  "Les flux de délocalisation industrielle (friend-shoring, China+1) créent des opportunités structurelles dans les EM hors Chine. L'Inde (Nifty 50 à 18× Fwd P/E) et l'ASEAN bénéficient directement de l'inflexion des chaînes d'approvisionnement mondiales post-Covid.",
      conviction: 'Moyenne',
      assetClass: 'Actions Marchés Émergents',
    },
  ],
  catalysts: [
    { type: 'Positif', title: 'Pivot Fed surprise',        body: "Toute inflexion dovish non anticipée (baisse > 25bp) pourrait déclencher un rally violent sur les actifs risqués — particulièrement actions tech et crédit HY." },
    { type: 'Positif', title: 'Désescalade géopolitique',  body: "Un accord de cessez-le-feu Moyen-Orient ou réduction des tensions Chine/Taiwan réduirait la prime de risque et soutiendrait une revalorisation des actifs risqués." },
    { type: 'Négatif', title: 'Déception earnings Mag7',   body: "Un ou plusieurs résultats décevants sur la monétisation IA (Nvidia, Microsoft, Alphabet) déclencherait une correction rapide du marché avec contagion indice." },
    { type: 'Négatif', title: 'Crise dette souveraine US', body: "Montée des spreads ou dégradation note → fuite vers qualité, hausse brutale taux longs, stress systémique sur le refinancement corporate 2026-2027." },
  ],
  risks: [
    {
      risk:     'Concentration Mag7 — déception sur la monétisation IA',
      severity: 'Élevé',
      authors:  ['Cembalest', 'Mauboussin', 'Timmer', 'Asness', 'Edwards'],
      count:    5,
      impact:   'Correction 25-35% sur méga-caps tech → contagion S&P500 (-15 à -20%) via effet de concentration (30% du S&P 500)',
    },
    {
      risk:     'Déficit fiscal US — spirale dette / taux longs',
      severity: 'Élevé',
      authors:  ['Cembalest', 'Summers', 'Roubini', 'Buffett'],
      count:    4,
      impact:   'Hausse T10 > 5,5% → compression des multiples actions (-3 à -4 pts P/E), stress immobilier commercial, refinancement corporate difficile',
    },
    {
      risk:     'Récession consommation US — H2 2026',
      severity: 'Moyen',
      authors:  ['Roubini', 'Summers', 'Trahan'],
      count:    3,
      impact:   'Retournement du crédit consommateur + hausse chômage → earnings S&P désappointent de -10 à -15% vs consensus actuel',
    },
    {
      risk:     'Escalade Chine/Taiwan — choc supply chains semiconducteurs',
      severity: 'Moyen',
      authors:  ['Cembalest', 'Papic', 'El-Erian'],
      count:    3,
      impact:   'Disruption semis → inflation réimportée (+2-3% CPI), fuite massive des risk assets, VIX > 40, USD safe-haven spike',
    },
  ],
  analysts: [
    { name: 'Jurrien Timmer',    firm: 'Fidelity',            sentiment: 'Neutre',   keyTakeaway: "Broadening out essentiel pour valider le bull case — S&P 500 ne peut pas continuer à monter sur 5 titres uniquement",                             actionsUS: 'Neutre', actionsIntl: 'Bull',   oblig: 'Neutre', credit: 'Neutre', matieres: 'Bull',   crypto: 'Bull' },
    { name: 'Michael Cembalest', firm: 'JPM EOTM',            sentiment: 'Bearish',  keyTakeaway: "La soutenabilité de la dette US est le risque systémique majeur des 24 prochains mois — déficit à 7% du PIB insoutenable",                        actionsUS: 'Bear',   actionsIntl: 'Neutre', oblig: 'Neutre', credit: 'Bear',   matieres: 'Bull',   crypto: 'Neutre' },
    { name: 'Marko Papic',       firm: 'BCA Research',        sentiment: 'Neutre',   keyTakeaway: "La géopolitique génère plus d'opportunités que de risques pour les EM Inde/ASEAN/Brésil — inflexion supply chains structurelle",                    actionsUS: 'Neutre', actionsIntl: 'Bull',   oblig: 'Neutre', credit: 'Neutre', matieres: 'Bull',   crypto: 'Neutre' },
    { name: 'Howard Marks',      firm: 'Oaktree Capital',     sentiment: 'Prudent',  keyTakeaway: "Moment idéal pour le positionnement défensif — quality first, éviter d'être le dernier acheteur en fin de cycle",                                   actionsUS: 'Bear',   actionsIntl: 'Neutre', oblig: 'Bull',   credit: 'Bull',   matieres: 'Neutre', crypto: 'Neutre' },
    { name: 'Albert Edwards',    firm: 'Société Générale',    sentiment: 'Bearish',  keyTakeaway: "Ice Age intact — les rendements obligataires actuels (T10 à 4,8%) rendent les actions US non compétitives sur le plan de la valorisation relative", actionsUS: 'Bear',   actionsIntl: 'Neutre', oblig: 'Bull',   credit: 'Bear',   matieres: 'Neutre', crypto: 'Neutre' },
    { name: 'Cliff Asness',      firm: 'AQR Capital',         sentiment: 'Bearish',  keyTakeaway: "Value toujours cheap en Europe vs US Growth — spread z-score +2,3 criant, mean reversion statiquement imminente sur 3 ans",                        actionsUS: 'Bear',   actionsIntl: 'Bull',   oblig: 'Neutre', credit: 'Neutre', matieres: 'Neutre', crypto: 'Neutre' },
    { name: 'George Saravelos',  firm: 'Deutsche Bank',       sentiment: 'Prudent',  keyTakeaway: "USD faiblesse structurelle inévitable — twin deficits + réduction réserves mondiales USD pointent vers EUR/USD 1,15+ sur 12 mois",                  actionsUS: 'Neutre', actionsIntl: 'Bull',   oblig: 'Neutre', credit: 'Neutre', matieres: 'Neutre', crypto: 'Neutre' },
    { name: 'Larry Summers',     firm: 'Harvard / Bloomberg', sentiment: 'Bearish',  keyTakeaway: "La Fed est structurellement trop laxiste — l'inflation sticky va forcer un resserrement prolongé surprise, sans pivot en 2026",                      actionsUS: 'Bear',   actionsIntl: 'Neutre', oblig: 'Bear',   credit: 'Bear',   matieres: 'Neutre', crypto: 'Neutre' },
    { name: 'Mohamed El-Erian',  firm: 'Bloomberg / Allianz', sentiment: 'Prudent',  keyTakeaway: "Les banques centrales sont prises au piège stagflationniste — leur crédibilité est en jeu sur les 12 prochains mois",                               actionsUS: 'Neutre', actionsIntl: 'Bull',   oblig: 'Neutre', credit: 'Neutre', matieres: 'Neutre', crypto: 'Neutre' },
    { name: 'Nouriel Roubini',   firm: 'Project Syndicate',   sentiment: 'Bearish',  keyTakeaway: "Triple menace : stagflation persistante + escalade géopolitique + bombe à retardement de la dette US — récession 2026 à 65%",                      actionsUS: 'Bear',   actionsIntl: 'Neutre', oblig: 'Bear',   credit: 'Bear',   matieres: 'Bull',   crypto: 'Bear' },
    { name: 'Warren Buffett',    firm: 'Berkshire Hathaway',  sentiment: 'Prudent',  keyTakeaway: "Position cash record chez BRK ($189Md) — les valorisations actuelles ne justifient plus le risque pris, patience requise",                          actionsUS: 'Neutre', actionsIntl: 'Neutre', oblig: 'Bull',   credit: 'Neutre', matieres: 'Neutre', crypto: 'Neutre' },
    { name: 'Michael Mauboussin',firm: 'Morgan Stanley',      sentiment: 'Neutre',   keyTakeaway: "ROIC à long terme > P/E à court terme — focus sur la qualité des franchises économiques, pas sur la hausse des multiples",                          actionsUS: 'Neutre', actionsIntl: 'Neutre', oblig: 'Neutre', credit: 'Neutre', matieres: 'Neutre', crypto: 'Neutre' },
    { name: 'François Trahan',   firm: 'BMO Capital',         sentiment: 'Bearish',  keyTakeaway: "Les leading indicators (PMI composite, LEI) signalent un ralentissement marqué H2 2026 — réduire le beta du portefeuille maintenant",              actionsUS: 'Bear',   actionsIntl: 'Neutre', oblig: 'Bull',   credit: 'Bear',   matieres: 'Neutre', crypto: 'Neutre' },
    { name: 'Pierre Andurand',   firm: 'Andurand Capital',    sentiment: 'Neutre',   keyTakeaway: "Le pétrole est structurellement sous-évalué à $82/bbl — le risque géopolitique Moyen-Orient est massif et sous-estimé par le consensus",            actionsUS: 'Neutre', actionsIntl: 'Neutre', oblig: 'Neutre', credit: 'Neutre', matieres: 'Bull',   crypto: 'Neutre' },
  ],
  matrix: [
    { theme: 'Actions US (S&P/Nasdaq)',          Timmer: 'Neutre', Cembalest: 'Bear',   Papic: 'Neutre', Marks: 'Bear',   Edwards: 'Bear',   Asness: 'Bear',   Saravelos: 'Neutre', Summers: 'Bear',   ElErian: 'Neutre', Roubini: 'Bear',   Buffett: 'Neutre', Mauboussin: 'Neutre', Trahan: 'Bear',   Andurand: 'Neutre', consensus: 'Bear' },
    { theme: 'Actions Intl EAFE/EM',             Timmer: 'Bull',   Cembalest: 'Neutre', Papic: 'Bull',   Marks: 'Neutre', Edwards: 'Neutre', Asness: 'Bull',   Saravelos: 'Bull',   Summers: 'Neutre', ElErian: 'Bull',   Roubini: 'Neutre', Buffett: 'Neutre', Mauboussin: 'Neutre', Trahan: 'Neutre', Andurand: 'Neutre', consensus: 'Bull' },
    { theme: 'Obligations IG',                   Timmer: 'Neutre', Cembalest: 'Neutre', Papic: 'Neutre', Marks: 'Bull',   Edwards: 'Bull',   Asness: 'Neutre', Saravelos: 'Neutre', Summers: 'Bear',   ElErian: 'Neutre', Roubini: 'Bear',   Buffett: 'Bull',   Mauboussin: 'Neutre', Trahan: 'Bull',   Andurand: 'Neutre', consensus: 'Neutre' },
    { theme: 'Crédit High Yield',                Timmer: 'Neutre', Cembalest: 'Bear',   Papic: 'Neutre', Marks: 'Bull',   Edwards: 'Bear',   Asness: 'Neutre', Saravelos: 'Neutre', Summers: 'Bear',   ElErian: 'Neutre', Roubini: 'Bear',   Buffett: 'Neutre', Mauboussin: 'Neutre', Trahan: 'Bear',   Andurand: 'Neutre', consensus: 'Bear' },
    { theme: 'Matières Premières (Pétrole/Or)',  Timmer: 'Bull',   Cembalest: 'Bull',   Papic: 'Bull',   Marks: 'Neutre', Edwards: 'Neutre', Asness: 'Neutre', Saravelos: 'Neutre', Summers: 'Neutre', ElErian: 'Neutre', Roubini: 'Bull',   Buffett: 'Neutre', Mauboussin: 'Neutre', Trahan: 'Neutre', Andurand: 'Bull',   consensus: 'Bull' },
    { theme: 'Crypto (Bitcoin)',                  Timmer: 'Bull',   Cembalest: 'Neutre', Papic: 'Neutre', Marks: 'Neutre', Edwards: 'Neutre', Asness: 'Neutre', Saravelos: 'Neutre', Summers: 'Neutre', ElErian: 'Neutre', Roubini: 'Bear',   Buffett: 'Neutre', Mauboussin: 'Neutre', Trahan: 'Neutre', Andurand: 'Neutre', consensus: 'Neutre' },
  ],
};

/* ── Micro-components ─────────────────────────────────────────────── */

function Stance({ v }) {
  const cfg = {
    Bull:       { bg: '#DCFCE7', color: '#15803D', label: '▲ Bull' },
    Bear:       { bg: '#FEE2E2', color: '#DC2626', label: '▼ Bear' },
    Neutre:     { bg: '#F3F4F6', color: '#6B7280', label: '— Ntr'  },
    'Risk-Off': { bg: '#FEF3C7', color: '#D97706', label: '⬇ Risk' },
    Critique:   { bg: '#FEF3C7', color: '#D97706', label: '⚠ Crit' },
  };
  const c = cfg[v] || cfg.Neutre;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 7px', borderRadius: 4,
      fontSize: 10, fontWeight: 700, background: c.bg, color: c.color,
      whiteSpace: 'nowrap', fontFamily: "'Monaco','Courier New',monospace",
    }}>
      {c.label}
    </span>
  );
}

function SentimentBadge({ v }) {
  const cfg = {
    Bullish:  { bg: '#DCFCE7', color: '#15803D' },
    Bearish:  { bg: '#FEE2E2', color: '#DC2626' },
    Neutre:   { bg: '#F3F4F6', color: '#6B7280' },
    Prudent:  { bg: '#FEF3C7', color: '#D97706' },
    Critique: { bg: '#FEF3C7', color: '#D97706' },
  };
  const c = cfg[v] || cfg.Neutre;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color }}>
      {v}
    </span>
  );
}

function SeverityBadge({ v }) {
  const cfg = {
    'Élevé': { bg: '#FEE2E2', color: '#DC2626', icon: '🔴' },
    'Moyen':  { bg: '#FEF3C7', color: '#D97706', icon: '🟠' },
    'Faible': { bg: '#DCFCE7', color: '#15803D', icon: '🟡' },
  };
  const c = cfg[v] || cfg['Moyen'];
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color }}>
      {c.icon} {v}
    </span>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24, ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: '#111827' }}>
      {children}
    </h3>
  );
}

/* ── Tab: Vue d'ensemble ──────────────────────────────────────────── */
function OverviewTab({ data, period, bp }) {
  const { isMobile, isTablet } = bp;
  const startLabel = period?.start ? new Date(period.start).toLocaleDateString('fr-FR') : '—';
  const endLabel   = period?.end   ? new Date(period.end).toLocaleDateString('fr-FR')   : '—';
  const sentBg     = data.sentimentColor === 'red' ? '#FEF2F2' : data.sentimentColor === 'green' ? '#ECFDF5' : '#FFFBEB';
  const sentColor  = data.sentimentColor === 'red' ? '#991B1B' : data.sentimentColor === 'green' ? '#065F46' : '#92400E';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 16 }}>
        {[
          { label: 'Sentiment Global', value: data.sentiment, sub: `${startLabel} → ${endLabel}`, bg: sentBg, color: sentColor, big: true },
          { label: 'Sources Analysées', value: `${data.stats.sourcesAnalyzed}/22`, sub: 'Publications institutionnelles', bg: '#DBEAFE', color: '#1D4ED8' },
          { label: 'Convergences', value: data.stats.convergences, sub: '≥ 3 auteurs alignés', bg: '#DCFCE7', color: '#059669' },
          { label: 'Risques Agrégés', value: data.stats.risks, sub: '≥ 2 auteurs par risque', bg: '#FEE2E2', color: '#DC2626' },
        ].map((k, i) => (
          <div key={i} style={{ background: k.bg, borderRadius: 12, padding: '18px 20px', border: `1px solid ${k.bg}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: k.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: k.big ? 13 : 28, fontWeight: 800, color: k.color, lineHeight: 1.1 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: k.color, opacity: 0.75, marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 14 : 24 }}>
        <Card>
          <SectionTitle>📋 Résumé Exécutif</SectionTitle>
          <p style={{ fontSize: 13, lineHeight: 1.8, color: '#374151', margin: 0 }}>{data.summary}</p>
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              `${data.stats.convergences} convergences`,
              `${data.stats.divergences} divergences`,
              `${data.stats.newIdeas} idées`,
              `${data.stats.risks} risques`,
            ].map(t => (
              <span key={t} style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', background: '#F3F4F6', padding: '3px 10px', borderRadius: 20 }}>{t}</span>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>⚖️ Convergences Majeures</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.convergences.slice(0, 4).map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#F9FAFB', padding: '10px 14px', borderRadius: 8, gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{c.theme}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3, lineHeight: 1.4 }}>{c.implication}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <Stance v={c.consensus} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap' }}>{c.score}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle>⚠️ Risques Principaux</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
          {data.risks.map((r, i) => (
            <div key={i} style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <SeverityBadge v={r.severity} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{r.risk}</span>
              </div>
              <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.55 }}>{r.impact}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
                {r.count} analystes : {r.authors.join(' · ')}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── Tab: Scores Consensus ────────────────────────────────────────── */
function ScoresTab({ data, bp }) {
  const { isMobile } = bp;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle>
          📊 Scores de Consensus par Thème
          <span style={{ fontSize: 11, fontWeight: 400, color: '#6B7280', marginLeft: 10 }}>
            Score = analystes alignés / 14 sources
          </span>
        </SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {data.convergences.map((c, i) => {
            const num = parseInt(c.score.split('/')[0]);
            const pct = Math.round((num / 14) * 100);
            const barColor =
              c.consensus === 'Bull'     ? '#059669' :
              c.consensus === 'Bear'     ? '#DC2626' :
              c.consensus === 'Risk-Off' ? '#D97706' : '#6B7280';
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{c.theme}</span>
                    <Stance v={c.consensus} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{c.authors.join(' · ')}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: barColor, fontFamily: 'monospace' }}>{c.score}</span>
                  </div>
                </div>
                <div style={{ height: 10, background: '#F3F4F6', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 100 }} />
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6, fontStyle: 'italic' }}>→ {c.implication}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <SectionTitle>🎯 Consensus par Classe d'Actif</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 10 }}>
          {data.matrix.map((row, i) => (
            <div key={i} style={{ background: '#F9FAFB', borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{row.theme}</span>
              <Stance v={row.consensus} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── Tab: Convergences & Divergences ─────────────────────────────── */
function ConvergencesTab({ data }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <SectionTitle>✅ Convergences Stratégiques ({data.convergences.length})</SectionTitle>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['THÈME', 'CONSENSUS', 'SCORE', 'AUTEURS ALIGNÉS', 'IMPLICATION PORTEFEUILLE'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.convergences.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: '#111827', maxWidth: 220 }}>{c.theme}</td>
                  <td style={{ padding: '14px 16px' }}><Stance v={c.consensus} /></td>
                  <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 800, color: '#059669', whiteSpace: 'nowrap' }}>{c.score}</td>
                  <td style={{ padding: '14px 16px', fontSize: 11, color: '#6B7280' }}>{c.authors.join(' · ')}</td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: '#374151', fontStyle: 'italic' }}>{c.implication}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <SectionTitle>⚡ Divergences Notables ({data.divergences.length})</SectionTitle>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['THÈME', 'POSITION A (HAUSSIÈRE)', 'AUTEUR(S)', 'POSITION B (BAISSIÈRE)', 'AUTEUR(S)', 'ARBITRAGE CIO'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.divergences.map((d, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: '#111827', minWidth: 130 }}>{d.theme}</td>
                  <td style={{ padding: '14px 16px', fontSize: 12, background: '#F0FDF4', color: '#065F46', minWidth: 240 }}>{d.posA}</td>
                  <td style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: '#059669', whiteSpace: 'nowrap' }}>{d.authorsA.join(', ')}</td>
                  <td style={{ padding: '14px 16px', fontSize: 12, background: '#FEF2F2', color: '#991B1B', minWidth: 240 }}>{d.posB}</td>
                  <td style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: '#DC2626', whiteSpace: 'nowrap' }}>{d.authorsB.join(', ')}</td>
                  <td style={{ padding: '14px 16px', fontSize: 12, background: '#FFFBEB', color: '#92400E', fontWeight: 600, minWidth: 200 }}>{d.arbitrage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Tab: Idées & CIO Matrix ──────────────────────────────────────── */
const MATRIX_ANALYSTS = ['Timmer', 'Cembalest', 'Papic', 'Marks', 'Edwards', 'Asness', 'Saravelos', 'Summers', 'ElErian', 'Roubini', 'Buffett', 'Mauboussin', 'Trahan', 'Andurand'];

function IdeasTab({ data, bp }) {
  const { isMobile } = bp;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <SectionTitle>💡 Idées d'Investissement Contre-Intuitives</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          {data.ideas.map((idea, i) => (
            <Card key={i} style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#E5E7EB', fontFamily: 'monospace', lineHeight: 1 }}>0{i + 1}</div>
                <span style={{
                  padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                  background: idea.conviction === 'Élevée' ? '#DCFCE7' : '#FEF3C7',
                  color:      idea.conviction === 'Élevée' ? '#15803D' : '#D97706',
                  whiteSpace: 'nowrap',
                }}>
                  {idea.conviction === 'Élevée' ? '★★★ ÉLEVÉE' : '★★ MOYENNE'}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 8, lineHeight: 1.3 }}>{idea.title}</div>
              <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.7, marginBottom: 12 }}>{idea.rationale}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F3F4F6', paddingTop: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', background: '#F3F4F6', padding: '3px 10px', borderRadius: 20 }}>
                  {idea.assetClass}
                </span>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                  <strong style={{ color: '#374151' }}>{idea.author}</strong> · {idea.firm}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>
          🗺️ CIO Positioning Matrix
          <span style={{ fontSize: 11, fontWeight: 400, color: '#6B7280', marginLeft: 10 }}>6 classes × 14 analystes</span>
        </SectionTitle>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#374151', position: 'sticky', left: 0, background: '#F9FAFB', zIndex: 1, whiteSpace: 'nowrap', minWidth: 200, borderRight: '1px solid #E5E7EB' }}>
                  CLASSE D'ACTIF
                </th>
                {MATRIX_ANALYSTS.map(a => (
                  <th key={a} style={{ padding: '10px 8px', fontSize: 10, fontWeight: 700, color: '#6B7280', whiteSpace: 'nowrap', textAlign: 'center', minWidth: 68 }}>{a}</th>
                ))}
                <th style={{ padding: '10px 10px', fontSize: 10, fontWeight: 700, color: '#374151', textAlign: 'center', minWidth: 80, borderLeft: '2px solid #E5E7EB', background: '#F9FAFB' }}>
                  CONSENSUS
                </th>
              </tr>
            </thead>
            <tbody>
              {data.matrix.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#374151', position: 'sticky', left: 0, background: '#fff', zIndex: 1, whiteSpace: 'nowrap', borderRight: '1px solid #E5E7EB' }}>
                    {row.theme}
                  </td>
                  {MATRIX_ANALYSTS.map(a => (
                    <td key={a} style={{ padding: '8px', textAlign: 'center' }}>
                      <Stance v={row[a] || 'Neutre'} />
                    </td>
                  ))}
                  <td style={{ padding: '8px 10px', textAlign: 'center', borderLeft: '2px solid #E5E7EB', background: '#FAFAFA' }}>
                    <Stance v={row.consensus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>
          ▲ Bull = surpondérer &nbsp;·&nbsp; ▼ Bear = sous-pondérer &nbsp;·&nbsp; — Ntr = pondération neutre
        </div>
      </div>
    </div>
  );
}

/* ── Tab: Risques & Catalyseurs ───────────────────────────────────── */
function RisksTab({ data, bp }) {
  const { isMobile } = bp;
  const catalysts = data.catalysts || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <SectionTitle>🚨 Risques Agrégés (triés par sévérité)</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {data.risks.map((r, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20,
              borderLeft: `4px solid ${r.severity === 'Élevé' ? '#DC2626' : '#D97706'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <SeverityBadge v={r.severity} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{r.risk}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, background: '#F3F4F6', color: '#374151', padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  {r.count} auteurs
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.65, marginBottom: 8 }}>{r.impact}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{r.authors.join(' · ')}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>🔮 Catalyseurs Potentiels</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 14 }}>
          {catalysts.map((cat, i) => (
            <div key={i} style={{
              background: cat.type === 'Positif' ? '#F0FDF4' : '#FEF2F2',
              border:     `1px solid ${cat.type === 'Positif' ? '#BBF7D0' : '#FEE2E2'}`,
              borderRadius: 10, padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: cat.type === 'Positif' ? '#15803D' : '#DC2626' }}>
                  {cat.type === 'Positif' ? '⬆' : '⬇'} {cat.type}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{cat.title}</span>
              </div>
              <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>{cat.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Tab: Tableau Analystes ───────────────────────────────────────── */
const POSITION_COLS = [
  { key: 'actionsUS',   label: 'Acti. US'   },
  { key: 'actionsIntl', label: 'Acti. Intl' },
  { key: 'oblig',       label: 'Oblig IG'   },
  { key: 'credit',      label: 'Crédit HY'  },
  { key: 'matieres',    label: 'Mat. Prem.' },
  { key: 'crypto',      label: 'Crypto'     },
];

function AnalystsTab({ data }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
        <thead>
          <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6B7280', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#F9FAFB', zIndex: 1, borderRight: '1px solid #E5E7EB', minWidth: 180 }}>ANALYSTE</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6B7280', whiteSpace: 'nowrap' }}>FIRME</th>
            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#6B7280', whiteSpace: 'nowrap' }}>SENTIMENT</th>
            {POSITION_COLS.map(c => (
              <th key={c.key} style={{ padding: '12px 10px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#6B7280', whiteSpace: 'nowrap' }}>{c.label}</th>
            ))}
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6B7280', borderLeft: '1px solid #E5E7EB' }}>POINT CLÉ</th>
          </tr>
        </thead>
        <tbody>
          {data.analysts.map((a, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#fff', zIndex: 1, borderRight: '1px solid #E5E7EB' }}>{a.name}</td>
              <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>{a.firm}</td>
              <td style={{ padding: '12px 16px', textAlign: 'center' }}><SentimentBadge v={a.sentiment} /></td>
              {POSITION_COLS.map(c => (
                <td key={c.key} style={{ padding: '10px 8px', textAlign: 'center' }}>
                  <Stance v={a[c.key] || 'Neutre'} />
                </td>
              ))}
              <td style={{ padding: '12px 16px', fontSize: 12, color: '#374151', lineHeight: 1.55, minWidth: 260, borderLeft: '1px solid #F3F4F6' }}>{a.keyTakeaway}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Error screen ────────────────────────────────────────────────── */
function AnalysisErrorScreen({ error }) {
  const sourceLabel = error.source === 'groq'
    ? 'Groq API — Génération de la synthèse'
    : 'Tavily Search API — Collecte des publications';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '65vh', padding: '40px 24px',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, maxWidth: 480, width: '100%',
        textAlign: 'center', padding: '52px 48px',
        border: '1px solid #fca5a5', borderTop: '4px solid #dc2626',
        boxShadow: '0 8px 32px rgba(220,38,38,0.08)',
      }}>
        <div style={{ fontSize: 44, marginBottom: 20 }}>⚠️</div>

        <h2 style={{
          fontSize: 22, fontWeight: 800, color: '#111827',
          margin: '0 0 12px', letterSpacing: '-0.02em',
        }}>
          Erreur d'analyse
        </h2>

        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.75, margin: '0 0 28px' }}>
          Le pipeline MacroSynthAI a rencontré une erreur et ne peut pas générer le rapport.
          Les données ne sont pas disponibles.
        </p>

        <div style={{
          background: '#fef2f2', borderRadius: 8, padding: '14px 16px',
          marginBottom: 32, textAlign: 'left',
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: '#991b1b',
            textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
          }}>
            Détail technique
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', marginBottom: 4 }}>
            {sourceLabel}
          </div>
          <div style={{
            fontSize: 11, color: '#7f1d1d', fontFamily: "'Monaco','Courier New',monospace",
            wordBreak: 'break-all', lineHeight: 1.6,
          }}>
            {error.message}
          </div>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#1d4ed8', color: '#fff',
          padding: '12px 26px', borderRadius: 10,
          fontSize: 13, fontWeight: 700,
        }}>
          📧 Contacter le développeur
        </div>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────── */
const TABS = [
  { id: 'overview',  label: "Vue d'ensemble",             icon: '📋' },
  { id: 'scores',    label: 'Scores Consensus',           icon: '📊' },
  { id: 'matrix',    label: 'Convergences & Divergences', icon: '⚖️'  },
  { id: 'ideas',     label: 'Idées & CIO Matrix',         icon: '💡' },
  { id: 'risks',     label: 'Risques & Catalyseurs',      icon: '⚠️'  },
  { id: 'analysts',  label: 'Tableau Analystes (14)',     icon: '👥' },
];

export function SynthesisDashboard({ synthesisData, period, isHistorical, analysisError }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPdf, setShowPdf]     = useState(false);
  const bp                        = useBreakpoint();
  const { isMobile }              = bp;

  // Show error screen if a key failed and no data is available
  if (analysisError && !synthesisData) {
    return (
      <div style={{ background: '#F9FAFB', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <AnalysisErrorScreen error={analysisError} />
      </div>
    );
  }

  const data = synthesisData || FALLBACK;

  const startLabel = period?.start ? new Date(period.start).toLocaleDateString('fr-FR') : '—';
  const endLabel   = period?.end   ? new Date(period.end).toLocaleDateString('fr-FR')   : '—';
  const sentColor  = data.sentimentColor === 'red' ? '#991B1B' : data.sentimentColor === 'green' ? '#065F46' : '#92400E';
  const sentBg     = data.sentimentColor === 'red' ? '#FEF2F2' : data.sentimentColor === 'green' ? '#ECFDF5' : '#FFFBEB';

  return (
    <div style={{ background: '#F9FAFB', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#111827' }}>
      {/* ── Header ── */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E5E7EB',
        padding: isMobile ? '14px 16px' : '18px 32px',
        display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? 12 : 0,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 16 : 21, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            MacroSynthAI — <span style={{ color: '#6B7280', fontWeight: 500 }}>Note CIO</span>
          </h1>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4, flexWrap: 'wrap' }}>
            <strong style={{ color: '#111827' }}>{startLabel} → {endLabel}</strong>
            {!isMobile && <>&nbsp;·&nbsp; {data.stats.sourcesAnalyzed} sources</>}
            {synthesisData && (
              <span style={{ marginLeft: 6, fontSize: 10, color: '#059669', fontWeight: 700, background: '#DCFCE7', padding: '1px 6px', borderRadius: 4 }}>
                ✓ Groq
              </span>
            )}
            {isHistorical && (
              <span style={{ marginLeft: 4, fontSize: 10, color: '#D97706', fontWeight: 700, background: '#FEF3C7', padding: '1px 6px', borderRadius: 4 }}>
                ⏮ Historique
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowPdf(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: isMobile ? '7px 12px' : '8px 16px', borderRadius: 8, cursor: 'pointer',
              background: synthesisData ? '#1d4ed8' : '#f3f4f6',
              color:      synthesisData ? '#ffffff' : '#6b7280',
              border:     synthesisData ? 'none' : '1.5px solid #e5e7eb',
              fontSize: isMobile ? 12 : 13, fontWeight: 700, transition: 'all 0.2s',
            }}
          >
            📄 {isMobile ? 'PDF' : 'Rapport PDF'}
            {!synthesisData && (
              <span style={{ fontSize: 9, fontWeight: 600, color: '#d97706', background: '#fef3c7', padding: '1px 5px', borderRadius: 3 }}>
                Groq
              </span>
            )}
          </button>

          <div style={{ background: sentBg, padding: isMobile ? '6px 12px' : '8px 18px', borderRadius: 8, textAlign: 'right' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: sentColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sentiment</div>
            <div style={{ fontSize: isMobile ? 12 : 15, fontWeight: 800, color: sentColor }}>{data.sentiment}</div>
          </div>
        </div>
      </div>

      {showPdf && (
        <PdfReportModal
          data={data}
          period={period}
          isGroqData={!!synthesisData}
          onClose={() => setShowPdf(false)}
        />
      )}

      {/* ── Tab navigation ── */}
      <div className="tabs-scroll" style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: isMobile ? '0 8px' : '0 32px', display: 'flex', gap: 2 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: isMobile ? '12px 10px' : '14px 16px', border: 'none', background: 'none',
              fontSize: isMobile ? 11 : 13, fontWeight: 600, cursor: 'pointer',
              color:       activeTab === tab.id ? '#111827' : '#6B7280',
              borderBottom: `2px solid ${activeTab === tab.id ? '#111827' : 'transparent'}`,
              whiteSpace:  'nowrap', transition: 'color 0.15s',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ padding: isMobile ? '16px' : '32px' }}>
        {activeTab === 'overview' && <OverviewTab data={data} period={period} bp={bp} />}
        {activeTab === 'scores'   && <ScoresTab   data={data} bp={bp} />}
        {activeTab === 'matrix'   && <ConvergencesTab data={data} />}
        {activeTab === 'ideas'    && <IdeasTab    data={data} bp={bp} />}
        {activeTab === 'risks'    && <RisksTab    data={data} bp={bp} />}
        {activeTab === 'analysts' && <AnalystsTab data={data} />}
      </div>
    </div>
  );
}
