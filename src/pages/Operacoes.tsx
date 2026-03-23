import { useState } from 'react';
import { Layers, Activity, ClipboardCheck } from 'lucide-react';
import Fluxos from './Fluxos';
import Operacao from './Operacao';
import Processos from './Processos';

const Operacoes = () => {
    const [activeTab, setActiveTab] = useState<'fluxos' | 'eficiencia' | 'processos'>('fluxos');

    return (
        <div className="container animate-fade">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Operações</h1>
                    <p className="text-small">Gestão de pipeline, eficiência e maturidade operacional</p>
                </div>
            </header>

            <div className="wrapper-tabs">
                <button
                    className={`wrapper-tab ${activeTab === 'fluxos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('fluxos')}
                >
                    <Layers size={16} /> Tracker (Fluxos)
                </button>
                <button
                    className={`wrapper-tab ${activeTab === 'eficiencia' ? 'active' : ''}`}
                    onClick={() => setActiveTab('eficiencia')}
                >
                    <Activity size={16} /> Eficiência (Analytics)
                </button>
                <button
                    className={`wrapper-tab ${activeTab === 'processos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('processos')}
                >
                    <ClipboardCheck size={16} /> Maturidade (Processos)
                </button>
            </div>

            <div className="wrapper-content">
                {activeTab === 'fluxos' && <Fluxos isWrapper={true} />}
                {activeTab === 'eficiencia' && <Operacao isWrapper={true} />}
                {activeTab === 'processos' && <Processos isWrapper={true} />}
            </div>
        </div>
    );
};

export default Operacoes;
