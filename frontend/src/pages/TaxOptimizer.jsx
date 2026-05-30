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
        .catch(err => {
          console.warn("Backend tax optimizer failed, running client-side calculations fallback:", err);
          
          const TAX_RULES = {
            STCG_EQUITY: 0.20,
            LTCG_EQUITY: 0.125,
            LTCG_DEBT: 'slab',
            SECTION_80C_LIMIT: 150000,
            SECTION_80D_LIMIT: 25000,
            NPS_ADDITIONAL: 50000,
            LTCG_EQUITY_EXEMPT: 125000,
          };

          const suggestions = [];
          let estimatedTaxSaving = 0;
          const taxBracket = Number(userProfile?.taxBracket) || 30;

          // 80C headroom
          const invested80C = Number(userProfile?.invested80C) || 0;
          const headroom80C = Math.max(0, TAX_RULES.SECTION_80C_LIMIT - invested80C);
          if (headroom80C > 0) {
            const saving = headroom80C * (taxBracket / 100);
            estimatedTaxSaving += saving;
            suggestions.push({
              type: '80C',
              action: `Invest ₹${headroom80C.toLocaleString('en-IN')} more in ELSS/PPF/LIC`,
              saving: Math.round(saving),
              priority: 'high',
            });
          }

          // NPS
          if (!userProfile?.hasNPS) {
            const npsSaving = TAX_RULES.NPS_ADDITIONAL * (taxBracket / 100);
            estimatedTaxSaving += npsSaving;
            suggestions.push({
              type: 'NPS',
              action: 'Open NPS account — additional ₹50,000 deduction under 80CCD(1B)',
              saving: Math.round(npsSaving),
              priority: 'high',
            });
          }

          // LTCG harvesting
          for (const asset of portfolio) {
            if (asset.type === 'Equity') {
              const gain = (asset.currentValue || 0) - (asset.costBasis || 0);
              if (gain > 0 && gain <= TAX_RULES.LTCG_EQUITY_EXEMPT) {
                suggestions.push({
                  type: 'LTCG Harvesting',
                  action: `Book gains of ₹${gain.toLocaleString('en-IN')} in ${asset.name} — within ₹1.25L exempt limit, then rebuy`,
                  saving: Math.round(gain * TAX_RULES.LTCG_EQUITY),
                  priority: 'medium',
                });
              }
            }
          }

          // Health Insurance
          if (!userProfile?.hasHealthInsurance) {
            const saving80D = TAX_RULES.SECTION_80D_LIMIT * (taxBracket / 100);
            estimatedTaxSaving += saving80D;
            suggestions.push({
              type: '80D',
              action: `Get health insurance — up to ₹${TAX_RULES.SECTION_80D_LIMIT.toLocaleString('en-IN')} deduction under 80D`,
              saving: Math.round(saving80D),
              priority: 'high',
            });
          }

          setTaxData({
            suggestions,
            totalEstimatedSaving: Math.round(estimatedTaxSaving),
            taxRules: TAX_RULES,
            isOffline: true
          });
        })
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
      <div className="min-h-screen bg-slate-900 text-slate-50 p-8 max-w-4xl mx-auto flex flex-col justify-center mt-12">
        <h2 className="text-xl font-bold mb-6 text-center">Analyzing Tax Headroom...</h2>
        <div className="bg-slate-800 p-8 rounded border border-slate-700">
          <LoadingSkeleton rows={6} height={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans pb-16">
      <div className="w-full px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">Tax Optimizer</h1>
          <p className="text-slate-400 text-sm mt-1">Expose deductions and equity gain harvesting specific to your tax bracket.</p>
        </div>

        {taxData?.isOffline && (
          <div className="w-full bg-amber-900/20 border border-amber-500/50 rounded p-4 mb-6 flex items-center gap-3">
            <span className="text-amber-500">⚠</span>
            <p className="text-amber-400 text-sm font-medium">
              Offline Sandbox Mode: Showing standard Indian tax rules adjusted for your tax slab.
            </p>
          </div>
        )}

        {/* Overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard 
            label="Total Potential Saving" 
            value={formatINR(maxSavings)} 
            subtext="Available this fiscal year"
            subtextColor="emerald"
          />
          <MetricCard 
            label="Current Bracket" 
            value={`${userProfile?.taxBracket || 30}%`} 
            subtext={`Income Tax Slab (FY 2024-25)`}
          />
          <div className="bg-slate-800 border border-slate-700 rounded p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Optimization Progress</span>
              <div className="flex justify-between items-end mt-2 mb-1">
                <span className="text-lg font-bold text-emerald-500">{formatINR(totalSavedSoFar)} saved</span>
                <span className="text-xs text-slate-400">{progressPct}%</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded overflow-hidden">
              <div className="h-full bg-emerald-500 rounded transition-all duration-300" style={{ width: `${progressPct}%` }}></div>
            </div>
          </div>
        </div>

        {/* Suggestion list */}
        <div className="bg-slate-800 border border-slate-700 rounded p-6 shadow-sm mb-6">
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide mb-6">Tax Saving Action Checklist</h3>
          
          <div className="space-y-4">
            {suggestions.map((item, index) => {
              const isDone = completedActions.includes(item.action);
              return (
                <div 
                  key={index} 
                  className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded border transition-all ${
                    isDone 
                      ? 'bg-emerald-900/10 border-emerald-500/20 opacity-80' 
                      : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <input 
                      type="checkbox" 
                      checked={isDone} 
                      onChange={() => toggleCompleted(item.action)} 
                      className="mt-1 accent-emerald-500 h-4 w-4 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[13px] font-medium transition-all ${isDone ? 'line-through text-slate-500' : 'text-slate-50'}`}>
                          {item.action}
                        </span>
                        <Badge type={item.type === '80C' || item.type === '80D' ? 'debt' : item.type === 'NPS' ? 'gold' : 'equity'} label={item.type} />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Section limit: {item.type === '80C' ? '₹1.5L' : item.type === '80D' ? '₹25k' : item.type === 'NPS' ? '₹50k' : '₹1.25L Exempt'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-700">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Estimated Tax Saved</span>
                      <span className="text-sm text-emerald-500 font-bold">{formatINR(item.saving)}</span>
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
              <div className="py-8 text-center text-slate-400 text-sm">
                Excellent work. Your profile shows no major tax leaks or under-utilized heads.
              </div>
            )}
          </div>
        </div>

        {/* Educational/Assumption Card */}
        <div className="bg-slate-800 border border-slate-700 rounded p-6">
          <h4 className="text-xs uppercase text-blue-500 tracking-wider font-semibold mb-4">Understanding Indian Capital Gains & Deductions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-400 leading-relaxed">
            <div className="space-y-2">
              <p><strong className="text-slate-300">LTCG Harvesting:</strong> Under Indian Tax Law, Long Term Capital Gains (LTCG) on Equity are tax-free up to ₹1.25 Lakh per financial year. Booking gains up to this threshold and buying back immediately increases your cost basis tax-free, protecting future gains from the 12.5% LTCG tax.</p>
              <p><strong className="text-slate-300">Section 80D:</strong> Allows up to ₹25,000 deduction on health insurance premiums paid for self/family, reducing taxable income.</p>
            </div>
            <div className="space-y-2">
              <p><strong className="text-slate-300">Section 80C:</strong> Covers PPF, ELSS, EPF, LIC, and principal repayments on home loans up to a cumulative limit of ₹1.5 Lakhs per year.</p>
              <p><strong className="text-slate-300">Section 80CCD(1B):</strong> Provides an exclusive additional deduction of up to ₹50,000 for voluntary contributions to the National Pension System (NPS), separate from the 80C limit.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
