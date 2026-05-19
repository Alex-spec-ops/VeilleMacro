import React, { useRef } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint.js';

/* ── Analyst keys in matrix order ───────────────────────────────────── */
const ANALYST_KEYS = [
  'Timmer','Cembalest','Papic','Marks','Edwards','Asness',
  'Saravelos','Summers','ElErian','Roubini','Buffett','Mauboussin','Trahan','Andurand',
];

/* ── Stance color helpers ────────────────────────────────────────────── */
const STANCE = {
  Bull:   { bg: '#dcfce7', color: '#15803d', label: '▲ Bull'  },
  Bear:   { bg: '#fee2e2', color: '#dc2626', label: '▼ Bear'  },
  Neutre: { bg: '#f3f4f6', color: '#6b7280', label: '— Ntr'   },
};

function stanceStyle(v) {
  const s = STANCE[v] || STANCE.Neutre;
  return {
    display: 'inline-block', padding: '2px 6px', borderRadius: 3,
    fontSize: 9, fontWeight: 700, background: s.bg, color: s.color,
    fontFamily: 'monospace', whiteSpace: 'nowrap',
  };
}

/* ── Stacked horizontal bar ──────────────────────────────────────────── */
function StackedBar({ theme, bull, bear, neutre, consensus }) {
  const total = bull + bear + neutre || 1;
  const bullPct   = Math.round((bull   / total) * 100);
  const bearPct   = Math.round((bear   / total) * 100);
  const neutrePct = 100 - bullPct - bearPct;
  const consColor = consensus === 'Bull' ? '#16a34a' : consensus === 'Bear' ? '#dc2626' : '#6b7280';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div style={{ width: 190, fontSize: 10, fontWeight: 600, color: '#374151', flexShrink: 0 }}>{theme}</div>
      <div style={{ flex: 1, height: 16, display: 'flex', borderRadius: 3, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
        {bullPct > 0 && (
          <div style={{ width: `${bullPct}%`, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', fontWeight: 700 }}>{bull}</div>
        )}
        {neutrePct > 0 && (
          <div style={{ width: `${neutrePct}%`, background: '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#374151', fontWeight: 700 }}>{neutre}</div>
        )}
        {bearPct > 0 && (
          <div style={{ width: `${bearPct}%`, background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', fontWeight: 700 }}>{bear}</div>
        )}
      </div>
      <div style={{ width: 60, flexShrink: 0 }}>
        <span style={stanceStyle(consensus)}>{STANCE[consensus]?.label ?? '—'}</span>
      </div>
    </div>
  );
}

/* ── Score progress bar ──────────────────────────────────────────────── */
function ScoreBar({ theme, consensus, score }) {
  const [num, denom] = (score || '0/14').split('/').map(Number);
  const pct   = Math.round((num / (denom || 14)) * 100);
  const color = consensus === 'Bull' ? '#16a34a' : consensus === 'Bear' ? '#dc2626' : '#d97706';

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 10 }}>
        <span style={{ fontWeight: 600, color: '#111827' }}>{theme}</span>
        <span style={{ fontWeight: 800, color, fontFamily: 'monospace', fontSize: 11 }}>{score}</span>
      </div>
      <div style={{ height: 7, background: '#f3f4f6', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 100 }} />
      </div>
    </div>
  );
}

/* ── Severity badge ──────────────────────────────────────────────────── */
function Sev({ v }) {
  const c = v === 'Élevé' ? { bg: '#fee2e2', color: '#dc2626', icon: '🔴' }
                           : { bg: '#fef3c7', color: '#d97706', icon: '🟠' };
  return (
    <span style={{ padding: '2px 7px', borderRadius: 12, fontSize: 9, fontWeight: 700, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      {c.icon} {v}
    </span>
  );
}

/* ── Section heading ─────────────────────────────────────────────────── */
function SH({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
      color: '#1d4ed8', borderBottom: '2px solid #1d4ed8', paddingBottom: 4, marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

/* ── Table helpers ───────────────────────────────────────────────────── */
const TH = ({ children, style }) => (
  <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: 9, fontWeight: 700,
               color: '#6b7280', letterSpacing: '0.05em', background: '#f9fafb',
               borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', ...style }}>
    {children}
  </th>
);

const TD = ({ children, style }) => (
  <td style={{ padding: '6px 8px', fontSize: 10, color: '#374151',
               borderBottom: '1px solid #f3f4f6', verticalAlign: 'top', ...style }}>
    {children}
  </td>
);

/* ── Report content (the printable section) ──────────────────────────── */
function ReportContent({ data, period, isGroqData }) {
  const startLabel = period?.start ? new Date(period.start).toLocaleDateString('fr-FR') : '—';
  const endLabel   = period?.end   ? new Date(period.end).toLocaleDateString('fr-FR')   : '—';
  const sentColor  = data.sentimentColor === 'red' ? '#991b1b' : data.sentimentColor === 'green' ? '#065f46' : '#92400e';
  const sentBg     = data.sentimentColor === 'red' ? '#fef2f2' : data.sentimentColor === 'green' ? '#ecfdf5' : '#fffbeb';

  // Compute stacked bar data from matrix
  const chartData = (data.matrix || []).map(row => {
    const bull   = ANALYST_KEYS.filter(k => row[k] === 'Bull').length;
    const bear   = ANALYST_KEYS.filter(k => row[k] === 'Bear').length;
    const neutre = ANALYST_KEYS.length - bull - bear;
    return { theme: row.theme, bull, bear, neutre, consensus: row.consensus };
  });

  const page = (n) => ({
    background: '#ffffff',
    width: 794,
    minHeight: 1123,
    padding: '32px 36px',
    marginBottom: 24,
    boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
    borderRadius: 4,
    boxSizing: 'border-box',
    fontFamily: "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
    pageBreakAfter: n < 3 ? 'always' : 'auto',
  });

  const sectionBox = { marginBottom: 22 };

  /* ════════════════════ PAGE 1 ════════════════════ */
  return (
    <div style={{ fontFamily: "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif" }}>

      {/* ── Page 1 ── */}
      <div style={page(1)}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottom: '3px solid #1d4ed8' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>MacroSynthAI</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Note de Recherche CIO — Usage interne · Confidentiel</div>
            <div style={{ fontSize: 11, color: '#374151', marginTop: 6 }}>
              Période d'analyse : <strong>{startLabel} → {endLabel}</strong>
              &nbsp;·&nbsp; {data.stats?.sourcesAnalyzed ?? 14} sources institutionnelles
            </div>
          </div>
          <div style={{ background: sentBg, padding: '10px 18px', borderRadius: 8, textAlign: 'right', border: `1px solid ${sentColor}22` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: sentColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sentiment Global</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: sentColor, marginTop: 2 }}>{data.sentiment}</div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Sources',       value: `${data.stats?.sourcesAnalyzed ?? 14}/22`, bg: '#dbeafe', color: '#1d4ed8' },
            { label: 'Convergences',  value: data.stats?.convergences ?? 5,             bg: '#dcfce7', color: '#059669' },
            { label: 'Divergences',   value: data.stats?.divergences ?? 3,              bg: '#fef3c7', color: '#d97706' },
            { label: 'Risques',       value: data.stats?.risks ?? 4,                    bg: '#fee2e2', color: '#dc2626' },
          ].map((k, i) => (
            <div key={i} style={{ background: k.bg, borderRadius: 8, padding: '12px 14px', border: `1px solid ${k.color}22` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: k.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: k.color, lineHeight: 1.1, marginTop: 4 }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Résumé exécutif */}
        <div style={{ ...sectionBox }}>
          <SH>Résumé Exécutif</SH>
          <p style={{ fontSize: 11, lineHeight: 1.8, color: '#374151', margin: 0 }}>{data.summary}</p>
          {isGroqData && (
            <div style={{ marginTop: 8, fontSize: 9, color: '#059669', fontWeight: 700 }}>
              ✓ Analyse générée via Groq API (llama-3.3-70b-versatile)
            </div>
          )}
        </div>

        {/* Positioning Matrix */}
        <div style={sectionBox}>
          <SH>CIO Positioning Matrix — 6 Classes d'Actifs × 14 Analystes</SH>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 9 }}>
              <thead>
                <tr>
                  <TH style={{ minWidth: 150, position: 'sticky', left: 0, background: '#f9fafb' }}>CLASSE D'ACTIF</TH>
                  {ANALYST_KEYS.map(a => <TH key={a} style={{ textAlign: 'center', minWidth: 44 }}>{a.substring(0, 6)}</TH>)}
                  <TH style={{ textAlign: 'center', background: '#eff6ff', borderLeft: '2px solid #bfdbfe' }}>CONSO.</TH>
                </tr>
              </thead>
              <tbody>
                {(data.matrix || []).map((row, i) => (
                  <tr key={i}>
                    <TD style={{ fontWeight: 700, fontSize: 9, color: '#111827', background: '#fafafa', borderRight: '1px solid #e5e7eb' }}>{row.theme}</TD>
                    {ANALYST_KEYS.map(a => (
                      <td key={a} style={{ padding: '4px 3px', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                        <span style={stanceStyle(row[a] || 'Neutre')}>
                          {row[a] === 'Bull' ? '▲' : row[a] === 'Bear' ? '▼' : '—'}
                        </span>
                      </td>
                    ))}
                    <td style={{ padding: '4px 6px', textAlign: 'center', background: '#eff6ff', borderLeft: '2px solid #bfdbfe', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={stanceStyle(row.consensus)}>{STANCE[row.consensus]?.label ?? '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 8, color: '#9ca3af', marginTop: 6 }}>
            ▲ Bull = surpondérer &nbsp;·&nbsp; ▼ Bear = sous-pondérer &nbsp;·&nbsp; — Ntr = neutre
          </div>
        </div>

        {/* Page footer */}
        <div style={{ position: 'absolute', bottom: 28, left: 36, right: 36, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
          <span style={{ fontSize: 8, color: '#9ca3af' }}>MacroSynthAI — Usage interne · Confidentiel</span>
          <span style={{ fontSize: 8, color: '#9ca3af' }}>Page 1/3</span>
        </div>
      </div>

      {/* ════════════════════ PAGE 2 ════════════════════ */}
      <div style={{ ...page(2), position: 'relative' }}>

        {/* Chart: Bull/Bear/Neutre par classe */}
        <div style={{ ...sectionBox }}>
          <SH>Graphique — Répartition Bull / Neutre / Bear par Classe d'Actif</SH>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 9, alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, background: '#16a34a', borderRadius: 2, display: 'inline-block' }}></span> Bull</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, background: '#d1d5db', borderRadius: 2, display: 'inline-block' }}></span> Neutre</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, background: '#dc2626', borderRadius: 2, display: 'inline-block' }}></span> Bear</span>
            <span style={{ color: '#9ca3af' }}>(n = 14 analystes)</span>
          </div>
          {chartData.map((d, i) => (
            <StackedBar key={i} {...d} />
          ))}
        </div>

        {/* Convergences */}
        <div style={{ ...sectionBox }}>
          <SH>Convergences Stratégiques ({(data.convergences || []).length})</SH>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <TH style={{ width: '26%' }}>THÈME</TH>
                <TH>CONSENSUS</TH>
                <TH>SCORE</TH>
                <TH style={{ width: '28%' }}>AUTEURS ALIGNÉS</TH>
                <TH style={{ width: '28%' }}>IMPLICATION PORTEFEUILLE</TH>
              </tr>
            </thead>
            <tbody>
              {(data.convergences || []).map((c, i) => (
                <tr key={i}>
                  <TD style={{ fontWeight: 700, fontSize: 10, color: '#111827' }}>{c.theme}</TD>
                  <TD><span style={stanceStyle(c.consensus)}>{STANCE[c.consensus]?.label ?? c.consensus}</span></TD>
                  <TD style={{ fontWeight: 800, color: '#059669', fontFamily: 'monospace', fontSize: 11 }}>{c.score}</TD>
                  <TD style={{ fontSize: 9, color: '#6b7280' }}>{(c.authors || []).join(' · ')}</TD>
                  <TD style={{ fontSize: 9, color: '#374151', fontStyle: 'italic' }}>{c.implication}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Divergences */}
        <div style={{ ...sectionBox }}>
          <SH>Divergences Notables ({(data.divergences || []).length})</SH>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <TH style={{ width: '14%' }}>THÈME</TH>
                <TH style={{ width: '24%' }}>POSITION A (HAUSSIÈRE)</TH>
                <TH style={{ width: '12%' }}>AUTEUR(S)</TH>
                <TH style={{ width: '24%' }}>POSITION B (BAISSIÈRE)</TH>
                <TH style={{ width: '12%' }}>AUTEUR(S)</TH>
                <TH style={{ width: '14%' }}>ARBITRAGE CIO</TH>
              </tr>
            </thead>
            <tbody>
              {(data.divergences || []).map((d, i) => (
                <tr key={i}>
                  <TD style={{ fontWeight: 700, color: '#111827' }}>{d.theme}</TD>
                  <TD style={{ background: '#f0fdf4', color: '#065f46' }}>{d.posA}</TD>
                  <TD style={{ fontWeight: 700, color: '#059669', fontSize: 9 }}>{(d.authorsA || []).join(', ')}</TD>
                  <TD style={{ background: '#fef2f2', color: '#991b1b' }}>{d.posB}</TD>
                  <TD style={{ fontWeight: 700, color: '#dc2626', fontSize: 9 }}>{(d.authorsB || []).join(', ')}</TD>
                  <TD style={{ background: '#fffbeb', color: '#92400e', fontWeight: 600 }}>{d.arbitrage}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ position: 'absolute', bottom: 28, left: 36, right: 36, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
          <span style={{ fontSize: 8, color: '#9ca3af' }}>MacroSynthAI — Usage interne · Confidentiel</span>
          <span style={{ fontSize: 8, color: '#9ca3af' }}>Page 2/3</span>
        </div>
      </div>

      {/* ════════════════════ PAGE 3 ════════════════════ */}
      <div style={{ ...page(3), position: 'relative' }}>

        {/* Risques */}
        <div style={{ ...sectionBox }}>
          <SH>Risques Agrégés (triés par sévérité)</SH>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {(data.risks || []).map((r, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 8, padding: '12px 14px',
                border: '1px solid #e5e7eb',
                borderLeft: `4px solid ${r.severity === 'Élevé' ? '#dc2626' : '#d97706'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Sev v={r.severity} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>{r.risk}</span>
                </div>
                <div style={{ fontSize: 9, color: '#374151', lineHeight: 1.6, marginBottom: 4 }}>{r.impact}</div>
                <div style={{ fontSize: 8, color: '#9ca3af' }}>{r.count} auteurs : {(r.authors || []).join(' · ')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Score bars */}
        <div style={{ ...sectionBox }}>
          <SH>Scores de Consensus par Thème</SH>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
            {(data.convergences || []).map((c, i) => (
              <ScoreBar key={i} theme={c.theme} consensus={c.consensus} score={c.score} />
            ))}
          </div>
        </div>

        {/* Analysts table */}
        <div style={{ ...sectionBox }}>
          <SH>Tableau Analystes — Positionnement & Sentiment (14 stratégistes)</SH>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <TH style={{ minWidth: 120 }}>ANALYSTE</TH>
                <TH>FIRME</TH>
                <TH style={{ textAlign: 'center' }}>SENT.</TH>
                <TH style={{ textAlign: 'center' }}>US</TH>
                <TH style={{ textAlign: 'center' }}>INTL</TH>
                <TH style={{ textAlign: 'center' }}>OBLIG</TH>
                <TH style={{ textAlign: 'center' }}>HY</TH>
                <TH style={{ textAlign: 'center' }}>MAT.</TH>
                <TH style={{ textAlign: 'center' }}>CRYPTO</TH>
                <TH style={{ minWidth: 200 }}>POINT CLÉ</TH>
              </tr>
            </thead>
            <tbody>
              {(data.analysts || []).map((a, i) => {
                const sentColor = {
                  Bullish: '#15803d', Bearish: '#dc2626', Neutre: '#6b7280', Prudent: '#d97706',
                }[a.sentiment] || '#6b7280';
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                    <TD style={{ fontWeight: 700, fontSize: 9, color: '#111827', whiteSpace: 'nowrap' }}>{a.name}</TD>
                    <TD style={{ fontSize: 9, color: '#6b7280', whiteSpace: 'nowrap' }}>{a.firm}</TD>
                    <TD style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: sentColor }}>{a.sentiment?.substring(0, 4)}</span>
                    </TD>
                    {['actionsUS','actionsIntl','oblig','credit','matieres','crypto'].map(k => (
                      <td key={k} style={{ padding: '4px 3px', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                        <span style={stanceStyle(a[k] || 'Neutre')}>
                          {a[k] === 'Bull' ? '▲' : a[k] === 'Bear' ? '▼' : '—'}
                        </span>
                      </td>
                    ))}
                    <TD style={{ fontSize: 8, color: '#374151', lineHeight: 1.5 }}>{a.keyTakeaway}</TD>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ position: 'absolute', bottom: 28, left: 36, right: 36, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
          <span style={{ fontSize: 8, color: '#9ca3af' }}>MacroSynthAI — Usage interne · Confidentiel</span>
          <span style={{ fontSize: 8, color: '#9ca3af' }}>Page 3/3</span>
        </div>
      </div>
    </div>
  );
}

/* ── Main modal component ────────────────────────────────────────────── */
export function PdfReportModal({ data, period, isGroqData, onClose }) {
  const reportRef    = useRef(null);
  const { isMobile } = useBreakpoint();

  function handleDownloadPdf() {
    if (!reportRef.current) return;

    const styles = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter','Helvetica Neue',Helvetica,Arial,sans-serif; background: #f5f5f5; }
      @page { size: A4; margin: 0; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #f5f5f5; }
      }
    `;

    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) { alert("Veuillez autoriser les fenêtres pop-up pour télécharger le PDF."); return; }

    w.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>MacroSynthAI — Rapport de Recherche</title>
      <style>${styles}</style>
    </head><body>
      <div style="display:flex;flex-direction:column;align-items:center;padding:24px;background:#f5f5f5;">
        ${reportRef.current.innerHTML}
      </div>
    </body></html>`);
    w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  }

  return (
    <div style={{
      position:   'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.55)',
      display:    'flex', flexDirection: 'column',
      fontFamily: "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
    }}>
      {/* Toolbar */}
      <div style={{
        background: '#1e293b', color: '#f8fafc',
        padding: isMobile ? '12px 14px' : '12px 24px',
        display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between', gap: isMobile ? 10 : 0,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700 }}>📄 Aperçu PDF</span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 4,
            background: isGroqData ? '#065f46' : '#92400e',
            color: isGroqData ? '#d1fae5' : '#fef3c7',
          }}>
            {isGroqData ? '✓ Groq' : '⚠ Simulation'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, width: isMobile ? '100%' : 'auto' }}>
          <button
            onClick={handleDownloadPdf}
            style={{
              background: '#1d4ed8', color: '#fff', border: 'none',
              padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              flex: isMobile ? 1 : 'none',
            }}
          >
            ⬇ Télécharger PDF
          </button>
          <button
            onClick={onClose}
            style={{
              background: '#334155', color: '#f8fafc', border: 'none',
              padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Scrollable preview */}
      <div style={{
        flex: 1, overflowY: 'auto', background: '#e2e8f0',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '28px 20px',
        gap: 0,
      }}>
        <div ref={reportRef}>
          <ReportContent data={data} period={period} isGroqData={isGroqData} />
        </div>
      </div>
    </div>
  );
}
