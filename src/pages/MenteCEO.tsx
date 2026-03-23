import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Brain, TrendingUp, TrendingDown, Minus, DollarSign, Users, Target,
    Shield, AlertTriangle, ArrowRight, Zap, Activity, BarChart3, Lightbulb,
    Clock, CheckCircle2, Layers, Flame, Eye, Heart, Compass, Crown,
    Rocket, Calculator, Focus, ShoppingCart
} from 'lucide-react';
import { api } from '../services/api';
import LoadingSkeleton from '../components/Layout/LoadingSkeleton';
import ScoreRing from '../components/shared/ScoreRing';
import { fmtBRL } from '../utils/formatters';
import './MenteCEO.css';

const pillarColor = (s: number) => s >= 70 ? '#22c55e' : s >= 50 ? '#f59e0b' : '#ef4444';
const pillarClass = (s: number) => s >= 70 ? 'good' : s >= 50 ? 'warning' : 'danger';
const trendIcon = (t: string) => t === 'up' ? <TrendingUp size={13} /> : t === 'down' ? <TrendingDown size={13} /> : <Minus size={13} />;
const trendColor = (t: string) => t === 'up' ? '#22c55e' : t === 'down' ? '#ef4444' : '#94a3b8';

// ── Tab definitions ──
const TABS = [
    { id: 'overview', label: 'Visão Geral', icon: Eye },
    { id: 'strategy', label: 'Estratégia', icon: Compass },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'leadership', label: 'Liderança', icon: Crown },
    { id: 'operations', label: 'Operações', icon: Layers },
    { id: 'financial', label: 'Financeiro', icon: Calculator },
    { id: 'productivity', label: 'Produtividade', icon: Focus },
    { id: 'sales', label: 'Vendas', icon: ShoppingCart },
];

// ── Static Data ──
const LEADERSHIP_STYLES = [
    { name: 'Visionário', ref: 'Steve Jobs', desc: 'Inspira com uma visão clara e apaixonada do futuro.' },
    { name: 'Disruptivo', ref: 'Elon Musk', desc: 'Desafia paradigmas e move rápido para inovar.' },
    { name: 'Empático', ref: 'Satya Nadella', desc: 'Transforma cultura com empatia e growth mindset.' },
    { name: 'Estratégico', ref: 'Jeff Bezos', desc: 'Pensa a longo prazo com obsessão pelo cliente.' },
    { name: 'Executor', ref: 'Tim Cook', desc: 'Excelência operacional e execução impecável.' },
    { name: 'Inspirador', ref: 'Simon Sinek', desc: 'Começa pelo porquê e mobiliza pelo propósito.' },
    { name: 'Transformador', ref: 'Indra Nooyi', desc: 'Lidera mudanças profundas com visão sustentável.' },
    { name: 'Servidora', ref: 'Howard Schultz', desc: 'Prioriza o crescimento das pessoas acima de tudo.' },
    { name: 'Adaptável', ref: 'Reed Hastings', desc: 'Reinventa modelos e abraça a mudança contínua.' },
];

const IE_PILLARS = [
    { icon: '🧠', name: 'Autoconhecimento', desc: 'Reconhecer emoções, forças e gatilhos pessoais com clareza.' },
    { icon: '🎯', name: 'Autogestão', desc: 'Controlar impulsos, manter foco e adaptar-se sob pressão.' },
    { icon: '💛', name: 'Empatia', desc: 'Compreender emoções dos outros e ajustar comunicação.' },
    { icon: '🤝', name: 'Relacionamentos', desc: 'Construir confiança, influenciar e resolver conflitos.' },
];

const SERVANT_HABITS = [
    'Ouvir ativamente antes de falar', 'Servir a equipe, não ser servido',
    'Desenvolver pessoas, não apenas resultados', 'Dar crédito ao time pelas vitórias',
    'Assumir responsabilidade pelos fracassos', 'Criar ambiente seguro para errar',
    'Praticar humildade genuína', 'Tomar decisões pelo bem coletivo',
];

const SIX_HATS = [
    { emoji: '⚪', name: 'Branco', desc: 'Fatos e dados puros' },
    { emoji: '🔴', name: 'Vermelho', desc: 'Sentimentos e intuição' },
    { emoji: '⚫', name: 'Preto', desc: 'Riscos e cautela' },
    { emoji: '🟡', name: 'Amarelo', desc: 'Otimismo e benefícios' },
    { emoji: '🟢', name: 'Verde', desc: 'Criatividade e alternativas' },
    { emoji: '🔵', name: 'Azul', desc: 'Controle e processo' },
];

const DELEGATION_STEPS = [
    { title: 'Definir a Tarefa', desc: 'Descreva claramente o que precisa ser feito e o resultado esperado.' },
    { title: 'Escolher a Pessoa', desc: 'Selecione com base em habilidades, disponibilidade e potencial de crescimento.' },
    { title: 'Alinhar Expectativas', desc: 'Defina prazos, padrões de qualidade e métricas de sucesso.' },
    { title: 'Dar Autonomia', desc: 'Confie na pessoa — evite microgerenciamento. Defina checkpoints.' },
    { title: 'Oferecer Suporte', desc: 'Disponibilize recursos, contexto e esteja acessível para dúvidas.' },
    { title: 'Dar Feedback', desc: 'Reconheça o trabalho feito e compartilhe aprendizados para melhoria contínua.' },
];

const RAPID_FRAMEWORK = [
    { letter: 'R', name: 'Recomendar', desc: 'Quem propõe a solução com dados e análise.' },
    { letter: 'A', name: 'Aprovar', desc: 'Quem pode vetar ou aprovar a recomendação.' },
    { letter: 'P', name: 'Performar', desc: 'Quem executa a decisão no dia a dia.' },
    { letter: 'I', name: 'Informar', desc: 'Quem precisa ser comunicado da decisão.' },
    { letter: 'D', name: 'Decidir', desc: 'Quem tem a palavra final e compromete a organização.' },
];

const MONK_MODE_STEPS = [
    'Bloquear 2h ininterruptas pela manhã', 'Desligar notificações do celular',
    'Fechar e-mail e chat corporativo', 'Definir 1 entregável para o bloco',
    'Ambiente limpo e organizado', 'Usar fone com ruído branco ou silêncio',
    'Não iniciar reunião antes das 10h', 'Beber água e fazer pausa a cada 90min',
    'Revisar prioridades na noite anterior', 'Dizer "não" para urgências falsas',
    'Delegar o que não exige sua expertise', 'Agrupar reuniões em blocos',
    'Praticar 5 min de respiração antes do foco', 'Registrar conquistas ao final do dia',
    'Descansar ativamente nos intervalos', 'Proteger domingos para planejamento semanal',
];

const TIME_TIPS = [
    { icon: '🎯', title: 'Regra dos 3', desc: 'Defina 3 prioridades absolutas para hoje.' },
    { icon: '⏰', title: 'Blocos de Foco', desc: 'Trabalhe em blocos de 90min sem interrupção.' },
    { icon: '📋', title: 'Revisão Semanal', desc: 'Domine o GTD: revise todas as tarefas a cada 7 dias.' },
];

const McKINSEY_7S = [
    { name: 'Strategy', label: 'Estratégia' },
    { name: 'Structure', label: 'Estrutura' },
    { name: 'Systems', label: 'Sistemas' },
    { name: 'Shared Values', label: 'Valores' },
    { name: 'Skills', label: 'Competências' },
    { name: 'Staff', label: 'Pessoas' },
    { name: 'Style', label: 'Estilo' },
];

// ── Main Component ──
const MenteCEO = ({ isWrapper = false }: { isWrapper?: boolean }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    const [servantChecks, setServantChecks] = useState<Record<number, boolean>>({});
    const [multipliers, setMultipliers] = useState({ leads: 100, conversion: 10, ticket: 500, frequency: 2 });
    const [sevenS, setSevenS] = useState<Record<string, number>>(() => {
        const saved = localStorage.getItem('ceo_7s_scores');
        return saved ? JSON.parse(saved) : { Strategy: 70, Structure: 60, Systems: 55, 'Shared Values': 80, Skills: 65, Staff: 70, Style: 75 };
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const result = await api.ceoMind.get();
            setData(result);
        } catch (err) {
            console.error('Failed to load CEO Mind data', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleCheck = (key: string) => setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
    const toggleServant = (i: number) => setServantChecks(prev => ({ ...prev, [i]: !prev[i] }));

    const update7S = (key: string, val: number) => {
        const next = { ...sevenS, [key]: val };
        setSevenS(next);
        localStorage.setItem('ceo_7s_scores', JSON.stringify(next));
    };

    if (loading) return <div className="container animate-fade"><LoadingSkeleton type="card" rows={6} /></div>;
    if (!data) return <div className="container animate-fade ceo-empty"><Brain size={48} /><h3>Erro ao carregar dados</h3></div>;

    const { pulse, pillars, risks, opportunities, decisions, financial, goals, kpis, heatmap } = data;
    const multiplierResult = Math.round(multipliers.leads * (multipliers.conversion / 100) * multipliers.ticket * multipliers.frequency);

    // ── Render Tab Content ──
    const renderTab = () => {
        switch (activeTab) {
            case 'overview': return renderOverview();
            case 'strategy': return renderStrategy();
            case 'goals': return renderGoals();
            case 'leadership': return renderLeadership();
            case 'operations': return renderOperations();
            case 'financial': return renderFinancial();
            case 'productivity': return renderProductivity();
            case 'sales': return renderSales();
            default: return null;
        }
    };

    // ── TAB: Overview ──
    const renderOverview = () => (
        <>
            <div className="ceo-grid-4">
                {[
                    { icon: DollarSign, label: 'Receita', value: fmtBRL(pulse.revenue), trend: pulse.revenueTrend, cls: 'success' },
                    { icon: TrendingUp, label: 'Margem', value: `${pulse.margin}%`, trend: pulse.revenueTrend > 0 ? 'up' : 'stable', cls: 'primary' },
                    { icon: Users, label: 'Pessoas', value: pulse.headcount, trend: 'stable', cls: 'warning' },
                    { icon: Shield, label: 'Runway', value: `${pulse.runway} meses`, trend: pulse.runway >= 6 ? 'up' : 'down', cls: 'danger' },
                ].map((m, i) => (
                    <div key={i} className="ceo-metric">
                        <div className={`ceo-metric-icon ${m.cls}`}><m.icon size={18} /></div>
                        <span className="ceo-metric-label">{m.label}</span>
                        <span className="ceo-metric-value">{m.value}</span>
                        <span className={`ceo-metric-trend ${typeof m.trend === 'string' ? m.trend : m.trend > 0 ? 'up' : m.trend < 0 ? 'down' : 'stable'}`}>
                            {typeof m.trend === 'number' ? <>{m.trend > 0 ? <TrendingUp size={12} /> : <Minus size={12} />} {m.trend > 0 ? '+' : ''}{m.trend}%</> : trendIcon(m.trend)}
                        </span>
                    </div>
                ))}
            </div>

            <h3 className="ceo-section-title"><Activity size={18} /> Diagnóstico Estratégico</h3>
            <div className="ceo-grid-3" style={{ marginBottom: 24 }}>
                {(pillars || []).map((p: any, i: number) => (
                    <div key={i} className="ceo-pillar">
                        <div className="ceo-pillar-header">
                            <span className="ceo-pillar-name">{p.name}</span>
                            <span className={`ceo-pillar-score ${pillarClass(p.score)}`}>{p.score}</span>
                        </div>
                        <div className="ceo-pillar-bar">
                            <div className="ceo-pillar-bar-fill" style={{ width: `${Math.min(p.score, 100)}%`, background: pillarColor(p.score) }} />
                        </div>
                        <div className="ceo-pillar-trend" style={{ color: trendColor(p.trend) }}>
                            {trendIcon(p.trend)} <span>{p.trend === 'up' ? 'Em alta' : p.trend === 'down' ? 'Em queda' : 'Estável'}</span>
                        </div>
                        <div className="ceo-pillar-recommendation">{p.recommendation}</div>
                    </div>
                ))}
            </div>

            <div className="ceo-grid-2">
                <div className="ceo-card">
                    <div className="ceo-card-header">
                        <span className="ceo-card-title"><AlertTriangle size={18} /> Riscos Ativos</span>
                    </div>
                    {risks.length === 0 ? <p style={{ color: '#94a3b8', fontSize: 13 }}>Nenhum risco identificado. ✅</p> :
                        risks.map((r: any, i: number) => (
                            <div key={i} className="ceo-risk-item">
                                <span className={`ceo-risk-badge ${r.severity}`}>{r.severity}</span>
                                <div className="ceo-risk-info">
                                    <div className="ceo-risk-title">{r.title}</div>
                                    <div className="ceo-risk-desc">{r.description}</div>
                                </div>
                                {r.link && <Link to={r.link} className="ceo-link-btn"><ArrowRight size={12} /></Link>}
                            </div>
                        ))}
                </div>
                <div className="ceo-card">
                    <div className="ceo-card-header">
                        <span className="ceo-card-title"><Lightbulb size={18} /> Oportunidades</span>
                    </div>
                    {opportunities.length === 0 ? <p style={{ color: '#94a3b8', fontSize: 13 }}>Explorando oportunidades...</p> :
                        opportunities.map((o: any, i: number) => (
                            <div key={i} className="ceo-opp-item">
                                <div className="ceo-opp-icon"><Rocket size={16} /></div>
                                <div className="ceo-risk-info">
                                    <div className="ceo-risk-title">{o.title}</div>
                                    <div className="ceo-risk-desc">{o.description}</div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            <h3 className="ceo-section-title"><Zap size={18} /> Painel de Decisões</h3>
            <div className="ceo-card" style={{ marginBottom: 24 }}>
                {decisions.length === 0 ? <p style={{ color: '#94a3b8', fontSize: 13 }}>Sem decisões pendentes. 🎉</p> :
                    decisions.map((d: any, i: number) => (
                        <Link key={i} to={d.link || '#'} className="ceo-decision-item" style={{ textDecoration: 'none' }}>
                            <div className={`ceo-decision-priority ${d.priority}`} />
                            <div className="ceo-decision-info">
                                <div className="ceo-decision-action">{d.action}</div>
                                <div className="ceo-decision-meta"><span>{d.category}</span></div>
                            </div>
                            <span className="ceo-decision-impact">Impacto: {d.impact}</span>
                            <ArrowRight size={14} style={{ color: '#6366f1' }} />
                        </Link>
                    ))}
            </div>

            <h3 className="ceo-section-title"><BarChart3 size={18} /> Mapa de Calor Organizacional</h3>
            <div className="ceo-card">
                <div className="ceo-heatmap">
                    <div className="ceo-heatmap-header">
                        {['Gente', 'Processo', 'Resultado'].map(a => <span key={a} className="ceo-heatmap-area-label">{a}</span>)}
                    </div>
                    {Object.entries(heatmap || {}).map(([dept, areas]: any) => (
                        <div key={dept} className="ceo-heatmap-row">
                            <span className="ceo-heatmap-dept">{dept}</span>
                            {['Gente', 'Processo', 'Resultado'].map(area => {
                                const score = areas[area] || 0;
                                const level = score >= 75 ? 'high' : score >= 55 ? 'mid' : 'low';
                                return <div key={area} className={`ceo-heatmap-cell lv-${level}`} title={`${dept} - ${area}: ${score}%`}>{score}%</div>;
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );

    // ── TAB: Strategy ──
    const renderStrategy = () => (
        <>
            <div className="ceo-grid-2">
                <div className="ceo-framework">
                    <div className="ceo-framework-header">
                        <div className="ceo-framework-icon"><Compass size={20} /></div>
                        <div><div className="ceo-framework-title">Pirâmide da Estratégia</div><div className="ceo-framework-subtitle">Da visão às iniciativas do dia-a-dia</div></div>
                    </div>
                    <div className="ceo-pyramid">
                        {['Visão', 'Missão', 'Valores', 'Prioridades', 'Metas (OKRs)', 'Iniciativas'].map((l, i) => (
                            <div key={i} className="ceo-pyramid-level"><span>{l}</span><span className="ceo-pyramid-label">Nível {i + 1}</span></div>
                        ))}
                    </div>
                </div>
                <div className="ceo-framework">
                    <div className="ceo-framework-header">
                        <div className="ceo-framework-icon"><Shield size={20} /></div>
                        <div><div className="ceo-framework-title">McKinsey 7S Audit</div><div className="ceo-framework-subtitle">Avalie o alinhamento organizacional (clique para ajustar)</div></div>
                    </div>
                    <div className="ceo-7s-grid">
                        {McKINSEY_7S.map(item => (
                            <div key={item.name} className="ceo-7s-item">
                                <div className="ceo-7s-name">{item.label}</div>
                                <div className="ceo-7s-score" style={{ color: pillarColor(sevenS[item.name]) }}>{sevenS[item.name]}</div>
                                <input type="range" min="0" max="100" value={sevenS[item.name]}
                                    onChange={e => update7S(item.name, Number(e.target.value))}
                                    style={{ width: '100%', marginTop: 6, accentColor: '#6366f1' }} />
                                <div className="ceo-7s-bar"><div className="ceo-7s-fill" style={{ width: `${sevenS[item.name]}%`, background: pillarColor(sevenS[item.name]) }} /></div>
                            </div>
                        ))}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#94a3b8' }}>
                        Média: <strong style={{ color: pillarColor(Math.round(Object.values(sevenS).reduce((a, b) => a + b, 0) / 7)) }}>
                            {Math.round(Object.values(sevenS).reduce((a, b) => a + b, 0) / 7)}%
                        </strong>
                    </div>
                </div>
            </div>
        </>
    );

    // ── TAB: Goals ──
    const renderGoals = () => (
        <>
            <div className="ceo-grid-3" style={{ marginBottom: 24 }}>
                <div className="ceo-metric"><div className="ceo-metric-icon primary"><Target size={18} /></div><span className="ceo-metric-label">Metas Ativas</span><span className="ceo-metric-value">{pulse.activeGoals}</span></div>
                <div className="ceo-metric"><div className="ceo-metric-icon success"><CheckCircle2 size={18} /></div><span className="ceo-metric-label">Progresso Médio</span><span className="ceo-metric-value">{pulse.avgGoalProgress}%</span></div>
                <div className="ceo-metric"><div className="ceo-metric-icon warning"><BarChart3 size={18} /></div><span className="ceo-metric-label">KPIs Monitorados</span><span className="ceo-metric-value">{kpis.length}</span></div>
            </div>
            <div className="ceo-grid-2">
                <div className="ceo-card">
                    <div className="ceo-card-header"><span className="ceo-card-title"><Target size={18} /> OKRs</span><Link to="/metas" className="ceo-link-btn">Gerenciar <ArrowRight size={12} /></Link></div>
                    {goals.length === 0 ? <p style={{ color: '#94a3b8', fontSize: 13 }}>Nenhuma meta ativa.</p> :
                        goals.slice(0, 6).map((g: any) => (
                            <div key={g.id} className="ceo-goal-item">
                                <div className="ceo-goal-header">
                                    <span className="ceo-goal-title">{g.title}</span>
                                    <span className="ceo-goal-pct" style={{ color: pillarColor(g.progress) }}>{g.progress}%</span>
                                </div>
                                <div className="ceo-progress-bar"><div className="ceo-progress-fill" style={{ width: `${g.progress}%`, background: pillarColor(g.progress) }} /></div>
                                {(g.keyResults || []).slice(0, 3).map((kr: any, ki: number) => (
                                    <div key={ki} className="ceo-kr-item">
                                        <span style={{ flex: 1 }}>{kr.title}</span>
                                        <div className="ceo-kr-bar"><div className="ceo-kr-fill" style={{ width: `${kr.progress}%`, background: pillarColor(kr.progress) }} /></div>
                                        <span style={{ width: 35, textAlign: 'right' }}>{kr.progress}%</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                </div>
                <div className="ceo-card">
                    <div className="ceo-card-header"><span className="ceo-card-title"><BarChart3 size={18} /> KPIs</span><Link to="/kpis" className="ceo-link-btn">Ver todos <ArrowRight size={12} /></Link></div>
                    {kpis.length === 0 ? <p style={{ color: '#94a3b8', fontSize: 13 }}>Nenhum KPI cadastrado.</p> :
                        kpis.slice(0, 8).map((k: any, i: number) => (
                            <div key={i} className="ceo-kpi-mini">
                                <span className="ceo-kpi-mini-name">{k.name}</span>
                                <div className="ceo-kpi-mini-values">
                                    <span className="ceo-kpi-mini-current" style={{ color: pillarColor(k.progress) }}>{k.value}{k.unit === 'R$' ? '' : k.unit}</span>
                                    <span className="ceo-kpi-mini-target">/ {k.target}{k.unit}</span>
                                    <div className="ceo-kpi-mini-bar"><div className="ceo-kpi-mini-fill" style={{ width: `${Math.min(k.progress, 100)}%`, background: pillarColor(k.progress) }} /></div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </>
    );

    // ── TAB: Leadership ──
    const renderLeadership = () => (
        <>
            <h3 className="ceo-section-title"><Heart size={18} /> 4 Pilares da Inteligência Emocional</h3>
            <div className="ceo-ie-grid" style={{ marginBottom: 24 }}>
                {IE_PILLARS.map((p, i) => (
                    <div key={i} className="ceo-ie-card"><span className="ceo-ie-icon">{p.icon}</span><div className="ceo-ie-name">{p.name}</div><div className="ceo-ie-desc">{p.desc}</div></div>
                ))}
            </div>
            <h3 className="ceo-section-title"><Crown size={18} /> 9 Estilos de Liderança</h3>
            <div className="ceo-leader-grid" style={{ marginBottom: 24 }}>
                {LEADERSHIP_STYLES.map((l, i) => (
                    <div key={i} className="ceo-leader-card"><div className="ceo-leader-name">{l.name}</div><div className="ceo-leader-ref">Ref: {l.ref}</div><div className="ceo-leader-desc">{l.desc}</div></div>
                ))}
            </div>
            <h3 className="ceo-section-title"><Users size={18} /> Liderança Servidora — 8 Hábitos</h3>
            <div className="ceo-card">
                <ul className="ceo-checklist">
                    {SERVANT_HABITS.map((h, i) => (
                        <li key={i} className="ceo-checklist-item" onClick={() => toggleServant(i)}>
                            <div className={`ceo-checklist-check ${servantChecks[i] ? 'checked' : ''}`}>{servantChecks[i] ? '✓' : ''}</div>
                            <span className={`ceo-checklist-text ${servantChecks[i] ? 'checked' : ''}`}>{h}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );

    // ── TAB: Operations ──
    const renderOperations = () => (
        <>
            <h3 className="ceo-section-title"><Layers size={18} /> Delegação em 6 Passos</h3>
            <div className="ceo-card" style={{ marginBottom: 24 }}>
                <div className="ceo-steps">
                    {DELEGATION_STEPS.map((s, i) => (
                        <div key={i} className="ceo-step"><div className="ceo-step-number">{i + 1}</div><div className="ceo-step-content"><div className="ceo-step-title">{s.title}</div><div className="ceo-step-desc">{s.desc}</div></div></div>
                    ))}
                </div>
            </div>
            <h3 className="ceo-section-title"><Zap size={18} /> Framework RAPID</h3>
            <div className="ceo-rapid" style={{ marginBottom: 24 }}>
                {RAPID_FRAMEWORK.map((r, i) => (
                    <div key={i} className="ceo-rapid-letter"><span className="ceo-rapid-char">{r.letter}</span><div className="ceo-rapid-name">{r.name}</div><div className="ceo-rapid-desc">{r.desc}</div></div>
                ))}
            </div>
            <h3 className="ceo-section-title"><Lightbulb size={18} /> 6 Chapéus do Pensamento</h3>
            <div className="ceo-hats-grid">
                {SIX_HATS.map((h, i) => (
                    <div key={i} className="ceo-hat-card"><span className="ceo-hat-emoji">{h.emoji}</span><div className="ceo-hat-name">{h.name}</div><div className="ceo-hat-desc">{h.desc}</div></div>
                ))}
            </div>
        </>
    );

    // ── TAB: Financial ──
    const renderFinancial = () => {
        const profit = financial.revenue - financial.costs;
        const mcPercent = financial.revenue > 0 ? ((profit / financial.revenue) * 100) : 0;
        const breakeven = mcPercent > 0 ? Math.round(financial.costs / (mcPercent / 100)) : 0;
        return (
            <>
                <div className="ceo-grid-4" style={{ marginBottom: 24 }}>
                    <div className="ceo-metric"><div className="ceo-metric-icon success"><DollarSign size={18} /></div><span className="ceo-metric-label">Receita</span><span className="ceo-metric-value">{fmtBRL(financial.revenue)}</span></div>
                    <div className="ceo-metric"><div className="ceo-metric-icon danger"><TrendingDown size={18} /></div><span className="ceo-metric-label">Custos</span><span className="ceo-metric-value">{fmtBRL(financial.costs)}</span></div>
                    <div className="ceo-metric"><div className="ceo-metric-icon primary"><TrendingUp size={18} /></div><span className="ceo-metric-label">Margem</span><span className="ceo-metric-value">{financial.margin}%</span></div>
                    <div className="ceo-metric"><div className="ceo-metric-icon warning"><Clock size={18} /></div><span className="ceo-metric-label">Runway</span><span className="ceo-metric-value">{financial.runway} meses</span></div>
                </div>
                <div className="ceo-grid-2">
                    <div className="ceo-card">
                        <div className="ceo-card-header"><span className="ceo-card-title"><Calculator size={18} /> DRE Simplificada</span></div>
                        <div className="ceo-dre">
                            <div className="ceo-dre-row"><span className="ceo-dre-label">(+) Receita Bruta</span><span className="ceo-dre-value positive">{fmtBRL(financial.revenue)}</span></div>
                            <div className="ceo-dre-row"><span className="ceo-dre-label">(-) Custos Operacionais</span><span className="ceo-dre-value negative">-{fmtBRL(financial.costs)}</span></div>
                            <div className="ceo-dre-row total"><span className="ceo-dre-label">(=) Resultado Líquido</span><span className={`ceo-dre-value ${profit >= 0 ? 'positive' : 'negative'}`}>{fmtBRL(profit)}</span></div>
                            <div className="ceo-dre-row" style={{ marginTop: 12 }}><span className="ceo-dre-label">Margem de Contribuição</span><span className="ceo-dre-value">{mcPercent.toFixed(1)}%</span></div>
                            <div className="ceo-dre-row"><span className="ceo-dre-label">Burn Rate Mensal</span><span className="ceo-dre-value negative">-{fmtBRL(financial.burnRate)}</span></div>
                            <div className="ceo-dre-row"><span className="ceo-dre-label">Caixa Disponível</span><span className={`ceo-dre-value ${financial.cashAvailable >= 0 ? 'positive' : 'negative'}`}>{fmtBRL(financial.cashAvailable)}</span></div>
                        </div>
                    </div>
                    <div className="ceo-card">
                        <div className="ceo-card-header"><span className="ceo-card-title"><Target size={18} /> Ponto de Equilíbrio</span></div>
                        <div className="ceo-breakeven">
                            <div className="ceo-breakeven-value">{fmtBRL(breakeven)}</div>
                            <div className="ceo-breakeven-label">Receita necessária para cobrir custos fixos</div>
                        </div>
                        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#f1f5f9' }}>Histórico (6 Meses)</h4>
                        {(financial.history || []).map((h: any, i: number) => (
                            <div key={i} className="ceo-dre-row">
                                <span className="ceo-dre-label">{h.month}</span>
                                <span className={`ceo-dre-value ${h.profit >= 0 ? 'positive' : 'negative'}`}>{fmtBRL(h.profit)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </>
        );
    };

    // ── TAB: Productivity ──
    const renderProductivity = () => (
        <>
            <div className="ceo-grid-2" style={{ marginBottom: 24 }}>
                <div className="ceo-card">
                    <div className="ceo-card-header"><span className="ceo-card-title"><Focus size={18} /> Matriz de Eisenhower</span></div>
                    <div className="ceo-eisenhower">
                        <div className="ceo-eisenhower-cell q1"><div className="ceo-eisenhower-label" style={{ color: '#ef4444' }}>🔥 Urgente + Importante</div><div className="ceo-eisenhower-action">FAZER AGORA</div></div>
                        <div className="ceo-eisenhower-cell q2"><div className="ceo-eisenhower-label" style={{ color: '#22c55e' }}>🎯 Importante, Não Urgente</div><div className="ceo-eisenhower-action">AGENDAR</div></div>
                        <div className="ceo-eisenhower-cell q3"><div className="ceo-eisenhower-label" style={{ color: '#f59e0b' }}>⚡ Urgente, Não Importante</div><div className="ceo-eisenhower-action">DELEGAR</div></div>
                        <div className="ceo-eisenhower-cell q4"><div className="ceo-eisenhower-label" style={{ color: '#64748b' }}>🗑️ Nem Urgente, Nem Importante</div><div className="ceo-eisenhower-action">ELIMINAR</div></div>
                    </div>
                </div>
                <div className="ceo-card">
                    <div className="ceo-card-header"><span className="ceo-card-title"><Clock size={18} /> Gestão de Tempo</span></div>
                    <div className="ceo-tips-grid">
                        {TIME_TIPS.map((t, i) => (
                            <div key={i} className="ceo-tip"><span className="ceo-tip-icon">{t.icon}</span><div className="ceo-tip-title">{t.title}</div><div className="ceo-tip-desc">{t.desc}</div></div>
                        ))}
                    </div>
                </div>
            </div>
            <h3 className="ceo-section-title"><Flame size={18} /> 16 Passos — Modo Monge (Proteger o Foco)</h3>
            <div className="ceo-card">
                <ul className="ceo-checklist">
                    {MONK_MODE_STEPS.map((s, i) => (
                        <li key={i} className="ceo-checklist-item" onClick={() => toggleCheck(`monk_${i}`)}>
                            <div className={`ceo-checklist-check ${checkedItems[`monk_${i}`] ? 'checked' : ''}`}>{checkedItems[`monk_${i}`] ? '✓' : ''}</div>
                            <span className={`ceo-checklist-text ${checkedItems[`monk_${i}`] ? 'checked' : ''}`}>{i + 1}. {s}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );

    // ── TAB: Sales ──
    const renderSales = () => (
        <>
            <h3 className="ceo-section-title"><Rocket size={18} /> 4 Multiplicadores de Crescimento</h3>
            <div className="ceo-card" style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>Receita = Leads × Conversão × Ticket Médio × Frequência</p>
                <div className="ceo-multiplier">
                    <div style={{ textAlign: 'center' }}><label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Leads/mês</label>
                        <input className="ceo-multiplier-input" type="number" value={multipliers.leads} onChange={e => setMultipliers({ ...multipliers, leads: Number(e.target.value) })} /></div>
                    <span className="ceo-multiplier-op">×</span>
                    <div style={{ textAlign: 'center' }}><label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Conv. %</label>
                        <input className="ceo-multiplier-input" type="number" value={multipliers.conversion} onChange={e => setMultipliers({ ...multipliers, conversion: Number(e.target.value) })} /></div>
                    <span className="ceo-multiplier-op">×</span>
                    <div style={{ textAlign: 'center' }}><label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Ticket R$</label>
                        <input className="ceo-multiplier-input" type="number" value={multipliers.ticket} onChange={e => setMultipliers({ ...multipliers, ticket: Number(e.target.value) })} /></div>
                    <span className="ceo-multiplier-op">×</span>
                    <div style={{ textAlign: 'center' }}><label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Frequência</label>
                        <input className="ceo-multiplier-input" type="number" value={multipliers.frequency} onChange={e => setMultipliers({ ...multipliers, frequency: Number(e.target.value) })} /></div>
                    <span className="ceo-multiplier-op">=</span>
                    <div className="ceo-multiplier-result">{fmtBRL(multiplierResult)}</div>
                </div>
            </div>
            <h3 className="ceo-section-title"><ShoppingCart size={18} /> Regras de Ouro de Vendas</h3>
            <div className="ceo-card">
                {[
                    { badge: '70/30', title: 'Regra 70/30', desc: 'O cliente fala 70% do tempo. Você, 30%. Escute mais, venda melhor.' },
                    { badge: '3-Sim', title: 'Técnica 3-Sim', desc: 'Conduza o prospect a 3 micro-compromissos antes do fechamento principal.' },
                    { badge: 'SPIN', title: 'SPIN Selling', desc: 'Situação → Problema → Implicação → Necessidade. Descubra a dor antes de oferecer a solução.' },
                    { badge: '48h', title: 'Regra das 48h', desc: 'Faça follow-up em até 48 horas. Depois disso, o lead esfria 80%.' },
                ].map((r, i) => (
                    <div key={i} className="ceo-sales-rule"><span className="ceo-sales-badge">{r.badge}</span><div><div className="ceo-risk-title">{r.title}</div><div className="ceo-risk-desc">{r.desc}</div></div></div>
                ))}
            </div>
        </>
    );

    return (
        <div className={`container animate-fade ceo-page ${isWrapper ? 'is-wrapper pt-0' : ''}`}>
            {/* Hero */}
            {!isWrapper && (
                <div className="ceo-hero">
                    <div className="ceo-hero-content">
                        <div className="ceo-hero-score"><ScoreRing score={pulse.sgeScore} /></div>
                        <div className="ceo-hero-info">
                            <div className="ceo-hero-label"><Brain size={14} /> MENTE DE CEO</div>
                            <h1 className="ceo-hero-title">{pulse.sgeStatus}</h1>
                            <p className="ceo-hero-sub">Plataforma de Aceleração Executiva — {data.companyName}</p>
                        </div>
                        <div className="ceo-hero-stats">
                            <div className="ceo-hero-stat"><DollarSign size={18} /><div><span className="ceo-hero-stat-label">Receita</span><span className="ceo-hero-stat-value">{fmtBRL(pulse.revenue)}</span></div></div>
                            <div className="ceo-hero-stat"><Target size={18} /><div><span className="ceo-hero-stat-label">Metas</span><span className="ceo-hero-stat-value">{pulse.activeGoals}</span></div></div>
                            <div className="ceo-hero-stat"><Users size={18} /><div><span className="ceo-hero-stat-label">Equipe</span><span className="ceo-hero-stat-value">{pulse.headcount}</span></div></div>
                            <div className="ceo-hero-stat"><AlertTriangle size={18} /><div><span className="ceo-hero-stat-label">Alertas</span><span className="ceo-hero-stat-value">{pulse.activeAlerts}</span></div></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className={`ceo-tabs ${isWrapper ? 'pt-4' : ''}`}>
                {TABS.map(tab => (
                    <button key={tab.id} className={`ceo-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {renderTab()}
        </div>
    );
};

export default MenteCEO;
