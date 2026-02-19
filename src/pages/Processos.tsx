import { useState, useEffect } from 'react';
import {
    ChevronDown,
    ChevronUp,
    BrainCircuit,
    Target,
    ShieldAlert,
    Lightbulb
} from 'lucide-react';
import { api } from '../services/api';
import './Processos.css';
import ActionPlanModal from '../components/Processes/ActionPlanModal';

const Processos = () => {
    const [blocks, setBlocks] = useState<any[]>([]);
    const [diagnosis, setDiagnosis] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expandedBlocks, setExpandedBlocks] = useState<string[]>([]);
    const [showActionsModal, setShowActionsModal] = useState(false);
    const [actionSuggestions, setActionSuggestions] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenActions = async () => {
        try {
            const actions = await api.processes.actions();
            setActionSuggestions(actions);
            setShowActionsModal(true);
        } catch (error) {
            console.error('Failed to load actions', error);
            alert('Erro ao carregar plano de ação');
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [blocksData, diagnosisData] = await Promise.all([
                api.processes.list(),
                api.processes.diagnosis()
            ]);
            setBlocks(blocksData);
            setDiagnosis(diagnosisData);
            // Expand first block by default
            if (blocksData.length > 0) {
                setExpandedBlocks([blocksData[0].id]);
            }
        } catch (error) {
            console.error('Failed to load processes data', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleBlock = (id: string) => {
        setExpandedBlocks(prev =>
            prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
        );
    };

    const handleUpdateProcess = async (itemId: string, updates: any) => {
        try {
            // Optimistic update
            setBlocks(prev => prev.map(b => ({
                ...b,
                processes: b.processes.map((p: any) =>
                    p.id === itemId ? { ...p, ...updates } : p
                )
            })));

            await api.processes.updateItem(itemId, updates);

            // Refresh diagnosis in background
            const newDiagnosis = await api.processes.diagnosis();
            setDiagnosis(newDiagnosis);
        } catch (error) {
            console.error('Failed to update process', error);
            alert('Erro ao atualizar processo');
        }
    };



    // Helper to calculate momentary score for UI before refresh
    const getBlockScore = (block: any) => {
        if (!block.processes || block.processes.length === 0) return 0;
        let points = 0;
        block.processes.forEach((p: any) => {
            if (p.status === 'formal') points += 3;
            else if (p.status === 'informal') points += 1;
            if (p.responsible) points += 1;
            if (p.frequency === 'periodic') points += 1;
            else if (p.frequency === 'eventual') points += 0.5;
        });
        const maxPoints = block.processes.length * 5;
        return Math.round((points / maxPoints) * 100);
    };

    if (loading) return <div className="p-8 text-center text-muted">Carregando matriz de maturidade...</div>;

    return (
        <div className="container animate-fade">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Maturidade de Processos</h1>
                    <p className="text-small">Avaliação estrutural e diagnóstico organizacional</p>
                </div>
                <div className="header-meta">
                    <span className="meta-label">Diagnóstico Atual:</span>
                    <span className={`meta-value text-${diagnosis?.statusClass || 'muted'}`}>
                        {diagnosis?.overallStatus || 'Calculando...'}
                    </span>
                </div>
            </header>

            <div className="process-layout">
                <div className="matrix-column">
                    {blocks.map(block => {
                        const score = getBlockScore(block);
                        const isExpanded = expandedBlocks.includes(block.id);

                        return (
                            <div key={block.id} className="process-block">
                                <div
                                    className="block-header"
                                    onClick={() => toggleBlock(block.id)}
                                >
                                    <div className="block-title-row">
                                        <h3 className="block-title">{block.name}</h3>
                                        <div className="block-score">
                                            <div className="score-bar-bg">
                                                <div
                                                    className={`score-bar-fill ${score >= 70 ? 'success' : score >= 40 ? 'warning' : 'danger'}`}
                                                    style={{ width: `${score}%` }}
                                                ></div>
                                            </div>
                                            <span className="score-text">{score}%</span>
                                        </div>
                                    </div>
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>

                                {isExpanded && (
                                    <div className="block-content">
                                        <table className="process-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '60px' }}>Cód</th>
                                                    <th>Processo</th>
                                                    <th style={{ width: '140px' }}>Status</th>
                                                    <th style={{ width: '100px' }}>Resp.</th>
                                                    <th style={{ width: '120px' }}>Frequência</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {block.processes.map((p: any) => (
                                                    <tr key={p.id}>
                                                        <td className="text-caption">{p.code}</td>
                                                        <td className="process-name" title={p.observation}>{p.name}</td>
                                                        <td className="status-cell">
                                                            <select
                                                                className={`status-select ${p.status}`}
                                                                value={p.status}
                                                                onChange={(e) => handleUpdateProcess(p.id, { status: e.target.value })}
                                                            >
                                                                <option value="none">Inexistente</option>
                                                                <option value="informal">Informal</option>
                                                                <option value="formal">Formal</option>
                                                            </select>
                                                        </td>
                                                        <td className="text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={p.responsible}
                                                                onChange={(e) => handleUpdateProcess(p.id, { responsible: e.target.checked })}
                                                            />
                                                        </td>
                                                        <td>
                                                            <select
                                                                className="freq-select"
                                                                value={p.frequency}
                                                                onChange={(e) => handleUpdateProcess(p.id, { frequency: e.target.value })}
                                                            >
                                                                <option value="never">-</option>
                                                                <option value="eventual">Eventual</option>
                                                                <option value="periodic">Periódica</option>
                                                            </select>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <aside className="diagnosis-column">
                    <div className="diagnosis-card">
                        <div className="diagnosis-header">
                            <BrainCircuit size={24} className="text-secondary" />
                            <h3 className="text-h3">Diagnóstico Executivo</h3>
                        </div>

                        <div className="overall-verdict">
                            <span className="verdict-label">Classificação Geral</span>
                            <div className={`verdict-badge ${diagnosis?.statusClass || 'neutral'}`}>
                                {diagnosis?.overallStatus || 'N/A'}
                            </div>
                            <div className="text-center mt-2 text-sm text-muted">
                                Score Global: {diagnosis?.overallScore || 0}/100
                            </div>
                        </div>

                        <div className="p-4">
                            <button
                                className="btn btn-primary w-full flex items-center justify-center gap-2"
                                onClick={handleOpenActions}
                            >
                                <Lightbulb size={18} />
                                Ver Plano de Ação
                            </button>
                        </div>

                        <div className="diagnosis-section">
                            <h4 className="diag-subtitle"><ShieldAlert size={16} /> Vulnerabilidades Críticas</h4>
                            {diagnosis?.criticalRisks && diagnosis.criticalRisks.length > 0 ? (
                                <ul className="risk-list">
                                    {diagnosis.criticalRisks.slice(0, 5).map((risk: any) => (
                                        <li key={risk.id} className="risk-item">
                                            <span className="risk-code">{risk.code}</span>
                                            <span className="risk-name">{risk.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted">Nenhum risco crítico detectado.</p>
                            )}
                            <p className="diag-text mt-2">
                                {diagnosis?.criticalRisks?.length > 0
                                    ? "A ausência destes processos compromete a escalabilidade e expõe a empresa a erros."
                                    : "Sua empresa possui os processos vitais mapeados."}
                            </p>
                        </div>

                        <div className="diagnosis-section">
                            <h4 className="diag-subtitle"><Target size={16} /> Pontos Fortes</h4>
                            <div className="rec-box border-l-success">
                                {diagnosis?.strengths && diagnosis.strengths.length > 0 ? (
                                    <p>{diagnosis.strengths.join(', ')}</p>
                                ) : (
                                    <p className="text-muted">Melhore seus processos para destacar pontos fortes.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {showActionsModal && (
                <ActionPlanModal
                    actions={actionSuggestions}
                    onClose={() => setShowActionsModal(false)}
                />
            )}
        </div>
    );
};

export default Processos;
