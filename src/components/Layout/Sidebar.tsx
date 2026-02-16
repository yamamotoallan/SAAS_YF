import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    BarChart3,
    Wallet,
    Users,
    Bell,
    FileText,
    Building2,
    Settings,
    LogOut,
    ClipboardCheck,
    Activity,
    Layers
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: BarChart3, label: 'Indicadores', path: '/kpis' },
        { icon: Wallet, label: 'Financeiro', path: '/financeiro' },
        { icon: Users, label: 'Pessoas', path: '/pessoas' },
        { icon: Activity, label: 'Operação', path: '/operacao' },
        { icon: Layers, label: 'Fluxos', path: '/fluxos' },
        { icon: Users, label: 'Clientes', path: '/clientes' },
        { icon: ClipboardCheck, label: 'Processos', path: '/processos' },
        { icon: Bell, label: 'Alertas', path: '/alertas' },
        { icon: FileText, label: 'Relatórios', path: '/relatorios' },
        { icon: Building2, label: 'Empresa', path: '/empresa' },
        { icon: Settings, label: 'Configurações', path: '/config' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    <span className="logo-icon">YF</span>
                    <span className="logo-text">Consultoria</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="avatar">AD</div>
                    <div className="user-info">
                        <span className="user-name">Admin</span>
                        <span className="user-role">Diretor</span>
                    </div>
                </div>
                <button className="logout-btn">
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
