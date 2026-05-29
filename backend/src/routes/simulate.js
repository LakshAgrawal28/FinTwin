import { Router } from 'express';

const router = Router();

// ── Standalone Box-Muller for Monte Carlo ──────────────────────────────
function boxMullerRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// ── Portfolio-Weighted Returns and Volatilities ────────────────────────
function getPortfolioMetrics(portfolioData, baseReturn, baseVol) {
  // Support both holdings array or structure { holdings: [...] }
  const holdings = portfolioData?.holdings || (Array.isArray(portfolioData) ? portfolioData : []);
  
  if (holdings.length === 0) {
    return { expectedReturn: baseReturn, expectedVolatility: baseVol };
  }

  // standard asset class estimates
  const assetSpecs = {
    Equity: { returnRate: 0.13, volatility: 0.16 },
    Debt: { returnRate: 0.07, volatility: 0.03 },
    Gold: { returnRate: 0.09, volatility: 0.11 },
    Crypto: { returnRate: 0.20, volatility: 0.65 }
  };

  let totalValue = 0;
  const classValues = { Equity: 0, Debt: 0, Gold: 0, Crypto: 0 };

  holdings.forEach(item => {
    const val = item.currentValue || (item.units * (item.costBasis || 0)) || 0;
    const type = item.type || 'Equity';
    if (classValues[type] !== undefined) {
      classValues[type] += val;
      totalValue += val;
    }
  });

  if (totalValue === 0) {
    return { expectedReturn: baseReturn, expectedVolatility: baseVol };
  }

  let weightedReturn = 0;
  let weightedVol = 0;

  Object.keys(classValues).forEach(type => {
    const weight = classValues[type] / totalValue;
    const spec = assetSpecs[type];
    weightedReturn += weight * spec.returnRate;
    weightedVol += weight * spec.volatility;
  });

  return { expectedReturn: weightedReturn, expectedVolatility: weightedVol };
}

// ── Overhauled Monte Carlo Engine ──────────────────────────────────────
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
    activeLoans = [],
    retirementStartMonth = null,
    monthlyWithdrawal = 0,
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
      
      // Compound portfolio
      portfolio *= (1 + monthReturn);

      // Contributions (only if not retired)
      if (retirementStartMonth === null || m < retirementStartMonth) {
        const currentYear = Math.floor((m - 1) / 12);
        const stepUpMultiplier = Math.pow(1.05, currentYear); // 5% annual step-up
        portfolio += monthlyContribution * stepUpMultiplier;
      }

      // Deduct EMIs
      activeLoans.forEach(loan => {
        if (m >= loan.startMonth && m <= loan.endMonth) {
          portfolio -= loan.emi;
        }
      });

      // Deduct major expenses
      majorExpenses.forEach(exp => {
        // Precise month-based deduction
        if (exp.month === m) {
          portfolio -= exp.amount;
        }
        // Legacy fallback
        if (exp.year !== undefined && exp.month === undefined) {
          const yearNum = Math.floor(m / 12);
          if (exp.year === yearNum && m % 12 === 0) {
            portfolio -= exp.amount;
          }
        }
      });

      // Deduct monthly withdrawals (inflated at monthly step-ups)
      if (retirementStartMonth !== null && m >= retirementStartMonth) {
        const inflationMultiplier = Math.pow(1 + (inflationRate / 12), m - retirementStartMonth);
        portfolio -= monthlyWithdrawal * inflationMultiplier;
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
    const { userProfile, scenario, scenarioKey, years = 15, iterations = 1000, portfolio, profile, simMode = 'balanced' } = req.body;
    const resolvedScenario = scenario || scenarioKey;

    // Define simulation mode scales
    let returnMultiplier = 1.0;
    let volMultiplier = 1.0;
    let baseInflation = 0.06;

    if (simMode === 'optimistic') {
      returnMultiplier = 1.2;
      volMultiplier = 0.8;
      baseInflation = 0.04;
    } else if (simMode === 'stress-test') {
      returnMultiplier = 0.6;
      volMultiplier = 1.5;
      baseInflation = 0.09;
    }

    // Get portfolio-weighted return and volatility
    const { expectedReturn, expectedVolatility } = getPortfolioMetrics(
      portfolio || [],
      0.10, // baseline return (10%)
      0.15  // baseline volatility (15%)
    );

    const finalReturn = expectedReturn * returnMultiplier;
    const finalVolatility = expectedVolatility * volMultiplier;

    const initialPortfolio = portfolio?.totalValue ??
      (portfolio?.holdings ? portfolio.holdings.reduce((s, a) => s + (a.currentValue ?? a.costBasis ?? 0), 0) : null) ??
      (portfolio?.assets ? Object.values(portfolio.assets).reduce((s, a) => s + (a.value ?? 0), 0) : null) ??
      Number(userProfile?.portfolioValue) ?? 100000;

    let monthlyContribution = profile?.monthlyInvestment ?? userProfile?.monthlyInvestment ?? (Number(userProfile?.monthlyIncome) * 0.2);
    if (typeof monthlyContribution !== 'number' || isNaN(monthlyContribution)) {
      monthlyContribution = 0;
    }

    // ── GOALS / STRUCTURED SCENARIOS PATH ─────────────────────────────────
    if (resolvedScenario && typeof resolvedScenario === 'object') {
      let scenarioName = resolvedScenario.scenarioName || 'Goal Simulation';
      let expenseArr = [];
      let loanArr = [];
      let retirementStartMonth = null;
      let monthlyWithdrawal = 0;
      let targetHorizon = years || 15;

      const type = resolvedScenario.type;

      if (type === 'house') {
        scenarioName = `House Purchase Goal`;
        const { purchasePrice, purchaseYear, downPaymentPct, interestRate, tenureYears } = resolvedScenario;
        
        const downPayment = purchasePrice * (downPaymentPct / 100);
        expenseArr.push({ month: purchaseYear * 12, amount: downPayment, label: 'House Downpayment' });

        const loanAmount = Math.max(0, purchasePrice - downPayment);
        if (loanAmount > 0) {
          const r = (interestRate || 8.5) / (12 * 100);
          const n = (tenureYears || 15) * 12;
          const emi = loanAmount * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
          loanArr.push({
            startMonth: purchaseYear * 12 + 1,
            endMonth: (purchaseYear + tenureYears) * 12,
            emi
          });
        }
        targetHorizon = Math.max(years || 15, purchaseYear + tenureYears);
      } 
      
      else if (type === 'retirement') {
        scenarioName = `Early Retirement (FIRE) Planner`;
        const { retirementAge, monthlyExpensesInRetirement } = resolvedScenario;
        const currentAge = Number(userProfile?.age) || 30;
        const yearsToRetire = Math.max(0, retirementAge - currentAge);

        retirementStartMonth = yearsToRetire * 12;
        monthlyWithdrawal = monthlyExpensesInRetirement;
        targetHorizon = Math.max(years || 15, yearsToRetire + 15);
      } 
      
      else if (type === 'education') {
        scenarioName = `Child Education Fund`;
        const { targetAmount, yearsRemaining } = resolvedScenario;
        expenseArr.push({ month: yearsRemaining * 12, amount: targetAmount, label: 'College Tuition' });
        targetHorizon = Math.max(years || 15, yearsRemaining + 2);
      }

      const params = {
        initialPortfolio,
        monthlyContribution,
        annualReturnRate: finalReturn,
        inflationRate: baseInflation,
        volatility: finalVolatility,
        years: targetHorizon,
        simulations: Math.min(iterations || 1000, 1000),
        majorExpenses: expenseArr,
        activeLoans: loanArr,
        retirementStartMonth,
        monthlyWithdrawal,
      };

      const result = runNewMonteCarlo(params);
      
      // Calculate EMIs for return metadata
      const totalEMI = loanArr.reduce((sum, l) => sum + l.emi, 0);

      return res.json({
        success: true,
        ...result,
        scenarioName,
        calculatedEMI: totalEMI,
        hasAffordabilityWarning: totalEMI > (userProfile?.monthlyIncome * 0.5) // warning if loan EMI exceeds 50% income
      });
    }

    // ── PRESET / STRING PATH (Double SIP, Pause SIP, Quit Job) ────────────
    let scenarioName = 'Custom';
    let expenseArr = [];
    let loanArr = [];

    if (resolvedScenario === 'pauseSIP') {
      scenarioName = 'Pause SIP (2 Years)';
      // Deduct SIP sums as major expenses for Y1 and Y2
      expenseArr.push({ year: 1, amount: monthlyContribution * 12 });
      expenseArr.push({ year: 2, amount: monthlyContribution * 12 });
    } else if (resolvedScenario === 'doubleSIP') {
      scenarioName = 'Double my SIP';
      monthlyContribution *= 2;
    } else if (resolvedScenario === 'quitJob') {
      scenarioName = 'Quit my job';
      const monthlyBurn = Number(userProfile?.expenses || 50000);
      expenseArr.push({ year: 1, amount: (monthlyBurn + monthlyContribution) * 6 }); // 6 months loss
    }

    const params = {
      initialPortfolio,
      monthlyContribution,
      annualReturnRate: finalReturn,
      inflationRate: baseInflation,
      volatility: finalVolatility,
      years: years || 20,
      simulations: Math.min(iterations || 1000, 1000),
      majorExpenses: expenseArr,
      activeLoans: loanArr,
    };

    const newResult = runNewMonteCarlo(params);

    let dangerZoneMonths = 0;
    for (const p of newResult.yearlyPercentiles) {
      if (p.p10 < 500000) dangerZoneMonths += 12;
    }

    res.json({
      success: true,
      ...newResult,
      scenarioKey: resolvedScenario,
      scenarioName,
      dangerZoneMonths
    });
  } catch (error) {
    next(error);
  }
});

export default router;
