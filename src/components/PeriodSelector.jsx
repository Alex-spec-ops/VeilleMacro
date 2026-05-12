import React from 'react';
import { C } from '../constants.js';

/* ── Quick presets ── */
const PRESETS = [
  { label: '7 J',  days: 7   },
  { label: '1 M',  days: 30  },
  { label: '3 M',  days: 90  },
  { label: '6 M',  days: 180 },
  { label: '1 AN', days: 365 },
];

/** Date → 'YYYY-MM-DD' for <input type="date"> value */
function toInputVal(date) {
  if (!date) return '';
  const d   = new Date(date);
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 'YYYY-MM-DD' string → midnight Date (local TZ) */
function fromInputVal(str) {
  return str ? new Date(str + 'T00:00:00') : null;
}

/** French short date label: "01/04/2026" */
function fmtLabel(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

/**
 * PeriodSelector({ startDate, endDate, onChange, disabled })
 *
 * Controlled component — parent owns the date state.
 * onChange({ start: Date|null, end: Date|null })
 */
export function PeriodSelector({ startDate, endDate, onChange, disabled }) {

  const setPreset = (days) => {
    const end   = new Date(); end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    onChange({ start, end });
  };

  const isValid     = startDate && endDate && new Date(startDate) < new Date(endDate);
  const isInvalid   = startDate && endDate && new Date(startDate) >= new Date(endDate);
  const hasRange    = startDate || endDate;

  /* Duration label when both dates set */
  let durationLabel = null;
  if (isValid) {
    const ms   = new Date(endDate) - new Date(startDate);
    const days = Math.round(ms / (1000 * 60 * 60 * 24));
    durationLabel = days === 1 ? '1 jour'
      : days < 30  ? `${days} jours`
      : days < 365 ? `${Math.round(days / 30)} mois`
      : `${(days / 365).toFixed(1).replace('.0', '')} an${days >= 730 ? 's' : ''}`;
  }

  const inputStyle = (hasValue) => ({
    padding:       '10px 14px',
    background:    '#F9FAFB',
    border:        `2px solid ${hasValue ? C.blue + '55' : C.border}`,
    borderRadius:  10,
    fontSize:      13,
    fontWeight:    600,
    color:         hasValue ? C.text : '#555555',
    cursor:        disabled ? 'not-allowed' : 'pointer',
    outline:       'none',
    opacity:       disabled ? 0.55 : 1,
    fontFamily:    "'Inter','Helvetica Neue',sans-serif",
    minWidth:      148,
    transition:    'border-color 200ms ease',
    display:       'block',
  });

  return (
    <div
      style={{
        background:   '#ffffff',
        borderRadius: 16,
        border:       `2px solid ${isValid ? C.blue + '44' : C.border}`,
        boxShadow:    isValid
          ? `0 4px 20px rgba(102,126,234,0.12)`
          : '0 1px 3px rgba(0,0,0,0.05)',
        padding:      '22px 28px',
        position:     'relative',
        overflow:     'hidden',
        transition:   'border-color 300ms ease, box-shadow 300ms ease',
      }}
    >
      {/* Top gradient accent */}
      <div
        style={{
          position:     'absolute',
          top: 0, left: 0, right: 0,
          height:       4,
          background:   `linear-gradient(90deg, ${C.blue}, ${C.purple})`,
          borderRadius: 0,
        }}
      />

      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:            24,
          flexWrap:       'wrap',
        }}
      >

        {/* ── Left: icon + title ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div
            style={{
              width:          44,
              height:         44,
              background:     '#EEF2FF',
              borderRadius:   11,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       20,
              flexShrink:     0,
            }}
          >
            📅
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>
              Période d'Analyse
            </div>
            <div style={{ fontSize: 11, color: '#555555', marginTop: 2 }}>
              {isValid
                ? <span style={{ color: C.blue, fontWeight: 600 }}>
                    {fmtLabel(startDate)} → {fmtLabel(endDate)}
                    <span style={{ color: '#555555', fontWeight: 400 }}> · {durationLabel}</span>
                  </span>
                : 'Définissez la plage de dates à analyser'
              }
            </div>
          </div>
        </div>

        {/* ── Center: date inputs ── */}
        <div
          style={{
            display:     'flex',
            alignItems:  'flex-end',
            gap:         10,
            flex:        1,
            minWidth:    340,
          }}
        >
          {/* Start date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
            <label
              style={{
                fontSize:      10,
                fontWeight:    700,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color:         '#555555',
              }}
            >
              Date de début
            </label>
            <input
              type="date"
              value={toInputVal(startDate)}
              onChange={e => onChange({ start: fromInputVal(e.target.value), end: endDate })}
              disabled={disabled}
              max={toInputVal(endDate) || undefined}
              style={inputStyle(!!startDate)}
            />
          </div>

          {/* Arrow between inputs */}
          <div
            style={{
              paddingBottom: 10,
              color:         '#555555',
              fontSize:      20,
              lineHeight:    1,
              flexShrink:    0,
            }}
          >
            →
          </div>

          {/* End date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
            <label
              style={{
                fontSize:      10,
                fontWeight:    700,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color:         '#555555',
              }}
            >
              Date de fin
            </label>
            <input
              type="date"
              value={toInputVal(endDate)}
              onChange={e => onChange({ start: startDate, end: fromInputVal(e.target.value) })}
              disabled={disabled}
              min={toInputVal(startDate) || undefined}
              style={inputStyle(!!endDate)}
            />
          </div>
        </div>

        {/* ── Right: preset shortcuts ── */}
        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              fontSize:      10,
              fontWeight:    700,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              color:         '#555555',
              marginBottom:  7,
            }}
          >
            Raccourcis
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => setPreset(p.days)}
                disabled={disabled}
                className="preset-btn"
                style={{
                  padding:      '7px 11px',
                  background:   '#F3F4F6',
                  border:       `1.5px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize:     11,
                  fontWeight:   700,
                  color:        '#444444',
                  cursor:       disabled ? 'not-allowed' : 'pointer',
                  opacity:      disabled ? 0.5 : 1,
                  lineHeight:   1,
                  whiteSpace:   'nowrap',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ── Validation error ── */}
      {isInvalid && (
        <div
          style={{
            marginTop:  12,
            fontSize:   12,
            color:      C.coral,
            fontWeight: 600,
          }}
        >
          ⚠ La date de fin doit être postérieure à la date de début.
        </div>
      )}
    </div>
  );
}
