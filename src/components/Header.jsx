import React from 'react';
import { StatusBadge } from './StatusBadge.jsx';
import { timeAgo } from '../utils.js';
import { C } from '../constants.js';

/**
 * Header({ status, lastRun })
 *
 * status:  globalStatus — 'idle' | 'running' | 'success' | 'error'
 * lastRun: timestamp (ms) of the last completed run, or null
 *
 * Renders the sticky top bar with:
 * - Brand title + subtitle
 * - StatusBadge animated according to status
 * - Formatted "Last run" timestamp
 */
export function Header({ status, lastRun }) {
  const lastRunLabel = timeAgo(lastRun);

  return (
    <header
      style={{
        background:     'rgba(15,23,42,0.97)',
        borderBottom:   `1px solid ${C.border}`,
        backdropFilter: 'blur(16px)',
        position:       'sticky',
        top:            0,
        zIndex:         50,
        padding:        '0 28px',
        height:         60,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
      }}
    >
      {/* ── Brand ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>🎯</span>
        <div>
          <div
            style={{
              fontSize:              16,
              fontWeight:            800,
              letterSpacing:         '-0.02em',
              background:            'linear-gradient(90deg,#ec4899,#3b82f6)',
              WebkitBackgroundClip:  'text',
              WebkitTextFillColor:   'transparent',
              backgroundClip:        'text',
            }}
          >
            MacroSynthAI
          </div>
          <div
            style={{
              fontSize:      10,
              color:         C.textDim,
              letterSpacing: '0.06em',
              marginTop:     1,
            }}
          >
            AGENT ORCHESTRATION PLATFORM
          </div>
        </div>
      </div>

      {/* ── Right: badge + last run ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <StatusBadge status={status} size="md" />

        <div
          style={{
            fontSize:   11,
            color:      C.textDim,
            textAlign:  'right',
            lineHeight: 1.5,
          }}
        >
          <div>Last run</div>
          <div style={{ color: lastRunLabel ? C.textMuted : C.textDim }}>
            {lastRunLabel ?? '—'}
          </div>
        </div>
      </div>
    </header>
  );
}
