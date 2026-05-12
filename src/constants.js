/* ─────────────────────────────────────────────
   DESIGN TOKENS  —  Blanc & Vibrant Theme
   Stripe / Linear / Notion inspired
───────────────────────────────────────────── */
export const C = {
  /* ── Backgrounds ── */
  bg:         '#fafafa',
  card:       '#ffffff',
  cardDeep:   '#F3F4F6',
  surface:    '#F9FAFB',

  /* ── Borders ── */
  border:    '#f0f0f0',
  borderHi:  '#e5e5e5',
  borderDim: '#f8f8f8',

  /* ── Text ── */
  text:      '#1a1a1a',
  textMuted: '#6B7280',
  textDim:   '#9CA3AF',

  /* ── Status ── */
  statusIdle: '#9CA3AF',
  statusPend: '#FF8E53',
  statusRun:  '#667EEA',
  statusOk:   '#00A86B',
  statusErr:  '#FF6B6B',
  statusWarn: '#FF8E53',

  /* ── Vibrant Brand Palette ── */
  coral:     '#FF6B6B',   // Collector
  orange:    '#FF8E53',   // PDF / pending
  sunshine:  '#FFD93D',   // progress bar
  teal:      '#4ECDC4',   // Dashboard
  emerald:   '#00D9A3',   // success gradient
  forest:    '#00A86B',   // success text
  blue:      '#667EEA',   // Synthesis / orchestrator
  purple:    '#764BA2',   // Orchestrator gradient end
};

/* ─────────────────────────────────────────────
   LOG TYPE → HEX COLOR
───────────────────────────────────────────── */
export const LOG_COLORS = {
  success: C.forest,
  error:   C.coral,
  warning: C.orange,
  info:    C.blue,
};

/* ─────────────────────────────────────────────
   AGENT NAME → EMOJI
───────────────────────────────────────────── */
export const AGENT_EMOJI = {
  Orchestrateur:               '🎯',
  macro_research_collector:    '🔍',
  comparative_synthesis_agent: '⚖️',
  dashboard_generator_agent:   '📊',
  pdf_report_generator:        '📄',
};
