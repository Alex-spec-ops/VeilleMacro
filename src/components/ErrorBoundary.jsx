import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f9fafb', fontFamily: "'Inter','Helvetica Neue',sans-serif", padding: 24,
      }}>
        <div style={{
          background: '#fff', borderRadius: 16, maxWidth: 480, width: '100%',
          textAlign: 'center', padding: '52px 48px',
          border: '1px solid #fca5a5', borderTop: '4px solid #dc2626',
          boxShadow: '0 8px 32px rgba(220,38,38,0.08)',
        }}>
          <div style={{ fontSize: 44, marginBottom: 20 }}>⚠️</div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Erreur d'analyse
          </h2>

          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.75, margin: '0 0 28px' }}>
            Une erreur inattendue s'est produite. Veuillez rafraîchir la page.
          </p>

          <div style={{
            background: '#fef2f2', borderRadius: 8, padding: '12px 16px',
            marginBottom: 28, textAlign: 'left',
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
              Détail technique
            </div>
            <div style={{ fontSize: 11, color: '#7f1d1d', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.6 }}>
              {this.state.error.message}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#1d4ed8', color: '#fff', border: 'none',
                padding: '11px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              🔄 Rafraîchir
            </button>
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              background: '#f3f4f6', color: '#374151',
              padding: '11px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            }}>
              📧 Contacter le développeur
            </div>
          </div>
        </div>
      </div>
    );
  }
}
