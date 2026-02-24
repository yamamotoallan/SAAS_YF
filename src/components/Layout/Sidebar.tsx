import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
    Layers,
    Target
} from 'lucide-react';
import { api } from '../../services/api';
import './Sidebar.css';

const getInitials = (name: string) => {
    if (!name) return 'YF';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Sidebar = () => {
    const [alertCount, setAlertCount] = useState(0);
    const user = (() => {
        try { return JSON.parse(localStorage.getItem('yf_user') || '{}'); }
        catch { return {}; }
    })();

    // Poll for active alerts every 60 seconds
    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const alerts = await api.alerts.list({ status: 'active' });
                setAlertCount(Array.isArray(alerts) ? alerts.length : 0);
            } catch {
                // Silent — don't break sidebar on API error
            }
        };
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60_000);
        return () => clearInterval(interval);
    }, []);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: BarChart3, label: 'Indicadores', path: '/kpis' },
        { icon: Target, label: 'Metas & OKRs', path: '/metas' },
        { icon: Wallet, label: 'Financeiro', path: '/financeiro' },
        { icon: Users, label: 'Pessoas', path: '/pessoas' },
        { icon: Activity, label: 'Operação', path: '/operacao' },
        { icon: Layers, label: 'Fluxos', path: '/fluxos' },
        { icon: Users, label: 'Clientes', path: '/clientes' },
        { icon: ClipboardCheck, label: 'Processos', path: '/processos' },
        { icon: Bell, label: 'Alertas', path: '/alertas', badge: alertCount },
        { icon: FileText, label: 'Relatórios', path: '/relatorios' },
        { icon: Building2, label: 'Empresa', path: '/empresa' },
        { icon: Settings, label: 'Configurações', path: '/config' },
    ];

    const initials = getInitials(user.name || '');
    const displayName = user.name || 'Admin';
    const displayRole = user.role === 'admin' ? 'Diretor' : 'Colaborador';

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
                        end={item.path === '/'}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span className="nav-label">{item.label}</span>
                        {item.badge != null && item.badge > 0 && (
                            <span className="nav-badge" title={`${item.badge} alerta${item.badge > 1 ? 's' : ''} ativo${item.badge > 1 ? 's' : ''}`}>
                                {item.badge > 99 ? '99+' : item.badge}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="avatar" title={displayName}>
                        {initials}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{displayName}</span>
                        <span className="user-role">{displayRole}</span>
                    </div>
                </div>
                <button
                    className="logout-btn"
                    title="Sair"
                    onClick={() => {
                        localStorage.removeItem('yf_token');
                        localStorage.removeItem('yf_user');
                        window.location.href = '/login';
                    }}
                >
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
