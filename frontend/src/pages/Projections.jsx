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
      <div className="min-h-screen bg-[#080C14] text-[#EEF2FF] font-sans pb-16">

        <div className="max-w-[1400px] mx-auto p-[32px]">
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
    <div className="min-h-screen bg-[#080C14] text-[#EEF2FF] font-sans pb-16">

      <div className="max-w-[1400px] mx-auto p-[32px]">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Return Projections</h1>
            <p className="text-[#566580] text-sm mt-1">20-year probabilistic decay and performance modelling.</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <span className={`text-[12px] ${inflationAdjusted ? 'text-[#00E5B8]' : 'text-[#566580]'}`}>Inflation adjusted</span>
              <input type="checkbox" checked={inflationAdjusted} onChange={() => setInflationAdjusted(!inflationAdjusted)} className="accent-[#00E5B8]" />
            </label>
            <div className="bg-[#1A2235] rounded-lg border border-white/5 flex overflow-hidden">
              {[10, 20].map(y => (
                <button 
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-4 py-1.5 text-[12px] font-semibold transition-colors ${selectedYear === y ? 'bg-[#00E5B8] text-[#080C14]' : 'text-[#8A9BBF] hover:bg-white/5'}`}
                >{y}Y</button>
              ))}
            </div>
            <button className="bg-transparent border border-[#566580] text-[#EEF2FF] hover:bg-white/5 px-4 py-1.5 text-[12px] font-semibold rounded-lg transition-colors">Export</button>
          </div>
        </div>

        {/* Current Portfolio Chart Card */}
        <div className="bg-[#0F1520] border border-white/5 rounded-2xl p-8 shadow-xl">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-[#EEF2FF] font-semibold">Current Portfolio Projection</h2>
            <div className="flex gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-[#566580] font-bold uppercase tracking-wider">Median Year {selectedYear}</span>
                <span className="text-[16px] text-[#00E5B8] font-bold">{formatINR(currentP50)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-[#566580] font-bold uppercase tracking-wider">Worst Case</span>
                <span className="text-[16px] text-[#FF4D4D] font-bold">{formatINR(currentP10)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-[#566580] font-bold uppercase tracking-wider">Best Case</span>
                <span className="text-[16px] text-[#22D3A5] font-bold">{formatINR(currentP90)}</span>
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <PercentileBandsChart data={current} dangerZoneThreshold={5000000} maxYears={selectedYear} inflationFactor={inflationAdjusted ? 1.06 : null} />
          </div>
        </div>

        {/* Alpha Delta Divider */}
        <div className="flex items-center gap-4 my-2">
          <div className="h-[1px] bg-white/5 flex-1"></div>
          <div className="text-[12px] text-[#00E5B8] bg-[#00E5B8]/10 px-4 py-1.5 rounded-full border border-[#00E5B8]/20 font-bold tracking-wider whitespace-nowrap">
            {rebP50 - currentP50 >= 0 ? '+' : ''}{formatINR(rebP50 - currentP50)} ALPHA DELTA BY YEAR {selectedYear}
          </div>
          <div className="h-[1px] bg-white/5 flex-1"></div>
        </div>

        {/* After Rebalancing Chart Card */}
        <div className="bg-[#0F1520] border border-white/5 rounded-2xl p-8 shadow-xl">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-[#EEF2FF] font-semibold">After Rebalancing</h2>
            <div className="flex gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-[#566580] font-bold uppercase tracking-wider">Median Year {selectedYear}</span>
                <span className="text-[16px] text-[#00E5B8] font-bold">{formatINR(rebP50)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-[#566580] font-bold uppercase tracking-wider">Worst Case</span>
                <span className="text-[16px] text-[#FF4D4D] font-bold">{formatINR(rebP10)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-[#566580] font-bold uppercase tracking-wider">Best Case</span>
                <span className="text-[16px] text-[#22D3A5] font-bold">{formatINR(rebP90)}</span>
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <PercentileBandsChart data={rebalanced} dangerZoneThreshold={5000000} maxYears={selectedYear} inflationFactor={inflationAdjusted ? 1.06 : null} />
          </div>
        </div>

        {/* Year Slider */}
        <div className="bg-[#0F1520] border border-white/5 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] text-[#566580] font-bold uppercase tracking-wider">Selected Horizon</span>
            <span className="text-[13px] text-[#00E5B8] font-bold">Year {selectedYear}</span>
          </div>
          <input 
            type="range" min="1" max="20" step="1" 
            value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="w-full accent-[#00E5B8] h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-[#566580] mt-2 font-bold px-1">
            <span>Y1</span><span>Y5</span><span>Y10</span><span>Y15</span><span>Y20</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="bg-[#0F1520] border border-white/5 rounded-2xl p-6 shadow-lg">
            <h3 className="text-[12px] uppercase tracking-widest text-[#00E5B8] font-bold mb-4">Assumptions</h3>
            <ul className="text-[13px] text-[#8A9BBF] space-y-2 list-disc pl-4">
              <li>Equity CAGR bounds: 10% (σ: 15%)</li>
              <li>Debt bounds: 7% (σ: 3%)</li>
              <li>Gold hedge proxy: 8.5% (σ: 12%)</li>
              <li>Contributions step-up: 5.0% annually</li>
              <li>Stochastic iterations run: 1,000 paths</li>
            </ul>
          </div>
          
          <div className="bg-[#0F1520] border border-white/5 rounded-2xl p-6 shadow-lg">
            <h3 className="text-[12px] uppercase tracking-widest text-[#00E5B8] font-bold mb-4">AI Summary</h3>
            <ul className="text-[13px] text-[#8A9BBF] space-y-3 list-disc pl-4">
              <li>The target asset allocation significantly compresses downside volatility limits.</li>
              <li>Removing Crypto ensures probability-zero out outcomes vanish prior to Year 7.</li>
              <li>Compounding alpha begins accelerating visibly past the 5-year mark vs the benchmark holding.</li>
            </ul>
          </div>
          
          <div className="bg-[#0F1520] border border-white/5 rounded-2xl p-6 shadow-lg">
            <h3 className="text-[12px] uppercase tracking-widest text-[#00E5B8] font-bold mb-4">Milestone Probabilities</h3>
            <div className="space-y-4">
              {milestones?.map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[11px] font-semibold text-[#EEF2FF] mb-1.5">
                    <span>{m.label}</span>
                    <span className="text-[#22D3A5]">{m.probRebalanced?.toFixed(1)}% <span className="text-[#566580] text-[10px] ml-1 font-normal">(was {m.probCurrent?.toFixed(1)}%)</span></span>
                  </div>
                  <div className="h-[4px] w-full bg-[#1A2235] rounded-full overflow-hidden">
                    <div className="h-full bg-[#00E5B8] rounded-full" style={{ width: `${m.probRebalanced}%` }}></div>
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
