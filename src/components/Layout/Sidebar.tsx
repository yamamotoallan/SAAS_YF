import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '../../services/api';

import {
    LayoutDashboard,
    Wallet,
    Users,
    Settings,
    LogOut,
    Target,
    Brain,
    Layers,
    Shield
} from 'lucide-react';
import './Sidebar.css';

const getInitials = (name: string) => {
    if (!name) return 'YF';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Sidebar = () => {
    const [company, setCompany] = useState<any>(null);
    const user = (() => {
        try { return JSON.parse(localStorage.getItem('yf_user') || '{}'); }
        catch { return {}; }
    })();

    useEffect(() => {
        const loadCompany = async () => {
            try {
                const data = await api.company.get();
                setCompany(data);
            } catch (error) {
                console.error('Failed to load company branding', error);
            }
        };
        loadCompany();
    }, []);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Brain, label: 'Inteligência', path: '/inteligencia' },
        { icon: Target, label: 'Performance', path: '/performance' },
        { icon: Layers, label: 'Operações', path: '/operacoes' },
        { icon: Wallet, label: 'Financeiro', path: '/financeiro' },
        { icon: Users, label: 'Clientes', path: '/clientes' },
        { icon: Users, label: 'Pessoas', path: '/pessoas' },
        { icon: Shield, label: 'Auditoria', path: '/auditoria' },
        { icon: Settings, label: 'Configurações', path: '/config' },
    ];

    const initials = getInitials(user.name || '');
    const displayName = user.name || 'Admin';
    const displayRole = user.role === 'admin' ? 'Diretor' : 'Colaborador';

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    {company?.logoUrl ? (
                        <img src={company.logoUrl} alt="Logo" className="company-logo-img" />
                    ) : (
                        <span className="logo-icon">YF</span>
                    )}
                    <span className="logo-text">{company?.name || 'Consultoria'}</span>
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
