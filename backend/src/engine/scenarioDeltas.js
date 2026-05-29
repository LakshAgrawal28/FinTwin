export const SCENARIO_DELTAS = {
  quitJob: {
    name: 'Quit my job',
    incomeMultiplier: 0,
    expenseMultiplier: 1.1,
    portfolioVolatilityMultiplier: 1.0,
    rampMonths: 6,
    rampTargetIncome: 60000,
    description: 'Income drops to zero for 6 months, then ramps to ₹60,000 freelance income'
  },
  moveToBangalore: {
    name: 'Move to Bangalore',
    incomeMultiplier: 0.85,
    expenseMultiplier: 0.45,
    portfolioVolatilityMultiplier: 1.0,
    rampMonths: 0,
    rampTargetIncome: null,
    description: 'Lower cost of living reduces expenses by 55%, income reduces 15%'
  },
  investInCrypto: {
    name: 'Invest in Crypto',
    incomeMultiplier: 1.0,
    expenseMultiplier: 1.0,
    portfolioVolatilityMultiplier: 3.5,
    cryptoAllocationPercent: 0.20,
    rampMonths: 0,
    rampTargetIncome: null,
    description: 'Allocate 20% of portfolio to crypto, increasing volatility 3.5x'
  }
};

export function getScenarioDelta(scenarioKey) {
  const delta = SCENARIO_DELTAS[scenarioKey];
  if (!delta) {
    throw new Error(`Scenario not found: ${scenarioKey}`);
  }
  return delta;
}
