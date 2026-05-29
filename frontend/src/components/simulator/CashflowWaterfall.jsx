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
    { name: 'Income', value: income, fill: '#00E5B8', description: 'Monthly Take-Home' },
    { name: 'Fixed Exp.', value: -fixedExpenses, fill: '#FF4D4D', description: 'Rent, bills, groceries' },
    { name: 'Variable Exp.', value: -variableSpend, fill: '#F5A623', description: 'Dining, shopping, travel' },
    { name: 'Existing EMIs', value: -baseEMI, fill: '#FF7300', description: 'Active vehicle/personal loans' },
    { name: 'Goal Loan EMI', value: -targetEMI, fill: '#8B7FFF', description: 'EMI for simulated purchase' },
    { name: 'SIPs / Invest', value: -existingInvestment, fill: '#3b82f6', description: 'Mutual funds, shares' },
    { name: 'Net Surplus', value: netSurplus, fill: netSurplus >= 0 ? '#00E5B8' : '#FF4D4D', description: 'Unallocated cash / cashflow state' }
  ].filter(d => d.value !== 0); // only show non-zero cash flows

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div style={{
          background: '#080C14',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '12px',
          fontSize: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
        }}>
          <p style={{ fontWeight: 'bold', color: '#EEF2FF', margin: 0 }}>{d.name}</p>
          <p style={{ color: d.fill, fontSize: '14px', fontWeight: 'bold', margin: '4px 0' }}>
            {d.value >= 0 ? '+' : ''}{formatINR(d.value)}
          </p>
          <p style={{ color: '#566580', margin: 0, fontSize: '11px' }}>{d.description}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      background: '#0F1520',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#EEF2FF', margin: 0 }}>
            Monthly Cashflow Allocation
          </h3>
          <p style={{ fontSize: '11px', color: '#566580', margin: '2px 0 0 0' }}>
            Visualizes inflows vs outflows with new simulated goals
          </p>
        </div>
      </div>

      <div style={{ height: '220px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: -10 }}>
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#566580', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} 
              tick={{ fill: '#566580', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fill} 
                  // If it's negative value, apply round borders at bottom
                  radius={entry.value < 0 ? [0, 0, 6, 6] : [6, 6, 0, 0]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{
        marginTop: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: netSurplus >= 0 ? 'rgba(0, 229, 184, 0.05)' : 'rgba(255, 77, 77, 0.05)',
        border: `1px solid ${netSurplus >= 0 ? 'rgba(0, 229, 184, 0.15)' : 'rgba(255, 77, 77, 0.15)'}`,
        borderRadius: '12px'
      }}>
        <span style={{ fontSize: '12px', color: '#8A9BBF', fontWeight: 500 }}>Unallocated Cashflow:</span>
        <span style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: netSurplus >= 0 ? '#00E5B8' : '#FF4D4D'
        }}>
          {formatINR(netSurplus)}
        </span>
      </div>
    </div>
  );
}
