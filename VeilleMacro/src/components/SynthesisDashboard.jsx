import React, { useState } from 'react';
import { 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb, 
  MessageSquare,
  Users,
  BarChart3,
  FileText,
  Search
} from 'lucide-react';
import { C } from '../constants.js';

/**
 * SynthesisDashboard({ data, period })
 * 
 * Replication of the Dust.tt CIO Research Dashboard.
 * Includes multiple tabs: Vue d'ensemble, Scores, Matrix, etc.
 */
export function SynthesisDashboard({ state, period }) {
  const [activeTab, setActiveTab] = useState('overview');

  const startLabel = period?.start ? new Date(period.start).toLocaleDateString('fr-FR') : '—';
  const endLabel   = period?.end ? new Date(period.end).toLocaleDateString('fr-FR') : '—';

  const TABS = [
    { id: 'overview', label: "Vue d'ensemble", icon: <Search size={14} /> },
    { id: 'scores',   label: "Scores Consensus", icon: <BarChart3 size={14} /> },
    { id: 'matrix',   label: "Convergences & Divergences", icon: <Users size={14} /> },
    { id: 'ideas',    label: "Idées & CIO Matrix", icon: <Lightbulb size={14} /> },
    { id: 'risks',    label: "Risques & Catalyseurs", icon: <AlertTriangle size={14} /> },
    { id: 'analysts', label: "Tableau Analystes", icon: <FileText size={14} /> },
  ];

  return (
    <div style={{
      background: '#F9FAFB',
      minHeight: '100vh',
      fontFamily: "'Inter', sans-serif",
      color: '#111827'
    }}>
      {/* ── Top Header ── */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #E5E7EB',
        padding: '20px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            MacroSynthAI — <span style={{ color: '#6B7280', fontWeight: 500 }}>Note de Recherche CIO</span>
          </h1>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: 500 }}>
            Période analysée : <span style={{ color: '#111827', fontWeight: 600 }}>{startLabel} au {endLabel}</span>
          </div>
        </div>

        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FEE2E2',
          padding: '8px 16px',
          borderRadius: 8,
          textAlign: 'right'
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Sentiment Global
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#991B1B' }}>
            RISK-OFF STRUCTUREL
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #E5E7EB',
        padding: '0 32px',
        display: 'flex',
        gap: 24
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '16px 4px',
              border: 'none',
              background: 'none',
              fontSize: 13,
              fontWeight: 600,
              color: activeTab === tab.id ? '#111827' : '#6B7280',
              borderBottom: `2px solid ${activeTab === tab.id ? '#111827' : 'transparent'}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content Area ── */}
      <div style={{ padding: '32px' }}>
        {activeTab === 'overview' && <OverviewTab synthText={state?.text} />}
        {activeTab === 'matrix' && <MatrixTab />}
        {activeTab === 'analysts' && <AnalystsTab />}
        {/* Other tabs would be implemented similarly */}
        {['scores', 'ideas', 'risks'].includes(activeTab) && (
          <div style={{ textAlign: 'center', padding: '64px', color: '#6B7280' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🚧</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Section en cours de génération...</div>
            <p>Les données sont en cours de structuration pour cet onglet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENTS (TABS)
   ───────────────────────────────────────────────────────────────────────────── */

function OverviewTab({ synthText }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Real orchestrator output */}
      {synthText && (
        <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            🎯 Réponse MacroSynthAI Orchestrator
          </h3>
          <div style={{
            fontSize: 13, lineHeight: 1.75, color: '#374151',
            whiteSpace: 'pre-wrap', maxHeight: 480, overflowY: 'auto',
            background: '#F9FAFB', padding: 16, borderRadius: 8,
          }}>
            {synthText}
          </div>
        </div>
      )}

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingDown size={18} color="#DC2626" /> Résumé Exécutif
        </h3>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: '#374151' }}>
          L'analyse croisée des 14 publications stratégiques révèle une dégradation marquée du sentiment macro. 
          Le consensus converge vers une prudence extrême sur les actions US (8/11 analystes) face à des valorisations 
          historiquement tendues et un essoufflement de la dynamique IA. La géopolitique reste le principal catalyseur de risque.
        </p>
      </div>

      <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={18} color="#2563EB" /> Convergences Majeures
        </h3>
        <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { t: 'Actions US', d: 'Sur-valorisation généralisée (Consensus Bear)', s: '8/11' },
            { t: 'Matières Premières', d: 'Bullish Pétrole via risques supply-chain', s: '6/11' },
            { t: 'Crédit HY', d: 'Spread compression jugée insoutenable', s: '5/11' }
          ].map((item, i) => (
            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB', padding: '10px 14px', borderRadius: 8 }}>
              <div style={{ fontSize: 13 }}>
                <span style={{ fontWeight: 700 }}>{item.t}</span> — {item.d}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 4 }}>
                SCORE {item.s}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
    </div>
  );
}

function MatrixTab() {
  const themes = [
    { 
      t: 'VALORISATIONS US', 
      posA: 'S&P500 à 25x Fwd P/E est justifié par la croissance IA.', 
      autA: 'Timmer · Mauboussin', 
      posB: 'Niveau d\'exubérance comparable à 1929/2000.', 
      autB: 'Grantham · Marks · Asness', 
      arb: 'Poids neutre : Prudence sur les méga-caps.' 
    },
    { 
      t: 'INFLATION / FED', 
      posA: 'Soft landing confirmé, retour à 2% imminent.', 
      autA: 'Timmer · Papic', 
      posB: 'Inflation "sticky" forçant des taux plus hauts.', 
      autB: 'Summers · Roubini · El-Erian', 
      arb: 'Prudence : Taux longs risquent de rester élevés.' 
    },
    { 
      t: 'GÉOPOLITIQUE', 
      posA: 'Risques intégrés dans les prix actuels.', 
      autA: 'Ackman', 
      posB: 'Le risque de choc pétrolier est sous-estimé.', 
      autB: 'Cembalest · Andurand', 
      arb: 'Bull Pétrole : Couverture indispensable.' 
    }
  ];

  return (
    <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
            {['THÈME', 'POSITION A (BULL/POSITIF)', 'AUTEUR(S)', 'POSITION B (BEAR/NÉGATIF)', 'AUTEUR(S)', 'ARBITRAGE CIO'].map(h => (
              <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {themes.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #E5E7EB' }}>
              <td style={{ padding: '16px', fontSize: 12, fontWeight: 700, width: 140 }}>{row.t}</td>
              <td style={{ padding: '16px', fontSize: 13, background: '#ECFDF5', color: '#065F46', width: 280 }}>{row.posA}</td>
              <td style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#059669', textAlign: 'center' }}>{row.autA}</td>
              <td style={{ padding: '16px', fontSize: 13, background: '#FEF2F2', color: '#991B1B', width: 280 }}>{row.posB}</td>
              <td style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#DC2626', textAlign: 'center' }}>{row.autB}</td>
              <td style={{ padding: '16px', fontSize: 13, background: '#FFFBEB', color: '#92400E', fontWeight: 600 }}>{row.arb}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AnalystsTab() {
  const analysts = [
    { name: 'Jurrien Timmer', firm: 'Fidelity', sent: 'Neutre', key: 'Broadening out essential for bull case' },
    { name: 'Michael Cembalest', firm: 'JPM EOTM', sent: 'Bearish', key: 'US Debt sustainability is the major risk' },
    { name: 'Jeremy Grantham', firm: 'GMO', sent: 'Bearish', key: 'Super-bubble territory confirmed' },
    { name: 'Howard Marks', firm: 'Oaktree', sent: 'Prudent', key: 'Time for defensive positioning' },
    { name: 'Albert Edwards', firm: 'Société Générale', sent: 'Bearish', key: 'Equity yields too low vs bonds' },
    { name: 'Mohamed El-Erian', firm: 'Allianz/Bloomberg', sent: 'Prudent', key: 'Central banks trapped by sticky inflation' }
  ];

  return (
    <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
            {['ANALYSTE', 'FIRME / SOURCE', 'SENTIMENT', 'POINTS CLÉS'].map(h => (
              <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6B7280' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {analysts.map((a, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #E5E7EB' }}>
              <td style={{ padding: '16px', fontSize: 14, fontWeight: 700 }}>{a.name}</td>
              <td style={{ padding: '16px', fontSize: 13, color: '#6B7280' }}>{a.firm}</td>
              <td style={{ padding: '16px' }}>
                <span style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: a.sent === 'Bearish' ? '#FEE2E2' : a.sent === 'Neutre' ? '#F3F4F6' : '#FEF3C7',
                  color: a.sent === 'Bearish' ? '#DC2626' : a.sent === 'Neutre' ? '#4B5563' : '#D97706'
                }}>{a.sent}</span>
              </td>
              <td style={{ padding: '16px', fontSize: 13 }}>{a.key}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
