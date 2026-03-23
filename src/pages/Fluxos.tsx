import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    User,
    DollarSign,
    Briefcase,
    Trophy,
    XCircle,
    CheckCircle2,
    MoreHorizontal,
    BarChart3,
    ArrowRight,
    Clock,
    Target
} from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal/Modal';
import ConfirmDialog from '../components/Modal/ConfirmDialog';
import LoadingSkeleton from '../components/Layout/LoadingSkeleton';
import { useToast } from '../components/Layout/ToastContext';
import './Fluxos.css';

const Fluxos = ({ isWrapper = false }: { isWrapper?: boolean }) => {
    const { toast } = useToast();
    // Data State
    const [flows, setFlows] = useState<any[]>([]);
    const [activeFlow, setActiveFlow] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [people, setPeople] = useState<any[]>([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [statusFilter, setStatusFilter] = useState<'active' | 'won' | 'lost'>('active');
    const [closingAs, setClosingAs] = useState<'won' | 'lost' | null>(null);
    const [lostReason, setLostReason] = useState('');
    const [viewMode, setViewMode] = useState<'kanban' | 'analytics'>('kanban');
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        value: 0,
        clientId: '',
        responsibleId: '',
        priority: 'medium',
        stageId: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (activeFlow && items.length > 0) {
            // refresh filtered items if needed locally, but we filter in render
        }
    }, [activeFlow, items]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [flowsData, itemsData, clientsData, peopleData] = await Promise.all([
                api.flows.list(),
                api.items.list(),
                api.clients.list(),
                api.people.list()
            ]);

            setFlows(flowsData);
            setItems(itemsData);
            setClients(clientsData as any);
            setPeople(peopleData as any);

            if (flowsData.length > 0 && !activeFlow) {
                setActiveFlow(flowsData[0]);
            }
        } catch (error) {
            console.error('Failed to load fluxes', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAnalytics = async () => {
        if (!activeFlow) return;
        try {
            const data = await api.flows.analytics(activeFlow.id);
            setAnalyticsData(data);
        } catch (error) {
            console.error('Failed to load analytics', error);
        }
    };

    useEffect(() => {
        if (viewMode === 'analytics' && activeFlow) {
            loadAnalytics();
        }
    }, [viewMode, activeFlow]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // If no stage selected, define as first stage of active flow
            const stageId = formData.stageId || activeFlow?.stages[0]?.id;

            await api.items.create({
                ...formData,
                flowId: activeFlow.id,
                stageId
            } as any);

            // Refresh items
            const newItems = await api.items.list();
            setItems(newItems);

            setIsCreateModalOpen(false);
            setFormData({ title: '', value: 0, clientId: '', responsibleId: '', priority: 'medium', stageId: '' });
            toast('Item criado com sucesso!', 'success');
        } catch (error) {
            toast('Erro ao criar item', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;
        setSubmitting(true);
        try {
            await api.items.update(selectedItem.id, selectedItem);

            // Refresh items
            const newItems = await api.items.list();
            setItems(newItems);

            setIsEditModalOpen(false);
            setSelectedItem(null);
            toast('Item atualizado!', 'success');
        } catch (error) {
            toast('Erro ao atualizar item', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleMove = async (itemId: string, newStageId: string) => {
        try {
            // Optimistic update
            setItems(prev => prev.map(i => i.id === itemId ? { ...i, stageId: newStageId } : i));
            await api.items.move(itemId, newStageId);
        } catch (error) {
            toast('Erro ao mover item', 'error');
            loadData(); // Revert
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.items.delete(deleteTarget);
            setItems(prev => prev.filter(i => i.id !== deleteTarget));
            setIsEditModalOpen(false);
            toast('Item excluído', 'success');
        } catch (error) {
            toast('Erro ao excluir', 'error');
        } finally {
            setDeleteTarget(null);
        }
    };

    const handleClose = async (status: 'won' | 'lost') => {
        if (!selectedItem) return;
        if (status === 'lost' && !lostReason.trim()) {
            toast('Informe o motivo da perda.', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            const updated = await api.items.close(selectedItem.id, status, lostReason || undefined);
            setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
            setIsEditModalOpen(false);
            setClosingAs(null);
            setLostReason('');
        } catch (err: any) {
            toast(err.message || 'Erro ao encerrar item', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const openCreateModal = () => {
        setFormData({
            title: '',
            value: 0,
            clientId: '',
            responsibleId: '',
            priority: 'medium',
            stageId: activeFlow?.stages[0]?.id
        });
        setIsCreateModalOpen(true);
    };

    const openEditModal = (item: any) => {
        setSelectedItem({ ...item });
        setIsEditModalOpen(true);
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'critical': return 'var(--color-danger)';
            case 'high': return 'var(--color-warning)';
            case 'medium': return 'var(--color-secondary)';
            default: return 'var(--color-text-muted)';
        }
    };

    if (loading) return <div className="container animate-fade"><LoadingSkeleton type="table" rows={5} /></div>;
    if (!activeFlow) return <div className="p-8 text-center">Nenhum fluxo encontrado.</div>;

    const filteredItems = items.filter(i =>
        i.flowId === activeFlow.id &&
        i.status === statusFilter &&
        (i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const wonCount = items.filter(i => i.flowId === activeFlow.id && i.status === 'won').length;
    const lostCount = items.filter(i => i.flowId === activeFlow.id && i.status === 'lost').length;

    return (
        <div className={`container animate-fade ${isWrapper ? 'is-wrapper pt-0' : ''}`}>
            {!isWrapper && (
                <header className="page-header">
                    <div>
                        <h1 className="text-h2">Fluxos Operacionais</h1>
                        <p className="text-small">Gestão visual e pipeline de trabalho</p>
                    </div>
                    <div className="header-actions">
                        <div className="flow-selector">
                            {flows.map(flow => (
                                <button
                                    key={flow.id}
                                    className={`btn-tab ${activeFlow.id === flow.id ? 'active' : ''}`}
                                    onClick={() => setActiveFlow(flow)}
                                >
                                    {flow.name}
                                </button>
                            ))}
                        </div>
                        <div className="view-toggle">
                            <button
                                className={`btn-tab ${viewMode === 'kanban' ? 'active' : ''}`}
                                onClick={() => setViewMode('kanban')}
                            >
                                Kanban
                            </button>
                            <button
                                className={`btn-tab ${viewMode === 'analytics' ? 'active' : ''}`}
                                onClick={() => setViewMode('analytics')}
                            >
                                Analytics
                            </button>
                        </div>
                        <button className="btn btn-primary" onClick={openCreateModal}>
                            <Plus size={16} /> Novo Item
                        </button>
                    </div>
                </header>
            )}

            <div className={`toolbar ${isWrapper ? 'mt-4' : ''}`}>
                <div className="search-bar">
                    <Search size={16} className="text-muted" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, título..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filters">
                    <div className="status-filter-tabs">
                        <button className={`filter-tab ${statusFilter === 'active' ? 'active' : ''}`} onClick={() => setStatusFilter('active')}>
                            Em andamento
                        </button>
                        <button className={`filter-tab won ${statusFilter === 'won' ? 'active' : ''}`} onClick={() => setStatusFilter('won')}>
                            <Trophy size={13} /> Ganhas {wonCount > 0 && <span className="tab-badge">{wonCount}</span>}
                        </button>
                        <button className={`filter-tab lost ${statusFilter === 'lost' ? 'active' : ''}`} onClick={() => setStatusFilter('lost')}>
                            <XCircle size={13} /> Perdidas {lostCount > 0 && <span className="tab-badge lost">{lostCount}</span>}
                        </button>
                    </div>
                    <div className="text-sm text-gray-500">
                        Total: {filteredItems.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    {isWrapper && (
                        <div className="flex gap-2 ml-4">
                            <div className="flow-selector">
                                {flows.map(flow => (
                                    <button
                                        key={flow.id}
                                        className={`btn-tab ${activeFlow.id === flow.id ? 'active' : ''}`}
                                        onClick={() => setActiveFlow(flow)}
                                    >
                                        {flow.name}
                                    </button>
                                ))}
                            </div>
                            <div className="view-toggle">
                                <button
                                    className={`btn-tab ${viewMode === 'kanban' ? 'active' : ''}`}
                                    onClick={() => setViewMode('kanban')}
                                >
                                    Kanban
                                </button>
                                <button
                                    className={`btn-tab ${viewMode === 'analytics' ? 'active' : ''}`}
                                    onClick={() => setViewMode('analytics')}
                                >
                                    Analytics
                                </button>
                            </div>
                            <button className="btn btn-primary" onClick={openCreateModal}>
                                <Plus size={16} /> Novo Item
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="kanban-board">
                {viewMode === 'kanban' ? (
                    activeFlow.stages.map((stage: any) => {
                        const stageItems = filteredItems.filter(i => i.stageId === stage.id);
                        const totalValue = stageItems.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

                        return (
                            <div key={stage.id} className="kanban-column">
                                <div className="column-header">
                                    <div className="column-title">
                                        <span className="stage-name">{stage.name}</span>
                                        <span className="stage-count">{stageItems.length}</span>
                                    </div>
                                    {totalValue > 0 && (
                                        <div className="column-value">
                                            {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </div>
                                    )}
                                </div>

                                <div className="column-body">
                                    {stageItems.map(item => (
                                        <div
                                            key={item.id}
                                            className={`kanban-card ${item.status === 'won' ? 'card-won' : item.status === 'lost' ? 'card-lost' : ''}`}
                                            onClick={() => openEditModal(item)}
                                        >
                                            <div className="card-top">
                                                <div className="card-priority" style={{ backgroundColor: getPriorityColor(item.priority) }}></div>
                                                <span className="card-id">#{item.id.slice(0, 4)}</span>
                                                {item.status === 'won' && <Trophy size={13} className="text-success ml-auto" />}
                                                {item.status === 'lost' && <XCircle size={13} className="text-danger ml-auto" />}
                                                {item.status === 'active' && <button className="btn-icon-xs"><MoreHorizontal size={14} /></button>}
                                            </div>
                                            <h4 className="card-title">{item.title}</h4>
                                            <span className="card-client">
                                                <Briefcase size={12} className="inline mr-1" />
                                                {item.client?.name || 'Sem cliente'}
                                            </span>

                                            <div className="card-meta">
                                                {item.value && item.value > 0 ? (
                                                    <span className="meta-tag value">
                                                        <DollarSign size={12} /> {Number(item.value).toLocaleString('pt-BR', { notation: 'compact' })}
                                                    </span>
                                                ) : null}
                                                <span className="meta-tag">
                                                    <User size={12} /> {item.responsible?.name?.split(' ')[0] || '?'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    analyticsData && (
                        <div className="analytics-view w-full animate-fade">
                            <div className="analytics-grid">
                                {/* Funnel Chart Section */}
                                <section className="card card-analytics funnel-section">
                                    <h3 className="text-h3 mb-6 flex items-center gap-2"><BarChart3 size={20} /> Funil de Conversão</h3>
                                    <div className="funnel-container">
                                        {analyticsData.funnel.map((step: any, idx: number) => {
                                            const prevCount = idx > 0 ? analyticsData.funnel[idx - 1].count : step.count;
                                            const conversion = prevCount > 0 ? Math.round((step.count / prevCount) * 100) : 100;
                                            const width = idx === 0 ? 100 : Math.max(20, (step.count / analyticsData.funnel[0].count) * 100);

                                            return (
                                                <div key={step.stageId} className="funnel-step-wrapper">
                                                    <div className="funnel-step" style={{ width: `${width}%` }}>
                                                        <span className="step-label">{step.name}</span>
                                                        <span className="step-count">{step.count} items</span>
                                                    </div>
                                                    {idx < analyticsData.funnel.length - 1 && (
                                                        <div className="funnel-connector">
                                                            <ArrowRight size={14} /> {conversion}% conversão
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>

                                {/* Stats Column */}
                                <aside className="space-y-md">
                                    <div className="stat-card">
                                        <div className="stat-icon success"><Trophy size={20} /></div>
                                        <div className="stat-info">
                                            <span className="stat-label">Win Rate</span>
                                            <span className="stat-value">{analyticsData.winRate}%</span>
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon info"><Clock size={20} /></div>
                                        <div className="stat-info">
                                            <span className="stat-label">Ciclo de Venda</span>
                                            <span className="stat-value">{analyticsData.avgVelocityDays} dias</span>
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon warning"><Target size={20} /></div>
                                        <div className="stat-info">
                                            <span className="stat-label">Forecast (Ponderado)</span>
                                            <span className="stat-value">R$ {analyticsData.forecast.forecastValue.toLocaleString('pt-BR')}</span>
                                            <span className="stat-sub">Pipeline Total: R$ {analyticsData.forecast.pipelineValue.toLocaleString('pt-BR')}</span>
                                        </div>
                                    </div>
                                </aside>
                            </div>

                            {/* Cycle time detailed list */}
                            <section className="card mt-6">
                                <h3 className="text-h3 mb-4">Eficiência por Etapa (Lead Time)</h3>
                                <div className="cycle-table">
                                    {analyticsData.cycleTimes.map((ct: any) => (
                                        <div key={ct.stageId} className="cycle-row">
                                            <span className="cycle-stage">{ct.name}</span>
                                            <div className="cycle-bar-container">
                                                <div
                                                    className="cycle-bar-fill"
                                                    style={{ width: `${Math.min(100, (ct.avgHours / 72) * 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="cycle-value">{ct.avgHours}h méd.</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )
                )}
            </div>

            {/* CREATE MODAL */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Novo Item"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>Criar</button>
                    </>
                }
            >
                <form className="form-grid">
                    <div className="form-group">
                        <label>Título / Oportunidade</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Cliente</label>
                        <select
                            className="input-field"
                            value={formData.clientId}
                            onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                        >
                            <option value="">Selecione um cliente...</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Valor (R$)</label>
                        <input
                            type="number"
                            className="input-field"
                            value={formData.value}
                            onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Responsável</label>
                        <select
                            className="input-field"
                            value={formData.responsibleId}
                            onChange={e => setFormData({ ...formData, responsibleId: e.target.value })}
                        >
                            <option value="">Selecione...</option>
                            {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Estágio Inicial</label>
                        <select
                            className="input-field"
                            value={formData.stageId}
                            onChange={e => setFormData({ ...formData, stageId: e.target.value })}
                        >
                            {activeFlow.stages.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Prioridade</label>
                        <select
                            className="input-field"
                            value={formData.priority}
                            onChange={e => setFormData({ ...formData, priority: e.target.value })}
                        >
                            <option value="low">Baixa</option>
                            <option value="medium">Média</option>
                            <option value="high">Alta</option>
                            <option value="critical">Crítica</option>
                        </select>
                    </div>
                </form>
            </Modal>

            {/* EDIT MODAL */}
            {selectedItem && (
                <Modal
                    isOpen={isEditModalOpen}
                    onClose={() => { setIsEditModalOpen(false); setClosingAs(null); setLostReason(''); }}
                    title={selectedItem.status === 'won' ? '🏆 Oportunidade Ganha' : selectedItem.status === 'lost' ? '❌ Oportunidade Perdida' : 'Detalhes do Item'}
                    footer={
                        <div className="flex justify-between w-full">
                            <button className="btn btn-text text-danger" onClick={() => setDeleteTarget(selectedItem.id)}>Excluir</button>
                            <div className="flex gap-2">
                                <button className="btn btn-secondary" onClick={() => { setIsEditModalOpen(false); setClosingAs(null); }}>Cancelar</button>
                                {selectedItem.status === 'active' && (
                                    <button className="btn btn-primary" onClick={handleUpdate} disabled={submitting}>Salvar</button>
                                )}
                            </div>
                        </div>
                    }
                >
                    <form className="form-grid">
                        <div className="form-group">
                            <label>Título</label>
                            <input
                                type="text"
                                className="input-field"
                                value={selectedItem.title}
                                disabled={selectedItem.status !== 'active'}
                                onChange={e => setSelectedItem({ ...selectedItem, title: e.target.value })}
                            />
                        </div>
                        {selectedItem.status === 'active' && (
                            <div className="form-group">
                                <label>Estágio (Mover)</label>
                                <select
                                    className="input-field"
                                    value={selectedItem.stageId}
                                    onChange={e => {
                                        setSelectedItem({ ...selectedItem, stageId: e.target.value });
                                        handleMove(selectedItem.id, e.target.value);
                                    }}
                                >
                                    {activeFlow.stages.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="form-group">
                            <label>Valor (R$)</label>
                            <input
                                type="number"
                                className="input-field"
                                value={selectedItem.value}
                                disabled={selectedItem.status !== 'active'}
                                onChange={e => setSelectedItem({ ...selectedItem, value: Number(e.target.value) })}
                            />
                        </div>
                    </form>

                    {/* ── Close action zone (only for active items) ── */}
                    {selectedItem.status === 'active' && (
                        <div className="close-action-zone">
                            <p className="close-zone-label">Encerrar oportunidade</p>
                            {closingAs === null && (
                                <div className="close-buttons">
                                    <button className="btn-close won" onClick={() => handleClose('won')} disabled={submitting}>
                                        <Trophy size={15} /> Marcar como GANHA
                                    </button>
                                    <button className="btn-close lost" onClick={() => setClosingAs('lost')}>
                                        <XCircle size={15} /> Marcar como PERDIDA
                                    </button>
                                </div>
                            )}
                            {closingAs === 'lost' && (
                                <div className="lost-reason-form">
                                    <input
                                        className="input-field"
                                        placeholder="Motivo da perda (obrigatório)..."
                                        value={lostReason}
                                        onChange={e => setLostReason(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <button className="btn btn-secondary flex-1" onClick={() => setClosingAs(null)}>Cancelar</button>
                                        <button className="btn-close lost flex-1" onClick={() => handleClose('lost')} disabled={submitting}>
                                            <CheckCircle2 size={14} /> Confirmar Perda
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {selectedItem.status === 'won' && (
                        <div className="close-result-banner won">
                            <Trophy size={18} /> Venda fechada em {selectedItem.closedAt ? new Date(selectedItem.closedAt).toLocaleDateString('pt-BR') : '—'}
                        </div>
                    )}
                    {selectedItem.status === 'lost' && (
                        <div className="close-result-banner lost">
                            <XCircle size={18} /> Perdida em {selectedItem.closedAt ? new Date(selectedItem.closedAt).toLocaleDateString('pt-BR') : '—'}
                        </div>
                    )}
                </Modal>
            )}

            <ConfirmDialog
                isOpen={!!deleteTarget}
                title="Excluir Item"
                message="Tem certeza que deseja excluir este item do pipeline? Esta ação não pode ser desfeita."
                confirmLabel="Excluir"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

export default Fluxos;
