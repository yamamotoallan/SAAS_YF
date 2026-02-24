import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Phone,
    Mail,
    Building2,
    User,
    ExternalLink,
    Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Client } from '../types/api';
import Modal from '../components/Modal/Modal';
import './Clientes.css';

const Clientes = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        document: '',
        email: '',
        phone: '',
        segment: 'Tecnologia',
        type: 'PJ' as Client['type']
    });

    const segments = ['Tecnologia', 'Varejo', 'Saúde', 'Indústria', 'Serviços', 'Educação'];

    useEffect(() => {
        loadClients();
    }, [page, searchTerm]);

    const loadClients = async () => {
        try {
            setLoading(true);
            const res = await api.clients.list({
                page: page.toString(),
                search: searchTerm,
                limit: '12' // 3 columns x 4 rows approx
            });
            setClients(res.data);
            setMeta(res.meta);
        } catch (error) {
            console.error('Failed to load clients', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.clients.create(formData);
            await loadClients();
            setIsModalOpen(false);
            setFormData({ name: '', document: '', email: '', phone: '', segment: 'Tecnologia', type: 'PJ' as Client['type'] });
        } catch (error) {
            alert('Erro ao criar cliente');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
        try {
            await api.clients.delete(id);
            setClients(clients.filter(c => c.id !== id));
        } catch (error) {
            alert('Erro ao excluir cliente');
        }
    };

    // Backend-driven filtering
    const displayClients = clients;

    return (
        <div className="container animate-fade">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Carteira de Clientes</h1>
                    <p className="text-small">Gestão de relacionamento e contas (CRM)</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} /> Novo Cliente
                </button>
            </header>

            <div className="toolbar">
                <div className="search-bar">
                    <Search size={16} className="text-muted" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, email ou segmento..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filters">
                    <button className="btn-icon"><Filter size={16} /></button>
                    <button className="btn-text">Ativos</button>
                    <button className="btn-text">Prospects</button>
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center text-muted">Carregando carteira...</div>
            ) : displayClients.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon"><User size={48} /></div>
                    <h3>Nenhum cliente encontrado</h3>
                    <p>{searchTerm ? 'Tente outros termos de busca.' : 'Comece adicionando o primeiro cliente para sua carteira.'}</p>
                    {!searchTerm && (
                        <button className="btn btn-primary mt-4" onClick={() => setIsModalOpen(true)}>
                            Adicionar Cliente
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="clients-grid">
                        {displayClients.map(client => (
                            <div key={client.id} className="client-card">
                                <div className="client-header">
                                    <div className="client-avatar">
                                        {client.type === 'PJ' ? <Building2 size={20} /> : <User size={20} />}
                                    </div>
                                    <div className="client-main-info">
                                        <h3 className="client-name">{client.name}</h3>
                                        <span className="client-segment">{client.segment || 'Sem segmento'}</span>
                                    </div>
                                    <div className="dropdown">
                                        <button className="btn-icon"><MoreVertical size={16} /></button>
                                    </div>
                                </div>

                                <div className="client-body">
                                    <div className="info-row">
                                        <Mail size={14} className="text-muted" />
                                        <span className="text-small">{client.email || '-'}</span>
                                    </div>
                                    <div className="info-row">
                                        <Phone size={14} className="text-muted" />
                                        <span className="text-small">{client.phone || '-'}</span>
                                    </div>
                                </div>

                                <div className="client-footer">
                                    <div className="client-intelligence">
                                        <div className="health-bar-container" title={`Saúde: ${client.healthScore || 0}%`}>
                                            <div
                                                className={`health-bar-fill ${client.healthScore > 70 ? 'success' : client.healthScore > 40 ? 'warning' : 'danger'}`}
                                                style={{ width: `${client.healthScore || 0}%` }}
                                            ></div>
                                        </div>
                                        {client.daysSinceLastActivity > 30 && (
                                            <span className="churn-badge high">Risco de Churn</span>
                                        )}
                                    </div>
                                    <div className="client-value">
                                        <span className="value-label">LTV</span>
                                        <span className="value-amount">
                                            {Number(client.ltv || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' })}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="btn-icon-sm text-danger" onClick={() => handleDelete(client.id)} title="Excluir">
                                            <Trash2 size={14} />
                                        </button>
                                        <button className="btn-icon-sm" title="Ver Perfil" onClick={() => navigate(`/clientes/${client.id}`)}>
                                            <ExternalLink size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {meta && meta.totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="btn btn-secondary"
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                Anterior
                            </button>
                            <span className="text-small">
                                Página {page} de {meta.totalPages} ({meta.total} totais)
                            </span>
                            <button
                                className="btn btn-secondary"
                                disabled={page === meta.totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Próxima
                            </button>
                        </div>
                    )}
                </>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Novo Cliente"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Salvando...' : 'Salvar Cliente'}
                        </button>
                    </>
                }
            >
                <form className="form-grid" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nome do Cliente / Razão Social</label>
                        <input
                            type="text"
                            required
                            className="input-field"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Tipo</label>
                        <select
                            className="input-field"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value as Client['type'] })}
                        >
                            <option value="PJ">Pessoa Jurídica (PJ)</option>
                            <option value="PF">Pessoa Física (PF)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Segmento</label>
                        <select
                            className="input-field"
                            value={formData.segment}
                            onChange={e => setFormData({ ...formData, segment: e.target.value })}
                        >
                            {segments.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Email Principal</label>
                        <input
                            type="email"
                            className="input-field"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Telefone / WhatsApp</label>
                        <input
                            type="tel"
                            className="input-field"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Documento (CPF/CNPJ)</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.document}
                            onChange={e => setFormData({ ...formData, document: e.target.value })}
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Clientes;
