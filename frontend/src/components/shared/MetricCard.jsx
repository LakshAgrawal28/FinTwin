import React from 'react';

const MetricCard = ({ label, value, subtext, subtextColor = 'muted' }) => {
  const textColorMap = {
    green: '#22D3A5',
    red: '#FF4D4D',
    amber: '#F5A623',
    muted: '#566580'
  };

  return (
    <div 
      className="rounded-2xl p-6 transition-colors duration-300"
      style={{
        backgroundColor: '#0F1520',
        border: '1px solid rgba(255,255,255,0.06)'
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(0,229,184,0.25)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
    >
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#566580', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontSize: '32px', fontWeight: 700, color: '#EEF2FF', marginBottom: subtext ? '4px' : '0' }}>
        {value}
      </div>
      {subtext && (
        <div style={{ fontSize: '13px', color: textColorMap[subtextColor] || textColorMap.muted }}>
          {subtext}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
