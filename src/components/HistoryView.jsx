import React, { useState } from 'react';

const sentStyle = (color) => ({
  bg:    color === 'red' ? '#FEF2F2' : color === 'green' ? '#DCFCE7' : '#FEF3C7',
  text:  color === 'red' ? '#991B1B' : color === 'green' ? '#15803D' : '#92400E',
});

function StatChip({ label, value, color }) {
  const colors = {
    green:  { bg: '#DCFCE7', text: '#15803D' },
    red:    { bg: '#FEE2E2', text: '#DC2626' },
    blue:   { bg: '#DBEAFE', text: '#1D4ED8' },
    neutral:{ bg: '#F3F4F6', text: '#6B7280' },
  };
  const c = colors[color] || colors.neutral;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.text,
      padding: '2px 9px', borderRadius: 20,
    }}>
      {label} {value}
    </span>
  );
}

function HistoryCard({ entry, onLoad, onDelete }) {
  const ts = new Date(entry.timestamp);
  const dateStr = ts.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = ts.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const startLabel = new Date(entry.period.start).toLocaleDateString('fr-FR');
  const endLabel   = new Date(entry.period.end).toLocaleDateString('fr-FR');

  const sc = sentStyle(entry.sentimentColor);
  const hasGroq = !!entry.synthesisData;

  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      border: '1px solid #E5E7EB',
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      transition: 'box-shadow 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Left: date column */}
      <div style={{ textAlign: 'center', minWidth: 72, flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', lineHeight: 1 }}>
          {ts.getDate().toString().padStart(2, '0')}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {ts.toLocaleDateString('fr-FR', { month: 'short' })} {ts.getFullYear()}
        </div>
        <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{timeStr}</div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 56, background: '#E5E7EB', flexShrink: 0 }} />

      {/* Center: main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
            {startLabel} → {endLabel}
          </span>
          {entry.sentiment && (
            <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.text, whiteSpace: 'nowrap' }}>
              {entry.sentiment}
            </span>
          )}
          {hasGroq && (
            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: '#DCFCE7', color: '#15803D' }}>
              ✓ Groq
            </span>
          )}
        </div>

        {entry.stats && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <StatChip label="Sources" value={`${entry.stats.sourcesAnalyzed}/22`} color="blue" />
            <StatChip label="Convergences" value={entry.stats.convergences} color="green" />
            <StatChip label="Divergences" value={entry.stats.divergences} color="neutral" />
            <StatChip label="Idées" value={entry.stats.newIdeas} color="neutral" />
            <StatChip label="Risques" value={entry.stats.risks} color="red" />
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => onDelete(entry.id)}
          title="Supprimer cette analyse"
          style={{
            padding: '7px 12px', borderRadius: 8,
            border: '1px solid #E5E7EB', background: '#fff',
            fontSize: 14, cursor: 'pointer', color: '#9CA3AF',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FCA5A5'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
        >
          🗑️
        </button>
        <button
          onClick={() => onLoad(entry)}
          style={{
            padding: '7px 18px', borderRadius: 8,
            border: '1px solid #2563EB', background: '#2563EB',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            color: '#fff', display: 'flex', alignItems: 'center', gap: 6,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
          onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
        >
          📊 Voir le rapport
        </button>
      </div>
    </div>
  );
}

export function HistoryView({ historyList, onLoad, onDelete, onClear }) {
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = () => {
    if (confirmClear) { onClear(); setConfirmClear(false); }
    else setConfirmClear(true);
  };

  return (
    <div style={{
      maxWidth: 1000,
      margin: '0 auto',
      padding: '32px',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#111827', letterSpacing: '-0.02em' }}>
            📂 Historique des Analyses
          </h2>
          <p style={{ color: '#6B7280', margin: '6px 0 0', fontSize: 14 }}>
            {historyList.length === 0
              ? 'Aucune analyse enregistrée'
              : `${historyList.length} analyse${historyList.length > 1 ? 's' : ''} enregistrée${historyList.length > 1 ? 's' : ''} · Sauvegardées localement`}
          </p>
        </div>

        {historyList.length > 0 && (
          <button
            onClick={handleClear}
            style={{
              padding: '8px 16px', borderRadius: 8,
              border: `1px solid ${confirmClear ? '#DC2626' : '#E5E7EB'}`,
              background: confirmClear ? '#FEF2F2' : '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              color: confirmClear ? '#DC2626' : '#6B7280',
              transition: 'all 0.15s',
            }}
            onBlur={() => setConfirmClear(false)}
          >
            {confirmClear ? '⚠️ Confirmer la suppression' : '🗑️ Effacer tout'}
          </button>
        )}
      </div>

      {historyList.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 32px',
          background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB',
          color: '#6B7280',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
            Aucune analyse enregistrée
          </div>
          <p style={{ margin: 0, fontSize: 14 }}>
            Lancez un workflow pour générer et sauvegarder votre première analyse.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {historyList.map(entry => (
            <HistoryCard
              key={entry.id}
              entry={entry}
              onLoad={onLoad}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
