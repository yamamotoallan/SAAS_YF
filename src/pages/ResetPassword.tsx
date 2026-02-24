import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import './Login.css';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Link de recuperação inválido ou ausente.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);

        try {
            await api.auth.resetPassword({ token, password });
            setMessage('Senha alterada com sucesso! Redirecionando para o login...');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Erro ao redefinir senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-brand-panel">
                <div className="brand-content">
                    <h1 className="brand-title">YF Consultoria</h1>
                    <p className="brand-subtitle">Definir Nova Senha</p>
                </div>
            </div>

            <div className="login-form-panel">
                <div className="form-wrapper">
                    <div className="form-header">
                        <h2 className="text-h2">Nova Senha</h2>
                        <p className="text-small">Crie uma senha forte para sua conta</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="password" className="label">Nova Senha</label>
                            <input
                                type="password"
                                id="password"
                                className="input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="label">Confirmar Senha</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                className="input"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && <div className="alert-error p-3 mb-4 rounded bg-red-100 text-red-600 text-sm">{error}</div>}
                        {message && <div className="alert-success p-3 mb-4 rounded bg-green-100 text-green-600 text-sm">{message}</div>}

                        <button type="submit" className="btn btn-primary btn-block" disabled={loading || !!message || !token}>
                            {loading ? 'Redefinindo...' : 'Alterar Senha'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
