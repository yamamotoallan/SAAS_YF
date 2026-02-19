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
import { api } from '../services/api';
import Modal from '../components/Modal/Modal';
import './Clientes.css';

const Clientes = () => {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        document: '',
        email: '',
        phone: '',
        segment: 'Tecnologia',
        type: 'PJ'
    });

    const segments = ['Tecnologia', 'Varejo', 'Saúde', 'Indústria', 'Serviços', 'Educação'];

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const data = await api.clients.list();
            setClients(data);
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
            setFormData({ name: '', document: '', email: '', phone: '', segment: 'Tecnologia', type: 'PJ' });
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <span className="status-badge success">Ativo</span>;
            case 'prospect': return <span className="status-badge warning">Prospect</span>;
            case 'inactive': return <span className="status-badge neutral">Inativo</span>;
            default: return null;
        }
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            ) : filteredClients.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon"><User size={48} /></div>
                    <h3>Nenhum cliente encontrado</h3>
                    <p>Comece adicionando o primeiro cliente para sua carteira.</p>
                    <button className="btn btn-primary mt-4" onClick={() => setIsModalOpen(true)}>
                        Adicionar Cliente
                    </button>
                </div>
            ) : (
                <div className="clients-grid">
                    {filteredClients.map(client => (
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
                                <div className="client-status">
                                    {getStatusBadge(client.status || 'active')}
                                </div>
                                <div className="client-value">
                                    <span className="value-label">LTV</span>
                                    <span className="value-amount">R$ 0</span>
                                </div>
                                <div className="flex gap-2">
                                    <button className="btn-icon-sm text-danger" onClick={() => handleDelete(client.id)} title="Excluir">
                                        <Trash2 size={14} />
                                    </button>
                                    <button className="btn-icon-sm" title="Ver Detalhes">
                                        <ExternalLink size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
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
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
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
