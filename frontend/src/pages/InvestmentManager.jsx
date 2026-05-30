import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useTwinStore } from '../store';
import { postPortfolio, postHealthScore } from '../utils/api';

import MetricCard from '../components/shared/MetricCard';
import Badge from '../components/shared/Badge';
import { formatINR } from '../utils/formatCurrency';

export default function InvestmentManager() {
  const navigate = useNavigate();
  const rawPortfolio = useTwinStore(state => state.portfolio);
  const setPortfolio = useTwinStore(state => state.setPortfolio);
  const userProfile = useTwinStore(state => state.userProfile);
  const healthScore = useTwinStore(state => state.healthScore);
  const setHealthScore = useTwinStore(state => state.setHealthScore);
  const customTargets = useTwinStore(state => state.customTargets);
  const setCustomTargets = useTwinStore(state => state.setCustomTargets);
  
  const portfolio = useMemo(() => rawPortfolio || [], [rawPortfolio]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    if (portfolio.length === 0 && userProfile) {
      postPortfolio(userProfile).then(res => {
        if (res && res.holdings) setPortfolio(res.holdings);
      }).catch(console.error);
    }
  }, [portfolio, userProfile, setPortfolio]);

  useEffect(() => {
    if (portfolio.length > 0 && userProfile) {
      postHealthScore(userProfile, portfolio).then(res => {
        if (res) setHealthScore(res);
      }).catch(err => {
        console.warn("Backend health score API failed, running client-side calculations fallback:", err);
        
        const currentAllocMap = { Equity: 0, Debt: 0, Gold: 0, Crypto: 0 };
        portfolio.forEach(h => currentAllocMap[h.type] = (currentAllocMap[h.type] || 0) + (h.currentValue || 0));
        const totalAllocValue = Object.values(currentAllocMap).reduce((a,b)=>a+b, 0) || 1;
        
        const eqPct = (currentAllocMap.Equity / totalAllocValue) * 100;
        const cryptoPct = (currentAllocMap.Crypto / totalAllocValue) * 100;
        const goldPct = (currentAllocMap.Gold / totalAllocValue) * 100;
        
        let localAdvice = "";
        if (eqPct > 80) {
          localAdvice = `✦ Offline Advisor: Your portfolio has high volatility with ${eqPct.toFixed(0)}% Equity. We recommend allocating 15% towards Debt/Gold to secure gains.`;
        } else if (cryptoPct > 10) {
          localAdvice = `✦ Offline Advisor: High concentration (${cryptoPct.toFixed(0)}%) in Crypto. Consider scaling back below 5% to limit downside shocks.`;
        } else if (goldPct < 5) {
          localAdvice = `✦ Offline Advisor: You have low exposure (${goldPct.toFixed(0)}%) to Gold. Allocating 5-10% in Gold acts as a strong inflation hedge.`;
        } else {
          localAdvice = `✦ Offline Advisor: Your asset mix is well-balanced. Keep up your systematic monthly investments.`;
        }
        
        setHealthScore({
          totalScore: 70,
          grade: 'B',
          aiAdvice: localAdvice,
          breakdown: [
            { category: 'Emergency Fund', score: 15, max: 20, message: 'Offline Mode: Basic Emergency coverage assumed' },
            { category: 'Savings Rate', score: 15, max: 20, message: 'Offline Mode: Moderate savings rate assumed' },
            { category: 'Debt Load', score: 15, max: 20, message: 'Offline Mode: Moderate debt load assumed' },
            { category: 'Insurance', score: 10, max: 20, message: 'Offline Mode: Health insurance active' },
            { category: 'Asset Mix & Risk', score: 15, max: 20, message: 'Offline Mode: Standard allocation', metrics: { concentrationRisk: 30, volatilityRisk: Math.round(eqPct), liquidityRisk: 20 } }
          ]
        });
      });
    }
  }, [portfolio, userProfile, setHealthScore]);

  const filteredPortfolio = portfolio.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.fundHouse.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalInvested = portfolio.reduce((s, i) => s + (i.costBasis || 0), 0);
  const currentValue = portfolio.reduce((s, i) => s + (i.currentValue || 0), 0);
  
  const currentAllocMap = { Equity: 0, Debt: 0, Gold: 0, Crypto: 0 };
  portfolio.forEach(h => currentAllocMap[h.type] = (currentAllocMap[h.type] || 0) + (h.currentValue || 0));
  const totalAllocValue = Object.values(currentAllocMap).reduce((a,b)=>a+b, 0) || 1;
  
  const currentAlloc = [
    { name: 'Equity', value: Math.round((currentAllocMap.Equity / totalAllocValue)*100), color: '#3B82F6' },
    { name: 'Debt', value: Math.round((currentAllocMap.Debt / totalAllocValue)*100), color: '#10B981' },
    { name: 'Gold', value: Math.round((currentAllocMap.Gold / totalAllocValue)*100), color: '#F59E0B' },
    { name: 'Crypto', value: Math.round((currentAllocMap.Crypto / totalAllocValue)*100), color: '#EF4444' }
  ].filter(a => a.value > 0);

  const age = Number(userProfile?.age) || 30;
  const drive = userProfile?.emotionalChoice || 'Balance';

  // Calculate default targets adjusted for risk drive
  let defaultEquity = Math.max(10, 100 - age);
  let defaultGold = 5;

  if (drive === 'Security') {
    defaultEquity = Math.max(10, defaultEquity - 15);
  } else if (drive === 'Growth') {
    defaultEquity = Math.min(90, defaultEquity + 15);
  } else if (drive === 'Independence') {
    defaultEquity = Math.min(85, defaultEquity + 10);
  }

  const defaultDebt = Math.max(5, 100 - defaultEquity - defaultGold);

  const targets = useMemo(() => {
    if (customTargets) return customTargets;
    return { Equity: defaultEquity, Debt: defaultDebt, Gold: defaultGold, Crypto: 0 };
  }, [customTargets, defaultEquity, defaultDebt, defaultGold]);

  const recommendedAlloc = useMemo(() => [
    { name: 'Equity', value: targets.Equity, color: '#3B82F6' },
    { name: 'Debt', value: targets.Debt, color: '#10B981' },
    { name: 'Gold', value: targets.Gold, color: '#F59E0B' },
    { name: 'Crypto', value: targets.Crypto, color: '#EF4444' }
  ], [targets]);

  const handleTargetChange = (assetClass, newValue) => {
    const clampedValue = Math.max(0, Math.min(100, newValue));
    const otherClasses = Object.keys(targets).filter(c => c !== assetClass);
    const sumOthers = otherClasses.reduce((sum, c) => sum + targets[c], 0);
    const remaining = 100 - clampedValue;

    const newTargets = { ...targets };
    newTargets[assetClass] = clampedValue;

    if (sumOthers > 0) {
      otherClasses.forEach(c => {
        newTargets[c] = Math.round((targets[c] / sumOthers) * remaining);
      });
    } else {
      otherClasses.forEach((c, idx) => {
        newTargets[c] = idx === 0 ? remaining : 0;
      });
    }

    const finalSum = Object.values(newTargets).reduce((a, b) => a + b, 0);
    if (finalSum !== 100) {
      const diff = 100 - finalSum;
      const largestClass = otherClasses.find(c => newTargets[c] > 0) || otherClasses[0];
      newTargets[largestClass] = Math.max(0, newTargets[largestClass] + diff);
    }

    setCustomTargets(newTargets);
  };

  const riskMetrics = healthScore?.breakdown?.find(b => b.category === 'Asset Mix & Risk')?.metrics || 
                      { concentrationRisk: 30, volatilityRisk: 50, liquidityRisk: 20 };
  const riskScore = Math.max(0, Math.round(100 - (riskMetrics.concentrationRisk * 0.4 + riskMetrics.volatilityRisk * 0.4 + riskMetrics.liquidityRisk * 0.2)));
  const riskLabel = riskScore > 80 ? 'Conservative' : riskScore > 60 ? 'Moderate' : 'Aggressive';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16">

      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Investment Manager</h1>
            <p className="text-slate-400 text-sm mt-1">Review your holdings and asset mix.</p>
          </div>
          <button 
            onClick={() => navigate('/rebalance')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded transition-colors duration-200 flex items-center gap-2"
          >
            AI Rebalance →
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard label="Total Invested" value={formatINR(totalInvested || 0)} />
          <MetricCard label="Current Value" value={formatINR(currentValue || 0)} subtext={currentValue > totalInvested ? `+${formatINR(currentValue - totalInvested)}` : `${formatINR(currentValue - totalInvested)}`} subtextColor={currentValue >= totalInvested ? "green" : "red"} />
          <MetricCard label="XIRR" value="~12.4%" subtext="Estimated" subtextColor="green" />
          <MetricCard label="Risk Score" value={`${riskScore} / 100`} subtext={riskLabel} subtextColor={riskScore > 60 ? "green" : "amber"} />
        </div>

        <div className="flex flex-col lg:flex-row gap-[24px] items-start">
          {/* Left Column 58% */}
          <div className="w-full lg:w-[58%] border border-slate-700 bg-slate-800 rounded p-6 shadow-sm gap-6 flex flex-col">
            <div className="flex justify-between items-center bg-slate-700/50 p-2 rounded border border-slate-600">
              <input 
                type="text" 
                placeholder="Search holdings..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-slate-100 px-4 w-1/3 placeholder-slate-400"
              />
              <div className="flex gap-2">
                {['All', 'Equity', 'Debt', 'Gold', 'Crypto'].map(f => (
                  <button 
                    key={f} 
                    onClick={() => setFilterType(f)}
                    className={`px-4 py-1.5 rounded text-xs font-semibold transition-colors ${filterType === f ? 'bg-blue-600 text-white' : 'bg-transparent text-slate-400 hover:text-slate-100'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-700/50 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-600">
                    <th className="py-3 px-4 font-semibold">Asset</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold text-right">Value</th>
                    <th className="py-3 px-4 font-semibold text-center">Alloc%</th>
                    <th className="py-3 px-4 font-semibold text-right">CAGR</th>
                    <th className="py-3 px-4 font-semibold">Health</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPortfolio.map((item, i) => {
                    const cVal = item.currentValue || 0;
                    const bVal = item.costBasis || cVal;
                    const fallbackCagr = bVal > 0 ? ((cVal / bVal) - 1) * 100 : 0;
                    const cagr = item.cagr ?? Math.round(fallbackCagr * 10) / 10;
                    
                    const allocPct = item.allocation ?? Math.round((cVal / totalAllocValue) * 100);
                    let health = item.health;
                    if (!health) {
                      health = allocPct > 40 ? 'Overexposed' : allocPct > 25 ? 'Concentrated' : 'Optimal';
                    }

                    const healthColor = health === 'Overexposed' ? '#EF4444' : health === 'Concentrated' ? '#F59E0B' : '#10B981';
                    const cagrColor = cagr > 12 ? '#10B981' : cagr >= 7 ? '#F59E0B' : '#EF4444';
                    
                    return (
                      <tr key={item.id || i} className={`border-b border-slate-700 transition-colors hover:bg-slate-700/30 ${health === 'Overexposed' ? 'bg-red-500/5' : ''}`} style={{ borderLeft: health === 'Overexposed' ? '2px solid #EF4444' : health === 'Concentrated' ? '2px solid #F59E0B' : '2px solid transparent' }}>
                        <td className="py-4 px-4">
                          <div className="text-sm text-slate-100 font-medium">{item.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{item.fundHouse || 'Direct'}</div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge type={item.type.toLowerCase()} label={item.type} />
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="text-sm text-slate-100 font-semibold">{formatINR(cVal)}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs text-slate-400 font-medium">{allocPct}%</span>
                            <div className="w-12 h-1 bg-slate-600 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${allocPct}%`, backgroundColor: currentAlloc.find(a => a.name === item.type)?.color || '#3B82F6' }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="text-sm font-bold" style={{ color: cagrColor }}>{cagr}%</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: healthColor }}></div>
                            <span className="text-xs text-slate-400 font-medium">{health}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPortfolio.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400 text-sm">No holdings found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column 42% */}
          <div className="w-full lg:w-[42%] flex flex-col gap-6">
            
            {/* Asset Allocation */}
            <div className="border border-slate-700 bg-slate-800 rounded p-6 shadow-sm">
              <h3 className="text-xs uppercase tracking-widest text-slate-100 font-bold mb-6">Current vs Recommended</h3>
              <div className="flex justify-around items-center h-[140px]">
                <div className="w-[130px] h-[130px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={currentAlloc} innerRadius={45} outerRadius={60} dataKey="value" stroke="none">
                        {currentAlloc.map((e, i) => <Cell key={`cell-${i}`} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs text-slate-400 font-bold">CURRENT</span>
                  </div>
                </div>
                <div className="text-slate-500 text-2xl font-light">→</div>
                <div className="w-[130px] h-[130px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={recommendedAlloc} innerRadius={45} outerRadius={60} dataKey="value" stroke="none">
                        {recommendedAlloc.map((e, i) => <Cell key={`cell-${i}`} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs text-blue-500 font-bold">TARGET</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                {currentAlloc.map(alloc => {
                  const rec = recommendedAlloc.find(r => r.name === alloc.name)?.value || 0;
                  return <Badge key={alloc.name} type={alloc.name.toLowerCase()} label={`${alloc.name.substring(0,2)}: ${alloc.value}% → ${rec}%`} />
                })}
              </div>

              {/* Interactive sliders */}
              <div className="mt-6 border-t border-slate-700 pt-6 space-y-4">
                <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Customize Target Allocation</h4>
                {Object.keys(targets).map(asset => {
                  const val = targets[asset];
                  const color = asset === 'Equity' ? '#3B82F6' : asset === 'Debt' ? '#10B981' : asset === 'Gold' ? '#F59E0B' : '#EF4444';
                  return (
                    <div key={asset} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span style={{ color }}>{asset} Target</span>
                        <span className="text-slate-100">{val}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" step="1"
                        value={val} onChange={e => handleTargetChange(asset, Number(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded appearance-none cursor-pointer"
                        style={{ accentColor: color }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Risk Score */}
            <div className="border border-slate-700 bg-slate-800 rounded p-6 shadow-sm flex flex-col items-center">
              <h3 className="text-sm text-slate-100 font-semibold w-full mb-4">Portfolio Risk Profiler</h3>
              
              <div className="relative w-[200px] h-[100px] flex items-end justify-center mb-2 overflow-hidden">
                <svg viewBox="0 0 200 120" className="w-full">
                  <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="12" strokeLinecap="round" />
                  <path 
                    d="M 20 110 A 80 80 0 0 1 180 110" 
                    fill="none" 
                    stroke="#F59E0B" 
                    strokeWidth="12" 
                    strokeLinecap="round" 
                    strokeDasharray="251.2" 
                    strokeDashoffset="75.36" 
                  />
                </svg>
                <div className="absolute bottom-1 flex flex-col items-center">
                  <span className="text-3xl font-bold text-slate-100">{healthScore?.totalScore || riskScore}</span>
                  <span className="text-xs text-amber-500 font-semibold">{healthScore?.grade ? `Health Grade: ${healthScore.grade}` : riskLabel}</span>
                </div>
              </div>

              <div className="w-full mt-6 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Concentration Risk</span>
                  <span className="text-amber-500 font-semibold">{riskMetrics.concentrationRisk}%</span>
                </div>
                <div className="w-full h-1 bg-slate-700 rounded-full"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${riskMetrics.concentrationRisk}%` }}></div></div>
                
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-slate-400">Volatility Risk</span>
                  <span className="text-amber-500 font-semibold">{riskMetrics.volatilityRisk}%</span>
                </div>
                <div className="w-full h-1 bg-slate-700 rounded-full"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${riskMetrics.volatilityRisk}%` }}></div></div>
                
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-slate-400">Liquidity Risk</span>
                  <span className="text-emerald-500 font-semibold">{riskMetrics.liquidityRisk}%</span>
                </div>
                <div className="w-full h-1 bg-slate-700 rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${riskMetrics.liquidityRisk}%` }}></div></div>
              </div>
            </div>

            {/* AI Quick Insight */}
            <div className="border border-slate-700 bg-slate-800 rounded p-6 shadow-sm">
              <h3 className="text-xs uppercase tracking-widest text-blue-500 font-bold mb-4 flex items-center gap-2">✦ AI Insights</h3>
              {healthScore?.aiAdvice ? (
                <p className="text-sm text-slate-400 leading-relaxed mb-5">{healthScore.aiAdvice}</p>
              ) : (
                <p className="text-sm text-slate-400 mb-5">Analyzing your portfolio...</p>
              )}
              <button 
                onClick={() => navigate('/rebalance')}
                className="text-blue-500 text-sm font-semibold hover:text-blue-400 transition-colors"
              >
                See full rebalance plan →
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
