import React from 'react';
import { Loader2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge.jsx';
import { fmtS } from '../utils.js';
import { C } from '../constants.js';

const MONO = "'Monaco','Courier New',monospace";

/**
 * AgentCard({ agent, config })
 *
 * White card with 5px top accent bar and colored shadow when active.
 * Hover lifts the card. Rounded corners (16px).
 */
export function AgentCard({ agent, config }) {
  const { emoji, label, name, color, simulatedDuration, desc } = config;
  const { status, duration } = agent;

  const isPending = status === 'pending';
  const isRunning = status === 'running';
  const isSuccess = status === 'success';
  const isIdle    = status === 'idle';
  const isActive  = isRunning || isSuccess || isPending;

  const agentShadow = `${color}35`;   // ~21% alpha for shadow

  const pct = isSuccess ? 100
            : isRunning ? Math.min(99, (duration / simulatedDuration) * 100)
            : 0;

  /* ── Timer ── */
  let timerNode;
  if (isPending) {
    timerNode = (
      <span style={{ color: C.statusPend, fontSize: 12, fontWeight: 600 }}>
        Initialisation…
      </span>
    );
  } else if (isRunning) {
    timerNode = (
      <span style={{ fontFamily: MONO }}>
        <span style={{ color, fontWeight: 700, fontSize: 15 }}>{fmtS(duration)}</span>
        <span style={{ color: C.textDim, fontSize: 12 }}> / {fmtS(simulatedDuration)}</span>
      </span>
    );
  } else if (isSuccess) {
    timerNode = (
      <span
        style={{
          color:      C.forest,
          fontWeight: 700,
          fontSize:   12,
          fontFamily: MONO,
        }}
      >
        ✓ Completed in {fmtS(simulatedDuration)}
      </span>
    );
  } else {
    timerNode = (
      <span style={{ color: '#666666', fontSize: 12 }}>Waiting…</span>
    );
  }

  return (
    <div
      className="agent-card-el"
      style={{
        '--agent-color':  color,
        '--agent-shadow': agentShadow,
        background:   '#ffffff',
        borderRadius: 16,
        padding:      '26px',
        border:       `2px solid ${isActive ? color : C.border}`,
        boxShadow:    isRunning
          ? `0 10px 36px ${agentShadow}`
          : isSuccess
            ? `0 4px 16px ${agentShadow}`
            : '0 1px 3px rgba(0,0,0,0.06)',
        position:     'relative',
        overflow:     'hidden',
        animation:    isRunning ? 'card-pulse 2s ease-in-out infinite' : 'none',
        transition:   'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
      }}
    >
      {/* 5px top accent */}
      <div
        style={{
          position:     'absolute',
          top: 0, left: 0, right: 0,
          height:       5,
          background:   color,
          borderRadius: '0',
          opacity:      isIdle ? 0.2 : 1,
          transition:   'opacity 300ms ease',
        }}
      />

      {/* ── Header ── */}
      <div
        style={{
          display:        'flex',
          alignItems:     'flex-start',
          justifyContent: 'space-between',
          marginTop:      4,
          marginBottom:   14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Icon box */}
          <div
            style={{
              width:          50,
              height:         50,
              background:     `${color}16`,
              borderRadius:   12,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       24,
              flexShrink:     0,
              boxShadow:      isActive ? `0 4px 12px ${agentShadow}` : 'none',
              transition:     'box-shadow 300ms ease',
            }}
          >
            {(isRunning || isPending)
              ? <Loader2 size={20} color={isRunning ? color : C.statusPend} className="spin" />
              : (
                <span
                  style={{
                    lineHeight: 1,
                    filter: isIdle ? 'grayscale(1) opacity(0.35)' : 'none',
                    transition: 'filter 300ms ease',
                  }}
                >
                  {emoji}
                </span>
              )
            }
          </div>

          <div>
            <div
              style={{
                fontSize:      14,
                fontWeight:    700,
                color:         isIdle ? '#555555' : C.text,
                lineHeight:    1.2,
                letterSpacing: '-0.01em',
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize:   10,
                fontFamily: MONO,
                color:      '#666666',
                marginTop:  3,
                letterSpacing: '0.03em',
              }}
            >
              {name}
            </div>
          </div>
        </div>

        <StatusBadge status={status} size="sm" />
      </div>

      {/* ── Description ── */}
      <p
        style={{
          fontSize:    12,
          color:       '#444444',
          lineHeight:  1.65,
          margin:      '0 0 16px',
        }}
      >
        {desc}
      </p>

      {/* ── Progress bar ── */}
      <div
        style={{
          height:       6,
          background:   `${color}18`,
          borderRadius: 100,
          overflow:     'hidden',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            height:       '100%',
            width:        `${pct}%`,
            background:   isIdle ? C.textDim : color,
            borderRadius: 100,
            opacity:      isIdle ? 0.15 : 1,
            transition:   'width 500ms ease-out',
            position:     'relative',
            overflow:     'hidden',
          }}
        >
          {isRunning && (
            <span
              style={{
                position:   'absolute',
                inset:      0,
                background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)',
                animation:  'shimmer 1.8s infinite',
              }}
            />
          )}
        </div>
      </div>

    </div>
  );
}
