import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/15 bg-gray-900/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
      <div className="mb-1 text-sm font-bold text-white">{d.label}</div>
      <div className="text-xs font-semibold" style={{ color: d.color }}>
        {d.status === 'success' ? 'Terminé' : d.status === 'running' ? 'En cours…' : 'En attente'}
      </div>
      <div className="mt-1 text-lg font-extrabold text-white">{d.duration.toFixed(1)}s</div>
    </div>
  );
};

export function PipelineChart({ agents }) {
  const data = [
    { id: 'collector', label: 'Collecte',    duration: agents.collector.duration / 1000, status: agents.collector.status, color: '#f87171' },
    { id: 'synthesis', label: 'Synthèse',    duration: agents.synthesis.duration / 1000, status: agents.synthesis.status, color: '#818cf8' },
    { id: 'dashboard', label: 'Dashboard',   duration: agents.dashboard.duration / 1000, status: agents.dashboard.status, color: '#2dd4bf' },
    { id: 'pdf',       label: 'Rapport PDF', duration: agents.pdf.duration     / 1000, status: agents.pdf.status,       color: '#fb923c' },
  ];

  return (
    <div className="rounded-2xl border border-white/8 bg-gray-900/60 p-6 backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-white">Monitoring de Performance</div>
          <div className="text-xs text-gray-500">Temps d'exécution par étape (secondes)</div>
        </div>
        <div className="flex gap-3">
          {['success', 'running', 'idle'].map(st => (
            <div key={st} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${st === 'success' ? 'bg-emerald-400' : st === 'running' ? 'bg-violet-400' : 'bg-gray-700'}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">{st}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false}
              tick={{ fontSize: 11, fontWeight: 600, fill: '#6b7280' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4b5563' }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="duration" radius={[6, 6, 0, 0]} barSize={36}>
              {data.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={entry.status === 'idle' ? '#1f2937' : entry.color}
                  fillOpacity={entry.status === 'running' ? 0.6 : 1}
                  style={entry.status !== 'idle' ? { filter: `drop-shadow(0 0 8px ${entry.color}60)` } : {}}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
