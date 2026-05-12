import React from 'react';

/**
 * ProgressBar({ pct, color, gradient, h })
 *
 * Fully rectangular — zero border-radius.
 * Shimmer beam on active (0 < pct < 100).
 */
export function ProgressBar({ pct, color, gradient, h = 5 }) {
  const active = pct > 0 && pct < 100;

  return (
    <div
      style={{
        height:   h,
        background: `${color}18`,
        position: 'relative',
        overflow: 'hidden',
        // ── Zero border-radius ──
      }}
    >
      <div
        style={{
          height:     '100%',
          width:      `${pct}%`,
          background: gradient ?? `linear-gradient(90deg,${color}77,${color})`,
          transition: 'width 500ms ease-out',
          position:   'relative',
          overflow:   'hidden',
        }}
      >
        {active && (
          <span
            style={{
              position:   'absolute',
              inset:      0,
              background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)',
              animation:  'beam 1.6s linear infinite',
            }}
          />
        )}
      </div>
    </div>
  );
}
