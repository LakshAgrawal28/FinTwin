import React from 'react';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { formatINR } from '../../utils/formatCurrency';

const formatAbbrev = (val) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${(val / 1000).toFixed(1)}k`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0F1520] border border-white/10 p-4 rounded-lg shadow-xl">
        <p className="text-[#8A9BBF] text-xs font-semibold mb-2">Year {label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex justify-between items-center gap-4 mb-1">
            <span className="text-[12px]" style={{ color: entry.color }}>
              {entry.name}:
            </span>
            <span className="text-[13px] font-bold text-[#EEF2FF]">
              {formatINR(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const PercentileBandsChart = ({ data, dangerZoneThreshold = 500000, maxYears, inflationFactor }) => {
  if (!data || !data.years) return null;

  // Optionally slice data to maxYears
  const limit = maxYears ? Math.min(maxYears, data.years.length) : data.years.length;

  const chartData = data.years.slice(0, limit).map((year, i) => {
    const deflator = inflationFactor ? Math.pow(inflationFactor, year) : 1;
    return {
      year,
      'Top 10% (P90)': data.p90[i] / deflator,
      'Median (P50)': data.p50[i] / deflator,
      'Bottom 10% (P10)': data.p10[i] / deflator
    };
  });

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis 
            dataKey="year" 
            tickLine={false} 
            axisLine={false} 
            tick={{ fill: '#566580', fontSize: 12 }} 
            dy={10}
            tickFormatter={(val) => `Yr ${val}`}
          />
          <YAxis 
            tickFormatter={formatAbbrev} 
            tickLine={false} 
            axisLine={false} 
            tick={{ fill: '#566580', fontSize: 12 }} 
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine 
            y={dangerZoneThreshold} 
            stroke="#FF4D4D" 
            strokeDasharray="4 4" 
            label={{ position: 'insideTopLeft', value: 'Danger Zone', fill: '#FF4D4D', fontSize: 11, fontWeight: 600 }} 
          />
          <Area 
            type="monotone" 
            dataKey="Top 10% (P90)" 
            stroke="#22D3A5" 
            strokeDasharray="4 4" 
            fill="rgba(34,211,165,0.06)" 
          />
          <Area 
            type="monotone" 
            dataKey="Median (P50)" 
            stroke="#00E5B8" 
            strokeWidth={2} 
            fill="rgba(0,229,184,0.12)" 
          />
          <Area 
            type="monotone" 
            dataKey="Bottom 10% (P10)" 
            stroke="#FF4D4D" 
            strokeDasharray="4 4" 
            fill="rgba(255,77,77,0.06)" 
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PercentileBandsChart;
