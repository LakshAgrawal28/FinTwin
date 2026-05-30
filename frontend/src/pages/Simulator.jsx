import React, { useState, useEffect } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useTwinStore } from '../store';
import { postSimulate, postSimulateScenario } from '../utils/api';
import ScenarioCard from '../components/simulator/ScenarioCard';
import StructuredGoalsInput from '../components/simulator/StructuredGoalsInput';
import CashflowWaterfall from '../components/simulator/CashflowWaterfall';
import PercentileBandsChart from '../components/simulator/PercentileBandsChart';
import StreamingInsight from '../components/simulator/StreamingInsight';
import { formatINR } from '../utils/formatCurrency';

const SCENARIOS = [
  { key: 'quitJob', name: 'Quit my job', description: 'Lose 100% of income for 6 months to freelance, drawing from portfolio' },
  { key: 'pauseSIP', name: 'Pause SIP for 2 Years', description: 'Stop all portfolio contributions for 24 months' },
  { key: 'doubleSIP', name: 'Double my SIP', description: 'Increase monthly contribution by 100% permanently' }
];

export default function Simulator() {
  const [selectedScenario, setSelectedScenario] = useState('pauseSIP');
  const [isSimulating, setIsSimulating] = useState(false);
  const [horizonYears, setHorizonYears] = useState(15);
  const [mode, setMode] = useState('preset'); // 'preset' | 'freeform'
  const [simMode, setSimMode] = useState('balanced'); // 'optimistic' | 'balanced' | 'stress-test'
  const [globalYMax, setGlobalYMax] = useState(0);

  // What-If Comparison
  const [baselineResult, setBaselineResult] = useState(null);

  const userProfile = useTwinStore(state => state.userProfile);
  const twinState = useTwinStore(state => state.twinState) || {};
  const simulationResult = useTwinStore(state => state.simulationResult);
  const setSimulationResult = useTwinStore(state => state.setSimulationResult);
  const portfolio = useTwinStore(state => state.portfolio) || [];

  const handleRunPreset = async () => {
    if (!userProfile) {
      alert('Please complete onboarding first.');
      return;
    }
    setIsSimulating(true);
    try {
      const result = await postSimulate(userProfile, selectedScenario, { holdings: portfolio }, horizonYears, 1000, simMode);
      setSimulationResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };



  const handleScenarioReady = async (scenario) => {

    setIsSimulating(true);
    try {
      const result = await postSimulateScenario(scenario, userProfile, { holdings: portfolio }, userProfile, simMode);
      setSimulationResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };


  const handleSetBaseline = () => {
    if (simulationResult) setBaselineResult(simulationResult);
  };

  const handleCompareNew = async () => {
    if (!simulationResult) return;
    setBaselineResult(simulationResult);
    // Next simulation will be the comparison
  };

  // Build chart data from new format (yearlyPercentiles)
  const hasNewFormat = simulationResult?.yearlyPercentiles;

  const chartData = hasNewFormat
    ? simulationResult.yearlyPercentiles.map(d => ({
        year: `Y${d.year}`,
        best: Math.round(d.p90),
        good: Math.round(d.p75),
        median: Math.round(d.p50),
        poor: Math.round(d.p25),
        worst: Math.round(d.p10),
      }))
    : [];

  useEffect(() => {
    if (chartData.length > 0) {
      const currentPeak = Math.max(...chartData.map(d => d.best || 0));
      if (currentPeak > globalYMax) {
        setGlobalYMax(currentPeak);
      }
    } else if (simulationResult && !hasNewFormat) {
      const currentPeak = Math.max(...(simulationResult.p90 || []));
      if (currentPeak > globalYMax) {
        setGlobalYMax(currentPeak);
      }
    }
  }, [simulationResult, hasNewFormat]);

  const yDomain = globalYMax > 0 ? [0, globalYMax * 1.1] : ['auto', 'auto'];

  const getThemeColor = () => {
    if (simMode === 'optimistic') return { main: '#22c55e', bg: '#22c55e22', border: 'border-[#22c55e]/20' };
    if (simMode === 'stress-test') return { main: '#f97316', bg: '#f9731622', border: 'border-[#f97316]/20' }; // orange/red tone
    return { main: '#3b82f6', bg: '#3b82f622', border: 'border-[#3b82f6]/20' }; // balanced
  };
  const theme = getThemeColor();

  // Comparison chart data
  const comparisonData = baselineResult?.yearlyPercentiles && simulationResult?.yearlyPercentiles
    ? baselineResult.yearlyPercentiles.map((base, i) => {
        const scen = simulationResult.yearlyPercentiles[i];
        return {
          year: `Y${base.year}`,
          baseline: Math.round(base.p50),
          scenario: scen ? Math.round(scen.p50) : null,
        };
      })
    : null;

  const activePreset = SCENARIOS.find(s => s.key === selectedScenario);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans pb-16">
      <div className="w-full px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-stretch">

          {/* Left Sidebar (280px) */}
          <div className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-6">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-50">Run a Scenario</h1>
              <p className="text-xs text-slate-400 mt-1">Simulate any life decision.</p>
            </div>

            {/* Mode Toggle */}
            <div className="bg-slate-800 rounded border border-slate-700 flex overflow-hidden">
              <button
                onClick={() => setMode('preset')}
                className={`flex-1 px-4 py-2 text-xs font-semibold transition-colors ${mode === 'preset' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
              >
                Preset
              </button>
              <button
                onClick={() => setMode('structured')}
                className={`flex-1 px-4 py-2 text-xs font-semibold transition-colors ${mode === 'structured' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
              >
                Structured Goals
              </button>
            </div>

            {/* Sim Mode Toggle */}
            <div className="bg-slate-800 border border-slate-700 rounded p-4 shadow-sm">
              <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3">Simulation Mode</h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setSimMode('optimistic')}
                  className={`text-left px-3 py-2 rounded text-xs transition-colors border ${simMode === 'optimistic' ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-500' : 'border-transparent text-slate-400 hover:bg-slate-700'}`}
                >
                  <div className="font-bold">Optimistic</div>
                  <div className="text-[10px] opacity-70">High growth, low inflation</div>
                </button>
                <button
                  onClick={() => setSimMode('balanced')}
                  className={`text-left px-3 py-2 rounded text-xs transition-colors border ${simMode === 'balanced' ? 'bg-blue-900/30 border-blue-500/50 text-blue-500' : 'border-transparent text-slate-400 hover:bg-slate-700'}`}
                >
                  <div className="font-bold">Balanced</div>
                  <div className="text-[10px] opacity-70">Realistic historical averages</div>
                </button>
                <button
                  onClick={() => setSimMode('stress-test')}
                  className={`text-left px-3 py-2 rounded text-xs transition-colors border ${simMode === 'stress-test' ? 'bg-amber-900/30 border-amber-500/50 text-amber-500' : 'border-transparent text-slate-400 hover:bg-slate-700'}`}
                >
                  <div className="font-bold">Stress-Test</div>
                  <div className="text-[10px] opacity-70">Cynical, crashes, high inflation</div>
                </button>
              </div>
            </div>

            {mode === 'preset' ? (
              <>
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">Choose a scenario</h3>
                  <div className="flex flex-col">
                    {SCENARIOS.map(s => (
                      <ScenarioCard
                        key={s.key}
                        scenario={s}
                        isSelected={selectedScenario === s.key}
                        onSelect={setSelectedScenario}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">Simulation Horizon</h3>
                  <div className="relative pt-6 pb-2">
                    <div className="absolute top-0 text-[10px] text-blue-500 font-bold bg-blue-900/30 px-2 py-1 rounded transition-all"
                         style={{ left: `calc(${((horizonYears - 5) / 25) * 100}% - 20px)` }}>
                      {horizonYears} yrs
                    </div>
                    <input
                      type="range"
                      min="5" max="30" step="1"
                      value={horizonYears}
                      onChange={(e) => setHorizonYears(parseInt(e.target.value))}
                      className="w-full accent-blue-500 h-2 bg-slate-700 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">Scenario Parameters</h3>
                  <div className="bg-slate-800 border border-slate-700 rounded p-4 shadow-sm">
                    <p className="text-xs text-slate-400 mb-4">{activePreset?.description}</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Risk Multiplier</span>
                        <span className="text-slate-200 font-semibold">1.0x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Contribution Impact</span>
                        <span className="text-slate-200 font-semibold">
                          {selectedScenario === 'pauseSIP' ? '-100% (24 mo)' : selectedScenario === 'doubleSIP' ? '+100% (Perm)' : '-100% (6 mo)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2">
                  <button
                    onClick={handleRunPreset}
                    disabled={isSimulating}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSimulating ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>Run Simulation <span className="text-lg">→</span></>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-500 text-center mt-3 uppercase tracking-widest">10,000 Monte Carlo iterations</p>
                </div>
              </>
            ) : (
              <StructuredGoalsInput
                onScenarioReady={handleScenarioReady}
                profile={userProfile}
                isSimulating={isSimulating}
              />
            )}
          </div>

          {/* Center (flex-1) */}
          <div className="flex-1 flex flex-col min-w-0 gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-slate-50">Future Net Worth Projection</h2>
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                {globalYMax > 0 && (
                  <button 
                    onClick={() => setGlobalYMax(0)}
                    className="mr-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded border border-slate-600 transition-colors"
                  >
                    ⟲ Reset Scale
                  </button>
                )}
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> P90</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> P50</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> P10</span>
              </div>
            </div>

            {hasNewFormat ? (
              <div className="bg-slate-800 border border-slate-700 rounded p-6 shadow-sm flex-1 flex flex-col min-h-[500px]">
                <div className="flex-1" style={{ minHeight: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                      <CartesianGrid stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
                      <XAxis dataKey="year" tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis domain={yDomain} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <RechartsTooltip
                        contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '4px', fontSize: '12px', color: '#F8FAFC' }}
                        formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, '']}
                      />
                      <Area type="monotone" dataKey="best" stroke="#22c55e" fill="#22c55e22" name="Best (90th %ile)" />
                      <Area type="monotone" dataKey="good" stroke="#22D3A5" fill="#22D3A510" name="Good (75th %ile)" />
                      <Area type="monotone" dataKey="median" stroke={theme.main} fill={theme.bg} name="Median" strokeWidth={2} />
                      <Area type="monotone" dataKey="poor" stroke="#f59e0b" fill="#f59e0b10" name="Poor (25th %ile)" />
                      <Area type="monotone" dataKey="worst" stroke="#ef4444" fill="#ef444422" name="Worst (10th %ile)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="bg-slate-900 rounded p-4 border border-rose-500/20">
                    <div className="text-[10px] text-slate-400 font-bold tracking-widest mb-1 uppercase">Worst Case</div>
                    <div className="text-lg text-rose-500 font-bold">{formatINR(simulationResult.worstCase)}</div>
                    <div className="text-xs text-slate-500 mt-1">10th percentile</div>
                  </div>
                  <div className={`bg-slate-900 rounded p-4 border ${theme.border}`}>
                    <div className="text-[10px] text-slate-400 font-bold tracking-widest mb-1 uppercase">Median</div>
                    <div className="text-lg font-bold" style={{ color: theme.main }}>{formatINR(simulationResult.median)}</div>
                    <div className="text-xs text-slate-500 mt-1">50th percentile</div>
                  </div>
                  <div className="bg-slate-900 rounded p-4 border border-emerald-500/20">
                    <div className="text-[10px] text-slate-400 font-bold tracking-widest mb-1 uppercase">Best Case</div>
                    <div className="text-lg text-emerald-500 font-bold">{formatINR(simulationResult.bestCase)}</div>
                    <div className="text-xs text-slate-500 mt-1">90th percentile</div>
                  </div>
                </div>

                {/* Success Rate Badge */}
                <div className="mt-4 bg-slate-900 rounded p-4 border border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-slate-200 font-semibold">Simulation Success Rate</span>
                    <p className="text-xs text-slate-500 mt-1">of {simulationResult.simulations?.toLocaleString()} simulations end positive</p>
                  </div>
                  <span className="text-2xl font-bold" style={{
                    color: simulationResult.successRate >= 0.8 ? '#10B981' : simulationResult.successRate >= 0.5 ? '#F59E0B' : '#EF4444'
                  }}>
                    {(simulationResult.successRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ) : simulationResult ? (
              <div className="bg-slate-800 border border-slate-700 rounded p-6 shadow-sm flex-1 flex flex-col min-h-[500px]">
                {/* Legacy PercentileBandsChart */}
                <div className="flex-1">
                  <PercentileBandsChart data={simulationResult} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="bg-slate-900 rounded p-4 border border-rose-500/20">
                    <div className="text-[10px] text-slate-400 font-bold tracking-widest mb-1 uppercase">DOWNSIDE (P10)</div>
                    <div className="text-lg text-rose-500 font-bold">{formatINR(simulationResult.p10[simulationResult.years.length - 1])}</div>
                  </div>
                  <div className="bg-slate-900 rounded p-4 border border-blue-500/20">
                    <div className="text-[10px] text-slate-400 font-bold tracking-widest mb-1 uppercase">EXPECTED (P50)</div>
                    <div className="text-lg text-blue-500 font-bold">{formatINR(simulationResult.p50[simulationResult.years.length - 1])}</div>
                  </div>
                  <div className="bg-slate-900 rounded p-4 border border-emerald-500/20">
                    <div className="text-[10px] text-slate-400 font-bold tracking-widest mb-1 uppercase">UPSIDE (P90)</div>
                    <div className="text-lg text-emerald-500 font-bold">{formatINR(simulationResult.p90[simulationResult.years.length - 1])}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded shadow-sm flex-1 flex items-center justify-center min-h-[500px]">
                <p className="text-slate-400 text-sm">Select a scenario and click Run Simulation</p>
              </div>
            )}

            {/* What-If Comparison */}
            {simulationResult && hasNewFormat && (
              <div className="bg-slate-800 border border-slate-700 rounded p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-100">What-If Comparison</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSetBaseline}
                      className="bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-semibold px-4 py-2 rounded border border-slate-700 transition-colors"
                    >
                      Set as Baseline
                    </button>
                    <button
                      onClick={handleCompareNew}
                      className="bg-blue-900/30 text-blue-500 text-xs font-semibold px-4 py-2 rounded border border-blue-500/50 transition-colors hover:bg-blue-900/50"
                    >
                      Compare New Scenario
                    </button>
                  </div>
                </div>
                {comparisonData ? (
                  <div style={{ height: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={comparisonData}>
                        <CartesianGrid stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
                        <XAxis dataKey="year" tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis domain={yDomain} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} axisLine={false} />
                        <Line dataKey="baseline" stroke="#94A3B8" name="Baseline" strokeDasharray="5 5" />
                        <Line dataKey="scenario" stroke="#3B82F6" name="Your Scenario" strokeWidth={2} />
                        <Legend />
                        <RechartsTooltip
                          contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '4px', fontSize: '12px', color: '#F8FAFC' }}
                          formatter={v => [`₹${v?.toLocaleString('en-IN')}`, '']}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">Run a simulation, then click "Set as Baseline" to compare scenarios</p>
                )}
              </div>
            )}
          </div>

          {/* Right Panel (300px) */}
          <div className="w-full lg:w-[300px] flex-shrink-0 flex flex-col gap-6">
            {simulationResult && (
              <div className="h-[400px]">
                <StreamingInsight userProfile={userProfile || {}} twinState={twinState} simulationResult={simulationResult} />
              </div>
            )}
            <CashflowWaterfall
              profile={userProfile}
              goalEMI={simulationResult?.calculatedEMI || 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
