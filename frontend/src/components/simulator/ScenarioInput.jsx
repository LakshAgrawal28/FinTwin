import React, { useState } from 'react';
import { postScenarioParse } from '../../utils/api';

const EXAMPLE_PROMPTS = [
  "I plan to buy a house worth ₹80L in 3 years and also start a business in 5 years",
  "I want to retire at 45 with ₹5 crore corpus, currently 28 years old",
  "I'm going to lose my job next year and take 6 months off, then switch careers",
  "I want to invest aggressively in equity for next 10 years then shift to FD",
];

export default function ScenarioInput({ onScenarioReady, portfolio, profile, simMode }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedScenario, setParsedScenario] = useState(null);
  const [error, setError] = useState(null);

  const handleParse = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await postScenarioParse(input, portfolio, profile, simMode);
      if (data.success) {
        setParsedScenario(data.scenario);
        onScenarioReady(data.scenario);
      } else {
        setError(data.error || 'Failed to parse scenario');
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to connect to AI service';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: '#0F1520',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '16px',
      padding: '20px',
    }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#EEF2FF', marginBottom: '4px' }}>
        Describe Your Financial Future
      </h3>
      <p style={{ fontSize: '12px', color: '#566580', marginBottom: '16px' }}>
        Tell us in plain English — AI will build your simulation
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        {EXAMPLE_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => setInput(p)}
            style={{
              background: 'rgba(0,229,184,0.08)',
              border: '1px solid rgba(0,229,184,0.2)',
              color: '#00E5B8',
              borderRadius: '20px',
              padding: '6px 12px',
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(0,229,184,0.15)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(0,229,184,0.08)'}
          >
            {p.substring(0, 50)}...
          </button>
        ))}
      </div>

      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="e.g. I want to buy a car for ₹12L in 2 years, get married in 3 years spending ₹15L, and retire at 55..."
        rows={4}
        style={{
          width: '100%',
          background: '#1A2235',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '13px',
          color: '#EEF2FF',
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
      />

      {error && (
        <p style={{ color: '#FF4D4D', fontSize: '12px', marginTop: '8px' }}>{error}</p>
      )}

      <button
        onClick={handleParse}
        disabled={loading || !input.trim()}
        style={{
          width: '100%',
          marginTop: '12px',
          background: loading || !input.trim() ? '#566580' : '#00E5B8',
          color: '#080C14',
          fontWeight: 700,
          padding: '12px',
          borderRadius: '12px',
          border: 'none',
          fontSize: '14px',
          cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {loading ? 'AI is thinking...' : '🔮 Simulate My Future'}
      </button>

      {parsedScenario && (
        <div style={{
          marginTop: '16px',
          background: '#141B28',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid rgba(0,229,184,0.15)',
        }}>
          <h4 style={{ fontSize: '13px', color: '#00E5B8', fontWeight: 600, marginBottom: '8px' }}>
            📋 AI understood your scenario:
          </h4>
          <p style={{ fontSize: '12px', color: '#8A9BBF', marginBottom: '12px' }}>
            {parsedScenario.scenarioSummary}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#EEF2FF', background: '#1A2235', padding: '4px 10px', borderRadius: '8px' }}>
              Return: {((parsedScenario.annualReturnRate || 0) * 100).toFixed(1)}%
            </span>
            <span style={{ fontSize: '11px', color: '#EEF2FF', background: '#1A2235', padding: '4px 10px', borderRadius: '8px' }}>
              Inflation: {((parsedScenario.inflationRate || 0) * 100).toFixed(1)}%
            </span>
            {parsedScenario.majorExpenses?.map((e, i) => (
              <span key={i} style={{ fontSize: '11px', color: '#F5A623', background: '#1A2235', padding: '4px 10px', borderRadius: '8px' }}>
                📌 {e.label}: ₹{Number(e.amount).toLocaleString('en-IN')} in Year {e.year}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
