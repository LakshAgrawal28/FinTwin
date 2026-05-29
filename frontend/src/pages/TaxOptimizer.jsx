import React, { useEffect, useState, useMemo } from 'react';
import { useTwinStore } from '../store';
import { postTaxOptimize } from '../utils/api';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import MetricCard from '../components/shared/MetricCard';
import Badge from '../components/shared/Badge';
import { formatINR } from '../utils/formatCurrency';

export default function TaxOptimizer() {
  const userProfile = useTwinStore(state => state.userProfile);
  const portfolio = useTwinStore(state => state.portfolio) || [];
  
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedActions, setCompletedActions] = useState([]);

  useEffect(() => {
    if (userProfile) {
      setLoading(true);
      postTaxOptimize(portfolio, userProfile)
        .then(res => {
          if (res) setTaxData(res);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [portfolio, userProfile]);

  const suggestions = useMemo(() => taxData?.suggestions || [], [taxData]);

  const toggleCompleted = (actionText) => {
    setCompletedActions(prev => 
      prev.includes(actionText) 
        ? prev.filter(t => t !== actionText) 
        : [...prev, actionText]
    );
  };

  const totalSavedSoFar = useMemo(() => {
    return suggestions
      .filter(s => completedActions.includes(s.action))
      .reduce((sum, s) => sum + s.saving, 0);
  }, [suggestions, completedActions]);

  const maxSavings = taxData?.totalEstimatedSaving || 0;
  const progressPct = maxSavings > 0 ? Math.min(100, Math.round((totalSavedSoFar / maxSavings) * 100)) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C14] text-[#EEF2FF] p-8 max-w-4xl mx-auto flex flex-col justify-center mt-12">
        <h2 className="text-xl font-bold mb-6 text-center">Analyzing Tax Headroom...</h2>
        <div className="bg-[#0F1520] p-8 rounded-2xl border border-white/5">
          <LoadingSkeleton rows={6} height={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C14] text-[#EEF2FF] font-sans pb-16">
      <div className="max-w-[1200px] mx-auto p-[32px]">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Tax Optimizer</h1>
          <p className="text-[#566580] text-sm mt-1">Expose deductions and equity gain harvesting specific to your tax bracket.</p>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard 
            label="Total Potential Saving" 
            value={formatINR(maxSavings)} 
            subtext="Available this fiscal year"
            subtextColor="green"
          />
          <MetricCard 
            label="Current Bracket" 
            value={`${userProfile?.taxBracket || 30}%`} 
            subtext={`Income Tax Slab (FY 2024-25)`}
          />
          <div className="bg-[#0F1520] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-[11px] text-[#566580] font-bold uppercase tracking-wider">Optimization Progress</span>
              <div className="flex justify-between items-end mt-2 mb-1">
                <span className="text-[18px] font-bold text-[#00E5B8]">{formatINR(totalSavedSoFar)} saved</span>
                <span className="text-[12px] text-[#8A9BBF]">{progressPct}%</span>
              </div>
            </div>
            <div className="w-full h-2.5 bg-[#1A2235] rounded-full overflow-hidden">
              <div className="h-full bg-[#00E5B8] rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }}></div>
            </div>
          </div>
        </div>

        {/* Suggestion list */}
        <div className="bg-[#0F1520] border border-white/5 rounded-2xl p-6 shadow-xl mb-6">
          <h3 className="text-[14px] font-semibold text-[#EEF2FF] mb-6">Tax Saving Action Checklist</h3>
          
          <div className="space-y-4">
            {suggestions.map((item, index) => {
              const isDone = completedActions.includes(item.action);
              return (
                <div 
                  key={index} 
                  className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all ${
                    isDone 
                      ? 'bg-[#00E5B8]/[0.02] border-[#00E5B8]/20 opacity-80' 
                      : 'bg-[#141B28] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <input 
                      type="checkbox" 
                      checked={isDone} 
                      onChange={() => toggleCompleted(item.action)} 
                      className="mt-1 accent-[#00E5B8] h-4 w-4 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[13px] font-medium transition-all ${isDone ? 'line-through text-[#566580]' : 'text-[#EEF2FF]'}`}>
                          {item.action}
                        </span>
                        <Badge type={item.type === '80C' || item.type === '80D' ? 'debt' : item.type === 'NPS' ? 'gold' : 'equity'} label={item.type} />
                      </div>
                      <p className="text-[11px] text-[#566580] mt-1">Section limit: {item.type === '80C' ? '₹1.5L' : item.type === '80D' ? '₹25k' : item.type === 'NPS' ? '₹50k' : '₹1.25L Exempt'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-[#566580] font-bold block uppercase tracking-wider">Estimated Tax Saved</span>
                      <span className="text-[15px] text-[#00E5B8] font-bold">{formatINR(item.saving)}</span>
                    </div>
                    <div>
                      <Badge 
                        type={item.priority === 'high' ? 'crypto' : 'gold'} 
                        label={item.priority === 'high' ? 'High Priority' : 'Medium'} 
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {suggestions.length === 0 && (
              <div className="py-8 text-center text-[#566580] text-sm">
                🎉 Excellent work! Your profile shows no major tax leaks or under-utilized heads.
              </div>
            )}
          </div>
        </div>

        {/* Educational/Assumption Card */}
        <div className="bg-[#1A2235] border border-white/5 rounded-2xl p-6">
          <h4 className="text-[13px] text-[#00E5B8] font-semibold mb-3">🎓 Understanding Indian Capital Gains & Deductions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[12px] text-[#8A9BBF] leading-relaxed">
            <div className="space-y-2">
              <p>**LTCG Harvesting**: Under Indian Tax Law, Long Term Capital Gains (LTCG) on Equity are tax-free up to ₹1.25 Lakh per financial year. Booking gains up to this threshold and buying back immediately increases your cost basis tax-free, protecting future gains from the 12.5% LTCG tax.</p>
              <p>**Section 80D**: Allows up to ₹25,000 deduction on health insurance premiums paid for self/family, reducing taxable income.</p>
            </div>
            <div className="space-y-2">
              <p>**Section 80C**: Covers PPF, ELSS, EPF, LIC, and principal repayments on home loans up to a cumulative limit of ₹1.5 Lakhs per year.</p>
              <p>**Section 80CCD(1B)**: Provides an exclusive additional deduction of up to ₹50,000 for voluntary contributions to the National Pension System (NPS), separate from the 80C limit.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
