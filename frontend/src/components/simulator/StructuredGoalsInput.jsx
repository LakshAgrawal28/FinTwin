import React, { useState, useEffect } from 'react';
import { formatINR } from '../../utils/formatCurrency';

export default function StructuredGoalsInput({ onScenarioReady, profile, isSimulating }) {
  const [activeTab, setActiveTab] = useState('house'); // 'house' | 'retirement' | 'education'
  
  // House Mortgage State
  const [housePrice, setHousePrice] = useState(8000000); // 80L
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenureYears, setTenureYears] = useState(15);
  const [purchaseYear, setPurchaseYear] = useState(3);

  // Retirement FIRE State
  const [retirementAge, setRetirementAge] = useState(50);
  const [monthlyExpensesRet, setMonthlyExpensesRet] = useState(profile?.monthlyExpenses || profile?.expenses || 50000);

  // Education State
  const [educationCost, setEducationCost] = useState(3000000); // 30L
  const [yearsRemaining, setYearsRemaining] = useState(10);

  const monthlyIncome = Number(profile?.monthlyIncome || profile?.income || 0);

  // Home Loan PMT calculation helper
  const downPayment = housePrice * (downPaymentPct / 100);
  const loanAmount = Math.max(0, housePrice - downPayment);
  const r = interestRate / (12 * 100);
  const n = tenureYears * 12;
  const calculatedEMI = loanAmount > 0 
    ? (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    : 0;

  const isEmiTooHigh = calculatedEMI > monthlyIncome * 0.5;

  const handleSimulate = () => {
    let payload = { type: activeTab };
    if (activeTab === 'house') {
      payload = {
        ...payload,
        purchasePrice: housePrice,
        purchaseYear,
        downPaymentPct,
        interestRate,
        tenureYears,
        scenarioName: 'House Purchase Plan'
      };
    } else if (activeTab === 'retirement') {
      payload = {
        ...payload,
        retirementAge,
        monthlyExpensesInRetirement: Number(monthlyExpensesRet),
        scenarioName: 'Retirement (FIRE) Plan'
      };
    } else if (activeTab === 'education') {
      payload = {
        ...payload,
        targetAmount: educationCost,
        yearsRemaining,
        scenarioName: 'Child Education Fund'
      };
    }
    onScenarioReady(payload);
  };

  // Run automatically on load or tab switch
  useEffect(() => {
    handleSimulate();
  }, [activeTab]);

  const labelStyle = "block text-[11px] uppercase tracking-wider text-[#566580] font-bold mb-1.5";
  const inputStyle = "w-full bg-[#1A2235] border border-white/5 rounded-lg px-3 py-2 text-[13px] text-[#EEF2FF] outline-none focus:border-[#00E5B8]/50";
  const inlineInfoStyle = "text-[11px] text-[#8A9BBF] mt-1.5 flex justify-between";

  return (
    <div className="bg-[#0F1520] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
      <div>
        <h3 className="text-[14px] font-semibold text-[#EEF2FF]">Structured Goals</h3>
        <p className="text-[11px] text-[#566580] mt-0.5">Define your milestones mathematically</p>
      </div>

      {/* Goal tabs */}
      <div className="flex bg-[#161D2B] p-1 rounded-xl border border-white/5">
        <button
          onClick={() => setActiveTab('house')}
          className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-colors ${activeTab === 'house' ? 'bg-[#00E5B8]/10 text-[#00E5B8] border border-[#00E5B8]/20' : 'text-[#8A9BBF] hover:text-[#EEF2FF] border border-transparent'}`}
        >
          🏡 House
        </button>
        <button
          onClick={() => setActiveTab('retirement')}
          className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-colors ${activeTab === 'retirement' ? 'bg-[#00E5B8]/10 text-[#00E5B8] border border-[#00E5B8]/20' : 'text-[#8A9BBF] hover:text-[#EEF2FF] border border-transparent'}`}
        >
          🌅 FIRE
        </button>
        <button
          onClick={() => setActiveTab('education')}
          className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-colors ${activeTab === 'education' ? 'bg-[#00E5B8]/10 text-[#00E5B8] border border-[#00E5B8]/20' : 'text-[#8A9BBF] hover:text-[#EEF2FF] border border-transparent'}`}
        >
          🎓 Education
        </button>
      </div>

      {/* Form Content */}
      <div className="space-y-4">
        {activeTab === 'house' && (
          <>
            <div>
              <label className={labelStyle}>House Price: {formatINR(housePrice)}</label>
              <input 
                type="range" min="1000000" max="100000000" step="500000" 
                value={housePrice} onChange={e => setHousePrice(Number(e.target.value))}
                className="w-full accent-[#00E5B8] h-1 bg-gray-800 rounded appearance-none"
              />
              <div className={inlineInfoStyle}>
                <span>₹10L</span><span>₹5Cr</span><span>₹10Cr</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelStyle}>Down Payment (%)</label>
                <input 
                  type="number" min="5" max="95"
                  value={downPaymentPct} onChange={e => setDownPaymentPct(Number(e.target.value))}
                  className={inputStyle}
                />
                <span className="text-[10px] text-[#566580] mt-1 block">Amt: {formatINR(downPayment)}</span>
              </div>
              <div>
                <label className={labelStyle}>Loan Rate (% p.a.)</label>
                <input 
                  type="number" min="4" max="20" step="0.1"
                  value={interestRate} onChange={e => setInterestRate(Number(e.target.value))}
                  className={inputStyle}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelStyle}>Purchase In (Yrs)</label>
                <input 
                  type="number" min="1" max="15"
                  value={purchaseYear} onChange={e => setPurchaseYear(Number(e.target.value))}
                  className={inputStyle}
                />
              </div>
              <div>
                <label className={labelStyle}>Loan Tenure (Yrs)</label>
                <input 
                  type="number" min="5" max="30"
                  value={tenureYears} onChange={e => setTenureYears(Number(e.target.value))}
                  className={inputStyle}
                />
              </div>
            </div>

            <div className="bg-[#141B28] rounded-xl p-3 border border-white/5 space-y-1">
              <div className="flex justify-between text-[11px] text-[#8A9BBF]">
                <span>Loan Principal:</span>
                <span className="text-[#EEF2FF] font-semibold">{formatINR(loanAmount)}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[#8A9BBF] font-bold">Estimated Monthly EMI:</span>
                <span className={`font-bold ${isEmiTooHigh ? 'text-[#FF4D4D]' : 'text-[#00E5B8]'}`}>
                  {formatINR(calculatedEMI)}/mo
                </span>
              </div>
            </div>

            {isEmiTooHigh && (
              <div className="bg-[#FF4D4D]/10 border border-[#FF4D4D]/20 text-[#FF4D4D] text-[11px] p-3 rounded-lg leading-relaxed">
                ⚠️ **EMI Warning**: This EMI (₹{Math.round(calculatedEMI).toLocaleString('en-IN')}) exceeds 50% of your take-home monthly salary (₹{monthlyIncome.toLocaleString('en-IN')}). Consider increasing the down payment or lowering the budget.
              </div>
            )}
          </>
        )}

        {activeTab === 'retirement' && (
          <>
            <div>
              <label className={labelStyle}>Retirement Age: {retirementAge} yrs</label>
              <input 
                type="range" min="35" max="70" step="1" 
                value={retirementAge} onChange={e => setRetirementAge(Number(e.target.value))}
                className="w-full accent-[#00E5B8] h-1 bg-gray-800 rounded appearance-none"
              />
              <div className={inlineInfoStyle}>
                <span>35</span><span>50</span><span>70</span>
              </div>
            </div>

            <div>
              <label className={labelStyle}>Expenses in Retirement (₹/mo)</label>
              <input 
                type="number" step="5000"
                value={monthlyExpensesRet} onChange={e => setMonthlyExpensesRet(Number(e.target.value))}
                className={inputStyle}
              />
              <span className="text-[10px] text-[#566580] mt-1 block">Current monthly expenses: {formatINR(profile?.monthlyExpenses || profile?.expenses || 0)}</span>
            </div>

            <div className="bg-[#141B28] rounded-xl p-3 border border-white/5">
              <div className="flex justify-between text-[11px] text-[#8A9BBF] mb-1">
                <span>Years to Retirement:</span>
                <span className="text-[#EEF2FF] font-semibold">{Math.max(0, retirementAge - (profile?.age || 30))} yrs</span>
              </div>
              <div className="flex justify-between text-[12px] pt-1 border-t border-white/5">
                <span className="text-[#8A9BBF] font-bold">Target FIRE Corpus:</span>
                <span className="text-[#8B7FFF] font-bold">
                  {formatINR(monthlyExpensesRet * 12 * 30)}
                </span>
              </div>
              <span className="text-[9px] text-[#566580] mt-1 block">Calculated via the 30x annual expenses rule</span>
            </div>
          </>
        )}

        {activeTab === 'education' && (
          <>
            <div>
              <label className={labelStyle}>Target Fund Size: {formatINR(educationCost)}</label>
              <input 
                type="range" min="500000" max="20000000" step="250000" 
                value={educationCost} onChange={e => setEducationCost(Number(e.target.value))}
                className="w-full accent-[#00E5B8] h-1 bg-gray-800 rounded appearance-none"
              />
              <div className={inlineInfoStyle}>
                <span>₹5L</span><span>₹1Cr</span><span>₹2Cr</span>
              </div>
            </div>

            <div>
              <label className={labelStyle}>Years Remaining: {yearsRemaining} yrs</label>
              <input 
                type="range" min="1" max="20" step="1" 
                value={yearsRemaining} onChange={e => setYearsRemaining(Number(e.target.value))}
                className="w-full accent-[#00E5B8] h-1 bg-gray-800 rounded appearance-none"
              />
              <div className={inlineInfoStyle}>
                <span>1 yr</span><span>10 yrs</span><span>20 yrs</span>
              </div>
            </div>

            <div className="bg-[#141B28] rounded-xl p-3 border border-white/5">
              <div className="flex justify-between text-[11px] text-[#8A9BBF]">
                <span>Future Target (unadjusted):</span>
                <span className="text-[#EEF2FF] font-semibold">{formatINR(educationCost)}</span>
              </div>
              <div className="flex justify-between text-[12px] mt-1.5 pt-1.5 border-t border-white/5">
                <span className="text-[#8A9BBF] font-bold">Education Infl. Cost (8%):</span>
                <span className="text-[#22D3A5] font-bold">
                  {formatINR(educationCost * Math.pow(1.08, yearsRemaining))}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleSimulate}
        disabled={isSimulating}
        className="w-full bg-[#00E5B8] hover:bg-[#00C29A] text-[#080C14] font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-75"
      >
        {isSimulating ? (
          <div className="w-5 h-5 border-2 border-[#080C14] border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>Run Math Simulation <span className="text-lg">→</span></>
        )}
      </button>
    </div>
  );
}
