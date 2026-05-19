import React from 'react';
import { StatusBadge } from './StatusBadge.jsx';
import { timeAgo } from '../utils.js';
import { C } from '../constants.js';
import { useBreakpoint } from '../hooks/useBreakpoint.js';

/**
 * Header({ status, lastRun })
 *
 * White top bar — logo square, gradient brand name, status on right.
 */
export function Header({ status, lastRun }) {
  const lastRunLabel    = timeAgo(lastRun);
  const { isMobile }   = useBreakpoint();

  return (
    <header
      style={{
        background:     '#ffffff',
        borderBottom:   `2px solid ${C.border}`,
        boxShadow:      '0 1px 3px rgba(0,0,0,0.04)',
        position:       'sticky',
        top:            0,
        zIndex:         50,
        padding:        isMobile ? '0 16px' : '0 32px',
        height:         64,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
      }}
    >
      {/* ── Brand ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width:          isMobile ? 34 : 40,
            height:         isMobile ? 34 : 40,
            background:     `linear-gradient(135deg, ${C.coral} 0%, ${C.orange} 100%)`,
            borderRadius:   11,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontWeight:     800,
            fontSize:       isMobile ? 12 : 14,
            color:          '#ffffff',
            letterSpacing:  '-0.02em',
            flexShrink:     0,
            boxShadow:      '0 4px 14px rgba(255, 107, 107, 0.32)',
          }}
        >
          MS
        </div>

        <div>
          <div
            style={{
              fontSize:             isMobile ? 14 : 16,
              fontWeight:           800,
              background:           `linear-gradient(135deg, ${C.coral} 0%, ${C.teal} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor:  'transparent',
              backgroundClip:       'text',
              letterSpacing:        '-0.02em',
              lineHeight:           1.1,
            }}
          >
            MacroSynthAI
          </div>
          {!isMobile && (
            <div style={{ fontSize: 11, color: '#555555', marginTop: 2, fontWeight: 500 }}>
              Agent Orchestration Platform
            </div>
          )}
        </div>
      </div>

      {/* ── Right: last run + status ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 18 }}>
        {!isMobile && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#555555', lineHeight: 1.5 }}>Last run</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: lastRunLabel ? '#333333' : '#666666' }}>
              {lastRunLabel ?? '—'}
            </div>
          </div>
        )}
        <StatusBadge status={status} size="md" />
      </div>
    </header>
  );
}
