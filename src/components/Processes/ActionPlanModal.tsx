
import { X, CheckCircle, ExternalLink, ArrowRight } from 'lucide-react';

interface ActionSuggestion {
    processId: string;
    processName: string;
    code: string;
    status: string;
    actionTitle: string;
    actionStep: string;
    suggestedTool: string;
    priority: 'High' | 'Medium';
}

interface ActionPlanModalProps {
    onClose: () => void;
    actions: ActionSuggestion[];
}

const ActionPlanModal = ({ onClose, actions }: ActionPlanModalProps) => {
    return (
        <div className="modal-overlay">
            <div className="modal w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="modal-header">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <CheckCircle className="text-primary" /> Plano de Ação Sugerido
                        </h3>
                        <p className="text-sm text-muted">Baseado na auditoria de processos realizada.</p>
                    </div>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body overflow-y-auto p-0">
                    {actions.length === 0 ? (
                        <div className="p-8 text-center text-muted">
                            <CheckCircle size={48} className="mx-auto mb-4 text-success" />
                            <p>Parabéns! Seus processos apresentam boa maturidade.</p>
                            <p className="text-sm">Nenhuma ação crítica identificada no momento.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-muted uppercase">Prioridade</th>
                                    <th className="p-4 text-xs font-bold text-muted uppercase">Processo</th>
                                    <th className="p-4 text-xs font-bold text-muted uppercase">Ação Recomendada</th>
                                    <th className="p-4 text-xs font-bold text-muted uppercase">Ferramenta</th>
                                    <th className="p-4 text-xs font-bold text-muted uppercase"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {actions.map((action, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <span className={`badge ${action.priority === 'High' ? 'badge-danger' : 'badge-warning'}`}>
                                                {action.priority === 'High' ? 'ALTA' : 'MÉDIA'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-sm">{action.code} - {action.processName}</div>
                                            <div className="text-xs text-muted capitalize">Status: {action.status}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-primary mb-1">{action.actionTitle}</div>
                                            <div className="text-sm text-gray-600 flex items-start gap-1">
                                                <ArrowRight size={14} className="mt-1 flex-shrink-0" />
                                                {action.actionStep}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-mono text-muted">
                                            {action.suggestedTool}
                                        </td>
                                        <td className="p-4">
                                            <button className="btn btn-sm btn-outline text-xs whitespace-nowrap">
                                                <ExternalLink size={12} /> Detalhes
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="modal-footer bg-gray-50 justify-between items-center">
                    <span className="text-xs text-muted">
                        {actions.length} ações identificadas para melhoria.
                    </span>
                    <button className="btn btn-primary" onClick={onClose}>Entendi</button>
                </div>
            </div>
        </div>
    );
};

export default ActionPlanModal;
