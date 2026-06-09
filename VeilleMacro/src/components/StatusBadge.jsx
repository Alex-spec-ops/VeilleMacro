import React from 'react';

const STATUS = {
  idle:    { label: 'Idle',    classes: 'bg-white/10 text-gray-400 border-white/10' },
  pending: { label: 'Pending', classes: 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse' },
  running: { label: 'Running', classes: 'bg-violet-500/20 text-violet-300 border-violet-500/40 animate-pulse' },
  success: { label: 'Done',    classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  error:   { label: 'Error',   classes: 'bg-red-500/20 text-red-300 border-red-500/40' },
};

const SIZE = {
  sm: 'text-[10px] px-2 py-0.5 gap-1',
  md: 'text-[11px] px-2.5 py-1 gap-1.5',
  lg: 'text-xs px-3 py-1.5 gap-2',
};

export function StatusBadge({ status, size = 'md' }) {
  const s = STATUS[status] ?? STATUS.idle;
  const z = SIZE[size] ?? SIZE.md;

  return (
    <span className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-widest backdrop-blur-sm ${s.classes} ${z}`}>
      {(status === 'running' || status === 'pending') && (
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {status === 'success' && <span className="text-current">✓</span>}
      {s.label}
    </span>
  );
}
