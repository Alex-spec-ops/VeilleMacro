import React from 'react';

/**
 * ProgressBar({ pct, color, gradient, h })
 *
 * pct:      0–100
 * color:    fallback color for track + glow
 * gradient: optional CSS gradient string for the fill
 * h:        bar height in px (default 6)
 */
export function ProgressBar({ pct, color, gradient, h = 6 }) {
  const active = pct > 0 && pct < 100;

  return (
    <div
      style={{
        height:       h,
        background:   `${color}22`,
        borderRadius: 99,
        overflow:     'hidden',
        position:     'relative',
      }}
    >
      <div
        style={{
          height:     '100%',
          width:      `${pct}%`,
          background: gradient ?? `linear-gradient(90deg,${color}99,${color})`,
          borderRadius: 99,
          transition: 'width 500ms ease-out',
          position:   'relative',
          boxShadow:  active ? `0 0 8px 1px ${color}55` : 'none',
        }}
      >
        {active && (
          <span
            style={{
              position:   'absolute',
              inset:      0,
              background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)',
              animation:  'beam 1.6s linear infinite',
              borderRadius: 99,
            }}
          />
        )}
      </div>
    </div>
  );
}
