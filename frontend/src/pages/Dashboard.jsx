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
      <div className="min-h-screen bg-[#080C14] text-[#EEF2FF]">
        <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center mt-20">
          <div className="w-12 h-12 border-4 border-[#00E5B8] border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl font-semibold text-[#EEF2FF] mb-8">Your financial twin is being built...</h2>
          <div className="w-full max-w-2xl bg-[#0F1520] p-8 rounded-2xl border border-white/5">
            <LoadingSkeleton rows={5} height={24} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C14] text-[#EEF2FF] font-sans pb-16">
      
      <div className="max-w-[1400px] mx-auto p-[32px]">
        <h1 className="text-2xl font-bold mb-6">Twin Dashboard</h1>
        
        <div className="flex flex-col lg:flex-row gap-[24px]">
          <div className="w-full lg:w-[60%] flex flex-col gap-6">
            <PersonalityCard twinState={twinState} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard 
                label="Portfolio Value"
                value={formatINR(metrics.totalAssets)}
                subtext={`${metrics.gainPct >= 0 ? '+' : ''}${metrics.gainPct.toFixed(1)}% returns`}
                subtextColor={metrics.gainPct >= 0 ? 'green' : 'red'}
              />
              <MetricCard 
                label="Monthly Surplus"
                value={formatINR(metrics.netSurplus)}
                subtext="Available to invest"
                subtextColor={metrics.netSurplus >= 0 ? 'green' : 'red'}
              />
              <MetricCard 
                label="Savings Rate"
                value={`${metrics.savingsRate}%`}
                subtext={Number(metrics.savingsRate) >= 25 ? '↑ above 25% target' : '↓ below 25% target'}
                subtextColor={Number(metrics.savingsRate) >= 25 ? 'green' : 'amber'}
              />
              <MetricCard 
                label="Retirement Corpus (Age 60)"
                value={`₹${(metrics.futureCorpus / 10000000).toFixed(2)} Cr`}
                subtext={`In ${metrics.yearsToRetirement} years at 12% p.a.`}
                subtextColor="green"
              />
            </div>

            {/* Milestone Tracker */}
            <div className="bg-[#0F1520] border border-white/5 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <h3 className="text-[14px] text-[#EEF2FF] font-semibold">Milestone Tracker</h3>
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
                          <p className="text-[13px] font-semibold text-[#EEF2FF]">Emergency Fund</p>
                          <p className="text-[11px] text-[#566580]">6 months of expenses</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[13px] font-bold ${isEmergReady ? 'text-[#00E5B8]' : 'text-[#F5A623]'}`}>
                            {formatINR(currentSavings)} / {formatINR(targetEmergency)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-[#1A2235] rounded-full overflow-hidden">
                        <div className={`h-full ${isEmergReady ? 'bg-[#00E5B8]' : 'bg-[#F5A623]'} rounded-full`} style={{ width: `${emergencyPct}%` }}></div>
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
                          <p className="text-[13px] font-semibold text-[#EEF2FF]">The First Crore</p>
                          <p className="text-[11px] text-[#566580]">Next capital milestone</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[13px] font-bold text-[#8B7FFF]">
                            {formatINR(currentPort)} / {formatINR(targetMilestone)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-[#1A2235] rounded-full overflow-hidden">
                        <div className="h-full bg-[#8B7FFF] rounded-full" style={{ width: `${milestonePct}%` }}></div>
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
                          <p className="text-[13px] font-semibold text-[#EEF2FF]">Retirement Timeline</p>
                          <p className="text-[11px] text-[#566580]">Target Age {targetAge}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[13px] font-bold text-[#00E5B8]">
                            {Math.max(0, targetAge - currentAge)} years to go
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-[#1A2235] rounded-full overflow-hidden">
                        <div className="h-full bg-[#00E5B8] rounded-full" style={{ width: `${retirementPct}%` }}></div>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
            <HealthScore />
          </div>

          <div className="w-full lg:w-[40%] flex flex-col gap-6">
            <div className="bg-[#0F1520] rounded-2xl p-6 border border-white/5 shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-[#22D3A5] animate-pulse"></div>
                <h2 className="text-[#00E5B8] text-[11px] uppercase tracking-widest font-bold">Live Financial Snapshot</h2>
              </div>

              <div className="space-y-4 text-[14px]">
                <div className="flex justify-between">
                  <span className="text-[#566580]">Monthly Income</span>
                  <span className="text-[#EEF2FF] font-medium">{formatINR(metrics.income)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#566580]">Fixed Expenses</span>
                  <span className="text-[#FF4D4D] font-medium">-{formatINR(metrics.fixedExpenses)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#566580]">Variable Spend</span>
                  <span className="text-[#F5A623] font-medium">-{formatINR(metrics.variableSpend)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#566580]">EMIs</span>
                  <span className="text-[#F5A623] font-medium">-{formatINR(metrics.emis)}</span>
                </div>
                
                <div className="border-b border-white/5 my-2"></div>
                
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#EEF2FF] font-semibold">Net Surplus</span>
                  <span className={`font-bold text-[16px] ${metrics.netSurplus >= 0 ? 'text-[#00E5B8]' : 'text-[#FF4D4D]'}`}>{formatINR(metrics.netSurplus)}</span>
                </div>

                <div className="border-b border-white/5 my-2"></div>

                <div className="flex justify-between">
                  <span className="text-[#566580]">Equity Portfolio</span>
                  <span className="text-[#EEF2FF] font-medium">{formatINR(metrics.assetBreakdown.Equity)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#566580]">Debt Portfolio</span>
                  <span className="text-[#EEF2FF] font-medium">{formatINR(metrics.assetBreakdown.Debt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#566580]">Gold</span>
                  <span className="text-[#EEF2FF] font-medium">{formatINR(metrics.assetBreakdown.Gold)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#566580] flex items-center gap-2">Crypto <div className="w-1.5 h-1.5 rounded-full bg-[#FF4D4D]"></div></span>
                  <span className="text-[#EEF2FF] font-medium">{formatINR(metrics.assetBreakdown.Crypto)}</span>
                </div>

                <div className="border-b border-white/5 my-2"></div>
                
                <div className="flex justify-between">
                  <span className="text-[#566580]">Total Invested</span>
                  <span className="text-[#EEF2FF] font-medium">{formatINR(metrics.totalInvested)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#EEF2FF] font-semibold">Current Value</span>
                  <span className="text-[#22D3A5] font-bold text-[16px]">{formatINR(metrics.totalAssets)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-[#566580]">Total Returns</span>
                  <span className="text-[#22D3A5] font-semibold text-[13px] bg-[#22D3A5]/10 px-2 py-0.5 rounded">
                    {metrics.totalGain >= 0 ? '+' : ''}{formatINR(metrics.totalGain)} ({metrics.gainPct >= 0 ? '+' : ''}{metrics.gainPct.toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => navigate('/simulator')}
                className="w-full bg-[#00E5B8] hover:bg-[#00C29A] text-[#080C14] font-bold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
              >
                Run Simulation <span className="text-lg">→</span>
              </button>
              <button 
                onClick={() => navigate('/')}
                className="w-full bg-transparent border border-[#566580] hover:border-[#8A9BBF] text-[#EEF2FF] hover:bg-white/5 font-semibold py-4 px-6 rounded-xl transition-all duration-200"
              >
                Update Twin Data
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
