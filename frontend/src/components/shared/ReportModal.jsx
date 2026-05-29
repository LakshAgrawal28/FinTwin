import React, { useState } from 'react';
import { postReportGenerate } from '../../utils/api';

export default function ReportModal({ profile, portfolio, simulationResult, healthScore }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const data = await postReportGenerate(profile, portfolio, simulationResult, healthScore);
      setReport(data);
    } catch (err) {
      console.error('Report generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => window.print();

  return (
    <div>
      <button
        onClick={generateReport}
        disabled={loading}
        style={{
          background: 'transparent',
          border: '1px solid #566580',
          color: '#EEF2FF',
          fontWeight: 600,
          padding: '10px 20px',
          borderRadius: '12px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          transition: 'all 0.2s',
          width: '100%',
        }}
        onMouseOver={e => { if(!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
      >
        {loading ? '⏳ Generating...' : '📄 Generate Financial Report'}
      </button>

      {report && (
        <div
          id="printable-report"
          style={{
            marginTop: '16px',
            background: '#0F1520',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#00E5B8', marginBottom: '4px' }}>FinTwin Financial Report</h2>
            <p style={{ fontSize: '12px', color: '#566580' }}>{report.reportDate}</p>
            <h3 style={{ fontSize: '14px', color: '#EEF2FF', marginTop: '8px' }}>
              {report.profile?.name || 'User'}'s Financial Twin Analysis
            </h3>
          </div>

          {report.healthScore && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', color: '#00E5B8', fontWeight: 600, marginBottom: '8px' }}>
                Financial Health Score: {report.healthScore.totalScore}/100 (Grade: {report.healthScore.grade})
              </h4>
              {report.healthScore.breakdown?.map((b, i) => (
                <div key={i} style={{ fontSize: '12px', color: '#8A9BBF', marginBottom: '4px' }}>
                  {b.category}: {b.score}/{b.max} — {b.message}
                </div>
              ))}
            </div>
          )}

          {report.simulationResult && (
            <div style={{ marginBottom: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
              <h4 style={{ fontSize: '13px', color: '#00E5B8', fontWeight: 600, marginBottom: '8px' }}>Projection Summary</h4>
              <p style={{ fontSize: '12px', color: '#8A9BBF' }}>
                Median Outcome: ₹{Number(report.simulationResult.median || 0).toLocaleString('en-IN')}
              </p>
              <p style={{ fontSize: '12px', color: '#8A9BBF' }}>
                Success Rate: {report.simulationResult.successRate ? (report.simulationResult.successRate * 100).toFixed(1) : 'N/A'}%
              </p>
            </div>
          )}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
            <h4 style={{ fontSize: '13px', color: '#00E5B8', fontWeight: 600, marginBottom: '8px' }}>AI Analysis</h4>
            <p style={{ fontSize: '12px', color: '#8A9BBF', lineHeight: 1.6 }}>{report.narrative}</p>
          </div>

          <button
            onClick={printReport}
            style={{
              marginTop: '16px',
              width: '100%',
              background: '#00E5B8',
              color: '#080C14',
              fontWeight: 700,
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            🖨️ Print / Save as PDF
          </button>
        </div>
      )}
    </div>
  );
}
