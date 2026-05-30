import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatINR } from '../../utils/formatCurrency';

export default function CashflowWaterfall({ profile, goalEMI = 0 }) {
  const income = Number(profile?.monthlyIncome || profile?.income || 0);
  const fixedExpenses = Number(profile?.monthlyExpenses || profile?.expenses || 0);
  const variableSpend = Number(profile?.variableSpend || 0);
  const emi = Number(profile?.monthlyEMI || profile?.emi || 0);
  const existingInvestment = Number(profile?.monthlyInvestment || 0);
  
  // Total expenses before target goal additions
  const baseEMI = emi;
  const targetEMI = Number(goalEMI) || 0;

  const totalOutflow = fixedExpenses + variableSpend + baseEMI + targetEMI + existingInvestment;
  const netSurplus = income - totalOutflow;

  // Prepare waterfall structure
  const data = [
    { name: 'Income', value: income, fill: '#10B981', description: 'Monthly Take-Home' }, // emerald-500
    { name: 'Fixed Exp.', value: -fixedExpenses, fill: '#F43F5E', description: 'Rent, bills, groceries' }, // rose-500
    { name: 'Variable Exp.', value: -variableSpend, fill: '#F59E0B', description: 'Dining, shopping, travel' }, // amber-500
    { name: 'Existing EMIs', value: -baseEMI, fill: '#F97316', description: 'Active vehicle/personal loans' }, // orange-500
    { name: 'Goal Loan EMI', value: -targetEMI, fill: '#8B5CF6', description: 'EMI for simulated purchase' }, // violet-500
    { name: 'SIPs / Invest', value: -existingInvestment, fill: '#3B82F6', description: 'Mutual funds, shares' }, // blue-500
    { name: 'Net Surplus', value: netSurplus, fill: netSurplus >= 0 ? '#10B981' : '#F43F5E', description: 'Unallocated cash / cashflow state' }
  ].filter(d => d.value !== 0); // only show non-zero cash flows

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 rounded p-3 text-xs shadow-lg">
          <p className="font-bold text-slate-100 m-0">{d.name}</p>
          <p className="text-sm font-bold my-1" style={{ color: d.fill }}>
            {d.value >= 0 ? '+' : ''}{formatINR(d.value)}
          </p>
          <p className="text-[10px] text-slate-400 m-0">{d.description}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded p-6 shadow-sm">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 m-0">
            Monthly Cashflow Allocation
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-0">
            Visualizes inflows vs outflows with new simulated goals
          </p>
        </div>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: -10 }}>
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} 
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.05)' }} />
            <ReferenceLine y={0} stroke="rgba(148,163,184,0.1)" strokeWidth={1} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fill} 
                  // If it's negative value, apply round borders at bottom
                  radius={entry.value < 0 ? [0, 0, 4, 4] : [4, 4, 0, 0]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={`mt-4 flex justify-between px-4 py-3 rounded border ${netSurplus >= 0 ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-rose-900/10 border-rose-500/20'}`}>
        <span className="text-xs text-slate-400 font-medium">Unallocated Cashflow:</span>
        <span className={`text-sm font-bold ${netSurplus >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
          {formatINR(netSurplus)}
        </span>
      </div>
    </div>
  );
}
