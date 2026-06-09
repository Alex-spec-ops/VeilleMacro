import React from 'react';
import { CalendarDays } from 'lucide-react';

const PRESETS = [
  { label: '7J',  days: 7   },
  { label: '1M',  days: 30  },
  { label: '3M',  days: 90  },
  { label: '6M',  days: 180 },
  { label: '1AN', days: 365 },
];

function toInputVal(date) {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fromInputVal(str) {
  return str ? new Date(str + 'T00:00:00') : null;
}

function fmtLabel(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function PeriodSelector({ startDate, endDate, onChange, disabled }) {
  const setPreset = (days) => {
    const end = new Date(); end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    onChange({ start, end });
  };

  const isValid   = startDate && endDate && new Date(startDate) < new Date(endDate);
  const isInvalid = startDate && endDate && new Date(startDate) >= new Date(endDate);

  let durationLabel = null;
  if (isValid) {
    const days = Math.round((new Date(endDate) - new Date(startDate)) / 86400000);
    durationLabel = days < 30 ? `${days}j` : days < 365 ? `${Math.round(days / 30)}mo` : `${(days / 365).toFixed(1)}an`;
  }

  const inputClass = `w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-gray-200
    outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20
    [color-scheme:dark] ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-white/20'}`;

  return (
    <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300
      ${isValid ? 'border-violet-500/30 bg-gray-900/80 shadow-lg shadow-violet-500/10' : 'border-white/8 bg-gray-900/50'}`}>

      {/* Top gradient line */}
      <div className={`absolute inset-x-0 top-0 h-px transition-opacity ${isValid ? 'opacity-100' : 'opacity-30'}`}
        style={{ background: 'linear-gradient(90deg, #7c3aed, #2563eb, #0d9488)' }} />

      <div className="flex flex-wrap items-center gap-6 p-6">
        {/* Icon + title */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <CalendarDays size={18} className="text-violet-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Période d'Analyse</div>
            <div className="text-[11px] text-gray-500">
              {isValid
                ? <span className="text-violet-400 font-semibold">{fmtLabel(startDate)} → {fmtLabel(endDate)} · {durationLabel}</span>
                : 'Définissez la plage de dates'
              }
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="flex flex-1 items-end gap-3 min-w-[280px]">
          <div className="flex-1">
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-600">Début</label>
            <input type="date" value={toInputVal(startDate)}
              onChange={e => onChange({ start: fromInputVal(e.target.value), end: endDate })}
              disabled={disabled} max={toInputVal(endDate) || undefined}
              className={inputClass} />
          </div>
          <span className="pb-2.5 text-gray-600">→</span>
          <div className="flex-1">
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-600">Fin</label>
            <input type="date" value={toInputVal(endDate)}
              onChange={e => onChange({ start: startDate, end: fromInputVal(e.target.value) })}
              disabled={disabled} min={toInputVal(startDate) || undefined}
              className={inputClass} />
          </div>
        </div>

        {/* Presets */}
        <div className="flex-shrink-0">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600">Raccourcis</div>
          <div className="flex gap-1.5">
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => setPreset(p.days)} disabled={disabled}
                className={`rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-bold
                  text-gray-400 transition-all
                  ${disabled ? 'cursor-not-allowed opacity-40' : 'hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-400 active:scale-95'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isInvalid && (
        <div className="mx-6 mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400">
          ⚠ La date de fin doit être postérieure à la date de début.
        </div>
      )}
    </div>
  );
}
