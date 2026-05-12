import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { C } from '../constants.js';

/* ─────────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────────── */
const STATUS_MAP = {
  idle:    { label: 'Idle',    color: C.statusIdle, bg: '#1f2937', pulse: false, check: false },
  pending: { label: 'Pending', color: C.statusPend, bg: '#451a03', pulse: true,  check: false },
  running: { label: 'Running', color: C.statusRun,  bg: '#172554', pulse: true,  check: false },
  success: { label: 'Success', color: C.statusOk,   bg: '#052e16', pulse: false, check: true  },
  error:   { label: 'Error',   color: C.statusErr,  bg: '#450a0a', pulse: false, check: false },
};

/* ─────────────────────────────────────────────
   SIZE CONFIG
───────────────────────────────────────────── */
const SIZE_MAP = {
  sm: { fontSize: 9,  padding: '2px 7px',  gap: 4, dot: 5,  icon: 9  },
  md: { fontSize: 11, padding: '3px 10px', gap: 5, dot: 6,  icon: 10 },
  lg: { fontSize: 13, padding: '5px 14px', gap: 6, dot: 8,  icon: 12 },
};

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
/**
 * StatusBadge({ status, size })
 *
 * status: 'idle' | 'pending' | 'running' | 'success' | 'error'
 * size:   'sm' | 'md' | 'lg'  (default 'md')
 *
 * Renders a rounded pill with:
 * - A pulsing dot for 'pending' and 'running'
 * - A check icon for 'success'
 * - animate-pulse on the whole badge for pending/running
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
        borderRadius:  99,
        fontSize:      z.fontSize,
        fontWeight:    600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color:         s.color,
        background:    s.bg,
        border:        `1px solid ${s.color}40`,
        userSelect:    'none',
      }}
    >
      {/* Animated dot for pending / running */}
      {s.pulse && (
        <span
          className="blink"
          style={{
            width:        z.dot,
            height:       z.dot,
            borderRadius: '50%',
            background:   s.color,
            display:      'inline-block',
            flexShrink:   0,
          }}
        />
      )}

      {/* Check icon for success */}
      {s.check && <CheckCircle2 size={z.icon} />}

      {s.label}
    </span>
  );
}
