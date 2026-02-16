import { useState, useMemo } from 'react';
import {
    CheckCircle,
    AlertTriangle,
    XCircle,
    ChevronDown,
    ChevronUp,
    BrainCircuit,
    Target,
    ShieldAlert
} from 'lucide-react';
import { INITIAL_PROCESS_DATA, type ProcessBlock, type ProcessStatus, type ProcessItem } from '../data/processes';
import './Processos.css';

const Processos = () => {
    const [data] = useState<ProcessBlock[]>(INITIAL_PROCESS_DATA);
    const [expandedBlocks, setExpandedBlocks] = useState<string[]>(['direction', 'finance', 'governance']);

    const toggleBlock = (id: string) => {
        setExpandedBlocks(prev =>
            prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
        );
    };

    const getStatusIcon = (status: ProcessStatus) => {
        switch (status) {
            case 'formal': return <CheckCircle size={18} className="text-success" />;
            case 'informal': return <AlertTriangle size={18} className="text-warning" />;
            case 'none': return <XCircle size={18} className="text-danger" />;
        }
    };

    const getScore = (block: ProcessBlock) => {
        let score = 0;
        block.processes.forEach(p => {
            if (p.status === 'formal') score += 2;
            if (p.status === 'informal') score += 1;
        });
        // Max score = 10 (5 processes * 2 points)
        return (score / 10) * 100;
    };

    const diagnosis = useMemo(() => {
        const criticalRisks: ProcessItem[] = [];
        let weaknesses = 0;

        data.forEach(block => {
            const score = getScore(block);
            if (score < 50) weaknesses++;

            block.processes.forEach(p => {
                if (p.status === 'none' || p.status === 'informal') {
                    // Identify impactful missing processes
                    if (['D02', 'F05', 'P04', 'G03', 'O05'].includes(p.code)) {
                        criticalRisks.push(p);
                    }
                }
            });
        });

        return {
            overallStatus: weaknesses > 2 ? 'Empresa em Risco' : weaknesses > 0 ? 'Empresa em Transição' : 'Empresa Saudável',
            criticalRisks,
            strengths: ['Operacional', 'Administrativo'] // Hardcoded for this simulation logic
        };
    }, [data]);

    return (
        <div className="container animate-fade">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Maturidade de Processos</h1>
                    <p className="text-small">Avaliação estrutural e diagnóstico organizacional</p>
                </div>
                <div className="header-meta">
                    <span className="meta-label">Data da Avaliação:</span>
                    <span className="meta-value">16/02/2026</span>
                </div>
            </header>

            <div className="process-layout">
                <div className="matrix-column">
                    {data.map(block => {
                        const score = getScore(block);
                        const isExpanded = expandedBlocks.includes(block.id);

                        return (
                            <div key={block.id} className="process-block">
                                <div
                                    className="block-header"
                                    onClick={() => toggleBlock(block.id)}
                                >
                                    <div className="block-title-row">
                                        <h3 className="block-title">{block.title}</h3>
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
                                                    <th style={{ width: '120px' }}>Status</th>
                                                    <th style={{ width: '100px' }}>Responsável</th>
                                                    <th style={{ width: '100px' }}>Frequência</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {block.processes.map(p => (
                                                    <tr key={p.id}>
                                                        <td className="text-caption">{p.code}</td>
                                                        <td className="process-name">{p.name}</td>
                                                        <td className="status-cell">
                                                            {getStatusIcon(p.status)}
                                                            <span className="status-label">
                                                                {p.status === 'formal' ? 'Formal' : p.status === 'informal' ? 'Informal' : 'Inexistente'}
                                                            </span>
                                                        </td>
                                                        <td>{p.responsible ? 'Sim' : 'Não'}</td>
                                                        <td className="text-caption">
                                                            {p.frequency === 'periodic' ? 'Periódica' : p.frequency === 'eventual' ? 'Eventual' : '-'}
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
                            <div className={`verdict-badge ${diagnosis.overallStatus === 'Empresa Saudável' ? 'success' : diagnosis.overallStatus === 'Empresa em Risco' ? 'danger' : 'warning'}`}>
                                {diagnosis.overallStatus}
                            </div>
                        </div>

                        <div className="diagnosis-section">
                            <h4 className="diag-subtitle"><ShieldAlert size={16} /> Riscos Críticos (Top 5)</h4>
                            <ul className="risk-list">
                                {diagnosis.criticalRisks.slice(0, 5).map(risk => (
                                    <li key={risk.id} className="risk-item">
                                        <span className="risk-code">{risk.code}</span>
                                        <span className="risk-name">{risk.name}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="diag-text">
                                A ausência destes processos compromete a escalabilidade e expõe a empresa a erros de decisão.
                            </p>
                        </div>

                        <div className="diagnosis-section">
                            <h4 className="diag-subtitle"><Target size={16} /> Recomendações</h4>
                            <div className="rec-box">
                                <p>1. Formalizar o <strong>Planejamento Anual (D02)</strong> para guiar as decisões fora do operacional.</p>
                                <p>2. Implementar rotina de <strong>Registro de Decisões (G03)</strong> para evitar perda de histórico.</p>
                                <p>3. Estruturar <strong>Avaliação de Desempenho (P04)</strong> simples semestral.</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Processos;
