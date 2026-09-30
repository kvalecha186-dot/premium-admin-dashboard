import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Starfix Admin Caught Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            margin: '24px auto',
            maxWidth: 720,
            padding: 32,
            borderRadius: 14,
            background: 'linear-gradient(160deg, #10163A 0%, #070A1E 100%)',
            border: '1px solid rgba(212,175,55,0.3)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            textAlign: 'center',
            color: '#F7EFD8'
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
          <h2
            style={{
              fontFamily: 'Playfair Display,serif',
              fontSize: 24,
              color: '#F4D67A',
              margin: '0 0 10px'
            }}
          >
            {this.props.fallbackTitle || 'Unable to display this view'}
          </h2>
          <p style={{ fontSize: 13, color: '#8A90AB', maxWidth: 540, margin: '0 auto 18px', lineHeight: 1.6 }}>
            A temporary issue occurred while rendering this section. You can reload or continue navigating through other admin views.
          </p>
          {this.state.error?.message && (
            <div
              style={{
                fontSize: 12,
                color: '#F87171',
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.22)',
                borderRadius: 8,
                padding: '8px 14px',
                display: 'inline-block',
                marginBottom: 20,
                maxWidth: '90%',
                wordBreak: 'break-word'
              }}
            >
              {this.state.error.message}
            </div>
          )}
          <div>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              style={{
                padding: '9px 20px',
                borderRadius: 8,
                border: 0,
                background: 'linear-gradient(135deg,#F4D67A,#D4AF37)',
                color: '#0A0E1F',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
