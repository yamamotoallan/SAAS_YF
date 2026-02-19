import { useState } from 'react';
import { User, DollarSign, Activity, Printer, Smartphone, Target } from 'lucide-react';
import { api } from '../services/api';
import './Relatorios.css';
import StaticCashFlowChart from '../components/Dashboard/StaticCashFlowChart';

const Relatorios = () => {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [generating, setGenerating] = useState(false);
    const [reportData, setReportData] = useState<any>(null);

    const generateReport = async () => {
        setGenerating(true);
        try {
            // Fetch consolidated data (Parallel requests)
            const [dashboard, financial, people, operations, actions] = await Promise.all([
                api.dashboard.get(),
                api.financial.summary(), // We would filter by date here in real app
                api.people.summary(),
                api.operations.metrics(),
                api.processes.actions()
            ]);

            setReportData({
                month,
                year,
                dashboard: { ...dashboard, actions }, // Inject actions into dashboard data structure for report
                financial,
                people,
                operations,
                generatedAt: new Date()
            });
        } catch (error) {
            console.error("Failed to generate report", error);
            alert("Erro ao gerar dados do relatório.");
        } finally {
            setGenerating(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="container animate-fade reports-container">
            <header className="page-header reports-header">
                <div>
                    <h1 className="text-h2">Relatórios Executivos</h1>
                    <p className="text-small">Geração de book de resultados (PDF)</p>
                </div>
            </header>

            <div className="report-controls mb-lg">
                <div className="control-group">
                    <label>Mês de Referência</label>
                    <div className="flex gap-2">
                        <select
                            className="input-field w-32"
                            value={month}
                            onChange={e => setMonth(Number(e.target.value))}
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                        <select
                            className="input-field w-24"
                            value={year}
                            onChange={e => setYear(Number(e.target.value))}
                        >
                            <option value={2025}>2025</option>
                            <option value={2026}>2026</option>
                        </select>
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={generateReport}
                    disabled={generating}
                >
                    {generating ? 'Consolidando...' : 'Gerar Relatório'}
                </button>

                {reportData && (
                    <div className="flex gap-2 ml-auto border-l pl-4">
                        <button className="btn btn-secondary" onClick={handlePrint}>
                            <Printer size={16} /> Imprimir / Salvar PDF
                        </button>
                    </div>
                )}
            </div>

            {reportData ? (
                <div className="report-preview">
                    {/* A4 Paper Container */}
                    <div className="a4-paper">
                        {/* Title Page */}
                        <div className="report-title-page">
                            <h1 className="report-logo">YF Consultoria</h1>
                            <h2 className="text-h1 mt-8 mb-4">Book de Resultados</h2>
                            <h3 className="text-h3 text-muted">
                                {new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                            </h3>

                            <div className="report-meta">
                                <p>Gerado em: {reportData.generatedAt.toLocaleString()}</p>
                                <p>Confidencial</p>
                            </div>
                        </div>

                        {/* Page 1: Executive Summary */}
                        <div className="page-break mt-12 pt-12 border-t">
                            <h3 className="text-h2 mb-6">1. Visão Geral (Executive Summary)</h3>

                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div className="p-6 bg-gray-50 rounded text-center">
                                    <h4 className="text-muted mb-2">SGE Score</h4>
                                    <div className="text-6xl font-bold text-primary mb-2">
                                        {reportData.dashboard.sgeScore}
                                    </div>
                                    <span className={`badge ${reportData.dashboard.sgeScore >= 70 ? 'badge-success' : 'badge-warning'}`}>
                                        {reportData.dashboard.sgeStatus}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-bold border-b pb-2">Destaques do Mês</h4>
                                    <ul className="list-disc pl-5 text-sm space-y-2">
                                        <li>
                                            Faturamento: <b>{reportData.financial.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</b>
                                            {reportData.financial.revenueTrend !== 0 && (
                                                <span className={`text-xs ml-2 ${reportData.financial.revenueTrend > 0 ? 'text-success' : 'text-danger'}`}>
                                                    ({reportData.financial.revenueTrend > 0 ? '+' : ''}{reportData.financial.revenueTrend}%)
                                                </span>
                                            )}
                                        </li>
                                        <li>
                                            Margem Operacional: <b>{reportData.financial.margin}%</b>
                                        </li>
                                        <li>Pipeline Ativo: {reportData.dashboard.pipeline.activeItems} oportunidades ({reportData.dashboard.pipeline.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' })})</li>
                                        <li>Clima Organizacional: {reportData.people.climateScore}/5.0</li>
                                    </ul>
                                </div>
                            </div>

                            <h4 className="font-bold mb-4 mt-8">Planos de Ação Prioritários</h4>
                            <div className="space-y-3">
                                {reportData.dashboard.actions && reportData.dashboard.actions.length > 0 ? (
                                    reportData.dashboard.actions.slice(0, 3).map((action: any, i: number) => (
                                        <div key={i} className="flex items-center gap-4 p-3 border rounded-md">
                                            <div className={`w-2 h-12 rounded-full ${action.priority === 'High' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                            <div>
                                                <div className="font-bold">{action.actionTitle}</div>
                                                <div className="text-xs text-muted">{action.processName} - {action.actionStep}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted italic">Nenhuma ação crítica pendente.</p>
                                )}
                            </div>
                        </div>

                        {/* Page 2: Financial */}
                        <div className="page-break mt-12 pt-12 border-t">
                            <div className="flex items-center gap-3 mb-6">
                                <DollarSign size={28} className="text-primary" />
                                <h3 className="text-h2">2. Resultados Financeiros</h3>
                            </div>

                            <table className="w-full text-left mb-8">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3">Indicador</th>
                                        <th className="p-3 text-right">Valor</th>
                                        <th className="p-3 text-right">Tendência</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    <tr>
                                        <td className="p-3">Receita Bruta</td>
                                        <td className="p-3 text-right font-mono">{reportData.financial.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        <td className={`p-3 text-right ${reportData.financial.revenueTrend >= 0 ? 'text-success' : 'text-danger'}`}>
                                            {reportData.financial.revenueTrend}%
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="p-3">Custos Variáveis</td>
                                        <td className="p-3 text-right font-mono">{reportData.financial.costs.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        <td className="p-3 text-right text-muted">-</td>
                                    </tr>
                                    <tr className="bg-gray-50 font-bold">
                                        <td className="p-3">Margem de Contribuição</td>
                                        <td className="p-3 text-right">{reportData.financial.margin}%</td>
                                        <td className="p-3 text-right">-</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3">Caixa Disponível</td>
                                        <td className="p-3 text-right font-mono">{reportData.financial.cashAvailable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        <td className="p-3 text-right text-muted">Runway: {reportData.financial.operatingMonths} m</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-8">
                                <h4 className="font-bold text-blue-800 mb-2">Comentário do Consultor</h4>
                                <p className="text-sm text-blue-900">
                                    {reportData.financial.operatingMonths < 3
                                        ? "ATENÇÃO: O caixa atual sustenta a operação por menos de 3 meses. Recomendamos revisão imediata de custos fixos ou antecipação de recebíveis."
                                        : "A saúde financeira está estável, com runway confortável. Momento propício para investimentos estratégicos em crescimento."}
                                </p>
                            </div>

                            <div className="chart-container-print">
                                <h4 className="font-bold mb-4">Evolução de Caixa (Últimos 6 Meses)</h4>
                                <StaticCashFlowChart data={reportData.dashboard.financial?.history || []} />
                            </div>
                        </div>

                        {/* Page 3: Operations & Sales */}
                        <div className="page-break mt-12 pt-12 border-t">
                            <div className="flex items-center gap-3 mb-6">
                                <Activity size={28} className="text-primary" />
                                <h3 className="text-h2">3. Operação e Vendas</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="card p-4">
                                    <h4 className="text-muted mb-2 flex items-center gap-2"><Target size={16} /> Eficiência Operacional</h4>
                                    <div className="text-3xl font-bold">{reportData.operations.overall.avgSlaCompliance}%</div>
                                    <div className="text-sm text-muted">Entregas no Prazo (SLA)</div>
                                </div>
                                <div className="card p-4">
                                    <h4 className="text-muted mb-2 flex items-center gap-2"><Smartphone size={16} /> Gargalos Identificados</h4>
                                    <div className="text-3xl font-bold">{reportData.operations.overall.totalBottlenecks}</div>
                                    <div className="text-sm text-muted">Etapas com sobrecarga</div>
                                </div>
                            </div>

                            <h4 className="font-bold mb-4">Performance por Fluxo</h4>
                            <table className="w-full text-left text-sm mb-8">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-2">Fluxo</th>
                                        <th className="p-2 text-right">Ativos</th>
                                        <th className="p-2 text-right">Finalizados</th>
                                        <th className="p-2 text-right">Ciclo Médio</th>
                                        <th className="p-2 text-right">SLA</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {reportData.operations.flows.map((flow: any) => (
                                        <tr key={flow.flowId}>
                                            <td className="p-2 font-medium">{flow.flowName}</td>
                                            <td className="p-2 text-right">{flow.totalActive}</td>
                                            <td className="p-2 text-right">{flow.completedPeriod}</td>
                                            <td className="p-2 text-right">{flow.avgCycleTime}d</td>
                                            <td className={`p-2 text-right ${flow.slaCompliance < 80 ? 'text-danger' : 'text-success'}`}>
                                                {flow.slaCompliance}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Page 4: People */}
                        <div className="page-break mt-12 pt-12 border-t">
                            <div className="flex items-center gap-3 mb-6">
                                <User size={28} className="text-primary" />
                                <h3 className="text-h2">4. Pessoas e Cultura</h3>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-8">
                                <div className="text-center p-4 border rounded">
                                    <div className="text-2xl font-bold">{reportData.people.headcount}</div>
                                    <div className="text-xs text-muted">Colaboradores</div>
                                </div>
                                <div className="text-center p-4 border rounded">
                                    <div className="text-2xl font-bold">{reportData.people.turnover}%</div>
                                    <div className="text-xs text-muted">Turnover (Trimestral)</div>
                                </div>
                                <div className="text-center p-4 border rounded">
                                    <div className="text-2xl font-bold">{reportData.people.climateScore}</div>
                                    <div className="text-xs text-muted">Clima / eNPS</div>
                                </div>
                            </div>

                            <h4 className="font-bold mb-4">Distribuição por Equipe</h4>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-2">Departamento</th>
                                        <th className="p-2 text-right">Pessoas</th>
                                        <th className="p-2">Liderança</th>
                                        <th className="p-2 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {reportData.people.teams.map((team: any, i: number) => (
                                        <tr key={i}>
                                            <td className="p-2 font-medium">{team.name}</td>
                                            <td className="p-2 text-right">{team.size}</td>
                                            <td className="p-2">{team.lead}</td>
                                            <td className="p-2 text-center">
                                                <span className={`badge ${team.status === 'healthy' ? 'badge-success' : 'badge-warning'}`}>
                                                    {team.status === 'healthy' ? 'Estável' : 'Atenção'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <User size={48} className="text-muted" />
                    <h3>Nenhum relatório gerado</h3>
                    <p>Selecione o período acima e clique em "Gerar Relatório" para visualizar.</p>
                </div>
            )}
        </div>
    );
};

export default Relatorios;
