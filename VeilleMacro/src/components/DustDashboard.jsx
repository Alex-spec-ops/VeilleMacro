import React, { useState } from 'react';
import { ExternalLink, Maximize2, RefreshCw } from 'lucide-react';

const WS = 'vTiqcjUPSf';

export function DustDashboard({ conversationId }) {
  const [key, setKey]     = useState(0); // force iframe reload
  const [full, setFull]   = useState(false);

  const baseUrl = `https://app.dust.tt/w/${WS}/assistant`;
  const iframeUrl = conversationId
    ? `${baseUrl}/${conversationId}`
    : `${baseUrl}/new`;

  return (
    <div className={`flex flex-col ${full ? 'fixed inset-0 z-50 bg-gray-950' : 'h-[calc(100vh-64px)]'}`}>

      {/* Barre de contrôle */}
      <div className="flex items-center justify-between border-b border-white/8 bg-gray-900/80 px-5 py-2.5 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 text-[10px] font-bold text-white">
            D
          </div>
          <span className="text-sm font-semibold text-gray-300">
            Dust — {conversationId ? 'Conversation en cours' : 'Nouvel assistant'}
          </span>
          {conversationId && (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
              {conversationId}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setKey(k => k + 1)}
            title="Recharger"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
          >
            <RefreshCw size={13} />
          </button>
          <button
            onClick={() => setFull(f => !f)}
            title={full ? 'Réduire' : 'Plein écran'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
          >
            <Maximize2 size={13} />
          </button>
          <a
            href={iframeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-400 transition-all hover:bg-violet-500/20"
          >
            <ExternalLink size={12} /> Ouvrir Dust
          </a>
        </div>
      </div>

      {/* iframe Dust */}
      <div className="relative flex-1 overflow-hidden">
        <iframe
          key={key}
          src={iframeUrl}
          className="h-full w-full border-0"
          allow="clipboard-write"
          title="Dust Dashboard"
        />
      </div>
    </div>
  );
}
