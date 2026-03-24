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
    Save,
    Target,
    TrendingUp,
    Bell,
    Clock,
    DollarSign,
    Users,
    AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import RulesConfig from '../components/Config/RulesConfig';
import './Config.css';

const MODULE_LABELS: Record<string, string> = {
    client: 'Cliente', financial: 'Financeiro', people: 'Pessoas',
    alert: 'Alerta', kpi: 'KPI', flow: 'Fluxo', item: 'Item',
    process: 'Processo', company: 'Empresa', crm: 'CRM',
};

const ACTION_CONFIG: Record<string, { label: string; icon: ReactNode; color: string }> = {
    created: { label: 'Criado', icon: <Plus size={14} />, color: 'var(--color-success)' },
    updated: { label: 'Atualizado', icon: <Edit2 size={14} />, color: 'var(--color-primary)' },
    deleted: { label: 'Excluído', icon: <Trash2 size={14} />, color: 'var(--color-danger)' },
    resolved: { label: 'Resolvido', icon: <CheckCircle size={14} />, color: 'var(--color-success)' },
    dismissed: { label: 'Dispensado', icon: <XCircle size={14} />, color: 'var(--color-text-secondary)' },
    moved: { label: 'Movido', icon: <ArrowRight size={14} />, color: 'var(--color-warning)' },
    invited: { label: 'Convidado', icon: <User size={14} />, color: 'var(--color-secondary)' },
    closed_won: { label: 'Venda Ganha', icon: <Target size={14} />, color: '#16a34a' },
    closed_lost: { label: 'Venda Perdida', icon: <XCircle size={14} />, color: '#dc2626' },
};

// ── Inline toast ───────────────────────────────────────────────────────────────
const Toast = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => (
    <div className={`config-toast ${type}`}>
        {type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
        {msg}
    </div>
);

// ── Field wrapper ──────────────────────────────────────────────────────────────
const FieldGroup = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
    <div className="form-group">
        <label>{label}</label>
        {children}
        {hint && <p className="text-caption mt-1">{hint}</p>}
    </div>
);

// ── Threshold Preview Card ────────────────────────────────────────────────────
const ThresholdPreview = ({ label, value, unit, icon }: { label: string; value: number; unit: string; icon: ReactNode }) => (
    <div className="threshold-chip">
        <span className="threshold-icon">{icon}</span>
        <div>
            <span className="threshold-label">{label}</span>
            <span className="threshold-value">{value}{unit}</span>
        </div>
    </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
const Config = () => {
    const [activeTab, setActiveTab] = useState<'general' | 'params' | 'rules' | 'users' | 'logs'>('general');
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState<string>('viewer');
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('yf_user') || '{}');
        setUserRole(user.role || 'viewer');
        if (user.role !== 'admin' && activeTab !== 'logs') setActiveTab('logs');
    }, []);

    // Users
    const [users, setUsers] = useState<any[]>([]);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userForm, setUserForm] = useState({
        name: '', email: '', role: 'user', password: ''
    });

    // Logs
    const [logs, setLogs] = useState<any[]>([]);
    const [moduleFilter, setModuleFilter] = useState('all');
    const [actionFilter, setActionFilter] = useState('all');

    // Company
    const [company, setCompany] = useState<any>({
        name: '', cnpj: '', segment: '', size: 'small', revenue: 0, headcount: 0,
        logoUrl: '', primaryColor: '#6366f1',
        financialTargets: { revenue: 0, margin: 0, pipeline: 0, expenses: 0 },
        settings: {
            sla: 24,
            okrPeriod: 'Q1 2025',
            alertThresholds: { margin: 10, turnover: 5, kpi: 70, inactivityDays: 30 }
        }
    });

    useEffect(() => {
        if (activeTab === 'logs') loadLogs();
        if (activeTab === 'general' || activeTab === 'params' || activeTab === 'users') loadCompany();
    }, [activeTab, moduleFilter, actionFilter]);

    const loadCompany = async () => {
        setLoading(true);
        try {
            const data = await api.company.get();
            setCompany({
                ...data,
                financialTargets: data.financialTargets || { revenue: 0, margin: 0, pipeline: 0, expenses: 0 },
                settings: {
                    sla: 24,
                    okrPeriod: 'Q1 2025',
                    ...(data.settings || {}),
                    alertThresholds: {
                        margin: 10, turnover: 5, kpi: 70, inactivityDays: 30,
                        ...(data.settings?.alertThresholds || {}),
                    },
                }
            });
        } catch { console.error('Failed to load company'); }
        finally { setLoading(false); }

        if (activeTab === 'users') {
            try {
                const usersData = await api.company.users();
                setUsers(usersData);
            } catch { console.error('Failed to load users'); }
        }
    };

    const loadLogs = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { limit: '200' };
            if (moduleFilter !== 'all') params.module = moduleFilter;
            if (actionFilter !== 'all') params.action = actionFilter;
            const data = await api.logs.list(params) as any;
            setLogs(Array.isArray(data) ? data : data.data || []);
        } catch { console.error('Failed to load logs'); }
        finally { setLoading(false); }
    };

    const handleSaveCompany = async () => {
        setLoading(true);
        try {
            await api.company.update(company);
            showToast('Configurações salvas com sucesso!');
        } catch {
            showToast('Erro ao salvar configurações', 'error');
        } finally { setLoading(false); }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.auth.register({
                ...userForm,
                companyId: company.id
            } as any);
            const usersData = await api.company.users();
            setUsers(usersData);
            setIsUserModalOpen(false);
            setUserForm({ name: '', email: '', role: 'user', password: '' });
            showToast('Usuário convidado com sucesso!');
        } catch (error: any) {
            showToast('Erro ao adicionar usuário: ' + error.message, 'error');
        } finally { setLoading(false); }
    };

    const setFT = (key: string, val: number) =>
        setCompany({ ...company, financialTargets: { ...company.financialTargets, [key]: val } });

    const setSetting = (key: string, val: any) =>
        setCompany({ ...company, settings: { ...company.settings, [key]: val } });

    const setThreshold = (key: string, val: number) =>
        setCompany({
            ...company,
            settings: {
                ...company.settings,
                alertThresholds: { ...company.settings?.alertThresholds, [key]: val }
            }
        });

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

    const isSaveTab = activeTab === 'general' || activeTab === 'params';

    return (
        <div className="container animate-fade" style={{ position: 'relative' }}>
            {toast && <Toast msg={toast.msg} type={toast.type} />}

            <header className="page-header">
                <div>
                    <h1 className="text-h2">Configurações do Sistema</h1>
                    <p className="text-small">Gerencie dados corporativos, parâmetros e auditoria</p>
                </div>
                {isSaveTab && (
                    <button className="btn btn-primary" onClick={handleSaveCompany} disabled={loading}>
                        <Save size={16} /> {loading ? 'Salvando...' : 'Salvar Alterações'}
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
                            <Building2 size={16} /> Geral &amp; Metas
                        </button>
                        <button className={`tab-btn ${activeTab === 'params' ? 'active' : ''}`} onClick={() => setActiveTab('params')}>
                            <Settings size={16} /> Parâmetros
                        </button>
                        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                            <Users size={16} /> Equipe
                        </button>
                    </>
                )}
                <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
                    <Activity size={16} /> Auditoria
                </button>
                {userRole === 'admin' && (
                    <button className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`} onClick={() => setActiveTab('rules')}>
                        <Bell size={16} /> Automação
                    </button>
                )}
            </div>

            {/* ── TAB: GERAL ── */}
            {activeTab === 'general' && (
                <div className="config-section-grid">
                    {/* Company Identity */}
                    <div className="card config-card">
                        <div className="config-card-header">
                            <Building2 size={18} className="config-card-icon" />
                            <h3 className="text-h3">Identidade da Empresa</h3>
                        </div>
                        <FieldGroup label="Nome da Empresa">
                            <input type="text" className="input-field"
                                value={company.name}
                                onChange={e => setCompany({ ...company, name: e.target.value })} />
                        </FieldGroup>
                        <FieldGroup label="CNPJ">
                            <input type="text" className="input-field"
                                placeholder="00.000.000/0001-00"
                                value={company.cnpj || ''}
                                onChange={e => setCompany({ ...company, cnpj: e.target.value })} />
                        </FieldGroup>
                        <FieldGroup label="Setor de Atuação">
                            <input type="text" className="input-field"
                                placeholder="Ex: Consultoria, Tecnologia..."
                                value={company.segment || ''}
                                onChange={e => setCompany({ ...company, segment: e.target.value })} />
                        </FieldGroup>
                        <div className="grid grid-cols-2 gap-4">
                            <FieldGroup label="Porte">
                                <select className="input-field" value={company.size || 'small'}
                                    onChange={e => setCompany({ ...company, size: e.target.value })}>
                                    <option value="micro">Micro</option>
                                    <option value="small">Pequena</option>
                                    <option value="medium">Média</option>
                                    <option value="large">Grande</option>
                                </select>
                            </FieldGroup>
                            <FieldGroup label="Headcount Atual">
                                <input type="number" className="input-field" min="0"
                                    value={company.headcount || 0}
                                    onChange={e => setCompany({ ...company, headcount: Number(e.target.value) })} />
                            </FieldGroup>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FieldGroup label="Logo URL" hint="Link para a imagem da logomarca">
                                <input type="text" className="input-field"
                                    placeholder="https://exemplo.com/logo.png"
                                    value={company.logoUrl || ''}
                                    onChange={e => setCompany({ ...company, logoUrl: e.target.value })} />
                            </FieldGroup>
                            <FieldGroup label="Cor Primária" hint="Cor de destaque da marca">
                                <div className="flex gap-2">
                                    <input type="color" className="input-field p-1" style={{ width: '40px' }}
                                        value={company.primaryColor || '#6366f1'}
                                        onChange={e => setCompany({ ...company, primaryColor: e.target.value })} />
                                    <input type="text" className="input-field flex-1"
                                        placeholder="#6366f1"
                                        value={company.primaryColor || '#6366f1'}
                                        onChange={e => setCompany({ ...company, primaryColor: e.target.value })} />
                                </div>
                            </FieldGroup>
                        </div>
                    </div>

                    {/* Financial Targets */}
                    <div className="card config-card">
                        <div className="config-card-header">
                            <TrendingUp size={18} className="config-card-icon" />
                            <h3 className="text-h3">Metas Corporativas</h3>
                        </div>
                        <p className="text-caption mb-4">Estas metas alimentam o Score SGE e o Dashboard principal.</p>

                        <FieldGroup label="Meta de Faturamento Mensal (R$)"
                            hint="Usado para calcular % atingida no Dashboard">
                            <div className="input-with-prefix">
                                <span className="input-prefix">R$</span>
                                <input type="number" className="input-inner" min="0"
                                    value={company.financialTargets?.revenue || 0}
                                    onChange={e => setFT('revenue', Number(e.target.value))} />
                            </div>
                        </FieldGroup>

                        <FieldGroup label="Meta de Margem de Lucro (%)"
                            hint="Abaixo disso gera alerta automático">
                            <div className="input-with-suffix">
                                <input type="number" className="input-inner" min="0" max="100"
                                    value={company.financialTargets?.margin || 0}
                                    onChange={e => setFT('margin', Number(e.target.value))} />
                                <span className="input-suffix">%</span>
                            </div>
                        </FieldGroup>

                        <FieldGroup label="Meta de Pipeline de Vendas (R$)"
                            hint="Valor total de oportunidades abertas desejado">
                            <div className="input-with-prefix">
                                <span className="input-prefix">R$</span>
                                <input type="number" className="input-inner" min="0"
                                    value={company.financialTargets?.pipeline || 0}
                                    onChange={e => setFT('pipeline', Number(e.target.value))} />
                            </div>
                        </FieldGroup>

                        <FieldGroup label="Teto de Despesas Mensais (R$)"
                            hint="Acima disto o sistema emite alerta de custos">
                            <div className="input-with-prefix">
                                <span className="input-prefix">R$</span>
                                <input type="number" className="input-inner" min="0"
                                    value={company.financialTargets?.expenses || 0}
                                    onChange={e => setFT('expenses', Number(e.target.value))} />
                            </div>
                        </FieldGroup>
                    </div>
                </div>
            )}

            {/* ── TAB: PARÂMETROS ── */}
            {activeTab === 'params' && (
                <div className="config-section-grid">
                    {/* Operational params */}
                    <div className="card config-card">
                        <div className="config-card-header">
                            <Clock size={18} className="config-card-icon" />
                            <h3 className="text-h3">Operacional</h3>
                        </div>

                        <FieldGroup label="SLA Padrão para Novos Itens (horas)"
                            hint="Tempo sugerido ao criar tarefas ou oportunidades">
                            <input type="number" className="input-field" min="1"
                                value={company.settings?.sla || 24}
                                onChange={e => setSetting('sla', Number(e.target.value))} />
                        </FieldGroup>

                        <FieldGroup label="Período OKR Atual"
                            hint="Ex: Q1 2025, Q2 2025, 2025 — usado como padrão ao criar Metas">
                            <input type="text" className="input-field"
                                placeholder="Ex: Q2 2025"
                                value={company.settings?.okrPeriod || ''}
                                onChange={e => setSetting('okrPeriod', e.target.value)} />
                        </FieldGroup>

                        <FieldGroup label="Inatividade de Cliente (dias)"
                            hint="Após este período sem contato, o cliente é sinalizado como inativo">
                            <input type="number" className="input-field" min="1"
                                value={company.settings?.alertThresholds?.inactivityDays || 30}
                                onChange={e => setThreshold('inactivityDays', Number(e.target.value))} />
                        </FieldGroup>
                    </div>

                    {/* Alert thresholds */}
                    <div className="card config-card">
                        <div className="config-card-header">
                            <AlertTriangle size={18} className="config-card-icon" />
                            <h3 className="text-h3">Limites para Alertas Automáticos</h3>
                        </div>
                        <p className="text-caption mb-4">O sistema cria alertas automaticamente quando estes limites são atingidos.</p>

                        <FieldGroup label="Margem Crítica — alertar abaixo de (%)">
                            <div className="input-with-suffix">
                                <input type="number" className="input-inner" min="0" max="100"
                                    value={company.settings?.alertThresholds?.margin || 10}
                                    onChange={e => setThreshold('margin', Number(e.target.value))} />
                                <span className="input-suffix">%</span>
                            </div>
                        </FieldGroup>

                        <FieldGroup label="Turnover Elevado — alertar acima de (%)">
                            <div className="input-with-suffix">
                                <input type="number" className="input-inner" min="0" max="100"
                                    value={company.settings?.alertThresholds?.turnover || 5}
                                    onChange={e => setThreshold('turnover', Number(e.target.value))} />
                                <span className="input-suffix">%</span>
                            </div>
                        </FieldGroup>

                        <FieldGroup label="KPI em Risco — alertar abaixo de (% da meta)"
                            hint="Os KPIs abaixo deste % da meta recebem badge de alerta">
                            <div className="input-with-suffix">
                                <input type="number" className="input-inner" min="0" max="100"
                                    value={company.settings?.alertThresholds?.kpi || 70}
                                    onChange={e => setThreshold('kpi', Number(e.target.value))} />
                                <span className="input-suffix">%</span>
                            </div>
                        </FieldGroup>

                        {/* Preview of configured thresholds */}
                        <div className="threshold-preview">
                            <p className="text-caption mb-2">Configuração atual:</p>
                            <div className="threshold-chips-row">
                                <ThresholdPreview label="Margem mín." value={company.settings?.alertThresholds?.margin || 10} unit="%" icon={<DollarSign size={12} />} />
                                <ThresholdPreview label="Turnover máx." value={company.settings?.alertThresholds?.turnover || 5} unit="%" icon={<Users size={12} />} />
                                <ThresholdPreview label="KPI mín." value={company.settings?.alertThresholds?.kpi || 70} unit="%" icon={<Target size={12} />} />
                                <ThresholdPreview label="Inatividade" value={company.settings?.alertThresholds?.inactivityDays || 30} unit="d" icon={<Clock size={12} />} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB: EQUIPE (USUÁRIOS) ── */}
            {activeTab === 'users' && (
                <div className="card">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-h3">Usuários com Acesso</h3>
                        <button className="btn btn-primary" onClick={() => setIsUserModalOpen(true)}>
                            <Plus size={16} /> Convidar Usuário
                        </button>
                    </div>

                    <div className="table-responsive">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b text-muted text-sm">
                                    <th className="p-3">Nome</th>
                                    <th className="p-3">Email</th>
                                    <th className="p-3">Função</th>
                                    <th className="p-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-medium">{user.name}</td>
                                        <td className="p-3 text-muted">{user.email}</td>
                                        <td className="p-3">
                                            <span className={`badge badge-${user.role === 'admin' ? 'primary' : 'neutral'}`}>
                                                {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <button className="btn-icon-sm text-danger" title="Remover acesso">
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── TAB: AUTOMAÇÃO (REGRAS) ── */}
            {activeTab === 'rules' && <RulesConfig />}

            {/* ── TAB: AUDITORIA (LOGS) ── */}
            {activeTab === 'logs' && (
                <>
                    <div className="card mb-lg">
                        <div className="log-filters">
                            <div className="filter-group">
                                <Filter size={16} /><span>Filtrar por:</span>
                            </div>
                            <select className="input-field w-auto" value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
                                <option value="all">Todos os Módulos</option>
                                {Object.entries(MODULE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                            </select>
                            <select className="input-field w-auto" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                                <option value="all">Todas as Ações</option>
                                {Object.entries(ACTION_CONFIG).map(([k, { label }]) => <option key={k} value={k}>{label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="card">
                        {loading ? (
                            <div className="p-8 text-center text-muted">Carregando auditoria...</div>
                        ) : logs.length === 0 ? (
                            <div className="empty-state">
                                <Activity size={40} /><p>Nenhuma atividade registrada.</p>
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
                                                    <span className="log-action-badge" style={{ color: actionCfg.color }}>{actionCfg.label}</span>
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

            {isUserModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>Convidar Novo Usuário</h2>
                            <button className="btn-icon-xs" onClick={() => setIsUserModalOpen(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <form className="form-grid">
                                <div className="form-group">
                                    <label>Nome Completo</label>
                                    <input type="text" className="input-field" required value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Email Corporativo</label>
                                    <input type="email" className="input-field" required value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Função</label>
                                    <select className="input-field" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                                        <option value="user">Usuário (Visualização/Edição limitada)</option>
                                        <option value="admin">Administrador (Acesso total)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Senha Temporária</label>
                                    <input type="password" className="input-field" required value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} />
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setIsUserModalOpen(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleCreateUser} disabled={loading}>Enviar Convite</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Config;
