import { useState, useEffect } from 'react';
import {
    Search,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Plus,
    Trash2,
    Target,
    AlertTriangle,
    Download
} from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal/Modal';
import ConfirmDialog from '../components/Modal/ConfirmDialog';
import LoadingSkeleton from '../components/Layout/LoadingSkeleton';
import { useToast } from '../components/Layout/ToastContext';
import { downloadCSV } from '../utils/csvUtils';
import './KPIs.css';

// ── SVG Gauge Ring ─────────────────────────────────────────────────────────────
const GaugeRing = ({ progress, status }: { progress: number; status: string }) => {
    const R = 44; const cx = 56; const cy = 56;
    const startAngle = -210; const endAngle = 30; // 240° sweep
    const sweepDeg = endAngle - startAngle;
    const filled = Math.min(Math.max(progress, 0), 100) / 100 * sweepDeg;

    const toXY = (deg: number) => {
        const rad = (deg * Math.PI) / 180;
        return { x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad) };
    };

    const largeArc = (deg: number) => (deg > 180 ? 1 : 0);
    const s = toXY(startAngle);
    const eTrack = toXY(endAngle);
    const eFill = toXY(startAngle + filled);

    const trackD = `M ${s.x} ${s.y} A ${R} ${R} 0 ${largeArc(sweepDeg)} 1 ${eTrack.x} ${eTrack.y}`;
    const fillD = filled > 0
        ? `M ${s.x} ${s.y} A ${R} ${R} 0 ${largeArc(filled)} 1 ${eFill.x} ${eFill.y}`
        : '';

    const strokeColor = status === 'success' ? '#16a34a' : status === 'warning' ? '#d97706' : '#dc2626';

    return (
        <svg viewBox="0 0 112 112" className="gauge-svg">
            {/* Track */}
            <path d={trackD} fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
            {/* Fill */}
            {fillD && (
                <path d={fillD} fill="none" stroke={strokeColor} strokeWidth="10" strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 4px ${strokeColor}44)` }}
                />
            )}
            {/* Center text */}
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize="18" fontWeight="700"
                fill={strokeColor} fontFamily="inherit">
                {Math.round(progress)}%
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="inherit">
                da meta
            </text>
        </svg>
    );
};

// ── Mini Sparkline (5 simulated bars from trend) ───────────────────────────────
const Sparkline = ({ currentProgress, trend }: { currentProgress: number; trend: number }) => {
    // Simulate 5 past values regressing from today by trend%
    const bars = [4, 3, 2, 1, 0].map(i => {
        const v = Math.min(Math.max(currentProgress - trend * i * 0.6, 0), 140);
        return v;
    });
    const max = Math.max(...bars, 1);

    return (
        <div className="sparkline">
            {bars.map((v, i) => (
                <div
                    key={i}
                    className={`spark-bar ${i === 4 ? 'current' : ''}`}
                    style={{ height: `${Math.round((v / max) * 100)}%` }}
                    title={`${Math.round(v)}%`}
                />
            ))}
        </div>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const KPIs = ({ isWrapper = false }: { isWrapper?: boolean }) => {
    const { toast } = useToast();
    const [kpis, setKpis] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedKpi, setSelectedKpi] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, event?: React.MouseEvent } | null>(null);

    const [formData, setFormData] = useState({
        name: '', value: 0, target: 0, unit: '%',
        area: 'Financeiro', trend: 0, status: 'warning'
    });

    const areas = ['Financeiro', 'Comercial', 'Operações', 'Pessoas', 'Marketing', 'Tecnologia'];

    useEffect(() => { loadData(); }, []);

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
            const ratio = formData.target > 0 ? (formData.value / formData.target) : 0;
            let computedStatus = 'danger';
            if (ratio >= 1) computedStatus = 'success';
            else if (ratio >= 0.8) computedStatus = 'warning';
            const payload = { ...formData, status: computedStatus } as any;
            if (selectedKpi) {
                await api.kpis.update(selectedKpi.id, payload);
            } else {
                await api.kpis.create(payload);
            }
            await loadData();
            closeModal();
            toast(selectedKpi ? 'KPI atualizado!' : 'KPI criado!', 'success');
        } catch (error) {
            toast('Erro ao salvar KPI', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try { await api.kpis.delete(deleteTarget.id); await loadData(); toast('KPI excluído', 'success'); }
        catch { toast('Erro ao excluir KPI', 'error'); }
        finally { setDeleteTarget(null); }
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteTarget({ id, event: e });
    };

    const exportCSV = () => {
        downloadCSV(
            kpis,
            [
                { key: 'name', label: 'Indicador' },
                { key: 'area', label: 'Área' },
                { key: 'value', label: 'Valor Atual' },
                { key: 'target', label: 'Meta' },
                { key: 'unit', label: 'Unidade' },
                { key: 'status', label: 'Status' },
                { key: 'trend', label: 'Tendência (%)' },
            ],
            'kpis'
        );
    };

    const openModal = (kpi: any = null) => {
        if (kpi) {
            setSelectedKpi(kpi);
            setFormData({
                name: kpi.name, value: kpi.value, target: kpi.target,
                unit: kpi.unit || '%', area: kpi.area || 'Financeiro',
                trend: kpi.trend || 0, status: kpi.status || 'warning'
            });
        } else {
            setSelectedKpi(null);
            setFormData({ name: '', value: 0, target: 100, unit: '%', area: 'Financeiro', trend: 0, status: 'warning' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setSelectedKpi(null); };

    const filteredKPIs = kpis.filter(k => {
        const matchesSearch = k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (k.area || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || k.status === filter;
        return matchesSearch && matchesFilter;
    });

    const formatValue = (val: number, unit: string) => {
        if (unit === 'R$') return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' });
        return `${val}${unit}`;
    };

    // Summary counts for header strip
    const countStatus = (s: string) => kpis.filter(k => k.status === s).length;
    const critical = kpis.filter(k => { const p = k.target > 0 ? (k.value / k.target) * 100 : 0; return p < 70; });

    if (loading) return <div className="container animate-fade"><LoadingSkeleton type="card" rows={4} /></div>;

    return (
        <div className={`container animate-fade kpi-container ${isWrapper ? 'is-wrapper pt-0' : ''}`}>
            {!isWrapper && (
                <header className="page-header">
                    <div>
                        <h1 className="text-h2">Indicadores de Desempenho</h1>
                        <p className="text-small">Monitoramento dos principais resultados</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-secondary" onClick={exportCSV}>
                            <Download size={16} /> Exportar
                        </button>
                        <button className="btn btn-primary" onClick={() => openModal()}>
                            <Plus size={16} /> Novo KPI
                        </button>
                    </div>
                </header>
            )}

            {/* ── Summary Strip ── */}
            {kpis.length > 0 && (
                <div className="kpi-summary-strip">
                    <div className="summary-chip success">
                        <span className="chip-dot success" />
                        <span>{countStatus('success')} na meta</span>
                    </div>
                    <div className="summary-chip warning">
                        <span className="chip-dot warning" />
                        <span>{countStatus('warning')} atenção</span>
                    </div>
                    <div className="summary-chip danger">
                        <span className="chip-dot danger" />
                        <span>{countStatus('danger')} crítico</span>
                    </div>
                    {critical.length > 0 && (
                        <div className="summary-chip alert">
                            <AlertTriangle size={13} />
                            <span>{critical.length} abaixo de 70% da meta</span>
                        </div>
                    )}
                </div>
            )}

            {/* ── Filters Bar ── */}
            <div className="filters-bar flex justify-between">
                <div className="flex gap-4">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input type="text" placeholder="Buscar indicador..." className="search-input"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="status-filters">
                        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todos</button>
                        <button className={`filter-btn ${filter === 'success' ? 'active' : ''}`} onClick={() => setFilter('success')}>
                            <span className="dot success" /> Na Meta
                        </button>
                        <button className={`filter-btn ${filter === 'warning' ? 'active' : ''}`} onClick={() => setFilter('warning')}>
                            <span className="dot warning" /> Atenção
                        </button>
                        <button className={`filter-btn ${filter === 'danger' ? 'active' : ''}`} onClick={() => setFilter('danger')}>
                            <span className="dot danger" /> Crítico
                        </button>
                    </div>
                </div>
                {isWrapper && (
                    <div className="flex gap-2">
                        <button className="btn btn-secondary" onClick={exportCSV}>
                            <Download size={16} /> Exportar
                        </button>
                        <button className="btn btn-primary" onClick={() => openModal()}>
                            <Plus size={16} /> Novo KPI
                        </button>
                    </div>
                )}
            </div>

            {filteredKPIs.length === 0 ? (
                <div className="empty-state">
                    <Target size={48} className="text-muted" />
                    <h3>Nenhum indicador encontrado</h3>
                    <p>Tente ajustar os filtros ou crie um novo KPI.</p>
                </div>
            ) : (
                <div className="kpi-grid">
                    {filteredKPIs.map(kpi => {
                        const progress = kpi.target > 0 ? Math.min(Math.max((kpi.value / kpi.target) * 100, 0), 999) : 0;
                        const displayProgress = Math.min(progress, 100);
                        const isCritical = progress < 70;

                        return (
                            <div key={kpi.id} className={`kpi-card-v2 ${kpi.status}`} onClick={() => openModal(kpi)}>
                                {/* Top row: area + badges */}
                                <div className="kpi-card-header">
                                    <span className="kpi-area-chip">{kpi.area || 'Geral'}</span>
                                    <div className="flex gap-1 items-center">
                                        {isCritical && (
                                            <span className="alert-chip" title="Abaixo de 70% da meta">
                                                <AlertTriangle size={11} />
                                            </span>
                                        )}
                                        <button className="btn-icon-sm text-danger" onClick={(e) => handleDeleteClick(kpi.id, e)}>
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>

                                {/* KPI name */}
                                <h3 className="kpi-card-name">{kpi.name}</h3>

                                {/* Gauge + Sparkline row */}
                                <div className="kpi-visual-row">
                                    <div className="gauge-wrapper">
                                        <GaugeRing progress={displayProgress} status={kpi.status} />
                                    </div>
                                    <div className="kpi-right-col">
                                        {/* Value vs target */}
                                        <div className="kpi-value-block">
                                            <span className="kpi-value-main">{formatValue(kpi.value, kpi.unit)}</span>
                                            <span className="kpi-target-label">meta: {formatValue(kpi.target, kpi.unit)}</span>
                                        </div>
                                        {/* Trend */}
                                        <div className={`kpi-trend ${kpi.trend > 0 ? 'up' : kpi.trend < 0 ? 'down' : 'flat'}`}>
                                            {kpi.trend > 0 ? <ArrowUpRight size={13} /> : kpi.trend < 0 ? <ArrowDownRight size={13} /> : <Minus size={13} />}
                                            <span>{Math.abs(kpi.trend)}% vs mês ant.</span>
                                        </div>
                                        {/* Sparkline */}
                                        <Sparkline currentProgress={displayProgress} trend={kpi.trend || 0} />
                                    </div>
                                </div>

                                {/* Status pill */}
                                <div className={`kpi-status-pill ${kpi.status}`}>
                                    {kpi.status === 'success' ? '✓ Na Meta' : kpi.status === 'warning' ? '⚠ Atenção' : '✕ Crítico'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Modal ── */}
            <Modal isOpen={isModalOpen} onClose={closeModal}
                title={selectedKpi ? 'Editar KPI' : 'Novo KPI'}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>Salvar</button>
                    </>
                }
            >
                <form className="form-grid">
                    <div className="form-group">
                        <label>Tipo de Indicador</label>
                        <select className="input-field" value={formData.name}
                            onChange={e => {
                                const val = e.target.value;
                                let unit = '%'; let area = 'Financeiro';
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

                    {(!formData.name || !['Faturamento', 'Margem de Lucro', 'Turnover', 'Clima Organizacional', 'NPS'].includes(formData.name)) && (
                        <div className="form-group">
                            <label>Nome Personalizado</label>
                            <input type="text" className="input-field" required value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Área</label>
                        <select className="input-field" value={formData.area}
                            onChange={e => setFormData({ ...formData, area: e.target.value })}>
                            {areas.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label>Valor Atual</label>
                            <input type="number" className="input-field" required step="0.01"
                                value={formData.value} onChange={e => setFormData({ ...formData, value: Number(e.target.value) })} />
                        </div>
                        <div className="form-group">
                            <label>Meta</label>
                            <input type="number" className="input-field" required step="0.01"
                                value={formData.target} onChange={e => setFormData({ ...formData, target: Number(e.target.value) })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label>Unidade</label>
                            <select className="input-field" value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                                <option value="%">% (Porcentagem)</option>
                                <option value="R$">R$ (Moeda)</option>
                                <option value="score">Pontuação (0-100)</option>
                                <option value="">Numérico (Unidade)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Tendência (%)</label>
                            <input type="number" className="input-field" placeholder="Ex: 5 ou -2"
                                value={formData.trend} onChange={e => setFormData({ ...formData, trend: Number(e.target.value) })} />
                        </div>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteTarget}
                title="Excluir KPI"
                message="Tem certeza que deseja excluir este indicador? Os dados históricos serão perdidos."
                confirmLabel="Excluir"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

export default KPIs;
