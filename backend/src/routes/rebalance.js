import { Router } from 'express';
import { callClaude } from '../services/claudeService.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { portfolio, customTargets, profile } = req.body;
    if (!portfolio || !Array.isArray(portfolio)) return res.json([]);

    // Calculate dynamic Targets based on custom input, profile drive, or defaults
    let TARGETS = { Equity: 0.65, Debt: 0.30, Gold: 0.05, Crypto: 0.0 };
    
    if (customTargets && typeof customTargets === 'object') {
      TARGETS = {
        Equity: Number(customTargets.Equity ?? 65) / 100,
        Debt: Number(customTargets.Debt ?? 30) / 100,
        Gold: Number(customTargets.Gold ?? 5) / 100,
        Crypto: Number(customTargets.Crypto ?? 0) / 100
      };
    } else if (profile) {
      const age = Number(profile.age) || 30;
      const drive = profile.emotionalChoice || 'Balance';
      
      let eq = (100 - age) / 100;
      let gold = 0.05;
      
      if (drive === 'Security') {
        eq = Math.max(0.1, eq - 0.15);
      } else if (drive === 'Growth') {
        eq = Math.min(0.9, eq + 0.15);
      } else if (drive === 'Independence') {
        eq = Math.min(0.85, eq + 0.10);
      }
      
      let debt = Math.max(0, 1.0 - eq - gold);
      
      TARGETS = { Equity: eq, Debt: debt, Gold: gold, Crypto: 0.0 };
    }

    let totalValue = portfolio.reduce((sum, item) => sum + item.currentValue, 0);
    
    const currentByType = { Equity: 0, Debt: 0, Gold: 0, Crypto: 0 };
    portfolio.forEach(item => {
      if (currentByType[item.type] !== undefined) {
        currentByType[item.type] += item.currentValue;
      }
    });

    const actions = [];
    let stepCount = 1;

    const defaultAssets = {
      Equity: "Nifty 50 Index ETF",
      Debt: "Liquid Debt Fund",
      Gold: "Gold ETF",
      Crypto: "Bitcoin"
    };

    // First do SELLs
    for (const type of Object.keys(TARGETS)) {
      const targetAmount = totalValue * TARGETS[type];
      const currentAmount = currentByType[type] || 0;
      const diff = targetAmount - currentAmount;
      
      if (diff < -1000) {
        // Need to SELL
        const amountToSell = Math.abs(diff);
        const assetsInClass = portfolio.filter(a => a.type === type);
        
        for (const item of assetsInClass) {
          const sellProportion = item.currentValue / currentAmount;
          const sellAmount = amountToSell * sellProportion;
          
          if (sellAmount < 100) continue;
          
          let taxAmount = 0;
          let taxType = 'None';
          const fractionSold = sellAmount / item.currentValue;
          const gainFromSale = (item.currentValue - item.costBasis) * fractionSold;
          
          if (gainFromSale > 0) {
            if (item.type === 'Crypto') {
              taxAmount = gainFromSale * 0.30;
              taxType = 'STCG Rate (30%)';
            } else if (item.type === 'Equity') {
              taxAmount = Math.max(0, gainFromSale - 100000) * 0.10;
              if (taxAmount > 0) taxType = 'LTCG Rate (10% over 1L)';
            } else if (item.type === 'Debt') {
              taxAmount = gainFromSale * 0.20;
              taxType = 'LTCG Rate (20%)';
            }
          }

          const targetPct = Math.round(TARGETS[item.type] * 100);
          actions.push({
            step: stepCount++,
            action: 'SELL',
            assetName: item.name,
            amount: Math.round(sellAmount),
            currentValue: Math.round(item.currentValue),
            postTradeValue: Math.round(item.currentValue - sellAmount),
            reason: `Sell overexposed holdings in ${item.name} to trim ${item.type} towards target of ${targetPct}%.`,
            taxAmount: Math.round(taxAmount),
            taxType,
            tip: `Sell overexposed holdings in ${item.name} to trim ${item.type} towards target of ${targetPct}%.`
          });
        }
      }
    }

    // Then do BUYs
    for (const type of Object.keys(TARGETS)) {
      const targetAmount = totalValue * TARGETS[type];
      const currentAmount = currentByType[type] || 0;
      const diff = targetAmount - currentAmount;

      if (diff > 1000) {
        // Need to BUY
        const amountToBuy = diff;
        const assetsInClass = portfolio.filter(a => a.type === type);
        const targetPct = Math.round(TARGETS[type] * 100);
        
        if (assetsInClass.length > 0) {
          for (const item of assetsInClass) {
            const buyProportion = item.currentValue / currentAmount;
            const buyAmount = amountToBuy * buyProportion;
            
            if (buyAmount < 100) continue;

            actions.push({
              step: stepCount++,
              action: 'BUY',
              assetName: item.name,
              amount: Math.round(buyAmount),
              currentValue: Math.round(item.currentValue),
              postTradeValue: Math.round(item.currentValue + buyAmount),
              reason: `Reallocate to accumulate ${item.name} towards target of ${targetPct}% in ${item.type}.`,
              taxAmount: 0,
              taxType: 'None',
              tip: `Reallocate to accumulate ${item.name} towards target of ${targetPct}% in ${item.type}.`
            });
          }
        } else {
          const defaultAsset = defaultAssets[type];
          actions.push({
            step: stepCount++,
            action: 'BUY',
            assetName: defaultAsset,
            amount: Math.round(amountToBuy),
            currentValue: 0,
            postTradeValue: Math.round(amountToBuy),
            reason: `Establish new position in ${defaultAsset} to reach target of ${targetPct}% in ${type}.`,
            taxAmount: 0,
            taxType: 'None',
            tip: `Establish new position in ${defaultAsset} to reach target of ${targetPct}% in ${type}.`
          });
        }
      }
    }

    res.json(actions);
  } catch (error) {
    next(error);
  }
});

export default router;
