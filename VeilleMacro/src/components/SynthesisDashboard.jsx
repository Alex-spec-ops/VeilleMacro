import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { CalendarDays, ExternalLink, Copy, Check, FileText, MessageSquare, Clock, LayoutDashboard, Loader2 } from 'lucide-react';

const WS = 'vTiqcjUPSf';

// Le HTML généré par Dust charge Recharts (UMD) mais oublie sa dépendance
// `prop-types` → Recharts ne s'initialise pas et le dashboard reste blanc.
// On injecte prop-types juste avant Recharts pour réparer le rendu.
function patchDashboardHtml(raw) {
  if (!raw || raw.includes('prop-types')) return raw;
  return raw.replace(
    /(<script\s+src="https:\/\/unpkg\.com\/recharts)/i,
    '<script src="https://unpkg.com/prop-types@15/prop-types.min.js"></script>\n  $1'
  );
}

function TabBtn({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all
        ${active
          ? 'border-violet-500 text-white'
          : 'border-transparent text-gray-500 hover:text-gray-300'}`}
    >
      {icon} {label}
    </button>
  );
}

export function SynthesisDashboard({ state, period }) {
  const [copied, setCopied] = useState(false);
  // Dashboard HTML interactif autonome généré par Dust (sans login).
  const fileId = state?.dashboardFileId ?? null;
  const hasInteractive = !!fileId;
  const [tab, setTab] = useState('report');           // 'report' | 'interactive'
  const [html, setHtml] = useState(null);
  const [htmlLoading, setHtmlLoading] = useState(false);
  const [htmlError, setHtmlError] = useState(null);

  // À l'ouverture d'un rapport : si un dashboard existe, l'afficher d'emblée.
  useEffect(() => { setHtml(null); setTab(fileId ? 'interactive' : 'report'); }, [state?.conversationId, fileId]);

  // Récupère le HTML via le proxy (suit le 302 GCS, retire l'en-tête attachment).
  useEffect(() => {
    if (tab !== 'interactive' || !fileId || html) return;
    setHtmlLoading(true);
    setHtmlError(null);
    fetch(`/api/dust/w/${WS}/files/${fileId}?action=view`)
      .then(r => r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(raw => setHtml(patchDashboardHtml(raw)))
      .catch(e => setHtmlError(e.message))
      .finally(() => setHtmlLoading(false));
  }, [tab, fileId, html]);

  const startLabel = period?.start ? new Date(period.start).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
  const endLabel   = period?.end   ? new Date(period.end).toLocaleDateString('fr-FR',   { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

  const dustUrl = state?.conversationId
    ? `https://app.dust.tt/w/vTiqcjUPSf/assistant/${state.conversationId}`
    : null;

  const wordCount = state?.text ? state.text.split(/\s+/).length : 0;
  const readTime  = Math.max(1, Math.round(wordCount / 200));

  function handleCopy() {
    if (!state?.text) return;
    navigator.clipboard.writeText(state.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!state?.text) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-5xl">📭</div>
          <div className="text-lg font-semibold text-gray-400">Aucun rapport disponible</div>
          <div className="mt-2 text-sm text-gray-600">Lance un workflow pour générer une analyse.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">

      {/* ── Header bande ── */}
      <div className="border-b border-white/8 bg-gray-900/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-6 py-6">

          <div className="flex flex-wrap items-start justify-between gap-4">
            {/* Titre + méta */}
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-2">
                <FileText size={12} /> Rapport MacroSynthAI
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Analyse Macro — {startLabel} → {endLabel}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={12} />
                  {startLabel} → {endLabel}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={12} />
                  ~{readTime} min de lecture
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageSquare size={12} />
                  {wordCount.toLocaleString()} mots
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-300 transition-all hover:bg-white/10"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? 'Copié !' : 'Copier'}
              </button>
              {dustUrl && (
                <a
                  href={dustUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-xs font-semibold text-violet-400 transition-all hover:bg-violet-500/20"
                >
                  <ExternalLink size={14} />
                  Ouvrir dans Dust
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Onglets ── */}
      {hasInteractive && (
        <div className="border-b border-white/8 bg-gray-900/40 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl gap-1 px-6">
            <TabBtn active={tab === 'report'}      onClick={() => setTab('report')}      icon={<FileText size={14} />}        label="Rapport" />
            <TabBtn active={tab === 'interactive'} onClick={() => setTab('interactive')} icon={<LayoutDashboard size={14} />} label="Dashboard interactif" />
          </div>
        </div>
      )}

      {/* ── Dashboard interactif (HTML autonome généré par Dust) ── */}
      {tab === 'interactive' && hasInteractive && (
        <div className="mx-auto max-w-7xl px-6 py-6">
          {htmlLoading && (
            <div className="flex items-center justify-center gap-2 py-24 text-sm text-gray-400">
              <Loader2 size={16} className="animate-spin" /> Chargement du dashboard interactif…
            </div>
          )}
          {htmlError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
              Impossible de charger le dashboard interactif : {htmlError}
            </div>
          )}
          {html && !htmlLoading && (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
              <iframe
                title="Dashboard interactif MacroSynthAI"
                srcDoc={html}
                sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
                className="h-[calc(100vh-180px)] w-full border-0"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Rapport (markdown) ── */}
      {tab === 'report' && (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-2xl border border-white/8 bg-gray-900/60 p-8 backdrop-blur-xl shadow-2xl">
          <div className="prose prose-invert prose-sm max-w-none
            prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-white
            prose-h1:text-2xl prose-h2:text-xl prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-2
            prose-h3:text-base prose-h3:text-violet-300
            prose-p:text-gray-300 prose-p:leading-relaxed
            prose-strong:text-white prose-strong:font-semibold
            prose-ul:text-gray-300 prose-ol:text-gray-300
            prose-li:marker:text-violet-400
            prose-blockquote:border-l-violet-500 prose-blockquote:text-gray-400 prose-blockquote:bg-white/3 prose-blockquote:rounded-r-lg prose-blockquote:py-1
            prose-code:text-teal-300 prose-code:bg-white/8 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-xs
            prose-pre:bg-gray-950 prose-pre:border prose-pre:border-white/10
            prose-table:text-gray-300
            prose-th:text-white prose-th:border-white/15
            prose-td:border-white/8
            prose-hr:border-white/10
            prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
          ">
            <ReactMarkdown>{state.text}</ReactMarkdown>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between rounded-xl border border-white/8 bg-white/3 px-5 py-3 text-xs text-gray-600">
          <span>Généré par MacroSynthAI Orchestrator · {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          {dustUrl && (
            <a href={dustUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gray-600 hover:text-violet-400 transition-colors">
              <ExternalLink size={11} /> Voir dans Dust
            </a>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
