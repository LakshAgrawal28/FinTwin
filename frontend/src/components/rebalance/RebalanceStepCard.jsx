import React from 'react';
import Badge from '../shared/Badge';
import { formatINR } from '../../utils/formatCurrency';

export default function RebalanceStepCard({ step }) {
  const isBuy = step.action === 'BUY';
  const colorHash = isBuy ? 'rgba(34,211,165,0.3)' : 'rgba(255,77,77,0.3)';
  const textColor = isBuy ? '#22D3A5' : '#FF4D4D';

  return (
    <div className="bg-[#0F1520] rounded-2xl p-6 mb-4 border border-white/5 shadow-lg flex flex-col md:flex-row gap-6 items-start">
      <div className="w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center font-black text-2xl" style={{ backgroundColor: colorHash, color: textColor }}>
        {step.step}
      </div>
      <div className="flex-1 w-full">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-[18px] font-semibold text-[#EEF2FF]">
            {isBuy ? 'Buy' : 'Sell'} {step.assetName} — <span style={{ color: textColor }}>{formatINR(step.amount)}</span>
          </h3>
          <Badge type={step.action.toLowerCase()} label={step.action} />
        </div>

        <div className="bg-[#141B28] rounded-xl p-4 border border-white/5 space-y-3">
          <div className="flex justify-between text-[13px]">
            <span className="text-[#566580]">Current Value</span>
            <span className="text-[#EEF2FF] font-medium">{formatINR(step.currentValue)}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-[#566580]">Trade Amount</span>
            <span className="font-bold" style={{ color: textColor }}>{isBuy ? '+' : '-'}{formatINR(step.amount)}</span>
          </div>
          <div className="flex justify-between text-[13px] pt-1">
            <span className="text-[#566580]">Post-Trade Value</span>
            <span className="text-[#EEF2FF] font-semibold">{formatINR(step.postTradeValue)}</span>
          </div>

          {!isBuy && step.taxAmount > 0 && (
            <>
              <div className="border-t border-white/5 my-2"></div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[#566580]">Est. Tax Impact ({step.taxType})</span>
                <span className="text-[#F5A623] font-semibold">{formatINR(step.taxAmount)}</span>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex items-start gap-2 bg-[#F5A623]/10 text-[#F5A623] px-4 py-2.5 rounded-lg text-[12px] font-medium border border-[#F5A623]/20">
          <span className="mt-0.5">⚠</span>
          <p>{step.reason || step.tip}</p>
        </div>
      </div>
    </div>
  );
}
