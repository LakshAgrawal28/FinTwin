import React, { useEffect, useState, useMemo } from 'react';
import { useTwinStore } from '../../store';
import { postHealthScore } from '../../utils/api';

const gradeColors = { A: '#22c55e', B: '#84cc16', C: '#f59e0b', D: '#ef4444' };

export default function HealthScore() {
  const rawUserProfile = useTwinStore(state => state.userProfile);
  const rawPortfolio = useTwinStore(state => state.portfolio);
  const userProfile = useMemo(() => rawUserProfile || {}, [rawUserProfile]);
  const portfolio = useMemo(() => rawPortfolio || [], [rawPortfolio]);
  const healthScore = useTwinStore(state => state.healthScore);
  const setHealthScore = useTwinStore(state => state.setHealthScore);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const income = userProfile?.monthlyIncome || userProfile?.income;
    if (!income || healthScore) return;

    setTimeout(() => setLoading(true), 0);
    postHealthScore(userProfile, portfolio)
      .then(data => {
        setHealthScore(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [userProfile, portfolio, healthScore, setHealthScore]);

  if (loading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded p-6 text-center text-slate-400 text-sm">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Calculating your score...
      </div>
    );
  }

  if (!healthScore) return null;

  const data = healthScore;
  const gradeColorClass = data.grade === 'A' ? 'text-emerald-500' : data.grade === 'B' ? 'text-blue-500' : data.grade === 'C' ? 'text-amber-500' : 'text-rose-500';
  const gradeBorderClass = data.grade === 'A' ? 'border-emerald-500 bg-emerald-500/10' : data.grade === 'B' ? 'border-blue-500 bg-blue-500/10' : data.grade === 'C' ? 'border-amber-500 bg-amber-500/10' : 'border-rose-500 bg-rose-500/10';

  return (
    <div className="bg-slate-800 border border-slate-700 rounded p-6 shadow-sm">
      {/* Score Circle */}
      <div className="flex items-center gap-5 mb-5">
        <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center shrink-0 ${gradeBorderClass}`}>
          <span className="text-2xl font-bold text-slate-100">{data.totalScore}</span>
          <span className={`text-xs font-bold ${gradeColorClass}`}>{data.grade}</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-100 mb-1">Financial Health</h3>
          <p className="text-xs text-slate-400">Score out of 100 across 5 key areas</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="flex flex-col gap-3 mb-5">
        {data.breakdown?.map((item, i) => {
          const ratio = item.score / item.max;
          const barColorClass = ratio >= 0.7 ? 'bg-emerald-500' : ratio >= 0.4 ? 'bg-amber-500' : 'bg-rose-500';
          return (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">{item.category}</span>
                <span className="text-slate-100 font-semibold">{item.score}/{item.max}</span>
              </div>
              <div className="h-1 bg-slate-700 rounded overflow-hidden">
                <div className={`h-full rounded transition-all duration-500 ${barColorClass}`} style={{ width: `${ratio * 100}%` }} />
              </div>
              <small className="text-[10px] text-slate-500 mt-1 block">{item.message}</small>
            </div>
          );
        })}
      </div>

      {/* AI Advice */}
      {data.aiAdvice && (
        <div className="bg-slate-700/50 rounded p-3.5 border border-slate-600">
          <span className="text-xs text-blue-500 font-bold block mb-1.5">🤖 AI Advice</span>
          <p className="text-xs text-slate-400 leading-relaxed m-0">{data.aiAdvice}</p>
        </div>
      )}
    </div>
  );
}
