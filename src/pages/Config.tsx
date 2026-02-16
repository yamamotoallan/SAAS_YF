import { Settings } from 'lucide-react';

const Config = () => (
    <div className="container animate-fade">
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <Settings size={48} color="var(--color-secondary)" style={{ marginBottom: '1rem' }} />
            <h2 className="text-h2">Configurações</h2>
            <p className="text-small">Funcionalidade disponível no próximo release.</p>
        </div>
    </div>
);

export default Config;
