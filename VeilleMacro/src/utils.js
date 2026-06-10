export function fmtS(ms) {
  if (ms == null) return '0.0s';
  return `${(ms / 1000).toFixed(1)}s`;
}

// Durée en minutes (1 décimale) — utilisé pour les estimations/temps des agents.
export function fmtMin(ms) {
  if (ms == null) return '0 min';
  return `${(ms / 60_000).toFixed(1)} min`;
}

export function timeAgo(date) {
  if (!date) return null;
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `Il y a ${hrs}h`;
  return `Il y a ${Math.floor(hrs / 24)}j`;
}

export function nanoid() {
  return Math.random().toString(36).slice(2, 11);
}
