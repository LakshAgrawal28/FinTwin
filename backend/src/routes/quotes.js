import { Router } from 'express';
import axios from 'axios';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const symbolsParam = req.query.symbols;
    if (!symbolsParam) {
      return res.json({});
    }

    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
    
    // Auto-append .NS to common Indian stocks if no suffix provided (simple heuristic)
    // To properly support MFs, assuming user sends suffix if needed, but adding .NS for plain inputs just in case
    const formattedSymbols = symbols.map(sym => {
        if (!sym.includes('.') && !sym.includes('^')) {
            return sym + '.NS';
        }
        return sym;
    });

    const response = await axios.get(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${formattedSymbols.join(',')}`);
    const results = {};
    
    if (response.data && response.data.quoteResponse && response.data.quoteResponse.result) {
        response.data.quoteResponse.result.forEach((quote, index) => {
            const originalSymbol = symbols[index]; // Map back to what user requested
            results[originalSymbol] = {
                price: quote.regularMarketPrice,
                name: quote.longName || quote.shortName || originalSymbol,
                change: quote.regularMarketChange,
                changePercent: quote.regularMarketChangePercent,
                currency: quote.currency
            };
        });
    }

    res.json(results);
  } catch (error) {
    console.error('Quotes fetch error:', error.message);
    // Return empty results on error so frontend can fallback gently
    res.json({});
  }
});

export default router;
