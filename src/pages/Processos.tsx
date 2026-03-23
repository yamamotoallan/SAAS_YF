import { useState, useEffect } from 'react';
import {
    BrainCircuit,
    Target,
    ShieldAlert,
    Lightbulb,
    Plus,
    Zap
} from 'lucide-react';
import { api } from '../services/api';
import './Processos.css';
import ActionPlanModal from '../components/Processes/ActionPlanModal';

const Processos = ({ isWrapper = false }: { isWrapper?: boolean }) => {
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

    // Sparkline helper
    const Sparkline = ({ color }: { color: string }) => (
        <svg width="60" height="20" viewBox="0 0 60 20" className="sparkline">
            <path
                d="M0 15 Q 15 5, 30 12 T 60 8"
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                style={{ opacity: 0.6 }}
            />
        </svg>
    );

    if (loading) return (
        <div className="process-loading">
            <BrainCircuit size={48} className="animate-pulse text-primary" />
            <p className="mt-4 text-muted">Sincronizando inteligência de processos...</p>
        </div>
    );

    // Derived Kanban cards (Vulnerabilidades)
    const blockers = blocks.flatMap(b =>
        b.processes
            .filter((p: any) => p.status === 'none' || p.status === 'informal')
            .map((p: any) => ({ ...p, blockName: b.name }))
    ).sort((a, _b) => (a.status === 'none' ? -1 : 1));

    return (
        <div className={`process-intelligence-container animate-fade ${isWrapper ? 'is-wrapper pt-0' : ''}`}>
            {!isWrapper && (
                <header className="page-header">
                    <div>
                        <h1 className="text-h2 flex items-center gap-2">
                            <BrainCircuit className="text-primary" /> Process Intelligence
                        </h1>
                        <p className="text-small">Monitoramento de fricção e maturidade organizacional</p>
                    </div>
                    <div className="header-health-summary">
                        <div className="summary-item">
                            <span className="summary-label">Maturidade Geral</span>
                            <span className={`summary-value text-${diagnosis?.statusClass || 'muted'}`}>
                                {diagnosis?.overallScore || 0}%
                            </span>
                        </div>
                        <div className="summary-div" />
                        <div className="summary-item">
                            <span className="summary-label">Vulnerabilidades</span>
                            <span className="summary-value text-danger">{blockers.length}</span>
                        </div>
                    </div>
                </header>
            )}

            {isWrapper && (
                <div className="flex justify-end mb-4 pt-4">
                    <div className="header-health-summary" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '0.75rem 1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div className="summary-item">
                            <span className="summary-label">Maturidade Geral</span>
                            <span className={`summary-value text-${diagnosis?.statusClass || 'muted'}`}>
                                {diagnosis?.overallScore || 0}%
                            </span>
                        </div>
                        <div className="summary-div" />
                        <div className="summary-item">
                            <span className="summary-label">Vulnerabilidades</span>
                            <span className="summary-value text-danger">{blockers.length}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="pi-dashboard-grid">
                {/* 1. Health Analytics Column */}
                <div className="pi-column health-column">
                    <h2 className="pi-column-title"><Target size={18} /> Saúde por Fluxo</h2>
                    <div className="health-cards-list">
                        {blocks.map(block => {
                            const score = getBlockScore(block);
                            const color = score >= 70 ? 'var(--color-success)' : score >= 40 ? 'var(--color-warning)' : 'var(--color-danger)';
                            return (
                                <div key={block.id} className="health-card" onClick={() => toggleBlock(block.id)}>
                                    <div className="health-card-main">
                                        <div className="health-info">
                                            <span className="health-dept">{block.name}</span>
                                            <div className="health-score-row">
                                                <span className="health-score-val" style={{ color }}>{score}%</span>
                                                {block.frictionScore > 0 && (
                                                    <span className="friction-badge" title={`${block.frictionScore} itens atrasados neste fluxo`}>
                                                        <Zap size={10} fill="currentColor" /> {block.frictionScore} Atritos
                                                    </span>
                                                )}
                                                <Sparkline color={color} />
                                            </div>
                                        </div>
                                        <div className="health-gauge">
                                            <div className="gauge-bg">
                                                <div className="gauge-fill" style={{ width: `${score}%`, background: color }} />
                                            </div>
                                        </div>
                                    </div>
                                    {expandedBlocks.includes(block.id) && (
                                        <div className="health-details animate-slide-down">
                                            {block.processes.map((p: any) => (
                                                <div key={p.id} className="health-detail-item">
                                                    <span className="detail-name">{p.name}</span>
                                                    <span className={`detail-status ${p.status}`}>{p.status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Blocker Kanban Column */}
                <div className="pi-column kanban-column">
                    <h2 className="pi-column-title"><ShieldAlert size={18} /> Blocker Kanban</h2>
                    <div className="kanban-board">
                        <div className="kanban-lane">
                            <div className="lane-header">
                                <span>Críticos (Inexistente)</span>
                                <span className="lane-count">{blockers.filter(b => b.status === 'none').length}</span>
                            </div>
                            <div className="lane-content">
                                {blockers.filter(b => b.status === 'none').map(item => (
                                    <div key={item.id} className="kanban-card card-critical">
                                        <div className="card-tag">{item.blockName}</div>
                                        <div className="card-body">{item.name}</div>
                                        <div className="card-footer">
                                            <span className="card-code">{item.code}</span>
                                            <button className="card-action-btn" onClick={() => handleUpdateProcess(item.id, { status: 'informal' })}>
                                                Mapear
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="kanban-lane">
                            <div className="lane-header">
                                <span>Informais (Frágil)</span>
                                <span className="lane-count">{blockers.filter(b => b.status === 'informal').length}</span>
                            </div>
                            <div className="lane-content">
                                {blockers.filter(b => b.status === 'informal').map(item => (
                                    <div key={item.id} className="kanban-card card-warning">
                                        <div className="card-tag">{item.blockName}</div>
                                        <div className="card-body">{item.name}</div>
                                        <div className="card-footer">
                                            <span className="card-code">{item.code}</span>
                                            <button className="card-action-btn" onClick={() => handleUpdateProcess(item.id, { status: 'formal' })}>
                                                Formalizar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Action Intelligence Column */}
                <div className="pi-column actions-column">
                    <h2 className="pi-column-title"><Lightbulb size={18} /> Centro de Ação</h2>
                    <div className="action-intelligence-panel">
                        <div className="ai-diagnosis-verdict" style={{ background: diagnosis?.statusClass === 'danger' ? 'linear-gradient(135deg, #fee2e2, #fecaca)' : 'linear-gradient(135deg, #fef9c3, #fef08a)' }}>
                            <span className="verdict-title">Diagnóstico</span>
                            <div className="verdict-status">{diagnosis?.overallStatus}</div>
                            <p className="verdict-desc">Sugerimos priorizar a formalização dos processos críticos para evitar gargalos operacionais.</p>
                        </div>

                        <div className="ai-actions-list">
                            <h3 className="ai-section-title">Ações Sugeridas</h3>
                            {diagnosis?.criticalRisks?.slice(0, 3).map((risk: any) => (
                                <div key={risk.id} className="ai-action-card">
                                    <div className="ai-action-icon"><Plus size={14} /></div>
                                    <div className="ai-action-content">
                                        <div className="ai-action-title">Formalizar {risk.name}</div>
                                        <p className="ai-action-sub">Risco: {risk.code} não possui documentação formal.</p>
                                        <button
                                            className="btn-automate-mini"
                                            onClick={async () => {
                                                try {
                                                    const flows = await api.flows.list();
                                                    const mainFlow = flows.find((f: any) => f.type === 'sales' || f.type === 'ops') || flows[0];

                                                    const suggestions = await api.processes.actions();
                                                    const template = suggestions.find((s: any) => s.code === risk.code) || {
                                                        actionTitle: `Formalizar ${risk.name}`,
                                                        actionStep: 'Mapear e documentar o processo atual.',
                                                        suggestedTool: 'Notion/Word'
                                                    };

                                                    if (mainFlow) {
                                                        await api.items.create({
                                                            title: `[PADRÃO] ${template.actionTitle}`,
                                                            description: `Ação sugerida para o processo ${risk.name} (${risk.code}).\n\nPróximo Passo: ${template.actionStep}\nFerramenta: ${template.suggestedTool}`,
                                                            flowId: mainFlow.id,
                                                            stageId: mainFlow.stages?.[0]?.id,
                                                            priority: 'high'
                                                        });
                                                        alert('Tarefa de Padronização enviada ao Fluxo Operacional!');
                                                    }
                                                } catch (e) {
                                                    alert('Erro ao automatizar tarefa');
                                                }
                                            }}
                                        >
                                            <Zap size={10} /> Automatizar
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button className="btn btn-outline w-full mt-4" onClick={handleOpenActions}>
                                Ver Plano Completo
                            </button>
                        </div>

                        <div className="ai-stats-card">
                            <h3 className="ai-section-title">Insights de Maturidade</h3>
                            <div className="ai-stat-row">
                                <span>Processos Formais</span>
                                <span>{blocks.reduce((acc, b) => acc + b.processes.filter((p: any) => p.status === 'formal').length, 0)}</span>
                            </div>
                            <div className="ai-stat-row">
                                <span>Responsáveis Definidos</span>
                                <span>{blocks.reduce((acc, b) => acc + b.processes.filter((p: any) => p.responsible).length, 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>
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
