import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Target, Trash2, CheckCircle, Archive, RotateCcw, TrendingUp, Zap, Edit3, Printer, MessageSquarePlus, X, CalendarCheck2, BrainCircuit } from 'lucide-react';
import { api } from '../services/api';
import ConfirmDialog from '../components/Modal/ConfirmDialog';
import LoadingSkeleton from '../components/Layout/LoadingSkeleton';
import { useToast } from '../components/Layout/ToastContext';
import './Metas.css';

interface KeyResult {
    id: string;
    title: string;
    currentValue: number;
    targetValue: number;
    unit: string;
    linkedIndicator?: string;
}

interface Goal {
    id: string;
    title: string;
    description?: string;
    type: 'company' | 'department' | 'individual';
    period: string;
    status: 'draft' | 'active' | 'archived';
    progress: number;
    keyResults: KeyResult[];
}

const INDICATOR_LABELS: Record<string, string> = {
    financial_revenue_month: '⚡ Receita (Mês)',
    financial_profit_month: '⚡ Lucro (Mês)',
    sales_won_count_month: '⚡ Vendas Ganhas (#)',
    sales_won_value_month: '⚡ Vendas Valor (R$)',
    active_clients_count: '⚡ Clientes Ativos',
};

const getProgressColor = (pct: number) => {
    if (pct >= 80) return 'var(--color-success)';
    if (pct >= 50) return 'var(--color-warning)';
    return 'var(--color-danger)';
};

const formatValue = (value: number, unit: string) => {
    if (unit === 'currency') return `R$ ${value.toLocaleString('pt-BR')}`;
    if (unit === 'percentage') return `${value}%`;
    return value.toLocaleString('pt-BR');
};

// Circular progress ring — 100×100 large gauge
const ProgressRing = ({ progress }: { progress: number }) => {
    const r = 40;
    const circ = 2 * Math.PI * r;
    const offset = circ - (Math.min(progress, 100) / 100) * circ;
    const color = getProgressColor(progress);
    return (
        <svg width="100" height="100" viewBox="0 0 100 100" className="progress-ring">
            <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
            <circle
                cx="50" cy="50" r={r} fill="none"
                stroke={color} strokeWidth="8"
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dashoffset 0.7s ease' }}
            />
            <text x="50" y="55" textAnchor="middle" fontSize="17" fontWeight="800" fill={color}>
                {Math.min(progress, 100)}%
            </text>
        </svg>
    );
};

const STATUS_TABS = [
    { key: 'active', label: 'Ativas', icon: <TrendingUp size={14} /> },
    { key: 'draft', label: 'Rascunho', icon: <Edit3 size={14} /> },
    { key: 'archived', label: 'Arquivadas', icon: <Archive size={14} /> },
];

const PERIODS = [
    { value: 'Q1 2025', label: 'Q1 2025' },
    { value: 'Q2 2025', label: 'Q2 2025' },
    { value: 'Q3 2025', label: 'Q3 2025' },
    { value: 'Q4 2025', label: 'Q4 2025' },
    { value: 'Q1 2026', label: 'Q1 2026' },
    { value: 'Q2 2026', label: 'Q2 2026' },
    { value: 'Q3 2026', label: 'Q3 2026' },
    { value: 'Q4 2026', label: 'Q4 2026' },
    { value: '2025', label: 'Anual 2025' },
    { value: '2026', label: 'Anual 2026' },
];

const Metas = ({ isWrapper = false }: { isWrapper?: boolean }) => {
    const { toast } = useToast();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentPeriod, setCurrentPeriod] = useState('Q2 2025');
    const [activeStatus, setActiveStatus] = useState<'active' | 'draft' | 'archived'>('active');

    // Check-in modal state
    const [checkInGoal, setCheckInGoal] = useState<Goal | null>(null);
    const [checkInNote, setCheckInNote] = useState('');
    const [savingCheckIn, setSavingCheckIn] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<any>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    // Inline KR edit
    const [editingKr, setEditingKr] = useState<{ krId: string; value: string } | null>(null);
    const [savingKr, setSavingKr] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'company',
        period: new Date().getFullYear().toString(),
        keyResults: [] as any[]
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchGoals = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.goals.list({ period: currentPeriod });
            setGoals(data as any);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [currentPeriod]);

    useEffect(() => { fetchGoals(); }, [fetchGoals]);

    const handleCreateGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.goals.create(formData as any);
            setShowModal(false);
            setFormData({ title: '', description: '', type: 'company', period: currentPeriod, keyResults: [] });
            fetchGoals();
            toast('Meta criada com sucesso!', 'success');
        } catch {
            toast('Erro ao criar meta', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.goals.delete(deleteTarget);
            fetchGoals();
            toast('Meta removida', 'success');
        } catch {
            toast('Erro ao remover meta', 'error');
        } finally {
            setDeleteTarget(null);
        }
    };

    const handleStatusChange = async (goal: Goal, newStatus: Goal['status']) => {
        try {
            await api.goals.update(goal.id, { status: newStatus });
            fetchGoals();
            toast('Status atualizado!', 'success');
        } catch {
            toast('Erro ao atualizar status', 'error');
        }
    };

    const handleKrUpdate = async (kr: KeyResult) => {
        if (!editingKr || editingKr.krId !== kr.id) return;
        const newVal = parseFloat(editingKr.value);
        if (isNaN(newVal)) { setEditingKr(null); return; }
        setSavingKr(kr.id);
        try {
            await api.goals.updateKeyResult(kr.id, { currentValue: newVal });
            setEditingKr(null);
            await fetchGoals();
        } catch {
            toast('Erro ao atualizar KR', 'error');
        } finally {
            setSavingKr(null);
        }
    };

    const addKeyResultField = () =>
        setFormData({ ...formData, keyResults: [...formData.keyResults, { title: '', targetValue: 100, unit: 'number', linkedIndicator: '' }] });

    const updateKrField = (i: number, field: string, value: any) => {
        const krs = [...formData.keyResults];
        krs[i] = { ...krs[i], [field]: value };
        setFormData({ ...formData, keyResults: krs });
    };

    const filtered = goals.filter((g: Goal) => g.status === activeStatus);

    const counts = {
        active: goals.filter((g: Goal) => g.status === 'active').length,
        draft: goals.filter((g: Goal) => g.status === 'draft').length,
        archived: goals.filter((g: Goal) => g.status === 'archived').length,
    };

    // Summary stats
    const activeGoals = goals.filter((g: Goal) => g.status === 'active');
    const avgProgress = activeGoals.length > 0
        ? Math.round(activeGoals.reduce((s: number, g: Goal) => s + g.progress, 0) / activeGoals.length)
        : 0;
    const onTrack = activeGoals.filter((g: Goal) => g.progress >= 70).length;

    const [syncing, setSyncing] = useState(false);

    // Check-in submit (adds an alert log — reuses alerts api as event store)
    const handleCheckIn = async () => {
        if (!checkInGoal || !checkInNote.trim()) return;
        setSavingCheckIn(true);
        try {
            await api.alerts.create({
                title: `Check-in: ${checkInGoal.title}`,
                description: checkInNote,
                type: 'system',
                priority: 'low',
            });
            setCheckInGoal(null);
            setCheckInNote('');
        } catch { /* silently fail */ }
        finally { setSavingCheckIn(false); }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            await api.goals.sync();
            await fetchGoals();
        } catch {
            toast('Erro ao sincronizar indicadores', 'error');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className={`container animate-fade goals-container ${isWrapper ? 'is-wrapper pt-0' : ''}`}>
            {!isWrapper && (
                <header className="page-header">
                    <div>
                        <h1 className="text-h2">Metas & OKRs</h1>
                        <p className="text-small">Gestão de objetivos e resultados-chave</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <select
                            className="input-field"
                            value={currentPeriod}
                            onChange={e => setCurrentPeriod(e.target.value)}
                        >
                            {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                        <button className="btn btn-secondary" onClick={handleSync} disabled={syncing}>
                            <RotateCcw size={16} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Sincronizando...' : 'Sincronizar'}
                        </button>
                        <button className="btn btn-secondary" onClick={() => window.print()} title="Exportar OKR PDF">
                            <Printer size={16} /> Exportar
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={18} /> Nova Meta
                        </button>
                    </div>
                </header>
            )}

            {/* AI Goal Assistant (Oracle) */}
            <div className={`okr-ai-assistant ${isGenerating ? 'generating' : ''}`}>
                <div className="ai-assistant-header">
                    <div className="ai-icon-wrapper">
                        <BrainCircuit size={24} className={`text-primary ${isGenerating ? 'animate-bounce' : 'animate-pulse'}`} />
                        {isGenerating && <div className="ai-scan-line" />}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-strong flex items-center gap-2">
                            Assistente de Estratégia Oracle
                            <span className="badge badge-ai">Beta</span>
                        </h3>
                        <p className="text-tiny">Analista de dados autônomo • Conectado aos indicadores reais</p>
                    </div>
                    {!aiSuggestion && !isGenerating && (
                        <button className="btn-ai-generate" onClick={async () => {
                            setIsGenerating(true);
                            try {
                                // Simulate AI "thinking" time for premium feel
                                await new Promise(r => setTimeout(r, 1500));

                                const kpis = await api.kpis.list();
                                const weakKpis = kpis.filter((k: any) => k.target > 0 && (k.value / k.target) < 0.7);

                                if (weakKpis.length > 0) {
                                    const primary = weakKpis[0];
                                    const secondary = weakKpis[1] || null;

                                    const suggestion = {
                                        title: `Aceleração de ${primary.name}`,
                                        description: `Plano estratégico para recuperar performance de ${primary.name} e fortalecer indicadores correlatos.`,
                                        keyResults: [
                                            { title: `Atingir meta de ${primary.name} (${primary.target}${primary.unit})`, targetValue: primary.target, unit: primary.unit === 'R$' ? 'currency' : 'number', linkedIndicator: primary.id },
                                            ...(secondary ? [{ title: `Estabilizar ${secondary.name} em ${secondary.target}${secondary.unit}`, targetValue: secondary.target, unit: secondary.unit === 'R$' ? 'currency' : 'number', linkedIndicator: secondary.id }] : []),
                                            { title: "Implementar plano de ação corretiva", targetValue: 100, unit: 'percentage' }
                                        ]
                                    };
                                    setAiSuggestion(suggestion);
                                } else {
                                    alert('Todos os KPIs operando em regime de excelência! Sugestão: Manter foco em escala e otimização de margem.');
                                }
                            } catch (e) {
                                toast('Erro na análise da Oracle', 'error');
                            } finally {
                                setIsGenerating(false);
                            }
                        }}>
                            <Zap size={14} /> Analisar Performance
                        </button>
                    )}
                </div>

                {isGenerating && (
                    <div className="ai-processing-state">
                        <div className="typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                        <p className="text-tiny italic">Consultando banco de dados e calculando variâncias...</p>
                    </div>
                )}

                {aiSuggestion && (
                    <div className="ai-suggestion-box animate-slide-up">
                        <div className="ai-suggestion-content">
                            <div className="suggestion-badge">SUGESTÃO DA IA</div>
                            <h4>{aiSuggestion.title}</h4>
                            <p className="text-small">{aiSuggestion.description}</p>

                            <div className="suggestion-krs">
                                {aiSuggestion.keyResults.map((kr: any, idx: number) => (
                                    <div key={idx} className="suggestion-kr-item">
                                        <div className="kr-bullet" />
                                        <span>{kr.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="ai-suggestion-actions">
                            <button className="btn btn-sm btn-ghost" onClick={() => setAiSuggestion(null)}>Descartar</button>
                            <button className="btn btn-sm btn-primary" onClick={async () => {
                                try {
                                    await api.goals.create({
                                        ...aiSuggestion,
                                        type: 'company',
                                        period: currentPeriod,
                                        status: 'draft'
                                    } as any);
                                    setAiSuggestion(null);
                                    fetchGoals();
                                    toast('Rascunho criado! Você pode refiná-lo na aba "Rascunho".', 'success');
                                } catch (e) {
                                    toast('Erro ao criar meta sugerida', 'error');
                                }
                            }}>
                                Aceitar e Criar Rascunho
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* OKR Summary bar */}
            {activeGoals.length > 0 && (
                <div className="okr-summary-bar">
                    <div className="okr-stat">
                        <span className="okr-stat-value">{avgProgress}%</span>
                        <span className="okr-stat-label">Progresso médio</span>
                    </div>
                    <div className="okr-stat-div" />
                    <div className="okr-stat">
                        <span className="okr-stat-value">{activeGoals.length}</span>
                        <span className="okr-stat-label">OKRs ativos</span>
                    </div>
                    <div className="okr-stat-div" />
                    <div className="okr-stat">
                        <span className="okr-stat-value" style={{ color: onTrack === activeGoals.length ? 'var(--color-success)' : 'var(--color-warning)' }}>
                            {onTrack}/{activeGoals.length}
                        </span>
                        <span className="okr-stat-label">No prazo (≥70%)</span>
                    </div>
                    <div className="okr-stat-div" />
                    <div className="okr-summary-bar-progress">
                        <div className="okr-bar-bg">
                            <div className="okr-bar-fill" style={{ width: `${avgProgress}%`, background: getProgressColor(avgProgress) }} />
                        </div>
                        <span className="okr-bar-label">média geral</span>
                    </div>
                </div>
            )}

            {/* Status Tabs */}
            <div className="okr-tab-bar flex justify-between items-center">
                <div className="flex gap-2">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.key}
                            className={`okr-tab ${activeStatus === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveStatus(tab.key as any)}
                        >
                            {tab.icon} {tab.label}
                            {counts[tab.key as keyof typeof counts] > 0 && (
                                <span className="okr-tab-count">{counts[tab.key as keyof typeof counts]}</span>
                            )}
                        </button>
                    ))}
                </div>
                {isWrapper && (
                    <div className="flex gap-2 items-center pb-2">
                        <select
                            className="input-field"
                            value={currentPeriod}
                            onChange={e => setCurrentPeriod(e.target.value)}
                        >
                            {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                        <button className="btn btn-secondary" onClick={handleSync} disabled={syncing}>
                            <RotateCcw size={16} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Sincronizando...' : 'Sincronizar'}
                        </button>
                        <button className="btn btn-secondary" onClick={() => window.print()} title="Exportar OKR PDF">
                            <Printer size={16} /> Exportar
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={18} /> Nova Meta
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <LoadingSkeleton type="card" rows={3} />
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <Target size={48} className="text-muted" />
                    <h3>Nenhuma meta {activeStatus === 'active' ? 'ativa' : activeStatus === 'draft' ? 'em rascunho' : 'arquivada'} em {currentPeriod}</h3>
                    {activeStatus === 'active' && (
                        <p>Comece criando um objetivo para a empresa ou departamento.</p>
                    )}
                </div>
            ) : (
                <div className="goals-grid">
                    {filtered.map(goal => (
                        <div key={goal.id} className={`card goal-card status-${goal.status}`}>
                            <div className="goal-card-header">
                                <div className="goal-meta">
                                    <span className={`badge ${goal.type === 'company' ? 'badge-primary' : 'badge-secondary'}`}>
                                        {goal.type === 'company' ? 'Empresa' : goal.type === 'department' ? 'Área' : 'Individual'}
                                    </span>
                                    <span className="text-xs text-muted font-mono">{goal.period}</span>
                                </div>
                                <div className="goal-actions">
                                    <button className="btn-icon-sm text-primary" title="Registrar Check-in" onClick={() => { setCheckInGoal(goal); setCheckInNote(''); }}>
                                        <MessageSquarePlus size={16} />
                                    </button>
                                    {goal.status === 'draft' && (
                                        <button className="btn-icon-sm text-success" title="Ativar" onClick={() => handleStatusChange(goal, 'active')}>
                                            <CheckCircle size={16} />
                                        </button>
                                    )}
                                    {goal.status === 'active' && (
                                        <button className="btn-icon-sm text-muted" title="Arquivar" onClick={() => handleStatusChange(goal, 'archived')}>
                                            <Archive size={16} />
                                        </button>
                                    )}
                                    {goal.status === 'archived' && (
                                        <button className="btn-icon-sm text-primary" title="Reativar" onClick={() => handleStatusChange(goal, 'active')}>
                                            <RotateCcw size={16} />
                                        </button>
                                    )}
                                    <button className="btn-icon-sm text-danger" title="Remover" onClick={() => setDeleteTarget(goal.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="goal-body">
                                <div className="goal-progress-ring">
                                    <ProgressRing progress={goal.progress} />
                                </div>
                                <div className="goal-info">
                                    <h3 className="goal-title">{goal.title}</h3>
                                    {goal.description && <p className="goal-desc">{goal.description}</p>}
                                </div>
                            </div>

                            {/* KRs */}
                            <div className="kr-section">
                                <h4 className="kr-section-title">
                                    Resultados-Chave <span className="kr-count">{goal.keyResults.length}</span>
                                </h4>
                                {goal.keyResults.length === 0 && (
                                    <p className="text-xs text-muted italic">Nenhum KR vinculado.</p>
                                )}
                                {goal.keyResults.map((kr: KeyResult) => {
                                    const pct = kr.targetValue > 0 ? Math.min(100, Math.round((kr.currentValue / kr.targetValue) * 100)) : 0;
                                    const isEditing = editingKr?.krId === kr.id;
                                    const isSaving = savingKr === kr.id;
                                    const isAuto = !!kr.linkedIndicator;

                                    return (
                                        <div key={kr.id} className="kr-row">
                                            <div className="kr-row-header">
                                                <span className="kr-title">
                                                    {isAuto && <Zap size={11} className="text-warning" />}
                                                    {kr.title}
                                                </span>
                                                <div className="kr-values">
                                                    {isEditing ? (
                                                        <div className="kr-edit-inline">
                                                            <input
                                                                type="number"
                                                                className="kr-edit-input"
                                                                value={editingKr.value}
                                                                onChange={e => setEditingKr({ krId: kr.id, value: e.target.value })}
                                                                onKeyDown={e => { if (e.key === 'Enter') handleKrUpdate(kr); if (e.key === 'Escape') setEditingKr(null); }}
                                                                autoFocus
                                                            />
                                                            <button className="btn btn-xs btn-primary" onClick={() => handleKrUpdate(kr)} disabled={isSaving}>
                                                                {isSaving ? '...' : '✓'}
                                                            </button>
                                                            <button className="btn btn-xs btn-secondary" onClick={() => setEditingKr(null)}>✕</button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            className={`kr-value-btn ${isAuto ? 'auto' : ''}`}
                                                            onClick={() => !isAuto && setEditingKr({ krId: kr.id, value: String(kr.currentValue) })}
                                                            title={isAuto ? 'Atualizado automaticamente pelo sistema' : 'Clique para atualizar'}
                                                            disabled={isAuto}
                                                        >
                                                            {formatValue(kr.currentValue, kr.unit)}
                                                            {!isAuto && <Edit3 size={10} className="kr-edit-icon" />}
                                                        </button>
                                                    )}
                                                    <span className="kr-target"> / {formatValue(kr.targetValue, kr.unit)}</span>
                                                    <span className="kr-pct" style={{ color: getProgressColor(pct) }}>{pct}%</span>
                                                </div>
                                            </div>
                                            <div className="kr-bar-track">
                                                <div
                                                    className="kr-bar-fill"
                                                    style={{ width: `${pct}%`, backgroundColor: getProgressColor(pct) }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Check-in Modal */}
            {checkInGoal && (
                <div className="modal-overlay" onClick={(e: React.MouseEvent) => e.target === e.currentTarget && setCheckInGoal(null)}>
                    <div className="modal okr-checkin-modal">
                        <div className="modal-header">
                            <div className="okr-checkin-title">
                                <CalendarCheck2 size={18} className="text-primary" />
                                <span>Check-in: {checkInGoal.title}</span>
                            </div>
                            <button className="icon-btn" onClick={() => setCheckInGoal(null)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="okr-checkin-progress">
                                <ProgressRing progress={checkInGoal.progress} />
                                <div>
                                    <p className="font-semibold">{checkInGoal.period} · {checkInGoal.type === 'company' ? 'Empresa' : checkInGoal.type === 'department' ? 'Área' : 'Individual'}</p>
                                    <p className="text-small text-muted">{checkInGoal.keyResults.length} resultado(s)-chave vinculado(s)</p>
                                </div>
                            </div>
                            <div className="form-group mt-4">
                                <label className="label">Nota do check-in</label>
                                <textarea
                                    className="input-field"
                                    rows={3}
                                    placeholder="O que aconteceu neste período? Bloqueios, avanços, ajustes necessários…"
                                    value={checkInNote}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCheckInNote(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setCheckInGoal(null)}>Cancelar</button>
                            <button
                                className="btn btn-primary"
                                onClick={handleCheckIn}
                                disabled={savingCheckIn || !checkInNote.trim()}
                            >
                                {savingCheckIn ? 'Salvando…' : 'Salvar Check-in'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Goal Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={(e: React.MouseEvent) => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal-content w-full max-w-2xl">
                        <div className="modal-header">
                            <h3>Nova Meta</h3>
                            <button className="icon-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreateGoal}>
                            <div className="modal-body space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group col-span-2">
                                        <label>Título do Objetivo *</label>
                                        <input
                                            type="text" className="input-field" required
                                            value={formData.title}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="Ex: Tornar-se referência no mercado..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Tipo</label>
                                        <select className="input-field" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                            <option value="company">Empresa</option>
                                            <option value="department">Departamento</option>
                                            <option value="individual">Individual</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Período</label>
                                        <select className="input-field" value={formData.period} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, period: e.target.value })}>
                                            {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group col-span-2">
                                        <label>Descrição (Opcional)</label>
                                        <textarea
                                            className="input-field" rows={2}
                                            value={formData.description}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="font-bold">Resultados-Chave (KRs)</label>
                                        <button type="button" className="btn btn-sm btn-secondary" onClick={addKeyResultField}>
                                            + Adicionar KR
                                        </button>
                                    </div>
                                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                                        {formData.keyResults.length === 0 && (
                                            <p className="text-sm text-muted text-center py-4">Nenhum KR adicionado. Clique em "+ Adicionar KR".</p>
                                        )}
                                        {formData.keyResults.map((kr: any, i: number) => (
                                            <div key={i} className="kr-form-row">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text" className="input-field flex-1 text-sm" required
                                                        value={kr.title}
                                                        onChange={e => updateKrField(i, 'title', e.target.value)}
                                                        placeholder="Atingir R$ 1M em receita..."
                                                    />
                                                    <button type="button" className="btn-icon-sm text-danger flex-shrink-0" onClick={() => {
                                                        setFormData({ ...formData, keyResults: formData.keyResults.filter((_, idx: number) => idx !== i) });
                                                    }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <select
                                                        className="input-field text-sm flex-1"
                                                        value={kr.linkedIndicator || ''}
                                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateKrField(i, 'linkedIndicator', e.target.value)}
                                                    >
                                                        <option value="">Manual</option>
                                                        {Object.entries(INDICATOR_LABELS).map(([k, v]) => (
                                                            <option key={k} value={k}>{v}</option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="number" className="input-field w-28 text-sm" required min="1"
                                                        value={kr.targetValue}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateKrField(i, 'targetValue', e.target.value)}
                                                        placeholder="Meta"
                                                    />
                                                    <select
                                                        className="input-field w-24 text-sm"
                                                        value={kr.unit}
                                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateKrField(i, 'unit', e.target.value)}
                                                    >
                                                        <option value="number">Num.</option>
                                                        <option value="currency">R$</option>
                                                        <option value="percentage">%</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Criando...' : 'Criar Meta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!deleteTarget}
                title="Excluir Meta"
                message="Tem certeza que deseja excluir esta meta e seus resultados-chave? Esta ação não pode ser desfeita."
                confirmLabel="Excluir"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

export default Metas;
