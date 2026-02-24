
import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

const RulesConfig = () => {
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        entity: 'financial',
        metric: 'value',
        operator: '<',
        value: '',
        priority: 'high'
    });

    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        try {
            const data = await api.rules.list(); // Need to add to api.ts
            setRules(data);
        } catch (error) {
            console.error('Failed to load rules', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.rules.create({
                ...formData,
                value: Number(formData.value)
            });
            setShowForm(false);
            setFormData({ name: '', entity: 'financial', metric: 'value', operator: '<', value: '', priority: 'high' });
            loadRules();
        } catch (error) {
            alert('Erro ao criar regra');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza?')) return;
        try {
            await api.rules.delete(id);
            setRules(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            alert('Erro ao excluir regra');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold">Automação e Alertas</h3>
                    <p className="text-sm text-muted">Defina regras para o sistema monitorar automaticamente.</p>
                </div>
                <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={() => setShowForm(true)}>
                    <Plus size={16} /> Nova Regra
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="card p-4 bg-gray-50 border border-primary/20 animate-fade">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-xs font-bold">Nome da Regra</label>
                            <input
                                className="input-field"
                                placeholder="Ex: Margem Baixa"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold">Prioridade</label>
                            <select
                                className="input-field"
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="low">Baixa</option>
                                <option value="medium">Média</option>
                                <option value="high">Alta</option>
                                <option value="critical">Crítica</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4 p-3 bg-white rounded border">
                        <span className="text-sm font-bold text-muted">SE</span>
                        <select
                            className="input-field w-32"
                            value={formData.entity}
                            onChange={e => setFormData({ ...formData, entity: e.target.value })}
                        >
                            <option value="financial">Financeiro</option>
                            <option value="process">Processo</option>
                            <option value="people">Pessoas</option>
                        </select>
                        <select
                            className="input-field w-32"
                            value={formData.metric}
                            onChange={e => setFormData({ ...formData, metric: e.target.value })}
                        >
                            <option value="value">Valor (R$)</option>
                            <option value="margin">Margem (%)</option>
                            <option value="score">Score</option>
                        </select>
                        <select
                            className="input-field w-20"
                            value={formData.operator}
                            onChange={e => setFormData({ ...formData, operator: e.target.value })}
                        >
                            <option value="<">Menor que</option>
                            <option value=">">Maior que</option>
                            <option value="=">Igual a</option>
                        </select>
                        <input
                            type="number"
                            className="input-field w-24"
                            placeholder="Valor"
                            value={formData.value}
                            onChange={e => setFormData({ ...formData, value: e.target.value })}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary btn-sm">Salvar Regra</button>
                    </div>
                </form>
            )}

            <div className="grid gap-3">
                {rules.map(rule => (
                    <div key={rule.id} className="card p-4 flex justify-between items-center hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full bg-${rule.priority === 'critical' ? 'red' : 'yellow'}-100 text-${rule.priority === 'critical' ? 'red' : 'yellow'}-700`}>
                                <AlertTriangle size={18} />
                            </div>
                            <div>
                                <h4 className="font-bold flex items-center gap-2">
                                    {rule.name}
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-muted font-normal uppercase">{rule.entity}</span>
                                </h4>
                                <p className="text-sm text-muted">
                                    Gatilho: <b>{rule.metric}</b> {rule.operator} {rule.value}
                                </p>
                            </div>
                        </div>
                        <button className="icon-btn text-danger hover:bg-red-50" onClick={() => handleDelete(rule.id)}>
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}

                {rules.length === 0 && !loading && (
                    <div className="text-center p-8 text-muted border-2 border-dashed rounded-lg">
                        <p>Nenhuma regra de automação definida.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RulesConfig;
