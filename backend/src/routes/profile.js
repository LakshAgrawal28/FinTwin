import express from "express";
import { callClaude } from "../services/claudeService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const userData = req.body;

    if (!userData || !userData.income) {
      return res.status(400).json({ error: "Invalid request body. Financial data is required." });
    }

    const inc = Number(userData.income || userData.monthlyIncome) || 0;
    const exp = Number(userData.expenses || userData.monthlyExpenses) || 0;
    const emi = Number(userData.emi || userData.monthlyEMI) || 0;
    const varSp = Number(userData.variableSpend || 0);
    const savings = inc - exp - emi - varSp;
    const savingsRate = inc > 0 ? (savings / inc) * 100 : 0;
    const drive = userData.emotionalChoice || 'Balance';

    let archetype = "Balanced Achiever";
    let riskScore = 60;
    let traits = [];
    let summary = "";

    // Archetype Classification:
    if (inc > 0 && (emi / inc) > 0.35) {
      archetype = "Debt Warrior";
      riskScore = 40;
      traits = ["Debt-Focused", "Stressed Cash Flow", "Risk-Averse"];
      summary = `Your primary financial focus is managing and servicing debt payments, which currently consume ${Math.round((emi/inc)*100)}% of your monthly take-home. Your priority should be building an emergency shield of 6 months' expenses and systematically paying down high-interest liabilities.`;
    } else if (savingsRate < 10) {
      archetype = "Impulsive Spender";
      riskScore = 70;
      traits = ["High Discretionary Spend", "Low Cash Reserve", "Optimistic"];
      summary = `With a savings rate of ${savingsRate.toFixed(1)}%, your monthly income is leaking into discretionary variable spend. You have moderate risk tolerance but lack the financial runway. Establishing auto-debit SIPs first will help enforce savings discipline.`;
    } else if (savingsRate >= 35 && drive === 'Security') {
      archetype = "Conservative Saver";
      riskScore = 30;
      traits = ["Capital Preservation", "High Liquidity", "Risk-Averse"];
      summary = `You have an excellent savings rate of ${savingsRate.toFixed(1)}%, but prioritize security above all. You tend to keep assets in low-yield fixed deposits. Introducing a systematic allocation to index funds will help protect your wealth against inflation.`;
    } else if (savingsRate >= 35 && drive === 'Growth') {
      archetype = "Aggressive Grower";
      riskScore = 85;
      traits = ["High Risk Appetite", "Wealth compounding", "Optimistic"];
      summary = `An exceptional savings rate of ${savingsRate.toFixed(1)}% combined with a focus on high growth makes you a compounding machine. You are comfortable with volatility, meaning equity index, mid-cap, and opportunistic assets should form the core of your twin.`;
    } else if (drive === 'Independence') {
      archetype = "Disciplined Builder";
      riskScore = 65;
      traits = ["Goal Oriented", "Structured Planner", "Patient"];
      summary = `You are focused on building financial independence and autonomy. You manage cash flow systematically (savings rate: ${savingsRate.toFixed(1)}%) and allocate capital with a multi-year horizon, balancing asset growth with safety.`;
    } else {
      archetype = "Balanced Achiever";
      riskScore = 60;
      traits = ["Balanced Risk", "Discipline Saver", "Patience"];
      summary = `You maintain a healthy balance between current lifestyle spending and future goals (savings rate: ${savingsRate.toFixed(1)}%). Your risk tolerance is moderate, showing stability with structured asset allocations across equity and debt.`;
    }

    const currentSavingsVal = Number(userData.currentSavings) || 0;
    const monthlyExpensesTotal = exp + emi;
    const liquidityRatio = monthlyExpensesTotal > 0 ? (currentSavingsVal / monthlyExpensesTotal) : 0;

    const radarScores = {
      riskTolerance: riskScore,
      discipline: Math.round(Math.min(95, Math.max(30, 20 + savingsRate * 1.5))),
      patience: drive === 'Security' ? 85 : drive === 'Independence' ? 80 : 70,
      optimism: drive === 'Growth' ? 85 : drive === 'Security' ? 45 : 65,
      liquidity: Math.round(Math.min(95, Math.max(20, liquidityRatio * 15)))
    };

    const monthlyNetWorth = savings > 0 ? savings : 10000;
    const portfolioValue = Number(userData.portfolioValue) || 0;
    const estimatedNetWorth = portfolioValue + currentSavingsVal;

    res.json({
      archetype,
      riskScore,
      radarScores,
      summary,
      traits,
      savingsRate: Math.round(savingsRate * 10) / 10,
      monthlyNetWorth,
      estimatedNetWorth
    });
  } catch (error) {
    console.error("Profile generation error:", error.message);
    res.status(500).json({ error: "Failed to generate financial twin profile." });
  }
});

export default router;
