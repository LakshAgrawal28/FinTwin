import { Router } from 'express';
import { runMonteCarlo } from '../engine/monteCarlo.js';
import { getScenarioDelta } from '../engine/scenarioDeltas.js';

const router = Router();

// ── Standalone Box-Muller for new Monte Carlo ──────────────────────────────
function boxMullerRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// ── New Monte Carlo supporting full scenario objects ───────────────────────
function runNewMonteCarlo(params) {
  const {
    initialPortfolio,
    monthlyContribution,
    annualReturnRate,
    inflationRate,
    volatility,
    years,
    simulations = 1000,
    majorExpenses = [],
    withdrawalStartYear = null,
    withdrawalAmount = 0,
  } = params;

  const months = years * 12;
  const monthlyReturn = annualReturnRate / 12;
  const monthlyVolatility = volatility / Math.sqrt(12);

  const results = [];

  for (let sim = 0; sim < simulations; sim++) {
    let portfolio = initialPortfolio;
    const trajectory = [portfolio];

    for (let m = 1; m <= months; m++) {
      const shock = boxMullerRandom();
      const monthReturn = monthlyReturn + monthlyVolatility * shock;
      portfolio *= (1 + monthReturn);

      // Add monthly contribution (with 5% annual step-up, applied yearly)
      const currentYear = Math.floor((m - 1) / 12);
      const stepUpMultiplier = Math.pow(1.05, currentYear);
      portfolio += monthlyContribution * stepUpMultiplier;

      // Major expense at this year
      const yearNum = Math.floor(m / 12);
      majorExpenses.forEach(exp => {
        if (exp.year === yearNum && m % 12 === 0) {
          portfolio = Math.max(0, portfolio - exp.amount);
        }
      });

      // Withdrawals
      if (withdrawalStartYear && yearNum >= withdrawalStartYear && m % 12 === 0) {
        portfolio = Math.max(0, portfolio - withdrawalAmount);
      }

      if (m % 12 === 0) trajectory.push(portfolio);
    }
    results.push(trajectory);
  }

  // Compute percentiles at each year
  const yearlyPercentiles = [];
  for (let y = 0; y <= years; y++) {
    const vals = results.map(r => r[y]).sort((a, b) => a - b);
    yearlyPercentiles.push({
      year: y,
      p10: vals[Math.floor(simulations * 0.1)],
      p25: vals[Math.floor(simulations * 0.25)],
      p50: vals[Math.floor(simulations * 0.5)],
      p75: vals[Math.floor(simulations * 0.75)],
      p90: vals[Math.floor(simulations * 0.9)],
    });
  }

  const finalVals = results.map(r => r[years]).sort((a, b) => a - b);
  const successRate = finalVals.filter(v => v > 0).length / simulations;

  return {
    yearlyPercentiles,
    successRate,
    median: finalVals[Math.floor(simulations * 0.5)],
    worstCase: finalVals[Math.floor(simulations * 0.1)],
    bestCase: finalVals[Math.floor(simulations * 0.9)],
    simulations,
  };
}

router.post('/', async (req, res, next) => {
  try {
    // Accept both 'scenario' and 'scenarioKey' — prefer 'scenario' (B1 fix)
    const { userProfile, scenario, scenarioKey, years = 15, iterations = 5000, portfolio, profile, simMode = 'balanced' } = req.body;
    const resolvedScenario = scenario || scenarioKey;

    // ── NEW PATH: Full scenario object from AI parser ─────────────────────
    if (resolvedScenario && typeof resolvedScenario === 'object') {
      const initialPortfolio = portfolio?.totalValue ??
        (portfolio?.assets ? Object.values(portfolio.assets).reduce((s, a) => s + (a.value || 0), 0) : null) ??
        Number(userProfile?.portfolioValue) ?? 100000;

      const baseSIP = profile?.monthlyInvestment ?? userProfile?.monthlyInvestment ?? (Number(userProfile?.monthlyIncome) * 0.2);
      const sipAsNumber = (typeof baseSIP === 'number' && !isNaN(baseSIP)) ? baseSIP : 0;
      
      const params = {
        initialPortfolio,
        monthlyContribution: sipAsNumber + (resolvedScenario.additionalMonthlyInvestment ?? 0),
        annualReturnRate: resolvedScenario.annualReturnRate ?? 0.10,
        inflationRate: resolvedScenario.inflationRate ?? 0.06,
        volatility: resolvedScenario.volatility ?? 0.15,
        years: resolvedScenario.years ?? years ?? 20,
        simulations: 1000,
        majorExpenses: resolvedScenario.majorExpenses ?? [],
        withdrawalStartYear: resolvedScenario.withdrawalStartYear ?? null,
        withdrawalAmount: resolvedScenario.withdrawalAmount ?? 0,
      };

      const result = runNewMonteCarlo(params);
      return res.json({ success: true, ...result, scenarioName: resolvedScenario.scenarioName || 'Custom' });
    }

    // ── PRESET / STRING PATH: Map keys to runNewMonteCarlo ────────────
    const initialPortfolio = portfolio?.totalValue ??
      (portfolio?.holdings ? portfolio.holdings.reduce((s, a) => s + (a.currentValue ?? a.costBasis ?? 0), 0) : null) ??
      (portfolio?.assets ? Object.values(portfolio.assets).reduce((s, a) => s + (a.value ?? 0), 0) : null) ??
      Number(userProfile?.portfolioValue) ?? 100000;

    let monthlyContribution = profile?.monthlyInvestment ?? userProfile?.monthlyInvestment ?? (Number(userProfile?.monthlyIncome) * 0.2);
    // If somehow evaluating to NaN or undefined, coerce to 0 safely
    if (typeof monthlyContribution !== 'number' || isNaN(monthlyContribution)) {
        monthlyContribution = 0;
    }
    
    let baseReturn = 0.10;
    let baseVol = 0.15;
    let baseInflation = 0.06;

    if (simMode === 'optimistic') {
      baseReturn = 0.14;
      baseVol = 0.10;
      baseInflation = 0.04;
    } else if (simMode === 'stress-test') {
      baseReturn = 0.06;
      baseVol = 0.25;
      baseInflation = 0.09;
    }
    
    // Preset adjustments
    let scenarioName = 'Custom';
    let expenseArr = [];
    let volHit = baseVol;

    if (resolvedScenario === 'pauseSIP') {
      scenarioName = 'Pause SIP (2 Years)';
      // Hack: deduct the SIP sum as a major expense for Y1 and Y2 since we cant turn off SIP easily
      expenseArr.push({ year: 1, amount: monthlyContribution * 12 });
      expenseArr.push({ year: 2, amount: monthlyContribution * 12 });
    } else if (resolvedScenario === 'doubleSIP') {
      scenarioName = 'Double my SIP';
      monthlyContribution *= 2;
    } else if (resolvedScenario === 'quitJob') {
      scenarioName = 'Quit my job';
      // 100% income loss for 6 months -> withdrawal required to live
      const monthlyBurn = Number(userProfile?.expenses || 50000);
      expenseArr.push({ year: 0, amount: (monthlyBurn + monthlyContribution) * 6 }); 
    }

    const params = {
      initialPortfolio,
      monthlyContribution,
      annualReturnRate: baseReturn,
      inflationRate: baseInflation,
      volatility: volHit,
      years: years || 20,
      simulations: Math.min(iterations || 1000, 1000), // Cap at 1000
      majorExpenses: expenseArr,
      withdrawalStartYear: null,
      withdrawalAmount: 0,
    };

    const newResult = runNewMonteCarlo(params);

    let dangerZoneMonths = 0;
    // Map P10 back for danger zone equivalent
    for (const p of newResult.yearlyPercentiles) {
      if (p.p10 < 500000) dangerZoneMonths += 12; // approximate metric
    }

    res.json({
      ...newResult, // yearlyPercentiles, median, worstCase, bestCase
      scenarioKey: resolvedScenario,
      scenarioName: scenarioName,
      dangerZoneMonths
    });
  } catch (error) {
    next(error);
  }
});

export default router;
