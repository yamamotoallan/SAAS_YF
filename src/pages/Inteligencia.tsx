import { useState } from 'react';
import { Brain, Bell, FileText } from 'lucide-react';
import MenteCEO from './MenteCEO';
import Alertas from './Alertas';
import Relatorios from './Relatorios';

const Inteligencia = () => {
    const [activeTab, setActiveTab] = useState<'ceo' | 'alerts' | 'reports'>('ceo');

    return (
        <div className="container animate-fade">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Inteligência</h1>
                    <p className="text-small">Estratégia, diagnóstico e análise preditiva</p>
                </div>
            </header>

            <div className="wrapper-tabs">
                <button
                    className={`wrapper-tab ${activeTab === 'ceo' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ceo')}
                >
                    <Brain size={16} /> Mente de CEO
                </button>
                <button
                    className={`wrapper-tab ${activeTab === 'alerts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('alerts')}
                >
                    <Bell size={16} /> Central de Alertas
                </button>
                <button
                    className={`wrapper-tab ${activeTab === 'reports' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reports')}
                >
                    <FileText size={16} /> Relatórios Emitidos
                </button>
            </div>

            <div className="wrapper-content">
                {activeTab === 'ceo' && <MenteCEO isWrapper={true} />}
                {activeTab === 'alerts' && <Alertas isWrapper={true} />}
                {activeTab === 'reports' && <Relatorios isWrapper={true} />}
            </div>
        </div>
    );
};

export default Inteligencia;
