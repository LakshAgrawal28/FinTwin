import { Router } from 'express';
import { callClaude } from '../services/claudeService.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { profile, portfolio } = req.body;

    if (!profile) {
      return res.status(400).json({ error: 'profile is required' });
    }

    // Rule-based score — no hallucination risk
    let score = 0;
    const breakdown = [];

    // 1. Emergency Fund (20 pts)
    const monthlyExpenses = (Number(profile.monthlyExpenses) || Number(profile.expenses) || 0) +
      (Number(profile.monthlyEMI) || Number(profile.emi) || 0);
    const currentSavings = Number(profile.currentSavings) || 0;
    const emergencyMonths = monthlyExpenses > 0 ? currentSavings / monthlyExpenses : 0;
    const efScore = Math.min(20, (emergencyMonths / 6) * 20);
    score += efScore;
    breakdown.push({
      category: 'Emergency Fund',
      score: Math.round(efScore),
      max: 20,
      message: emergencyMonths >= 6
        ? '✅ 6+ months covered'
        : `⚠️ Only ${emergencyMonths.toFixed(1)} months — target 6`,
    });

    // 2. Savings Rate (20 pts) — logarithmic: more sensitive in 5-25% range
    const monthlyIncome = Number(profile.monthlyIncome) || Number(profile.income) || 0;
    const monthlyInvestment = Number(profile.monthlyInvestment) || 0;
    const savingsRate = monthlyIncome > 0 ? monthlyInvestment / monthlyIncome : 0;
    // Log scale: 0%=0pts, 10%=10pts, 20%=16pts, 30%+=20pts
    const srScore = savingsRate <= 0 ? 0 : Math.min(20, (Math.log(1 + savingsRate * 10) / Math.log(4)) * 20);
    score += srScore;
    breakdown.push({
      category: 'Savings Rate',
      score: Math.round(srScore),
      max: 20,
      message: savingsRate <= 0
        ? '❌ No monthly investment — start a SIP immediately'
        : `${(savingsRate * 100).toFixed(1)}% invested (₹${monthlyInvestment.toLocaleString('en-IN')}/mo) — ${savingsRate >= 0.3 ? '✅ Excellent' : savingsRate >= 0.2 ? '✅ Good' : savingsRate >= 0.1 ? '⚠️ Fair — target 20%+' : '❌ Low — target 20%+'}`,
    });

    // 3. Debt-to-Income (20 pts)
    const monthlyEMI = Number(profile.monthlyEMI) || Number(profile.emi) || 0;
    const dti = monthlyIncome > 0 ? monthlyEMI / monthlyIncome : 0;
    const dtiScore = Math.max(0, 20 - (dti / 0.4) * 20);
    score += dtiScore;
    breakdown.push({
      category: 'Debt Load',
      score: Math.round(dtiScore),
      max: 20,
      message: `EMIs = ${(dti * 100).toFixed(1)}% of income — ${dti <= 0.3 ? '✅ Healthy' : '⚠️ High debt'}`,
    });

    // 4. Insurance Coverage (20 pts)
    const insScore = (profile.hasHealthInsurance ? 10 : 0) + (profile.hasTermInsurance ? 10 : 0);
    score += insScore;
    breakdown.push({
      category: 'Insurance',
      score: insScore,
      max: 20,
      message: `Health: ${profile.hasHealthInsurance ? '✅' : '❌'} | Term: ${profile.hasTermInsurance ? '✅' : '❌'}`,
    });

    // 5. Portfolio Risk & Asset Mix (20 pts)
    const holdings = Array.isArray(portfolio) ? portfolio : (portfolio?.holdings || []);
    const totalPortfolioValue = holdings.reduce((s, h) => s + (h.currentValue || 0), 0);
    
    // Concentration Check (single stock/fund > 15%)
    let concentrationPenalty = 0;
    let maxConcPct = 0;
    let highConcAsset = '';
    holdings.forEach(h => {
      const pct = (h.currentValue / totalPortfolioValue) * 100;
      if (pct > maxConcPct) maxConcPct = pct;
      if (pct > 15 && (h.type === 'Equity' || h.type === 'Crypto')) {
        concentrationPenalty += Math.min(10, (pct - 15) * 0.5);
        if (pct > (maxConcPct * 0.8)) highConcAsset = h.name;
      }
    });

    // Age-based Equity Check
    const age = Number(profile.age) || 30;
    const equityHoldings = holdings.filter(h => h.type === 'Equity');
    const equityValue = equityHoldings.reduce((s, h) => s + (h.currentValue || 0), 0);
    const equityPct = totalPortfolioValue > 0 ? (equityValue / totalPortfolioValue) * 100 : 0;
    const expectedEquityPct = 100 - age;
    
    const equityDiff = Math.abs(equityPct - expectedEquityPct);
    const mixScore = Math.max(0, 20 - (equityDiff > 15 ? (equityDiff - 15) * 0.5 : 0) - concentrationPenalty);
    
    score += mixScore;
    
    const concentrationRisk = Math.min(100, Math.round(maxConcPct * 1.5));
    const volatilityRisk = Math.min(100, Math.round(equityPct + (holdings.find(h => h.type === 'Crypto')?.allocation || 0) * 2));
    const liquidityRisk = Math.max(0, Math.min(100, 100 - (emergencyMonths * 10)));
    
    breakdown.push({
      category: 'Asset Mix & Risk',
      score: Math.round(mixScore),
      max: 20,
      message: highConcAsset ? `⚠️ High concentration in ${highConcAsset}` : 
               (equityDiff <= 15 ? '✅ Age-appropriate risk' : '⚠️ Sub-optimal allocation for age'),
      metrics: {
        concentrationRisk,
        volatilityRisk,
        liquidityRisk
      }
    });

    // Get AI commentary — specific numbers make advice personalized
    let aiAdvice = '';
    try {
      const age = Number(profile.age) || 30;
      const retirementAge = Number(profile.retirementAge) || 60;
      const yearsToRetire = retirementAge - age;
      const surplus = monthlyIncome - (Number(profile.monthlyExpenses) || Number(profile.expenses) || 0) - (Number(profile.monthlyEMI) || Number(profile.emi) || 0) - monthlyInvestment;
      const portfolioValue = Number(profile.portfolioValue) || 0;
      const monthlyEMI = Number(profile.monthlyEMI) || Number(profile.emi) || 0;
      const worstBreakdown = [...breakdown].sort((a, b) => (a.score / a.max) - (b.score / b.max))[0];

      const aiPrompt = `A ${age}-year-old Indian professional has a financial health score of ${Math.round(score)}/100. Their exact details: monthly take-home ₹${monthlyIncome.toLocaleString('en-IN')}, monthly SIP/investment ₹${monthlyInvestment.toLocaleString('en-IN')} (${(savingsRate * 100).toFixed(0)}% rate), monthly EMIs ₹${monthlyEMI.toLocaleString('en-IN')}, monthly surplus ₹${surplus.toLocaleString('en-IN')}, current portfolio value ₹${portfolioValue.toLocaleString('en-IN')}, emergency fund covers ${emergencyMonths.toFixed(1)} months, health insurance: ${profile.hasHealthInsurance ? 'Yes' : 'No'}, term insurance: ${profile.hasTermInsurance ? 'Yes' : 'No'}, ${yearsToRetire} years to retirement. Weakest area: "${worstBreakdown?.category}" — ${worstBreakdown?.message}. Write exactly 2 sentences of direct, actionable advice that references their specific rupee amounts and timeline. No markdown, no generic platitudes.`;
      const aiResult = await callClaude('You are a blunt Indian financial advisor who gives advice based only on the person\'s exact numbers.', aiPrompt, false);
      aiAdvice = typeof aiResult === 'string' ? aiResult : (aiResult?.summary || JSON.stringify(aiResult));
    } catch (aiErr) {
      console.error('AI advice generation failed:', aiErr.message);
      const monthlyEMIFallback = Number(profile.monthlyEMI) || Number(profile.emi) || 0;
      aiAdvice = savingsRate < 0.1
        ? `Your savings rate of ${(savingsRate * 100).toFixed(0)}% is critically low — redirect at least ₹${Math.round(monthlyIncome * 0.2).toLocaleString('en-IN')}/month into a diversified index fund SIP. With ${emergencyMonths.toFixed(1)} months of emergency cover, build that buffer to 6 months before aggressive investing.`
        : `Your health score is ${Math.round(score)}/100 — ${emergencyMonths < 6 ? 'prioritise building your emergency fund to 6 months of expenses' : 'focus on increasing your SIP to at least 20% of income'}.`;
    }

    res.json({
      totalScore: Math.round(score),
      grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D',
      breakdown,
      aiAdvice,
    });
  } catch (err) {
    console.error('Health score error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
