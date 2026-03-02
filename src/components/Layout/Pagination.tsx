import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
}

const Pagination = ({ page, totalPages, total, onPageChange }: Props) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages: (number | '...')[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push('...');
            for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                pages.push(i);
            }
            if (page < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.75rem 0', fontSize: '0.8125rem', color: 'var(--color-text-secondary)',
        }}>
            <span>{total} registro{total !== 1 ? 's' : ''}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-color)',
                        background: 'transparent', cursor: page <= 1 ? 'default' : 'pointer',
                        opacity: page <= 1 ? 0.4 : 1, color: 'var(--color-text)',
                    }}
                    aria-label="Página anterior"
                >
                    <ChevronLeft size={16} />
                </button>

                {getPageNumbers().map((p, i) => (
                    p === '...' ? (
                        <span key={`dots-${i}`} style={{ padding: '0 6px' }}>…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p as number)}
                            style={{
                                width: 32, height: 32, borderRadius: 8, border: 'none',
                                background: p === page ? 'var(--color-primary)' : 'transparent',
                                color: p === page ? 'white' : 'var(--color-text)',
                                fontWeight: p === page ? 700 : 500,
                                cursor: 'pointer', fontSize: '0.8125rem',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            {p}
                        </button>
                    )
                ))}

                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-color)',
                        background: 'transparent', cursor: page >= totalPages ? 'default' : 'pointer',
                        opacity: page >= totalPages ? 0.4 : 1, color: 'var(--color-text)',
                    }}
                    aria-label="Próxima página"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
