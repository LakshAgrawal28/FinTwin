import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTwinStore } from '../store';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import MetricCard from '../components/shared/MetricCard';
import PersonalityCard from '../components/twin/PersonalityCard';
import HealthScore from '../components/twin/HealthScore';
import ReportModal from '../components/shared/ReportModal';
import { formatINR } from '../utils/formatCurrency';

export default function Dashboard() {
  const navigate = useNavigate();
  const twinState = useTwinStore((state) => state.twinState);
  const rawUserProfile = useTwinStore((state) => state.userProfile);
  const rawPortfolio = useTwinStore((state) => state.portfolio);
  const simulationResult = useTwinStore((state) => state.simulationResult);
  const healthScore = useTwinStore((state) => state.healthScore);

  const setPortfolio = useTwinStore((state) => state.setPortfolio);

  const userProfile = useMemo(() => rawUserProfile || {}, [rawUserProfile]);
  const portfolio = useMemo(() => rawPortfolio || [], [rawPortfolio]);

  // Load portfolio if missing
  React.useEffect(() => {
    if (portfolio.length === 0) {
      import('../utils/api').then(m => m.postPortfolio(userProfile)).then(res => {
        if (res && res.holdings) setPortfolio(res.holdings);
      });
    }
  }, [portfolio.length, setPortfolio]);


  // Computed values from store (Upgrade 10 — replace hardcoded)
  const metrics = useMemo(() => {
    const income = Number(userProfile.monthlyIncome || userProfile.income || 0);
    const fixedExpenses = Number(userProfile.monthlyExpenses || userProfile.expenses || 0);
    const variableSpend = Number(userProfile.variableSpend || 0);
    const emis = Number(userProfile.monthlyEMI || userProfile.emi || 0);
    const totalExpenses = fixedExpenses + variableSpend + emis;
    const netSurplus = income - totalExpenses;
    const savingsRate = income > 0 ? ((netSurplus / income) * 100).toFixed(1) : '0.0';
    const netWorth = Number(twinState?.estimatedNetWorth || userProfile.portfolioValue || 0);
    const portfolioValue = Number(userProfile.portfolioValue || 0);

    // Compute from actual portfolio if loaded
    const totalAssets = portfolio.length > 0
      ? portfolio.reduce((s, a) => s + (a.currentValue || 0), 0)
      : portfolioValue;

    const totalInvested = portfolio.length > 0
      ? portfolio.reduce((s, a) => s + (a.costBasis || 0), 0)
      : portfolioValue * 0.76;

    const totalGain = totalAssets - totalInvested;
    const gainPct = totalInvested > 0 ? ((totalGain / totalInvested) * 100) : 0;

    // Asset breakdown from actual portfolio
    const assetBreakdown = { Equity: 0, Debt: 0, Gold: 0, Crypto: 0 };
    if (portfolio.length > 0) {
      portfolio.forEach(item => {
        if (Object.prototype.hasOwnProperty.call(assetBreakdown, item.type)) {
          assetBreakdown[item.type] += item.currentValue || 0;
        }
      });
    } else {
      assetBreakdown.Equity = portfolioValue * 0.7;
      assetBreakdown.Debt = portfolioValue * 0.2;
      assetBreakdown.Gold = portfolioValue * 0.05;
      assetBreakdown.Crypto = portfolioValue * 0.05;
    }

    const monthlyInvestment = Number(userProfile.monthlyInvestment || 0);

    // Projected corpus at 60
    const age = Number(userProfile.age) || 30;
    const yearsToRetirement = Math.max(0, 60 - age);
    const months = yearsToRetirement * 12;
    // Removed unused 'r' variable
    const futureCorpus = totalAssets * Math.pow(1.01, months) +
      monthlyInvestment * ((Math.pow(1.01, months) - 1) / 0.01);

    return {
      income, fixedExpenses, variableSpend, emis, totalExpenses,
      netSurplus, savingsRate, netWorth, portfolioValue,
      totalAssets, totalInvested, totalGain, gainPct,
      assetBreakdown, monthlyInvestment,
      futureCorpus, yearsToRetirement
    };
  }, [userProfile, twinState, portfolio]);

  if (!twinState) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-50">
        <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center mt-20">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl font-semibold text-slate-100 mb-8">Compiling Institutional Profile...</h2>
          <div className="w-full max-w-2xl bg-slate-800 p-8 rounded border border-slate-700">
            <LoadingSkeleton rows={5} height={24} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans pb-16">
      
      <div className="w-full px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-50">Overview</h1>
            <p className="text-sm text-slate-400 mt-1">Institutional Financial Terminal</p>
          </div>
        </div>

        {twinState?.isSandboxMode && (
          <div className="w-full bg-rose-900/20 border border-rose-500/50 rounded p-4 mb-6 flex items-center gap-3">
            <span className="text-rose-500">⚠</span>
            <p className="text-rose-400 text-sm font-medium">
              SYSTEM OFFLINE: Connection to quantitative backend lost. Displaying cached data.
            </p>
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-[65%] flex flex-col gap-6">
            <PersonalityCard twinState={twinState} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard 
                label="Portfolio Value"
                value={formatINR(metrics.totalAssets)}
                subtext={`${metrics.gainPct >= 0 ? '+' : ''}${metrics.gainPct.toFixed(1)}% returns`}
                subtextColor={metrics.gainPct >= 0 ? 'emerald' : 'rose'}
              />
              <MetricCard 
                label="Monthly Surplus"
                value={formatINR(metrics.netSurplus)}
                subtext="Available to invest"
                subtextColor={metrics.netSurplus >= 0 ? 'emerald' : 'rose'}
              />
              <MetricCard 
                label="Savings Rate"
                value={`${metrics.savingsRate}%`}
                subtext={Number(metrics.savingsRate) >= 25 ? '↑ above 25% target' : '↓ below 25% target'}
                subtextColor={Number(metrics.savingsRate) >= 25 ? 'emerald' : 'amber'}
              />
              <MetricCard 
                label="Retirement Corpus (Age 60)"
                value={`₹${(metrics.futureCorpus / 10000000).toFixed(2)} Cr`}
                subtext={`In ${metrics.yearsToRetirement} years at 12% p.a.`}
                subtextColor="emerald"
              />
            </div>

            {/* Milestone Tracker */}
            <div className="bg-slate-800 border border-slate-700 rounded p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <h3 className="text-sm text-slate-100 font-semibold tracking-wide uppercase">Strategic Milestones</h3>
              </div>
              <div className="space-y-6">
                
                {/* Emergency Fund */}
                {(() => {
                  const targetEmergency = metrics.totalExpenses * 6;
                  const currentSavings = Number(userProfile.savingsAmount) || 0;
                  const emergencyPct = Math.min(100, targetEmergency > 0 ? (currentSavings / targetEmergency) * 100 : 0);
                  const isEmergReady = emergencyPct >= 100;
                  return (
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <p className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Emergency Fund</p>
                          <p className="text-[11px] text-slate-400">6 months of expenses</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-bold ${isEmergReady ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {formatINR(currentSavings)} / {formatINR(targetEmergency)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded overflow-hidden">
                        <div className={`h-full ${isEmergReady ? 'bg-emerald-500' : 'bg-amber-500'} rounded`} style={{ width: `${emergencyPct}%` }}></div>
                      </div>
                    </div>
                  );
                })()}

                {/* First Crore or Next Milestone */}
                {(() => {
                  const targetMilestone = 10000000; // 1 Crore
                  const currentPort = metrics.totalAssets;
                  const milestonePct = Math.min(100, targetMilestone > 0 ? (currentPort / targetMilestone) * 100 : 0);
                  return (
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <p className="text-xs font-semibold text-slate-200 uppercase tracking-wider">The First Crore</p>
                          <p className="text-[11px] text-slate-400">Next capital milestone</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-blue-500">
                            {formatINR(currentPort)} / {formatINR(targetMilestone)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded overflow-hidden">
                        <div className="h-full bg-blue-500 rounded" style={{ width: `${milestonePct}%` }}></div>
                      </div>
                    </div>
                  );
                })()}

                {/* Time to Retirement */}
                {(() => {
                  const targetAge = Number(userProfile.retirementAge) || 60;
                  const currentAge = Number(userProfile.age) || 30;
                  const retirementPct = Math.max(0, Math.min(100, ((currentAge - 20) / (targetAge - 20)) * 100)); // Assuming start at 20 loosely
                  return (
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <p className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Retirement Horizon</p>
                          <p className="text-[11px] text-slate-400">Target Age {targetAge}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-500">
                            {Math.max(0, targetAge - currentAge)} years to go
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded" style={{ width: `${retirementPct}%` }}></div>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
            <HealthScore />
          </div>

          <div className="w-full lg:w-[35%] flex flex-col gap-6">
            <div className="bg-slate-800 rounded p-6 border border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <h2 className="text-slate-300 text-xs uppercase tracking-widest font-semibold">Live Snapshot</h2>
              </div>

              <div className="space-y-4 text-sm font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-400">Monthly Income</span>
                  <span className="text-slate-50">{formatINR(metrics.income)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fixed Expenses</span>
                  <span className="text-rose-500">-{formatINR(metrics.fixedExpenses)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Variable Spend</span>
                  <span className="text-amber-500">-{formatINR(metrics.variableSpend)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">EMIs</span>
                  <span className="text-amber-500">-{formatINR(metrics.emis)}</span>
                </div>
                
                <div className="border-b border-slate-700 my-2"></div>
                
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-200">Net Surplus</span>
                  <span className={`font-bold text-base ${metrics.netSurplus >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatINR(metrics.netSurplus)}</span>
                </div>

                <div className="border-b border-slate-700 my-2"></div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Equity Portfolio</span>
                  <span className="text-slate-50">{formatINR(metrics.assetBreakdown.Equity)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Debt Portfolio</span>
                  <span className="text-slate-50">{formatINR(metrics.assetBreakdown.Debt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gold</span>
                  <span className="text-slate-50">{formatINR(metrics.assetBreakdown.Gold)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-2">Crypto</span>
                  <span className="text-slate-50">{formatINR(metrics.assetBreakdown.Crypto)}</span>
                </div>

                <div className="border-b border-slate-700 my-2"></div>
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Invested</span>
                  <span className="text-slate-50">{formatINR(metrics.totalInvested)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-200">Current Value</span>
                  <span className="text-blue-500 font-bold text-base">{formatINR(metrics.totalAssets)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Total Returns</span>
                  <span className="text-emerald-500 font-semibold text-xs bg-emerald-900/30 px-2 py-0.5 rounded">
                    {metrics.totalGain >= 0 ? '+' : ''}{formatINR(metrics.totalGain)} ({metrics.gainPct >= 0 ? '+' : ''}{metrics.gainPct.toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => navigate('/simulator')}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded transition-colors duration-200 flex items-center justify-center gap-2"
              >
                Launch Quant Simulator <span className="text-lg">→</span>
              </button>
              <button 
                onClick={() => navigate('/')}
                className="w-full bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium py-3 px-6 rounded transition-all duration-200"
              >
                Reconfigure Parameters
              </button>
            </div>

            {/* Report Generation */}
            <ReportModal
              profile={userProfile}
              portfolio={portfolio}
              simulationResult={simulationResult}
              healthScore={healthScore}
            />
            
          </div>
        </div>
      </div>
    </div>
  );
}
