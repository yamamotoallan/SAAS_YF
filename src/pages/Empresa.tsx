import { useState, useEffect } from 'react';
import {
    Building2,
    Users,
    Save,
    Plus,
    Trash2
} from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal/Modal';
import './Empresa.css';

const Empresa = () => {
    // Data State
    const [company, setCompany] = useState<any>({
        name: '',
        document: '',
        sector: '',
        size: ''
    });
    const [users, setUsers] = useState<any[]>([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'users'>('details');
    const [submitting, setSubmitting] = useState(false);

    // User Modal State
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userForm, setUserForm] = useState({
        name: '',
        email: '',
        role: 'user', // user or admin
        password: '' // Only for new users
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [companyData, usersData] = await Promise.all([
                api.company.get(),
                api.company.users()
            ]);
            setCompany(companyData);
            setUsers(usersData);
        } catch (error) {
            console.error('Failed to load company data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.company.update(company);
            alert('Dados da empresa atualizados!');
        } catch (error) {
            alert('Erro ao salvar dados');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.auth.register({
                ...userForm,
                companyId: company.id // In a real app, this would be handled by the invite flow
            });
            await loadData();
            setIsUserModalOpen(false);
            setUserForm({ name: '', email: '', role: 'user', password: '' });
            alert('Usuário convidado com sucesso!');
        } catch (error) {
            alert('Erro ao adicionar usuário: ' + (error as any).message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted">Carregando perfil da empresa...</div>;

    return (
        <div className="container animate-fade">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Minha Empresa</h1>
                    <p className="text-small">Gerencie dados corporativos e acesso de equipe</p>
                </div>
            </header>

            <div className="tabs mb-6">
                <button
                    className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                    onClick={() => setActiveTab('details')}
                >
                    <Building2 size={16} /> Detalhes
                </button>
                <button
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <Users size={16} /> Usuários
                </button>
            </div>

            {activeTab === 'details' ? (
                <div className="card max-w-2xl">
                    <form onSubmit={handleSaveDetails}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Nome da Empresa</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={company.name}
                                    onChange={e => setCompany({ ...company, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>CNPJ / Documento</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={company.document || ''}
                                    onChange={e => setCompany({ ...company, document: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label>Setor</label>
                                    <select
                                        className="input-field"
                                        value={company.sector || ''}
                                        onChange={e => setCompany({ ...company, sector: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Serviços">Serviços</option>
                                        <option value="Varejo">Varejo</option>
                                        <option value="Tecnologia">Tecnologia</option>
                                        <option value="Indústria">Indústria</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Tamanho</label>
                                    <select
                                        className="input-field"
                                        value={company.size || ''}
                                        onChange={e => setCompany({ ...company, size: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="1-10">1-10 funcionários</option>
                                        <option value="11-50">11-50 funcionários</option>
                                        <option value="51-200">51-200 funcionários</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    <Save size={16} /> Salvar Alterações
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="card">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-h3">Usuários com Acesso</h3>
                        <button className="btn btn-primary" onClick={() => setIsUserModalOpen(true)}>
                            <Plus size={16} /> Convidar Usuário
                        </button>
                    </div>

                    <div className="table-responsive">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b text-muted text-sm">
                                    <th className="p-3">Nome</th>
                                    <th className="p-3">Email</th>
                                    <th className="p-3">Função</th>
                                    <th className="p-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-medium">{user.name}</td>
                                        <td className="p-3 text-muted">{user.email}</td>
                                        <td className="p-3">
                                            <span className={`badge badge-${user.role === 'admin' ? 'primary' : 'neutral'}`}>
                                                {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <button className="btn-icon-sm text-danger" title="Remover acesso">
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                title="Convidar Novo Usuário"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setIsUserModalOpen(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleCreateUser} disabled={submitting}>Enviar Convite</button>
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
                            value={userForm.name}
                            onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email Corporativo</label>
                        <input
                            type="email"
                            className="input-field"
                            required
                            value={userForm.email}
                            onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Função</label>
                        <select
                            className="input-field"
                            value={userForm.role}
                            onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                        >
                            <option value="user">Usuário (Visualização/Edição limitada)</option>
                            <option value="admin">Administrador (Acesso total)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Senha Temporária</label>
                        <input
                            type="password"
                            className="input-field"
                            required
                            value={userForm.password}
                            onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Empresa;
