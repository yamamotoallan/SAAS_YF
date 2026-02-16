import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Users,
    Wallet,
    ArrowRight,
    Activity,
    BrainCircuit,
    Layers,
    CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
    return (
        <div className="dashboard-container animate-fade">
            <header className="dashboard-header">
                <div>
                    <h1 className="text-h2">Visão Geral Executiva</h1>
                    <p className="text-small">Mission Control: Estratégia, Operação e Resultados</p>
                </div>
                <div className="score-card">
                    <div className="score-label">Score Geral (SGE)</div>
                    <div className="score-value text-success">85/100</div>
                    <div className="badge badge-success">Empresa Saudável</div>
                </div>
            </header>

            <div className="dashboard-grid">
                {/* Main Content Area */}
                <div className="main-column">

                    {/* Strategic & Operational Pulse */}
                    <section className="pulse-grid">
                        <Link to="/processos" className="pulse-card">
                            <div className="pulse-icon secondary"><BrainCircuit size={24} /></div>
                            <div className="pulse-content">
                                <span className="pulse-label">Maturidade de Processos</span>
                                <div className="pulse-value">Transição</div>
                                <div className="pulse-meta text-warning">Risco em Estratégia</div>
                            </div>
                        </Link>
                        <Link to="/operacao" className="pulse-card">
                            <div className="pulse-icon warning"><Activity size={24} /></div>
                            <div className="pulse-content">
                                <span className="pulse-label">Eficiência Operacional</span>
                                <div className="pulse-value">Sob Pressão</div>
                                <div className="pulse-meta text-danger">Gargalo em Negociação</div>
                            </div>
                        </Link>
                        <Link to="/fluxos" className="pulse-card">
                            <div className="pulse-icon primary"><Layers size={24} /></div>
                            <div className="pulse-content">
                                <span className="pulse-label">Pipeline de Vendas</span>
                                <div className="pulse-value">R$ 850k</div>
                                <div className="pulse-meta text-success">65 Itens Ativos</div>
                            </div>
                        </Link>
                    </section>

                    {/* Financial Summary */}
                    <section className="dashboard-section">
                        <div className="section-header">
                            <h3 className="section-title"><Wallet size={18} /> Resumo Financeiro</h3>
                            <Link to="/financeiro" className="btn-link">Ver detalhe <ArrowRight size={14} /></Link>
                        </div>
                        <div className="metrics-grid">
                            <div className="metric-card">
                                <span className="metric-label">Faturamento Mensal</span>
                                <div className="metric-value">R$ 145.000</div>
                                <div className="metric-trend positive">
                                    <TrendingUp size={14} /> +12% vs mês anterior
                                </div>
                            </div>
                            <div className="metric-card">
                                <span className="metric-label">Margem Operacional</span>
                                <div className="metric-value">22%</div>
                                <div className="metric-trend negative">
                                    <TrendingDown size={14} /> -2% vs meta
                                </div>
                            </div>
                            <div className="metric-card">
                                <span className="metric-label">Caixa Disponível</span>
                                <div className="metric-value">R$ 320.000</div>
                                <div className="metric-trend neutral">
                                    <Activity size={14} /> 4 meses de operação
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* People & Culture */}
                    <section className="dashboard-section">
                        <div className="section-header">
                            <h3 className="section-title"><Users size={18} /> Pessoas & Cultura</h3>
                            <Link to="/pessoas" className="btn-link">Ver detalhe <ArrowRight size={14} /></Link>
                        </div>
                        <div className="metrics-grid">
                            <div className="metric-card">
                                <span className="metric-label">Headcount</span>
                                <div className="metric-value">42</div>
                                <div className="text-caption">Colaboradores ativos</div>
                            </div>
                            <div className="metric-card">
                                <span className="metric-label">Turnover (Trimestre)</span>
                                <div className="metric-value text-warning">5.2%</div>
                                <div className="text-caption">Atenção requerida</div>
                            </div>
                            <div className="metric-card">
                                <span className="metric-label">Clima Organizacional</span>
                                <div className="metric-value">4.2/5.0</div>
                                <div className="badge badge-success">Bom</div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Alerts & Feed */}
                <aside className="alerts-column">
                    <div className="alerts-card">
                        <div className="alerts-header">
                            <h3 className="text-h3">Alertas Prioritários</h3>
                            <div className="badge badge-danger">3 Críticos</div>
                        </div>
                        <div className="alerts-list">
                            <div className="alert-item high-priority">
                                <AlertTriangle size={18} className="text-danger" />
                                <div>
                                    <div className="alert-title">Fluxo de Caixa</div>
                                    <div className="alert-desc">Previsão negativa p/ 25/02. Necessário aporte.</div>
                                </div>
                            </div>
                            <div className="alert-item high-priority">
                                <Activity size={18} className="text-danger" />
                                <div>
                                    <div className="alert-title">Gargalo Crítico</div>
                                    <div className="alert-desc">Negociação com 168% da capacidade.</div>
                                </div>
                            </div>
                            <div className="alert-item medium-priority">
                                <TrendingDown size={18} className="text-warning" />
                                <div>
                                    <div className="alert-title">Margem em Queda</div>
                                    <div className="alert-desc">Custos operacionais subiram 15%.</div>
                                </div>
                            </div>
                            <div className="alert-item low-priority">
                                <Users size={18} className="text-primary" />
                                <div>
                                    <div className="alert-title">Avaliação Pendente</div>
                                    <div className="alert-desc">5 avaliações pendentes em RH.</div>
                                </div>
                            </div>
                        </div>
                        <Link to="/alertas" className="btn btn-secondary btn-full">
                            Ver Central de Alertas
                        </Link>
                    </div>

                    <div className="mini-card">
                        <h4 className="text-small mb-sm">Próximos Passos (Plano)</h4>
                        <ul className="checklist-sm">
                            <li className="checked"><CheckCircle size={12} /> Planejamento Anual</li>
                            <li className="checked"><CheckCircle size={12} /> Revisão de Processos</li>
                            <li><div className="checkbox-empty"></div> Contratação Gerente</li>
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Dashboard;
