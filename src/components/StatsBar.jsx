import React from 'react';
import { C } from '../constants.js';

const STATS = [
  {
    icon:   '🔍',
    label:  'Sources Analyzed',
    value:  '14/22',
    change: '↑ +3 this week',
    color:  C.blue,
    bg:     '#EEF2FF',
  },
  {
    icon:   '⚖️',
    label:  'Convergences',
    value:  '5',
    change: 'Strategic insights',
    color:  C.purple,
    bg:     '#F5F3FF',
  },
  {
    icon:   '💡',
    label:  'New Ideas',
    value:  '4',
    change: 'Investment opps',
    color:  C.teal,
    bg:     '#E8FAF8',
  },
  {
    icon:   '⚠️',
    label:  'Risk Signals',
    value:  '4',
    change: 'Monitoring',
    color:  C.coral,
    bg:     '#FEE2E2',
  },
];

/**
 * StatsBar({ isActive })
 *
 * 4-col grid of KPI cards.
 * isActive=true shows real numbers (after at least one run).
 */
export function StatsBar({ isActive }) {
  return (
    <div
      style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap:                 20,
      }}
    >
      {STATS.map((s, i) => (
        <div
          key={i}
          className="stat-card-el"
          style={{
            background:   '#ffffff',
            borderRadius: 16,
            padding:      '22px 24px',
            border:       `2px solid ${C.border}`,
            boxShadow:    '0 1px 3px rgba(0,0,0,0.05)',
            position:     'relative',
            overflow:     'hidden',
          }}
        >
          {/* Top accent line */}
          <div
            style={{
              position:     'absolute',
              top: 0, left: 0, right: 0,
              height:       4,
              background:   s.color,
              borderRadius: '0',
            }}
          />

          {/* Icon */}
          <div
            style={{
              width:          48,
              height:         48,
              background:     s.bg,
              borderRadius:   12,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       22,
              marginBottom:   14,
              marginTop:      4,
              boxShadow:      `0 4px 12px ${s.color}28`,
            }}
          >
            {s.icon}
          </div>

          {/* Label */}
          <div
            style={{
              fontSize:      10,
              fontWeight:    700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color:         '#555555',
              marginBottom:  6,
            }}
          >
            {s.label}
          </div>

          {/* Value */}
          <div
            style={{
              fontSize:   32,
              fontWeight: 800,
              color:      isActive ? C.text : '#888888',
              lineHeight: 1,
              marginBottom: 6,
              transition: 'color 400ms ease',
            }}
          >
            {isActive ? s.value : '—'}
          </div>

          {/* Change */}
          <div
            style={{
              fontSize:   11,
              fontWeight: 600,
              color:      isActive ? s.color : '#888888',
              transition: 'color 400ms ease',
            }}
          >
            {isActive ? s.change : 'No data yet'}
          </div>
        </div>
      ))}
    </div>
  );
}
