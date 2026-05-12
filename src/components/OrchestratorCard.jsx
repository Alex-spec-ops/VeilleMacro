import React from 'react';
import { RotateCcw, Loader2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge.jsx';
import { ProgressBar } from './ProgressBar.jsx';
import { C } from '../constants.js';

/**
 * OrchestratorCard({ status, progress, currentStep, onLaunch, onReset })
 *
 * Professional command-panel — left accent border, no decorative gradients.
 *
 *  Zone 1 — identity row (icon · title · status badge)
 *  Zone 2 — progress bar (running / done only)
 *  Zone 3 — current step
 *  Zone 4 — action buttons
 */
export function OrchestratorCard({ status, progress, currentStep, onLaunch, onReset }) {
  const isRunning = status === 'running';
  const isSuccess = status === 'success';

  const accentColor = isRunning ? C.blue
                    : isSuccess ? C.statusOk
                    :             C.border;

  const MONO = "'SF Mono','Fira Code','Consolas',monospace";

  return (
    <div
      className={isRunning ? 'running-glow' : 'transition-card'}
      style={{
        background:   C.card,
        borderTop:    `1px solid ${C.border}`,
        borderRight:  `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        borderLeft:   `3px solid ${accentColor}`,
      }}
    >

      {/* ── Zone 1 : Identity ── */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '14px 20px',
          borderBottom:   `1px solid ${C.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Square icon */}
          <div
            style={{
              width:          38,
              height:         38,
              background:     `${C.blue}0d`,
              border:         `1px solid ${isRunning ? C.blue + '44' : C.border}`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              flexShrink:     0,
            }}
          >
            {isRunning
              ? <Loader2 size={18} color={C.blue} className="spin" />
              : <span style={{ fontSize: 20, lineHeight: 1 }}>🎯</span>
            }
          </div>

          <div>
            <div
              style={{
                fontSize:      8,
                fontFamily:    MONO,
                color:         C.textDim,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                marginBottom:  4,
              }}
            >
              Orchestrateur principal
            </div>
            <div
              style={{
                fontSize:      15,
                fontWeight:    700,
                color:         isSuccess ? C.statusOk : C.text,
                letterSpacing: '-0.01em',
              }}
            >
              MacroSynthAI Orchestrator
            </div>
            <div
              style={{
                fontSize:      9,
                fontFamily:    MONO,
                color:         C.textDim,
                marginTop:     3,
                letterSpacing: '0.04em',
              }}
            >
              macro_synthesis_orchestrator
            </div>
          </div>
        </div>

        <StatusBadge status={status} size="md" />
      </div>

      {/* ── Zone 2 : Progress (running / success only) ── */}
      {(isRunning || isSuccess) && (
        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${C.border}` }}>
          <div
            style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'baseline',
              marginBottom:   6,
            }}
          >
            <span
              style={{
                fontSize:   12,
                fontFamily: MONO,
                fontWeight: 700,
                color:      isRunning ? C.blue : C.statusOk,
              }}
            >
              {progress.toFixed(1)}%
            </span>
            <span
              style={{
                fontSize:   9,
                fontFamily: MONO,
                color:      C.textDim,
                letterSpacing: '0.06em',
              }}
            >
              ~75s estimé
            </span>
          </div>
          <ProgressBar
            pct={progress}
            gradient={`linear-gradient(90deg,${C.blue},${C.teal})`}
            color={C.blue}
            h={4}
          />
        </div>
      )}

      {/* ── Zone 3 : Current step ── */}
      <div
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        10,
          padding:    '9px 20px',
          borderBottom: `1px solid ${C.border}`,
          background: C.cardDeep,
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize:   11,
            color:      isRunning ? C.blue : isSuccess ? C.statusOk : C.textDim,
            flexShrink: 0,
          }}
        >
          {isRunning ? '▶' : isSuccess ? '✓' : '○'}
        </span>
        <span
          style={{
            fontSize:   11,
            fontFamily: MONO,
            color:      isRunning ? C.text
                      : isSuccess ? C.statusOk
                      :             C.textDim,
          }}
        >
          {currentStep ?? (isSuccess
            ? 'Workflow terminé avec succès'
            : 'Prêt à démarrer le workflow…'
          )}
        </span>
      </div>

      {/* ── Zone 4 : Buttons ── */}
      <div style={{ display: 'flex', padding: '12px 20px' }}>

        {/* Launch */}
        <button
          className="btn-launch"
          onClick={onLaunch}
          disabled={isRunning}
          style={{
            flex:           1,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            8,
            padding:        '9px 0',
            border:         'none',
            cursor:         isRunning ? 'not-allowed' : 'pointer',
            background:     isRunning ? `${C.blue}1a` : C.blue,
            color:          '#fff',
            fontSize:       12,
            fontFamily:     MONO,
            fontWeight:     700,
            letterSpacing:  '0.06em',
            textTransform:  'uppercase',
            opacity:        isRunning ? 0.5 : 1,
          }}
        >
          {isRunning
            ? <><Loader2 size={12} className="spin" /> Running…</>
            : <>▶ Launch MacroSynthAI</>
          }
        </button>

        {/* Divider */}
        <div style={{ width: 1, background: C.border, flexShrink: 0 }} />

        {/* Reset */}
        <button
          className="btn-reset"
          onClick={onReset}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          6,
            padding:      '9px 18px',
            background:   'transparent',
            border:       'none',
            cursor:       'pointer',
            color:        C.textMuted,
            fontSize:     11,
            fontFamily:   MONO,
            fontWeight:   600,
            letterSpacing:'0.06em',
            textTransform:'uppercase',
          }}
        >
          <RotateCcw size={11} /> Reset
        </button>

      </div>
    </div>
  );
}
