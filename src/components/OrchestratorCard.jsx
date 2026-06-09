import React from 'react';
import { RotateCcw, Loader2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge.jsx';
import { C, MONO } from '../constants.js';
import { useBreakpoint } from '../hooks/useBreakpoint.js';

/**
 * OrchestratorCard({ status, progress, currentStep, onLaunch, onReset })
 *
 * Gradient hero section — purple-to-blue, vibrant Stripe-style.
 * Rotating radial glow in background.
 */
export function OrchestratorCard({ status, progress, currentStep, onLaunch, onReset, onViewResults, canLaunch = true }) {
  const isRunning   = status === 'running';
  const isSuccess   = status === 'success';
  const isIdle      = status === 'idle';
  const launchReady = canLaunch && !isRunning;
  const { isMobile } = useBreakpoint();

  return (
    <div
      style={{
        background:   `linear-gradient(135deg, ${C.blue} 0%, ${C.purple} 100%)`,
        borderRadius: 20,
        padding:      isMobile ? '24px 20px' : '32px 36px',
        boxShadow:    '0 20px 40px rgba(102, 126, 234, 0.28)',
        position:     'relative',
        overflow:     'hidden',
      }}
    >
      {/* Rotating radial glow */}
      <div
        style={{
          position:      'absolute',
          top:           '-50%',
          right:         '-50%',
          width:         '200%',
          height:        '200%',
          background:    'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 65%)',
          animation:     'rotate 25s linear infinite',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Identity row ── */}
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            marginBottom:   24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Icon */}
            <div
              style={{
                width:          54,
                height:         54,
                background:     'rgba(255,255,255,0.14)',
                borderRadius:   14,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       28,
                flexShrink:     0,
                border:         '1px solid rgba(255,255,255,0.18)',
                backdropFilter: 'blur(8px)',
              }}
            >
              {isRunning
                ? <Loader2 size={24} color="#ffffff" className="spin" />
                : <span style={{ lineHeight: 1 }}>🎯</span>
              }
            </div>

            <div>
              <div
                style={{
                  fontSize:      10,
                  color:         'rgba(255,255,255,0.82)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  marginBottom:  4,
                }}
              >
                Orchestrateur principal
              </div>
              <div
                style={{
                  fontSize:      20,
                  fontWeight:    800,
                  color:         '#ffffff',
                  letterSpacing: '-0.02em',
                }}
              >
                MacroSynthAI Orchestrator
              </div>
              <div
                style={{
                  fontSize:   10,
                  fontFamily: MONO,
                  color:      'rgba(255,255,255,0.75)',
                  marginTop:  3,
                }}
              >
                macro_synthesis_orchestrator
              </div>
            </div>
          </div>

          <StatusBadge status={status} size="md" />
        </div>

        {/* ── Progress (running / success) ── */}
        {(isRunning || isSuccess) && (
          <div style={{ marginBottom: 22 }}>
            <div
              style={{
                display:        'flex',
                justifyContent: 'space-between',
                alignItems:     'center',
                marginBottom:   10,
              }}
            >
              <span
                style={{
                  fontSize:  13,
                  fontWeight: 600,
                  color:     'rgba(255,255,255,0.8)',
                }}
              >
                Workflow Progress
              </span>
              <span
                style={{
                  fontSize:   16,
                  fontWeight: 800,
                  color:      '#ffffff',
                }}
              >
                {progress.toFixed(1)}%
              </span>
            </div>

            {/* Bar track */}
            <div
              style={{
                width:          '100%',
                height:         10,
                background:     'rgba(255,255,255,0.18)',
                borderRadius:   100,
                overflow:       'hidden',
              }}
            >
              <div
                style={{
                  height:       '100%',
                  width:        `${progress}%`,
                  background:   `linear-gradient(90deg, ${C.sunshine} 0%, ${C.coral} 50%, ${C.teal} 100%)`,
                  borderRadius: 100,
                  transition:   'width 500ms ease-out',
                  boxShadow:    '0 0 16px rgba(255,255,255,0.35)',
                  position:     'relative',
                  overflow:     'hidden',
                }}
              >
                <span
                  style={{
                    position:   'absolute',
                    inset:      0,
                    background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.32),transparent)',
                    animation:  'shimmer 2s infinite',
                  }}
                />
              </div>
            </div>

            {/* Current step */}
            {currentStep && (
              <div
                style={{
                  marginTop:  10,
                  fontSize:   11,
                  fontFamily: MONO,
                  color:      'rgba(255,255,255,0.88)',
                }}
              >
                ▶ {currentStep}
              </div>
            )}
            {isSuccess && !currentStep && (
              <div
                style={{
                  marginTop:  10,
                  fontSize:   11,
                  fontFamily: MONO,
                  color:      'rgba(255,255,255,0.75)',
                }}
              >
                ✓ Workflow terminé avec succès
              </div>
            )}
          </div>
        )}

        {/* Idle hint */}
        {isIdle && (
          <div
            style={{
              marginBottom: 22,
              fontSize:     12,
              fontFamily:   MONO,
              color:        'rgba(255,255,255,0.75)',
            }}
          >
            ○ Prêt à démarrer le workflow…
          </div>
        )}

        {/* ── Actions ── */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 10 : 14 }}>

          {/* Launch */}
          <button
            className="btn-launch"
            onClick={isSuccess ? onViewResults : onLaunch}
            disabled={!launchReady}
            title={!canLaunch && !isRunning ? 'Sélectionnez une période d\'analyse pour démarrer' : undefined}
            style={{
              flex:           1,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            10,
              padding:        '14px 24px',
              background:     !launchReady ? 'rgba(255,255,255,0.14)' : '#ffffff',
              color:          !launchReady ? 'rgba(255,255,255,0.45)' : C.blue,
              border:         'none',
              borderRadius:   12,
              fontSize:       14,
              fontWeight:     700,
              cursor:         launchReady ? 'pointer' : 'not-allowed',
              boxShadow:      launchReady ? '0 4px 16px rgba(0,0,0,0.18)' : 'none',
              opacity:        launchReady ? 1 : 0.6,
            }}
          >
            {isRunning
              ? <><Loader2 size={16} color="rgba(255,255,255,0.7)" className="spin" /> Running…</>
              : isSuccess
                ? <><span style={{ fontSize: 18 }}>📊</span> Consulter le Dashboard</>
                : !canLaunch
                  ? <>📅 Sélectionnez une période</>
                  : <>🚀 Launch MacroSynthAI</>
            }
          </button>

          {isSuccess && (
            <button
              onClick={onViewResults}
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            10,
                padding:        '14px 28px',
                background:     C.emerald,
                color:          '#ffffff',
                border:         'none',
                borderRadius:   12,
                fontSize:       14,
                fontWeight:     700,
                cursor:         'pointer',
                boxShadow:      '0 8px 24px rgba(0, 217, 163, 0.35)',
              }}
            >
              📊 Consulter le Rapport
            </button>
          )}

          {/* Reset */}
          <button
            className="btn-ghost-white"
            onClick={onReset}
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            8,
              padding:        '14px 22px',
              background:     'rgba(255,255,255,0.13)',
              color:          '#ffffff',
              border:         '1.5px solid rgba(255,255,255,0.25)',
              borderRadius:   12,
              fontSize:       13,
              fontWeight:     600,
              cursor:         'pointer',
            }}
          >
            <RotateCcw size={14} /> Reset
          </button>

        </div>
      </div>
    </div>
  );
}
