export function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const index = (sortedArr.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sortedArr[lower] * (1 - weight) + sortedArr[upper] * weight;
}

function safeBoxMuller() {
  let u1;
  do { u1 = Math.random(); } while (u1 <= 0);
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function runMonteCarlo(userProfile, scenarioDelta = {}, years = 15, iterations = 10000) {
  const {
    income = 0,
    expenses = 0,
    variableSpend = 0,
    emi = 0,
    portfolioValue = 0
  } = userProfile;

  const {
    incomeMultiplier = 1,
    expenseMultiplier = 1,
    portfolioVolatilityMultiplier = 1,
    rampMonths,
    rampTargetIncome
  } = scenarioDelta;

  const months = years * 12;
  const monthlyMean = 0.12 / 12;
  const monthlyStd = (0.18 / Math.sqrt(12)) * portfolioVolatilityMultiplier;

  // Pre-calculate monthly base scenarios to avoid re-calculation inside iteration
  const monthlyIncomes = new Float64Array(months);
  const monthlyExpenses = new Float64Array(months);

  const baseExpenses = (expenses + variableSpend) * expenseMultiplier;
  
  for (let m = 0; m < months; m++) {
    monthlyExpenses[m] = baseExpenses;
    
    let currentIncome = income * incomeMultiplier;
    
    if (rampMonths !== undefined && rampMonths !== null) {
      if (m < rampMonths) {
        currentIncome = 0;
      } else if (m >= rampMonths && m < rampMonths + 6) {
        const rampProgress = (m - rampMonths + 1) / 6;
        currentIncome = (rampTargetIncome || 0) * rampProgress;
      } else {
        currentIncome = (rampTargetIncome !== undefined && rampTargetIncome !== null ? rampTargetIncome : currentIncome);
      }
    }
    monthlyIncomes[m] = currentIncome;
  }

  const resultsByYear = Array.from({ length: years }, () => new Float64Array(iterations));

  for (let i = 0; i < iterations; i++) {
    let wealth = portfolioValue;
    
    for (let m = 0; m < months; m++) {
      const monthSurplus = monthlyIncomes[m] - monthlyExpenses[m] - emi;
      
      const z = safeBoxMuller();
      const monthlyReturn = monthlyMean + monthlyStd * z;
      
      // Compound existing wealth and THEN add the monthly surplus/deficit
      wealth = (wealth * (1 + monthlyReturn)) + (monthlyIncomes[m] - monthlyExpenses[m] - emi);
      
      if (!isFinite(wealth) || isNaN(wealth)) wealth = 0;
      if (wealth <= 0) wealth = 0;
      
      if ((m + 1) % 12 === 0) {
        const yearIndex = ((m + 1) / 12) - 1;
        resultsByYear[yearIndex][i] = wealth;
      }
    }
  }

  const p10 = new Array(years);
  const p50 = new Array(years);
  const p90 = new Array(years);
  const yearLabels = new Array(years);

  for (let y = 0; y < years; y++) {
    yearLabels[y] = y + 1;
    const yearData = resultsByYear[y];
    yearData.sort(); // TypedArrays sort numerically natively
    p10[y] = percentile(yearData, 0.10);
    p50[y] = percentile(yearData, 0.50);
    p90[y] = percentile(yearData, 0.90);
  }

  return {
    years: yearLabels,
    p10,
    p50,
    p90,
    metadata: {
      iterations,
      scenario: scenarioDelta,
      computedAt: new Date().toISOString()
    }
  };
}
