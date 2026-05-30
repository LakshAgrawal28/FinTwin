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

  const loadPreset = (presetName) => {
    if (presetName === 'excellent') {
      setFormData({
        age: 55, retirementAge: 65, income: 150000, expenses: 80000, variableSpend: 20000,
        emi: 0, portfolioValue: 8000000, emotionalChoice: 'Security',
        monthlyIncome: 150000, monthlyExpenses: 80000, monthlyEMI: 0, currentSavings: 1500000,
        monthlyInvestment: 30000, employmentType: 'salaried', taxBracket: 30, dependents: 1,
        hasHealthInsurance: true, hasTermInsurance: true, 
        holdings: [
          { name: 'HDFCBANK', type: 'Equity', units: 500, costBasis: 1400 },
          { name: 'TCS', type: 'Equity', units: 100, costBasis: 3200 },
          { name: 'Gold', type: 'Gold', units: 10, costBasis: 50000 }
        ]
      });
    } else if (presetName === 'danger') {
      setFormData({
        age: 28, retirementAge: 50, income: 250000, expenses: 60000, variableSpend: 40000,
        emi: 30000, portfolioValue: 1500000, emotionalChoice: 'Growth',
        monthlyIncome: 250000, monthlyExpenses: 60000, monthlyEMI: 30000, currentSavings: 300000,
        monthlyInvestment: 100000, employmentType: 'salaried', taxBracket: 30, dependents: 0,
        hasHealthInsurance: false, hasTermInsurance: false, 
        holdings: [
          { name: 'ZOMATO', type: 'Equity', units: 1000, costBasis: 50 },
          { name: 'BTC', type: 'Crypto', units: 2, costBasis: 3000000 }
        ]
      });
    } else if (presetName === 'average') {
      setFormData({
        age: 35, retirementAge: 60, income: 90000, expenses: 45000, variableSpend: 15000,
        emi: 15000, portfolioValue: 500000, emotionalChoice: 'Balance',
        monthlyIncome: 90000, monthlyExpenses: 45000, monthlyEMI: 15000, currentSavings: 100000,
        monthlyInvestment: 10000, employmentType: 'salaried', taxBracket: 20, dependents: 2,
        hasHealthInsurance: true, hasTermInsurance: false, 
        holdings: [
          { name: 'RELIANCE', type: 'Equity', units: 50, costBasis: 2400 },
          { name: 'INFY', type: 'Equity', units: 30, costBasis: 1300 }
        ]
      });
    }
    setError(null);
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

  const surplus = useMemo(() => {
    const inc = Number(formData.monthlyIncome) || Number(formData.income) || 0;
    const exp = Number(formData.monthlyExpenses) || Number(formData.expenses) || 0;
    const emi = Number(formData.monthlyEMI) || Number(formData.emi) || 0;
    const inv = Number(formData.monthlyInvestment) || 0;
    return inc - exp - emi - inv;
  }, [formData]);

  const surplusColorClass = surplus >= 0 ? 'text-emerald-500' : 'text-rose-500';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    const age = Number(formData.age) || 30;
    const retAge = Number(formData.retirementAge) || 60;
    
    if (age < 18) {
      setError("Age must be at least 18.");
      return;
    }
    if (retAge <= age) {
      setError("Retirement age must be strictly greater than your current age.");
      return;
    }

    setIsLoading(true);
    
    try {
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
      
      // Strict server requirement
      const twinResult = await postProfile(profile);
      setTwinState(twinResult);

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
    } catch (err) {
      console.error("Backend profile API failed:", err);
      setError("System Offline: Unable to connect to FinTwin Institutional backend. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = "w-full bg-slate-900 border border-slate-700 rounded px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500 transition-colors";

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
      <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded p-4 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-10 h-10 bg-blue-600 text-white rounded flex items-center justify-center font-bold text-xl">FT</div>
          <h1 className="text-2xl font-bold">FinTwin</h1>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[0, 1, 2].map(step => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                currentStep === step ? 'bg-blue-600 text-white' : currentStep > step ? 'bg-blue-900/40 text-blue-500' : 'bg-slate-700 text-slate-400'
              }`}>
                {currentStep > step ? '✓' : step + 1}
              </div>
              {step < 2 && <div className={`w-8 h-0.5 ${currentStep > step ? 'bg-blue-600' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>
        
        <h2 className="text-sm font-semibold mb-4 text-center text-slate-400 uppercase tracking-widest">
          {currentStep === 0 ? 'Build Your Financial Twin' : currentStep === 1 ? 'Your Monthly Cash Flow' : 'Actual Portfolio Entry'}
        </h2>

        {currentStep === 0 && (
          <div className="flex gap-2 mb-6 justify-center">
            <button onClick={() => loadPreset('danger')} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded border border-slate-600 transition-colors">Preset: Danger</button>
            <button onClick={() => loadPreset('average')} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded border border-slate-600 transition-colors">Preset: Average</button>
            <button onClick={() => loadPreset('excellent')} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded border border-slate-600 transition-colors">Preset: Excellent</button>
          </div>
        )}

        {error && (
          <div className="bg-rose-900/20 border border-rose-500/20 text-rose-500 text-sm p-4 rounded mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Your Age</label>
                  <input required type="number" name="age" value={formData.age} onChange={handleChange} min={18} max={70} placeholder="e.g. 28" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Target Retirement Age</label>
                  <input required type="number" name="retirementAge" value={formData.retirementAge} onChange={handleChange} min={40} max={80} placeholder="e.g. 60" className={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Monthly Income (₹)</label>
                  <input required type="number" name="income" value={formData.income} onChange={handleChange} className={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Fixed Expenses (₹)</label>
                  <input required type="number" name="expenses" value={formData.expenses} onChange={handleChange} className={inputStyle} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Variable Spend (₹)</label>
                  <input required type="number" name="variableSpend" value={formData.variableSpend} onChange={handleChange} className={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Monthly EMI (₹)</label>
                  <input required type="number" name="emi" value={formData.emi} onChange={handleChange} className={inputStyle} />
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">Current Portfolio Value (₹)</label>
                <input required type="number" name="portfolioValue" value={formData.portfolioValue} onChange={handleChange} className={inputStyle} />
              </div>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">Primary Financial Drive</label>
                <select name="emotionalChoice" value={formData.emotionalChoice} onChange={handleChange} className={inputStyle + " appearance-none"}>
                  <option value="Security">Security & Peace of Mind</option>
                  <option value="Growth">Maximal Wealth Growth</option>
                  <option value="Independence">Early Financial Independence</option>
                  <option value="Balance">Balanced Lifestyle</option>
                </select>
              </div>
              
              <button 
                type="button"
                onClick={() => { 
                  const age = Number(formData.age) || 30;
                  const retAge = Number(formData.retirementAge) || 60;
                  if (age < 18) { setError("Age must be at least 18."); return; }
                  if (retAge <= age) { setError("Retirement age must be strictly greater than your current age."); return; }
                  setError(null);
                  syncFields(); 
                  setCurrentStep(1); 
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-4 rounded mt-2 transition-colors flex items-center justify-center gap-2"
              >
                Next: Cash Flow Details →
              </button>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-transparent border border-slate-600 hover:bg-slate-700 text-slate-300 font-semibold py-3 px-4 rounded transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                ) : 'Skip & Initialize Twin →'}
              </button>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 text-center mb-2">This powers all calculations — be as accurate as possible</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Monthly Take-Home (₹)</label>
                  <input type="number" name="monthlyIncome" value={formData.monthlyIncome} onChange={handleChange} placeholder="e.g. 85000" className={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Fixed Expenses (₹)</label>
                  <input type="number" name="monthlyExpenses" value={formData.monthlyExpenses} onChange={handleChange} placeholder="Rent, groceries..." className={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Total EMIs (₹)</label>
                  <input type="number" name="monthlyEMI" value={formData.monthlyEMI} onChange={handleChange} placeholder="Home, car loan..." className={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Monthly SIP/Investment (₹)</label>
                  <input type="number" name="monthlyInvestment" value={formData.monthlyInvestment} onChange={handleChange} placeholder="Mutual funds, stocks..." className={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tax Bracket (%)</label>
                  <select name="taxBracket" value={formData.taxBracket} onChange={handleChange} className={inputStyle + " appearance-none"}>
                    <option value={5}>5%</option>
                    <option value={20}>20%</option>
                    <option value={30}>30%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Total Savings (₹)</label>
                  <input type="number" name="currentSavings" value={formData.currentSavings} onChange={handleChange} placeholder="FD, savings..." className={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Employment</label>
                  <select name="employmentType" value={formData.employmentType} onChange={handleChange} className={inputStyle + " appearance-none"}>
                    <option value="salaried">Salaried</option>
                    <option value="business">Business</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Dependents</label>
                  <input type="number" name="dependents" value={formData.dependents} onChange={handleChange} min={0} className={inputStyle} />
                </div>
              </div>

              <div className="flex gap-6 py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="hasHealthInsurance" checked={formData.hasHealthInsurance} onChange={handleChange} className="accent-blue-600" />
                  <span className="text-xs text-slate-400">Health Insurance</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="hasTermInsurance" checked={formData.hasTermInsurance} onChange={handleChange} className="accent-blue-600" />
                  <span className="text-xs text-slate-400">Term Insurance</span>
                </label>
              </div>

              {/* Live Surplus Preview */}
              <div className="bg-slate-900 rounded p-4 border border-slate-700 flex justify-between items-center">
                <span className="text-sm text-slate-400">Monthly Surplus:</span>
                <strong className={`text-lg ${surplusColorClass}`}>
                  ₹{surplus.toLocaleString('en-IN')}
                </strong>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="flex-1 bg-transparent border border-slate-600 text-slate-100 font-semibold py-3 px-4 rounded transition-all hover:bg-slate-700"
                >
                  ← Back
                </button>
                <button 
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded transition-colors flex items-center justify-center gap-2"
                >
                  Next: Portfolio Entry →
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 text-center mb-4">Enter real portfolio holdings limit to top 5. Leave empty to use system estimates.</p>
              
              <div className="bg-slate-900 rounded p-4 border border-slate-700 space-y-3">
                <div className="grid grid-cols-12 gap-2 text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                  <div className="col-span-4">Asset Symbol</div>
                  <div className="col-span-3">Class</div>
                  <div className="col-span-2">Units</div>
                  <div className="col-span-3">Buy Price (₹)</div>
                </div>
                
                {formData.holdings.map((h, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 text-sm items-center border-b border-slate-700 pb-2">
                    <div className="col-span-4 text-slate-100">{h.name}</div>
                    <div className="col-span-3 text-slate-100">{h.type}</div>
                    <div className="col-span-2 text-slate-100">{h.units}</div>
                    <div className="col-span-3 text-slate-100">₹{h.costBasis}</div>
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
                  className="w-full mt-2 py-2 text-xs text-blue-500 border border-blue-500/30 rounded font-bold tracking-wider hover:bg-blue-500/10"
                >
                  + ADD ASSET
                </button>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 bg-transparent border border-slate-600 text-slate-100 font-semibold py-3 px-4 rounded transition-all hover:bg-slate-700"
                >
                  ← Back
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex-none w-3/5 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
