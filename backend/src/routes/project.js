import { Router } from 'express';
import { percentile } from '../engine/monteCarlo.js';

const router = Router();

function forecaster(portfolioAmount, equityPct, debtPct, goldPct, cryptoPct = 0, monthlyContribution = 0) {
  const years = 20;
  const iterations = 1000;
  
  const mean = (equityPct * 0.10) + (debtPct * 0.07) + (goldPct * 0.085) + (cryptoPct * 0.40);
  const variance = Math.pow(equityPct * 0.15, 2) + Math.pow(debtPct * 0.03, 2) + Math.pow(goldPct * 0.12, 2) + Math.pow(cryptoPct * 0.60, 2);
  const std = Math.sqrt(variance);
  const monthlyMean = mean / 12;
  const monthlyStd = std / Math.sqrt(12);
  
  const resultsByYear = Array.from({ length: years }, () => new Float64Array(iterations));

  for (let i = 0; i < iterations; i++) {
    let wealth = portfolioAmount;
    for (let y = 0; y < years; y++) {
      // Inflation-adjusted contribution: steps up 5% annually (applied linearly each month for simplicity)
      const currentYearIndex = y;
      const stepUpMultiplier = Math.pow(1.05, currentYearIndex);
      const activeMonthlyContrib = monthlyContribution * stepUpMultiplier;

      // Run 12 monthly steps per year for precision
      for (let mo = 0; mo < 12; mo++) {
        let u1 = Math.random(); while(u1 === 0) u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        const monthReturn = monthlyMean + monthlyStd * z;
        
        wealth = wealth * (1 + monthReturn) + activeMonthlyContrib;
        if (wealth < 0) wealth = 0;
      }
      resultsByYear[y][i] = wealth;
    }
  }

  const p10 = new Array(years);
  const p50 = new Array(years);
  const p90 = new Array(years);
  const yearLabels = new Array(years);

  for (let y = 0; y < years; y++) {
    yearLabels[y] = y + 1;
    const yearData = resultsByYear[y];
    yearData.sort();
    p10[y] = percentile(yearData, 0.10);
    p50[y] = percentile(yearData, 0.50);
    p90[y] = percentile(yearData, 0.90);
  }

  return { p10, p50, p90, years: yearLabels, rawData: resultsByYear };
}

function getPcts(portfolio) {
  const total = portfolio.reduce((s, i) => s + i.currentValue, 0);
  if (total === 0) return { e:0, d:0, g:0, c:0, total: 0 };
  let e=0, d=0, g=0, c=0;
  portfolio.forEach(i => {
    const w = i.currentValue / total;
    if (i.type === 'Equity') e += w;
    else if (i.type === 'Debt') d += w;
    else if (i.type === 'Gold') g += w;
    else if (i.type === 'Crypto') c += w;
  });
  return { e, d, g, c, total };
}

function prob(rawYearData, target) {
  let count = 0;
  for (let i=0; i < rawYearData.length; i++) {
    if (rawYearData[i] >= target) count++;
  }
  return (count / rawYearData.length) * 100;
}

router.post('/', async (req, res, next) => {
  try {
    const { currentPortfolio, rebalancedPortfolio, userProfile } = req.body;
    
    const curr = getPcts(currentPortfolio);
    const reb = getPcts(rebalancedPortfolio);

    // Use actual monthly investment from profile, defaulting safely to 0
    let monthlyContrib = userProfile?.monthlyInvestment ?? (Number(userProfile?.income) * 0.1) ?? 5000;
    if (typeof monthlyContrib !== 'number' || isNaN(monthlyContrib)) monthlyContrib = 0;
    
    let portfolioTotal = curr.total ?? Number(userProfile?.portfolioValue) ?? 100000;
    if (isNaN(portfolioTotal)) portfolioTotal = 0;

    const currentReq = forecaster(portfolioTotal, curr.e, curr.d, curr.g, curr.c, monthlyContrib);
    const rebalancedReq = forecaster(reb.total || portfolioTotal, reb.e, reb.d, reb.g, reb.c, monthlyContrib);

    // Dynamic milestones based on user's starting portfolio
    const base = portfolioTotal;
    const milestones = [
      { label: `${base < 2000000 ? '₹50 Lakhs' : '2× Portfolio'}`, targetValue: Math.max(5000000, base * 2), probCurrent: prob(currentReq.rawData[4], Math.max(5000000, base * 2)), probRebalanced: prob(rebalancedReq.rawData[4], Math.max(5000000, base * 2)) },
      { label: '₹1 Crore', targetValue: 10000000, probCurrent: prob(currentReq.rawData[7], 10000000), probRebalanced: prob(rebalancedReq.rawData[7], 10000000) },
      { label: '₹2 Crores', targetValue: 20000000, probCurrent: prob(currentReq.rawData[12], 20000000), probRebalanced: prob(rebalancedReq.rawData[12], 20000000) },
      { label: '₹5 Crores', targetValue: 50000000, probCurrent: prob(currentReq.rawData[17], 50000000), probRebalanced: prob(rebalancedReq.rawData[17], 50000000) }
    ];

    delete currentReq.rawData;
    delete rebalancedReq.rawData;

    res.json({
      current: currentReq,
      rebalanced: rebalancedReq,
      milestones,
      assumptions: {
        monthlyContribution: monthlyContrib,
        startingPortfolio: portfolioTotal,
      }
    });

  } catch (error) {
    next(error);
  }
});

export default router;
