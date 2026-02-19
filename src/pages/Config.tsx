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
    User,
    Settings,
    Building2,
    Save
} from 'lucide-react';
import { api } from '../services/api';
import RulesConfig from '../components/Config/RulesConfig';
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
    const [activeTab, setActiveTab] = useState<'general' | 'params' | 'rules' | 'logs'>('general');
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState<string>('viewer');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('yf_user') || '{}');
        setUserRole(user.role || 'viewer');
        // If not admin and trying to access admin tabs, switch to logs or something safe
        if (user.role !== 'admin' && activeTab !== 'logs') {
            setActiveTab('logs');
        }
    }, []);

    // Logs State
    const [logs, setLogs] = useState<any[]>([]);
    const [moduleFilter, setModuleFilter] = useState('all');
    const [actionFilter, setActionFilter] = useState('all');

    // Company State
    const [company, setCompany] = useState<any>({
        name: '', cnpj: '', segment: '', revenue: 0, headcount: 0,
        financialTargets: { revenue: 0, margin: 0 },
        settings: { sla: 24, alertThresholds: { margin: 10, turnover: 5 } }
    });

    useEffect(() => {
        if (activeTab === 'logs') loadLogs();
        if (activeTab === 'general' || activeTab === 'params') loadCompany();
    }, [activeTab, moduleFilter, actionFilter]);

    const loadCompany = async () => {
        setLoading(true);
        try {
            const data = await api.company.get();
            setCompany({
                ...data,
                financialTargets: data.financialTargets || { revenue: 0, margin: 0 },
                settings: data.settings || { sla: 24, alertThresholds: { margin: 10, turnover: 5 } }
            });
        } catch (error) {
            console.error('Failed to load company', error);
        } finally {
            setLoading(false);
        }
    };

    const loadLogs = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { limit: '200' };
            if (moduleFilter !== 'all') params.module = moduleFilter;
            if (actionFilter !== 'all') params.action = actionFilter;
            const data = await api.logs.list(params);
            setLogs(data);
        } catch (error) {
            console.error('Failed to load logs', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCompany = async () => {
        setLoading(true);
        try {
            await api.company.update(company);
            alert('Configurações salvas com sucesso!');
        } catch (error) {
            alert('Erro ao salvar configurações');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <div className="container animate-fade">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Configurações do Sistema</h1>
                    <p className="text-small">Gerencie dados corporativos, parâmetros e auditoria</p>
                </div>
                {(activeTab === 'general' || activeTab === 'params') && (
                    <button className="btn btn-primary" onClick={handleSaveCompany} disabled={loading}>
                        <Save size={16} /> Salvar Alterações
                    </button>
                )}
                {activeTab === 'logs' && (
                    <button className="btn btn-secondary" onClick={loadLogs} disabled={loading}>
                        <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Atualizar
                    </button>
                )}
            </header>

            <div className="tabs mb-lg">
                {userRole === 'admin' && (
                    <>
                        <button className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
                            <Building2 size={16} /> Geral & Metas
                        </button>
                        <button className={`tab-btn ${activeTab === 'params' ? 'active' : ''}`} onClick={() => setActiveTab('params')}>
                            <Settings size={16} /> Parâmetros
                        </button>
                    </>
                )}
                <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
                    <Activity size={16} /> Auditoria (Logs)
                </button>
                {userRole === 'admin' && (
                    <button className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`} onClick={() => setActiveTab('rules')}>
                        <Settings size={16} /> Automação
                    </button>
                )}
            </div>

            {/* TAB: GERAL */}
            {activeTab === 'general' && (
                <div className="grid grid-cols-2 gap-6">
                    <div className="card">
                        <h3 className="text-h3 mb-md">Dados da Empresa</h3>
                        <div className="form-group">
                            <label>Nome da Empresa</label>
                            <input
                                type="text"
                                className="input-field"
                                value={company.name}
                                onChange={e => setCompany({ ...company, name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>CNPJ</label>
                            <input
                                type="text"
                                className="input-field"
                                value={company.cnpj || ''}
                                onChange={e => setCompany({ ...company, cnpj: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Setor de Atuação</label>
                            <input
                                type="text"
                                className="input-field"
                                value={company.segment || ''}
                                onChange={e => setCompany({ ...company, segment: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="text-h3 mb-md">Metas Corporativas</h3>
                        <p className="text-caption mb-4">Estas metas alimentam os indicadores do Dashboard Principal.</p>
                        <div className="form-group">
                            <label>Meta de Faturamento (Mensal)</label>
                            <div className="input-field flex items-center">
                                <span className="text-muted mr-2">R$</span>
                                <input
                                    type="number"
                                    className="bg-transparent w-full outline-none"
                                    value={company.financialTargets?.revenue}
                                    onChange={e => setCompany({
                                        ...company,
                                        financialTargets: { ...company.financialTargets, revenue: Number(e.target.value) }
                                    })}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Margem de Lucro Alvo (%)</label>
                            <div className="input-field flex items-center">
                                <input
                                    type="number"
                                    className="bg-transparent w-full outline-none"
                                    value={company.financialTargets?.margin}
                                    onChange={e => setCompany({
                                        ...company,
                                        financialTargets: { ...company.financialTargets, margin: Number(e.target.value) }
                                    })}
                                />
                                <span className="text-muted ml-2">%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: PARAMETROS */}
            {activeTab === 'params' && (
                <div className="card max-w-2xl">
                    <h3 className="text-h3 mb-md">Parâmetros do Sistema</h3>

                    <div className="form-group">
                        <label>SLA Padrão (Horas) para Novos Itens</label>
                        <input
                            type="number"
                            className="input-field"
                            value={company.settings?.sla}
                            onChange={e => setCompany({
                                ...company,
                                settings: { ...company.settings, sla: Number(e.target.value) }
                            })}
                        />
                        <p className="text-caption mt-1">Tempo padrão sugerido ao criar tarefas ou oportunidades.</p>
                    </div>

                    <h4 className="text-h4 mt-6 mb-4">Limites para Alertas Automáticos</h4>

                    <div className="form-group">
                        <label>Alerta de Margem Crítica (Abaixo de %)</label>
                        <input
                            type="number"
                            className="input-field"
                            value={company.settings?.alertThresholds?.margin}
                            onChange={e => setCompany({
                                ...company,
                                settings: {
                                    ...company.settings,
                                    alertThresholds: { ...company.settings?.alertThresholds, margin: Number(e.target.value) }
                                }
                            })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Alerta de Turnover Elevado (Acima de %)</label>
                        <input
                            type="number"
                            className="input-field"
                            value={company.settings?.alertThresholds?.turnover}
                            onChange={e => setCompany({
                                ...company,
                                settings: {
                                    ...company.settings,
                                    alertThresholds: { ...company.settings?.alertThresholds, turnover: Number(e.target.value) }
                                }
                            })}
                        />
                    </div>
                </div>
            )}

            {/* TAB: REGRAS */}
            {activeTab === 'rules' && <RulesConfig />}

            {/* TAB: LOGS (AUDITORIA) */}
            {activeTab === 'logs' && (
                <>
                    <div className="card mb-lg">
                        <div className="log-filters">
                            <div className="filter-group">
                                <Filter size={16} />
                                <span>Filtrar por:</span>
                            </div>
                            <select
                                className="input-field w-auto"
                                value={moduleFilter}
                                onChange={e => setModuleFilter(e.target.value)}
                            >
                                <option value="all">Todos os Módulos</option>
                                {Object.entries(MODULE_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                            <select
                                className="input-field w-auto"
                                value={actionFilter}
                                onChange={e => setActionFilter(e.target.value)}
                            >
                                <option value="all">Todas as Ações</option>
                                {Object.entries(ACTION_CONFIG).map(([key, { label }]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="card">
                        {loading ? (
                            <div className="p-8 text-center text-muted">Carregando auditoria...</div>
                        ) : logs.length === 0 ? (
                            <div className="empty-state">
                                <Activity size={40} />
                                <p>Nenhuma atividade registrada.</p>
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
                </>
            )}
        </div>
    );
};

export default Config;
