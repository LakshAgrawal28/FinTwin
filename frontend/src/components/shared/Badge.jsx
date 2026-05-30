import React from 'react';

const Badge = ({ type, label }) => {
  const typeClasses = {
    equity: 'bg-blue-900/30 text-blue-400',
    debt: 'bg-emerald-900/30 text-emerald-400',
    gold: 'bg-amber-900/30 text-amber-400',
    crypto: 'bg-rose-900/30 text-rose-400',
    buy: 'bg-emerald-900/30 text-emerald-400',
    sell: 'bg-rose-900/30 text-rose-400',
    optimal: 'bg-emerald-900/30 text-emerald-400',
    concentrated: 'bg-amber-900/30 text-amber-400',
    overexposed: 'bg-rose-900/30 text-rose-400',
    locked: 'bg-amber-900/30 text-amber-400',
    excellent: 'bg-emerald-900/30 text-emerald-400',
    stable: 'bg-emerald-900/30 text-emerald-400'
  };

  const cssClass = typeClasses[type?.toLowerCase()] || typeClasses.equity;

  return (
    <span
      className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase inline-flex items-center justify-center whitespace-nowrap ${cssClass}`}
    >
      {label || type}
    </span>
  );
};

export default Badge;
