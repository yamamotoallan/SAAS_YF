import './LoadingSkeleton.css';

interface Props {
    rows?: number;
    type?: 'card' | 'table' | 'text' | 'chart';
    className?: string;
}

const LoadingSkeleton = ({ rows = 3, type = 'card', className = '' }: Props) => {
    if (type === 'chart') {
        return (
            <div className={`skeleton-container ${className}`}>
                <div className="skeleton-bar" style={{ height: 200, borderRadius: 12 }} />
            </div>
        );
    }

    if (type === 'table') {
        return (
            <div className={`skeleton-container ${className}`}>
                <div className="skeleton-bar" style={{ height: 40, marginBottom: 8, borderRadius: 8 }} />
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="skeleton-bar" style={{ height: 48, marginBottom: 4, borderRadius: 6 }} />
                ))}
            </div>
        );
    }

    if (type === 'text') {
        return (
            <div className={`skeleton-container ${className}`}>
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="skeleton-bar" style={{
                        height: 14,
                        width: i === rows - 1 ? '60%' : '100%',
                        marginBottom: 10,
                        borderRadius: 4,
                    }} />
                ))}
            </div>
        );
    }

    return (
        <div className={`skeleton-container ${className}`}>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="skeleton-card">
                    <div className="skeleton-bar" style={{ height: 16, width: '70%', marginBottom: 12 }} />
                    <div className="skeleton-bar" style={{ height: 12, width: '90%', marginBottom: 8 }} />
                    <div className="skeleton-bar" style={{ height: 12, width: '50%' }} />
                </div>
            ))}
        </div>
    );
};

export default LoadingSkeleton;
