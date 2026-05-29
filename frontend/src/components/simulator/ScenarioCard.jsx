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
      className="cursor-pointer rounded-xl p-4 transition-all duration-200 flex items-center justify-between mb-3"
      style={{
        backgroundColor: isSelected ? 'rgba(0,229,184,0.08)' : '#1A2235',
        border: isSelected ? '1px solid rgba(0,229,184,0.4)' : '1px solid rgba(255,255,255,0.06)',
        borderLeft: isSelected ? '3px solid #00E5B8' : '1px solid rgba(255,255,255,0.06)'
      }}
    >
      <div className="flex items-center gap-4">
        <div className="text-2xl">{icon}</div>
        <div className="flex flex-col">
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#EEF2FF' }}>{scenario.name}</span>
          <span style={{ fontSize: '12px', color: '#566580', marginTop: '2px' }}>{scenario.description}</span>
        </div>
      </div>
      <div style={{ color: '#566580' }}>→</div>
    </div>
  );
};

export default ScenarioCard;
