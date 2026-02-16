import { useState } from 'react';
import {
    AlertTriangle,
    TrendingDown,
    Users,
    Clock,
    CheckCircle,
    Filter,
    ArrowRight
} from 'lucide-react';
import './Alertas.css';

const Alertas = () => {
    const [filter, setFilter] = useState('active');

    const alerts = [
        { id: 1, type: 'finance', priority: 'high', title: 'Fluxo de Caixa Projetado', msg: 'Previsão de caixa negativo para dia 25/02. Necessário aporte ou antecipação.', date: 'Hoje, 09:00' },
        { id: 2, type: 'finance', priority: 'medium', title: 'Margem em Queda', msg: 'Custos operacionais subiram 15% este mês, impactando a margem direta.', date: 'Ontem, 14:30' },
        { id: 3, type: 'people', priority: 'medium', title: 'Turnover no Comercial', msg: '3 desligamentos no setor comercial nos últimos 30 dias.', date: '15/02, 10:00' },
        { id: 4, type: 'people', priority: 'low', title: 'Avaliação de Desempenho', msg: 'Ciclo trimestral pendente para 5 gestores. Prazo encerra em 3 dias.', date: '14/02, 16:45' },
        { id: 5, type: 'strategy', priority: 'low', title: 'Meta de Expansão', msg: 'Progresso da meta de abertura de nova filial está 10% atrasado.', date: '12/02, 11:20' },
    ];

    return (
        <div className="container animate-fade">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Alertas & Insights</h1>
                    <p className="text-small">Monitoramento ativo de riscos e oportunidades</p>
                </div>
                <div className="header-actions">
                    <button className={`btn ${filter === 'active' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('active')}>
                        Ativos
                    </button>
                    <button className={`btn ${filter === 'history' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('history')}>
                        Histórico
                    </button>
                </div>
            </header>

            <div className="alerts-layout">
                <div className="alerts-feed">
                    <div className="feed-header">
                        <h3 className="text-h3">Feed de Alertas</h3>
                        <button className="btn-icon"><Filter size={16} /></button>
                    </div>

                    <div className="feed-list">
                        {alerts.map(alert => (
                            <div key={alert.id} className={`feed-item ${alert.priority}`}>
                                <div className="feed-icon-col">
                                    {alert.priority === 'high' ? (
                                        <div className="icon-box danger"><AlertTriangle size={20} /></div>
                                    ) : alert.priority === 'medium' ? (
                                        <div className="icon-box warning"><TrendingDown size={20} /></div>
                                    ) : (
                                        <div className="icon-box info"><Users size={20} /></div>
                                    )}
                                    <div className="connector-line"></div>
                                </div>
                                <div className="feed-content">
                                    <div className="feed-meta">
                                        <span className="feed-date"><Clock size={12} /> {alert.date}</span>
                                        <span className={`priority-badge ${alert.priority}`}>
                                            {alert.priority === 'high' ? 'Alta Prioridade' : alert.priority === 'medium' ? 'Média' : 'Baixa'}
                                        </span>
                                    </div>
                                    <h4 className="feed-title">{alert.title}</h4>
                                    <p className="feed-msg">{alert.msg}</p>
                                    <div className="feed-actions">
                                        <button className="btn-action">Marcar como visto <CheckCircle size={14} /></button>
                                        <button className="btn-action primary">Ver detalhes <ArrowRight size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="alerts-sidebar">
                    <div className="card">
                        <h3 className="text-h3 mb-md">Resumo de Riscos</h3>
                        <div className="risk-summary">
                            <div className="risk-row">
                                <span className="risk-label">Financeiro</span>
                                <div className="risk-bar">
                                    <div className="risk-fill danger" style={{ width: '80%' }}></div>
                                </div>
                            </div>
                            <div className="risk-row">
                                <span className="risk-label">Pessoas</span>
                                <div className="risk-bar">
                                    <div className="risk-fill warning" style={{ width: '45%' }}></div>
                                </div>
                            </div>
                            <div className="risk-row">
                                <span className="risk-label">Operacional</span>
                                <div className="risk-bar">
                                    <div className="risk-fill success" style={{ width: '15%' }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="insight-box">
                            <span className="insight-title">Insight Gerado por IA</span>
                            <p className="insight-text">
                                Baseado no histórico, o turnover no comercial tende a aumentar em Março. Considere revisar o plano de incentivos agora.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Alertas;
