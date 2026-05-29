import axios from 'axios';

const MOCK_MODE = process.env.MOCK_AI === 'true' || (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY);

const MOCK_PROFILE = {
  "archetype": "Balanced Achiever",
  "riskScore": 65,
  "radarScores": {
    "riskTolerance": 60,
    "discipline": 85,
    "patience": 75,
    "optimism": 70,
    "liquidity": 50
  },
  "summary": "You have a disciplined approach to savings but a moderate risk appetite. Your portfolio structure suggests a focus on long-term stability with periodic growth opportunistic plays.",
  "traits": ["Disciplined Saver", "Goal Oriented", "Moderately Risk-Averse"],
  "savingsRate": 37.5,
  "monthlyNetWorth": 45000,
  "estimatedNetWorth": 645000
};

const MOCK_INSIGHT = "Based on your current trajectory, your financial twin is showing strong resilience. Your monthly surplus of ₹45,000 is being utilized efficiently. To reach your 10-year goal faster, consider increasing your equity allocation by 5-10% to capture higher market risk premiums, given your 'Balanced Achiever' archetype.";

const getMockScenario = (userInput = "") => {
  const inputLower = userInput.toLowerCase();
  
  if (inputLower.includes('job') || inputLower.includes('fired') || inputLower.includes('medical') || inputLower.includes('lose')) {
    return {
      "scenarioName": "Major Setup Back (Loss of Income)",
      "annualReturnRate": 0.08,
      "inflationRate": 0.08,
      "volatility": 0.25,
      "additionalMonthlyInvestment": -50000,
      "withdrawalStartYear": 1,
      "withdrawalAmount": 300000,
      "years": 20,
      "majorExpenses": [{ "year": 1, "amount": 1000000, "label": "Emergency Outlay" }],
      "salaryGrowthRate": 0.0,
      "scenarioSummary": "Severe income loss with high emergency withdrawals during early years."
    };
  } else if (inputLower.includes('promotion') || inputLower.includes('business') || inputLower.includes('lottery') || inputLower.includes('bull')) {
    return {
      "scenarioName": "Aggressive Wealth Accumulation",
      "annualReturnRate": 0.16,
      "inflationRate": 0.06,
      "volatility": 0.12,
      "additionalMonthlyInvestment": 100000,
      "withdrawalStartYear": null,
      "withdrawalAmount": 0,
      "years": 20,
      "majorExpenses": [],
      "salaryGrowthRate": 0.15,
      "scenarioSummary": "A powerful compounding curve driven by high income generation and strong market performance."
    };
  }
  
  // Default Average
  return {
    "scenarioName": "Standard Re-allocation",
    "annualReturnRate": 0.11,
    "inflationRate": 0.06,
    "volatility": 0.15,
    "additionalMonthlyInvestment": 10000,
    "withdrawalStartYear": 18,
    "withdrawalAmount": 100000,
    "years": 20,
    "majorExpenses": [
      { "year": 5, "amount": 1500000, "label": "Vehicle/Event Purchase" }
    ],
    "salaryGrowthRate": 0.08,
    "scenarioSummary": "A standard life trajectory with typical mid-term expenses and average market returns."
  };
};

/**
 * callClaude - unified Groq API caller with Mock Fallback
 */
export async function callClaude(systemPrompt, userMessage, stream = false) {
  if (MOCK_MODE) {
    console.log('⚠️ AI Mock Mode Active');
    if (stream) {
      // Return a fake axios-like response object for streaming
      return {
        data: {
          on: (event, callback) => {
            if (event === 'data') {
              const chunks = MOCK_INSIGHT.split(' ').map(word => `data: ${JSON.stringify({ choices: [{ delta: { content: word + ' ' } }] })}\n`);
              chunks.forEach((c, i) => setTimeout(() => callback(Buffer.from(c)), i * 50));
              setTimeout(() => callback(Buffer.from('data: [DONE]\n')), chunks.length * 50 + 100);
            }
            if (event === 'end') setTimeout(callback, MOCK_INSIGHT.split(' ').length * 50 + 200);
            if (event === 'error') {}
          }
        }
      };
    }

    // Smart Mock Selection
    const promptLower = (systemPrompt || '').toLowerCase();
    const userMessageLower = (typeof userMessage === 'string' ? userMessage : '').toLowerCase();
    
    if (promptLower.includes('scenario parser')) {
      return getMockScenario(userMessageLower);
    }
    
    if (typeof userMessage !== 'string' || promptLower.includes('personality analyzer')) {
      return MOCK_PROFILE;
    }

    if (userMessageLower.includes('15 words')) {
      return "Sell to reduce risk and realign with your optimal portfolio targets.";
    }

    return MOCK_INSIGHT;
  }

  const useGroq = !!process.env.GROQ_API_KEY;
  const useGemini = !!process.env.GEMINI_API_KEY;
  
  let apiKey = process.env.GROQ_API_KEY;
  let baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
  let modelId = 'llama-3.3-70b-versatile';

  if (!apiKey && useGemini) {
    apiKey = process.env.GEMINI_API_KEY;
    baseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    modelId = 'gemini-2.0-flash';
  }
  
  const currentProvider = baseUrl.includes('google') ? 'Gemini' : 'Groq';
  let messages;

  if (stream) {
    messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: typeof userMessage === 'string' ? userMessage : JSON.stringify(userMessage) },
    ];
  } else {
    const userData = userMessage;
    if (typeof userData === 'string') {
      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userData }
      ];
    } else {
      const savings = userData.income - userData.expenses - userData.variableSpend - userData.emi;
      const savingsRate = userData.income > 0 ? ((savings / userData.income) * 100).toFixed(1) : 0;

      const profilePrompt = `You are a financial personality analyzer for an Indian fintech app called FinTwin. Give the user's financial data below, generate a detailed financial twin personality profile. Respond ONLY with a valid JSON object.
      
DATA: ${JSON.stringify(userData)}
SAVINGS: ₹${savings} (${savingsRate}%)

JSON Schema:
{
  "archetype": "one of: Disciplined Builder | Aggressive Grower | Conservative Saver | Balanced Achiever | Debt Warrior | Impulsive Spender",
  "riskScore": number,
  "radarScores": { "riskTolerance": number, "discipline": number, "patience": number, "optimism": number, "liquidity": number },
  "summary": "string",
  "traits": ["string"],
  "savingsRate": number,
  "monthlyNetWorth": number,
  "estimatedNetWorth": number
}`;
      messages = [{ role: 'user', content: profilePrompt }];
    }
  }

  try {
    console.log(`🤖 AI Request: Using ${currentProvider} (${modelId})`);
    const response = await axios.post(
      baseUrl,
      {
        model: modelId,
        messages,
        temperature: 0.5,
        max_tokens: 1024,
        stream,
      },
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 30000,
        responseType: stream ? 'stream' : 'json',
      }
    );

    if (stream) return response;

    const content = response.data.choices[0].message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    try {
      return jsonMatch ? JSON.parse(jsonMatch[0]) : content;
    } catch (e) {
      return content;
    }
  } catch (error) {
    const isRateLimitOrAuth = error.response?.status === 429 || error.response?.status === 401;
    
    // Automatic Fallback from Groq to Gemini if Groq fails
    if (useGroq && useGemini && !baseUrl.includes('google') && isRateLimitOrAuth) {
      console.warn('⚠️ Groq limit reached or key invalid. Falling back to Gemini...');
      const geminiApiKey = process.env.GEMINI_API_KEY;
      const geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
      const geminiModelId = 'gemini-2.0-flash';
      
      try {
        const geminiResponse = await axios.post(
          geminiBaseUrl,
          { model: geminiModelId, messages, temperature: 0.5, max_tokens: 1024, stream },
          { headers: { Authorization: `Bearer ${geminiApiKey}`, 'Content-Type': 'application/json' }, timeout: 30000 }
        );
        const gContent = geminiResponse.data.choices[0].message.content.trim();
        const gJsonMatch = gContent.match(/\{[\s\S]*\}/);
        return gJsonMatch ? JSON.parse(gJsonMatch[0]) : gContent;
      } catch (geminiErr) {
        console.error('❌ Both Groq and Gemini failed:', geminiErr.message);
      }
    }

    console.error(`❌ AI API error:`, error.message);
    throw error;
  }
}

/**
 * callGroqStream - streams Groq response with Mock Fallback
 */
export async function callGroqStream(systemPrompt, userMessage, res) {
  if (MOCK_MODE) {
    console.log('⚠️ AI Stream Mock Mode Active');
    
    // Parse numbers from the structured userMessage to generate context-aware insight
    const extractNum = (label) => {
      const match = userMessage.match(new RegExp(label + '.*?₹?([\\d,]+)', 'i'));
      return match ? Number(match[1].replace(/,/g, '')) : 0;
    };
    const scenarioMatch = userMessage.match(/Scenario run:\s*(.*)/i);
    const scenarioName = scenarioMatch ? scenarioMatch[1].trim() : 'Custom';
    const archetypeMatch = userMessage.match(/User archetype:\s*(.*)/i);
    const archetype = archetypeMatch ? archetypeMatch[1].trim() : 'Unknown';
    const income = extractNum('Monthly income');
    const expenses = extractNum('Monthly expenses');
    const median = extractNum('Median outcome');
    const worst = extractNum('Worst case');
    const best = extractNum('Best case');
    const dangerMonths = extractNum('Danger zone months');
    
    const surplus = income - expenses;
    const surplusPercent = income > 0 ? ((surplus / income) * 100).toFixed(0) : 0;
    
    let insight;
    
    if (scenarioName.toLowerCase().includes('pause') || scenarioName.toLowerCase().includes('quit') || scenarioName.toLowerCase().includes('loss') || scenarioName.toLowerCase().includes('back')) {
      // Negative scenario
      insight = `⚠️ This "${scenarioName}" scenario exposes a critical vulnerability. Your portfolio's worst-case drops to ₹${worst.toLocaleString('en-IN')}, which would leave you with limited financial runway. ${dangerMonths > 0 ? `You'd spend roughly ${dangerMonths} months in the financial danger zone.` : ''}

As a "${archetype}" personality, your instinct may be to ride it out — but this scenario demands proactive defense. Your monthly surplus of ₹${surplus.toLocaleString('en-IN')} (${surplusPercent}% of income) ${surplus > 30000 ? 'gives you a decent buffer' : 'is razor-thin for this kind of shock'}.

1. Build an emergency fund covering 6 months of expenses (₹${(expenses * 6).toLocaleString('en-IN')}) before this scenario materializes.
2. ${surplus > 20000 ? 'Redirect at least ₹15,000/mo into a liquid debt fund as insurance.' : 'Cut discretionary spending immediately to build a minimum ₹50,000 buffer.'}
3. Consider term insurance or income protection coverage to hedge against income loss.

${median > worst * 2 ? 'The gap between your median and worst case is wide — volatility is your enemy here. Stay disciplined.' : 'Your outcomes are tightly clustered, so even the worst case is manageable if you prepare now.'}`;
    } else if (scenarioName.toLowerCase().includes('double') || scenarioName.toLowerCase().includes('wealth') || scenarioName.toLowerCase().includes('aggressive')) {
      // Positive scenario
      insight = `🚀 This "${scenarioName}" scenario reveals the incredible power of compounding discipline. Your median outcome of ₹${median.toLocaleString('en-IN')} is a testament to what consistent investing can achieve over time.

As a "${archetype}", you have the temperament to stick with this strategy. Your current surplus of ₹${surplus.toLocaleString('en-IN')}/mo provides the fuel. The best-case projection of ₹${best.toLocaleString('en-IN')} shows the upside if markets cooperate.

1. Lock in this doubled SIP commitment via auto-debit — willpower fades, automation doesn't.
2. Diversify across large-cap index funds (60%), mid-cap (25%), and international equity (15%) to maximize risk-adjusted returns.
3. Review and rebalance every 6 months to maintain your target allocation as markets shift.

You're building real generational wealth. The hardest part isn't the math — it's the patience. Keep going.`;
    } else {
      // Default / average scenario
      insight = `📊 Running "${scenarioName}" shows a median portfolio value of ₹${median.toLocaleString('en-IN')} — ${median > 5000000 ? 'a solid trajectory' : 'modest growth that could be improved'}. Your worst-case of ₹${worst.toLocaleString('en-IN')} vs best-case of ₹${best.toLocaleString('en-IN')} shows a ${best > worst * 3 ? 'wide spread driven by market volatility' : 'relatively tight range, suggesting low-risk positioning'}.

Your "${archetype}" profile with ₹${surplus.toLocaleString('en-IN')}/mo surplus (${surplusPercent}% savings rate) ${Number(surplusPercent) > 30 ? 'is well above the Indian average — excellent discipline' : 'has room for improvement to build faster wealth'}.

1. ${Number(surplusPercent) > 25 ? 'Consider allocating an additional 10% of surplus to equity SIPs for faster compounding.' : 'Focus on increasing your savings rate to at least 25% before optimizing investments.'}
2. Ensure at least 3 months expenses (₹${(expenses * 3).toLocaleString('en-IN')}) sit in a liquid emergency fund.
3. Tax-harvest any underperforming holdings before March to offset capital gains.

${median > 10000000 ? 'You\'re well on track — focus on protecting this runway rather than chasing higher returns.' : 'Small consistent improvements in savings rate will compound dramatically over the next decade.'}`;
    }

    const words = insight.split(' ');
    for (let i = 0; i < words.length; i++) {
       res.write(words[i] + ' ');
       await new Promise(r => setTimeout(r, 30));
    }
    return;
  }

  const useGemini = !!process.env.GEMINI_API_KEY;
  const apiKey = useGemini ? process.env.GEMINI_API_KEY : process.env.GROQ_API_KEY;
  const baseUrl = useGemini ? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
  const modelId = useGemini ? 'gemini-2.0-flash' : 'llama-3.3-70b-versatile';

  const response = await axios.post(
    baseUrl,
    {
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 512,
      temperature: 0.7,
      stream: true
    },
    {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      responseType: 'stream'
    }
  );

  return new Promise((resolve, reject) => {
    let buffer = '';
    response.data.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content || json.choices?.[0]?.text || '';
          if (content) res.write(content);
        } catch (e) {
          // ignore partial JSON errors
        }
      }
    });
    response.data.on('end', resolve);
    response.data.on('error', reject);
  });
}