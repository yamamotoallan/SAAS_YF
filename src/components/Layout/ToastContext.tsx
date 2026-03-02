import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};

let toastId = 0;

const ICON_MAP: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
};

const COLOR_MAP: Record<ToastType, { bg: string; border: string; text: string }> = {
    success: { bg: '#ecfdf5', border: '#10b981', text: '#065f46' },
    error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
    warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
    info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            <div style={{
                position: 'fixed', top: 16, right: 16, zIndex: 10000,
                display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 380,
            }}>
                {toasts.map(t => {
                    const colors = COLOR_MAP[t.type];
                    return (
                        <div
                            key={t.id}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '12px 16px', borderRadius: 10,
                                background: colors.bg, borderLeft: `4px solid ${colors.border}`,
                                color: colors.text, fontSize: '0.875rem', fontWeight: 500,
                                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                                animation: 'toast-slide-in 0.3s ease',
                            }}
                        >
                            <span style={{
                                width: 22, height: 22, borderRadius: '50%',
                                background: colors.border, color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 700, flexShrink: 0,
                            }}>{ICON_MAP[t.type]}</span>
                            <span style={{ flex: 1 }}>{t.message}</span>
                            <button
                                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: colors.text, opacity: 0.6 }}
                            >✕</button>
                        </div>
                    );
                })}
            </div>
            <style>{`
                @keyframes toast-slide-in {
                    from { opacity: 0; transform: translateX(40px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </ToastContext.Provider>
    );
};

export default ToastContext;
