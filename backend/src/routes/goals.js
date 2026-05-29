import { Router } from 'express';

const router = Router();

function calculateRequiredSIP(pv, fv, n, r) {
  if (n <= 0 || r <= 0) return fv - pv;
  const factor = Math.pow(1 + r, n);
  return Math.max(0, ((fv - pv * factor) * r) / (factor - 1));
}

router.post('/project', (req, res) => {
  try {
    const { goals, profile, portfolio } = req.body;

    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      return res.status(400).json({ error: 'goals array is required' });
    }

    const holdings = Array.isArray(portfolio) ? portfolio : (portfolio?.holdings || []);
    const totalPortfolio = holdings.reduce((s, a) => s + (a.currentValue || a.value || 0), 0);
    const monthlyInvestment = Number(profile?.monthlyInvestment) || 0;
    const annualReturn = 0.12;
    const monthlyReturn = annualReturn / 12;

    const projectedGoals = goals.map(goal => {
      const remaining = goal.targetAmount - totalPortfolio;
      if (remaining <= 0) {
        return { ...goal, status: 'achieved', yearsNeeded: 0, onTrack: true };
      }

      // Numerically find months to reach goal
      let months = 0;
      let value = totalPortfolio;
      while (value < goal.targetAmount && months < 600) {
        value = value * (1 + monthlyReturn) + monthlyInvestment;
        months++;
      }

      const yearsNeeded = months / 12;
      const targetYear = new Date().getFullYear() + Math.ceil(yearsNeeded);
      const onTrack = goal.targetYear ? goal.targetYear >= targetYear : true;

      return {
        ...goal,
        yearsNeeded: parseFloat(yearsNeeded.toFixed(1)),
        projectedYear: targetYear,
        onTrack,
        shortfallMonths: onTrack ? 0 : Math.round((targetYear - (goal.targetYear || targetYear)) * 12),
        requiredMonthlyToMeetDeadline: goal.targetYear
          ? Math.round(calculateRequiredSIP(
              totalPortfolio,
              goal.targetAmount,
              (goal.targetYear - new Date().getFullYear()) * 12,
              monthlyReturn
            ))
          : null,
        status: months >= 600 ? 'unreachable' : 'projected',
      };
    });

    res.json({ goals: projectedGoals });
  } catch (err) {
    console.error('Goals projection error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
