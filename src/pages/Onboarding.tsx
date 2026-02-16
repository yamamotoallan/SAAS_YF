import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Layers, Database, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import './Onboarding.css';

const Onboarding = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        companyName: '',
        industry: '',
        segments: [] as string[],
        revenue: '',
        headcount: '',
    });

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
        else navigate('/');
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const toggleSegment = (segment: string) => {
        setFormData(prev => ({
            ...prev,
            segments: prev.segments.includes(segment)
                ? prev.segments.filter(s => s !== segment)
                : [...prev.segments, segment]
        }));
    };

    return (
        <div className="onboarding-container">
            <div className="onboarding-card">
                <div className="onboarding-header">
                    <div className="step-indicator">
                        {[1, 2, 3].map(i => (
                            <div
                                key={i}
                                className={`step-dot ${step >= i ? 'active' : ''} ${step === i ? 'current' : ''}`}
                            />
                        ))}
                    </div>
                    <h2 className="text-h2">
                        {step === 1 && 'Sobre a Empresa'}
                        {step === 2 && 'Foco de Gestão'}
                        {step === 3 && 'Dados Iniciais'}
                    </h2>
                    <p className="text-small">
                        {step === 1 && 'Vamos começar configurando o perfil da sua organização.'}
                        {step === 2 && 'Quais áreas você deseja monitorar com prioridade?'}
                        {step === 3 && 'Para gerar os primeiros insights, precisamos de alguns números.'}
                    </p>
                </div>

                <div className="onboarding-content">
                    {step === 1 && (
                        <div className="step-content animate-fade">
                            <div className="form-group">
                                <label className="label">Nome da Empresa</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Ex: YF Consultoria"
                                    value={formData.companyName}
                                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Setor de Atuação</label>
                                <select
                                    className="input"
                                    value={formData.industry}
                                    onChange={e => setFormData({ ...formData, industry: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="tech">Tecnologia / SaaS</option>
                                    <option value="retail">Varejo</option>
                                    <option value="consulting">Consultoria / Serviços</option>
                                    <option value="industry">Indústria</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="step-content animate-fade">
                            <div className="segments-grid">
                                {[
                                    { id: 'strategy', label: 'Estratégia e Metas', icon: Layers },
                                    { id: 'finance', label: 'Gestão Financeira', icon: Database },
                                    { id: 'people', label: 'Pessoas e Cultura', icon: Building2 },
                                ].map(segment => (
                                    <div
                                        key={segment.id}
                                        className={`segment-card ${formData.segments.includes(segment.id) ? 'selected' : ''}`}
                                        onClick={() => toggleSegment(segment.id)}
                                    >
                                        <segment.icon size={24} className="segment-icon" />
                                        <span className="segment-label">{segment.label}</span>
                                        <div className="segment-check">
                                            <CheckCircle size={16} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="step-content animate-fade">
                            <div className="form-group">
                                <label className="label">Faturamento Mensal Estimado (R$)</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="0,00"
                                    value={formData.revenue}
                                    onChange={e => setFormData({ ...formData, revenue: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Total de Colaboradores (Headcount)</label>
                                <input
                                    type="number"
                                    className="input"
                                    placeholder="0"
                                    value={formData.headcount}
                                    onChange={e => setFormData({ ...formData, headcount: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="onboarding-footer">
                    <button
                        className="btn btn-secondary"
                        onClick={handleBack}
                        disabled={step === 1}
                        style={{ opacity: step === 1 ? 0 : 1 }}
                    >
                        <ArrowLeft size={16} /> Voltar
                    </button>

                    <button className="btn btn-primary" onClick={handleNext}>
                        {step === 3 ? 'Finalizar' : 'Continuar'} <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
