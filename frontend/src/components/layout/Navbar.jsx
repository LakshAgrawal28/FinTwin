import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTwinStore } from '../../store';

const Navbar = () => {
  const navigate = useNavigate();
  const userProfile = useTwinStore(state => state.userProfile);
  const resetAll = useTwinStore(state => state.resetAll);
  const [isOpen, setIsOpen] = useState(false);

  // Compute initials
  const nameToUse = userProfile?.name || 'User';
  const parts = nameToUse.split(' ').filter(Boolean);
  let initials = 'U';
  if (parts.length >= 2) {
    initials = (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (parts.length === 1) {
    initials = parts[0].substring(0, 2).toUpperCase();
  }

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset your FinTwin account? This will clear all data.")) {
      resetAll();
      setIsOpen(false);
      navigate('/');
    }
  };

  const navItemClass = ({ isActive }) => 
    `flex items-center gap-3 px-4 py-2 md:px-4 md:py-2.5 rounded-xl text-[13px] md:text-[14px] font-bold transition-all duration-200 border w-full md:w-auto ${
      isActive 
        ? 'bg-blue-900/20 text-blue-500 border-blue-500/20 shadow-sm' 
        : 'text-slate-400 border-transparent hover:text-slate-50 hover:bg-slate-700/50'
    }`;

  // SVG Icons
  const Icons = {
    Home: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    Simulator: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h4l2-9 5 18 3-13 4 8h4"/>
      </svg>
    ),
    Investments: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
    Rebalance: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 16 4 4 4-4" />
        <path d="M7 20V4" />
        <path d="m21 8-4-4-4 4" />
        <path d="M17 4v16" />
      </svg>
    ),
    Projections: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" x2="18" y1="20" y2="10" />
        <line x1="12" x2="12" y1="20" y2="4" />
        <line x1="6" x2="6" y1="20" y2="14" />
      </svg>
    ),
    Tax: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    )
  };

  return (
    <nav className="h-16 md:h-20 bg-slate-900 border-b border-slate-700 flex items-center px-4 md:px-8 justify-between sticky top-0 z-50 shadow-xl">
      
      {/* Left: Logo & Tagline */}
      <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/twin')}>
        <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-sm md:text-base shadow-sm transition-transform hover:scale-105">
          FT
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] md:text-[18px] font-black text-slate-50 leading-none mb-1 tracking-tight">
            FinTwin
          </span>
          <span className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-widest font-black leading-none">
            Your Financial Twin
          </span>
        </div>
      </div>

      {/* Center: Desktop Links */}
      <div className="hidden md:flex gap-2 items-center bg-slate-800 border border-slate-700 p-1.5 rounded-2xl shadow-inner">
        <NavLink to="/twin" className={navItemClass}>
          {Icons.Home} Twin Home
        </NavLink>
        <NavLink to="/investments" className={navItemClass}>
          {Icons.Investments} Investments
        </NavLink>
        <NavLink to="/rebalance" className={navItemClass}>
          {Icons.Rebalance} Rebalance
        </NavLink>
        <NavLink to="/tax" className={navItemClass}>
          {Icons.Tax} Tax
        </NavLink>
        <NavLink to="/projections" className={navItemClass}>
          {Icons.Projections} Projections
        </NavLink>
        <NavLink to="/simulator" className={navItemClass}>
          {Icons.Simulator} Simulator
        </NavLink>
      </div>

      {/* Right: Desktop Actions */}
      <div className="hidden md:flex items-center gap-6">
        <button 
          onClick={handleReset}
          className="text-slate-400 hover:text-rose-500 text-[11px] font-bold transition-colors uppercase tracking-widest"
        >
          Reset Setup
        </button>
        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-500 text-[12px] font-black shadow-sm">
          {initials}
        </div>
      </div>

      {/* Mobile Hamburger & Actions */}
      <div className="flex md:hidden items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-500 text-[11px] font-black shadow-sm">
          {initials}
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-400 hover:text-slate-50 focus:outline-none p-1.5"
          aria-label="Toggle Menu"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Dropdown Drawer */}
      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-slate-900/98 backdrop-blur-md border-b border-slate-700 z-50 flex flex-col p-4 gap-3 md:hidden animate-fade-in shadow-2xl">
          <NavLink to="/twin" onClick={() => setIsOpen(false)} className={navItemClass}>
            {Icons.Home} Twin Home
          </NavLink>
          <NavLink to="/investments" onClick={() => setIsOpen(false)} className={navItemClass}>
            {Icons.Investments} Investments
          </NavLink>
          <NavLink to="/rebalance" onClick={() => setIsOpen(false)} className={navItemClass}>
            {Icons.Rebalance} Rebalance
          </NavLink>
          <NavLink to="/tax" onClick={() => setIsOpen(false)} className={navItemClass}>
            {Icons.Tax} Tax
          </NavLink>
          <NavLink to="/projections" onClick={() => setIsOpen(false)} className={navItemClass}>
            {Icons.Projections} Projections
          </NavLink>
          <NavLink to="/simulator" onClick={() => setIsOpen(false)} className={navItemClass}>
            {Icons.Simulator} Simulator
          </NavLink>
          
          <div className="border-t border-slate-700 mt-2 pt-4 flex items-center justify-between">
            <button 
              onClick={handleReset}
              className="text-rose-500 hover:underline text-[12px] font-bold uppercase tracking-wider"
            >
              Reset Setup
            </button>
            <span className="text-[10px] text-slate-500">v1.0.0</span>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
