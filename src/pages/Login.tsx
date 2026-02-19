import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken, setUser } from '../services/api';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { token, user } = await api.auth.login(email, password);
            setToken(token);
            setUser(user);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Falha no login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-brand-panel">
                <div className="brand-content">
                    <h1 className="brand-title">YF Consultoria</h1>
                    <p className="brand-subtitle">
                        Sistema de Suporte à Decisão Executiva
                    </p>
                    <div className="brand-features">
                        <div className="feature-item">
                            <span className="feature-dot"></span>
                            Gestão Estratégica
                        </div>
                        <div className="feature-item">
                            <span className="feature-dot"></span>
                            Inteligência Financeira
                        </div>
                        <div className="feature-item">
                            <span className="feature-dot"></span>
                            Gestão de Pessoas
                        </div>
                    </div>
                </div>
            </div>

            <div className="login-form-panel">
                <div className="form-wrapper">
                    <div className="form-header">
                        <h2 className="text-h2">Bem-vindo</h2>
                        <p className="text-small">Acesse sua conta para continuar</p>
                    </div>

                    <form onSubmit={handleLogin} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email" className="label">E-mail corporativo</label>
                            <input
                                type="email"
                                id="email"
                                className="input"
                                placeholder="seunome@empresa.com.br"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="label">Senha</label>
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

                        <div className="form-actions">
                            <a href="#" className="forgot-password">Esqueceu a senha?</a>
                        </div>

                        {error && (
                            <div className="alert-error" style={{
                                background: '#fee2e2',
                                color: '#dc2626',
                                padding: '0.75rem',
                                borderRadius: '0.375rem',
                                marginBottom: '1rem',
                                fontSize: '0.875rem'
                            }}>
                                {error}
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? 'Entrando...' : 'Entrar no Sistema'}
                        </button>
                    </form>

                    <div className="form-footer">
                        <p className="text-small">
                            Ainda não tem acesso? <a href="#" className="link">Entre em contato</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
