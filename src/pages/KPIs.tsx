import { useState, useEffect } from 'react';
import {
    Search,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Plus,
    Trash2,
    Target
} from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal/Modal';
import './KPIs.css';

const KPIs = () => {
    // Data State
    const [kpis, setKpis] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedKpi, setSelectedKpi] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        value: 0,
        target: 0,
        unit: '%',
        area: 'Financeiro',
        trend: 0,
        status: 'warning'
    });

    const areas = ['Financeiro', 'Comercial', 'Operações', 'Pessoas', 'Marketing', 'Tecnologia'];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await api.kpis.list();
            setKpis(data);
        } catch (error) {
            console.error('Failed to load KPIs', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Auto-calculate status based on value vs target
            const ratio = formData.target > 0 ? (formData.value / formData.target) : 0;
            let computedStatus = 'danger';
            if (ratio >= 1) computedStatus = 'success';
            else if (ratio >= 0.8) computedStatus = 'warning';

            const payload = { ...formData, status: computedStatus };

            if (selectedKpi) {
                await api.kpis.update(selectedKpi.id, payload);
            } else {
                await api.kpis.create(payload);
            }
            await loadData();
            closeModal();
        } catch (error) {
            alert('Erro ao salvar KPI');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Excluir este indicador?')) return;
        try {
            await api.kpis.delete(id);
            await loadData();
        } catch (error) {
            alert('Erro ao excluir KPI');
        }
    };

    const openModal = (kpi: any = null) => {
        if (kpi) {
            setSelectedKpi(kpi);
            setFormData({
                name: kpi.name,
                value: kpi.value,
                target: kpi.target,
                unit: kpi.unit || '%',
                area: kpi.area || 'Financeiro',
                trend: kpi.trend || 0,
                status: kpi.status || 'warning'
            });
        } else {
            setSelectedKpi(null);
            setFormData({
                name: '',
                value: 0,
                target: 100,
                unit: '%',
                area: 'Financeiro',
                trend: 0,
                status: 'warning'
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedKpi(null);
    };

    const filteredKPIs = kpis.filter(k => {
        const matchesSearch = k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            k.area.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || k.status === filter;
        return matchesSearch && matchesFilter;
    });

    const formatValue = (val: number, unit: string) => {
        if (unit === 'R$') return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        return `${val}${unit}`;
    };

    if (loading) return <div className="p-8 text-center text-muted">Carregando indicadores...</div>;

    return (
        <div className="container animate-fade">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Indicadores de Desempenho</h1>
                    <p className="text-small">Monitoramento dos principais resultados</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={16} /> Novo KPI
                </button>
            </header>

            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar indicador..."
                        className="search-input"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="status-filters">
                    <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todos</button>
                    <button className={`filter-btn ${filter === 'success' ? 'active' : ''}`} onClick={() => setFilter('success')}>
                        <span className="dot success"></span> Na Meta
                    </button>
                    <button className={`filter-btn ${filter === 'warning' ? 'active' : ''}`} onClick={() => setFilter('warning')}>
                        <span className="dot warning"></span> Atenção
                    </button>
                    <button className={`filter-btn ${filter === 'danger' ? 'active' : ''}`} onClick={() => setFilter('danger')}>
                        <span className="dot danger"></span> Crítico
                    </button>
                </div>
            </div>

            {filteredKPIs.length === 0 ? (
                <div className="empty-state">
                    <Target size={48} className="text-muted" />
                    <h3>Nenhum indicador encontrado</h3>
                    <p>Tente ajustar os filtros ou crie um novo KPI.</p>
                </div>
            ) : (
                <div className="kpi-list">
                    {filteredKPIs.map(kpi => {
                        const progress = Math.min(Math.max((kpi.value / kpi.target) * 100, 0), 100);

                        return (
                            <div key={kpi.id} className="kpi-card" onClick={() => openModal(kpi)}>
                                <div className={`status-indicator ${kpi.status}`}></div>
                                <div className="kpi-content">
                                    <div className="kpi-header">
                                        <span className="kpi-area">{kpi.area}</span>
                                        <div className="flex gap-2">
                                            <span className={`badge badge-${kpi.status}`}>
                                                {kpi.status === 'success' ? 'Na Meta' : kpi.status === 'warning' ? 'Atenção' : 'Crítico'}
                                            </span>
                                            <button className="btn-icon-sm text-danger hover:bg-red-50" onClick={(e) => handleDelete(kpi.id, e)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="kpi-name">{kpi.name}</h3>

                                    <div className="kpi-metrics-row">
                                        <div className="metric-primary">
                                            {formatValue(kpi.value, kpi.unit)}
                                        </div>
                                        <div className="metric-trend">
                                            {kpi.trend > 0 ? <ArrowUpRight size={16} className="text-success" /> :
                                                kpi.trend < 0 ? <ArrowDownRight size={16} className="text-danger" /> :
                                                    <Minus size={16} className="text-muted" />}
                                            <span className={kpi.trend > 0 ? "text-success" : kpi.trend < 0 ? "text-danger" : "text-muted"}>
                                                {Math.abs(kpi.trend)}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="kpi-progress-container">
                                        <div className="flex justify-between text-xs mb-1 text-muted">
                                            <span>Progresso</span>
                                            <span>Meta: {formatValue(kpi.target, kpi.unit)}</span>
                                        </div>
                                        <div className="progress-track">
                                            <div
                                                className={`progress-fill ${kpi.status}`}
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={selectedKpi ? "Editar KPI" : "Novo KPI"}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>Salvar</button>
                    </>
                }
            >
                <form className="form-grid">
                    <div className="form-group">
                        <label>Tipo de Indicador (Dashboard)</label>
                        <select
                            className="input-field"
                            value={formData.name}
                            onChange={e => {
                                const val = e.target.value;
                                let unit = '%';
                                let area = 'Financeiro';

                                if (val === 'Faturamento') { unit = 'R$'; area = 'Financeiro'; }
                                if (val === 'Margem de Lucro') { unit = '%'; area = 'Financeiro'; }
                                if (val === 'Turnover') { unit = '%'; area = 'Pessoas'; }
                                if (val === 'Clima Organizacional') { unit = 'score'; area = 'Pessoas'; }
                                if (val === 'NPS') { unit = 'score'; area = 'Comercial'; }

                                setFormData({ ...formData, name: val, unit, area });
                            }}
                        >
                            <option value="">Outro (Personalizado)</option>
                            <option value="Faturamento">Faturamento (R$)</option>
                            <option value="Margem de Lucro">Margem de Lucro (%)</option>
                            <option value="Turnover">Turnover (%)</option>
                            <option value="Clima Organizacional">Clima Organizacional (Score)</option>
                            <option value="NPS">NPS (Score)</option>
                        </select>
                    </div>

                    {formData.name === '' || !['Faturamento', 'Margem de Lucro', 'Turnover', 'Clima Organizacional', 'NPS'].includes(formData.name) ? (
                        <div className="form-group">
                            <label>Nome Personalizado</label>
                            <input
                                type="text"
                                className="input-field"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    ) : null}

                    <div className="form-group">
                        <label>Área</label>
                        <select
                            className="input-field"
                            value={formData.area}
                            onChange={e => setFormData({ ...formData, area: e.target.value })}
                        >
                            {areas.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label>Valor Atual</label>
                            <input
                                type="number"
                                className="input-field"
                                required step="0.01"
                                value={formData.value}
                                onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Meta</label>
                            <input
                                type="number"
                                className="input-field"
                                required step="0.01"
                                value={formData.target}
                                onChange={e => setFormData({ ...formData, target: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label>Unidade</label>
                            <select
                                className="input-field"
                                value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                            >
                                <option value="%">% (Porcentagem)</option>
                                <option value="R$">R$ (Moeda)</option>
                                <option value="score">Pontuação (0-100)</option>
                                <option value="">Numérico (Unidade)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Tendência (%)</label>
                            <input
                                type="number"
                                className="input-field"
                                placeholder="Ex: 5 ou -2"
                                value={formData.trend}
                                onChange={e => setFormData({ ...formData, trend: Number(e.target.value) })}
                            />
                        </div>
                    </div>
                </form>
            </Modal>
        </div >
    );
};

export default KPIs;
