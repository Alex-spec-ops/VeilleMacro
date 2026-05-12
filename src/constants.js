/* ─────────────────────────────────────────────
   DESIGN TOKENS  —  Professional Finance Theme
   Bloomberg-inspired palette, zero border-radius
───────────────────────────────────────────── */
export const C = {
  /* ── Backgrounds ── */
  bg:         '#060e1a',   // near-black navy
  card:       '#091523',   // panel background
  cardDeep:   '#050c16',   // inset / nested surfaces
  surface:    '#0e2240',   // slightly raised surface

  /* ── Borders ── */
  border:     '#152438',   // default border
  borderHi:   '#1d3555',   // hover / highlighted border
  borderDim:  '#0b1a2c',   // recessed border

  /* ── Text ── */
  text:       '#c5d4e8',   // primary text
  textMuted:  '#6380a0',   // secondary text
  textDim:    '#2c4460',   // tertiary / disabled

  /* ── Status ── */
  statusIdle: '#2c4460',
  statusPend: '#d97706',
  statusRun:  '#1668db',
  statusOk:   '#059669',
  statusErr:  '#dc2626',
  statusWarn: '#d97706',

  /* ── Brand / Accent ── */
  blue:   '#1668db',   // primary brand blue
  teal:   '#0891b2',   // secondary accent
  green:  '#059669',   // success / bullish
  amber:  '#d97706',   // warning / pending
  red:    '#dc2626',   // error / bearish
};

/* ─────────────────────────────────────────────
   LOG TYPE → HEX COLOR
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
  Orchestrateur:               '🎯',
  macro_research_collector:    '🔍',
  comparative_synthesis_agent: '⚖️',
  dashboard_generator_agent:   '📊',
  pdf_report_generator:        '📄',
};
