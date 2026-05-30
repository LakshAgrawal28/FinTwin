import React, { useState, useEffect, useRef } from 'react';
import StreamingText from '../shared/StreamingText';
import { getBaseUrl } from '../../utils/api';

const StreamingInsight = ({ userProfile, twinState, simulationResult }) => {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const prevResultRef = useRef(null);

  // Auto-reset and re-generate when simulationResult changes
  useEffect(() => {
    if (!simulationResult) return;
    // Skip if it's the exact same object reference
    if (prevResultRef.current === simulationResult) return;
    prevResultRef.current = simulationResult;

    // Auto-generate insight for every new simulation run
    generateInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationResult]);

  const generateInsight = async () => {
    setIsStreaming(true);
    setText('');
    
    try {
      // Clean up base URL to handle trailing slashes
      const baseUrl = getBaseUrl();
      const apiUrl = `${baseUrl}/api/insight`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulationResult, userProfile, twinState })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        streamBuffer += decoder.decode(value, { stream: true });
        
        // Split by SSE data segments
        let parts = streamBuffer.split('\n\n');
        streamBuffer = parts.pop() || ''; // Keep the incomplete last segment

        for (const part of parts) {
          const line = part.trim();
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              setIsStreaming(false);
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const token = parsed?.text || parsed?.delta?.content || parsed?.content || '';
              if (token) setText(prev => prev + token);
            } catch (e) {
              // If not JSON, it might be raw text from the stream (fallback)
              if (data) setText(prev => prev + data);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Streaming error details, falling back to local analysis:', err);
      
      const type = simulationResult?.scenarioName || simulationResult?.scenarioKey || 'Custom';
      const archetype = twinState?.archetype || 'Balanced Achiever';
      const monthlyIncome = userProfile?.income || 0;
      const expenses = Number(userProfile?.expenses || 0) + Number(userProfile?.variableSpend || 0) + Number(userProfile?.emi || 0);
      const surplus = monthlyIncome - expenses;
      const surplusPct = monthlyIncome > 0 ? ((surplus / monthlyIncome) * 100).toFixed(0) : 0;
      const worst = Math.round(simulationResult?.worstCase || 0);
      const median = Math.round(simulationResult?.median || 0);
      const best = Math.round(simulationResult?.bestCase || 0);
      const dangerMonths = simulationResult?.dangerZoneMonths || 0;

      let offlineInsight = `✦ Offline Advisor Mode\n\n`;
      offlineInsight += `📊 We couldn't connect to the AI model, but our deterministic rules have analyzed your scenario:\n\n`;

      if (type.toLowerCase().includes('quit') || type.toLowerCase().includes('loss') || type.toLowerCase().includes('back') || type.toLowerCase().includes('house')) {
        offlineInsight += `⚠️ **Risk Warning**: Your worst-case outcome drops to ₹${worst.toLocaleString('en-IN')}. ${dangerMonths > 0 ? `This creates a ${dangerMonths}-month exposure in your danger zone.` : ''}\n\n`;
        offlineInsight += `As a "${archetype}", prioritize security here. Since your EMI/expenses total ₹${expenses.toLocaleString('en-IN')}/mo, build a cash reserve of ₹${(expenses * 6).toLocaleString('en-IN')} (6 months coverage) before fully locking in this goal.\n\n`;
        offlineInsight += `1. Hold 6 months of absolute expenses in a liquid savings account.\n2. Reallocate 15% of high-risk equities to short-term treasury bonds.\n3. Secure family health and term insurance to shield against random shocks.\n\n`;
        offlineInsight += `Stay strong; careful planning overcomes market uncertainty.`;
      } else if (type.toLowerCase().includes('double') || type.toLowerCase().includes('wealth') || type.toLowerCase().includes('aggressive') || type.toLowerCase().includes('education')) {
        offlineInsight += `🚀 **Compounding Opportunity**: Your expected median portfolio reaches ₹${median.toLocaleString('en-IN')} at the end of the simulation horizon, with a best-case potential of ₹${best.toLocaleString('en-IN')}.\n\n`;
        offlineInsight += `Your surplus of ₹${surplus.toLocaleString('en-IN')}/mo (${surplusPct}% of income) provides a powerful engine for growth. The "${archetype}" profile has the necessary patience to let compounding do the heavy lifting.\n\n`;
        offlineInsight += `1. Set up auto-debit on your SIPs to enforce savings habits.\n2. Maintain a low-cost Nifty 50 Index Fund as 60% of your equity stack.\n3. Rebalance allocations once a year to lock in gains from overperforming assets.\n\n`;
        offlineInsight += `Time in the market beats timing the market. Keep investing consistently.`;
      } else {
        offlineInsight += `📊 **Standard Path Analysis**: Under realistic market averages, your expected portfolio value reaches ₹${median.toLocaleString('en-IN')}, while the downside is limited to ₹${worst.toLocaleString('en-IN')}.\n\n`;
        offlineInsight += `With a ${surplusPct}% savings rate, you are tracking well. Your "${archetype}" profile fits this stable trajectory perfectly, maintaining steady progress without excessive volatility.\n\n`;
        offlineInsight += `1. Increase your monthly SIP contribution by 10% each year (step-up SIP).\n2. Allocate 15% of your portfolio to fixed-income instruments for downside protection.\n3. Harvest long-term capital gains under ₹1.25L annually to save on taxes.\n\n`;
        offlineInsight += `Consistent habits lead to extraordinary outcomes over a 15-year horizon.`;
      }
      
      setText(offlineInsight);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-blue-500 text-lg">✦</span>
          <h2 className="text-slate-100 text-sm uppercase tracking-widest font-bold">AI Insight</h2>
        </div>
        {text.length > 0 && !isStreaming && (
          <button
            onClick={generateInsight}
            className="text-slate-400 hover:text-blue-500 text-xs font-semibold transition-colors"
          >
            ↻ Regenerate
          </button>
        )}
      </div>

      {!simulationResult ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-slate-500 text-sm">Run a simulation to generate AI insights.</p>
        </div>
      ) : isStreaming || text.length > 0 ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 text-slate-300 text-sm leading-relaxed overflow-y-auto pr-2 custom-scrollbar">
            <StreamingText text={text} isStreaming={isStreaming} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm mt-3">Analyzing your scenario...</p>
        </div>
      )}
    </div>
  );
};

export default StreamingInsight;
