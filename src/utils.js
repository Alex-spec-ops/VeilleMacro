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
