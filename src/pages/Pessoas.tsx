import { useState, useEffect } from 'react';
import {
    Users,
    UserMinus,
    UserPlus,
    Heart,
    Search,
    Plus,
    Edit2,
    Trash2,
    Mail,
    Download
} from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal/Modal';
import { downloadCSV } from '../utils/csvUtils';
import './Pessoas.css';

const Pessoas = () => {
    // Data State
    const [people, setPeople] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>({
        headcount: 0,
        hired: 0,
        turnover: 0,
        enps: 0
    });

    // UI State
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPerson, setSelectedPerson] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        department: 'Operações',
        email: '',
        phone: '',
        salary: 0,
        admissionDate: new Date().toISOString().split('T')[0],
        status: 'active'
    });

    const departments = ['Comercial', 'Tecnologia', 'Operações', 'Financeiro', 'RH', 'Diretoria'];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [peopleData, summaryData] = await Promise.all([
                api.people.list(),
                api.people.summary()
            ]);
            setPeople(peopleData);
            setSummary(summaryData);
        } catch (error) {
            console.error('Failed to load people data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (selectedPerson) {
                await api.people.update(selectedPerson.id, formData);
            } else {
                await api.people.create(formData);
            }
            await loadData();
            closeModal();
        } catch (error) {
            alert('Erro ao salvar colaborador');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este colaborador?')) return;
        try {
            await api.people.delete(id);
            await loadData();
        } catch (error) {
            alert('Erro ao excluir');
        }
    };

    const openModal = (person: any = null) => {
        if (person) {
            setSelectedPerson(person);
            setFormData({
                name: person.name,
                role: person.role,
                department: person.department,
                email: person.email || '',
                phone: person.phone || '',
                salary: person.salary || 0,
                admissionDate: person.admissionDate ? person.admissionDate.split('T')[0] : new Date().toISOString().split('T')[0],
                status: person.status || 'active'
            });
        } else {
            setSelectedPerson(null);
            setFormData({
                name: '',
                role: '',
                department: 'Operações',
                email: '',
                phone: '',
                salary: 0,
                admissionDate: new Date().toISOString().split('T')[0],
                status: 'active'
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedPerson(null);
    };

    const filteredPeople = people.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exportCSV = () => {
        downloadCSV(
            filteredPeople,
            [
                { key: 'name', label: 'Nome' },
                { key: 'role', label: 'Cargo' },
                { key: 'department', label: 'Departamento' },
                { key: 'status', label: 'Status', format: v => v === 'active' ? 'Ativo' : v === 'vacation' ? 'Férias' : 'Inativo' },
                { key: 'hireDate', label: 'Data de Admissão', format: v => v ? new Date(v).toLocaleDateString('pt-BR') : '' },
                { key: 'salary', label: 'Salário (R$)', format: v => v ? Number(v).toFixed(2).replace('.', ',') : '—' },
                { key: 'email', label: 'Email' },
            ],
            'equipe'
        );
    };

    if (loading) return <div className="p-8 text-center">Carregando equipe...</div>;

    return (
        <div className="container animate-fade">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Pessoas & Cultura</h1>
                    <p className="text-small">Gestão de talentos e clima organizacional</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={exportCSV} title="Exportar colaboradores como CSV">
                        <Download size={16} /> Exportar
                    </button>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={16} /> Adicionar Colaborador
                    </button>
                </div>
            </header>

            {/* Metrics Row */}
            <div className="people-metrics-grid">
                <div className="people-card">
                    <div className="people-icon-wrapper blue">
                        <Users size={24} />
                    </div>
                    <div>
                        <div className="people-metric-value">{summary.headcount || people.length}</div>
                        <div className="people-metric-label">Headcount Atual</div>
                    </div>
                </div>
                <div className="people-card">
                    <div className="people-icon-wrapper green">
                        <UserPlus size={24} />
                    </div>
                    <div>
                        <div className="people-metric-value text-success">{summary.hired || 0}</div>
                        <div className="people-metric-label">Contratações (Mês)</div>
                    </div>
                </div>
                <div className="people-card">
                    <div className="people-icon-wrapper red">
                        <UserMinus size={24} />
                    </div>
                    <div>
                        <div className="people-metric-value text-danger">{summary.turnover || 0}%</div>
                        <div className="people-metric-label">Turnover Trimestral</div>
                    </div>
                </div>
                <div className="people-card">
                    <div className="people-icon-wrapper yellow">
                        <Heart size={24} />
                    </div>
                    <div>
                        <div className="people-metric-value text-warning">{summary.enps || 'N/A'}</div>
                        <div className="people-metric-label">Clima / eNPS</div>
                    </div>
                </div>
            </div>

            <div className="content-split">
                {/* Employee List */}
                <div className="card full-height">
                    <div className="card-header">
                        <h3 className="text-h3">Colaboradores</h3>
                        <div className="search-bar compact">
                            <Search size={14} className="text-muted" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="teams-list">
                        {filteredPeople.length === 0 ? (
                            <div className="p-4 text-center text-muted">Nenhum colaborador encontrado.</div>
                        ) : filteredPeople.map(person => (
                            <div key={person.id} className="team-item">
                                <div className="team-info">
                                    <div className="team-name">{person.name}</div>
                                    <div className="team-meta">
                                        {person.role} • {person.department}
                                    </div>
                                    <div className="team-meta flex gap-2 mt-1">
                                        {person.email && <span className="flex items-center gap-1"><Mail size={10} /> {person.email}</span>}
                                    </div>
                                </div>
                                <div className={`status-badge ${person.status === 'active' ? 'success' : 'neutral'}`}>
                                    {person.status === 'active' ? 'Ativo' : 'Inativo'}
                                </div>
                                <div className="flex gap-1 ml-2">
                                    <button className="btn-icon-sm" onClick={() => openModal(person)}><Edit2 size={14} /></button>
                                    <button className="btn-icon-sm text-danger" onClick={() => handleDelete(person.id)}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Climate / Mood (Placeholder for now, focused on CRUD) */}
                <div className="card full-height">
                    <div className="card-header">
                        <h3 className="text-h3">Clima Organizacional</h3>
                        <button className="btn-link">Ver pesquisa completa</button>
                    </div>
                    <div className="climate-breakdown">
                        <div className="climate-score">
                            <span className="big-score">4.2</span>
                            <span className="scole-scale">/ 5.0</span>
                        </div>
                        <div className="climate-bars">
                            {[
                                { label: 'Liderança', val: 90 },
                                { label: 'Ambiente', val: 85 },
                                { label: 'Salário/Benefícios', val: 65, color: 'var(--color-warning)' },
                                { label: 'Comunicação', val: 75 },
                            ].map((item, i) => (
                                <div key={i} className="climate-bar-row">
                                    <span className="cb-label">{item.label}</span>
                                    <div className="cb-track">
                                        <div
                                            className="cb-fill"
                                            style={{ width: `${item.val}%`, backgroundColor: item.color || 'var(--color-success)' }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={selectedPerson ? "Editar Colaborador" : "Adicionar Colaborador"}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>Salvar</button>
                    </>
                }
            >
                <form className="form-grid">
                    <div className="form-group">
                        <label>Nome Completo</label>
                        <input
                            type="text"
                            className="input-field"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Cargo</label>
                        <input
                            type="text"
                            className="input-field"
                            required
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Departamento</label>
                        <select
                            className="input-field"
                            value={formData.department}
                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                        >
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Email Corporativo</label>
                        <input
                            type="email"
                            className="input-field"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Salário (R$)</label>
                        <input
                            type="number"
                            className="input-field"
                            value={formData.salary}
                            onChange={e => setFormData({ ...formData, salary: Number(e.target.value) })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Data de Admissão</label>
                        <input
                            type="date"
                            className="input-field"
                            value={formData.admissionDate}
                            onChange={e => setFormData({ ...formData, admissionDate: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <select
                            className="input-field"
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="active">Ativo</option>
                            <option value="inactive">Inativo (Desligado)</option>
                            <option value="vacation">Férias</option>
                        </select>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Pessoas;
