import React, { useEffect, useRef } from 'react';
import { C, MONO, LOG_COLORS, AGENT_EMOJI } from '../constants.js';
import { useBreakpoint } from '../hooks/useBreakpoint.js';

/**
 * ExecutionLog({ logs })
 *
 * Dark header (gradient #1a1a1a → #2d2d2d) + light content area.
 * Traffic light controls + title in header.
 * Monospace entries with colored log types.
 */
export function ExecutionLog({ logs }) {
  const bottomRef    = useRef(null);
  const { isMobile } = useBreakpoint();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  const formatTs = raw => {
    const d = raw instanceof Date ? raw : new Date(raw);
    return d.toTimeString().slice(0, 8);
  };

  return (
    <div
      style={{
        background:   '#ffffff',
        border:       `2px solid ${C.border}`,
        borderRadius: 16,
        overflow:     'hidden',
        boxShadow:    '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* ── Dark header ── */}
      <div
        style={{
          background:     'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          padding:        '14px 20px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Title + traffic lights */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Traffic lights */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[C.coral, C.sunshine, C.teal].map((c, i) => (
              <span
                key={i}
                style={{
                  width:        13,
                  height:       13,
                  background:   c,
                  borderRadius: '50%',
                  display:      'inline-block',
                  cursor:       'default',
                }}
              />
            ))}
          </div>

          <span
            style={{
              fontSize:      12,
              fontFamily:    MONO,
              fontWeight:    600,
              letterSpacing: '0.08em',
              color:         'rgba(255,255,255,0.7)',
              userSelect:    'none',
            }}
          >
            ▶ Execution Log
          </span>
        </div>

        {/* Entry count */}
        <span
          style={{
            fontSize:      10,
            fontFamily:    MONO,
            color:         'rgba(255,255,255,0.4)',
            background:    'rgba(255,255,255,0.08)',
            padding:       '3px 9px',
            borderRadius:  5,
            letterSpacing: '0.06em',
          }}
        >
          {logs.length} entries
        </span>
      </div>

      {/* ── Scrollable content ── */}
      <div
        aria-live="polite"
        aria-label="Journal d'exécution"
        role="log"
        style={{
          maxHeight:      420,
          overflowY:      'auto',
          padding:        '12px 0 4px',
          background:     '#FAFAFA',
          fontFamily:     MONO,
          fontSize:       12,
        }}
      >
        {logs.length === 0 ? (
          <div
            style={{
              textAlign:  'center',
              color:      C.textDim,
              fontSize:   12,
              padding:    '32px 0',
              fontFamily: MONO,
            }}
          >
            — waiting for workflow to start —
          </div>
        ) : (
          logs.map((entry, i) => {
            const typeColor  = LOG_COLORS[entry.logType] ?? C.textMuted;
            const agentEmoji = AGENT_EMOJI[entry.agent]  ?? '◆';
            const isEven     = i % 2 === 0;

            return (
              <div
                key={entry.id}
                className="animate-slide-in log-row"
                style={{
                  display:    'flex',
                  alignItems: 'baseline',
                  padding:    '4px 20px',
                  lineHeight: 1.6,
                  background: isEven ? '#f7f7f5' : '#ffffff',
                  borderBottom: `1px solid ${C.border}`,
                  gap:        0,
                }}
              >
                {/* Timestamp */}
                <span
                  style={{
                    minWidth:   isMobile ? 58 : 75,
                    color:      '#555555',
                    fontWeight: 600,
                    flexShrink: 0,
                    fontSize:   11,
                  }}
                >
                  {formatTs(entry.timestamp)}
                </span>

                {/* Agent — hidden on mobile */}
                {!isMobile && (
                  <span
                    style={{
                      minWidth:   165,
                      color:      C.blue,
                      fontWeight: 700,
                      flexShrink: 0,
                      fontSize:   11,
                    }}
                  >
                    {agentEmoji} [{entry.agent}]
                  </span>
                )}

                {/* Message */}
                <span
                  style={{
                    flex:      1,
                    color: entry.logType === 'success' ? '#166534'
                         : entry.logType === 'error'   ? '#991b1b'
                         : entry.logType === 'warning' ? '#92400e'
                         : entry.logType === 'info'    ? '#1e40af'
                         :                               '#1f2937',
                    fontWeight:   entry.logType === 'success' || entry.logType === 'error' ? 600 : 400,
                    wordBreak:    'break-word',
                    fontSize:     12,
                  }}
                >
                  {entry.message}
                </span>
              </div>
            );
          })
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
