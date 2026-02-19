import { useState, useEffect } from 'react';
import {
    DollarSign,
    TrendingDown,
    TrendingUp,
    PieChart,
    ArrowUpRight,
    Download,
    Plus,
    Trash2,
    Edit2
} from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal/Modal';
import './Financeiro.css';

const Financeiro = () => {
    // Data State
    const [entries, setEntries] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>({
        revenue: 0,
        expenses: 0,
        netIncome: 0,
        runway: 0,
        burnRate: 0
    });

    // UI State
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        type: 'EXPENSE',
        category: 'Operacional',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    const categories = [
        'Vendas', 'Serviços', 'Operacional', 'Marketing', 'Pessoal', 'Tecnologia', 'Impostos', 'Outros'
    ];

    useEffect(() => {
        loadData();
    }, [period]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [entriesData, summaryData] = await Promise.all([
                api.financial.list({ period }),
                api.financial.summary()
            ]);
            setEntries(entriesData);
            setSummary(summaryData);
        } catch (error) {
            console.error('Failed to load financial data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (selectedEntry) {
                await api.financial.update(selectedEntry.id, formData);
            } else {
                await api.financial.create(formData);
            }
            await loadData();
            closeModal();
        } catch (error) {
            alert('Erro ao salvar lançamento');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este lançamento?')) return;
        try {
            await api.financial.delete(id);
            await loadData();
        } catch (error) {
            alert('Erro ao excluir');
        }
    };

    const openModal = (entry: any = null) => {
        if (entry) {
            setSelectedEntry(entry);
            setFormData({
                type: entry.type,
                category: entry.category,
                amount: entry.amount,
                description: entry.description,
                date: entry.date.split('T')[0]
            });
        } else {
            setSelectedEntry(null);
            setFormData({
                type: 'EXPENSE',
                category: 'Operacional',
                amount: 0,
                description: '',
                date: new Date().toISOString().split('T')[0]
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEntry(null);
    };

    const exportCSV = () => {
        const headers = "Data,Tipo,Categoria,Descrição,Valor\n";
        const csv = entries.map(e =>
            `${new Date(e.date).toLocaleDateString()},${e.type},${e.category},"${e.description}",${e.amount}`
        ).join("\n");
        const blob = new Blob([headers + csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financeiro_${period}.csv`;
        a.click();
    };

    if (loading) return <div className="p-8 text-center">Carregando dados financeiros...</div>;

    const margin = summary.revenue > 0 ? ((summary.netIncome / summary.revenue) * 100).toFixed(1) : 0;

    return (
        <div className="container animate-fade">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Gestão Financeira</h1>
                    <p className="text-small">Controle de receitas, despesas e fluxo de caixa</p>
                </div>
                <div className="header-actions">
                    <div className="period-selector">
                        <button className={`selector-btn ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>Mês</button>
                        <button className={`selector-btn ${period === 'quarter' ? 'active' : ''}`} onClick={() => setPeriod('quarter')}>Trimestre</button>
                        <button className={`selector-btn ${period === 'year' ? 'active' : ''}`} onClick={() => setPeriod('year')}>Ano</button>
                    </div>
                    <button className="btn btn-secondary" onClick={exportCSV}>
                        <Download size={16} /> Exportar
                    </button>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={16} /> Novo Lançamento
                    </button>
                </div>
            </header>

            {/* Summary Cards */}
            <div className="finance-summary-grid">
                <div className="finance-card primary">
                    <div className="card-icon"><DollarSign size={24} /></div>
                    <div className="card-label">Receita (Mês)</div>
                    <div className="card-value">R$ {Number(summary.revenue).toLocaleString('pt-BR')}</div>
                    <div className="card-trend positive">
                        <ArrowUpRight size={16} /> Entradas confirmadas
                    </div>
                </div>
                <div className="finance-card">
                    <div className="card-icon warning"><TrendingDown size={24} /></div>
                    <div className="card-label">Despesas (Mês)</div>
                    <div className="card-value">R$ {Number(summary.expenses).toLocaleString('pt-BR')}</div>
                    <div className="card-trend negative">
                        <ArrowUpRight size={16} /> Saídas realizadas
                    </div>
                </div>
                <div className="finance-card">
                    <div className="card-icon success"><PieChart size={24} /></div>
                    <div className="card-label">Margem Líquida</div>
                    <div className="card-value">{margin}%</div>
                    <div className={`card-trend ${Number(margin) > 20 ? 'positive' : 'negative'}`}>
                        Meta: {'>'} 20%
                    </div>
                </div>
                <div className="finance-card">
                    <div className="card-icon info"><DollarSign size={24} /></div>
                    <div className="card-label">Caixa Disponível</div>
                    <div className="card-value">R$ {((Number(summary.revenue) - Number(summary.expenses)) * 4).toLocaleString('pt-BR')}</div>
                    {/* Mock calculation for cash, assuming 4x monthly net for demo */}
                    <div className="card-trend neutral">
                        Runway est.: ~4 meses
                    </div>
                </div>
            </div>

            <div className="content-grid">
                {/* Entries List */}
                <section className="card col-span-2">
                    <div className="section-header-row mb-4">
                        <h3 className="text-h3">Lançamentos do Período</h3>
                        <div className="text-sm text-muted">{entries.length} registros</div>
                    </div>

                    {entries.length === 0 ? (
                        <div className="p-8 text-center text-muted">Nenhum lançamento neste período.</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b text-muted text-sm">
                                        <th className="p-2">Data</th>
                                        <th className="p-2">Descrição</th>
                                        <th className="p-2">Categoria</th>
                                        <th className="p-2">Tipo</th>
                                        <th className="p-2 text-right">Valor</th>
                                        <th className="p-2 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map(entry => (
                                        <tr key={entry.id} className="border-b hover:bg-gray-50">
                                            <td className="p-2 text-sm">{new Date(entry.date).toLocaleDateString()}</td>
                                            <td className="p-2 font-medium">{entry.description}</td>
                                            <td className="p-2 text-sm">
                                                <span className="badge badge-neutral">{entry.category}</span>
                                            </td>
                                            <td className="p-2">
                                                {entry.type === 'INCOME' ?
                                                    <span className="text-success flex items-center gap-1"><TrendingUp size={14} /> Receita</span> :
                                                    <span className="text-danger flex items-center gap-1"><TrendingDown size={14} /> Despesa</span>
                                                }
                                            </td>
                                            <td className={`p-2 text-right font-mono ${entry.type === 'INCOME' ? 'text-success' : 'text-danger'}`}>
                                                {entry.type === 'INCOME' ? '+' : '-'} R$ {Number(entry.amount).toLocaleString('pt-BR')}
                                            </td>
                                            <td className="p-2 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button className="btn-icon-sm" onClick={() => openModal(entry)}><Edit2 size={14} /></button>
                                                    <button className="btn-icon-sm text-danger" onClick={() => handleDelete(entry.id)}><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={selectedEntry ? "Editar Lançamento" : "Novo Lançamento"}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Salvando...' : 'Salvar'}
                        </button>
                    </>
                }
            >
                <form className="form-grid">
                    <div className="form-group">
                        <label>Tipo</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    checked={formData.type === 'INCOME'}
                                    onChange={() => setFormData({ ...formData, type: 'INCOME' })}
                                />
                                Receita
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    checked={formData.type === 'EXPENSE'}
                                    onChange={() => setFormData({ ...formData, type: 'EXPENSE' })}
                                />
                                Despesa
                            </label>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Descrição</label>
                        <input
                            type="text"
                            className="input-field"
                            required
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Valor (R$)</label>
                        <input
                            type="number"
                            className="input-field"
                            required
                            min="0"
                            step="0.01"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Categoria</label>
                        <select
                            className="input-field"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Data</label>
                        <input
                            type="date"
                            className="input-field"
                            required
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Financeiro;
