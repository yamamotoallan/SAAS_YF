import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate login
        navigate('/');
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

                        <button type="submit" className="btn btn-primary btn-block">
                            Entrar no Sistema
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
