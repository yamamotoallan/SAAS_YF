import { useState, useEffect } from 'react';
import {
    Activity,
    Search,
    Calendar,
    User,
    Layers,
    Download,
    RefreshCw,
    Plus,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    ArrowRight,
    Target
} from 'lucide-react';
import { api } from '../services/api';
import type { ActivityLog } from '../types/api';
import { useToast } from '../components/Layout/ToastContext';
import { downloadCSV } from '../utils/csvUtils';
import LoadingSkeleton from '../components/Layout/LoadingSkeleton';
import Pagination from '../components/Layout/Pagination';
import './Auditoria.css';

const MODULE_LABELS: Record<string, string> = {
    client: 'Cliente', financial: 'Financeiro', people: 'Pessoas',
    alert: 'Alerta', kpi: 'KPI', flow: 'Fluxo', item: 'Item',
    process: 'Processo', company: 'Empresa', crm: 'CRM',
};

const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    created: { label: 'Criado', icon: Plus, color: '#10b981' },
    updated: { label: 'Atualizado', icon: Edit2, color: '#3b82f6' },
    deleted: { label: 'Excluído', icon: Trash2, color: '#ef4444' },
    resolved: { label: 'Resolvido', icon: CheckCircle, color: '#10b981' },
    dismissed: { label: 'Dispensado', icon: XCircle, color: '#94a3b8' },
    moved: { label: 'Movido', icon: ArrowRight, color: '#f59e0b' },
    invited: { label: 'Convidado', icon: User, color: '#8b5cf6' },
    closed_won: { label: 'Venda Ganha', icon: Target, color: '#16a34a' },
    closed_lost: { label: 'Venda Perdida', icon: XCircle, color: '#dc2626' },
};

const Auditoria = () => {
    const { toast } = useToast();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [meta, setMeta] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [moduleFilter, setModuleFilter] = useState('all');
    const [actionFilter, setActionFilter] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        loadLogs();
    }, [page, moduleFilter, actionFilter]);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = {
                page: page.toString(),
                limit: '50'
            };
            if (moduleFilter !== 'all') params.module = moduleFilter;
            if (actionFilter !== 'all') params.action = actionFilter;
            if (searchTerm) params.search = searchTerm;
            if (dateRange.start) params.startDate = dateRange.start;
            if (dateRange.end) params.endDate = dateRange.end;

            const res = await api.logs.list(params) as any;
            setLogs(res.data || []);
            setMeta(res.meta);
        } catch (error) {
            console.error('Failed to load logs', error);
            toast('Erro ao carregar registros de auditoria', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadLogs();
    };

    const exportLogs = () => {
        downloadCSV(
            logs,
            [
                { key: 'createdAt', label: 'Data/Hora', format: v => new Date(v).toLocaleString() },
                { key: 'user', label: 'Usuário', format: v => v?.name || 'Sistema' },
                { key: 'module', label: 'Módulo', format: v => MODULE_LABELS[v] || v },
                { key: 'action', label: 'Ação', format: v => ACTION_CONFIG[v]?.label || v },
                { key: 'entityName', label: 'Entidade' },
                { key: 'details', label: 'Detalhes' },
            ],
            'auditoria_yf'
        );
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

    return (
        <div className="container animate-fade">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Trilha de Auditoria</h1>
                    <p className="text-small">Registro histórico de todas as ações críticas preventivas e operacionais</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={exportLogs} disabled={logs.length === 0}>
                        <Download size={16} /> Exportar CSV
                    </button>
                    <button className="btn btn-primary" onClick={() => { setPage(1); loadLogs(); }}>
                        <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Atualizar
                    </button>
                </div>
            </header>

            <div className="audit-toolbar card">
                <form className="audit-search-row" onSubmit={handleSearch}>
                    <div className="audit-search-input">
                        <Search size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar por entidade (nome do cliente, meta, etc)..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm">Buscar</button>
                </form>

                <div className="audit-filters-row">
                    <div className="audit-filter">
                        <label><Layers size={14} /> Módulo</label>
                        <select value={moduleFilter} onChange={e => { setModuleFilter(e.target.value); setPage(1); }}>
                            <option value="all">Todos os módulos</option>
                            {Object.entries(MODULE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    <div className="audit-filter">
                        <label><Activity size={14} /> Ação</label>
                        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}>
                            <option value="all">Todas as ações</option>
                            {Object.entries(ACTION_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                    </div>
                    <div className="audit-filter">
                        <label><Calendar size={14} /> Início</label>
                        <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                    </div>
                    <div className="audit-filter">
                        <label><Calendar size={14} /> Fim</label>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
                    </div>
                </div>
            </div>

            <div className="card mt-lg no-padding overflow-hidden">
                {loading && logs.length === 0 ? (
                    <div className="p-8"><LoadingSkeleton type="table" rows={10} /></div>
                ) : logs.length === 0 ? (
                    <div className="empty-state p-12">
                        <Activity size={48} className="text-muted" />
                        <h3>Nenhum registro encontrado</h3>
                        <p>Ajuste os filtros ou o termo de busca para localizar logs específicos.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="audit-table">
                            <thead>
                                <tr>
                                    <th>Data / Hora</th>
                                    <th>Usuário</th>
                                    <th>Ação</th>
                                    <th>Módulo</th>
                                    <th>Entidade</th>
                                    <th>Contexto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => {
                                    const actionCfg = ACTION_CONFIG[log.action] || { label: log.action, icon: Activity, color: '#64748b' };
                                    const ActionIcon = actionCfg.icon;
                                    return (
                                        <tr key={log.id}>
                                            <td className="text-nowrap">{formatDate(log.createdAt)}</td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="user-avatar-sm">{(log.user?.name || 'S')[0]}</div>
                                                    <span className="font-medium text-sm">{log.user?.name || 'Sistema'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2" style={{ color: actionCfg.color }}>
                                                    <ActionIcon size={14} />
                                                    <span className="font-bold text-xs uppercase">{actionCfg.label}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="module-badge">{MODULE_LABELS[log.module] || log.module}</span>
                                            </td>
                                            <td>
                                                <span className="entity-name">{log.entityName}</span>
                                            </td>
                                            <td>
                                                <p className="text-xs text-muted line-clamp-1" title={log.details || ''}>
                                                    {log.details || '—'}
                                                </p>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {meta && meta.totalPages > 1 && (
                <div className="footer-pagination">
                    <Pagination 
                        page={page} 
                        totalPages={meta.totalPages} 
                        total={meta.total} 
                        onPageChange={setPage} 
                    />
                </div>
            )}
        </div>
    );
};

export default Auditoria;
