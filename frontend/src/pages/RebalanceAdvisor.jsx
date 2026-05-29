import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTwinStore } from '../store';
import { postRebalance } from '../utils/api';

import RebalanceStepCard from '../components/rebalance/RebalanceStepCard';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import { formatINR } from '../utils/formatCurrency';

export default function RebalanceAdvisor() {
  const navigate = useNavigate();
  const rawPortfolio = useTwinStore(state => state.portfolio);
  const rawRebalanceActions = useTwinStore(state => state.rebalanceActions);
  const setRebalanceActions = useTwinStore(state => state.setRebalanceActions);

  const portfolio = useMemo(() => rawPortfolio || [], [rawPortfolio]);
  const rebalanceActions = useMemo(() => rawRebalanceActions || [], [rawRebalanceActions]);

  useEffect(() => {
    if (rebalanceActions.length === 0 && portfolio.length > 0) {
      postRebalance(portfolio).then(res => {
        if (res) setRebalanceActions(res);
      }).catch(console.error);
    }
  }, [portfolio, rebalanceActions, setRebalanceActions]);

  const totalSells = rebalanceActions.filter(a => a.action === 'SELL').reduce((s, a) => s + (a.amount || 0), 0);
  const totalBuys = rebalanceActions.filter(a => a.action === 'BUY').reduce((s, a) => s + (a.amount || 0), 0);
  const estTax = rebalanceActions.reduce((s, a) => s + (a.taxAmount || 0), 0);
  const netCash = totalSells - totalBuys - estTax;

  const currentAlloc = useMemo(() => {
    let totalValue = 0;
    const currentMap = { Equity: 0, Debt: 0, Gold: 0, Crypto: 0 };
    const afterMap = { Equity: 0, Debt: 0, Gold: 0, Crypto: 0 };

    portfolio.forEach(item => {
      totalValue += item.currentValue;
      if (currentMap[item.type] !== undefined) {
        currentMap[item.type] += item.currentValue;
        afterMap[item.type] += item.currentValue; // Will be adjusted by trades
      }
    });

    rebalanceActions.forEach(action => {
      // Find asset type
      const asset = portfolio.find(a => a.name === action.assetName);
      if (asset && afterMap[asset.type] !== undefined) {
        if (action.action === 'BUY') {
          afterMap[asset.type] += action.amount;
        } else if (action.action === 'SELL') {
          afterMap[asset.type] -= action.amount;
        }
      }
    });

    const totalAfterValue = Object.values(afterMap).reduce((a,b)=>a+b, 0);
    const safePct = (val, tot) => tot > 0 ? Math.round((val / tot) * 100) : 0;

    return [
      { label: 'Equity', before: safePct(currentMap.Equity, totalValue), after: safePct(afterMap.Equity, totalAfterValue), color: '#8B7FFF' },
      { label: 'Debt', before: safePct(currentMap.Debt, totalValue), after: safePct(afterMap.Debt, totalAfterValue), color: '#00E5B8' },
      { label: 'Gold', before: safePct(currentMap.Gold, totalValue), after: safePct(afterMap.Gold, totalAfterValue), color: '#F5A623' },
      { label: 'Crypto', before: safePct(currentMap.Crypto, totalValue), after: safePct(afterMap.Crypto, totalAfterValue), color: '#FF4D4D' }
    ];
  }, [portfolio, rebalanceActions]);
  return (
    <div className="min-h-screen bg-[#080C14] text-[#EEF2FF] font-sans pb-16">

      <div className="max-w-[1400px] mx-auto p-[32px]">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Rebalance Advisor</h1>
          <p className="text-[#566580] text-sm mt-1">AI-generated trade sequence to optimize your exact portfolio bounds.</p>
        </div>

        <div className="w-full bg-[#00E5B8]/10 border border-[#00E5B8]/30 rounded-xl p-4 mb-8 flex items-center gap-3">
          <span className="text-xl">💡</span>
          <p className="text-[#00E5B8] text-[14px] font-medium">
            Your portfolio currently deviates 18.4% from the optimal engine parameters. This execution mathematically improves median 10-year forecasts by +2.3% annualized.
          </p>
        </div>

        {rebalanceActions.length === 0 ? (
          <LoadingSkeleton rows={4} height={100} />
        ) : (
          <div className="flex flex-col lg:flex-row gap-[24px] items-start">
            
            {/* Left Column 62% */}
            <div className="w-full lg:w-[62%] flex flex-col">
              {rebalanceActions.map((step, i) => (
                <RebalanceStepCard key={i} step={step} />
              ))}
              
              <div className="flex gap-4 mt-4">
                <button 
                  onClick={() => navigate('/projections')}
                  className="flex-1 bg-[#00E5B8] hover:bg-[#00C29A] text-[#080C14] font-bold py-3.5 px-6 rounded-xl transition-colors text-[14px]"
                >
                  Simulate this rebalance →
                </button>
                <button 
                  className="flex-1 bg-transparent border border-[#566580] hover:bg-white/5 text-[#EEF2FF] font-semibold py-3.5 px-6 rounded-xl transition-colors text-[14px]"
                >
                  Export PDF
                </button>
              </div>
            </div>

            {/* Right Column 38% */}
            <div className="w-full lg:w-[38%] flex flex-col gap-6">
              
              {/* Before After Bars */}
              <div className="bg-[#0F1520] border border-white/5 rounded-2xl p-6 shadow-xl">
                <h3 className="text-[12px] uppercase tracking-widest text-[#566580] font-bold mb-6">Allocation Shifts</h3>
                <div className="space-y-5">
                  {currentAlloc.map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center text-[12px] mb-2 font-medium">
                        <span style={{ color: item.color }}>{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#566580]">{item.before}%</span>
                          <span>→</span>
                          <span className="text-[#EEF2FF]">{item.after}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-[#1A2235] rounded-full flex relative">
                        <div className="h-full rounded-full transition-all" style={{ width: `${item.before}%`, backgroundColor: '#566580' }}></div>
                        <div className="h-full rounded-full absolute top-0 left-0 transition-all opacity-80" style={{ width: `${item.after}%`, backgroundColor: item.color }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-[#0F1520] border border-white/5 rounded-2xl p-6 shadow-xl">
                <h3 className="text-[12px] uppercase tracking-widest text-[#566580] font-bold mb-4">Trade Summary</h3>
                <div className="space-y-3 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-[#8A9BBF]">Total Sells</span>
                    <span className="text-[#FF4D4D] font-medium">{formatINR(totalSells)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A9BBF]">Total Buys</span>
                    <span className="text-[#22D3A5] font-medium">{formatINR(totalBuys)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A9BBF]">Est. Tax</span>
                    <span className="text-[#F5A623] font-medium">-{formatINR(estTax)}</span>
                  </div>
                  <div className="border-t border-white/5 my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#EEF2FF] font-semibold">Net Cash</span>
                    <span className="text-[#EEF2FF] font-bold">{formatINR(netCash)}</span>
                  </div>
                </div>
              </div>

              {/* Impact Card */}
              <div className="bg-[#1A2235] border border-white/5 rounded-2xl p-6 shadow-xl flex items-center justify-between">
                <div>
                  <h3 className="text-[11px] uppercase tracking-widest text-[#8A9BBF] font-bold mb-1">IMPACT</h3>
                  <div className="text-[14px] font-bold text-[#566580] line-through">Without rebalance ₹82.0L</div>
                  <div className="text-[18px] font-bold text-[#EEF2FF] mt-1">With rebalance <span className="text-[#00E5B8]">₹1.16Cr</span></div>
                </div>
                <div className="text-[#00E5B8] opacity-50 px-2 text-4xl">📈</div>
              </div>

              {/* Checklist */}
              <div className="bg-[#0F1520] border border-white/5 rounded-2xl p-6">
                <h3 className="text-[12px] uppercase tracking-widest text-[#00E5B8] font-bold mb-4">Execution Checklist</h3>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" className="mt-1 accent-[#00E5B8]" />
                    <span className="text-[13px] text-[#8A9BBF] group-hover:text-[#EEF2FF] transition-colors">Sell Cryptos immediately before standard tax assessment drops.</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" className="mt-1 accent-[#00E5B8]" />
                    <span className="text-[13px] text-[#8A9BBF] group-hover:text-[#EEF2FF] transition-colors">Book STCG on liquid mutual funds today.</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" className="mt-1 accent-[#00E5B8]" />
                    <span className="text-[13px] text-[#8A9BBF] group-hover:text-[#EEF2FF] transition-colors">Route 100% of unlocked capital identically into standard Nifty 50 bounds.</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" className="mt-1 accent-[#00E5B8]" />
                    <span className="text-[13px] text-[#8A9BBF] group-hover:text-[#EEF2FF] transition-colors">Hold Sovereign Gold Bonds until maturity (no action required).</span>
                  </label>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
