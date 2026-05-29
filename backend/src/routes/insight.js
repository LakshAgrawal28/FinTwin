import { Router } from 'express';
import { callGroqStream } from '../services/claudeService.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { simulationResult, userProfile, twinState } = req.body;

    // Proper SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const systemPrompt = `You are a blunt, caring financial advisor analyzing a Monte Carlo simulation result for a user. Write in plain English. No jargon. Structure your response in exactly 4 paragraphs separated by blank lines:
1. The single biggest risk this simulation reveals (1-2 sentences, start with a warning emoji if bad)
2. What their financial personality means for this specific scenario (reference their archetype)
3. Three specific numbered actions they should take RIGHT NOW
4. One sentence of honest encouragement
Keep total response under 200 words.`;

    const userMessage = `User archetype: ${twinState?.archetype || 'Unknown'}
Monthly income: ₹${userProfile?.income || 0}
Monthly expenses: ₹${Number(userProfile?.expenses || 0) + Number(userProfile?.variableSpend || 0) + Number(userProfile?.emi || 0)}
Portfolio value: ₹${userProfile?.portfolioValue || 0}
Scenario run: ${simulationResult?.scenarioName || simulationResult?.scenarioKey || 'Custom'}
Median outcome at year 10: ₹${simulationResult?.yearlyPercentiles?.[10]?.p50 || 0}
Worst case at year 10: ₹${simulationResult?.yearlyPercentiles?.[10]?.p10 || 0}
Best case at year 10: ₹${simulationResult?.yearlyPercentiles?.[10]?.p90 || 0}
Danger zone months: ${simulationResult?.dangerZoneMonths || 0}`;

    // Use a custom writer that wraps each chunk in SSE format
    const sseWriter = {
      write(text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    };

    await callGroqStream(systemPrompt, userMessage, sseWriter);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Insight streaming error:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
});

export default router;

