import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { api } from '../../services/api';
import './MainLayout.css';

const MainLayout = () => {
    useEffect(() => {
        const applyBranding = async () => {
            try {
                const company = await api.company.get();
                if (company?.primaryColor) {
                    document.documentElement.style.setProperty('--color-primary', company.primaryColor);
                    // Generate a slightly lighter version for hover states
                    document.documentElement.style.setProperty('--color-primary-light', `${company.primaryColor}dd`);
                }
            } catch (error) {
                console.error('Failed to load branding', error);
            }
        };
        applyBranding();
    }, []);

    return (
        <div className="main-layout">
            <Sidebar />
            <main className="main-content">
                <header className="top-header">
                    <div className="date-display">
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </header>
                <div className="content-scroll">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
