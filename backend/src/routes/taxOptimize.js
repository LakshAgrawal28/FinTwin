import { Router } from 'express';

const router = Router();

// Indian tax rules 2024-25
const TAX_RULES = {
  STCG_EQUITY: 0.20,
  LTCG_EQUITY: 0.125,
  LTCG_DEBT: 'slab',
  SECTION_80C_LIMIT: 150000,
  SECTION_80D_LIMIT: 25000,
  NPS_ADDITIONAL: 50000,
  LTCG_EQUITY_EXEMPT: 125000,
};

router.post('/', async (req, res) => {
  try {
    const { portfolio, profile } = req.body;
    const suggestions = [];
    let estimatedTaxSaving = 0;

    const taxBracket = Number(profile?.taxBracket) || 30;

    // 80C headroom
    const invested80C = Number(profile?.invested80C) || 0;
    const headroom80C = Math.max(0, TAX_RULES.SECTION_80C_LIMIT - invested80C);
    if (headroom80C > 0) {
      const saving = headroom80C * (taxBracket / 100);
      estimatedTaxSaving += saving;
      suggestions.push({
        type: '80C',
        action: `Invest ₹${headroom80C.toLocaleString('en-IN')} more in ELSS/PPF/LIC`,
        saving: Math.round(saving),
        priority: 'high',
      });
    }

    // NPS
    if (!profile?.hasNPS) {
      const npsSaving = TAX_RULES.NPS_ADDITIONAL * (taxBracket / 100);
      estimatedTaxSaving += npsSaving;
      suggestions.push({
        type: 'NPS',
        action: 'Open NPS account — additional ₹50,000 deduction under 80CCD(1B)',
        saving: Math.round(npsSaving),
        priority: 'high',
      });
    }

    // LTCG harvesting
    const holdings = Array.isArray(portfolio) ? portfolio : (portfolio?.holdings || []);
    for (const asset of holdings) {
      if (asset.type === 'Equity') {
        const gain = (asset.currentValue || 0) - (asset.costBasis || 0);
        if (gain > 0 && gain <= TAX_RULES.LTCG_EQUITY_EXEMPT) {
          suggestions.push({
            type: 'LTCG Harvesting',
            action: `Book gains of ₹${gain.toLocaleString('en-IN')} in ${asset.name} — within ₹1.25L exempt limit, then rebuy`,
            saving: Math.round(gain * TAX_RULES.LTCG_EQUITY),
            priority: 'medium',
          });
        }
      }
    }

    // Health Insurance
    if (!profile?.hasHealthInsurance) {
      const saving80D = TAX_RULES.SECTION_80D_LIMIT * (taxBracket / 100);
      estimatedTaxSaving += saving80D;
      suggestions.push({
        type: '80D',
        action: `Get health insurance — up to ₹${TAX_RULES.SECTION_80D_LIMIT.toLocaleString('en-IN')} deduction under 80D`,
        saving: Math.round(saving80D),
        priority: 'high',
      });
    }

    res.json({
      suggestions,
      totalEstimatedSaving: Math.round(estimatedTaxSaving),
      taxRules: TAX_RULES,
    });
  } catch (err) {
    console.error('Tax optimize error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
