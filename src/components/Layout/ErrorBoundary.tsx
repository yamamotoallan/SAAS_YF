import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', minHeight: '50vh', gap: '1rem', padding: '2rem',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28
                    }}>⚠️</div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
                        Algo deu errado
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', maxWidth: 400 }}>
                        Ocorreu um erro inesperado. Tente recarregar a página.
                    </p>
                    <button
                        onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
                        style={{
                            padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none',
                            background: 'var(--color-primary)', color: 'white', fontWeight: 600,
                            cursor: 'pointer', fontSize: '0.875rem', marginTop: '0.5rem',
                            transition: 'opacity 0.2s',
                        }}
                        onMouseOver={e => (e.currentTarget.style.opacity = '0.9')}
                        onMouseOut={e => (e.currentTarget.style.opacity = '1')}
                    >
                        Recarregar Página
                    </button>
                    {this.state.error && (
                        <details style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            <summary style={{ cursor: 'pointer' }}>Detalhes do erro</summary>
                            <pre style={{ textAlign: 'left', marginTop: '0.5rem', padding: '0.5rem', background: '#f8f8f8', borderRadius: 4, overflow: 'auto', maxWidth: '80vw' }}>
                                {this.state.error.message}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
