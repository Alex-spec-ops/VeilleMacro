import React, { useEffect, useRef } from 'react';
import { C, LOG_COLORS, AGENT_EMOJI } from '../constants.js';

const MONO = "'SF Mono','Fira Code','Consolas',monospace";

/**
 * ExecutionLog({ logs })
 *
 * Terminal-style log panel — clean professional header, aligned columns.
 * Auto-scrolls to latest entry on each new addition.
 *
 * Row format:  [HH:MM:SS]   [agent]   message
 */
export function ExecutionLog({ logs }) {
  const bottomRef = useRef(null);

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
        background: C.card,
        border: `1px solid ${C.border}`,
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: '7px 16px',
          borderBottom: `1px solid ${C.border}`,
          background: C.cardDeep,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontFamily: MONO,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: C.textDim,
          }}
        >
          Execution Log
        </span>

        <span
          style={{
            fontSize: 9,
            fontFamily: MONO,
            color: C.textDim,
            background: C.bg,
            border: `1px solid ${C.border}`,
            padding: '2px 7px',
            letterSpacing: '0.06em',
          }}
        >
          {logs.length} entries
        </span>
      </div>

      {/* ── Column headers ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 16px',
          background: C.cardDeep,
          borderBottom: `1px solid ${C.border}`,
          gap: 0,
        }}
      >
        <span style={{ width: 72, flexShrink: 0, fontSize: 8, fontFamily: MONO, color: C.textDim, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
          Time
        </span>
        <span style={{ width: 214, flexShrink: 0, fontSize: 8, fontFamily: MONO, color: C.textDim, letterSpacing: '0.10em', textTransform: 'uppercase', paddingLeft: 6 }}>
          Agent
        </span>
        <span style={{ flex: 1, fontSize: 8, fontFamily: MONO, color: C.textDim, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
          Message
        </span>
      </div>

      {/* ── Scrollable body ── */}
      <div
        style={{
          maxHeight: 300,
          overflowY: 'auto',
          background: C.bg,
          scrollbarWidth: 'thin',
          scrollbarColor: `${C.border} transparent`,
        }}
      >
        {logs.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: C.textDim,
              fontSize: 11,
              fontFamily: MONO,
              padding: '28px 0',
            }}
          >
            ─ waiting for workflow to start ─
          </div>
        ) : (
          logs.map((entry, i) => {
            const typeColor = LOG_COLORS[entry.logType] ?? C.text;
            const agentEmoji = AGENT_EMOJI[entry.agent] ?? '◆';
            const isEven = i % 2 === 0;

            return (
              <div
                key={entry.id}
                className="animate-fade-in"
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  padding: '3px 16px',
                  fontFamily: MONO,
                  fontSize: 10,
                  lineHeight: 1.6,
                  background: isEven ? C.bg : `${C.cardDeep}99`,
                  borderBottom: `1px solid ${C.border}18`,
                }}
              >
                {/* [HH:MM:SS] */}
                <span
                  style={{
                    width: 72,
                    flexShrink: 0,
                    color: C.textDim,
                    letterSpacing: '0.02em',
                  }}
                >
                  [{formatTs(entry.timestamp)}]
                </span>

                {/* Agent emoji + name */}
                <span
                  style={{
                    width: 214,
                    flexShrink: 0,
                    color: typeColor,
                    fontWeight: 700,
                    paddingLeft: 6,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {agentEmoji} [{entry.agent}]
                </span>

                {/* Message */}
                <span
                  style={{
                    flex: 1,
                    color: entry.logType === 'success' ? C.statusOk
                      : entry.logType === 'error' ? C.statusErr
                        : entry.logType === 'warning' ? C.statusWarn
                          : C.text,
                    wordBreak: 'break-word',
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
