import React from 'react';
import { C } from '../constants.js';

/* ── Status → gradient / flat ── */
const STATUS_MAP = {
  idle:    {
    label: 'Idle',
    gradient: null,
    solidBg: '#F3F4F6',
    color: '#6B7280',
    pulse: false, check: false,
  },
  pending: {
    label: 'Pending',
    gradient: `linear-gradient(135deg, ${C.sunshine}, ${C.orange})`,
    solidBg: null,
    color: '#ffffff',
    pulse: true, check: false,
  },
  running: {
    label: 'Running',
    gradient: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
    solidBg: null,
    color: '#ffffff',
    pulse: true, check: false,
  },
  success: {
    label: 'Done',
    gradient: `linear-gradient(135deg, ${C.emerald}, ${C.teal})`,
    solidBg: null,
    color: '#ffffff',
    pulse: false, check: true,
  },
  error: {
    label: 'Error',
    gradient: null,
    solidBg: C.coral,
    color: '#ffffff',
    pulse: false, check: false,
  },
};

const SIZE_MAP = {
  sm: { fontSize: 10, padding: '3px 8px',  gap: 5, dot: 5, br: 5 },
  md: { fontSize: 11, padding: '5px 11px', gap: 6, dot: 6, br: 6 },
  lg: { fontSize: 12, padding: '6px 13px', gap: 7, dot: 7, br: 7 },
};

/**
 * StatusBadge({ status, size })
 * Gradient pill badge — modern, data-forward.
 */
export function StatusBadge({ status, size = 'md' }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.idle;
  const z = SIZE_MAP[size]     ?? SIZE_MAP.md;

  return (
    <span
      className={s.pulse ? 'badge-shimmer' : ''}
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          z.gap,
        padding:      z.padding,
        fontSize:     z.fontSize,
        fontWeight:   700,
        letterSpacing:'0.04em',
        textTransform:'uppercase',
        color:        s.color,
        background:   s.gradient ?? s.solidBg,
        borderRadius: z.br,
        userSelect:   'none',
        flexShrink:   0,
        boxShadow:    s.gradient ? '0 2px 10px rgba(0,0,0,0.14)' : 'none',
      }}
    >
      {/* Pulsing dot for pending/running */}
      {s.pulse && (
        <span
          className="pulse-dot-anim"
          style={{
            width:        z.dot,
            height:       z.dot,
            background:   'rgba(255,255,255,0.9)',
            borderRadius: '50%',
            display:      'inline-block',
            flexShrink:   0,
          }}
        />
      )}

      {/* Checkmark for success */}
      {s.check && (
        <span style={{ fontSize: z.dot + 2, lineHeight: 1 }}>✓</span>
      )}

      {s.label}
    </span>
  );
}
