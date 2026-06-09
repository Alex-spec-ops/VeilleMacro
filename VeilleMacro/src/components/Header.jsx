import React from 'react';
import { StatusBadge } from './StatusBadge.jsx';
import { timeAgo } from '../utils.js';
import { Activity, ChevronLeft, History } from 'lucide-react';

export function Header({ status, lastRun, onBack, canGoBack, onDustClick, dustActive, onHistoryClick, historyCount }) {
  const lastRunLabel = timeAgo(lastRun);

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-gray-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Left: back + brand */}
        <div className="flex items-center gap-3">
          {canGoBack && (
            <button
              onClick={onBack}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-lg shadow-violet-500/25">
              <Activity size={16} className="text-white" />
            </div>
            <div>
              <div className="bg-gradient-to-r from-violet-400 via-blue-400 to-teal-400 bg-clip-text text-base font-bold tracking-tight text-transparent">
                MacroSynthAI
              </div>
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">
                Agent Orchestration
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2.5">
          {lastRunLabel && (
            <div className="hidden text-right sm:block mr-1">
              <div className="text-[10px] uppercase tracking-widest text-gray-600">Last run</div>
              <div className="text-xs font-semibold text-gray-300">{lastRunLabel}</div>
            </div>
          )}

          {/* Historique */}
          <button
            onClick={onHistoryClick}
            className="relative flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-400 transition-all hover:bg-white/10 hover:text-gray-200"
          >
            <History size={14} />
            <span className="hidden sm:inline">Historique</span>
            {historyCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[9px] font-bold text-white">
                {historyCount > 9 ? '9+' : historyCount}
              </span>
            )}
          </button>

          {/* Dust Dashboard */}
          <button
            onClick={onDustClick}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all
              ${dustActive
                ? 'border-violet-500/50 bg-violet-500/20 text-violet-300'
                : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
              }`}
          >
            <div className="flex h-4 w-4 items-center justify-center rounded bg-gradient-to-br from-violet-500 to-blue-500 text-[9px] font-black text-white">D</div>
            <span className="hidden sm:inline">Dust</span>
          </button>

          <StatusBadge status={status} size="md" />
        </div>
      </div>
    </header>
  );
}
