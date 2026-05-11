/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
export const C = {
  bg:         '#0f172a',
  card:       '#1e293b',
  cardDeep:   '#162032',
  border:     '#334155',
  text:       '#f1f5f9',
  textMuted:  '#94a3b8',
  textDim:    '#475569',
  statusIdle: '#6b7280',
  statusPend: '#f59e0b',
  statusRun:  '#3b82f6',
  statusOk:   '#10b981',
  statusErr:  '#ef4444',
  statusWarn: '#f59e0b',
  blue:       '#3b82f6',
  violet:     '#8b5cf6',
  green:      '#10b981',
  amber:      '#f59e0b',
  pink:       '#ec4899',
  sky:        '#0ea5e9',
};

/* ─────────────────────────────────────────────
   LOG TYPE → COLOR
───────────────────────────────────────────── */
export const LOG_COLORS = {
  success: C.statusOk,
  error:   C.statusErr,
  warning: C.statusWarn,
  info:    C.statusRun,
};

/* ─────────────────────────────────────────────
   AGENT NAME → EMOJI
───────────────────────────────────────────── */
export const AGENT_EMOJI = {
  Orchestrateur:                '🎯',
  macro_research_collector:     '🔍',
  comparative_synthesis_agent:  '⚖️',
  dashboard_generator_agent:    '📊',
  pdf_report_generator:         '📄',
};
