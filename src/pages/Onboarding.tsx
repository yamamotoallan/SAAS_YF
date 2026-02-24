import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2, Users, Layers, Target,
    CheckCircle, ArrowRight, ArrowLeft,
    Sparkles, SkipForward, Loader2
} from 'lucide-react';
import { api } from '../services/api';
import './Onboarding.css';

// ── Step metadata ─────────────────────────────────────────────────────────────
const STEPS = [
    { id: 1, icon: Building2, label: 'Empresa', desc: 'Perfil da organização' },
    { id: 2, icon: Users, label: 'Colaborador', desc: 'Primeiro membro da equipe' },
    { id: 3, icon: Layers, label: 'Fluxo', desc: 'Primeiro processo CRM' },
    { id: 4, icon: Target, label: 'Meta', desc: 'Primeiro OKR da empresa' },
];

const SECTORS = [
    'Tecnologia / SaaS', 'Varejo', 'Consultoria / Serviços',
    'Indústria', 'Saúde', 'Educação', 'Construção', 'Logística',
];

// ── Toast helper ──────────────────────────────────────────────────────────────
const Toast = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => (
    <div className={`ob-toast ob-toast--${type}`}>
        {type === 'success' ? <CheckCircle size={16} /> : '⚠'} {msg}
    </div>
);

const Onboarding = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [done, setDone] = useState(false);

    // ── Form state per step ───────────────────────────────────────────────────
    const [empresa, setEmpresa] = useState({
        name: '', sector: '', size: 'pequena', headcount: '',
    });
    const [colab, setColab] = useState({
        name: '', email: '', role: '', department: '',
    });
    const [fluxo, setFluxo] = useState({
        name: 'Pipeline de Vendas', description: '',
    });
    const [meta, setMeta] = useState({
        title: '', description: '', type: 'company', period: 'Q2 2025',
    });

    // ── Helpers ───────────────────────────────────────────────────────────────
    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const totalSteps = STEPS.length;
    const progress = ((step - 1) / totalSteps) * 100;

    // ── Step submit logic ─────────────────────────────────────────────────────
    const handleNext = async () => {
        setLoading(true);
        try {
            if (step === 1) {
                await api.company.update({
                    name: empresa.name,
                    sector: empresa.sector,
                    settings: { size: empresa.size },
                    financialTargets: { headcount: Number(empresa.headcount) || 0 },
                } as any);
                showToast('Empresa configurada!');
            } else if (step === 2) {
                await api.people.create({
                    name: colab.name,
                    email: colab.email,
                    role: colab.role,
                    department: colab.department,
                    status: 'active',
                } as any);
                showToast('Colaborador adicionado!');
            } else if (step === 3) {
                await api.flows.create({
                    name: fluxo.name,
                    description: fluxo.description,
                } as any);
                showToast('Fluxo criado!');
            } else if (step === 4) {
                await api.goals.create({
                    title: meta.title,
                    description: meta.description,
                    type: meta.type,
                    period: meta.period,
                    status: 'active',
                } as any);
                setDone(true);
                setTimeout(() => navigate('/'), 2200);
                return;
            }
            setStep(s => s + 1);
        } catch (err: any) {
            showToast(err.message || 'Erro ao salvar. Tente novamente.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        if (step < totalSteps) setStep(s => s + 1);
        else {
            setDone(true);
            setTimeout(() => navigate('/'), 1800);
        }
    };

    // ── Done screen ───────────────────────────────────────────────────────────
    if (done) {
        return (
            <div className="onboarding-container">
                <div className="onboarding-done">
                    <div className="done-ring">
                        <Sparkles size={40} className="done-star" />
                    </div>
                    <h2 className="text-h2 mt-6">Tudo pronto! 🎉</h2>
                    <p className="text-muted mt-2">Redirecionando para o Dashboard…</p>
                    <div className="done-bar"><div className="done-bar-fill" /></div>
                </div>
            </div>
        );
    }

    const currentStep = STEPS[step - 1];
    const StepIcon = currentStep.icon;

    const canProceed =
        step === 1 ? empresa.name.trim() !== '' :
            step === 2 ? colab.name.trim() !== '' && colab.email.trim() !== '' :
                step === 3 ? fluxo.name.trim() !== '' :
                    step === 4 ? meta.title.trim() !== '' : true;

    return (
        <div className="onboarding-container">
            {toast && <Toast msg={toast.msg} type={toast.type} />}

            <div className="onboarding-card">
                {/* ── Progress bar ─────────────────────────────────────── */}
                <div className="ob-progress-track">
                    <div className="ob-progress-fill" style={{ width: `${progress}%` }} />
                </div>

                {/* ── Step pills ───────────────────────────────────────── */}
                <div className="ob-steps-nav">
                    {STEPS.map(s => {
                        const Icon = s.icon;
                        const state = step > s.id ? 'done' : step === s.id ? 'active' : 'idle';
                        return (
                            <div key={s.id} className={`ob-step-pill ob-step-pill--${state}`}>
                                {state === 'done'
                                    ? <CheckCircle size={14} />
                                    : <Icon size={14} />
                                }
                                <span>{s.label}</span>
                            </div>
                        );
                    })}
                </div>

                {/* ── Header ───────────────────────────────────────────── */}
                <div className="onboarding-header">
                    <div className="ob-step-icon-wrap">
                        <StepIcon size={28} />
                    </div>
                    <h2 className="text-h2">{currentStep.label}</h2>
                    <p className="text-small">{currentStep.desc}</p>
                </div>

                {/* ── Content ──────────────────────────────────────────── */}
                <div className="onboarding-content" key={step}>

                    {/* Step 1 — Empresa */}
                    {step === 1 && (
                        <div className="step-content animate-fade">
                            <div className="ob-grid-2">
                                <div className="form-group">
                                    <label className="label">Nome da Empresa *</label>
                                    <input
                                        type="text" className="input"
                                        placeholder="Ex: YF Consultoria"
                                        value={empresa.name}
                                        onChange={e => setEmpresa({ ...empresa, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="label">Setor</label>
                                    <select className="input" value={empresa.sector}
                                        onChange={e => setEmpresa({ ...empresa, sector: e.target.value })}>
                                        <option value="">Selecione…</option>
                                        {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="label">Porte</label>
                                    <select className="input" value={empresa.size}
                                        onChange={e => setEmpresa({ ...empresa, size: e.target.value })}>
                                        <option value="micro">Micro (&lt;10)</option>
                                        <option value="pequena">Pequena (10-49)</option>
                                        <option value="media">Média (50-249)</option>
                                        <option value="grande">Grande (250+)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="label">Headcount atual</label>
                                    <input
                                        type="number" className="input" placeholder="0"
                                        value={empresa.headcount}
                                        onChange={e => setEmpresa({ ...empresa, headcount: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2 — Colaborador */}
                    {step === 2 && (
                        <div className="step-content animate-fade">
                            <div className="ob-grid-2">
                                <div className="form-group">
                                    <label className="label">Nome completo *</label>
                                    <input
                                        type="text" className="input" placeholder="João Silva"
                                        value={colab.name}
                                        onChange={e => setColab({ ...colab, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="label">E-mail *</label>
                                    <input
                                        type="email" className="input" placeholder="joao@empresa.com"
                                        value={colab.email}
                                        onChange={e => setColab({ ...colab, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="label">Cargo</label>
                                    <input
                                        type="text" className="input" placeholder="Gerente Comercial"
                                        value={colab.role}
                                        onChange={e => setColab({ ...colab, role: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="label">Departamento</label>
                                    <input
                                        type="text" className="input" placeholder="Vendas"
                                        value={colab.department}
                                        onChange={e => setColab({ ...colab, department: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3 — Fluxo */}
                    {step === 3 && (
                        <div className="step-content animate-fade">
                            <div className="form-group">
                                <label className="label">Nome do Fluxo *</label>
                                <input
                                    type="text" className="input" placeholder="Ex: Pipeline de Vendas"
                                    value={fluxo.name}
                                    onChange={e => setFluxo({ ...fluxo, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Descrição</label>
                                <textarea
                                    className="input textarea"
                                    placeholder="Descreva o objetivo desse fluxo…"
                                    rows={3}
                                    value={fluxo.description}
                                    onChange={e => setFluxo({ ...fluxo, description: e.target.value })}
                                />
                            </div>
                            <div className="ob-flow-hint">
                                <Layers size={14} />
                                <span>Um fluxo é um Kanban — você pode adicionar etapas depois em <b>Fluxos</b>.</span>
                            </div>
                        </div>
                    )}

                    {/* Step 4 — Meta */}
                    {step === 4 && (
                        <div className="step-content animate-fade">
                            <div className="form-group">
                                <label className="label">Título da Meta *</label>
                                <input
                                    type="text" className="input"
                                    placeholder="Ex: Atingir R$ 500k de receita no Q2"
                                    value={meta.title}
                                    onChange={e => setMeta({ ...meta, title: e.target.value })}
                                />
                            </div>
                            <div className="ob-grid-2">
                                <div className="form-group">
                                    <label className="label">Tipo</label>
                                    <select className="input" value={meta.type}
                                        onChange={e => setMeta({ ...meta, type: e.target.value })}>
                                        <option value="company">Empresa</option>
                                        <option value="team">Equipe</option>
                                        <option value="individual">Individual</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="label">Período OKR</label>
                                    <select className="input" value={meta.period}
                                        onChange={e => setMeta({ ...meta, period: e.target.value })}>
                                        {['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Q1 2026', 'Q2 2026'].map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="label">Descrição / resultado esperado</label>
                                <textarea
                                    className="input textarea"
                                    placeholder="O que o sucesso desta meta representa para a empresa?"
                                    rows={2}
                                    value={meta.description}
                                    onChange={e => setMeta({ ...meta, description: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer ───────────────────────────────────────────── */}
                <div className="onboarding-footer">
                    <button
                        className="btn btn-ghost"
                        onClick={() => step > 1 ? setStep(s => s - 1) : undefined}
                        disabled={step === 1 || loading}
                        style={{ opacity: step === 1 ? 0 : 1 }}
                    >
                        <ArrowLeft size={16} /> Voltar
                    </button>

                    <button
                        className="btn btn-ghost ob-skip"
                        onClick={handleSkip}
                        disabled={loading}
                    >
                        <SkipForward size={14} /> Pular
                    </button>

                    <button
                        className="btn btn-primary"
                        onClick={handleNext}
                        disabled={loading || !canProceed}
                    >
                        {loading
                            ? <><Loader2 size={16} className="spin" /> Salvando…</>
                            : step === totalSteps
                                ? <><Sparkles size={16} /> Finalizar</>
                                : <>Continuar <ArrowRight size={16} /></>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
