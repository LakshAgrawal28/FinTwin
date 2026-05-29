import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTwinStore } from '../../store';

const Navbar = () => {
  const navigate = useNavigate();
  const userProfile = useTwinStore(state => state.userProfile);
  const resetAll = useTwinStore(state => state.resetAll);

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
      navigate('/');
    }
  };

  const navItemClass = ({ isActive }) => 
    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 border ${
      isActive 
        ? 'bg-[#00E5B8]/10 text-[#00E5B8] border-[#00E5B8]/30 shadow-[0_0_10px_rgba(0,229,184,0.1)]' 
        : 'text-[#8A9BBF] border-transparent hover:text-[#EEF2FF] hover:bg-white/5'
    }`;

  // SVG Icons
  const Icons = {
    Home: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    Simulator: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h4l2-9 5 18 3-13 4 8h4"/>
      </svg>
    ),
    Investments: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
    Rebalance: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 16 4 4 4-4" />
        <path d="M7 20V4" />
        <path d="m21 8-4-4-4 4" />
        <path d="M17 4v16" />
      </svg>
    ),
    Projections: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" x2="18" y1="20" y2="10" />
        <line x1="12" x2="12" y1="20" y2="4" />
        <line x1="6" x2="6" y1="20" y2="14" />
      </svg>
    )
  };

  return (
    <nav className="h-16 bg-[#080C14] border-b border-white/5 flex items-center px-6 justify-between sticky top-0 z-50 shadow-xl">
      
      {/* Left: Logo & Tagline */}
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-[#00E5B8] text-[#080C14] rounded-lg flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(0,229,184,0.3)]">
          FT
        </div>
        <div className="flex flex-col">
          <span className="text-[16px] font-bold text-[#EEF2FF] leading-none mb-1">
            FinTwin
          </span>
          <span className="text-[10px] text-[#566580] uppercase tracking-wider font-semibold leading-none">
            Your Financial Twin
          </span>
        </div>
      </div>

      {/* Center: Links */}
      <div className="flex gap-2 items-center bg-[#0F1520] border border-white/5 p-1 rounded-xl">
        <NavLink to="/twin" className={navItemClass}>
          {Icons.Home} Twin Home
        </NavLink>
        <NavLink to="/investments" className={navItemClass}>
          {Icons.Investments} Investments
        </NavLink>
        <NavLink to="/rebalance" className={navItemClass}>
          {Icons.Rebalance} Rebalance
        </NavLink>
        <NavLink to="/projections" className={navItemClass}>
          {Icons.Projections} Projections
        </NavLink>
        <NavLink to="/simulator" className={navItemClass}>
          {Icons.Simulator} Simulator
        </NavLink>
      </div>

      {/* Right: User Actions */}
      <div className="flex items-center gap-4">
        <button 
          onClick={handleReset}
          className="text-[#566580] hover:text-[#FF4D4D] text-[11px] font-semibold transition-colors uppercase tracking-wider"
        >
          Reset Setup
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00E5B8] to-[#00B28F] flex items-center justify-center text-[#080C14] text-[11px] font-bold shadow-[0_0_10px_rgba(0,229,184,0.2)]">
          {initials}
        </div>
      </div>
      
    </nav>
  );
};

export default Navbar;
