/* ─────────────────────────────────────────────
   DESIGN TOKENS  —  veille-macro-ux-design.md
   Palette professionnelle : navy, green, amber, red
───────────────────────────────────────────── */
export const C = {
  /* ── Backgrounds ── */
  bg:         '#F9FAFB',   // cool light gray (UX doc)
  card:       '#ffffff',
  cardDeep:   '#F3F4F6',
  surface:    '#F9FAFB',

  /* ── Borders ── */
  border:    '#E5E7EB',
  borderHi:  '#D1D5DB',
  borderDim: '#F3F4F6',

  /* ── Text ── */
  text:      '#111827',
  textMuted: '#374151',
  textDim:   '#9CA3AF',

  /* ── Sidebar / dark surfaces ── */
  sidebarText:       '#ffffff',
  sidebarTextMuted:  '#CBD5E1',
  sidebarTextDim:    '#94A3B8',

  /* ── Status ── */
  statusIdle: '#9CA3AF',
  statusPend: '#F59E0B',   // accent
  statusRun:  '#1E3A8A',   // primary
  statusOk:   '#10B981',   // secondary
  statusErr:  '#EF4444',   // danger
  statusWarn: '#F59E0B',   // accent

  /* ── Brand Palette  (veille-macro-ux-design.md) ── */
  blue:      '#1E3A8A',   // Primaire — confiance, stabilité
  emerald:   '#10B981',   // Secondaire — positif, croissance
  forest:    '#059669',   // success text (WCAG AA on white)
  orange:    '#F59E0B',   // Accent — alertes, attention
  coral:     '#EF4444',   // Danger — risques, baisse
  sunshine:  '#FBBF24',   // progress bar (amber-400)
  teal:      '#0D9488',   // Dashboard accent
  purple:    '#7C3AED',   // Orchestrator gradient end

  /* ── KPI badges ── */
  badgeGreenBg:   '#ECFDF5',
  badgeGreenText: '#059669',
  badgeRedBg:     '#FEF2F2',
  badgeRedText:   '#DC2626',
  badgeBlueBg:    '#EFF6FF',
  badgeBlueText:  '#1E3A8A',
};

/* ── Monospace font (JetBrains Mono — veille-macro-ux-design.md) ── */
export const MONO = "'JetBrains Mono','Monaco','Courier New',monospace";

/* ─────────────────────────────────────────────
   LOG TYPE → COLOR
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
