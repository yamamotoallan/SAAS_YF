import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Activity, DollarSign, Clock, Shield, Target,
    AlertTriangle, TrendingUp, TrendingDown, Users,
    ArrowRight, Zap, CheckCircle2, LayoutDashboard, Flame
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { ActivityLog } from '../types/api';
import './Dashboard.css';
import CashFlowChart from '../components/Dashboard/CashFlowChart';

// ── Circular SGE score ring ──────────────────────────────────────────────────
const ScoreRing = ({ score }: { score: number }) => {
    const r = 52;
    const circ = 2 * Math.PI * r;
    const pct = Math.min(score, 100) / 100;
    const offset = circ - pct * circ;
    const color = score >= 70 ? 'var(--color-success)' : score >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';
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

// ── Mini OKR ring ────────────────────────────────────────────────────────────
const OkrRing = ({ progress }: { progress: number }) => {
    const r = 22;
    const circ = 2 * Math.PI * r;
    const offset = circ - (Math.min(progress, 100) / 100) * circ;
    const color = progress >= 70 ? 'var(--color-success)' : progress >= 40 ? 'var(--color-warning)' : 'var(--color-danger)';
    return (
        <svg width="56" height="56" viewBox="0 0 56 56" style={{ flexShrink: 0 }}>
            <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border-color)" strokeWidth="5" />
            <circle
                cx="28" cy="28" r={r} fill="none"
                stroke={color} strokeWidth="5"
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 28 28)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
            <text x="28" y="33" textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>{progress}%</text>
        </svg>
    );
};

const fmtBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 });

// ── Animated counter hook ─────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900) {
    const [count, setCount] = useState(0);
    const frame = useRef<number>(0);
    const start = useRef<number>(0);

    const animate = useCallback((ts: number) => {
        if (!start.current) start.current = ts;
        const elapsed = ts - start.current;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out quad
        const ease = 1 - (1 - progress) * (1 - progress);
        setCount(Math.round(ease * target));
        if (progress < 1) frame.current = requestAnimationFrame(animate);
    }, [target, duration]);

    useEffect(() => {
        start.current = 0;
        frame.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame.current);
    }, [animate]);

    return count;
}

// ── Animated hero stat ────────────────────────────────────────────────────────
const AnimatedStat = ({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) => {
    const count = useCountUp(value);
    return <span>{prefix}{count.toLocaleString('pt-BR')}{suffix}</span>;
};

// ── Weekly activity heatmap ───────────────────────────────────────────────────
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WeeklyHeatmap = ({ logs }: { logs: ActivityLog[] }) => {
    // Count activities per weekday (0=Sun ... 6=Sat) for last 28 days
    const counts = Array(7).fill(0);
    const cutoff = Date.now() - 28 * 24 * 60 * 60 * 1000;
    logs.forEach(l => {
        const d = new Date(l.createdAt);
        if (d.getTime() >= cutoff) counts[d.getDay()]++;
    });
    const max = Math.max(...counts, 1);
    return (
        <div className="heatmap-row">
            {DAYS.map((day, i) => {
                const intensity = counts[i] / max; // 0..1
                const level = intensity === 0 ? 0 : intensity < 0.33 ? 1 : intensity < 0.66 ? 2 : 3;
                return (
                    <div key={i} className="heatmap-cell-wrap">
                        <div className={`heatmap-cell level-${level}`} title={`${day}: ${counts[i]} ações`} />
                        <span className="heatmap-day-label">{day}</span>
                    </div>
                );
            })}
        </div>
    );
};

// ── Radar Chart (Strategic Pillars) ──────────────────────────────────────────
const RadarChart = ({ scores, projected }: { scores: Record<string, number>; projected?: Record<string, number> }) => {
    const labels = Object.keys(scores);
    const size = 200;
    const center = size / 2;
    const radius = 70;
    const points: string[] = [];
    const projPoints: string[] = [];
    const bgPoints: string[] = [];

    labels.forEach((_, i) => {
        const angle = (i * 2 * Math.PI) / labels.length - Math.PI / 2;
        bgPoints.push(`${center + radius * Math.cos(angle)},${center + radius * Math.sin(angle)}`);

        const scorePct = Math.min(scores[labels[i]], 100) / 100;
        points.push(`${center + radius * scorePct * Math.cos(angle)},${center + radius * scorePct * Math.sin(angle)}`);

        if (projected) {
            const projPct = Math.min(projected[labels[i]], 100) / 100;
            projPoints.push(`${center + radius * projPct * Math.cos(angle)},${center + radius * projPct * Math.sin(angle)}`);
        }
    });

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="radar-chart">
            <polygon points={bgPoints.join(' ')} fill="none" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="3,2" />
            {labels.map((label, i) => {
                const angle = (i * 2 * Math.PI) / labels.length - Math.PI / 2;
                const x2 = center + radius * Math.cos(angle);
                const y2 = center + radius * Math.sin(angle);
                const lx = center + (radius + 20) * Math.cos(angle);
                const ly = center + (radius + 20) * Math.sin(angle);
                return (
                    <g key={i}>
                        <line x1={center} y1={center} x2={x2} y2={y2} stroke="var(--color-border)" strokeWidth="1" opacity="0.5" />
                        <text x={lx} y={ly} textAnchor="middle" fontSize="9" fill="var(--color-text-secondary)" fontWeight="600" className="radar-label">
                            {label.toUpperCase()}
                        </text>
                    </g>
                );
            })}
            {projected && (
                <polygon points={projPoints.join(' ')} fill="none" stroke="var(--color-warning)" strokeWidth="2" strokeDasharray="4,4" />
            )}
            <polygon points={points.join(' ')} fill="rgba(99, 102, 241, 0.2)" stroke="var(--color-primary)" strokeWidth="2" strokeLinejoin="round" />
            {points.map((p, i) => {
                const [x, y] = p.split(',');
                return <circle key={i} cx={x} cy={y} r="3" fill="var(--color-primary)" />;
            })}
        </svg>
    );
};

// ── Performance Heatmap (Dept x Area) ────────────────────────────────────────
const PerformanceHeatmap = ({ data }: { data: any }) => {
    const depts = ['Ops', 'Fin', 'RH', 'Com', 'Prod'];
    const areas = ['Gente', 'Processo', 'Resultado'] as const;

    const heatmapData = data?.heatmap || {};

    return (
        <div className="performance-heatmap">
            <div className="heatmap-header">
                <div className="spacer" />
                {areas.map(a => <span key={a} className="area-label">{a}</span>)}
            </div>
            {depts.map(dept => (
                <div key={dept} className="heatmap-row-dept">
                    <span className="dept-label">{dept}</span>
                    {areas.map(area => {
                        const score = heatmapData[dept]?.[area] || 0;
                        const level = score >= 85 ? 'high' : score >= 65 ? 'mid' : 'low';
                        return (
                            <div key={area} className={`heatmap-square lv-${level}`} title={`${dept} - ${area}: ${score}%`} />
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

// ── Financial Impact Panel ──────────────────────────────────────────────────
const FinancialImpact = ({ financial, simParams }: { financial: any; simParams?: { rev: number; cost: number; headcount: number } }) => {
    const rev = financial.revenue * (1 + (simParams?.rev || 0) / 100);
    const costs = financial.costs * (1 + (simParams?.cost || 0) / 100);
    const gap = (financial.targetRevenue || 0) - rev;
    const efficiency = 0.92;
    const loss = costs * (1 - efficiency);

    return (
        <div className="financial-impact-panel">
            <div className="impact-item">
                <div className="impact-header">
                    <ArrowRight size={14} className="text-danger rotate-45" />
                    <span>Custo de Ineficiência (Est.)</span>
                </div>
                <div className="impact-value text-danger">
                    -{fmtBRL(loss)}
                    {simParams && simParams.cost !== 0 && (
                        <span className="sim-delta"> ({simParams.cost > 0 ? '+' : ''}{simParams.cost}%)</span>
                    )}
                </div>
                <p className="impact-sub">Baseado em maturidade de processos atual.</p>
            </div>
            <div className="impact-divider" />
            <div className="impact-item">
                <div className="impact-header">
                    <Target size={14} className="text-warning" />
                    <span>Gap de Faturamento</span>
                </div>
                <div className="impact-value text-warning">
                    {fmtBRL(gap > 0 ? gap : 0)}
                    {simParams && simParams.rev !== 0 && (
                        <span className="sim-delta"> (Rev {simParams.rev > 0 ? '+' : ''}{simParams.rev}%)</span>
                    )}
                </div>
                <p className="impact-sub">Delta em relação à meta mensal acumulada.</p>
            </div>
        </div>
    );
};

// ── AI Sentinel (Proactive Monitoring Hook) ──────────────────────────────────
function useAIWatcher(data: any) {
    const [status, setStatus] = useState<'idle' | 'scanning' | 'ready'>('idle');

    useEffect(() => {
        if (!data || status !== 'idle') return;

        const runAutoScan = async () => {
            setStatus('scanning');
            try {
                // Logic adapted from Alertas.tsx scan rules
                const alerts = await api.alerts.list({ status: 'active' });
                const existingTitles = new Set(alerts.map((a: any) => a.title));

                // 1. KPI Check
                if (data.goals) {
                    for (const goal of data.goals) {
                        if (goal.progress < 70 && !existingTitles.has(`Meta em risco: ${goal.title}`)) {
                            await api.alerts.create({
                                title: `Meta em risco: ${goal.title}`,
                                description: `Progresso atual de ${goal.progress}% está abaixo do patamar de segurança IA (70%).`,
                                type: 'strategic',
                                priority: 'high'
                            });
                        }
                    }
                }

                // 2. Financial Check
                const margin = data.financial.margin;
                if (margin < 10 && !existingTitles.has('Margem de Segurança em Alerta')) {
                    await api.alerts.create({
                        title: 'Margem de Segurança em Alerta',
                        description: `A margem atual (${margin}%) está operando em zona crítica de rentabilidade.`,
                        type: 'financial',
                        priority: 'critical'
                    });
                }

                setStatus('ready');
            } catch (e) {
                console.error('AI Watcher failed', e);
                setStatus('ready');
            }
        };

        const timer = setTimeout(runAutoScan, 2000); // Wait 2s after load to avoid race
        return () => clearTimeout(timer);
    }, [data, status]);

    return status;
}

const Dashboard = () => {
    const [data, setData] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [simMode, setSimMode] = useState(false);
    const [simParams, setSimParams] = useState({ rev: 0, cost: 0, headcount: 0 });
    const aiStatus = useAIWatcher(data);

    useEffect(() => {
        const saved = localStorage.getItem('saved_scenario');
        if (saved) {
            try {
                const params = JSON.parse(saved);
                setSimParams(params);
                setSimMode(true);
            } catch (e) {
                console.error("Erro ao carregar cenário salvo:", e);
            }
        }
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const [dashboardData, goalsData, logsData] = await Promise.all([
                    api.dashboard.get(),
                    api.goals.list({ type: 'company', status: 'active' }),
                    api.logs.list({ days: '28', limit: '200' }),
                ]);
                setData({ ...dashboardData, goals: goalsData });
                setLogs(logsData.data || []);
            } catch (e) {
                console.error('Dashboard load error', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <div className="spinner" />
        </div>
    );
    if (!data) return <div className="p-8 text-center text-muted">Erro ao carregar dados.</div>;

    const { sgeScore, sgeStatus, financial, people, pipeline, processMaturity, alerts = [], goals = [], heatmap, spider } = data;

    // Simulation derived logic
    const projRevenue = financial.revenue * (1 + simParams.rev / 100);
    const projCosts = financial.costs * (1 + simParams.cost / 100) + (simParams.headcount * 5000); // Fixed average cost per head
    const projMargin = projRevenue > 0 ? ((projRevenue - projCosts) / projRevenue) * 100 : 0;
    const projHeadcount = people.headcount + simParams.headcount;
    // Simplified runway projection: adjusting monthly average cost by the same ratio as total costs
    const avgMonthlySim = (financial.costs / Math.max(1, financial.operatingMonths)) * (1 + simParams.cost / 100) + (simParams.headcount * 5000);
    const simOperatingMonths = avgMonthlySim > 0 ? Math.floor(financial.cashAvailable / avgMonthlySim) : 0;

    // Abstracted score projection logic
    const projSgeScore = Math.min(100, Math.max(0, Math.round(
        sgeScore + (simParams.rev / 5) - (simParams.cost / 4) + (simParams.headcount > 0 ? 2 : simParams.headcount < 0 ? -3 : 0)
    )));

    const criticalAlerts = alerts.filter((a: any) => a.priority === 'critical');
    const highAlerts = alerts.filter((a: any) => a.priority === 'high');

    const sgeColor = sgeScore >= 70 ? 'success' : sgeScore >= 50 ? 'warning' : 'danger';

    return (
        <div className="container animate-fade dashboard-simulation-container">
            {simMode && (
                <div className="simulation-overlay-panel animate-slide-up">
                    <div className="sim-header">
                        <Flame size={18} className="text-warning" />
                        <div>
                            <h4>Modo Simulação Estratégica</h4>
                            <p>Ajuste os cenários para ver projeções no SCORE e RADAR</p>
                        </div>
                        <button className="btn-close-sim" onClick={() => { setSimMode(false); setSimParams({ rev: 0, cost: 0, headcount: 0 }); }}>Sair</button>
                        <button className="btn-save-sim ml-2" onClick={() => {
                            localStorage.setItem('saved_scenario', JSON.stringify(simParams));
                            alert('Cenário salvo como checkpoint!');
                        }}>Salvar Checkpoint</button>
                    </div>
                    <div className="sim-controls">
                        <div className="sim-control-group">
                            <label>Faturamento: {simParams.rev > 0 ? '+' : ''}{simParams.rev}%</label>
                            <input type="range" min="-50" max="100" value={simParams.rev} onChange={e => setSimParams({ ...simParams, rev: parseInt(e.target.value) })} />
                        </div>
                        <div className="sim-control-group">
                            <label>Custos Extras: {simParams.cost > 0 ? '+' : ''}{simParams.cost}%</label>
                            <input type="range" min="-50" max="100" value={simParams.cost} onChange={e => setSimParams({ ...simParams, cost: parseInt(e.target.value) })} />
                        </div>
                        <div className="sim-control-group">
                            <label>Equipe (Headcount): {simParams.headcount > 0 ? '+' : ''}{simParams.headcount}</label>
                            <div className="flex items-center gap-2">
                                <button className="btn-icon-sm" onClick={() => setSimParams(p => ({ ...p, headcount: p.headcount - 1 }))}>-</button>
                                <span className="w-8 text-center">{simParams.headcount}</span>
                                <button className="btn-icon-sm" onClick={() => setSimParams(p => ({ ...p, headcount: p.headcount + 1 }))}>+</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── HERO HEADER ─────────────────────────────────────────── */}
            <div className={`sge-hero sge-hero--${sgeColor} ${simMode ? 'sim-active' : ''}`}>
                <div className="sge-hero-left">
                    <ScoreRing score={simMode ? projSgeScore : sgeScore} />
                    <div className="sge-hero-text">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="sge-label">SGE Score {simMode ? '(Projetado)' : ''}</span>
                            <div className={`ai-status-indicator ${aiStatus}`}>
                                <Zap size={8} />
                                <span>IA {aiStatus === 'scanning' ? 'Processando...' : 'Monitorando'}</span>
                            </div>
                        </div>
                        <h1 className="sge-status">{simMode ? (projSgeScore >= 70 ? 'Excelente (Simulada)' : 'Atenção (Simulada)') : sgeStatus}</h1>
                        <p className="sge-sub">Monitoramento estratégico e operacional</p>
                        {!simMode && (
                            <button className="btn-sim-trigger" onClick={() => setSimMode(true)}>
                                <Flame size={12} /> Simular Cenário
                            </button>
                        )}
                    </div>
                </div>
                <div className="sge-hero-stats">
                    <div className="sge-stat">
                        <DollarSign size={18} />
                        <div>
                            <span className="sge-stat-label">Receita</span>
                            <span className="sge-stat-value">
                                <AnimatedStat value={Math.round(financial.revenue)} prefix="R$\u00a0" />
                            </span>
                        </div>
                    </div>
                    <div className="sge-stat">
                        <TrendingUp size={18} />
                        <div>
                            <span className="sge-stat-label">Margem</span>
                            <span className="sge-stat-value">
                                <AnimatedStat value={financial.margin} suffix="%" />
                            </span>
                        </div>
                    </div>
                    <div className="sge-stat">
                        <Users size={18} />
                        <div>
                            <span className="sge-stat-label">Pessoas</span>
                            <span className="sge-stat-value">
                                {simMode ? <span>{projHeadcount}</span> : <AnimatedStat value={people.headcount} />}
                            </span>
                        </div>
                    </div>
                    <div className="sge-stat">
                        <Clock size={18} />
                        <div>
                            <span className="sge-stat-label">Pipeline</span>
                            <span className="sge-stat-value">
                                <AnimatedStat value={pipeline.activeItems} suffix=" itens" />
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── VISUAL INTELLIGENCE SECTION ─────────────────────────── */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="card intelligence-card">
                    <div className="card-header">
                        <h3 className="text-h3 flex items-center gap-2">
                            <Target size={18} className="text-primary" /> Balanço Estratégico
                        </h3>
                    </div>
                    <div className="radar-container">
                        <RadarChart
                            scores={spider || {
                                'Finanças': financial.margin > 20 ? 90 : 60,
                                'Pessoas': people.climateScore,
                                'Processos': processMaturity.score,
                                'Comercial': pipeline.activeItems > 0 ? 80 : 40,
                                'Estratégia': sgeScore
                            }}
                            projected={simMode ? {
                                'Finanças': projMargin > 20 ? 90 : 60,
                                'Pessoas': Math.min(100, (spider?.Pessoas || people.climateScore) + (simParams.headcount * 5)),
                                'Processos': spider?.Processos || processMaturity.score,
                                'Comercial': Math.min(100, (spider?.Comercial || 40) + (simParams.rev / 5)),
                                'Estratégia': projSgeScore
                            } : undefined}
                        />
                    </div>
                </div>

                <div className="card intelligence-card">
                    <div className="card-header">
                        <h3 className="text-h3 flex items-center gap-2">
                            <Activity size={18} className="text-secondary" /> Saúde Operacional
                        </h3>
                    </div>
                    <div className="heatmap-container">
                        <PerformanceHeatmap data={{ heatmap }} />
                    </div>
                </div>

                <div className="card intelligence-card">
                    <div className="card-header">
                        <h3 className="text-h3 flex items-center gap-2">
                            <DollarSign size={18} className="text-success" /> Impacto Financeiro
                        </h3>
                    </div>
                    <div className="impact-container">
                        <FinancialImpact financial={financial} simParams={simMode ? simParams : undefined} />
                    </div>
                </div>
            </div>


            {/* ── CRITICAL ALERTS BANNER ──────────────────────────────── */}
            {criticalAlerts.length > 0 && (
                <div className="alert-banner critical">
                    <AlertTriangle size={18} className="flex-shrink-0" />
                    <div className="flex-1">
                        <strong>{criticalAlerts[0].title}</strong>
                        {criticalAlerts.length > 1 && (
                            <span className="text-sm ml-2 opacity-80">+ {criticalAlerts.length - 1} alerta(s) crítico(s)</span>
                        )}
                    </div>
                    <Link to="/alertas" className="btn btn-sm btn-white flex-shrink-0">Ver alertas</Link>
                </div>
            )}
            {criticalAlerts.length === 0 && highAlerts.length > 0 && (
                <div className="alert-banner high">
                    <AlertTriangle size={16} className="flex-shrink-0" />
                    <span className="flex-1">{highAlerts[0].title}</span>
                    <Link to="/alertas" className="text-xs underline">Ver</Link>
                </div>
            )}

            {/* ── SUMMARY CARDS ───────────────────────────────────────── */}
            <div className="dashboard-grid">
                <div className="card summary-card">
                    <div className="card-icon primary"><DollarSign size={24} /></div>
                    <div className="card-label">Margem Líquida</div>
                    <div className="card-value">
                        {simMode ? Math.round(projMargin) : financial.margin}%
                        {financial.targetMargin > 0 && (
                            <span className="text-xs text-muted ml-2 font-normal">/ Meta: {financial.targetMargin}%</span>
                        )}
                    </div>
                    <div className="card-trend text-muted">
                        Faturamento: {fmtBRL(simMode ? projRevenue : financial.revenue)}
                        {financial.targetRevenue > 0 && (
                            <span className="block text-xs">Meta: {fmtBRL(financial.targetRevenue)}</span>
                        )}
                    </div>
                    {financial.targetRevenue > 0 && (
                        <div className="card-progress-bar">
                            <div style={{ width: `${Math.min(100, ((simMode ? projRevenue : financial.revenue) / financial.targetRevenue) * 100)}%` }} />
                        </div>
                    )}
                </div>
                <div className="card summary-card">
                    <div className="card-icon success"><Users size={24} /></div>
                    <div className="card-label">Clima & Pessoas</div>
                    <div className="card-value">{people.climateScore} <span className="text-sm text-muted">/ 100</span></div>
                    <div className="card-trend text-muted">Equipe: {simMode ? projHeadcount : people.headcount}</div>
                    <div className="card-progress-bar">
                        <div style={{ width: `${people.climateScore}%`, background: 'var(--color-success)' }} />
                    </div>
                </div>
                <div className="card summary-card">
                    <div className="card-icon warning"><Clock size={24} /></div>
                    <div className="card-label">Pipeline Ativo</div>
                    <div className="card-value">{pipeline.activeItems}</div>
                    <div className="card-trend text-muted">Valor: {fmtBRL(pipeline.value)}</div>
                </div>
                <div className="card summary-card">
                    <div className="card-icon secondary"><Shield size={24} /></div>
                    <div className="card-label">Maturidade</div>
                    <div className="card-value">{processMaturity.score}%</div>
                    <div className="card-trend text-muted">Acesso: {processMaturity.status}</div>
                    <div className="card-progress-bar">
                        <div style={{ width: `${processMaturity.score}%`, background: 'var(--color-secondary)' }} />
                    </div>
                </div>

                {/* Bottlenecks Card */}
                <div className="card summary-card bottleneck-card">
                    <div className="card-icon" style={{ color: '#e11d48', background: '#fff1f2' }}><Flame size={24} /></div>
                    <div className="card-label">Gargalos IA</div>
                    <div className="bottleneck-list">
                        {(data.bottlenecks || []).length === 0 ? (
                            <div className="text-xs text-muted py-2">Fluxo operacional sem atritos detectados.</div>
                        ) : (
                            data.bottlenecks.map((b: any, i: number) => (
                                <div key={i} className="bottleneck-item">
                                    <span className="bottleneck-name truncate" title={b.name}>{b.name}</span>
                                    <span className="bottleneck-friction">{b.friction} atrasos</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="content-split">
                {/* ── MAIN COLUMN ─────────────────────────────────────── */}
                <div className="main-column">
                    {/* Cash Flow */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-h3">Fluxo de Caixa</h3>
                            <div className="badge badge-neutral">Runway: ~{simMode ? simOperatingMonths : financial.operatingMonths} meses</div>
                        </div>
                        <div className="chart-placeholder h-48 mt-4">
                            <CashFlowChart data={financial.history || []} />
                        </div>
                        <div className="flex justify-between mt-4 border-t pt-4">
                            <div>
                                <span className="block text-xs text-muted">Disponível</span>
                                <span className="font-bold text-lg">{financial.cashAvailable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-xs text-muted">Custos Mensais (Médio)</span>
                                <span className="font-bold text-lg text-danger">-{financial.costs.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        </div>
                    </div>

                    {/* OKR Progress — main widget */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-h3 flex items-center gap-2">
                                <Target size={18} className="text-primary" /> Metas & OKRs
                            </h3>
                            <Link to="/metas" className="text-xs text-primary hover:underline flex items-center gap-1">
                                Gerenciar <ArrowRight size={12} />
                            </Link>
                        </div>
                        {goals.length === 0 ? (
                            <div className="empty-state py-6">
                                <Target size={32} className="text-muted" />
                                <p className="text-sm text-muted">Nenhuma meta ativa. <Link to="/metas" className="text-primary underline">Criar agora</Link></p>
                            </div>
                        ) : (
                            <div className="okr-dashboard-list">
                                {goals.slice(0, 4).map((goal: any) => (
                                    <div key={goal.id} className="okr-dashboard-row">
                                        <OkrRing progress={goal.progress} />
                                        <div className="okr-dashboard-info">
                                            <span className="okr-dashboard-title">{goal.title}</span>
                                            <div className="okr-dashboard-krs">
                                                {(goal.keyResults || []).slice(0, 2).map((kr: any) => {
                                                    const pct = kr.targetValue > 0 ? Math.min(100, Math.round((kr.currentValue / kr.targetValue) * 100)) : 0;
                                                    return (
                                                        <div key={kr.id} className="okr-kr-mini">
                                                            <span className="truncate">{kr.title}</span>
                                                            <div className="okr-kr-mini-bar">
                                                                <div style={{ width: `${pct}%`, background: pct >= 70 ? 'var(--color-success)' : pct >= 40 ? 'var(--color-warning)' : 'var(--color-danger)' }} />
                                                            </div>
                                                            <span className="okr-kr-mini-pct">{pct}%</span>
                                                        </div>
                                                    );
                                                })}
                                                {goal.keyResults?.length > 2 && (
                                                    <span className="text-xs text-muted">+{goal.keyResults.length - 2} KR(s)</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action List + Quick Access */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="text-h3">Ações Prioritárias</h3>
                            </div>
                            {(!data.actions || data.actions.length === 0) ? (
                                <div className="flex flex-col items-center gap-2 py-6 text-muted">
                                    <CheckCircle2 size={28} className="text-success" />
                                    <span className="text-sm">Tudo em dia!</span>
                                </div>
                            ) : (
                                <ul className="action-list">
                                    {data.actions.map((action: any, i: number) => (
                                        <li key={i} className="action-item">
                                            <div className={`action-icon ${action.priority === 'critical' ? 'danger' : action.priority === 'high' ? 'warning' : 'primary'}`}>
                                                {action.type === 'financial' ? <DollarSign size={16} /> :
                                                    action.type === 'people' ? <Users size={16} /> :
                                                        action.type === 'alert' ? <AlertTriangle size={16} /> :
                                                            <Activity size={16} />}
                                            </div>
                                            <div className="action-info">
                                                <span className="action-text">{action.text}</span>
                                                <span className="action-meta">{action.meta}</span>
                                            </div>
                                            {action.link && (
                                                <Link to={action.link} className="btn-icon-sm"><ArrowRight size={14} /></Link>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="text-h3">Atalhos</h3>
                            </div>
                            <div className="quick-access-grid">
                                <Link to="/financeiro" className="quick-access-item">
                                    <DollarSign size={20} className="text-success" /><span>Novo Lançamento</span>
                                </Link>
                                <Link to="/pessoas" className="quick-access-item">
                                    <Users size={20} className="text-primary" /><span>Add Colaborador</span>
                                </Link>
                                <Link to="/fluxos" className="quick-access-item">
                                    <LayoutDashboard size={20} className="text-warning" /><span>Criar Card</span>
                                </Link>
                                <Link to="/metas" className="quick-access-item">
                                    <Target size={20} className="text-secondary" /><span>Nova Meta</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── SIDE COLUMN ─────────────────────────────────────── */}
                <aside className="sidebar-column">
                    {/* Alerts feed */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-h3 flex items-center gap-2">
                                <AlertTriangle size={16} className={alerts.length > 0 ? 'text-danger' : 'text-muted'} />
                                Alertas
                                {alerts.length > 0 && <span className="badge-dot-red">{alerts.length}</span>}
                            </h3>
                            <Link to="/alertas" className="text-xs text-primary hover:underline">Ver todos</Link>
                        </div>
                        {alerts.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-4 text-muted">
                                <CheckCircle2 size={24} className="text-success" />
                                <span className="text-sm">Sem alertas ativos</span>
                            </div>
                        ) : (
                            <div className="alerts-list">
                                {alerts.slice(0, 5).map((alert: any) => (
                                    <div key={alert.id} className={`alert-item priority-${alert.priority}`}>
                                        <div className="alert-content">
                                            <span className="alert-title">{alert.title}</span>
                                            <span className="alert-time">{new Date(alert.createdAt).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                ))}
                                {alerts.length > 5 && (
                                    <Link to="/alertas" className="block text-center text-xs text-primary py-2 hover:underline">
                                        +{alerts.length - 5} alertas
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Financial quick snapshot */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-h3">Financeiro</h3>
                            <Link to="/financeiro" className="text-xs text-primary hover:underline">Detalhar</Link>
                        </div>
                        <div className="fin-snapshot">
                            <div className="fin-row">
                                <span className="fin-label"><TrendingUp size={13} className="text-success inline mr-1" />Receita</span>
                                <span className="fin-value text-success">{fmtBRL(financial.revenue)}</span>
                            </div>
                            <div className="fin-row">
                                <span className="fin-label"><TrendingDown size={13} className="text-danger inline mr-1" />Despesas</span>
                                <span className="fin-value text-danger">{fmtBRL(financial.costs)}</span>
                            </div>
                            <div className="fin-row fin-row--total">
                                <span className="fin-label"><Zap size={13} className="text-primary inline mr-1" />Resultado</span>
                                <span className={`fin-value ${financial.revenue - financial.costs >= 0 ? 'text-success' : 'text-danger'}`}>
                                    {fmtBRL(financial.revenue - financial.costs)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Upgrade card */}
                    <div className="card card-gradient-cta">
                        <h3 className="text-h3 mb-1">Plano Pro</h3>
                        <p className="text-sm opacity-80 mb-3">85% dos recursos utilizados. Considere fazer upgrade.</p>
                        <div className="cta-bar"><div style={{ width: '85%' }} /></div>
                        <a
                            href="https://wa.me/5511999999999?text=Olá,%20gostaria%20de%20fazer%20um%20upgrade%20para%20o%20Plano%20Pro"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-white w-full mt-3 text-center no-underline inline-block"
                        >
                            Falar com Consultor
                        </a>
                    </div>

                    {/* Weekly Activity Heatmap */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-h3 flex items-center gap-2">
                                <Flame size={16} className="text-warning" /> Atividade Semanal
                            </h3>
                            <span className="text-xs text-muted">últimos 28 dias</span>
                        </div>
                        <WeeklyHeatmap logs={logs} />
                        <p className="text-xs text-muted mt-2 text-center">
                            {logs.length} ações registradas
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Dashboard;
