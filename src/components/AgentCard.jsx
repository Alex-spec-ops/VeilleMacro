import React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge.jsx';
import { ProgressBar } from './ProgressBar.jsx';
import { fmtS } from '../utils.js';
import { C } from '../constants.js';

/**
 * AgentCard({ agent, config })
 *
 * agent:  { status: 'idle'|'pending'|'running'|'success'|'error', duration: ms }
 * config: AGENTS[id] — { id, name, label, emoji, color, simulatedDuration, desc }
 *
 * Border colour reflects status:
 *   idle    → slate-700 (dim)
 *   pending → amber (pulsing top line)
 *   running → agent brand colour (glowing)
 *   success → green
 *   error   → red
 *
 * Timer line:
 *   running → "Xs / estimatedDuration"
 *   success → "✓ Completed in Xs"
 *   else    → "Waiting..."
 */
export function AgentCard({ agent, config }) {
  const { emoji, label, name, color, simulatedDuration, desc } = config;
  const { status, duration } = agent;

  const isPending = status === 'pending';
  const isRunning = status === 'running';
  const isSuccess = status === 'success';
  const isError   = status === 'error';

  /* ── Border colour ── */
  const borderColor = isRunning  ? color
                    : isPending  ? C.statusPend
                    : isSuccess  ? C.statusOk
                    : isError    ? C.statusErr
                    :              C.border;

  /* ── Progress percentage ── */
  const pct = isSuccess  ? 100
            : isRunning  ? Math.min(99, (duration / simulatedDuration) * 100)
            :              0;

  /* ── Timer node ── */
  let timerNode;
  if (isPending) {
    timerNode = (
      <span
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        5,
          color:      C.statusPend,
          fontSize:   12,
        }}
      >
        <span
          className="blink"
          style={{ width: 6, height: 6, borderRadius: '50%', background: C.statusPend, display: 'inline-block' }}
        />
        Initialisation…
      </span>
    );
  } else if (isRunning) {
    timerNode = (
      <span
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        5,
          color,
          fontWeight: 700,
          fontSize:   13,
          fontFamily: 'monospace',
        }}
      >
        <span
          className="blink"
          style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }}
        />
        {fmtS(duration)}
        <span style={{ color: C.textDim, fontWeight: 400 }}>/ {fmtS(simulatedDuration)}</span>
      </span>
    );
  } else if (isSuccess) {
    timerNode = (
      <span
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        4,
          color:      C.statusOk,
          fontWeight: 700,
          fontSize:   12,
        }}
      >
        <CheckCircle2 size={12} />
        Completed in {fmtS(simulatedDuration)}
      </span>
    );
  } else {
    timerNode = (
      <span style={{ color: C.textDim, fontSize: 12, fontStyle: 'italic' }}>
        Waiting…
      </span>
    );
  }

  return (
    <div
      style={{
        background:  C.card,
        border:      `1px solid ${borderColor}`,
        borderRadius: 16,
        padding:     '18px 20px',
        position:    'relative',
        overflow:    'hidden',
        boxShadow:   isRunning ? `0 0 20px -6px ${color}44`
                   : isPending ? `0 0 12px -4px ${C.statusPend}33`
                   :             'none',
        transition:  'border-color 0.4s ease, box-shadow 0.4s ease',
      }}
    >
      {/* ── Top glow line (pending / running) ── */}
      {(isRunning || isPending) && (
        <div
          style={{
            position:   'absolute',
            top:        0, left: 0, right: 0,
            height:     2,
            background: `linear-gradient(90deg,transparent,${isRunning ? color : C.statusPend},transparent)`,
            animation:  'beam 2s linear infinite',
          }}
        />
      )}

      {/* ── Header row ── */}
      <div
        style={{
          display:        'flex',
          alignItems:     'flex-start',
          justifyContent: 'space-between',
          marginBottom:   10,
        }}
      >
        {/* Icon + names */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width:          42,
              height:         42,
              borderRadius:   11,
              background:     `${color}18`,
              border:         `1px solid ${color}44`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       20,
              flexShrink:     0,
            }}
          >
            {isRunning
              ? <Loader2 size={18} color={color} className="spin" />
              : isPending
                ? <Loader2 size={18} color={C.statusPend} className="spin" />
                : (
                  <span
                    style={{
                      filter: status === 'idle' ? 'grayscale(1) opacity(0.35)' : 'none',
                      lineHeight: 1,
                    }}
                  >
                    {emoji}
                  </span>
                )}
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>
              {label}
            </div>
            <div
              style={{
                fontSize:   9,
                color:      C.textMuted,
                fontFamily: 'monospace',
                marginTop:  3,
              }}
            >
              {name}
            </div>
          </div>
        </div>

        <StatusBadge status={status} size="sm" />
      </div>

      {/* ── Description ── */}
      <p style={{ fontSize: 11, color: C.textMuted, margin: '0 0 12px', lineHeight: 1.6 }}>
        {desc}
      </p>

      {/* ── Progress bar ── */}
      <ProgressBar pct={pct} color={status === 'idle' ? C.textDim : color} h={5} />

      {/* ── Timer ── */}
      <div style={{ marginTop: 10 }}>
        {timerNode}
      </div>
    </div>
  );
}
