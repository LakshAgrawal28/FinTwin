import React from 'react';
import Badge from '../shared/Badge';
import { formatINR } from '../../utils/formatCurrency';

export default function RebalanceStepCard({ step }) {
  const isBuy = step.action === 'BUY';
  const colorHash = isBuy ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
  const textColor = isBuy ? '#10B981' : '#EF4444';

  return (
    <div className="bg-slate-800 rounded p-6 mb-4 border border-slate-700 shadow-sm flex flex-col md:flex-row gap-6 items-start">
      <div className="w-12 h-12 flex-shrink-0 rounded flex items-center justify-center font-bold text-xl" style={{ backgroundColor: colorHash, color: textColor }}>
        {step.step}
      </div>
      <div className="flex-1 w-full">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-slate-100">
            {isBuy ? 'Buy' : 'Sell'} {step.assetName} — <span style={{ color: textColor }}>{formatINR(step.amount)}</span>
          </h3>
          <Badge type={step.action.toLowerCase()} label={step.action} />
        </div>

        <div className="bg-slate-700/50 rounded p-4 border border-slate-600 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Current Value</span>
            <span className="text-slate-100 font-medium">{formatINR(step.currentValue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Trade Amount</span>
            <span className="font-bold" style={{ color: textColor }}>{isBuy ? '+' : '-'}{formatINR(step.amount)}</span>
          </div>
          <div className="flex justify-between text-sm pt-1">
            <span className="text-slate-400">Post-Trade Value</span>
            <span className="text-slate-100 font-semibold">{formatINR(step.postTradeValue)}</span>
          </div>

          {!isBuy && step.taxAmount > 0 && (
            <>
              <div className="border-t border-slate-600 my-2"></div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Est. Tax Impact ({step.taxType})</span>
                <span className="text-amber-500 font-semibold">{formatINR(step.taxAmount)}</span>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex items-start gap-2 bg-amber-500/10 text-amber-500 px-4 py-2.5 rounded text-xs font-medium border border-amber-500/20">
          <span className="mt-0.5">⚠</span>
          <p>{step.reason || step.tip}</p>
        </div>
      </div>
    </div>
  );
}
