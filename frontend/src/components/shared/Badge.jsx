import React from 'react';

const Badge = ({ type, label }) => {
  const typeStyles = {
    equity: { bg: 'rgba(139,127,255,0.15)', text: '#8B7FFF' },
    debt: { bg: 'rgba(0,229,184,0.12)', text: '#00E5B8' },
    gold: { bg: 'rgba(245,166,35,0.15)', text: '#F5A623' },
    crypto: { bg: 'rgba(255,77,77,0.12)', text: '#FF4D4D' },
    buy: { bg: 'rgba(34,211,165,0.15)', text: '#22D3A5' },
    sell: { bg: 'rgba(255,77,77,0.12)', text: '#FF4D4D' },
    optimal: { bg: 'rgba(34,211,165,0.12)', text: '#22D3A5' },
    concentrated: { bg: 'rgba(245,166,35,0.15)', text: '#F5A623' },
    overexposed: { bg: 'rgba(255,77,77,0.12)', text: '#FF4D4D' },
    locked: { bg: 'rgba(245,166,35,0.12)', text: '#F5A623' },
    excellent: { bg: 'rgba(34,211,165,0.12)', text: '#22D3A5' },
    stable: { bg: 'rgba(0,229,184,0.1)', text: '#00E5B8' }
  };

  const style = typeStyles[type?.toLowerCase()] || typeStyles.equity;

  return (
    <span
      style={{
        backgroundColor: style.bg,
        color: style.text,
        fontSize: '10px',
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: '6px',
        textTransform: 'uppercase',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap'
      }}
    >
      {label || type}
    </span>
  );
};

export default Badge;
