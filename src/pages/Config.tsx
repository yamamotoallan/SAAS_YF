import { useState, useEffect, type ReactNode } from 'react';
import {
    Activity,
    Filter,
    RefreshCw,
    Plus,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    ArrowRight,
    User
} from 'lucide-react';
import { api } from '../services/api';
import './Config.css';

const MODULE_LABELS: Record<string, string> = {
    client: 'Cliente',
    financial: 'Financeiro',
    people: 'Pessoas',
    alert: 'Alerta',
    kpi: 'KPI',
    flow: 'Fluxo',
    item: 'Item',
    process: 'Processo',
    company: 'Empresa',
};

const ACTION_CONFIG: Record<string, { label: string; icon: ReactNode; color: string }> = {
    created: { label: 'Criado', icon: <Plus size={14} />, color: 'var(--color-success)' },
    updated: { label: 'Atualizado', icon: <Edit2 size={14} />, color: 'var(--color-primary)' },
    deleted: { label: 'Excluído', icon: <Trash2 size={14} />, color: 'var(--color-danger)' },
    resolved: { label: 'Resolvido', icon: <CheckCircle size={14} />, color: 'var(--color-success)' },
    dismissed: { label: 'Dispensado', icon: <XCircle size={14} />, color: 'var(--color-text-secondary)' },
    moved: { label: 'Movido', icon: <ArrowRight size={14} />, color: 'var(--color-warning)' },
    invited: { label: 'Convidado', icon: <User size={14} />, color: 'var(--color-secondary)' },
};

const Config = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [moduleFilter, setModuleFilter] = useState('all');
    const [actionFilter, setActionFilter] = useState('all');

    const loadLogs = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { limit: '200' };
            if (moduleFilter !== 'all') params.module = moduleFilter;
            if (actionFilter !== 'all') params.action = actionFilter;
            const data = await api.logs.list(params);
            setLogs(data);
        } catch (e) {
            console.error('Failed to load logs:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadLogs(); }, [moduleFilter, actionFilter]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Log de Atividades</h1>
                    <p className="page-subtitle">Histórico completo de ações realizadas no sistema</p>
                </div>
                <button className="btn btn-secondary" onClick={loadLogs} disabled={loading}>
                    <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                    Atualizar
                </button>
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div className="log-filters">
                    <div className="filter-group">
                        <Filter size={16} />
                        <span>Filtrar por:</span>
                    </div>
                    <select
                        className="input-field"
                        value={moduleFilter}
                        onChange={e => setModuleFilter(e.target.value)}
                        style={{ width: 'auto' }}
                    >
                        <option value="all">Todos os Módulos</option>
                        {Object.entries(MODULE_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                    <select
                        className="input-field"
                        value={actionFilter}
                        onChange={e => setActionFilter(e.target.value)}
                        style={{ width: 'auto' }}
                    >
                        <option value="all">Todas as Ações</option>
                        {Object.entries(ACTION_CONFIG).map(([key, { label }]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                    <span className="text-secondary" style={{ marginLeft: 'auto', fontSize: '0.875rem' }}>
                        {logs.length} registro{logs.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            <div className="card">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner" />
                        <p>Carregando logs...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="empty-state">
                        <Activity size={40} />
                        <p>Nenhuma atividade registrada ainda.</p>
                        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                            As ações de criação, edição e exclusão serão registradas aqui.
                        </p>
                    </div>
                ) : (
                    <div className="log-timeline">
                        {logs.map((log, idx) => {
                            const actionCfg = ACTION_CONFIG[log.action] || { label: log.action, icon: <Activity size={14} />, color: 'var(--color-text-secondary)' };
                            const moduleLabel = MODULE_LABELS[log.module] || log.module;
                            return (
                                <div key={log.id} className="log-entry">
                                    <div className="log-icon" style={{ background: actionCfg.color + '20', color: actionCfg.color }}>
                                        {actionCfg.icon}
                                    </div>
                                    <div className="log-content">
                                        <div className="log-main">
                                            <span className="log-action-badge" style={{ color: actionCfg.color }}>
                                                {actionCfg.label}
                                            </span>
                                            <span className="log-module-badge">{moduleLabel}</span>
                                            <span className="log-entity">{log.entityName}</span>
                                        </div>
                                        <div className="log-meta">
                                            <span>{log.user ? log.user.name : 'Sistema'}</span>
                                            <span>•</span>
                                            <span>{formatDate(log.createdAt)}</span>
                                        </div>
                                    </div>
                                    {idx < logs.length - 1 && <div className="log-line" />}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Config;
