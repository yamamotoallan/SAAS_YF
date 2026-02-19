import { useState, useEffect } from 'react';
import {
    AlertTriangle,
    CheckCircle,
    XCircle,
    Plus,
    Filter,
    Activity,
    BrainCircuit,
    DollarSign,
    Users,
    Clock
} from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal/Modal';
import './Alertas.css';

const Alertas = () => {
    // Data State
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'operational',
        priority: 'medium'
    });

    useEffect(() => {
        loadAlerts();
    }, [activeTab]);

    const loadAlerts = async () => {
        try {
            setLoading(true);
            const status = activeTab === 'history' ? 'history' : 'active';
            const data = await api.alerts.list({ status });
            setAlerts(data);
        } catch (error) {
            console.error('Failed to load alerts', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.alerts.resolve(id);
            setAlerts(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            alert('Erro ao resolver alerta');
        }
    };

    const handleDismiss = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.alerts.dismiss(id);
            setAlerts(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            alert('Erro ao dispensar alerta');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.alerts.create(formData);
            if (activeTab === 'active') await loadAlerts();
            setIsModalOpen(false);
            setFormData({ title: '', description: '', type: 'operational', priority: 'medium' });
        } catch (error) {
            alert('Erro ao criar alerta');
        } finally {
            setSubmitting(false);
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'high': return <span className="badge badge-danger">Alta</span>;
            case 'medium': return <span className="badge badge-warning">Média</span>;
            case 'low': return <span className="badge badge-neutral">Baixa</span>;
            default: return null;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'financial': return <DollarSign size={20} className="text-success" />;
            case 'people': return <Users size={20} className="text-secondary" />;
            case 'operational': return <Activity size={20} className="text-warning" />;
            case 'system': return <BrainCircuit size={20} className="text-primary" />;
            default: return <AlertTriangle size={20} className="text-muted" />;
        }
    };

    return (
        <div className="container animate-fade">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Central de Alertas</h1>
                    <p className="text-small">Monitoramento inteligente e notificações</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} /> Novo Alerta
                </button>
            </header>

            <div className="toolbar">
                <div className="tabs">
                    <button
                        className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        Pendentes
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        Histórico
                    </button>
                </div>
                <button className="btn-icon"><Filter size={16} /></button>
            </div>

            {loading ? (
                <div className="p-8 text-center text-muted">Carregando alertas...</div>
            ) : alerts.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon"><CheckCircle size={48} className="text-success" /></div>
                    <h3>Tudo limpo!</h3>
                    <p>{activeTab === 'active' ? 'Não há alertas pendentes no momento.' : 'Nenhum histórico encontrado.'}</p>
                </div>
            ) : (
                <div className="alerts-feed">
                    {alerts.map(alert => (
                        <div key={alert.id} className={`alert-card priority-${alert.priority || 'medium'}`}>
                            <div className="alert-icon-area">
                                {getTypeIcon(alert.type)}
                            </div>
                            <div className="alert-content">
                                <div className="alert-header-row">
                                    <h3 className="alert-title">{alert.title}</h3>
                                    {getPriorityBadge(alert.priority)}
                                </div>
                                <p className="alert-desc">{alert.description}</p>
                                <div className="alert-meta">
                                    <span className="meta-item"><Clock size={12} /> {new Date(alert.createdAt).toLocaleDateString()}</span>
                                    <span className="meta-item ml-2 capitalize">• {alert.type}</span>
                                </div>
                            </div>
                            {activeTab === 'active' && (
                                <div className="alert-actions">
                                    <button
                                        className="btn-icon-action success"
                                        title="Resolver"
                                        onClick={(e) => handleResolve(alert.id, e)}
                                    >
                                        <CheckCircle size={18} />
                                    </button>
                                    <button
                                        className="btn-icon-action danger"
                                        title="Ignorar"
                                        onClick={(e) => handleDismiss(alert.id, e)}
                                    >
                                        <XCircle size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Criar Alerta Manual"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>Criar</button>
                    </>
                }
            >
                <form className="form-grid">
                    <div className="form-group">
                        <label>Título</label>
                        <input
                            type="text"
                            className="input-field"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Descrição</label>
                        <textarea
                            className="input-field"
                            rows={3}
                            required
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Tipo</label>
                        <select
                            className="input-field"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="operational">Operacional</option>
                            <option value="financial">Financeiro</option>
                            <option value="people">Pessoas</option>
                            <option value="system">Sistema</option>
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
                        </select>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Alertas;
