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
      <div className="bg-slate-800 border border-slate-700 p-4 rounded shadow-lg">
        <p className="text-slate-400 text-xs font-semibold mb-2">Year {label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex justify-between items-center gap-4 mb-1">
            <span className="text-[12px]" style={{ color: entry.color }}>
              {entry.name}:
            </span>
            <span className="text-[13px] font-bold text-slate-100">
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
          <CartesianGrid stroke="rgba(148,163,184,0.1)" vertical={false} />
          <XAxis 
            dataKey="year" 
            tickLine={false} 
            axisLine={false} 
            tick={{ fill: '#94A3B8', fontSize: 12 }} 
            dy={10}
            tickFormatter={(val) => `Yr ${val}`}
          />
          <YAxis 
            tickFormatter={formatAbbrev} 
            tickLine={false} 
            axisLine={false} 
            tick={{ fill: '#94A3B8', fontSize: 12 }} 
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.05)' }} />
          <ReferenceLine 
            y={dangerZoneThreshold} 
            stroke="#F43F5E" 
            strokeDasharray="4 4" 
            label={{ position: 'insideTopLeft', value: 'Danger Zone', fill: '#F43F5E', fontSize: 11, fontWeight: 600 }} 
          />
          <Area 
            type="monotone" 
            dataKey="Top 10% (P90)" 
            stroke="#10B981" 
            strokeDasharray="4 4" 
            fill="rgba(16,185,129,0.1)" 
          />
          <Area 
            type="monotone" 
            dataKey="Median (P50)" 
            stroke="#3B82F6" 
            strokeWidth={2} 
            fill="rgba(59,130,246,0.15)" 
          />
          <Area 
            type="monotone" 
            dataKey="Bottom 10% (P10)" 
            stroke="#F43F5E" 
            strokeDasharray="4 4" 
            fill="rgba(244,63,94,0.1)" 
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PercentileBandsChart;
