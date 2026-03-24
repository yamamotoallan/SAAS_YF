import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Financeiro from './pages/Financeiro';
import Pessoas from './pages/Pessoas';
import Config from './pages/Config';
import Clientes from './pages/Clientes';
import ClienteDetail from './pages/ClienteDetail';
import Performance from './pages/Performance';
import Inteligencia from './pages/Inteligencia';
import Operacoes from './pages/Operacoes';
import Auditoria from './pages/Auditoria';
import { Navigate } from 'react-router-dom';

import PrivateRoute from './components/Layout/PrivateRoute';

import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            
            {/* New Wrapper Pages */}
            <Route path="performance" element={<Performance />} />
            <Route path="inteligencia" element={<Inteligencia />} />
            <Route path="operacoes" element={<Operacoes />} />
            
            {/* Kept Individual Pages */}
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="pessoas" element={<Pessoas />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="clientes/:id" element={<ClienteDetail />} />
            <Route path="config" element={<Config />} />
            <Route path="auditoria" element={<Auditoria />} />

            {/* Redirects for merged/old routes */}
            <Route path="kpis" element={<Navigate to="/performance" replace />} />
            <Route path="metas" element={<Navigate to="/performance" replace />} />
            <Route path="mente-ceo" element={<Navigate to="/inteligencia" replace />} />
            <Route path="alertas" element={<Navigate to="/inteligencia" replace />} />
            <Route path="relatorios" element={<Navigate to="/inteligencia" replace />} />
            <Route path="fluxos" element={<Navigate to="/operacoes" replace />} />
            <Route path="operacao" element={<Navigate to="/operacoes" replace />} />
            <Route path="processos" element={<Navigate to="/operacoes" replace />} />
            <Route path="empresa" element={<Navigate to="/config" replace />} />
          </Route>
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
