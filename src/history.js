const KEY = 'macrosynth_history';
const MAX = 25;

export function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveAnalysis(entry) {
  const list = loadHistory();
  list.unshift(entry);
  if (list.length > MAX) list.splice(MAX);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function deleteAnalysis(id) {
  const list = loadHistory().filter(e => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function clearHistory() {
  localStorage.removeItem(KEY);
}
