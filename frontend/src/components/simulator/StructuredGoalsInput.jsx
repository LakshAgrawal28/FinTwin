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

  const labelStyle = "block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1.5";
  const inputStyle = "w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 outline-none focus:border-blue-500/50";
  const inlineInfoStyle = "text-[10px] text-slate-500 mt-1.5 flex justify-between";

  return (
    <div className="bg-slate-800 border border-slate-700 rounded p-5 shadow-sm flex flex-col gap-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-100">Structured Goals</h3>
        <p className="text-xs text-slate-400 mt-0.5">Define your milestones mathematically</p>
      </div>

      {/* Goal tabs */}
      <div className="flex bg-slate-900 p-1 rounded border border-slate-700">
        <button
          onClick={() => setActiveTab('house')}
          className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${activeTab === 'house' ? 'bg-blue-900/30 text-blue-500 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
        >
          🏡 House
        </button>
        <button
          onClick={() => setActiveTab('retirement')}
          className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${activeTab === 'retirement' ? 'bg-blue-900/30 text-blue-500 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
        >
          🌅 FIRE
        </button>
        <button
          onClick={() => setActiveTab('education')}
          className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${activeTab === 'education' ? 'bg-blue-900/30 text-blue-500 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
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
                className="w-full accent-blue-500 h-1 bg-slate-700 rounded"
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
                <span className="text-[10px] text-slate-500 mt-1 block">Amt: {formatINR(downPayment)}</span>
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

            <div className="bg-slate-900 rounded p-3 border border-slate-700 space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Loan Principal:</span>
                <span className="text-slate-100 font-semibold">{formatINR(loanAmount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold">Estimated Monthly EMI:</span>
                <span className={`font-bold ${isEmiTooHigh ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {formatINR(calculatedEMI)}/mo
                </span>
              </div>
            </div>

            {isEmiTooHigh && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs p-3 rounded leading-relaxed">
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
                className="w-full accent-blue-500 h-1 bg-slate-700 rounded"
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
              <span className="text-[10px] text-slate-500 mt-1 block">Current monthly expenses: {formatINR(profile?.monthlyExpenses || profile?.expenses || 0)}</span>
            </div>

            <div className="bg-slate-900 rounded p-3 border border-slate-700">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Years to Retirement:</span>
                <span className="text-slate-100 font-semibold">{Math.max(0, retirementAge - (profile?.age || 30))} yrs</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-slate-800">
                <span className="text-slate-400 font-bold">Target FIRE Corpus:</span>
                <span className="text-blue-500 font-bold">
                  {formatINR(monthlyExpensesRet * 12 * 30)}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Calculated via the 30x annual expenses rule</span>
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
                className="w-full accent-blue-500 h-1 bg-slate-700 rounded"
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
                className="w-full accent-blue-500 h-1 bg-slate-700 rounded"
              />
              <div className={inlineInfoStyle}>
                <span>1 yr</span><span>10 yrs</span><span>20 yrs</span>
              </div>
            </div>

            <div className="bg-slate-900 rounded p-3 border border-slate-700">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Future Target (unadjusted):</span>
                <span className="text-slate-100 font-semibold">{formatINR(educationCost)}</span>
              </div>
              <div className="flex justify-between text-xs mt-1.5 pt-1.5 border-t border-slate-800">
                <span className="text-slate-400 font-bold">Education Infl. Cost (8%):</span>
                <span className="text-emerald-500 font-bold">
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
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-75"
      >
        {isSimulating ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>Run Math Simulation <span className="text-lg">→</span></>
        )}
      </button>
    </div>
  );
}
