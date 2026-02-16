import { useState } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import './KPIs.css';

const KPIs = () => {
    const [filter, setFilter] = useState('all');

    const kpis = [
        { id: 1, name: 'Faturamento Mensal', value: 'R$ 145.000', target: 'R$ 130.000', status: 'success', trend: '+12%', area: 'Financeiro' },
        { id: 2, name: 'Margem Operacional', value: '22%', target: '24%', status: 'warning', trend: '-2%', area: 'Financeiro' },
        { id: 3, name: 'Turnover Trimestral', value: '5.2%', target: '3.0%', status: 'danger', trend: '+2.2%', area: 'Pessoas' },
        { id: 4, name: 'NPS (Satisfação)', value: '72', target: '75', status: 'warning', trend: '-3', area: 'Cliente' },
        { id: 5, name: 'Custo Fixo Total', value: 'R$ 45.000', target: 'R$ 45.000', status: 'success', trend: '0%', area: 'Financeiro' },
        { id: 6, name: 'Absenteísmo', value: '1.5%', target: '2.0%', status: 'success', trend: '-0.5%', area: 'Pessoas' },
    ];

    const filteredKPIs = filter === 'all'
        ? kpis
        : kpis.filter(k => k.status === filter);

    return (
        <div className="container animate-fade">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Indicadores de Desempenho</h1>
                    <p className="text-small">Monitoramento dos principais resultados</p>
                </div>
                <button className="btn btn-primary">Novo KPI</button>
            </header>

            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input type="text" placeholder="Buscar indicador..." className="search-input" />
                </div>
                <div className="status-filters">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        Todos
                    </button>
                    <button
                        className={`filter-btn ${filter === 'success' ? 'active' : ''}`}
                        onClick={() => setFilter('success')}
                    >
                        <span className="dot success"></span> No Meta
                    </button>
                    <button
                        className={`filter-btn ${filter === 'warning' ? 'active' : ''}`}
                        onClick={() => setFilter('warning')}
                    >
                        <span className="dot warning"></span> Atenção
                    </button>
                    <button
                        className={`filter-btn ${filter === 'danger' ? 'active' : ''}`}
                        onClick={() => setFilter('danger')}
                    >
                        <span className="dot danger"></span> Crítico
                    </button>
                </div>
            </div>

            <div className="kpi-list">
                {filteredKPIs.map(kpi => (
                    <div key={kpi.id} className="kpi-card">
                        <div className={`status-indicator ${kpi.status}`}></div>
                        <div className="kpi-content">
                            <div className="kpi-header">
                                <span className="kpi-area">{kpi.area}</span>
                                <span className={`badge badge-${kpi.status === 'success' ? 'success' : kpi.status === 'warning' ? 'warning' : 'danger'}`}>
                                    {kpi.status === 'success' ? 'Na Meta' : kpi.status === 'warning' ? 'Atenção' : 'Crítico'}
                                </span>
                            </div>
                            <h3 className="kpi-name">{kpi.name}</h3>
                            <div className="kpi-metrics">
                                <div className="current-value">{kpi.value}</div>
                                <div className="target-value">Meta: {kpi.target}</div>
                            </div>
                        </div>
                        <div className="kpi-trend">
                            {kpi.status === 'success' ? <ArrowUpRight size={20} className="text-success" /> :
                                kpi.status === 'danger' ? <ArrowDownRight size={20} className="text-danger" /> :
                                    <Minus size={20} className="text-warning" />}
                            <span className={`trend-value ${kpi.status}`}>{kpi.trend}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KPIs;
