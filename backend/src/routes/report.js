import { Router } from 'express';
import { callClaude } from '../services/claudeService.js';

const router = Router();

router.post('/generate', async (req, res) => {
  try {
    const { profile, portfolio, simulationResult, healthScore } = req.body;

    // Generate AI narrative for the report
    const prompt = `Write a professional 3-paragraph financial report narrative for:
Name: ${profile?.name || 'User'}, Age: ${profile?.age || 'N/A'}
Monthly income: ₹${Number(profile?.monthlyIncome || profile?.income || 0).toLocaleString('en-IN')}
Health Score: ${healthScore?.totalScore || 'N/A'}/100
Simulation median outcome at 20 years: ₹${Number(simulationResult?.median || 0).toLocaleString('en-IN')}
Success rate: ${simulationResult?.successRate ? (simulationResult.successRate * 100).toFixed(1) : 'N/A'}%
Keep it personalized, optimistic but realistic, Indian context. No markdown formatting.`;

    let narrative = '';
    try {
      const result = await callClaude(
        'You are a professional financial report writer for an Indian fintech app. Write clear, personalized narratives.',
        prompt,
        false
      );
      narrative = typeof result === 'string' ? result : JSON.stringify(result);
    } catch (aiErr) {
      console.error('AI narrative generation failed:', aiErr.message);
      narrative = 'Your financial profile shows a solid foundation for long-term wealth creation. Continue your current investment strategy while periodically reviewing your asset allocation.';
    }

    // Return structured report data (client renders as PDF using browser print)
    res.json({
      reportDate: new Date().toLocaleDateString('en-IN'),
      profile,
      healthScore,
      simulationResult,
      narrative,
    });
  } catch (err) {
    console.error('Report generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
