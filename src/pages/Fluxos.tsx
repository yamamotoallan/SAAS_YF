import { useState, useEffect } from 'react';
import {
    Plus,
    Filter,
    Search,
    MoreHorizontal,
    User,
    DollarSign,
    Briefcase
} from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal/Modal';
import './Fluxos.css';

const Fluxos = () => {
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
            setClients(clientsData);
            setPeople(peopleData);

            if (flowsData.length > 0 && !activeFlow) {
                setActiveFlow(flowsData[0]);
            }
        } catch (error) {
            console.error('Failed to load fluxes', error);
        } finally {
            setLoading(false);
        }
    };

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
            });

            // Refresh items
            const newItems = await api.items.list();
            setItems(newItems);

            setIsCreateModalOpen(false);
            setFormData({ title: '', value: 0, clientId: '', responsibleId: '', priority: 'medium', stageId: '' });
        } catch (error) {
            alert('Erro ao criar item');
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
        } catch (error) {
            alert('Erro ao atualizar item');
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
            alert('Erro ao mover item');
            loadData(); // Revert
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este item?')) return;
        try {
            await api.items.delete(id);
            setItems(prev => prev.filter(i => i.id !== id));
            setIsEditModalOpen(false);
        } catch (error) {
            alert('Erro ao excluir');
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

    if (loading) return <div className="p-8 text-center">Carregando fluxos...</div>;
    if (!activeFlow) return <div className="p-8 text-center">Nenhum fluxo encontrado.</div>;

    const filteredItems = items.filter(i =>
        i.flowId === activeFlow.id &&
        (i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="container animate-fade">
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
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        <Plus size={16} /> Novo Item
                    </button>
                </div>
            </header>

            <div className="toolbar">
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
                    <button className="btn-icon"><Filter size={16} /></button>
                    <div className="text-sm text-gray-500">
                        Total: {filteredItems.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                </div>
            </div>

            <div className="kanban-board">
                {activeFlow.stages.map((stage: any) => {
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
                                        className="kanban-card"
                                        onClick={() => openEditModal(item)}
                                    >
                                        <div className="card-top">
                                            <div className="card-priority" style={{ backgroundColor: getPriorityColor(item.priority) }}></div>
                                            <span className="card-id">#{item.id.slice(0, 4)}</span>
                                            <button className="btn-icon-xs"><MoreHorizontal size={14} /></button>
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
                })}
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
                    onClose={() => setIsEditModalOpen(false)}
                    title="Detalhes do Item"
                    footer={
                        <div className="flex justify-between w-full">
                            <button className="btn btn-text text-danger" onClick={() => handleDelete(selectedItem.id)}>Excluir</button>
                            <div className="flex gap-2">
                                <button className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
                                <button className="btn btn-primary" onClick={handleUpdate} disabled={submitting}>Salvar</button>
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
                                onChange={e => setSelectedItem({ ...selectedItem, title: e.target.value })}
                            />
                        </div>
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
                        <div className="form-group">
                            <label>Valor (R$)</label>
                            <input
                                type="number"
                                className="input-field"
                                value={selectedItem.value}
                                onChange={e => setSelectedItem({ ...selectedItem, value: Number(e.target.value) })}
                            />
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Fluxos;
