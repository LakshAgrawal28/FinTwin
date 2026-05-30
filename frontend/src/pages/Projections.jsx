import React, { useEffect, useState, useMemo } from 'react';
import { useTwinStore } from '../store';
import { postProject } from '../utils/api';

import PercentileBandsChart from '../components/simulator/PercentileBandsChart';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import { formatINR } from '../utils/formatCurrency';

export default function Projections() {
  const rawPortfolio = useTwinStore(state => state.portfolio);
  const rawRebalanceActions = useTwinStore(state => state.rebalanceActions);
  const projectionResult = useTwinStore(state => state.projectionResult);
  const setProjectionResult = useTwinStore(state => state.setProjectionResult);
  const userProfile = useTwinStore(state => state.userProfile);

  const portfolio = useMemo(() => rawPortfolio || [], [rawPortfolio]);
  const rebalanceActions = useMemo(() => rawRebalanceActions || [], [rawRebalanceActions]);

  const [selectedYear, setSelectedYear] = useState(10);
  const [inflationAdjusted, setInflationAdjusted] = useState(true);

  useEffect(() => {
    if (!projectionResult && portfolio.length > 0) {
      const rPort = portfolio.map(item => ({ ...item }));
      rebalanceActions.forEach(action => {
        const h = rPort.find(h => h.name === action.assetName);
        if (h) h.currentValue = action.postTradeValue;
      });

      postProject(portfolio, rPort, userProfile).then(res => {
        if (res) setProjectionResult(res);
      }).catch(console.error);
    }
  }, [portfolio, rebalanceActions, projectionResult, setProjectionResult, userProfile]);

  if (!projectionResult) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-50 font-sans pb-16">
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6 md:p-8">
          <LoadingSkeleton rows={8} height={50} />
        </div>
      </div>
    );
  }

  const { current, rebalanced, milestones } = projectionResult;
  const yIndex = Math.min(selectedYear - 1, current.years.length - 1);
  
  const infl = inflationAdjusted ? Math.pow(1.06, selectedYear) : 1;

  const currentP50 = current.p50[yIndex] / infl;
  const currentP10 = current.p10[yIndex] / infl;
  const currentP90 = current.p90[yIndex] / infl;
  
  const rebP50 = rebalanced.p50[yIndex] / infl;
  const rebP10 = rebalanced.p10[yIndex] / infl;
  const rebP90 = rebalanced.p90[yIndex] / infl;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans pb-16">
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-50">Return Projections</h1>
            <p className="text-slate-400 text-sm mt-1">20-year probabilistic decay and performance modelling.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <span className={`text-xs ${inflationAdjusted ? 'text-blue-500' : 'text-slate-400'}`}>Inflation adjusted</span>
              <input type="checkbox" checked={inflationAdjusted} onChange={() => setInflationAdjusted(!inflationAdjusted)} className="accent-blue-600" />
            </label>
            <div className="bg-slate-800 rounded border border-slate-700 flex overflow-hidden">
              {[10, 20].map(y => (
                <button 
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-4 py-1.5 text-xs font-semibold transition-colors ${selectedYear === y ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                >{y}Y</button>
              ))}
            </div>
            <button className="bg-transparent border border-slate-600 text-slate-100 hover:bg-slate-700 px-4 py-1.5 text-xs font-semibold rounded transition-colors">Export</button>
          </div>
        </div>

        {/* Current Portfolio Chart Card */}
        <div className="bg-slate-800 border border-slate-700 rounded p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-slate-100 font-semibold text-lg">Current Portfolio Projection</h2>
            <div className="flex flex-wrap gap-4 md:gap-6 justify-between w-full md:w-auto">
              <div className="flex flex-col items-end">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Median Year {selectedYear}</span>
                <span className="text-base text-blue-500 font-bold">{formatINR(currentP50)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Worst Case</span>
                <span className="text-base text-rose-500 font-bold">{formatINR(currentP10)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Best Case</span>
                <span className="text-base text-emerald-500 font-bold">{formatINR(currentP90)}</span>
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <PercentileBandsChart data={current} dangerZoneThreshold={5000000} maxYears={selectedYear} inflationFactor={inflationAdjusted ? 1.06 : null} />
          </div>
        </div>

        {/* Alpha Delta Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="h-px bg-slate-700 flex-1"></div>
          <div className="text-xs text-blue-500 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20 font-bold tracking-wider whitespace-nowrap">
            {rebP50 - currentP50 >= 0 ? '+' : ''}{formatINR(rebP50 - currentP50)} ALPHA DELTA BY YEAR {selectedYear}
          </div>
          <div className="h-px bg-slate-700 flex-1"></div>
        </div>

        {/* After Rebalancing Chart Card */}
        <div className="bg-slate-800 border border-slate-700 rounded p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-slate-100 font-semibold text-lg">After Rebalancing</h2>
            <div className="flex flex-wrap gap-4 md:gap-6 justify-between w-full md:w-auto">
              <div className="flex flex-col items-end">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Median Year {selectedYear}</span>
                <span className="text-base text-blue-500 font-bold">{formatINR(rebP50)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Worst Case</span>
                <span className="text-base text-rose-500 font-bold">{formatINR(rebP10)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Best Case</span>
                <span className="text-base text-emerald-500 font-bold">{formatINR(rebP90)}</span>
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <PercentileBandsChart data={rebalanced} dangerZoneThreshold={5000000} maxYears={selectedYear} inflationFactor={inflationAdjusted ? 1.06 : null} />
          </div>
        </div>

        {/* Year Slider */}
        <div className="bg-slate-800 border border-slate-700 rounded p-6 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Selected Horizon</span>
            <span className="text-sm text-blue-500 font-bold">Year {selectedYear}</span>
          </div>
          <input 
            type="range" min="1" max="20" step="1" 
            value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="w-full accent-blue-600 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-2 font-bold px-1">
            <span>Y1</span><span>Y5</span><span>Y10</span><span>Y15</span><span>Y20</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="bg-slate-800 border border-slate-700 rounded p-6 shadow-sm">
            <h3 className="text-xs uppercase tracking-widest text-blue-500 font-bold mb-4">Assumptions</h3>
            <ul className="text-sm text-slate-400 space-y-2 list-disc pl-4">
              <li>Equity CAGR bounds: 10% (σ: 15%)</li>
              <li>Debt bounds: 7% (σ: 3%)</li>
              <li>Gold hedge proxy: 8.5% (σ: 12%)</li>
              <li>Contributions step-up: 5.0% annually</li>
              <li>Stochastic iterations run: 1,000 paths</li>
            </ul>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 rounded p-6 shadow-sm">
            <h3 className="text-xs uppercase tracking-widest text-blue-500 font-bold mb-4">AI Summary</h3>
            <ul className="text-sm text-slate-400 space-y-3 list-disc pl-4">
              <li>The target asset allocation significantly compresses downside volatility limits.</li>
              <li>Removing Crypto ensures probability-zero out outcomes vanish prior to Year 7.</li>
              <li>Compounding alpha begins accelerating visibly past the 5-year mark vs the benchmark holding.</li>
            </ul>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 rounded p-6 shadow-sm">
            <h3 className="text-xs uppercase tracking-widest text-blue-500 font-bold mb-4">Milestone Probabilities</h3>
            <div className="space-y-4">
              {milestones?.map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-semibold text-slate-100 mb-1.5">
                    <span>{m.label}</span>
                    <span className="text-emerald-500">{m.probRebalanced?.toFixed(1)}% <span className="text-slate-500 text-[10px] ml-1 font-normal">(was {m.probCurrent?.toFixed(1)}%)</span></span>
                  </div>
                  <div className="h-1 w-full bg-slate-700 rounded overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded transition-all duration-300" style={{ width: `${m.probRebalanced}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
