import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import KPIs from './pages/KPIs';
import Financeiro from './pages/Financeiro';
import Pessoas from './pages/Pessoas';
import Alertas from './pages/Alertas';
import Relatorios from './pages/Relatorios';
import Empresa from './pages/Empresa';
import Config from './pages/Config';
import Processos from './pages/Processos';
import Operacao from './pages/Operacao';
import Fluxos from './pages/Fluxos';
import Clientes from './pages/Clientes';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="kpis" element={<KPIs />} />
          <Route path="financeiro" element={<Financeiro />} />
          <Route path="pessoas" element={<Pessoas />} />
          <Route path="alertas" element={<Alertas />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="empresa" element={<Empresa />} />
          <Route path="processos" element={<Processos />} />
          <Route path="operacao" element={<Operacao />} />
          <Route path="fluxos" element={<Fluxos />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="config" element={<Config />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
