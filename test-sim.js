const http = require('http');

const payload = JSON.stringify({
  userProfile: {
    age: 28,
    monthlyIncome: 250000,
    monthlyInvestment: 100000,
    portfolioValue: 1500000
  },
  scenario: {
    type: 'house',
    purchasePrice: 8000000,
    purchaseYear: 3,
    downPaymentPct: 20,
    interestRate: 8.5,
    tenureYears: 15
  },
  portfolio: [
    { currentValue: 1500000 }
  ],
  years: 15
});

const req = http.request('http://localhost:3001/api/simulate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const result = JSON.parse(data);
    console.log("Success Rate:", result.successRate);
    console.log("Final Median:", result.median);
    console.log("P10 final:", result.worstCase);
    console.log("P90 final:", result.bestCase);
    console.log("Yearly Percentiles:", result.yearlyPercentiles.map(y => y.p50));
  });
});

req.on('error', console.error);
req.write(payload);
req.end();
