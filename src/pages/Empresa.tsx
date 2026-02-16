import { Building2 } from 'lucide-react';

const Empresa = () => (
    <div className="container animate-fade">
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <Building2 size={48} color="var(--color-secondary)" style={{ marginBottom: '1rem' }} />
            <h2 className="text-h2">Minha Empresa</h2>
            <p className="text-small">Funcionalidade disponível no próximo release.</p>
        </div>
    </div>
);

export default Empresa;
