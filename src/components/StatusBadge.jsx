import React from 'react';
import { C } from '../constants.js';

/* ── Status config ── */
const STATUS_MAP = {
  idle:    { label: 'Idle',    color: C.statusIdle, bg: C.cardDeep,  pulse: false, check: false },
  pending: { label: 'Pending', color: C.statusPend, bg: '#120d00',   pulse: true,  check: false },
  running: { label: 'Running', color: C.statusRun,  bg: '#030d22',   pulse: true,  check: false },
  success: { label: 'Done',    color: C.statusOk,   bg: '#001a0f',   pulse: false, check: true  },
  error:   { label: 'Error',   color: C.statusErr,  bg: '#160404',   pulse: false, check: false },
};

/* ── Size config ── */
const SIZE_MAP = {
  sm: { fontSize: 8,  padding: '2px 5px',  gap: 4, dot: 4 },
  md: { fontSize: 9,  padding: '3px 8px',  gap: 5, dot: 5 },
  lg: { fontSize: 10, padding: '4px 10px', gap: 6, dot: 6 },
};

/**
 * StatusBadge({ status, size })
 *
 * Compact data-forward status tag — zero border-radius.
 * Square blink indicator for pending/running. ✓ for success.
 */
export function StatusBadge({ status, size = 'md' }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.idle;
  const z = SIZE_MAP[size]     ?? SIZE_MAP.md;

  return (
    <span
      className={s.pulse ? 'animate-pulse' : ''}
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           z.gap,
        padding:       z.padding,
        fontSize:      z.fontSize,
        fontFamily:    "'SF Mono','Fira Code','Consolas',monospace",
        fontWeight:    700,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color:         s.color,
        background:    s.bg,
        border:        `1px solid ${s.color}44`,
        userSelect:    'none',
        flexShrink:    0,
      }}
    >
      {s.pulse && (
        <span
          className="blink"
          style={{
            width:      z.dot,
            height:     z.dot,
            background: s.color,
            display:    'inline-block',
            flexShrink: 0,
          }}
        />
      )}

      {s.check && (
        <span style={{ fontSize: z.dot + 2, lineHeight: 1 }}>✓</span>
      )}

      {s.label}
    </span>
  );
}
