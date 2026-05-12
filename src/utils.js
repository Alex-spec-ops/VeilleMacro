/**
 * Format milliseconds as "X.Xs"
 */
export function fmtS(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Format milliseconds as "MM:SS.cs"
 */
export function fmtClock(ms) {
  const s  = Math.floor(ms / 1000);
  const cs = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}.${cs}`;
}

/**
 * Format a timestamp as "Xs ago", "Xm ago", etc.
 * Returns null when ts is falsy.
 */
export function timeAgo(ts) {
  if (!ts) return null;
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5)    return 'just now';
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

/**
 * Infer log type from the leading emoji of a message.
 *   ✅  →  'success'
 *   ❌  →  'error'
 *   ⚠️  →  'warning'
 *   *   →  'info'
 */
export function inferLogType(msg) {
  if (msg.startsWith('✅')) return 'success';
  if (msg.startsWith('❌')) return 'error';
  if (msg.startsWith('⚠️')) return 'warning';
  return 'info';
}

/* ─────────────────────────────────────────────
   ADDED HELPERS
───────────────────────────────────────────── */

/**
 * Promise-based sleep.
 */
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Format a timestamp as "Xs ago" / "Xm ago" / "Xh ago".
 * Returns '' (empty string) when date is falsy.
 * Uses includes() so it can match emojis anywhere in the message.
 */
export function formatTimeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - date) / 1000);
  if (seconds < 60)  return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)  return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

/**
 * Infer log type by scanning the full message (includes, not startsWith).
 * Companion to inferLogType — prefer inferLogType for messages with leading emojis.
 */
export function getLogType(message) {
  if (message.includes('✅')) return 'success';
  if (message.includes('❌')) return 'error';
  if (message.includes('⚠️')) return 'warning';
  return 'info';
}

/**
 * Return the canonical emoji icon for a log type.
 */
export function getLogIcon(type) {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  return icons[type] ?? '•';
}

/**
 * Return a hex colour for a log type.
 * NOTE: no Tailwind in this project — returns design-token hex values,
 * not Tailwind class strings.
 */
export function getLogColor(type) {
  const colors = {
    success: '#10b981',  // C.statusOk  (≈ text-green-400)
    error:   '#ef4444',  // C.statusErr (≈ text-red-400)
    warning: '#f59e0b',  // C.statusWarn (≈ text-amber-400)
    info:    '#3b82f6',  // C.statusRun  (≈ text-blue-400)
  };
  return colors[type] ?? '#94a3b8';  // C.textMuted (≈ text-slate-400)
}
