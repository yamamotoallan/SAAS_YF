import { useRef, useEffect } from 'react';
import Modal from './Modal';

interface Props {
    isOpen: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

const ConfirmDialog = ({
    isOpen, title = 'Confirmar ação', message,
    confirmLabel = 'Confirmar', cancelLabel = 'Cancelar',
    variant = 'danger', onConfirm, onCancel, loading = false,
}: Props) => {
    const confirmRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen && confirmRef.current) {
            // Focus cancel instead of confirm for safety
        }
    }, [isOpen]);

    const variantColors: Record<string, string> = {
        danger: 'var(--color-danger, #ef4444)',
        warning: 'var(--color-warning, #f59e0b)',
        primary: 'var(--color-primary, #6366f1)',
    };

    return (
        <Modal isOpen={isOpen} onClose={onCancel} title={title}>
            <div style={{ padding: '0.5rem 0 1.5rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {message}
                </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                    onClick={onCancel}
                    disabled={loading}
                    style={{
                        padding: '0.5rem 1.25rem', borderRadius: '0.5rem',
                        border: '1px solid var(--border-color)', background: 'transparent',
                        color: 'var(--color-text)', fontSize: '0.875rem',
                        cursor: 'pointer', fontWeight: 500,
                    }}
                >
                    {cancelLabel}
                </button>
                <button
                    ref={confirmRef}
                    onClick={onConfirm}
                    disabled={loading}
                    style={{
                        padding: '0.5rem 1.25rem', borderRadius: '0.5rem',
                        border: 'none', background: variantColors[variant],
                        color: 'white', fontSize: '0.875rem',
                        cursor: loading ? 'wait' : 'pointer', fontWeight: 600,
                        opacity: loading ? 0.7 : 1,
                    }}
                >
                    {loading ? 'Processando...' : confirmLabel}
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
