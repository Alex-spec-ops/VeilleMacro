import React from 'react';
import { RotateCcw, Loader2, Rocket, BarChart3, CalendarDays } from 'lucide-react';
import { StatusBadge } from './StatusBadge.jsx';
import { BorderBeam } from './ui/border-beam.tsx';

export function OrchestratorCard({ status, progress, currentStep, onLaunch, onReset, onViewResults, canLaunch = true }) {
  const isRunning = status === 'running';
  const isSuccess = status === 'success';
  const isIdle    = status === 'idle';
  const launchReady = canLaunch && !isRunning;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900/90 to-gray-950/90 p-8 backdrop-blur-xl shadow-2xl shadow-black/40">

      {/* Active BorderBeam */}
      {(isRunning || isSuccess) && (
        <BorderBeam
          size={300}
          duration={isRunning ? 8 : 15}
          colorFrom={isRunning ? "#a855f7" : "#10b981"}
          colorTo={isRunning ? "#3b82f6" : "#06b6d4"}
          borderWidth={1.5}
        />
      )}

      {/* Subtle inner glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ background: isRunning
          ? 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 70%)'
          : isSuccess
            ? 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.10) 0%, transparent 70%)'
            : 'none'
        }}
      />

      <div className="relative z-10">
        {/* Top row */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border text-2xl
              ${isRunning ? 'border-violet-500/40 bg-violet-500/10' : 'border-white/10 bg-white/5'}`}>
              {isRunning ? <Loader2 size={22} className="animate-spin text-violet-400" /> : '🎯'}
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                Orchestrateur principal
              </div>
              <div className="mt-1 text-xl font-bold tracking-tight text-white">
                MacroSynthAI Orchestrator
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-gray-600">
                macro_synthesis_orchestrator
              </div>
            </div>
          </div>
          <StatusBadge status={status} size="md" />
        </div>

        {/* Progress bar */}
        {(isRunning || isSuccess) && (
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400">Workflow Progress</span>
              <span className="text-sm font-bold text-white">{progress.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-teal-400 transition-all duration-500 ease-out"
                style={{ width: `${progress}%`, boxShadow: '0 0 12px rgba(139,92,246,0.6)' }}
              />
            </div>
            {currentStep && (
              <p className="mt-2 font-mono text-[11px] text-gray-500">▶ {currentStep}</p>
            )}
            {isSuccess && !currentStep && (
              <p className="mt-2 font-mono text-[11px] text-emerald-500">✓ Workflow terminé avec succès</p>
            )}
          </div>
        )}

        {isIdle && (
          <p className="mb-6 font-mono text-[11px] text-gray-600">○ Prêt à démarrer le workflow…</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {/* Main button */}
          <button
            onClick={onLaunch}
            disabled={!launchReady}
            className={`relative flex flex-1 items-center justify-center gap-2.5 overflow-hidden rounded-xl px-6 py-3.5
              text-sm font-bold transition-all duration-200
              ${launchReady
                ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/30 hover:-translate-y-0.5 hover:shadow-violet-500/50 active:translate-y-0'
                : 'cursor-not-allowed bg-white/5 text-gray-600'
              }`}
          >
            {launchReady && (
              <div className="pointer-events-none absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/15 to-transparent bg-[length:200%_100%]" />
            )}
            {isRunning ? (
              <><Loader2 size={16} className="animate-spin" /> Running…</>
            ) : isSuccess ? (
              <><BarChart3 size={16} /> Consulter le Dashboard</>
            ) : !canLaunch ? (
              <><CalendarDays size={16} /> Sélectionnez une période</>
            ) : (
              <><Rocket size={16} /> Launch MacroSynthAI</>
            )}
          </button>

          {/* View results */}
          {isSuccess && (
            <button
              onClick={onViewResults}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3.5 text-sm font-bold text-emerald-400 transition-all hover:-translate-y-0.5 hover:bg-emerald-500/20 active:translate-y-0"
            >
              <BarChart3 size={16} /> Rapport
            </button>
          )}

          {/* Reset */}
          <button
            onClick={onReset}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold text-gray-400 transition-all hover:bg-white/10 hover:text-gray-200"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>
    </div>
  );
}
