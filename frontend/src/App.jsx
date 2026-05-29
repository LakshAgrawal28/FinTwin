import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Simulator from './pages/Simulator';
import InvestmentManager from './pages/InvestmentManager';
import RebalanceAdvisor from './pages/RebalanceAdvisor';
import Projections from './pages/Projections';
import Navbar from './components/layout/Navbar';

function AppContent() {
  const location = useLocation();
  const showNav = location.pathname !== '/';

  return (
    <>
      {showNav && <Navbar />}
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/twin" element={<Dashboard />} />
        <Route path="/simulator" element={<Simulator />} />
        <Route path="/investments" element={<InvestmentManager />} />
        <Route path="/rebalance" element={<RebalanceAdvisor />} />
        <Route path="/projections" element={<Projections />} />
      </Routes>
    </>
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
