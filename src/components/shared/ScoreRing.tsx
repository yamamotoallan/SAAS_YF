const ScoreRing = ({ score }: { score: number }) => {
    const r = 52;
    const circ = 2 * Math.PI * r;
    const pct = Math.min(score, 100) / 100;
    const offset = circ - pct * circ;
    const color = score >= 70 ? 'var(--color-success, #22c55e)' : score >= 50 ? 'var(--color-warning, #f59e0b)' : 'var(--color-danger, #ef4444)';
    
    return (
        <svg width="130" height="130" viewBox="0 0 130 130" className="sge-ring">
            <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="9" />
            <circle
                cx="65" cy="65" r={r} fill="none"
                stroke={color} strokeWidth="9"
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 65 65)"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
            <text x="65" y="58" textAnchor="middle" fontSize="28" fontWeight="800" fill="white">{score}</text>
            <text x="65" y="76" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.7)">/ 100</text>
        </svg>
    );
};

export default ScoreRing;
