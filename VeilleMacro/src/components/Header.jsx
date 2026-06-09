import React from 'react';
import { StatusBadge } from './StatusBadge.jsx';
import { timeAgo } from '../utils.js';
import { Activity } from 'lucide-react';

export function Header({ status, lastRun }) {
  const lastRunLabel = timeAgo(lastRun);

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-gray-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Brand */}
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

        {/* Right */}
        <div className="flex items-center gap-4">
          {lastRunLabel && (
            <div className="hidden text-right sm:block">
              <div className="text-[10px] uppercase tracking-widest text-gray-600">Last run</div>
              <div className="text-xs font-semibold text-gray-300">{lastRunLabel}</div>
            </div>
          )}
          <StatusBadge status={status} size="md" />
        </div>
      </div>
    </header>
  );
}
