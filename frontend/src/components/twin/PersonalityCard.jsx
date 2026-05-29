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
    <div style={{ backgroundColor: '#0F1520', borderRadius: '16px', padding: '24px' }} className="flex flex-col md:flex-row gap-8 items-center border border-white/5 shadow-lg">
      <div className="flex-1 w-full">
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#00E5B8', letterSpacing: '0.08em', fontWeight: 600 }}>
          Your Financial Archetype
        </div>
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#EEF2FF', marginTop: '4px' }} className="flex items-center gap-2">
          <span style={{ color: '#00E5B8' }}>⚡</span> {twinState.archetype}
        </div>
        <div style={{ fontSize: '14px', color: '#8A9BBF', marginTop: '8px', lineHeight: 1.6 }}>
          {twinState.summary}
        </div>
        <div className="flex flex-wrap gap-2" style={{ marginTop: '16px' }}>
          {twinState.traits?.map((trait, i) => (
            <span 
              key={i} 
              style={{
                backgroundColor: 'rgba(0,229,184,0.1)',
                border: '1px solid rgba(0,229,184,0.2)',
                color: '#00E5B8',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '12px',
                fontWeight: 500
              }}
            >
              {trait}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-6">
          <div style={{ width: '8px', height: '8px', backgroundColor: '#22D3A5', borderRadius: '50%' }}></div>
          <span style={{ fontSize: '11px', color: '#566580' }}>Twin last updated — Today, 9:41 AM</span>
        </div>
      </div>

      <div style={{ width: '240px', height: '240px' }} className="flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#566580', fontSize: 11, fontWeight: 500 }} />
            <Radar 
              dataKey="value" 
              stroke="#00E5B8" 
              strokeWidth={2} 
              fill="rgba(0,229,184,0.2)" 
              fillOpacity={1} 
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PersonalityCard;
