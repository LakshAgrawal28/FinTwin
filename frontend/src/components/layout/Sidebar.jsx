import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const navItems = [
    { name: 'Twin Overview', path: '/twin' },
    { name: 'Portfolio Health', path: '/investments' },
    { name: 'Rebalance Engine', path: '/rebalance' },
    { name: 'Tax Optimizer', path: '/tax' },
    { name: 'Projections', path: '/projections' },
    { name: 'Scenario Simulator', path: '/simulator' },
    { name: 'Architecture', path: '/methodology' },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-700 h-screen fixed top-0 left-0 flex flex-col hidden md:flex">
      <div className="p-6 border-b border-slate-700 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 text-white rounded flex items-center justify-center font-bold text-sm shadow-sm">
          FT
        </div>
        <div>
          <h1 className="text-slate-50 font-semibold tracking-tight text-lg">FinTwin Quant</h1>
          <p className="text-slate-400 text-xs">Institutional Terminal</p>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Core Modules</p>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block px-3 py-2 rounded transition-all text-sm font-medium ${
                isActive
                  ? 'bg-slate-800 text-blue-400 border-l-2 border-blue-500 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-slate-50 border-l-2 border-transparent'
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-3 py-2 rounded bg-slate-800">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          <span className="text-xs text-slate-300 font-medium tracking-wide">SYSTEM SECURE</span>
        </div>
      </div>
    </aside>
  );
}
