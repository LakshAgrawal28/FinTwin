import React from 'react';

const MetricCard = ({ label, value, subtext, subtextColor = 'muted' }) => {
  const textColorMap = {
    emerald: 'text-emerald-500',
    rose: 'text-rose-500',
    amber: 'text-amber-500',
    muted: 'text-slate-400'
  };

  const textClass = textColorMap[subtextColor] || textColorMap.muted;

  return (
    <div className="bg-slate-800 rounded p-6 border border-slate-700 shadow-sm transition-colors duration-300 hover:border-slate-500">
      <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-2 font-semibold">
        {label}
      </div>
      <div className="text-3xl font-bold text-slate-50 mb-1">
        {value}
      </div>
      {subtext && (
        <div className={`text-xs font-medium ${textClass}`}>
          {subtext}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
