import { Router } from 'express';

const router = Router();

function generateDynamicPortfolio(profile) {
  const age = Number(profile.age) || 30;
  const totalValue = Number(profile.portfolioValue) || 2400000; // default 24L

  // Simple risk heuristic based on age
  const isAggressive = age < 35;
  
  const eqTarget = isAggressive ? 0.70 : 0.55;
  const debtTarget = isAggressive ? 0.20 : 0.35;
  const goldTarget = 0.05;
  const cryptoTarget = isAggressive ? 0.05 : 0.05;

  const holdings = [];

  // Equity - 3 funds
  holdings.push({ 
    id: 1, name: 'Nifty 50 Index Fund', fundHouse: 'Mirae Asset', type: 'Equity', 
    currentValue: totalValue * eqTarget * 0.5, 
    allocation: (eqTarget * 50).toFixed(1), cagr: 15.2, health: 'Optimal', 
    costBasis: totalValue * eqTarget * 0.5 * 0.7 
  });
  holdings.push({ 
    id: 2, name: 'Midcap Target Fund', fundHouse: 'SBI Mutual', type: 'Equity', 
    currentValue: totalValue * eqTarget * 0.3, 
    allocation: (eqTarget * 30).toFixed(1), cagr: 22.4, health: 'Good', 
    costBasis: totalValue * eqTarget * 0.3 * 0.65 
  });
  holdings.push({ 
    id: 3, name: 'Direct Stocks (Tech)', fundHouse: 'Direct', type: 'Equity', 
    currentValue: totalValue * eqTarget * 0.2, 
    allocation: (eqTarget * 20).toFixed(1), cagr: isAggressive ? 28.5 : -5.4, 
    health: isAggressive ? 'Concentrated' : 'Bleeding', 
    costBasis: totalValue * eqTarget * 0.2 * (isAggressive ? 0.8 : 1.2) 
  });

  // Debt - 2 funds
  holdings.push({ 
    id: 4, name: 'Corporate Bond Fund', fundHouse: 'HDFC', type: 'Debt', 
    currentValue: totalValue * debtTarget * 0.6, 
    allocation: (debtTarget * 60).toFixed(1), cagr: 7.2, health: 'Stable', 
    costBasis: totalValue * debtTarget * 0.6 * 0.9 
  });
  holdings.push({ 
    id: 5, name: 'PPF / EPF', fundHouse: 'Govt', type: 'Debt', 
    currentValue: totalValue * debtTarget * 0.4, 
    allocation: (debtTarget * 40).toFixed(1), cagr: 7.1, health: 'Locked', 
    costBasis: totalValue * debtTarget * 0.4 * 0.85 
  });

  // Gold
  holdings.push({ 
    id: 6, name: 'Sovereign Gold Bond', fundHouse: 'RBI', type: 'Gold', 
    currentValue: totalValue * goldTarget, 
    allocation: (goldTarget * 100).toFixed(1), cagr: 11.5, health: 'Good hedge', 
    costBasis: totalValue * goldTarget * 0.75 
  });

  // Crypto
  if (cryptoTarget > 0) {
    holdings.push({ 
      id: 7, name: 'Crypto Basket (BTC/ETH)', fundHouse: 'Exchange', type: 'Crypto', 
      currentValue: totalValue * cryptoTarget, 
      allocation: (cryptoTarget * 100).toFixed(1), cagr: isAggressive ? 85 : 45, 
      health: 'Overexposed', 
      costBasis: totalValue * cryptoTarget * 0.5 
    });
  }

  // Recalculate true allocations to ensure they sum to exactly 100 on frontend
  const actualTotal = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  holdings.forEach(h => {
    h.allocation = Number(((h.currentValue / actualTotal) * 100).toFixed(1));
  });

  return holdings;
}

router.post('/', (req, res) => {
  const profile = req.body.profile || {};
  let dynamicPortfolio = [];
  if (profile.holdings && profile.holdings.length > 0) {
    const totalCost = profile.holdings.reduce((sum, h) => sum + (h.costBasis || h.currentValue || 0), 0);
    const totalVal = profile.holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
    dynamicPortfolio = profile.holdings.map((h, i) => {
      const cVal = h.currentValue || 0;
      const bVal = h.costBasis || cVal;
      const fallbackCagr = bVal > 0 ? ((cVal / bVal) - 1) * 100 : 0;
      const allocPct = Number(((cVal / (totalVal || 1)) * 100).toFixed(1));
      
      return {
        ...h,
        id: h.id || i + 1,
        allocation: h.allocation ?? allocPct,
        cagr: h.cagr ?? Math.round(fallbackCagr * 10) / 10,
        health: h.health || (allocPct > 40 ? 'Overexposed' : allocPct > 25 ? 'Concentrated' : 'Optimal'),
      };
    });
  } else {
    dynamicPortfolio = generateDynamicPortfolio(profile);
  }

  const totalValue = dynamicPortfolio.reduce((sum, item) => sum + item.currentValue, 0);
  const totalCost = dynamicPortfolio.reduce((sum, item) => sum + item.costBasis, 0);
  const totalGain = totalValue - totalCost;

  const allocationBreakdown = {
    equity: 0,
    debt: 0,
    gold: 0,
    crypto: 0
  };

  dynamicPortfolio.forEach(item => {
    const pct = (item.currentValue / totalValue) * 100;
    if (item.type === 'Equity') allocationBreakdown.equity += pct;
    else if (item.type === 'Debt') allocationBreakdown.debt += pct;
    else if (item.type === 'Gold') allocationBreakdown.gold += pct;
    else if (item.type === 'Crypto') allocationBreakdown.crypto += pct;
  });

  res.json({
    holdings: dynamicPortfolio,
    totalValue,
    totalGain,
    allocationBreakdown
  });
});

export default router;
