import { useState } from 'react';
import { Target, BarChart2 } from 'lucide-react';
import KPIs from './KPIs';
import Metas from './Metas';
import './Performance.css';

const Performance = () => {
    const [activeTab, setActiveTab] = useState<'kpis' | 'metas'>('kpis');

    return (
        <div className="container animate-fade">
            <header className="page-header">
                <div>
                    <h1 className="text-h2">Performance</h1>
                    <p className="text-small">Gestão integrada de Indicadores e Objetivos (OKRs)</p>
                </div>
            </header>

            <div className="wrapper-tabs">
                <button
                    className={`wrapper-tab ${activeTab === 'kpis' ? 'active' : ''}`}
                    onClick={() => setActiveTab('kpis')}
                >
                    <BarChart2 size={16} /> Indicadores (KPIs)
                </button>
                <button
                    className={`wrapper-tab ${activeTab === 'metas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('metas')}
                >
                    <Target size={16} /> Metas & OKRs
                </button>
            </div>

            <div className="wrapper-content">
                {activeTab === 'kpis' ? <KPIs isWrapper={true} /> : <Metas isWrapper={true} />}
            </div>
        </div>
    );
};

export default Performance;
