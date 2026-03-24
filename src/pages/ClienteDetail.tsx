import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, Building2, User, Mail, Phone, Tag,
    TrendingUp, TrendingDown, DollarSign, Clock,
    Layers, CheckCircle2, XCircle, Trophy, Calendar,
    Loader2, AlertCircle
} from 'lucide-react';
import { useToast } from '../components/Layout/ToastContext';
import { api } from '../services/api';
import './ClienteDetail.css';

// ── Helpers ───────────────────────────────────────────────────────────────
const fmtBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const daysSince = (dateStr?: string) => {
    if (!dateStr) return null;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / 86_400_000);
};

const statusBadge = (s: string) => {
    const map: Record<string, string> = { active: 'success', prospect: 'warning', inactive: 'neutral' };
    const label: Record<string, string> = { active: 'Ativo', prospect: 'Prospect', inactive: 'Inativo' };
    return <span className={`status-badge ${map[s] || 'neutral'}`}>{label[s] || s}</span>;
};

// ── Component ─────────────────────────────────────────────────────────────
const ClienteDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [client, setClient] = useState<any>(null);
    const [deals, setDeals] = useState<any[]>([]);
    const [intelligence, setIntelligence] = useState<any>(null);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'alerts'>('overview');

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            try {
                const [clientData, allItems, intelData, alertsData] = await Promise.all([
                    api.clients.get(id),
                    api.items.list({ clientId: id }),
                    api.clients.intelligence(id),
                    api.alerts.list({ clientId: id })
                ]);
                setClient(clientData);
                setDeals(Array.isArray(allItems) ? allItems : []);
                setIntelligence(intelData);
                setAlerts(Array.isArray(alertsData) ? alertsData : (alertsData as any).data || []);
            } catch (e: any) {
                setError(e.message || 'Erro ao carregar cliente');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    // ── Derived KPIs ──────────────────────────────────────────────────────
    const won = deals.filter(d => d.status === 'won');
    const lost = deals.filter(d => d.status === 'lost');
    const active = deals.filter(d => !['won', 'lost'].includes(d.status));
    const winRate = deals.length > 0 ? Math.round((won.length / Math.max(won.length + lost.length, 1)) * 100) : 0;
    const ltv = won.reduce((s: number, d: any) => s + (Number(d.value) || 0), 0);
    const lastDeal = deals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const daysSinceLast = daysSince(lastDeal?.updatedAt || lastDeal?.createdAt);

    // ── Stage color ───────────────────────────────────────────────────────
    const stagePill = (item: any) => {
        if (item.status === 'won') return <span className="cd-status-pill cd-pill-won"><CheckCircle2 size={12} /> Ganho</span>;
        if (item.status === 'lost') return <span className="cd-status-pill cd-pill-lost"><XCircle size={12} /> Perdido</span>;
        return <span className="cd-status-pill cd-pill-active"><Layers size={12} /> {item.stage?.name || 'Em andamento'}</span>;
    };

    // ── Render ────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="cd-center">
                <Loader2 size={32} className="cd-spinner" />
                <p className="text-muted mt-3">Carregando perfil do cliente…</p>
            </div>
        );
    }

    if (error || !client) {
        return (
            <div className="cd-center">
                <AlertCircle size={32} className="text-danger" />
                <p className="text-muted mt-3">{error || 'Cliente não encontrado.'}</p>
                <Link to="/clientes" className="btn btn-secondary mt-4">← Voltar</Link>
            </div>
        );
    }

    return (
        <div className="container animate-fade">
            {/* ── Back nav ───────────────────────────────────────────── */}
            <button className="cd-back" onClick={() => navigate(-1)}>
                <ArrowLeft size={16} /> Carteira de Clientes
            </button>

            {/* ── Profile header ─────────────────────────────────────── */}
            <div className="cd-profile-card">
                <div className="cd-avatar">
                    {client.type === 'PJ' ? <Building2 size={32} /> : <User size={32} />}
                </div>
                <div className="cd-profile-info">
                    <div className="cd-name-row">
                        <h1 className="text-h2">{client.name}</h1>
                        {statusBadge(client.status || 'active')}
                    </div>
                    <div className="cd-contact-row">
                        {client.email && (
                            <span className="cd-contact-chip">
                                <Mail size={13} /> {client.email}
                            </span>
                        )}
                        {client.phone && (
                            <span className="cd-contact-chip">
                                <Phone size={13} /> {client.phone}
                            </span>
                        )}
                        {client.segment && (
                            <span className="cd-contact-chip">
                                <Tag size={13} /> {client.segment}
                            </span>
                        )}
                        {client.document && (
                            <span className="cd-contact-chip text-muted">
                                {client.document}
                            </span>
                        )}
                    </div>
                </div>
                <div className="cd-type-badge">{client.type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}</div>
            </div>

            {/* ── Tabs ────────────────────────────────────────────────── */}
            <div className="tabs mb-lg">
                <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                    Visão Geral
                </button>
                <button className={`tab-btn ${activeTab === 'deals' ? 'active' : ''}`} onClick={() => setActiveTab('deals')}>
                    Histórico de Negócios
                </button>
                <button className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
                    Alertas {alerts.length > 0 && <span className="badge badge-danger ml-2">{alerts.length}</span>}
                </button>
            </div>

            {/* ── Health Score ─────────────────────────────────────────── */}
            {activeTab === 'overview' && intelligence && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-lg">
                    <div className="card intelligence-card">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-h3">Saúde do Cliente</h3>
                            <div className={`health-score-ring ${intelligence.healthScore > 70 ? 'good' : intelligence.healthScore > 40 ? 'warning' : 'danger'}`}>
                                {intelligence.healthScore}%
                            </div>
                        </div>
                        <div className="churn-risk">
                            <span className="text-small text-muted uppercase font-bold">Risco de Churn:</span>
                            <span className={`risk-label ${intelligence.churnRisk}`}>{intelligence.churnRisk === 'low' ? 'Baixo' : intelligence.churnRisk === 'medium' ? 'Médio' : 'Alto'}</span>
                        </div>
                        <p className="text-caption mt-4">Calculado com base na frequência de contatos e abertura de novos negócios nos últimos {intelligence.daysSinceLastActivity} dias.</p>
                    </div>

                    <div className="card intelligence-card">
                        <h3 className="text-h3 mb-4">Potencial de Expansão</h3>
                        <div className="expansion-metrics">
                            <div className="metric-item">
                                <span className="label">LTV Projetado</span>
                                <span className="value">{fmtBRL(intelligence.ltv * 1.2)}</span>
                            </div>
                            <div className="metric-item">
                                <span className="label">Oportunidades</span>
                                <span className="value">{active.length}</span>
                            </div>
                        </div>
                        <button className="btn btn-secondary btn-full mt-4" onClick={() => toast('Análise preditiva gerada!', 'success')}>
                            Gerar Relatório de Inteligência
                        </button>
                    </div>
                </div>
            )}

            {/* ── KPI row ────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
                <div className="cd-kpi-row">
                    <div className="cd-kpi-card">
                        <div className="cd-kpi-icon kpi-green"><DollarSign size={20} /></div>
                        <div>
                            <div className="cd-kpi-value">{fmtBRL(ltv)}</div>
                            <div className="cd-kpi-label">LTV (receita ganha)</div>
                        </div>
                    </div>
                    <div className="cd-kpi-card">
                        <div className="cd-kpi-icon kpi-blue"><Trophy size={20} /></div>
                        <div>
                            <div className="cd-kpi-value">{winRate}%</div>
                            <div className="cd-kpi-label">Win Rate ({won.length}W / {lost.length}L)</div>
                        </div>
                    </div>
                    <div className="cd-kpi-card">
                        <div className="cd-kpi-icon kpi-indigo"><Layers size={20} /></div>
                        <div>
                            <div className="cd-kpi-value">{active.length}</div>
                            <div className="cd-kpi-label">Negócios ativos</div>
                        </div>
                    </div>
                    <div className="cd-kpi-card">
                        <div className={`cd-kpi-icon ${daysSinceLast !== null && daysSinceLast > 30 ? 'kpi-orange' : 'kpi-slate'}`}>
                            <Clock size={20} />
                        </div>
                        <div>
                            <div className="cd-kpi-value">
                                {daysSinceLast === null ? '—' : `${daysSinceLast}d`}
                            </div>
                            <div className="cd-kpi-label">
                                Dias sem atividade
                                {daysSinceLast !== null && daysSinceLast > 30 && (
                                    <span className="cd-kpi-warn"> ⚠ frio</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Deal timeline ───────────────────────────────────────── */}
            {activeTab === 'deals' && (
                <div className="cd-section">
                <h2 className="cd-section-title">
                    <TrendingUp size={18} /> Histórico de Negócios
                    <span className="cd-section-count">{deals.length}</span>
                </h2>

                {deals.length === 0 ? (
                    <div className="cd-empty">
                        <Layers size={36} className="text-muted" />
                        <p>Nenhum negócio registrado para este cliente.</p>
                    </div>
                ) : (
                    <div className="cd-timeline">
                        {deals
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((deal: any) => (
                                <div key={deal.id} className={`cd-deal cd-deal-${deal.status}`}>
                                    <div className="cd-deal-left">
                                        <div className="cd-deal-icon">
                                            {deal.status === 'won'
                                                ? <TrendingUp size={16} className="text-success" />
                                                : deal.status === 'lost'
                                                    ? <TrendingDown size={16} className="text-danger" />
                                                    : <Layers size={16} className="text-primary" />}
                                        </div>
                                        <div className="cd-timeline-line" />
                                    </div>
                                    <div className="cd-deal-body">
                                        <div className="cd-deal-header">
                                            <span className="cd-deal-name">{deal.name || deal.title || 'Negócio'}</span>
                                            {stagePill(deal)}
                                        </div>
                                        <div className="cd-deal-meta">
                                            {deal.value > 0 && (
                                                <span className="cd-deal-chip">
                                                    <DollarSign size={11} /> {fmtBRL(Number(deal.value))}
                                                </span>
                                            )}
                                            <span className="cd-deal-chip">
                                                <Calendar size={11} /> {new Date(deal.createdAt).toLocaleDateString('pt-BR')}
                                            </span>
                                            {deal.flow?.name && (
                                                <span className="cd-deal-chip">
                                                    <Layers size={11} /> {deal.flow.name}
                                                </span>
                                            )}
                                        </div>
                                        {deal.lostReason && (
                                            <p className="cd-lost-reason">Motivo: {deal.lostReason}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
            )}

            {/* ── Alertas Tab ────────────────────────────────────────── */}
            {activeTab === 'alerts' && (
                <div className="cd-section">
                    <h2 className="cd-section-title">
                        <AlertCircle size={18} /> Alertas Ativos
                        <span className="cd-section-count">{alerts.length}</span>
                    </h2>
                    {alerts.length === 0 ? (
                        <div className="cd-empty">
                            <CheckCircle2 size={36} className="text-success" />
                            <p>Nenhum alerta pendente para este cliente.</p>
                        </div>
                    ) : (
                        <div className="cd-alerts-list">
                            {alerts.map(alert => (
                                <div key={alert.id} className="cd-alert-item card border-left-danger">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold">{alert.title}</h4>
                                            <p className="text-sm text-muted mt-1">{alert.description}</p>
                                            <div className="flex gap-4 mt-2 text-caption">
                                                <span>Gravidade: <span className="font-bold uppercase">{alert.severity}</span></span>
                                                <span>•</span>
                                                <span>Data: {new Date(alert.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <Link to="/inteligencia" className="btn btn-secondary btn-xs">Ver Central</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Quick stats footer ──────────────────────────────────── */}
            <div className="cd-footer-stats">
                <span><CheckCircle2 size={14} className="text-success" /> {won.length} ganhos</span>
                <span><XCircle size={14} className="text-danger" /> {lost.length} perdidos</span>
                <span><Layers size={14} className="text-primary" /> {active.length} em andamento</span>
                <span><DollarSign size={14} className="text-muted" /> LTV total: {fmtBRL(ltv)}</span>
            </div>
        </div>
    );
};

export default ClienteDetail;
