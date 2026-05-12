import React, { useEffect, useRef } from 'react';
import { C, LOG_COLORS, AGENT_EMOJI } from '../constants.js';

/**
 * ExecutionLog({ logs })
 *
 * logs: Array<{
 *   id:        number,
 *   timestamp: Date | number,
 *   agent:     string,
 *   message:   string,
 *   logType:   'info' | 'success' | 'warning' | 'error',
 * }>
 *
 * Renders a scrollable log panel that auto-scrolls to the
 * latest entry on every new addition.
 *
 * Row format:  [HH:MM:SS]  [emoji]  [agent]  message
 * Colour:      timestamp→dim, agent→logType colour, message→type colour
 */
export function ExecutionLog({ logs }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom whenever a new entry is appended
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  /* ── Timestamp helper ── */
  function formatTs(raw) {
    const d = raw instanceof Date ? raw : new Date(raw);
    return d.toTimeString().slice(0, 8);
  }

  return (
    <div
      style={{
        background:   C.card,
        border:       `1px solid ${C.border}`,
        borderRadius: 16,
        overflow:     'hidden',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          padding:      '12px 20px',
          borderBottom: `1px solid ${C.border}`,
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>📋</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
            Execution Log
          </span>
        </div>
        <span
          style={{
            fontSize:   11,
            color:      C.textMuted,
            background: C.cardDeep,
            border:     `1px solid ${C.border}`,
            padding:    '2px 8px',
            borderRadius: 6,
          }}
        >
          {logs.length} entries
        </span>
      </div>

      {/* Scrollable body */}
      <div
        style={{
          maxHeight:     300,
          overflowY:     'auto',
          padding:       '4px 0',
          scrollbarWidth: 'thin',
          scrollbarColor: `${C.border} transparent`,
        }}
      >
        {logs.length === 0 ? (
          <div
            style={{
              textAlign:  'center',
              color:      C.textDim,
              fontSize:   12,
              padding:    '36px 0',
              fontStyle:  'italic',
            }}
          >
            Waiting for workflow to start…
          </div>
        ) : (
          logs.map((entry, i) => {
            const typeColor  = LOG_COLORS[entry.logType] ?? C.text;
            const agentEmoji = AGENT_EMOJI[entry.agent]  ?? '🤖';

            return (
              <div
                key={entry.id}
                className="animate-fade-in"
                style={{
                  display:      'flex',
                  alignItems:   'baseline',
                  padding:      '5px 20px',
                  borderBottom: i < logs.length - 1 ? `1px solid ${C.border}33` : 'none',
                  fontFamily:   'monospace',
                  fontSize:     11,
                  lineHeight:   1.6,
                }}
              >
                {/* [HH:MM:SS] */}
                <span style={{ color: C.textDim, flexShrink: 0, marginRight: 8 }}>
                  [{formatTs(entry.timestamp)}]
                </span>

                {/* emoji (type indicator) */}
                <span style={{ fontSize: 13, flexShrink: 0, marginRight: 6, lineHeight: 1 }}>
                  {agentEmoji}
                </span>

                {/* [agent] */}
                <span
                  style={{
                    color:      typeColor,
                    fontWeight: 700,
                    flexShrink: 0,
                    minWidth:   220,
                    marginRight: 8,
                  }}
                >
                  [{entry.agent}]
                </span>

                {/* message — coloured by log type */}
                <span
                  style={{
                    color: entry.logType === 'success' ? C.statusOk
                         : entry.logType === 'error'   ? C.statusErr
                         : entry.logType === 'warning' ? C.statusWarn
                         :                               C.text,
                  }}
                >
                  {entry.message}
                </span>
              </div>
            );
          })
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
