import { Router } from 'express';
import { callClaude } from '../services/claudeService.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { portfolio } = req.body;
    if (!portfolio || !Array.isArray(portfolio)) return res.json([]);

    const TARGETS = { Equity: 0.65, Debt: 0.30, Gold: 0.05, Crypto: 0.0 };
    
    let totalValue = portfolio.reduce((sum, item) => sum + item.currentValue, 0);
    
    const currentByType = { Equity: 0, Debt: 0, Gold: 0, Crypto: 0 };
    portfolio.forEach(item => {
      if (currentByType[item.type] !== undefined) {
        currentByType[item.type] += item.currentValue;
      }
    });

    const actions = [];
    
    for (const item of portfolio) {
      if (!TARGETS.hasOwnProperty(item.type)) continue;
      
      const currentAllocationAmt = currentByType[item.type] || Math.max(0.1, item.currentValue);
      const expectedAssetValue = totalValue * TARGETS[item.type] * (item.currentValue / currentAllocationAmt);
      let diff = expectedAssetValue - item.currentValue;
      
      if (Math.abs(diff) < 1000) continue;
      
      const actionType = diff > 0 ? 'BUY' : 'SELL';
      const amount = Math.abs(diff);
      const postTradeValue = item.currentValue + diff;

      let taxAmount = 0;
      let taxType = 'None';
      
      if (actionType === 'SELL') {
        const fractionSold = amount / item.currentValue;
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
      }

      const prompt = `You are a financial advisor. Briefly explain in MAXIMUM 15 words why we should ${actionType} ₹${Math.round(amount)} of ${item.name} to reach our optimal asset allocation. Target class allocation is ${TARGETS[item.type]*100}%.`;
      const rawReason = await callClaude('You give very short financial explanations.', prompt, false);
      const reasonText = typeof rawReason === 'string' ? rawReason.trim() : JSON.stringify(rawReason);

      actions.push({
        step: actions.length + 1,
        action: actionType,
        assetName: item.name,
        amount: Math.round(amount),
        currentValue: Math.round(item.currentValue),
        postTradeValue: Math.round(postTradeValue),
        reason: reasonText,
        taxAmount: Math.round(taxAmount),
        taxType,
        tip: reasonText
      });
    }

    res.json(actions);
  } catch (error) {
    next(error);
  }
});

export default router;
