import React from 'react';
import { Loader2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge.jsx';
import { BorderBeam } from './ui/border-beam.tsx';
import { fmtMin } from '../utils.js';

export function AgentCard({ agent, config }) {
  const { emoji, label, name, color, estimateMs, desc } = config;
  const { status, duration } = agent;

  const isPending = status === 'pending';
  const isRunning = status === 'running';
  const isSuccess = status === 'success';
  const isIdle    = status === 'idle';
  const isActive  = isRunning || isSuccess || isPending;

  const pct = isSuccess ? 100 : isRunning ? Math.min(99, (duration / estimateMs) * 100) : 0;

  // Map color hex to Tailwind-friendly inline gradient
  const glowColor = color + '40';

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300
        ${isActive
          ? 'border-white/15 bg-gray-900/80 shadow-xl'
          : 'border-white/8 bg-gray-900/50'
        }
        ${isRunning ? 'hover:-translate-y-1' : 'hover:-translate-y-0.5'}
      `}
      style={{ boxShadow: isRunning ? `0 8px 32px ${glowColor}` : isSuccess ? `0 4px 16px ${glowColor}` : undefined }}
    >
      {/* BorderBeam when running */}
      {isRunning && (
        <BorderBeam size={150} duration={8} colorFrom={color} colorTo="#ffffff40" borderWidth={1} />
      )}
      {isSuccess && (
        <BorderBeam size={200} duration={20} colorFrom="#10b981" colorTo={color} borderWidth={1} />
      )}

      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] transition-opacity duration-300"
        style={{ background: color, opacity: isIdle ? 0.15 : 0.9 }}
      />

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl transition-all duration-300"
              style={{
                background: isActive ? color + '20' : 'rgba(255,255,255,0.04)',
                boxShadow: isActive ? `0 4px 12px ${glowColor}` : 'none',
              }}
            >
              {(isRunning || isPending)
                ? <Loader2 size={18} style={{ color: isRunning ? color : '#f59e0b' }} className="animate-spin" />
                : <span style={{ filter: isIdle ? 'grayscale(1) opacity(0.3)' : 'none' }}>{emoji}</span>
              }
            </div>
            <div className="min-w-0">
              <div className={`truncate text-sm font-bold leading-tight ${isIdle ? 'text-gray-500' : 'text-white'}`}>
                {label}
              </div>
              <div className="mt-0.5 truncate font-mono text-[10px] text-gray-600">{name}</div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <StatusBadge status={status} size="sm" />
          </div>
        </div>

        {/* Description */}
        <p className="mb-4 text-xs leading-relaxed text-gray-500">{desc}</p>

        {/* Progress */}
        <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${pct}%`,
              background: isIdle ? 'rgba(255,255,255,0.1)' : color,
              boxShadow: isRunning ? `0 0 8px ${color}` : 'none',
            }}
          />
        </div>

        {/* Timer */}
        <div className="font-mono text-[11px]">
          {isPending && <span className="text-amber-400">Initialisation… <span className="text-gray-600">≈ {fmtMin(estimateMs)}</span></span>}
          {isRunning && (
            <span>
              <span style={{ color }} className="font-bold">{fmtMin(duration)}</span>
              <span className="text-gray-600"> / ≈ {fmtMin(estimateMs)}</span>
            </span>
          )}
          {isSuccess && <span className="text-emerald-400">✓ Terminé en {fmtMin(duration)}</span>}
          {isIdle && <span className="text-gray-700">≈ {fmtMin(estimateMs)} estimé</span>}
        </div>
      </div>
    </div>
  );
}
