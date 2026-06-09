import React from 'react';

const STATS = [
  { icon: '🔍', label: 'Sources Analyzed', value: '14/22', change: '↑ +3 this week', color: '#818cf8', glow: 'rgba(129,140,248,0.2)' },
  { icon: '⚖️', label: 'Convergences',     value: '5',     change: 'Strategic insights', color: '#a78bfa', glow: 'rgba(167,139,250,0.2)' },
  { icon: '💡', label: 'New Ideas',         value: '4',     change: 'Investment opps',    color: '#34d399', glow: 'rgba(52,211,153,0.2)' },
  { icon: '⚠️', label: 'Risk Signals',      value: '4',     change: 'Monitoring active',  color: '#f87171', glow: 'rgba(248,113,113,0.2)' },
];

export function StatsBar({ isActive }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {STATS.map((s, i) => (
        <div
          key={i}
          className="group relative overflow-hidden rounded-2xl border border-white/8 bg-gray-900/60 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1"
          style={{ boxShadow: isActive ? `0 0 24px ${s.glow}` : 'none' }}
        >
          {/* Top accent */}
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }} />

          <div
            className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-xl"
            style={{ background: s.glow }}
          >
            {s.icon}
          </div>

          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-600">
            {s.label}
          </div>

          <div
            className="mb-1 text-3xl font-extrabold leading-none transition-all duration-500"
            style={{ color: isActive ? s.color : '#374151' }}
          >
            {isActive ? s.value : '—'}
          </div>

          <div
            className="text-[11px] font-semibold transition-colors duration-500"
            style={{ color: isActive ? s.color + 'cc' : '#374151' }}
          >
            {isActive ? s.change : 'No data yet'}
          </div>
        </div>
      ))}
    </div>
  );
}
