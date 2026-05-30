import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const PersonalityCard = ({ twinState }) => {
  if (!twinState) return null;

  const data = [
    { subject: 'Risk', value: twinState.radarScores?.riskTolerance || 0 },
    { subject: 'Discipline', value: twinState.radarScores?.discipline || 0 },
    { subject: 'Patience', value: twinState.radarScores?.patience || 0 },
    { subject: 'Optimism', value: twinState.radarScores?.optimism || 0 },
    { subject: 'Liquidity', value: twinState.radarScores?.liquidity || 0 },
  ];

  return (
    <div className="bg-slate-800 rounded p-6 flex flex-col md:flex-row gap-8 items-center border border-slate-700 shadow-sm">
      <div className="flex-1 w-full">
        <div className="text-xs uppercase text-blue-500 tracking-wider font-semibold">
          Quantitative Profile
        </div>
        <div className="text-2xl font-bold text-slate-50 mt-1 flex items-center gap-2">
          {twinState.archetype}
        </div>
        <div className="text-sm text-slate-400 mt-2 leading-relaxed">
          {twinState.summary}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {twinState.traits?.map((trait, i) => (
            <span 
              key={i} 
              className="bg-blue-900/30 border border-blue-500/20 text-blue-400 rounded px-2.5 py-1 text-xs font-medium"
            >
              {trait}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-6">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <span className="text-xs text-slate-500">Last synchronized — Today</span>
        </div>
      </div>

      <div style={{ width: '240px', height: '240px' }} className="flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="rgba(148, 163, 184, 0.2)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }} />
            <Radar 
              dataKey="value" 
              stroke="#3B82F6" 
              strokeWidth={2} 
              fill="rgba(59, 130, 246, 0.2)" 
              fillOpacity={1} 
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PersonalityCard;
