import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Simulator from './pages/Simulator';
import InvestmentManager from './pages/InvestmentManager';
import RebalanceAdvisor from './pages/RebalanceAdvisor';
import Projections from './pages/Projections';
import TaxOptimizer from './pages/TaxOptimizer';
import Methodology from './pages/Methodology';
import Sidebar from './components/layout/Sidebar';

function AppContent() {
  const location = useLocation();
  const showNav = location.pathname !== '/';

  return (
    <div className="flex bg-slate-900 min-h-screen">
      {showNav && <Sidebar />}
      <main className={`flex-1 ${showNav ? 'md:ml-64' : ''} bg-slate-900`}>
        <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route path="/twin" element={<Dashboard />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/investments" element={<InvestmentManager />} />
          <Route path="/rebalance" element={<RebalanceAdvisor />} />
          <Route path="/projections" element={<Projections />} />
          <Route path="/tax" element={<TaxOptimizer />} />
          <Route path="/methodology" element={<Methodology />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
