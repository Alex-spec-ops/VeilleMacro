import React from 'react';

/**
 * ProgressBar({ pct, color, gradient, h })
 * Rounded pill bar with shimmer on active.
 */
export function ProgressBar({ pct, color, gradient, h = 5 }) {
  const active = pct > 0 && pct < 100;

  return (
    <div
      style={{
        height:       h,
        background:   `${color}25`, // légèrement plus opaque que 18
        borderRadius: 100,
        overflow:     'hidden',
      }}
    >
      <div
        style={{
          height:       '100%',
          width:        `${pct}%`,
          background:   gradient ?? color,
          borderRadius: 100,
          transition:   'width 500ms ease-out',
          position:     'relative',
          overflow:     'hidden',
        }}
      >
        {active && (
          <span
            style={{
              position:   'absolute',
              inset:      0,
              background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)',
              animation:  'shimmer 1.8s linear infinite',
            }}
          />
        )}
      </div>
    </div>
  );
}
