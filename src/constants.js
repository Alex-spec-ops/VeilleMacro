/* ─────────────────────────────────────────────
   DESIGN TOKENS  —  Blanc & Vibrant Theme
   Contraste renforcé : textes sombres nets, bordures visibles
───────────────────────────────────────────── */
export const C = {
  /* ── Backgrounds ── */
  bg:         '#f0f0eb',   // warm off-white page
  card:       '#ffffff',   // white cards
  cardDeep:   '#f4f4f0',   // inset / nested surfaces
  surface:    '#f9f9f7',   // slightly raised

  /* ── Borders — assez foncées pour être visibles ── */
  border:    '#d8d8d0',   // medium gray border
  borderHi:  '#b8b8b0',   // hover / highlighted
  borderDim: '#e8e8e0',   // subtle

  /* ── Text — fort contraste sur fond clair ── */
  text:      '#111111',   // quasi-noir
  textMuted: '#444444',   // gris foncé lisible
  textDim:   '#888888',   // tertiaire visible

  /* ── Sidebar / dark surfaces — texte clair ── */
  sidebarText:       '#ffffff',
  sidebarTextMuted:  '#c0c0c0',
  sidebarTextDim:    '#888888',

  /* ── Status ── */
  statusIdle: '#888888',
  statusPend: '#d97706',
  statusRun:  '#2563eb',
  statusOk:   '#16a34a',
  statusErr:  '#dc2626',
  statusWarn: '#d97706',

  /* ── Vibrant Brand Palette ── */
  coral:     '#e53e3e',   // Collector (rouge accessible)
  orange:    '#dd6b20',   // PDF / pending
  sunshine:  '#d69e2e',   // progress bar
  teal:      '#2c7a7b',   // Dashboard
  emerald:   '#276749',   // success gradient
  forest:    '#276749',   // success text (wcag AA on white)
  blue:      '#2563eb',   // Synthesis / orchestrator
  purple:    '#6b46c1',   // Orchestrator gradient end

  /* ── KPI delta badges ── */
  badgeGreenBg:   '#dcfce7',
  badgeGreenText: '#15803d',   // dark green on light green
  badgeRedBg:     '#fee2e2',
  badgeRedText:   '#b91c1c',   // dark red on light red
  badgeBlueBg:    '#dbeafe',
  badgeBlueText:  '#1d4ed8',
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
