import React from 'react';

const ScenarioCard = ({ scenario, isSelected, onSelect }) => {
  const ICONS = {
    quitJob: '💼',
    moveToBangalore: '📍',
    investInCrypto: '₿'
  };

  const icon = ICONS[scenario.key] || '📊';

  return (
    <div
      onClick={() => onSelect(scenario.key)}
      className={`cursor-pointer rounded p-4 transition-all duration-200 flex items-center justify-between mb-3 border ${
        isSelected
          ? 'bg-blue-900/20 border-blue-500/50 border-l-4 border-l-blue-500'
          : 'bg-slate-800 border-slate-700'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="text-2xl">{icon}</div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-100">{scenario.name}</span>
          <span className="text-xs text-slate-500 mt-0.5">{scenario.description}</span>
        </div>
      </div>
      <div className="text-slate-500">→</div>
    </div>
  );
};

export default ScenarioCard;
