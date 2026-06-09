import React from 'react';

export function StatsBar({ isActive, synthesis }) {
  if (!isActive || !synthesis?.text) return null;

  // Extract real numbers from the synthesis text using simple regex
  const text = synthesis.text;

  const sourcesMatch = text.match(/(\d+)\s*(sources?|publications?|maisons?|rapports?)/i);
  const sources = sourcesMatch ? sourcesMatch[1] : null;

  const convergenceMatch = text.match(/(\d+)\s*(convergences?|points?\s+de\s+convergence)/i);
  const convergences = convergenceMatch ? convergenceMatch[1] : null;

  const ideasMatch = text.match(/(\d+)\s*(idées?|opportunités?|thèmes?\s+clés?)/i);
  const ideas = ideasMatch ? ideasMatch[1] : null;

  const risksMatch = text.match(/(\d+)\s*(risques?|catalyseurs?|alertes?)/i);
  const risks = risksMatch ? risksMatch[1] : null;

  const stats = [
    { icon: '🔍', label: 'Sources', value: sources,      color: '#818cf8' },
    { icon: '⚖️', label: 'Convergences', value: convergences, color: '#a78bfa' },
    { icon: '💡', label: 'Idées clés',   value: ideas,    color: '#34d399' },
    { icon: '⚠️', label: 'Risques',      value: risks,    color: '#f87171' },
  ].filter(s => s.value !== null);

  if (stats.length === 0) return null;

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
      {stats.map((s, i) => (
        <div
          key={i}
          className="group relative overflow-hidden rounded-2xl border border-white/8 bg-gray-900/60 p-5 backdrop-blur-xl"
          style={{ boxShadow: `0 0 20px ${s.color}18` }}
        >
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }} />
          <div className="mb-2 text-xl">{s.icon}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{s.label}</div>
          <div className="mt-1 text-3xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}
