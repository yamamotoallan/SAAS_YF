import { useState } from 'react';
import {
    Plus,
    Filter,
    Search,
    MoreHorizontal,
    Clock,
    User,
    DollarSign,
    AlertCircle
} from 'lucide-react';
import { SALES_FLOW, PROJECT_FLOW, MOCK_ITEMS, type OperatingFlow, type OperatingItem } from '../data/unified';
import './Fluxos.css';

const Fluxos = () => {
    const [activeFlow, setActiveFlow] = useState<OperatingFlow>(SALES_FLOW);
    const [items] = useState<OperatingItem[]>(MOCK_ITEMS);

    const filteredItems = items.filter(item => item.flowId === activeFlow.id);

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'critical': return 'var(--color-danger)';
            case 'high': return 'var(--color-warning)';
            case 'medium': return 'var(--color-secondary)';
            default: return 'var(--color-text-muted)';
        }
    };

    return (
        <div className="container animate-fade">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Fluxos Operacionais</h1>
                    <p className="text-small">Gestão visual de itens e processos</p>
                </div>
                <div className="header-actions">
                    <div className="flow-selector">
                        <button
                            className={`btn-tab ${activeFlow.id === SALES_FLOW.id ? 'active' : ''}`}
                            onClick={() => setActiveFlow(SALES_FLOW)}
                        >
                            Vendas B2B
                        </button>
                        <button
                            className={`btn-tab ${activeFlow.id === PROJECT_FLOW.id ? 'active' : ''}`}
                            onClick={() => setActiveFlow(PROJECT_FLOW)}
                        >
                            Projetos
                        </button>
                    </div>
                    <button className="btn btn-primary">
                        <Plus size={16} /> Novo Item
                    </button>
                </div>
            </header>

            <div className="toolbar">
                <div className="search-bar">
                    <Search size={16} className="text-muted" />
                    <input type="text" placeholder="Buscar por cliente, título ou ID..." />
                </div>
                <div className="filters">
                    <button className="btn-icon"><Filter size={16} /></button>
                    <button className="btn-text">Meus Itens</button>
                    <button className="btn-text">Atrasados</button>
                </div>
            </div>

            <div className="kanban-board">
                {activeFlow.stages.map(stage => {
                    const stageItems = filteredItems.filter(i => i.stageId === stage.id);
                    const totalValue = stageItems.reduce((acc, curr) => acc + (curr.value || 0), 0);

                    return (
                        <div key={stage.id} className="kanban-column">
                            <div className="column-header">
                                <div className="column-title">
                                    <span className="stage-name">{stage.name}</span>
                                    <span className="stage-count">{stageItems.length}</span>
                                </div>
                                {totalValue > 0 && (
                                    <div className="column-value">
                                        R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </div>
                                )}
                                <div className="stage-sla">SLA: {stage.sla > 0 ? `${stage.sla}h` : '-'}</div>
                            </div>

                            <div className="column-body">
                                {stageItems.map(item => (
                                    <div key={item.id} className="kanban-card">
                                        <div className="card-top">
                                            <div className="card-priority" style={{ backgroundColor: getPriorityColor(item.priority) }}></div>
                                            <span className="card-id">#{item.id}</span>
                                            <button className="btn-icon-xs"><MoreHorizontal size={14} /></button>
                                        </div>
                                        <h4 className="card-title">{item.title}</h4>
                                        <span className="card-client">{item.clientName}</span>

                                        <div className="card-meta">
                                            {item.value && item.value > 0 ? (
                                                <span className="meta-tag value">
                                                    <DollarSign size={12} /> {item.value.toLocaleString('pt-BR', { notation: 'compact' })}
                                                </span>
                                            ) : null}
                                            <span className="meta-tag">
                                                <User size={12} /> {item.responsibleName?.split(' ')[0]}
                                            </span>
                                        </div>

                                        <div className="card-footer">
                                            <span className="time-tag">
                                                <Clock size={12} /> 2d atrás
                                            </span>
                                            {Math.random() > 0.7 && (
                                                <span className="warning-tag">
                                                    <AlertCircle size={12} /> Atrasado
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {stageItems.length === 0 && (
                                    <div className="empty-column-placeholder">
                                        Nenhum item
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Fluxos;
