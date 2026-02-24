import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import './Login.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const res = await api.auth.forgotPassword(email);
            setMessage(res.message);
        } catch (err: any) {
            setError(err.message || 'Erro ao processar solicitação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-brand-panel">
                <div className="brand-content">
                    <h1 className="brand-title">YF Consultoria</h1>
                    <p className="brand-subtitle">Recuperação de Acesso</p>
                </div>
            </div>

            <div className="login-form-panel">
                <div className="form-wrapper">
                    <div className="form-header">
                        <h2 className="text-h2">Redefinir Senha</h2>
                        <p className="text-small">Insira seu e-mail para receber as instruções</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
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

                        {error && <div className="alert-error p-3 mb-4 rounded bg-red-100 text-red-600 text-sm">{error}</div>}
                        {message && <div className="alert-success p-3 mb-4 rounded bg-green-100 text-green-600 text-sm">{message}</div>}

                        <button type="submit" className="btn btn-primary btn-block" disabled={loading || !!message}>
                            {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                        </button>
                    </form>

                    <div className="form-footer">
                        <p className="text-small">
                            Lembrou a senha? <Link to="/login" className="link">Voltar para Login</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
