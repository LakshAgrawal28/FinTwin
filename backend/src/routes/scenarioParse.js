import { Router } from 'express';
import { callClaude } from '../services/claudeService.js';

const router = Router();

router.post('/', async (req, res) => {
  const { userInput, portfolio, profile, simMode = 'balanced' } = req.body;

  if (!userInput || !userInput.trim()) {
    return res.status(400).json({ success: false, error: 'userInput is required' });
  }

  const modeInstructions = {
    optimistic: "MODE: OPTIMISTIC. Assume a booming economy. Set annualReturnRate to 0.12-0.18, inflationRate to 0.04, and volatility to 0.10. Be generous.",
    balanced: "MODE: BALANCED. Be realistic. Set annualReturnRate to 0.10, inflationRate to 0.06, and volatility to 0.15.",
    'stress-test': "MODE: STRESS-TEST. Be cynical and aggressive. Assume market crashes. Set annualReturnRate to 0.05-0.08, inflationRate to 0.09, and volatility to 0.25. If the user mentions major expenses, assume they will be 20% more expensive than requested."
  };

  const systemPrompt = `You are a financial scenario parser for Indian users.
Given a user's free-form description of their financial future, extract structured scenario parameters.

${modeInstructions[simMode] || modeInstructions.balanced}

CRITICAL INSTRUCTIONS:
- Do NOT compensate for the user's bad decisions by adding imaginary income or lowering expenses.
- If the prompt is negative (e.g., "lost my job", "medical emergency"), set 'additionalMonthlyInvestment' to a large negative number (to negate their current SIPs) and add massive 'majorExpenses'. Increase 'volatility'.
- If the prompt is positive (e.g., "got a promotion", "startup exit", "bull market"), set 'additionalMonthlyInvestment' to a huge positive number, increase 'annualReturnRate' significantly (e.g. 0.15 or 0.18), and lower 'volatility'.
- 'additionalMonthlyInvestment' is an absolute INR amount added to or subtracted from their baseline SIP. It CAN be negative!

Return ONLY valid JSON with this shape:
{
  "scenarioName": "string (Creative, short title)",
  "annualReturnRate": number (decimal, baseline is 0.10. Adjust based on MODE),
  "inflationRate": number (e.g. 0.06. Adjust based on MODE),
  "volatility": number (baseline 0.15. Adjust based on MODE),
  "additionalMonthlyInvestment": number (INR, CAN BE NEGATIVE if they lose income),
  "withdrawalStartYear": number or null,
  "withdrawalAmount": number or null,
  "years": number (simulation horizon, default 20),
  "majorExpenses": [{ "year": number, "amount": number, "label": "string" }],
  "salaryGrowthRate": number,
  "scenarioSummary": "One sentence plain English summary of what you changed and why based on the mode."
}
No explanation. Only JSON.`;

  const userMessage = `User profile: ${JSON.stringify(profile || {})}
Portfolio: ${JSON.stringify(portfolio || {})}
User's scenario description: "${userInput}"

Parse this into simulation parameters.`;

  try {
    const result = await callClaude(systemPrompt, userMessage, false);

    // callClaude returns parsed JSON object or string
    let parsed;
    if (typeof result === 'object') {
      parsed = result;
    } else {
      const cleaned = result.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    res.json({ success: true, scenario: parsed });
  } catch (err) {
    console.error('Scenario parse error:', err.message);
    const status = err.response?.status || 500;
    let errorMessage = err.message;
    
    if (status === 429) {
      errorMessage = "AI rate limit reached. Please wait a few seconds and try again.";
    } else if (err.response?.data?.error?.message) {
      errorMessage = err.response.data.error.message;
    }
    
    res.status(status).json({ success: false, error: errorMessage });
  }
});

export default router;
