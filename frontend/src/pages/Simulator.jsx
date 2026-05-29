import React, { useState, useEffect } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useTwinStore } from '../store';
import { postSimulate, postSimulateScenario } from '../utils/api';
import ScenarioCard from '../components/simulator/ScenarioCard';
import ScenarioInput from '../components/simulator/ScenarioInput';
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
    <div className="min-h-screen bg-[#080C14] text-[#EEF2FF] font-sans pb-16">
      <div className="max-w-[1600px] mx-auto p-[32px]">
        <div className="flex flex-col lg:flex-row gap-[24px] items-stretch">

          {/* Left Sidebar (280px) */}
          <div className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-6">
            <div>
              <h1 className="text-[16px] font-semibold text-[#EEF2FF]">Run a Scenario</h1>
              <p className="text-[12px] text-[#566580] mt-1">Simulate any life decision.</p>
            </div>

            {/* Mode Toggle */}
            <div className="bg-[#1A2235] rounded-lg border border-white/5 flex overflow-hidden">
              <button
                onClick={() => setMode('preset')}
                className={`flex-1 px-4 py-2 text-[12px] font-semibold transition-colors ${mode === 'preset' ? 'bg-[#00E5B8] text-[#080C14]' : 'text-[#8A9BBF] hover:bg-white/5'}`}
              >
                Preset
              </button>
              <button
                onClick={() => setMode('freeform')}
                className={`flex-1 px-4 py-2 text-[12px] font-semibold transition-colors ${mode === 'freeform' ? 'bg-[#00E5B8] text-[#080C14]' : 'text-[#8A9BBF] hover:bg-white/5'}`}
              >
                AI Free-form
              </button>
            </div>

            {/* Sim Mode Toggle */}
            <div className="bg-[#0F1520] border border-white/5 rounded-xl p-3">
              <h3 className="text-[11px] uppercase tracking-widest text-[#566580] font-bold mb-3">Simulation Mode</h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setSimMode('optimistic')}
                  className={`text-left px-3 py-2 rounded-lg text-[12px] transition-colors border ${simMode === 'optimistic' ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]' : 'border-transparent text-[#8A9BBF] hover:bg-white/5'}`}
                >
                  <div className="font-bold">Optimistic</div>
                  <div className="text-[10px] opacity-70">High growth, low inflation</div>
                </button>
                <button
                  onClick={() => setSimMode('balanced')}
                  className={`text-left px-3 py-2 rounded-lg text-[12px] transition-colors border ${simMode === 'balanced' ? 'bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#3b82f6]' : 'border-transparent text-[#8A9BBF] hover:bg-white/5'}`}
                >
                  <div className="font-bold">Balanced</div>
                  <div className="text-[10px] opacity-70">Realistic historical averages</div>
                </button>
                <button
                  onClick={() => setSimMode('stress-test')}
                  className={`text-left px-3 py-2 rounded-lg text-[12px] transition-colors border ${simMode === 'stress-test' ? 'bg-[#f97316]/10 border-[#f97316]/30 text-[#f97316]' : 'border-transparent text-[#8A9BBF] hover:bg-white/5'}`}
                >
                  <div className="font-bold">Stress-Test</div>
                  <div className="text-[10px] opacity-70">Cynical, crashes, high inflation</div>
                </button>
              </div>
            </div>

            {mode === 'preset' ? (
              <>
                <div>
                  <h3 className="text-[11px] uppercase tracking-widest text-[#566580] font-bold mb-4">Choose a scenario</h3>
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
                  <h3 className="text-[11px] uppercase tracking-widest text-[#566580] font-bold mb-4">Simulation Horizon</h3>
                  <div className="relative pt-6 pb-2">
                    <div className="absolute top-0 text-[11px] text-[#00E5B8] font-bold bg-[#00E5B8]/10 px-2 py-1 rounded transition-all"
                         style={{ left: `calc(${((horizonYears - 5) / 25) * 100}% - 20px)` }}>
                      {horizonYears} yrs
                    </div>
                    <input
                      type="range"
                      min="5" max="30" step="1"
                      value={horizonYears}
                      onChange={(e) => setHorizonYears(parseInt(e.target.value))}
                      className="w-full accent-[#00E5B8] h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: '#00E5B8' }}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] uppercase tracking-widest text-[#566580] font-bold mb-4">Scenario Parameters</h3>
                  <div className="bg-[#0F1520] border border-white/5 rounded-xl p-4">
                    <p className="text-[12px] text-[#8A9BBF] mb-4">{activePreset?.description}</p>
                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[#566580]">Risk Multiplier</span>
                        <span className="text-[#EEF2FF] font-semibold">1.0x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#566580]">Contribution Impact</span>
                        <span className="text-[#EEF2FF] font-semibold">
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
                    className="w-full bg-[#00E5B8] hover:bg-[#00C29A] text-[#080C14] font-bold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSimulating ? (
                      <div className="w-5 h-5 border-2 border-[#080C14] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>Run Simulation <span className="text-lg">→</span></>
                    )}
                  </button>
                  <p className="text-[11px] text-[#566580] text-center mt-3">10,000 Monte Carlo iterations</p>
                </div>
              </>
            ) : (
              <ScenarioInput
                onScenarioReady={handleScenarioReady}
                portfolio={{ holdings: portfolio }}
                profile={userProfile}
                simMode={simMode}
              />
            )}
          </div>

          {/* Center (flex-1) */}
          <div className="flex-1 flex flex-col min-w-0 gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-[#EEF2FF]">Future Net Worth Projection</h2>
              <div className="flex items-center gap-4 text-[11px] font-semibold text-[#566580]">
                {globalYMax > 0 && (
                  <button 
                    onClick={() => setGlobalYMax(0)}
                    className="mr-2 px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors"
                  >
                    ⟲ Reset Scale
                  </button>
                )}
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22D3A5]"></span> P90</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span> P50</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF4D4D]"></span> P10</span>
              </div>
            </div>

            {hasNewFormat ? (
              <div className="bg-[#0F1520] border border-white/5 rounded-2xl p-6 shadow-xl flex-1 flex flex-col min-h-[500px]">
                <div className="flex-1" style={{ minHeight: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="year" tick={{ fill: '#566580', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis domain={yDomain} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} tick={{ fill: '#566580', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <RechartsTooltip
                        contentStyle={{ background: '#080C14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
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
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-gray-800/30 rounded-xl p-4 border border-[#FF4D4D]/10">
                    <div className="text-[11px] text-[#566580] font-bold tracking-wider mb-1">WORST CASE</div>
                    <div className="text-[18px] text-[#FF4D4D] font-bold">{formatINR(simulationResult.worstCase)}</div>
                    <div className="text-[11px] text-[#8A9BBF] mt-1">10th percentile</div>
                  </div>
                  <div className={`bg-gray-800/30 rounded-xl p-4 border ${theme.border}`}>
                    <div className="text-[11px] text-[#566580] font-bold tracking-wider mb-1">MEDIAN</div>
                    <div className="text-[18px] font-bold" style={{ color: theme.main }}>{formatINR(simulationResult.median)}</div>
                    <div className="text-[11px] text-[#8A9BBF] mt-1">50th percentile</div>
                  </div>
                  <div className="bg-gray-800/30 rounded-xl p-4 border border-[#22D3A5]/10">
                    <div className="text-[11px] text-[#566580] font-bold tracking-wider mb-1">BEST CASE</div>
                    <div className="text-[18px] text-[#22D3A5] font-bold">{formatINR(simulationResult.bestCase)}</div>
                    <div className="text-[11px] text-[#8A9BBF] mt-1">90th percentile</div>
                  </div>
                </div>

                {/* Success Rate Badge */}
                <div className="mt-4 bg-[#141B28] rounded-xl p-4 border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[12px] text-[#566580] font-semibold">Simulation Success Rate</span>
                    <p className="text-[11px] text-[#8A9BBF] mt-1">of {simulationResult.simulations?.toLocaleString()} simulations end positive</p>
                  </div>
                  <span className="text-[24px] font-bold" style={{
                    color: simulationResult.successRate >= 0.8 ? '#22c55e' : simulationResult.successRate >= 0.5 ? '#f59e0b' : '#ef4444'
                  }}>
                    {(simulationResult.successRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ) : simulationResult ? (
              <div className="bg-[#0F1520] border border-white/5 rounded-2xl p-6 shadow-xl flex-1 flex flex-col min-h-[500px]">
                {/* Legacy PercentileBandsChart */}
                <div className="flex-1">
                  <PercentileBandsChart data={simulationResult} />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-gray-800/30 rounded-xl p-4 border border-[#FF4D4D]/10">
                    <div className="text-[11px] text-[#566580] font-bold tracking-wider mb-1">DOWNSIDE (P10)</div>
                    <div className="text-[18px] text-[#FF4D4D] font-bold">{formatINR(simulationResult.p10[simulationResult.years.length - 1])}</div>
                  </div>
                  <div className="bg-gray-800/30 rounded-xl p-4 border border-[#00E5B8]/20">
                    <div className="text-[11px] text-[#566580] font-bold tracking-wider mb-1">EXPECTED (P50)</div>
                    <div className="text-[18px] text-[#00E5B8] font-bold">{formatINR(simulationResult.p50[simulationResult.years.length - 1])}</div>
                  </div>
                  <div className="bg-gray-800/30 rounded-xl p-4 border border-[#22D3A5]/10">
                    <div className="text-[11px] text-[#566580] font-bold tracking-wider mb-1">UPSIDE (P90)</div>
                    <div className="text-[18px] text-[#22D3A5] font-bold">{formatINR(simulationResult.p90[simulationResult.years.length - 1])}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#0F1520] border border-white/5 rounded-2xl shadow-xl flex-1 flex items-center justify-center min-h-[500px]">
                <p className="text-[#566580] text-sm">Select a scenario and click Run Simulation</p>
              </div>
            )}

            {/* What-If Comparison */}
            {simulationResult && hasNewFormat && (
              <div className="bg-[#0F1520] border border-white/5 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] font-semibold text-[#EEF2FF]">What-If Comparison</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSetBaseline}
                      className="bg-[#1A2235] text-[#8A9BBF] hover:text-[#EEF2FF] text-[11px] font-semibold px-4 py-2 rounded-lg border border-white/5 transition-colors"
                    >
                      Set as Baseline
                    </button>
                    <button
                      onClick={handleCompareNew}
                      className="bg-[#00E5B8]/10 text-[#00E5B8] text-[11px] font-semibold px-4 py-2 rounded-lg border border-[#00E5B8]/20 transition-colors hover:bg-[#00E5B8]/20"
                    >
                      Compare New Scenario
                    </button>
                  </div>
                </div>
                {comparisonData ? (
                  <div style={{ height: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={comparisonData}>
                        <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="year" tick={{ fill: '#566580', fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis domain={yDomain} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} tick={{ fill: '#566580', fontSize: 10 }} tickLine={false} axisLine={false} />
                        <Line dataKey="baseline" stroke="#6366f1" name="Baseline" strokeDasharray="5 5" />
                        <Line dataKey="scenario" stroke="#22c55e" name="Your Scenario" strokeWidth={2} />
                        <Legend />
                        <RechartsTooltip
                          contentStyle={{ background: '#080C14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                          formatter={v => [`₹${v?.toLocaleString('en-IN')}`, '']}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-[12px] text-[#566580] text-center py-4">Run a simulation, then click "Set as Baseline" to compare scenarios</p>
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
          </div>
        </div>
      </div>
    </div>
  );
}
