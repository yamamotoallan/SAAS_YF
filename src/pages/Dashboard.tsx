import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Users,
    AlertTriangle,
    ArrowRight,
    Activity,
    DollarSign,
    Clock,
    Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const dashboardData = await api.dashboard.get();
                setData(dashboardData);
            } catch (error) {
                console.error('Failed to load dashboard', error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    if (!data) return <div className="p-8 text-center text-muted">Erro ao carregar dados do dashboard.</div>;

    const { sgeScore, sgeStatus, financial, people, pipeline, processMaturity, alerts } = data;

    return (
        <div className="container animate-fade">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Visão Geral</h1>
                    <p className="text-small">Monitoramento estratégico e operacional</p>
                </div>
                <div className={`status-badge-lg ${sgeScore >= 70 ? 'success' : sgeScore >= 50 ? 'warning' : 'danger'}`}>
                    <Activity size={18} className="mr-2" />
                    {sgeStatus} | Score: {sgeScore}
                </div>
            </header>

            {/* Strategic KPIs */}
            <div className="dashboard-grid">
                <div className="card summary-card">
                    <div className="card-icon primary"><DollarSign size={24} /></div>
                    <div className="card-label">Margem Líquida</div>
                    <div className="card-value">
                        {financial.margin}%
                        {financial.targetMargin > 0 && (
                            <span className="text-xs text-muted ml-2 font-normal">
                                / Meta: {financial.targetMargin}%
                            </span>
                        )}
                    </div>
                    <div className="card-trend text-muted">
                        Receita: {financial.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' })}
                        {financial.targetRevenue > 0 && (
                            <span className="block text-xs">
                                Meta: {financial.targetRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' })}
                            </span>
                        )}
                    </div>
                </div>
                <div className="card summary-card">
                    <div className="card-icon success"><Users size={24} /></div>
                    <div className="card-label">Clima & Pessoas</div>
                    <div className="card-value">{people.climateScore} <span className="text-sm text-muted">/ 100</span></div>
                    <div className="card-trend text-muted">
                        Headcount: {people.headcount}
                    </div>
                </div>
                <div className="card summary-card">
                    <div className="card-icon warning"><Clock size={24} /></div>
                    <div className="card-label">Pipeline Ativo</div>
                    <div className="card-value">{pipeline.activeItems}</div>
                    <div className="card-trend text-muted">
                        Valor: {pipeline.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' })}
                    </div>
                </div>
                <div className="card summary-card">
                    <div className="card-icon secondary"><Shield size={24} /></div>
                    <div className="card-label">Maturidade</div>
                    <div className="card-value">{processMaturity.score}%</div>
                    <div className="card-trend text-muted">
                        Nível: {processMaturity.status}
                    </div>
                </div>
            </div>

            <div className="content-split">
                {/* Main Content */}
                <div className="main-column">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-h3">Fluxo de Caixa (Previsão)</h3>
                            <div className="badge badge-neutral">Runway: ~{financial.operatingMonths} meses</div>
                        </div>
                        <div className="chart-placeholder">
                            <div className="flex justify-between items-end h-32 px-4 gap-2">
                                {/* Simplified visual representation of cash flow */}
                                <div className="bg-primary/20 w-full rounded-t" style={{ height: '40%' }}></div>
                                <div className="bg-primary/40 w-full rounded-t" style={{ height: '55%' }}></div>
                                <div className="bg-primary/60 w-full rounded-t" style={{ height: '45%' }}></div>
                                <div className="bg-primary/80 w-full rounded-t" style={{ height: '70%' }}></div>
                                <div className="bg-primary w-full rounded-t" style={{ height: '60%' }}></div>
                                <div className="bg-primary w-full rounded-t" style={{ height: '85%' }}></div>
                            </div>
                            <div className="flex justify-between px-4 mt-2 text-xs text-muted">
                                <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span>
                            </div>
                        </div>
                        <div className="flex justify-between mt-4 border-t pt-4">
                            <div>
                                <span className="block text-xs text-muted">Disponível</span>
                                <span className="font-bold text-lg">{financial.cashAvailable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-muted text-right">Custos Mensais (Médio)</span>
                                <span className="font-bold text-lg text-danger">-{financial.costs.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="text-h3">Ações Prioritárias</h3>
                            </div>
                            {(!data.actions || data.actions.length === 0) ? (
                                <p className="text-muted text-sm p-4">Nenhuma ação prioritária no momento.</p>
                            ) : (
                                <ul className="action-list">
                                    {data.actions.map((action: any, index: number) => (
                                        <li key={index} className="action-item">
                                            <div className={`action-icon ${action.priority === 'critical' ? 'danger' : action.priority === 'high' ? 'warning' : 'primary'}`}>
                                                {action.type === 'financial' ? <DollarSign size={16} /> :
                                                    action.type === 'people' ? <Users size={16} /> :
                                                        action.type === 'alert' ? <AlertTriangle size={16} /> :
                                                            <Activity size={16} />}
                                            </div>
                                            <div className="action-info">
                                                <span className="action-text">{action.text}</span>
                                                <span className="action-meta">{action.meta}</span>
                                            </div>
                                            {action.link && (
                                                <Link to={action.link} className="btn-icon-sm">
                                                    <ArrowRight size={14} />
                                                </Link>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="text-h3">Atalhos</h3>
                            </div>
                            <div className="quick-access-grid">
                                <Link to="/financeiro" className="quick-access-item">
                                    <DollarSign size={20} className="text-success" />
                                    <span>Novo Lançamento</span>
                                </Link>
                                <Link to="/pessoas" className="quick-access-item">
                                    <Users size={20} className="text-primary" />
                                    <span>Adicionar Colaborador</span>
                                </Link>
                                <Link to="/fluxos" className="quick-access-item">
                                    <LayoutDashboard size={20} className="text-warning" />
                                    <span>Criar Card</span>
                                </Link>
                                <Link to="/alertas" className="quick-access-item">
                                    <AlertTriangle size={20} className="text-danger" />
                                    <span>Reportar Problema</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <aside className="sidebar-column">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-h3">Alertas Recentes</h3>
                            <Link to="/alertas" className="text-xs text-primary hover:underline">Ver todos</Link>
                        </div>
                        {alerts.length === 0 ? (
                            <p className="text-sm text-muted p-2">Nenhum alerta ativo.</p>
                        ) : (
                            <div className="alerts-list">
                                {alerts.map((alert: any) => (
                                    <div key={alert.id} className={`alert-item priority-${alert.priority}`}>
                                        <div className="alert-content">
                                            <span className="alert-title">{alert.title}</span>
                                            <span className="alert-time">
                                                {new Date(alert.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card bg-secondary text-white">
                        <h3 className="text-h3 mb-2">Plano Pro</h3>
                        <p className="text-sm opacity-90 mb-4">
                            Você está utilizando 85% dos recursos do plano atual. Considere fazer um upgrade.
                        </p>
                        <button className="btn btn-white w-full">Gerenciar Assinatura</button>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Dashboard;
