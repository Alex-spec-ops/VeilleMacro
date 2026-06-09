import React from 'react';
import { X, Clock, Calendar, ExternalLink, Trash2, FileText } from 'lucide-react';

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtPeriod(period) {
  if (!period?.start || !period?.end) return '—';
  const s = new Date(period.start).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  const e = new Date(period.end).toLocaleDateString('fr-FR',   { day: '2-digit', month: 'short', year: 'numeric' });
  return `${s} → ${e}`;
}

export function HistoryPanel({ open, onClose, history, onOpen, onDelete, onClear }) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-white/10 bg-gray-950/95 shadow-2xl backdrop-blur-xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-violet-400" />
              <span className="text-sm font-bold text-white">Historique</span>
              {history.length > 0 && (
                <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold text-violet-400">
                  {history.length}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[10px] text-gray-600">Analyses précédentes</p>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClear}
                title="Vider l'historique"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-gray-600 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 size={12} />
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-gray-500 transition-all hover:bg-white/10 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 text-4xl opacity-30">📭</div>
              <p className="text-sm text-gray-600">Aucune analyse enregistrée</p>
              <p className="mt-1 text-xs text-gray-700">Lance un workflow pour créer un historique.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="group relative overflow-hidden rounded-xl border border-white/8 bg-white/3 p-4 transition-all hover:border-violet-500/30 hover:bg-violet-500/5"
                >
                  {/* Top accent */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-violet-500/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-violet-400">
                      <Calendar size={10} />
                      {fmtPeriod(entry.period)}
                    </div>
                    <button
                      onClick={() => onDelete(entry.id)}
                      className="opacity-0 group-hover:opacity-100 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-gray-600 transition-all hover:text-red-400"
                    >
                      <X size={10} />
                    </button>
                  </div>

                  <div className="mb-2 text-[10px] text-gray-600">
                    <Clock size={9} className="inline mr-1" />
                    {fmtDate(entry.date)}
                  </div>

                  {entry.preview && (
                    <p className="mb-3 text-xs leading-relaxed text-gray-500 line-clamp-3">
                      {entry.preview}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => onOpen(entry, 'dashboard')}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-1.5 text-[11px] font-semibold text-gray-400 transition-all hover:bg-white/10 hover:text-white"
                    >
                      <FileText size={11} /> Rapport
                    </button>
                    {entry.conversationId && (
                      <button
                        onClick={() => onOpen(entry, 'dust')}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/8 py-1.5 text-[11px] font-semibold text-violet-400 transition-all hover:bg-violet-500/15"
                      >
                        <ExternalLink size={11} /> Dust
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
