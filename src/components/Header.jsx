import React from 'react';
import { StatusBadge } from './StatusBadge.jsx';
import { timeAgo } from '../utils.js';
import { C } from '../constants.js';

/**
 * Header({ status, lastRun })
 *
 * Minimal professional top bar — no gradients, no decorative elements.
 * Single bottom border. Sans-serif branding.
 */
export function Header({ status, lastRun }) {
  const lastRunLabel = timeAgo(lastRun);

  return (
    <header
      style={{
        background:     C.card,
        borderBottom:   `1px solid ${C.border}`,
        position:       'sticky',
        top:            0,
        zIndex:         50,
        padding:        '0 28px',
        height:         48,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
      }}
    >
      {/* ── Brand ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            fontSize:      14,
            fontWeight:    800,
            color:         C.text,
            letterSpacing: '-0.02em',
          }}
        >
          MacroSynthAI
        </span>

        <span style={{ color: C.blue, fontSize: 16, lineHeight: 1, userSelect: 'none' }}>·</span>

        <span
          style={{
            fontSize:      11,
            fontWeight:    500,
            color:         C.textMuted,
            letterSpacing: '0.01em',
          }}
        >
          Agent Orchestration Platform
        </span>
      </div>

      {/* ── Right: last run + status ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            fontSize:   9,
            fontFamily: "'SF Mono','Fira Code','Consolas',monospace",
            color:      C.textDim,
            textAlign:  'right',
            lineHeight: 1.7,
            letterSpacing: '0.05em',
          }}
        >
          <div style={{ textTransform: 'uppercase' }}>Last run</div>
          <div style={{ color: lastRunLabel ? C.textMuted : C.textDim }}>
            {lastRunLabel ?? '—'}
          </div>
        </div>

        <span style={{ width: 1, height: 16, background: C.border, display: 'inline-block' }} />

        <StatusBadge status={status} size="md" />
      </div>
    </header>
  );
}
