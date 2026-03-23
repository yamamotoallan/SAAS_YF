import { useState, useEffect, useCallback } from 'react';
import {
    CheckCircle, XCircle, Plus, Activity,
    BrainCircuit, DollarSign, Users, Clock, Zap,
    ChevronDown, ChevronRight, Bell, Settings2, RefreshCw, Shield
} from 'lucide-react';
import { api } from '../services/api';
import type { Alert } from '../types/api';
import Modal from '../components/Modal/Modal';
import './Alertas.css';

type AlertPriority = 'critical' | 'high' | 'medium' | 'low';
type AlertType = 'financial' | 'people' | 'operational' | 'system' | 'kpi';
type Tab = 'active' | 'history' | 'rules';

// ── Built-in auto-scan rules ────────────────────────────────────────────────
interface ScanRule {
    id: string;
    label: string;
    description: string;
    type: AlertType;
    priority: AlertPriority;
    enabled: boolean;
    icon: any;
}

const DEFAULT_RULES: ScanRule[] = [
    {
        id: 'kpi-below-70',
        label: 'KPI abaixo de 70% da meta',
        description: 'Dispara quando qualquer indicador atinge menos de 70% do target.',
        type: 'kpi',
        priority: 'high',
        enabled: true,
        icon: Zap,
    },
    {
        id: 'margin-negative',
        label: 'Margem financeira negativa',
        description: 'Dispara quando resultado (receita − custos) for negativo.',
        type: 'financial',
        priority: 'critical',
        enabled: true,
        icon: DollarSign,
    },
    {
        id: 'pipeline-stalled',
        label: 'Pipeline sem movimentação',
        description: 'Dispara quando não há itens ativos no CRM.',
        type: 'operational',
        priority: 'medium',
        enabled: true,
        icon: Activity,
    },
    {
        id: 'headcount-zero',
        label: 'Headcount zerado',
        description: 'Dispara quando nenhum colaborador está cadastrado.',
        type: 'people',
        priority: 'high',
        enabled: false,
        icon: Users,
    },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const PRIORITY_ORDER: AlertPriority[] = ['critical', 'high', 'medium', 'low'];

const priorityLabel = (p: string) => ({ critical: 'Crítico', high: 'Alta', medium: 'Média', low: 'Baixa' }[p] || p);
const priorityBadge = (p: string) => {
    const map: Record<string, string> = { critical: 'badge-danger', high: 'badge-danger', medium: 'badge-warning', low: 'badge-neutral' };
    return <span className={`badge ${map[p] || 'badge-neutral'}`}>{priorityLabel(p)}</span>;
};
const typeIcon = (type: string) => {
    switch (type) {
        case 'financial': return <DollarSign size={20} className="text-success" />;
        case 'people': return <Users size={20} className="text-secondary" />;
        case 'kpi': return <Zap size={20} className="text-primary" />;
        case 'system': return <BrainCircuit size={20} className="text-primary" />;
        default: return <Activity size={20} className="text-warning" />;
    }
};

// ── Component ────────────────────────────────────────────────────────────────
const Alertas = ({ isWrapper = false }: { isWrapper?: boolean }) => {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('active');
    const [rules, setRules] = useState<ScanRule[]>(DEFAULT_RULES);
    const [collapsed, setCollapsed] = useState<Record<AlertPriority, boolean>>({
        critical: false, high: false, medium: true, low: true,
    });

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '', description: '', type: 'operational' as Alert['type'], priority: 'medium' as Alert['priority'],
    });

    // Toast
    const [toast, setToast] = useState<string | null>(null);
    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const loadAlerts = useCallback(async () => {
        try {
            setLoading(true);
            const status = activeTab === 'history' ? 'history' : 'active';
            const data = await api.alerts.list({ status });
            setAlerts(data);
        } catch (e) {
            console.error('Failed to load alerts', e);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => { if (activeTab !== 'rules') loadAlerts(); }, [activeTab, loadAlerts]);

    // ── Auto-scan engine ─────────────────────────────────────────────────────
    const runScan = async () => {
        setScanning(true);
        let generated = 0;
        try {
            const enabledRules = rules.filter(r => r.enabled);
            const [kpis, fin, pipeline] = await Promise.all([
                api.kpis.list(),
                api.financial.summary(),
                api.items.list(),
            ]);

            for (const rule of enabledRules) {
                if (rule.id === 'kpi-below-70') {
                    const criticalKpis = kpis.filter((k: any) => k.target > 0 && (k.value / k.target) * 100 < 70);
                    for (const kpi of criticalKpis.slice(0, 3)) {
                        const pct = Math.round((kpi.value / kpi.target) * 100);
                        try {
                            await api.alerts.create({
                                title: `KPI em risco: ${kpi.name}`,
                                description: `Indicador atingiu apenas ${pct}% da meta (${kpi.value}${kpi.unit} de ${kpi.target}${kpi.unit}).`,
                                type: 'kpi',
                                priority: rule.priority,
                            });
                            generated++;
                        } catch { /* duplicate protection */ }
                    }
                }

                if (rule.id === 'margin-negative') {
                    const result = (fin.revenue || 0) - (fin.costs || 0);
                    if (result < 0) {
                        try {
                            await api.alerts.create({
                                title: 'Margem financeira negativa',
                                description: `Resultado do período: ${result.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. Custos superam a receita.`,
                                type: 'financial',
                                priority: rule.priority,
                            });
                            generated++;
                        } catch { /* duplicate protection */ }
                    }
                }

                if (rule.id === 'pipeline-stalled') {
                    const activeItems = pipeline.filter((i: any) => i.status === 'active' || !i.status);
                    if (activeItems.length === 0) {
                        try {
                            await api.alerts.create({
                                title: 'Pipeline CRM sem negócios ativos',
                                description: 'Nenhum card ativo encontrado nos fluxos. Verifique se há oportunidades em andamento.',
                                type: 'operational',
                                priority: rule.priority,
                            });
                            generated++;
                        } catch { /* duplicate protection */ }
                    }
                }
            }

            showToast(generated > 0 ? `${generated} alerta(s) gerado(s) automaticamente` : 'Nenhum problema detectado ✓');
            await loadAlerts();
        } catch (e) {
            showToast('Erro ao executar varredura automática');
        } finally {
            setScanning(false);
        }
    };

    const handleResolve = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await api.alerts.resolve(id);
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    const handleDismiss = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await api.alerts.dismiss(id);
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.alerts.create(formData);
            setIsModalOpen(false);
            setFormData({ title: '', description: '', type: 'operational' as Alert['type'], priority: 'medium' as Alert['priority'] });
            if (activeTab === 'active') await loadAlerts();
        } finally {
            setSubmitting(false);
        }
    };

    // ── Priority group rendering ─────────────────────────────────────────────
    const grouped = PRIORITY_ORDER.reduce<Record<string, any[]>>((acc, p) => {
        acc[p] = alerts.filter(a => (a.priority || 'medium') === p);
        return acc;
    }, { critical: [], high: [], medium: [], low: [] });

    const criticalCount = grouped.critical.length;
    const highCount = grouped.high.length;
    const urgentTotal = criticalCount + highCount;

    return (
        <div className={`container animate-fade alerts-container ${isWrapper ? 'is-wrapper pt-0' : ''}`}>
            {toast && <div className="al-toast">{toast}</div>}

            {/* ── Header ──────────────────────────────────────────────── */}
            {!isWrapper && (
                <header className="page-header">
                    <div>
                        <h1 className="text-h2 flex items-center gap-2">
                            <Bell size={22} className={urgentTotal > 0 ? 'text-danger al-bell-pulse' : 'text-muted'} />
                            Central de Alertas
                            {urgentTotal > 0 && (
                                <span className="al-urgent-badge">{urgentTotal}</span>
                            )}
                        </h1>
                        <p className="text-small">Monitoramento inteligente e varredura automática</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="btn btn-secondary" onClick={runScan} disabled={scanning}>
                            <RefreshCw size={15} className={scanning ? 'spin' : ''} />
                            {scanning ? 'Varrendo…' : 'Varredura Auto'}
                        </button>
                        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                            <Plus size={16} /> Novo Alerta
                        </button>
                    </div>
                </header>
            )}

            {/* ── Tabs ────────────────────────────────────────────────── */}
            <div className={`toolbar ${isWrapper ? 'mt-4' : ''} flex justify-between`}>
                <div className="tabs">
                    {([['active', 'Pendentes'], ['history', 'Histórico'], ['rules', 'Regras']] as [Tab, string][]).map(([id, label]) => (
                        <button
                            key={id}
                            className={`tab-btn ${activeTab === id ? 'active' : ''}`}
                            onClick={() => setActiveTab(id)}
                        >
                            {id === 'rules' && <Settings2 size={13} className="inline mr-1" />}
                            {label}
                            {id === 'active' && urgentTotal > 0 && <span className="tab-badge-dot" />}
                        </button>
                    ))}
                </div>
                {isWrapper && (
                    <div className="flex gap-2">
                        <button className="btn btn-secondary" onClick={runScan} disabled={scanning}>
                            <RefreshCw size={15} className={scanning ? 'spin' : ''} />
                            {scanning ? 'Varrendo…' : 'Varredura Auto'}
                        </button>
                        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                            <Plus size={16} /> Novo Alerta
                        </button>
                    </div>
                )}
            </div>

            {/* ══ TAB: Active / History ═══════════════════════════════════ */}
            {activeTab !== 'rules' && (
                loading ? (
                    <div className="p-8 text-center text-muted">Carregando alertas…</div>
                ) : alerts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><CheckCircle size={48} className="text-success" /></div>
                        <h3>Tudo limpo!</h3>
                        <p>{activeTab === 'active' ? 'Não há alertas pendentes.' : 'Nenhum histórico encontrado.'}</p>
                    </div>
                ) : (
                    <div className="al-feed">
                        {PRIORITY_ORDER.map(priority => {
                            const group = grouped[priority];
                            if (group.length === 0) return null;
                            const open = !collapsed[priority];
                            return (
                                <div key={priority} className={`al-group al-group--${priority}`}>
                                    {/* Group header */}
                                    <button
                                        className="al-group-header"
                                        onClick={() => setCollapsed(c => ({ ...c, [priority]: !c[priority] }))}
                                    >
                                        <span className={`al-group-dot dot-${priority}`} />
                                        <span className="al-group-label">
                                            {priorityLabel(priority)} — {group.length} alerta(s)
                                        </span>
                                        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                    </button>

                                    {/* Alert cards */}
                                    {open && group.map((alert: any) => (
                                        <div key={alert.id} className={`alert-card priority-${alert.priority || 'medium'}`}>
                                            <div className="alert-icon-area">{typeIcon(alert.type)}</div>
                                            <div className="alert-content">
                                                <div className="alert-header-row">
                                                    <h3 className="alert-title">{alert.title}</h3>
                                                    {priorityBadge(alert.priority)}
                                                </div>
                                                <p className="alert-desc">{alert.description}</p>
                                                <div className="alert-meta">
                                                    <span className="meta-item"><Clock size={12} /> {new Date(alert.createdAt).toLocaleDateString('pt-BR')}</span>
                                                    <span className="meta-item ml-2 capitalize">• {alert.type}</span>
                                                    {alert.source === 'auto' && (
                                                        <span className="meta-item ml-2 text-primary">• <Zap size={10} className="inline" /> Auto</span>
                                                    )}
                                                </div>
                                            </div>
                                            {activeTab === 'active' && (
                                                <div className="alert-actions">
                                                    <button className="btn-icon-action success" title="Resolver" onClick={e => handleResolve(alert.id, e)}>
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button className="btn-icon-action danger" title="Ignorar" onClick={e => handleDismiss(alert.id, e)}>
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                )
            )}

            {/* ══ TAB: Rules ═══════════════════════════════════════════════ */}
            {activeTab === 'rules' && (
                <div className="al-rules-grid">
                    <div className="al-rules-hint">
                        <Shield size={14} />
                        <span>Regras ativas são verificadas ao clicar em <b>Varredura Auto</b>. Futuras versões rodarão automaticamente.</span>
                    </div>
                    {rules.map(rule => {
                        const Icon = rule.icon;
                        return (
                            <div key={rule.id} className={`al-rule-card ${rule.enabled ? 'rule-enabled' : 'rule-disabled'}`}>
                                <div className="al-rule-icon"><Icon size={20} /></div>
                                <div className="al-rule-body">
                                    <div className="al-rule-title">{rule.label}</div>
                                    <div className="al-rule-desc">{rule.description}</div>
                                    <div className="al-rule-meta">
                                        {priorityBadge(rule.priority)}
                                        <span className="badge badge-neutral ml-2">{rule.type}</span>
                                    </div>
                                </div>
                                <label className="al-toggle">
                                    <input
                                        type="checkbox"
                                        checked={rule.enabled}
                                        onChange={() => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))}
                                    />
                                    <span className="al-toggle-track" />
                                </label>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Create Modal ───────────────────────────────────────────── */}
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
                        <input type="text" className="input-field" required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Descrição</label>
                        <textarea className="input-field" rows={3} required
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Tipo</label>
                        <select className="input-field" value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value as Alert['type'] })}>
                            <option value="operational">Operacional</option>
                            <option value="financial">Financeiro</option>
                            <option value="kpi">KPI</option>
                            <option value="people">Pessoas</option>
                            <option value="system">Sistema</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Prioridade</label>
                        <select className="input-field" value={formData.priority}
                            onChange={e => setFormData({ ...formData, priority: e.target.value as Alert['priority'] })}>
                            <option value="low">Baixa</option>
                            <option value="medium">Média</option>
                            <option value="high">Alta</option>
                            <option value="critical">Crítica</option>
                        </select>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Alertas;
