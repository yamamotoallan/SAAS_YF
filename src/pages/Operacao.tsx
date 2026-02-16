import { useMemo } from 'react';
import {
    Activity,
    Clock,
    AlertOctagon,
    ArrowRight,
    RefreshCw,
    GitCommit,
    BarChart2,
    AlertTriangle,
    Lightbulb
} from 'lucide-react';
import { OPERATION_DATA } from '../data/operations'; // Assuming simulation data is here
import './Operacao.css';

const Operacao = () => {
    const data = OPERATION_DATA;

    const diagnosis = useMemo(() => {
        // Logic to classify operation
        let status = 'Operação Equilibrada';
        let statusClass = 'success';

        if (data.slaCompliance < 70 || data.delayedItems > (data.totalActive * 0.2)) {
            status = 'Operação sob Pressão';
            statusClass = 'warning';
        }
        if (data.slaCompliance < 50 || data.bottlenecks.length > 1) {
            status = 'Operação em Risco';
            statusClass = 'danger';
        }

        return { status, statusClass };
    }, [data]);

    return (
        <div className="container animate-fade">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Eficiência Operacional</h1>
                    <p className="text-small">Análise de fluxos, gargalos e capacidade</p>
                </div>
                <div className="status-badge-lg" data-type={diagnosis.statusClass}>
                    {diagnosis.status}
                </div>
            </header>

            {/* KPI Cockpit */}
            <div className="ops-metrics-grid">
                <div className="ops-card">
                    <div className="ops-icon primary"><Activity size={20} /></div>
                    <div className="ops-stat">
                        <span className="ops-label">Itens Ativos</span>
                        <span className="ops-value">{data.totalActive}</span>
                    </div>
                </div>
                <div className="ops-card">
                    <div className="ops-icon warning"><Clock size={20} /></div>
                    <div className="ops-stat">
                        <span className="ops-label">Tempo Médio (Ciclo)</span>
                        <span className="ops-value">{data.avgCycleTime} dias</span>
                    </div>
                </div>
                <div className="ops-card">
                    <div className="ops-icon danger"><AlertOctagon size={20} /></div>
                    <div className="ops-stat">
                        <span className="ops-label">SLA Cumprido</span>
                        <span className="ops-value text-danger">{data.slaCompliance}%</span>
                    </div>
                </div>
                <div className="ops-card">
                    <div className="ops-icon secondary"><RefreshCw size={20} /></div>
                    <div className="ops-stat">
                        <span className="ops-label">Taxa de Retrabalho</span>
                        <span className="ops-value">{data.reworkRate}%</span>
                    </div>
                </div>
            </div>

            <div className="ops-layout">
                <div className="flow-column">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-h3">Fluxo: {data.flowName}</h3>
                            <span className="text-caption">Visualização de Gargalos</span>
                        </div>

                        <div className="flow-visual">
                            {data.stages.map((stage, index) => {
                                const isBottleneck = data.bottlenecks.includes(stage.id);
                                const load = (stage.volume / stage.capacity) * 100;

                                return (
                                    <div key={stage.id} className={`flow-stage ${isBottleneck ? 'bottleneck' : ''}`}>
                                        <div className="stage-info">
                                            <span className="stage-name">{index + 1}. {stage.name}</span>
                                            <div className="stage-meta">
                                                <span className="meta-item"><UsersIcon size={12} /> Vol: {stage.volume}</span>
                                                <span className="meta-item"><Clock size={12} /> Médio: {stage.avgTime}d</span>
                                            </div>
                                        </div>

                                        <div className="stage-bar-container">
                                            <div className="stage-metrics">
                                                <span className="sla-tag">SLA: {stage.sla}d</span>
                                                <span className={`load-tag ${load > 100 ? 'overload' : ''}`}>
                                                    Carga: {Math.round(load)}%
                                                </span>
                                            </div>
                                            <div className="stage-progress">
                                                <div
                                                    className={`progress-fill ${isBottleneck ? 'danger' : 'primary'}`}
                                                    style={{ width: `${Math.min(load, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {index < data.stages.length - 1 && (
                                            <div className="flow-arrow">
                                                <ArrowRight size={16} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <aside className="diagnosis-column">
                    <div className="diagnosis-card ops-diag">
                        <h3 className="text-h3 mb-md"><BarChart2 size={20} /> Diagnóstico</h3>

                        <div className="diag-block">
                            <h4 className="diag-sub"><AlertTriangle size={16} /> Principais Gargalos</h4>
                            <ul className="diag-list">
                                {data.stages.filter(s => data.bottlenecks.includes(s.id)).map(s => (
                                    <li key={s.id}>
                                        <strong>{s.name}</strong> está operando
                                        <span className="text-danger"> {Math.round((s.volume / s.capacity) * 100)}% </span>
                                        acima da capacidade. O tempo médio ({s.avgTime}d) é mais que o dobro do SLA ({s.sla}d).
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="diag-block">
                            <h4 className="diag-sub"><GitCommit size={16} /> Riscos Identificados</h4>
                            <p className="diag-text">
                                O acúmulo na fase de <strong>Negociação</strong> trava R$ {data.valueProcessing.toLocaleString('pt-BR')} em potencial receita.
                                Há risco elevado de perda de clientes por demora na resposta.
                            </p>
                        </div>

                        <div className="diag-block">
                            <h4 className="diag-sub"><Lightbulb size={16} /> Recomendações</h4>
                            <div className="rec-box">
                                <p>1. Revisar critérios de entrada na fase de Negociação para filtrar melhor os leads.</p>
                                <p>2. Simplificar o processo de aprovação de propostas para reduzir o ciclo.</p>
                                <p>3. Considerar alocar suporte administrativo temporário para destravar propostas paradas.</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

// Helper component icon
const UsersIcon = ({ size }: { size: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

export default Operacao;
