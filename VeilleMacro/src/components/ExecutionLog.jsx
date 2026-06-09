import React, { useEffect, useRef } from 'react';
import { AGENT_EMOJI } from '../constants.js';

const TYPE_COLOR = {
  info:    'text-blue-400',
  success: 'text-emerald-400',
  error:   'text-red-400',
  warning: 'text-amber-400',
  debug:   'text-gray-500',
  system:  'text-violet-400',
};

const DOT_COLOR = {
  info:    '#60a5fa',
  success: '#34d399',
  error:   '#f87171',
  warning: '#fbbf24',
  debug:   '#6b7280',
  system:  '#a78bfa',
};

export function ExecutionLog({ logs }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  const formatTs = raw => {
    const d = raw instanceof Date ? raw : new Date(raw);
    return d.toTimeString().slice(0, 8);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-gray-950 shadow-2xl shadow-black/50">
      {/* Terminal header */}
      <div className="flex items-center justify-between border-b border-white/8 bg-black/40 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="font-mono text-xs font-semibold tracking-widest text-gray-500">▶ EXECUTION LOG</span>
        </div>
        <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-gray-600">
          {logs.length} entries
        </span>
      </div>

      {/* Log content */}
      <div className="max-h-96 overflow-y-auto p-2 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-gray-700">
            — waiting for workflow to start —
          </div>
        ) : (
          logs.map((entry, i) => {
            const agentEmoji = AGENT_EMOJI[entry.agent] ?? '◆';
            const typeColor  = TYPE_COLOR[entry.logType] ?? 'text-gray-400';
            const dotColor   = DOT_COLOR[entry.logType] ?? '#6b7280';

            return (
              <div
                key={entry.id}
                className={`flex items-baseline gap-0 rounded px-3 py-1 transition-colors ${i % 2 === 0 ? 'bg-white/[0.02]' : ''} hover:bg-white/5`}
              >
                {/* Timestamp */}
                <span className="w-[72px] flex-shrink-0 text-gray-700">{formatTs(entry.timestamp)}</span>

                {/* Dot */}
                <span className="mx-2 h-1.5 w-1.5 flex-shrink-0 rounded-full mt-[3px]"
                  style={{ background: dotColor, boxShadow: `0 0 4px ${dotColor}` }} />

                {/* Agent */}
                <span className="w-44 flex-shrink-0 text-blue-500 font-bold">
                  {agentEmoji} [{entry.agent}]
                </span>

                {/* Message */}
                <span className={`flex-1 break-all leading-relaxed ${typeColor}`}>
                  {entry.message}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
