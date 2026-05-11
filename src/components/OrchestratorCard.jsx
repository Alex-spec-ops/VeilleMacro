import React from 'react';
import { RotateCcw, Loader2, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge.jsx';
import { ProgressBar } from './ProgressBar.jsx';
import { C } from '../constants.js';

/**
 * OrchestratorCard({ status, progress, currentStep, onLaunch, onReset })
 *
 * status:      'idle' | 'running' | 'success' | 'error'
 * progress:    0–100 (drives the gradient progress bar)
 * currentStep: string describing the active step, or null
 * onLaunch:    () => void — starts the workflow
 * onReset:     () => void — resets state
 */
export function OrchestratorCard({ status, progress, currentStep, onLaunch, onReset }) {
  const isRunning  = status === 'running';
  const isSuccess  = status === 'success';

  const borderColor = isRunning  ? `${C.pink}88`
                    : isSuccess  ? `${C.statusOk}66`
                    :              `${C.pink}33`;

  const glowColor   = isRunning  ? `${C.pink}40`
                    : isSuccess  ? `${C.statusOk}30`
                    :              'transparent';

  return (
    <div
      style={{
        background:  C.card,
        border:      `1.5px solid ${borderColor}`,
        borderRadius: 20,
        padding:     '28px 32px',
        position:    'relative',
        overflow:    'hidden',
        boxShadow:   `0 0 48px -8px ${glowColor}`,
        transition:  'box-shadow 0.5s ease, border-color 0.4s ease',
      }}
    >
      {/* ── Background decorations ── */}
      <div
        style={{
          position:        'absolute', inset: 0, opacity: 0.025, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize:  '40px 40px',
        }}
      />
      <div
        style={{
          position: 'absolute', top: -60, right: -60,
          width: 200, height: 200, borderRadius: '50%',
          background:   `radial-gradient(circle,${C.pink}18 0%,transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative' }}>

        {/* ── Identity row ── */}
        <div
          style={{
            display:        'flex',
            alignItems:     'flex-start',
            justifyContent: 'space-between',
            marginBottom:   20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Icon */}
            <div style={{ position: 'relative' }}>
              {isRunning && (
                <span
                  className="pulse-ring"
                  style={{
                    position:     'absolute', inset: -7,
                    borderRadius: '50%',
                    border:       `2px solid ${C.pink}`,
                  }}
                />
              )}
              <div
                style={{
                  width:          54,
                  height:         54,
                  borderRadius:   16,
                  background:     `linear-gradient(135deg,${C.pink}22,${C.violet}22)`,
                  border:         `1.5px solid ${isRunning ? C.pink + '66' : C.pink + '33'}`,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       26,
                }}
              >
                {isRunning
                  ? <Loader2 size={24} color={C.pink} className="spin" />
                  : '🎯'}
              </div>
            </div>

            {/* Title */}
            <div>
              <div
                style={{
                  fontSize:      10,
                  color:         C.textMuted,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  marginBottom:  4,
                }}
              >
                Orchestrateur principal
              </div>
              <div
                className={isRunning ? 'shimmer-text' : ''}
                style={{
                  fontSize:      19,
                  fontWeight:    800,
                  letterSpacing: '-0.01em',
                  color:         isRunning ? undefined : isSuccess ? C.statusOk : C.text,
                }}
              >
                🎯 Orchestrator
              </div>
              <div
                style={{
                  fontSize:    11,
                  color:       C.textMuted,
                  fontFamily:  'monospace',
                  marginTop:   3,
                }}
              >
                macro_synthesis_orchestrator
              </div>
            </div>
          </div>

          <StatusBadge status={status} size="md" />
        </div>

        {/* ── Progress bar (visible when running or done) ── */}
        {(isRunning || isSuccess) && (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                display:        'flex',
                justifyContent: 'space-between',
                marginBottom:   8,
              }}
            >
              <span
                style={{
                  fontSize:   12,
                  fontWeight: 600,
                  color:      isRunning ? C.pink : C.statusOk,
                }}
              >
                {progress.toFixed(1)}%
              </span>
              <span style={{ fontSize: 11, color: C.textMuted }}>
                {isSuccess ? '~56.5s total' : '~56.5s estimé'}
              </span>
            </div>
            <ProgressBar
              pct={progress}
              gradient="linear-gradient(90deg,#ec4899,#8b5cf6,#3b82f6)"
              color={C.pink}
              h={8}
            />
          </div>
        )}

        {/* ── Current step ── */}
        <div
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          8,
            background:   `${C.pink}0c`,
            border:       `1px solid ${C.pink}22`,
            borderRadius: 10,
            padding:      '9px 14px',
            marginBottom: 22,
            fontSize:     12,
            fontFamily:   'monospace',
            color:        isRunning ? C.pink : isSuccess ? C.statusOk : C.textMuted,
          }}
        >
          {isRunning
            ? <Loader2 size={11} color={C.pink} className="spin" />
            : isSuccess
              ? <CheckCircle2 size={11} color={C.statusOk} />
              : <span style={{ width: 10, height: 10, borderRadius: '50%', background: C.textDim, display: 'inline-block', flexShrink: 0 }} />
          }
          <span>
            {currentStep ?? (isSuccess ? 'Workflow terminé avec succès ✓' : 'Prêt à démarrer le workflow…')}
          </span>
        </div>

        {/* ── Action buttons ── */}
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Launch */}
          <button
            onClick={onLaunch}
            disabled={isRunning}
            style={{
              flex:           1,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            8,
              padding:        '11px 0',
              borderRadius:   12,
              border:         'none',
              cursor:         isRunning ? 'not-allowed' : 'pointer',
              background:     isRunning
                ? `linear-gradient(135deg,${C.pink}44,${C.blue}44)`
                : 'linear-gradient(135deg,#ec4899,#8b5cf6,#3b82f6)',
              color:          '#fff',
              fontSize:       14,
              fontWeight:     700,
              opacity:        isRunning ? 0.6 : 1,
              boxShadow:      isRunning ? 'none' : '0 4px 20px -4px rgba(236,72,153,0.5)',
              transition:     'opacity 0.2s, box-shadow 0.2s, transform 0.1s',
            }}
            onMouseDown={e => { if (!isRunning) e.currentTarget.style.transform = 'scale(0.98)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {isRunning
              ? <><Loader2 size={15} className="spin" /> Running…</>
              : <>🚀 Launch MacroSynthAI</>}
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          6,
              padding:      '11px 18px',
              borderRadius: 12,
              background:   'transparent',
              border:       `1px solid ${C.border}`,
              cursor:       'pointer',
              color:        C.textMuted,
              fontSize:     13,
              fontWeight:   600,
              transition:   'border-color 0.2s, color 0.2s, transform 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.text; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>

      </div>
    </div>
  );
}
