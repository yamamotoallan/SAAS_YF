import {
    Users,
    UserMinus,
    UserPlus,
    Heart,
    Search,
    MoreHorizontal
} from 'lucide-react';
import './Pessoas.css';

const Pessoas = () => {
    return (
        <div className="container animate-fade">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Pessoas & Cultura</h1>
                    <p className="text-small">Gestão de talentos e clima organizacional</p>
                </div>
                <button className="btn btn-primary">Adicionar Colaborador</button>
            </header>

            {/* Metrics Row */}
            <div className="people-metrics-grid">
                <div className="people-card">
                    <div className="people-icon-wrapper blue">
                        <Users size={24} />
                    </div>
                    <div>
                        <div className="people-metric-value">42</div>
                        <div className="people-metric-label">Headcount Atual</div>
                    </div>
                </div>
                <div className="people-card">
                    <div className="people-icon-wrapper green">
                        <UserPlus size={24} />
                    </div>
                    <div>
                        <div className="people-metric-value text-success">3</div>
                        <div className="people-metric-label">Contratações (Mês)</div>
                    </div>
                </div>
                <div className="people-card">
                    <div className="people-icon-wrapper red">
                        <UserMinus size={24} />
                    </div>
                    <div>
                        <div className="people-metric-value text-danger">5.2%</div>
                        <div className="people-metric-label">Turnover Trimestral</div>
                    </div>
                </div>
                <div className="people-card">
                    <div className="people-icon-wrapper yellow">
                        <Heart size={24} />
                    </div>
                    <div>
                        <div className="people-metric-value text-warning">4.2</div>
                        <div className="people-metric-label">Clima / eNPS</div>
                    </div>
                </div>
            </div>

            <div className="content-split">
                {/* Teams List */}
                <div className="card full-height">
                    <div className="card-header">
                        <h3 className="text-h3">Equipes</h3>
                        <button className="btn-icon"><Search size={16} /></button>
                    </div>
                    <div className="teams-list">
                        {[
                            { name: 'Comercial', size: 12, lead: 'Fernanda S.', status: 'healthy' },
                            { name: 'Tecnologia', size: 8, lead: 'Carlos M.', status: 'attention' },
                            { name: 'Operações', size: 15, lead: 'Roberto J.', status: 'healthy' },
                            { name: 'Financeiro', size: 4, lead: 'Ana P.', status: 'healthy' },
                            { name: 'RH', size: 3, lead: 'Juliana R.', status: 'healthy' },
                        ].map((team, i) => (
                            <div key={i} className="team-item">
                                <div className="team-info">
                                    <div className="team-name">{team.name}</div>
                                    <div className="team-meta">{team.size} colaboradores • Lead: {team.lead}</div>
                                </div>
                                <div className={`status-badge ${team.status === 'healthy' ? 'success' : 'warning'}`}>
                                    {team.status === 'healthy' ? 'Estável' : 'Atenção'}
                                </div>
                                <button className="btn-icon"><MoreHorizontal size={16} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Climate / Mood */}
                <div className="card full-height">
                    <div className="card-header">
                        <h3 className="text-h3">Clima Organizacional</h3>
                        <button className="btn-link">Ver pesquisa completa</button>
                    </div>
                    <div className="climate-breakdown">
                        <div className="climate-score">
                            <span className="big-score">4.2</span>
                            <span className="scole-scale">/ 5.0</span>
                        </div>
                        <div className="climate-bars">
                            {[
                                { label: 'Liderança', val: 90 },
                                { label: 'Ambiente', val: 85 },
                                { label: 'Salário/Benefícios', val: 65, color: 'var(--color-warning)' },
                                { label: 'Comunicação', val: 75 },
                            ].map((item, i) => (
                                <div key={i} className="climate-bar-row">
                                    <span className="cb-label">{item.label}</span>
                                    <div className="cb-track">
                                        <div
                                            className="cb-fill"
                                            style={{ width: `${item.val}%`, backgroundColor: item.color || 'var(--color-success)' }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pessoas;
