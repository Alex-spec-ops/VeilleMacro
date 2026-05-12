import React from 'react';
import { Loader2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge.jsx';
import { ProgressBar } from './ProgressBar.jsx';
import { fmtS } from '../utils.js';
import { C } from '../constants.js';

const MONO = "'SF Mono','Fira Code','Consolas',monospace";

/**
 * AgentCard({ agent, config, index })
 *
 * Horizontal process strip — 54px fixed height.
 * Left accent border (3 px) driven by live status.
 *
 * Layout columns (left → right):
 *   [step#]  [icon]  [label + name]  [status]  [progress bar]  [pct]  [timer]
 */
export function AgentCard({ agent, config, index }) {
  const { emoji, label, name, color, simulatedDuration } = config;
  const { status, duration } = agent;

  const isPending = status === 'pending';
  const isRunning = status === 'running';
  const isSuccess = status === 'success';
  const isIdle = status === 'idle';

  /* ── Left accent ── */
  const accentColor = isRunning ? color
    : isPending ? C.statusPend
      : isSuccess ? C.statusOk
        : status === 'error' ? C.statusErr
          : C.border;

  /* ── Progress ── */
  const pct = isSuccess ? 100
    : isRunning ? Math.min(99, (duration / simulatedDuration) * 100)
      : 0;

  /* ── Timer ── */
  let timerNode;
  if (isPending) {
    timerNode = (
      <span style={{ color: C.statusPend, fontFamily: MONO, fontSize: 10 }}>
        Init…
      </span>
    );
  } else if (isRunning) {
    timerNode = (
      <span style={{ fontFamily: MONO, fontSize: 10 }}>
        <span style={{ color, fontWeight: 700 }}>{fmtS(duration)}</span>
        <span style={{ color: C.textDim }}>{' / '}{fmtS(simulatedDuration)}</span>
      </span>
    );
  } else if (isSuccess) {
    timerNode = (
      <span
        style={{
          color: C.statusOk, fontFamily: MONO, fontSize: 10, fontWeight: 700,
        }}
      >
        ✓ {fmtS(simulatedDuration)}
      </span>
    );
  } else {
    timerNode = (
      <span style={{ color: C.textDim, fontFamily: MONO, fontSize: 10 }}>—</span>
    );
  }

  return (
    <div
      className={isRunning ? 'running-glow transition-card' : 'transition-card'}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 54,
        background: C.card,
        borderTop: `1px solid ${C.border}`,
        borderRight: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        borderLeft: `3px solid ${accentColor}`,
        paddingLeft: 12,
        paddingRight: 16,
        gap: 12,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Horizontal scan beam */}
      {(isRunning || isPending) && (
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: 1,
            background: `linear-gradient(90deg,transparent,${isRunning ? color : C.statusPend},transparent)`,
            animation: 'beam 2s linear infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ── Step number ── */}
      <span
        style={{
          width: 18,
          textAlign: 'right',
          flexShrink: 0,
          fontSize: 9,
          fontFamily: MONO,
          color: isIdle ? C.textDim : C.textMuted,
          fontWeight: 700,
          letterSpacing: '0.04em',
        }}
      >
        {String(index).padStart(2, '0')}
      </span>

      {/* ── Icon ── */}
      <div
        style={{
          width: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {(isRunning || isPending)
          ? <Loader2 size={14} color={isRunning ? color : C.statusPend} className="spin" />
          : (
            <span
              style={{
                fontSize: 14,
                lineHeight: 1,
                filter: isIdle ? 'grayscale(1) opacity(0.25)' : 'none',
              }}
            >
              {emoji}
            </span>
          )
        }
      </div>

      {/* ── Label + technical name ── */}
      <div style={{ width: 210, flexShrink: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: isIdle ? C.textMuted : C.text,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 9,
            fontFamily: MONO,
            color: C.textDim,
            marginTop: 2,
            letterSpacing: '0.04em',
          }}
        >
          {name}
        </div>
      </div>

      {/* ── Status badge ── */}
      <div style={{ width: 82, flexShrink: 0 }}>
        <StatusBadge status={status} size="sm" />
      </div>

      {/* ── Progress bar ── */}
      <div style={{ flex: 1, minWidth: 80 }}>
        <ProgressBar pct={pct} color={isIdle ? C.textDim : color} h={3} />
      </div>

      {/* ── Percentage ── */}
      <span
        style={{
          width: 42,
          textAlign: 'right',
          flexShrink: 0,
          fontFamily: MONO,
          fontSize: 11,
          fontWeight: 700,
          color: isSuccess ? C.statusOk
            : isRunning ? color
              : C.textDim,
        }}
      >
        {pct.toFixed(0)}%
      </span>

      {/* ── Timer ── */}
      <div style={{ width: 108, textAlign: 'right', flexShrink: 0 }}>
        {timerNode}
      </div>
    </div>
  );
}
