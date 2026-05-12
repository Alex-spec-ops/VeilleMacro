import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { C } from '../constants.js';

/**
 * PipelineChart({ agents })
 * 
 * High-end bar chart showing execution duration per agent.
 * Colors adapt to status (idle/running/success).
 */
export function PipelineChart({ agents }) {
  const data = [
    { id: 'collector', label: 'Collecte', duration: agents.collector.duration / 1000, status: agents.collector.status, color: C.coral },
    { id: 'synthesis', label: 'Synthèse', duration: agents.synthesis.duration / 1000, status: agents.synthesis.status, color: C.blue },
    { id: 'dashboard', label: 'Dashboard', duration: agents.dashboard.duration / 1000, status: agents.dashboard.status, color: C.teal },
    { id: 'pdf',       label: 'Rapport PDF', duration: agents.pdf.duration / 1000, status: agents.pdf.status, color: C.orange },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div style={{
          background: '#ffffff',
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: '10px 14px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>{d.label}</div>
          <div style={{ fontSize: 11, color: d.color, fontWeight: 600 }}>
            {d.status === 'success' ? 'Terminé' : d.status === 'running' ? 'En cours...' : 'En attente'}
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginTop: 4 }}>
            {d.duration.toFixed(1)}s
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 16,
      border: `2px solid ${C.border}`,
      padding: '24px',
      height: 300,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Monitoring de Performance</div>
          <div style={{ fontSize: 11, color: '#555555' }}>Temps d'exécution par étape (secondes)</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {['success', 'running', 'idle'].map(st => (
            <div key={st} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ 
                width: 8, height: 8, borderRadius: '50%', 
                background: st === 'success' ? C.statusOk : st === 'running' ? C.statusRun : '#e4e4e0' 
              }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#666666', textTransform: 'capitalize' }}>{st}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fontWeight: 600, fill: '#666666' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#888888' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8f8f8' }} />
            <Bar dataKey="duration" radius={[6, 6, 0, 0]} barSize={40}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.status === 'idle' ? '#e4e4e0' : entry.color}
                  fillOpacity={entry.status === 'running' ? 0.7 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
