import { useState } from 'react';
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Phone,
    Mail,
    Building2,
    User,
    ExternalLink
} from 'lucide-react';
import { MOCK_CLIENTS, type Client } from '../data/unified';
import './Clientes.css';

const Clientes = () => {
    const [clients] = useState<Client[]>(MOCK_CLIENTS);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <span className="status-badge success">Ativo</span>;
            case 'prospect': return <span className="status-badge warning">Prospect</span>;
            case 'inactive': return <span className="status-badge neutral">Inativo</span>;
            default: return null;
        }
    };

    return (
        <div className="container animate-fade">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Carteira de Clientes</h1>
                    <p className="text-small">Gestão de relacionamento e contas (CRM)</p>
                </div>
                <button className="btn btn-primary">
                    <Plus size={16} /> Novo Cliente
                </button>
            </header>

            <div className="toolbar">
                <div className="search-bar">
                    <Search size={16} className="text-muted" />
                    <input type="text" placeholder="Buscar por nome, email ou segmento..." />
                </div>
                <div className="filters">
                    <button className="btn-icon"><Filter size={16} /></button>
                    <button className="btn-text">Ativos</button>
                    <button className="btn-text">Prospects</button>
                </div>
            </div>

            <div className="clients-grid">
                {clients.map(client => (
                    <div key={client.id} className="client-card">
                        <div className="client-header">
                            <div className="client-avatar">
                                {client.type === 'PJ' ? <Building2 size={20} /> : <User size={20} />}
                            </div>
                            <div className="client-main-info">
                                <h3 className="client-name">{client.name}</h3>
                                <span className="client-segment">{client.segment}</span>
                            </div>
                            <button className="btn-icon"><MoreVertical size={16} /></button>
                        </div>

                        <div className="client-body">
                            <div className="info-row">
                                <Mail size={14} className="text-muted" />
                                <span className="text-small">{client.email}</span>
                            </div>
                            <div className="info-row">
                                <Phone size={14} className="text-muted" />
                                <span className="text-small">{client.phone}</span>
                            </div>
                        </div>

                        <div className="client-footer">
                            <div className="client-status">
                                {getStatusBadge(client.status)}
                            </div>
                            <div className="client-value">
                                <span className="value-label">LTV</span>
                                <span className="value-amount">
                                    R$ {(client.totalValue || 0).toLocaleString('pt-BR', { notation: 'compact' })}
                                </span>
                            </div>
                            <button className="btn-icon-sm" title="Ver Detalhes">
                                <ExternalLink size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Clientes;
