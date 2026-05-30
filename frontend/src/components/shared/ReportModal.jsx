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
        className={`w-full font-semibold py-2.5 px-4 rounded border transition-colors ${loading ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
      >
        {loading ? '⏳ Generating...' : '📄 Generate Financial Report'}
      </button>

      {report && (
        <div
          id="printable-report"
          className="mt-4 bg-slate-800 border border-slate-700 rounded p-6 shadow-sm"
        >
          <div className="text-center mb-5 pb-4 border-b border-slate-700">
            <h2 className="text-lg font-bold text-blue-500 mb-1">FinTwin Financial Report</h2>
            <p className="text-xs text-slate-500">{report.reportDate}</p>
            <h3 className="text-sm text-slate-100 mt-2">
              {report.profile?.name || 'User'}'s Financial Twin Analysis
            </h3>
          </div>

          {report.healthScore && (
            <div className="mb-4">
              <h4 className="text-sm text-blue-500 font-semibold mb-2">
                Financial Health Score: {report.healthScore.totalScore}/100 (Grade: {report.healthScore.grade})
              </h4>
              {report.healthScore.breakdown?.map((b, i) => (
                <div key={i} className="text-xs text-slate-400 mb-1">
                  {b.category}: {b.score}/{b.max} — {b.message}
                </div>
              ))}
            </div>
          )}

          {report.simulationResult && (
            <div className="mb-4 border-t border-slate-700 pt-3">
              <h4 className="text-sm text-blue-500 font-semibold mb-2">Projection Summary</h4>
              <p className="text-xs text-slate-400">
                Median Outcome: {formatINR(Number(report.simulationResult.median || 0))}
              </p>
              <p className="text-xs text-slate-400">
                Success Rate: {report.simulationResult.successRate ? (report.simulationResult.successRate * 100).toFixed(1) : 'N/A'}%
              </p>
            </div>
          )}

          <div className="border-t border-slate-700 pt-3">
            <h4 className="text-sm text-blue-500 font-semibold mb-2">AI Analysis</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{report.narrative}</p>
          </div>

          <button
            onClick={printReport}
            className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded transition-colors"
          >
            🖨️ Print / Save as PDF
          </button>
        </div>
      )}
    </div>
  );
}
