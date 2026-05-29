import React, { useEffect, useState, useMemo } from 'react';
import { useTwinStore } from '../../store';
import { postHealthScore } from '../../utils/api';

const gradeColors = { A: '#22c55e', B: '#84cc16', C: '#f59e0b', D: '#ef4444' };

export default function HealthScore() {
  const rawUserProfile = useTwinStore(state => state.userProfile);
  const rawPortfolio = useTwinStore(state => state.portfolio);
  const userProfile = useMemo(() => rawUserProfile || {}, [rawUserProfile]);
  const portfolio = useMemo(() => rawPortfolio || [], [rawPortfolio]);
  const healthScore = useTwinStore(state => state.healthScore);
  const setHealthScore = useTwinStore(state => state.setHealthScore);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const income = userProfile?.monthlyIncome || userProfile?.income;
    if (!income || healthScore) return;

    setTimeout(() => setLoading(true), 0);
    postHealthScore(userProfile, portfolio)
      .then(data => {
        setHealthScore(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [userProfile, portfolio, healthScore, setHealthScore]);

  if (loading) {
    return (
      <div style={{
        background: '#0F1520',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px',
        padding: '24px',
        textAlign: 'center',
        color: '#566580',
        fontSize: '13px',
      }}>
        <div style={{ width: '24px', height: '24px', border: '3px solid #00E5B8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        Calculating your score...
      </div>
    );
  }

  if (!healthScore) return null;

  const data = healthScore;
  const gradeColor = gradeColors[data.grade] || '#566580';

  return (
    <div style={{
      background: '#0F1520',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    }}>
      {/* Score Circle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          border: `4px solid ${gradeColor}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${gradeColor}10`,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#EEF2FF' }}>{data.totalScore}</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: gradeColor }}>{data.grade}</span>
        </div>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#EEF2FF', marginBottom: '4px' }}>Financial Health</h3>
          <p style={{ fontSize: '11px', color: '#566580' }}>Score out of 100 across 5 key areas</p>
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        {data.breakdown?.map((item, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: '#8A9BBF', fontWeight: 500 }}>{item.category}</span>
              <span style={{ color: '#EEF2FF', fontWeight: 600 }}>{item.score}/{item.max}</span>
            </div>
            <div style={{ height: '4px', background: '#1A2235', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(item.score / item.max) * 100}%`,
                background: item.score / item.max >= 0.7 ? '#22c55e' : item.score / item.max >= 0.4 ? '#f59e0b' : '#ef4444',
                borderRadius: '4px',
                transition: 'width 0.6s ease',
              }} />
            </div>
            <small style={{ fontSize: '10px', color: '#566580', marginTop: '2px', display: 'block' }}>{item.message}</small>
          </div>
        ))}
      </div>

      {/* AI Advice */}
      {data.aiAdvice && (
        <div style={{
          background: '#141B28',
          borderRadius: '12px',
          padding: '14px',
          border: '1px solid rgba(0,229,184,0.1)',
        }}>
          <span style={{ fontSize: '11px', color: '#00E5B8', fontWeight: 700, display: 'block', marginBottom: '6px' }}>🤖 AI Advice</span>
          <p style={{ fontSize: '12px', color: '#8A9BBF', lineHeight: 1.5, margin: 0 }}>{data.aiAdvice}</p>
        </div>
      )}
    </div>
  );
}
