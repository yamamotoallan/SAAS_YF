import { useState } from 'react';
import {
    DollarSign,

    TrendingDown,
    PieChart,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    Filter
} from 'lucide-react';
import './Financeiro.css';

const Financeiro = () => {
    const [period, setPeriod] = useState('month');

    return (
        <div className="container animate-fade">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Gestão Financeira</h1>
                    <p className="text-small">Controle de receitas, despesas e fluxo de caixa</p>
                </div>
                <div className="header-actions">
                    <div className="period-selector">
                        <button
                            className={`selector-btn ${period === 'month' ? 'active' : ''}`}
                            onClick={() => setPeriod('month')}
                        >
                            Mês Atual
                        </button>
                        <button
                            className={`selector-btn ${period === 'quarter' ? 'active' : ''}`}
                            onClick={() => setPeriod('quarter')}
                        >
                            Trimestre
                        </button>
                        <button
                            className={`selector-btn ${period === 'year' ? 'active' : ''}`}
                            onClick={() => setPeriod('year')}
                        >
                            Ano
                        </button>
                    </div>
                    <button className="btn btn-secondary">
                        <Download size={16} /> Exportar
                    </button>
                </div>
            </header>

            {/* Summary Cards */}
            <div className="finance-summary-grid">
                <div className="finance-card primary">
                    <div className="card-icon"><DollarSign size={24} /></div>
                    <div className="card-label">Receita Bruta</div>
                    <div className="card-value">R$ 145.000</div>
                    <div className="card-trend positive">
                        <ArrowUpRight size={16} /> +12% vs mês anterior
                    </div>
                </div>
                <div className="finance-card">
                    <div className="card-icon warning"><TrendingDown size={24} /></div>
                    <div className="card-label">Custos Operacionais</div>
                    <div className="card-value">R$ 85.000</div>
                    <div className="card-trend negative">
                        <ArrowUpRight size={16} /> +5% vs mês anterior
                        <span className="trend-note">(Aumento)</span>
                    </div>
                </div>
                <div className="finance-card">
                    <div className="card-icon success"><PieChart size={24} /></div>
                    <div className="card-label">Margem Operacional</div>
                    <div className="card-value">22%</div>
                    <div className="card-trend negative">
                        <ArrowDownRight size={16} /> -2% vs meta
                    </div>
                </div>
                <div className="finance-card">
                    <div className="card-icon info"><DollarSign size={24} /></div>
                    <div className="card-label">Caixa Disponível</div>
                    <div className="card-value">R$ 320.000</div>
                    <div className="card-trend neutral">
                        Runway: 4 meses
                    </div>
                </div>
            </div>

            <div className="content-grid">
                {/* Main Chart Section (Placeholder for MVP) */}
                <section className="chart-section card">
                    <div className="section-header-row">
                        <h3 className="text-h3">Projeção de Fluxo de Caixa</h3>
                        <button className="btn-icon"><Filter size={16} /></button>
                    </div>
                    <div className="chart-placeholder">
                        {/* Simple Visual Representation */}
                        <div className="bar-chart">
                            {[
                                { label: 'Jan', val: 60, type: 'actual' },
                                { label: 'Fev', val: 75, type: 'actual' },
                                { label: 'Mar', val: 80, type: 'projected' },
                                { label: 'Abr', val: 85, type: 'projected' },
                                { label: 'Mai', val: 90, type: 'projected' },
                                { label: 'Jun', val: 95, type: 'projected' },
                            ].map((item, i) => (
                                <div key={i} className="bar-group">
                                    <div
                                        className={`bar ${item.type}`}
                                        style={{ height: `${item.val}%` }}
                                    ></div>
                                    <span className="bar-label">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Breakdown Section */}
                <section className="breakdown-section card">
                    <h3 className="text-h3 mb-md">Composição de Custos</h3>
                    <div className="cost-list">
                        {[
                            { name: 'Pessoal & Encargos', value: 'R$ 45.000', percent: '53%' },
                            { name: 'Marketing & Vendas', value: 'R$ 15.000', percent: '18%' },
                            { name: 'Tecnologia', value: 'R$ 12.000', percent: '14%' },
                            { name: 'Infraestrutura', value: 'R$ 8.000', percent: '9%' },
                            { name: 'Outros', value: 'R$ 5.000', percent: '6%' },
                        ].map((item, i) => (
                            <div key={i} className="cost-row">
                                <div className="cost-info">
                                    <span className="cost-name">{item.name}</span>
                                    <div className="cost-bar-bg">
                                        <div className="cost-bar-fill" style={{ width: item.percent }}></div>
                                    </div>
                                </div>
                                <div className="cost-values">
                                    <span className="cost-amount">{item.value}</span>
                                    <span className="cost-percent">{item.percent}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Financeiro;
