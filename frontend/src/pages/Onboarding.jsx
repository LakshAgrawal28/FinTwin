import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTwinStore } from '../store';
import { postProfile, getQuotes } from '../utils/api';

export default function Onboarding() {
  const navigate = useNavigate();
  const setUserProfile = useTwinStore(state => state.setUserProfile);
  const setTwinState = useTwinStore(state => state.setTwinState);
  const resetAll = useTwinStore(state => state.resetAll);
  const setPortfolio = useTwinStore(state => state.setPortfolio);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Step 1: Basic
    age: '',
    retirementAge: '60',
    income: '',
    expenses: '',
    variableSpend: '',
    emi: '',
    portfolioValue: '',
    emotionalChoice: 'Security',
    // Step 2: Cash Flow (new - Upgrade 2)
    monthlyIncome: '',
    monthlyExpenses: '',
    monthlyEMI: '',
    currentSavings: '',
    monthlyInvestment: '',
    employmentType: 'salaried',
    taxBracket: 30,
    dependents: 0,
    hasHealthInsurance: false,
    hasTermInsurance: false,
    holdings: []
  });
  
  const [newHolding, setNewHolding] = useState({ name: '', type: 'Equity', units: '', costBasis: '' });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Sync step 1 fields with step 2 (if step 2 not yet filled)
  const syncFields = () => {
    setFormData(prev => ({
      ...prev,
      monthlyIncome: prev.monthlyIncome || prev.income,
      monthlyExpenses: prev.monthlyExpenses || prev.expenses,
      monthlyEMI: prev.monthlyEMI || prev.emi,
    }));
  };

  const loadPreset = (type) => {
    if (type === 'excellent') {
      setFormData({
        age: 28, retirementAge: 50, income: 250000, expenses: 60000, variableSpend: 20000, emi: 0, portfolioValue: 4500000,
        emotionalChoice: 'Independence', monthlyIncome: 250000, monthlyExpenses: 60000, monthlyEMI: 0,
        currentSavings: 800000, monthlyInvestment: 125000, employmentType: 'salaried', taxBracket: 30, dependents: 0,
        hasHealthInsurance: true, hasTermInsurance: true,
        holdings: [
          { name: 'RELIANCE', type: 'Equity', units: 400, costBasis: 2800 },
          { name: 'NIFTYBEES', type: 'Equity', units: 5000, costBasis: 250 },
          { name: 'LIQUIDCASE', type: 'Debt', units: 1000, costBasis: 1000 }
        ]
      });
      setCurrentStep(0);
    } else {
      setFormData({
        age: 42, retirementAge: 60, income: 90000, expenses: 50000, variableSpend: 15000, emi: 25000, portfolioValue: 150000,
        emotionalChoice: 'Security', monthlyIncome: 90000, monthlyExpenses: 50000, monthlyEMI: 25000,
        currentSavings: 20000, monthlyInvestment: 0, employmentType: 'salaried', taxBracket: 20, dependents: 3,
        hasHealthInsurance: false, hasTermInsurance: false,
        holdings: [
          { name: 'YESBANK', type: 'Equity', units: 1000, costBasis: 24.5 },
          { name: 'IDEA', type: 'Equity', units: 500, costBasis: 12.0 }
        ]
      });
      setCurrentStep(0);
    }
  };

  const surplus = useMemo(() => {
    const inc = Number(formData.monthlyIncome) || Number(formData.income) || 0;
    const exp = Number(formData.monthlyExpenses) || Number(formData.expenses) || 0;
    const emi = Number(formData.monthlyEMI) || Number(formData.emi) || 0;
    const inv = Number(formData.monthlyInvestment) || 0;
    return inc - exp - emi - inv;
  }, [formData]);

  const surplusColor = surplus >= 0 ? '#00E5B8' : '#FF4D4D';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Flush any stale cached data from a previous session
      resetAll();

      const profile = {
        age: Number(formData.age) || 30,
        retirementAge: Number(formData.retirementAge) || 60,
        income: Number(formData.monthlyIncome || formData.income),
        expenses: Number(formData.monthlyExpenses || formData.expenses),
        variableSpend: Number(formData.variableSpend),
        emi: Number(formData.monthlyEMI || formData.emi),
        portfolioValue: Number(formData.portfolioValue),
        emotionalChoice: formData.emotionalChoice,
        // New fields
        monthlyIncome: Number(formData.monthlyIncome || formData.income),
        monthlyExpenses: Number(formData.monthlyExpenses || formData.expenses),
        monthlyEMI: Number(formData.monthlyEMI || formData.emi),
        currentSavings: Number(formData.currentSavings),
        monthlyInvestment: Number(formData.monthlyInvestment),
        employmentType: formData.employmentType,
        taxBracket: Number(formData.taxBracket),
        dependents: Number(formData.dependents),
        hasHealthInsurance: formData.hasHealthInsurance,
        hasTermInsurance: formData.hasTermInsurance,
      };
      
      setUserProfile(profile);
      
      const twinResult = await postProfile(profile);
      setTwinState(twinResult);

      // If user built a custom portfolio, fetch live prices and set it
      if (formData.holdings.length > 0) {
        const enrichedHoldings = [...formData.holdings];
        const symbols = enrichedHoldings.map(h => h.name).join(',');
        try {
          const quotes = await getQuotes(symbols);
          enrichedHoldings.forEach(h => {
             const quote = quotes[h.name];
             if (quote && quote.price) {
               h.currentValue = h.units * quote.price;
             } else {
               // Fallback
               h.currentValue = h.units * h.costBasis;
             }
             h.costBasis = h.units * h.costBasis;
          });
          setPortfolio(enrichedHoldings);
        } catch (err) {
          console.error("Quote error", err);
        }
      }
      
      navigate('/twin');
      console.error(err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to generate your financial twin.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = "w-full bg-[#1A2235] border border-white/5 rounded-lg px-4 py-2.5 text-[14px] text-[#EEF2FF] outline-none focus:border-[#00E5B8]/50";

  return (
    <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center p-6 text-[#EEF2FF] font-sans">
      <div className="w-full max-w-lg bg-[#0F1520] border border-white/5 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-10 h-10 bg-[#00E5B8] text-[#080C14] rounded-xl flex items-center justify-center font-bold text-xl">FT</div>
          <h1 className="text-2xl font-bold">FinTwin</h1>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[0, 1, 2].map(step => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors ${
                currentStep === step ? 'bg-[#00E5B8] text-[#080C14]' : currentStep > step ? 'bg-[#22D3A5]/20 text-[#22D3A5]' : 'bg-[#1A2235] text-[#566580]'
              }`}>
                {currentStep > step ? '✓' : step + 1}
              </div>
              {step < 2 && <div className={`w-8 h-[2px] ${currentStep > step ? 'bg-[#22D3A5]' : 'bg-[#1A2235]'}`} />}
            </div>
          ))}
        </div>
        
        <h2 className="text-[14px] font-semibold mb-4 text-center text-[#566580] uppercase tracking-widest">
          {currentStep === 0 ? 'Build Your Financial Twin' : currentStep === 1 ? 'Your Monthly Cash Flow' : 'Actual Portfolio Entry'}
        </h2>

        {/* Preset Quick Loader */}
        <div className="flex gap-4 justify-center mb-6">
          <button type="button" onClick={() => loadPreset('excellent')} className="text-[11px] bg-[#00E5B8]/10 border border-[#00E5B8]/30 text-[#00E5B8] px-3 py-1.5 rounded-lg font-bold hover:bg-[#00E5B8]/20 transition-colors uppercase tracking-wider">
            ★ Load "Excellent"
          </button>
          <button type="button" onClick={() => loadPreset('danger')} className="text-[11px] bg-[#FF4D4D]/10 border border-[#FF4D4D]/30 text-[#FF4D4D] px-3 py-1.5 rounded-lg font-bold hover:bg-[#FF4D4D]/20 transition-colors uppercase tracking-wider">
            ⚠ Load "Danger"
          </button>
        </div>
        
        {error && (
          <div className="bg-[#FF4D4D]/10 border border-[#FF4D4D]/20 text-[#FF4D4D] text-sm p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] text-[#8A9BBF] mb-1">Your Age</label>
                  <input required type="number" name="age" value={formData.age} onChange={handleChange} min={18} max={70} placeholder="e.g. 28" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[12px] text-[#8A9BBF] mb-1">Target Retirement Age</label>
                  <input required type="number" name="retirementAge" value={formData.retirementAge} onChange={handleChange} min={40} max={80} placeholder="e.g. 60" className={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] text-[#8A9BBF] mb-1">Monthly Income (₹)</label>
                  <input required type="number" name="income" value={formData.income} onChange={handleChange} className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[12px] text-[#8A9BBF] mb-1">Fixed Expenses (₹)</label>
                  <input required type="number" name="expenses" value={formData.expenses} onChange={handleChange} className={inputStyle} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] text-[#8A9BBF] mb-1">Variable Spend (₹)</label>
                  <input required type="number" name="variableSpend" value={formData.variableSpend} onChange={handleChange} className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[12px] text-[#8A9BBF] mb-1">Monthly EMI (₹)</label>
                  <input required type="number" name="emi" value={formData.emi} onChange={handleChange} className={inputStyle} />
                </div>
              </div>
              
              <div>
                <label className="block text-[12px] text-[#8A9BBF] mb-1">Current Portfolio Value (₹)</label>
                <input required type="number" name="portfolioValue" value={formData.portfolioValue} onChange={handleChange} className={inputStyle} />
              </div>
              
              <div>
                <label className="block text-[12px] text-[#8A9BBF] mb-1">Primary Financial Drive</label>
                <select name="emotionalChoice" value={formData.emotionalChoice} onChange={handleChange} className={inputStyle + " appearance-none"}>
                  <option value="Security">Security & Peace of Mind</option>
                  <option value="Growth">Maximal Wealth Growth</option>
                  <option value="Independence">Early Financial Independence</option>
                  <option value="Balance">Balanced Lifestyle</option>
                </select>
              </div>
              
              <button 
                type="button"
                onClick={() => { syncFields(); setCurrentStep(1); }}
                className="w-full bg-[#00E5B8] hover:bg-[#00C29A] text-[#080C14] font-bold py-3.5 px-4 rounded-xl mt-2 transition-colors flex items-center justify-center gap-2"
              >
                Next: Cash Flow Details →
              </button>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-transparent border border-[#566580] hover:bg-white/5 text-[#EEF2FF] font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-[#EEF2FF] border-t-transparent rounded-full animate-spin"></div>
                ) : 'Skip & Initialize Twin →'}
              </button>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-[12px] text-[#8A9BBF] text-center mb-2">This powers all calculations — be as accurate as possible</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] text-[#8A9BBF] mb-1">Monthly Take-Home (₹)</label>
                  <input type="number" name="monthlyIncome" value={formData.monthlyIncome} onChange={handleChange} placeholder="e.g. 85000" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[12px] text-[#8A9BBF] mb-1">Fixed Expenses (₹)</label>
                  <input type="number" name="monthlyExpenses" value={formData.monthlyExpenses} onChange={handleChange} placeholder="Rent, groceries..." className={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] text-[#8A9BBF] mb-1">Total EMIs (₹)</label>
                  <input type="number" name="monthlyEMI" value={formData.monthlyEMI} onChange={handleChange} placeholder="Home, car loan..." className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[12px] text-[#8A9BBF] mb-1">Monthly SIP/Investment (₹)</label>
                  <input type="number" name="monthlyInvestment" value={formData.monthlyInvestment} onChange={handleChange} placeholder="Mutual funds, stocks..." className={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] text-[#8A9BBF] mb-1">Tax Bracket (%)</label>
                  <select name="taxBracket" value={formData.taxBracket} onChange={handleChange} className={inputStyle + " appearance-none"}>
                    <option value={5}>5%</option>
                    <option value={20}>20%</option>
                    <option value={30}>30%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] text-[#8A9BBF] mb-1">Total Savings (₹)</label>
                  <input type="number" name="currentSavings" value={formData.currentSavings} onChange={handleChange} placeholder="FD, savings..." className={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] text-[#8A9BBF] mb-1">Employment</label>
                  <select name="employmentType" value={formData.employmentType} onChange={handleChange} className={inputStyle + " appearance-none"}>
                    <option value="salaried">Salaried</option>
                    <option value="business">Business</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] text-[#8A9BBF] mb-1">Dependents</label>
                  <input type="number" name="dependents" value={formData.dependents} onChange={handleChange} min={0} className={inputStyle} />
                </div>
              </div>

              <div className="flex gap-6 py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="hasHealthInsurance" checked={formData.hasHealthInsurance} onChange={handleChange} className="accent-[#00E5B8]" />
                  <span className="text-[12px] text-[#8A9BBF]">Health Insurance</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="hasTermInsurance" checked={formData.hasTermInsurance} onChange={handleChange} className="accent-[#00E5B8]" />
                  <span className="text-[12px] text-[#8A9BBF]">Term Insurance</span>
                </label>
              </div>

              {/* Live Surplus Preview */}
              <div className="bg-[#141B28] rounded-xl p-4 border border-white/5 flex justify-between items-center">
                <span className="text-[13px] text-[#8A9BBF]">Monthly Surplus:</span>
                <strong style={{ color: surplusColor, fontSize: '16px' }}>
                  ₹{surplus.toLocaleString('en-IN')}
                </strong>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="flex-1 bg-transparent border border-[#566580] text-[#EEF2FF] font-semibold py-3 px-4 rounded-xl transition-all hover:bg-white/5"
                >
                  ← Back
                </button>
                <button 
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 bg-[#00E5B8] hover:bg-[#00C29A] text-[#080C14] font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  Next: Portfolio Entry →
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-[12px] text-[#8A9BBF] text-center mb-4">Enter real portfolio holdings limit to top 5. Leave empty to use system estimates.</p>
              
              <div className="bg-[#141B28] rounded-xl p-4 border border-white/5 space-y-3">
                <div className="grid grid-cols-12 gap-2 text-[11px] text-[#566580] uppercase tracking-wider font-bold">
                  <div className="col-span-4">Asset Symbol</div>
                  <div className="col-span-3">Class</div>
                  <div className="col-span-2">Units</div>
                  <div className="col-span-3">Buy Price (₹)</div>
                </div>
                
                {formData.holdings.map((h, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 text-[13px] items-center border-b border-white/5 pb-2">
                    <div className="col-span-4 text-[#EEF2FF]">{h.name}</div>
                    <div className="col-span-3 text-[#EEF2FF]">{h.type}</div>
                    <div className="col-span-2 text-[#EEF2FF]">{h.units}</div>
                    <div className="col-span-3 text-[#EEF2FF]">₹{h.costBasis}</div>
                  </div>
                ))}

                {formData.holdings.length < 10 && (
                  <div className="grid grid-cols-12 gap-2">
                    <input className={`col-span-4 ${inputStyle} py-1.5 px-2`} value={newHolding.name} onChange={e => setNewHolding({...newHolding, name: e.target.value})} placeholder="RELIANCE" />
                    <select className={`col-span-3 ${inputStyle} py-1.5 px-1 appearance-none`} value={newHolding.type} onChange={e => setNewHolding({...newHolding, type: e.target.value})}>
                      <option value="Equity">Equity</option>
                      <option value="Debt">Debt</option>
                      <option value="Gold">Gold</option>
                      <option value="Crypto">Crypto</option>
                    </select>
                    <input type="number" className={`col-span-2 ${inputStyle} py-1.5 px-2`} value={newHolding.units} onChange={e => setNewHolding({...newHolding, units: Number(e.target.value)})} placeholder="10" />
                    <input type="number" className={`col-span-3 ${inputStyle} py-1.5 px-2`} value={newHolding.costBasis} onChange={e => setNewHolding({...newHolding, costBasis: Number(e.target.value)})} placeholder="2500" />
                  </div>
                )}
                
                <button 
                  type="button" 
                  onClick={() => {
                    if(newHolding.name && newHolding.units && newHolding.costBasis) {
                      setFormData(prev => ({...prev, holdings: [...prev.holdings, newHolding]}));
                      setNewHolding({ name: '', type: 'Equity', units: '', costBasis: '' });
                    }
                  }}
                  className="w-full mt-2 py-2 text-[12px] text-[#00E5B8] border border-[#00E5B8]/30 rounded-lg font-bold tracking-wider hover:bg-[#00E5B8]/10"
                >
                  + ADD ASSET
                </button>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 bg-transparent border border-[#566580] text-[#EEF2FF] font-semibold py-3 px-4 rounded-xl transition-all hover:bg-white/5"
                >
                  ← Back
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex-none w-3/5 bg-[#00E5B8] hover:bg-[#00C29A] text-[#080C14] font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-[#080C14] border-t-transparent rounded-full animate-spin"></div>
                  ) : formData.holdings.length > 0 ? 'Init Twin using Portfolio →' : 'Skip & Init Estimated →'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
