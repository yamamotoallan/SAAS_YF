import { useState, useEffect, useCallback } from 'react';
import { Plus, Target, Trash2, CheckCircle, Archive, RotateCcw, TrendingUp, Zap, Edit3 } from 'lucide-react';
import { api } from '../services/api';
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

// Circular progress ring
const ProgressRing = ({ progress }: { progress: number }) => {
    const r = 28;
    const circ = 2 * Math.PI * r;
    const offset = circ - (Math.min(progress, 100) / 100) * circ;
    const color = getProgressColor(progress);
    return (
        <svg width="72" height="72" viewBox="0 0 72 72" className="progress-ring">
            <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border-color)" strokeWidth="6" />
            <circle
                cx="36" cy="36" r={r} fill="none"
                stroke={color} strokeWidth="6"
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 36 36)"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
            <text x="36" y="41" textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>
                {progress}%
            </text>
        </svg>
    );
};

const STATUS_TABS = [
    { key: 'active', label: 'Ativas', icon: <TrendingUp size={14} /> },
    { key: 'draft', label: 'Rascunho', icon: <Edit3 size={14} /> },
    { key: 'archived', label: 'Arquivadas', icon: <Archive size={14} /> },
];

const YEARS = ['2024', '2025', '2026'];

const Metas = () => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentPeriod, setCurrentPeriod] = useState(new Date().getFullYear().toString());
    const [activeStatus, setActiveStatus] = useState<'active' | 'draft' | 'archived'>('active');

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
            setGoals(data);
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
            await api.goals.create(formData);
            setShowModal(false);
            setFormData({ title: '', description: '', type: 'company', period: currentPeriod, keyResults: [] });
            fetchGoals();
        } catch {
            alert('Erro ao criar meta');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover esta meta?')) return;
        try {
            await api.goals.delete(id);
            fetchGoals();
        } catch {
            alert('Erro ao remover meta');
        }
    };

    const handleStatusChange = async (goal: Goal, newStatus: Goal['status']) => {
        try {
            await api.goals.update(goal.id, { status: newStatus });
            fetchGoals();
        } catch {
            alert('Erro ao atualizar status');
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
            alert('Erro ao atualizar KR');
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

    const filtered = goals.filter(g => g.status === activeStatus);

    const counts = {
        active: goals.filter(g => g.status === 'active').length,
        draft: goals.filter(g => g.status === 'draft').length,
        archived: goals.filter(g => g.status === 'archived').length,
    };

    return (
        <div className="container animate-fade goals-container">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Metas & OKRs</h1>
                    <p className="text-small">Gestão de objetivos e resultados-chave</p>
                </div>
                <div className="flex gap-3 items-center">
                    <select
                        className="input-field w-32"
                        value={currentPeriod}
                        onChange={e => setCurrentPeriod(e.target.value)}
                    >
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} /> Nova Meta
                    </button>
                </div>
            </header>

            {/* Status Tabs */}
            <div className="okr-tab-bar">
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

            {loading ? (
                <div className="flex justify-center p-12"><div className="spinner" /></div>
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
                                    <button className="btn-icon-sm text-danger" title="Remover" onClick={() => handleDelete(goal.id)}>
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
                                {goal.keyResults.map(kr => {
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

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal w-full max-w-2xl">
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
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
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
                                        <select className="input-field" value={formData.period} onChange={e => setFormData({ ...formData, period: e.target.value })}>
                                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group col-span-2">
                                        <label>Descrição (Opcional)</label>
                                        <textarea
                                            className="input-field" rows={2}
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
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
                                        {formData.keyResults.map((kr, i) => (
                                            <div key={i} className="kr-form-row">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text" className="input-field flex-1 text-sm" required
                                                        value={kr.title}
                                                        onChange={e => updateKrField(i, 'title', e.target.value)}
                                                        placeholder="Atingir R$ 1M em receita..."
                                                    />
                                                    <button type="button" className="btn-icon-sm text-danger flex-shrink-0" onClick={() => {
                                                        setFormData({ ...formData, keyResults: formData.keyResults.filter((_, idx) => idx !== i) });
                                                    }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <select
                                                        className="input-field text-sm flex-1"
                                                        value={kr.linkedIndicator || ''}
                                                        onChange={e => updateKrField(i, 'linkedIndicator', e.target.value)}
                                                    >
                                                        <option value="">Manual</option>
                                                        {Object.entries(INDICATOR_LABELS).map(([k, v]) => (
                                                            <option key={k} value={k}>{v}</option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="number" className="input-field w-28 text-sm" required min="1"
                                                        value={kr.targetValue}
                                                        onChange={e => updateKrField(i, 'targetValue', e.target.value)}
                                                        placeholder="Meta"
                                                    />
                                                    <select
                                                        className="input-field w-24 text-sm"
                                                        value={kr.unit}
                                                        onChange={e => updateKrField(i, 'unit', e.target.value)}
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
        </div>
    );
};

export default Metas;
