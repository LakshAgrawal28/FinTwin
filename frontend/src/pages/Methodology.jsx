import React from 'react';

export default function Methodology() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans pb-16">
      <div className="w-full px-6 py-8 max-w-5xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-50">Architecture & Methodology</h1>
          <p className="text-slate-400 text-sm mt-3 max-w-2xl mx-auto leading-relaxed">
            FinTwin operates on a hybrid math and AI engine. To ensure complete transparency, this page breaks down exactly how your data is calculated and processed across the platform.
          </p>
        </div>

        {/* Trust Legend */}
        <div className="bg-slate-800 border border-slate-700 rounded p-6 shadow-sm mb-12">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Data Trust Scale</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2 p-4 bg-slate-900/50 rounded border border-emerald-500/20">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                <span className="font-bold text-emerald-400 text-sm">Deterministic Math</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Absolute certainty. Powered by hardcoded formulas, tax slabs, and real-time market API quotes. No AI or assumptions involved.
              </p>
            </div>
            <div className="flex flex-col gap-2 p-4 bg-slate-900/50 rounded border border-amber-500/20">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                <span className="font-bold text-amber-400 text-sm">Probabilistic Engine</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                High statistical confidence. Powered by Monte Carlo simulations running 10,000+ permutations based on historical market variance.
              </p>
            </div>
            <div className="flex flex-col gap-2 p-4 bg-slate-900/50 rounded border border-blue-500/20">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                <span className="font-bold text-blue-400 text-sm">AI Heuristics</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Directional guidance. LLM-powered parsers that translate plain text into math parameters, or generate financial insights based on your data.
              </p>
            </div>
          </div>
        </div>

        {/* Module Breakdown */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 pl-2">Engine Modules</h2>

          {/* Dashboard */}
          <div className="bg-slate-800 border border-slate-700 rounded p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-slate-200">Dashboard & Holdings</h3>
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-[10px] font-bold uppercase tracking-wider">Deterministic</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              The dashboard aggregates your provided portfolio and fetches live real-time quotes for standard tickers.
            </p>
            <ul className="text-sm text-slate-500 space-y-2 list-disc pl-5">
              <li><strong>Math:</strong> <code className="text-slate-300">Sum(Units * Current_API_Price)</code></li>
              <li><strong>Data Source:</strong> Real-time REST API for market prices.</li>
            </ul>
          </div>

          {/* Rebalance Advisor */}
          <div className="bg-slate-800 border border-slate-700 rounded p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-slate-200">Rebalance Advisor</h3>
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-[10px] font-bold uppercase tracking-wider">Deterministic</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              The rebalancing engine calculates the exact buys and sells required to shift your current portfolio to your target allocation without altering your total net worth (excluding taxes).
            </p>
            <ul className="text-sm text-slate-500 space-y-2 list-disc pl-5">
              <li><strong>Math:</strong> Evaluates <code className="text-slate-300">TargetValue - CurrentValue</code> per asset class. Generates proportional Sells for over-allocated assets, and proportional Buys for under-allocated assets.</li>
              <li><strong>Safeguards:</strong> Automatically substitutes standard index funds (e.g., Nifty 50 ETF) if an under-allocated asset class is completely empty in your portfolio.</li>
              <li><strong>Taxation:</strong> Calculates exact STCG/LTCG based on current Indian tax rules and deducts it from the net cash pool.</li>
            </ul>
          </div>

          {/* Tax Optimizer */}
          <div className="bg-slate-800 border border-slate-700 rounded p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-slate-200">Tax Optimizer</h3>
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-[10px] font-bold uppercase tracking-wider">Deterministic</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Compares your tax liability under both the Old and New Indian Income Tax Regimes based on standard deductions and Section 80C limits.
            </p>
            <ul className="text-sm text-slate-500 space-y-2 list-disc pl-5">
              <li><strong>Math:</strong> Hardcoded progressive slab calculations matching FY2024-2025 guidelines.</li>
              <li><strong>Assumption:</strong> Assumes maximum ₹1.5L utilization under 80C for the Old Regime comparison.</li>
            </ul>
          </div>

          {/* Projections */}
          <div className="bg-slate-800 border border-slate-700 rounded p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-slate-200">Wealth Projections</h3>
              <span className="px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded text-[10px] font-bold uppercase tracking-wider">Probabilistic</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Forecasts your future wealth based on your current savings rate and portfolio distribution.
            </p>
            <ul className="text-sm text-slate-500 space-y-2 list-disc pl-5">
              <li><strong>Engine:</strong> Runs 10,000 independent Monte Carlo simulations.</li>
              <li><strong>Math:</strong> Uses geometric Brownian motion. Standard deviations (risk) and expected returns are historically tied to asset classes (e.g., Equity: 12% return, 15% volatility).</li>
              <li><strong>Output:</strong> Displays the 10th percentile (Worst Case), 50th percentile (Median), and 90th percentile (Best Case) paths.</li>
            </ul>
          </div>

          {/* Simulator */}
          <div className="bg-slate-800 border border-slate-700 rounded p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-slate-200">What-If Simulator</h3>
              <span className="px-2 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded text-[10px] font-bold uppercase tracking-wider">Hybrid (AI + Probabilistic)</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              A dual-engine module. First, an AI parses your natural language input into structured mathematical parameters. Second, those parameters are fed into the Monte Carlo engine.
            </p>
            <ul className="text-sm text-slate-500 space-y-2 list-disc pl-5">
              <li><strong>AI Parser:</strong> Uses an LLM to extract intent (e.g., "buy a house in 5 years") into JSON parameters: <code className="text-slate-300">{`{"eventYear": 5, "cost": 8000000}`}</code>.</li>
              <li><strong>Math Engine:</strong> Identical to the Projections Monte Carlo engine, but dynamically deducts cash or reallocates assets mid-simulation based on the parsed AI parameters.</li>
              <li><strong>AI Insight Stream:</strong> A secondary LLM agent reviews the mathematical output and streams back a human-readable analysis of your success probability.</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
