import { useState, useEffect } from 'react';
import {
    Activity,
    Clock,
    ArrowRight,
    RefreshCw,
    BarChart2,
    AlertTriangle,
    Lightbulb,
    CheckCircle
} from 'lucide-react';
import { api } from '../services/api';
import './Operacao.css';

const Operacao = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await api.operations.metrics();
            setData(response);
            if (response.flows.length > 0) {
                setSelectedFlowId(response.flows[0].flowId);
            }
        } catch (error) {
            console.error('Failed to load operations data', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted">Carregando eficiência...</div>;
    if (!data || !data.flows || data.flows.length === 0) return (
        <div className="empty-state">
            <Activity size={48} className="text-muted" />
            <h3 className="mt-4">Sem dados operacionais</h3>
            <p>Crie fluxos e itens para gerar métricas de eficiência.</p>
        </div>
    );

    const activeFlow = data.flows.find((f: any) => f.flowId === selectedFlowId) || data.flows[0];

    return (
        <div className="container animate-fade">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Eficiência Operacional</h1>
                    <p className="text-small">Análise de fluxos, gargalos e capacidade</p>
                </div>
                <div className={`status-badge-lg ${data.overall.statusClass}`}>
                    {data.overall.status || 'Operação Normal'}
                </div>
            </header>

            {/* KPI Cockpit - Overall */}
            <div className="ops-metrics-grid">
                <div className="ops-card">
                    <div className="ops-icon primary"><Activity size={20} /></div>
                    <div className="ops-stat">
                        <span className="ops-label">Itens Ativos</span>
                        <span className="ops-value">{data.overall.totalActive}</span>
                    </div>
                </div>
                <div className="ops-card">
                    <div className="ops-icon warning"><Clock size={20} /></div>
                    <div className="ops-stat">
                        <span className="ops-label">Gargalos Críticos</span>
                        <span className="ops-value">{data.overall.totalBottlenecks}</span>
                    </div>
                </div>
                <div className="ops-card">
                    <div className="ops-icon success"><CheckCircle size={20} /></div>
                    <div className="ops-stat">
                        <span className="ops-label">SLA Cumprido (Médio)</span>
                        <span className={`ops-value ${data.overall.avgSlaCompliance < 70 ? 'text-danger' : 'text-success'}`}>
                            {data.overall.avgSlaCompliance}%
                        </span>
                    </div>
                </div>
                <div className="ops-card">
                    <div className="ops-icon secondary"><RefreshCw size={20} /></div>
                    <div className="ops-stat">
                        <span className="ops-label">Volume Processado</span>
                        <span className="ops-value">{activeFlow.valueProcessing.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' })}</span>
                    </div>
                </div>
            </div>

            <div className="ops-layout">
                <div className="flow-column">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-h3">
                                Fluxo:
                                <select
                                    className="ml-2 p-1 border rounded"
                                    value={selectedFlowId || ''}
                                    onChange={(e) => setSelectedFlowId(e.target.value)}
                                >
                                    {data.flows.map((f: any) => (
                                        <option key={f.flowId} value={f.flowId}>{f.flowName}</option>
                                    ))}
                                </select>
                            </h3>
                            <span className="text-caption">Visualização de Gargalos</span>
                        </div>

                        <div className="flow-visual">
                            {activeFlow.stages.map((stage: any, index: number) => {
                                const load = stage.capacity > 0 ? (stage.volume / stage.capacity) * 100 : 0;
                                const isBottleneck = stage.isBottleneck;

                                return (
                                    <div key={stage.id} className={`flow-stage ${isBottleneck ? 'bottleneck' : ''}`}>
                                        <div className="stage-info">
                                            <span className="stage-name">{index + 1}. {stage.name}</span>
                                            <div className="stage-meta">
                                                <span className="meta-item">Vol: {stage.volume}</span>
                                                <span className="meta-item">Médio: {stage.avgTime}d</span>
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

                                        {index < activeFlow.stages.length - 1 && (
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
                            {activeFlow.bottlenecks && activeFlow.bottlenecks.length > 0 ? (
                                <ul className="diag-list">
                                    {activeFlow.stages.filter((s: any) => activeFlow.bottlenecks.includes(s.id)).map((s: any) => (
                                        <li key={s.id}>
                                            <strong>{s.name}</strong> opera acima da capacidade ({Math.round((s.volume / s.capacity) * 100)}%).
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted">Nenhum gargalo crítico identificado.</p>
                            )}
                        </div>

                        <div className="diag-block">
                            <h4 className="diag-sub"><Lightbulb size={16} /> Recomendações</h4>
                            <div className="rec-box">
                                {activeFlow.bottlenecks.length > 0 ? (
                                    <p>Redistribuir carga para aliviar os gargalos identificados ou aumentar capacidade da equipe.</p>
                                ) : (
                                    <p>Fluxo operando dentro dos parâmetros normais. Foque em manter o SLA.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Operacao;
