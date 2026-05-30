import axios from 'axios';

// Fallback to Render URL or specific production URL if env is missing in prod
export const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/+$/, '');
  
  // If in production without env var, fallback to a relative path or standard prod URL
  if (import.meta.env.PROD) {
    // If the frontend and backend are hosted on the same domain, use origin
    // Otherwise fallback to the known Render URL (if applicable)
    return 'https://fintwin-backend.onrender.com'; // Adjust this if you have a specific backend URL
  }
  return 'http://localhost:3001';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000, // 30 second timeout for AI operations
  headers: {
    'Content-Type': 'application/json',
  }
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error:', error.response || error.message);
    if (!error.response) {
      // Network error (CORS or backend down)
      console.error('Network Error - Backend might be unreachable.');
    }
    return Promise.reject(error);
  }
);

export const postProfile = async (formData) => {
  const response = await api.post('/api/profile', formData);
  return response.data;
};

export const getQuotes = async (symbols) => {
  const response = await api.get(`/api/quotes?symbols=${symbols}`);
  return response.data;
};

// Legacy: string scenarioKey for predefined scenarios
export const postSimulate = async (userProfile, scenario, portfolio, years = 15, iterations = 1000, simMode = 'balanced') => {
  const response = await api.post('/api/simulate', {
    userProfile,
    scenario,      // B1 fix: send only 'scenario'
    portfolio,     // Pass the actual holdings
    profile: userProfile, // Pass userProfile as profile as well for proper parsing
    years,
    iterations,
    simMode
  });
  return response.data;
};

// New: full scenario object from AI parser
export const postSimulateScenario = async (scenario, userProfile, portfolio, profile, simMode = 'balanced') => {
  const response = await api.post('/api/simulate', {
    scenario,
    userProfile,
    portfolio,
    profile,
    simMode
  });
  return response.data;
};

export const postScenarioParse = async (userInput, portfolio, profile, simMode = 'balanced') => {
  const response = await api.post('/api/scenario-parse', { userInput, portfolio, profile, simMode });
  return response.data;
};

export const postHealthScore = async (profile, portfolio) => {
  const response = await api.post('/api/health-score', { profile, portfolio });
  return response.data;
};

export const postGoalsProject = async (goals, profile, portfolio) => {
  const response = await api.post('/api/goals/project', { goals, profile, portfolio });
  return response.data;
};

export const postTaxOptimize = async (portfolio, profile) => {
  const response = await api.post('/api/tax-optimize', { portfolio, profile });
  return response.data;
};

export const postReportGenerate = async (profile, portfolio, simulationResult, healthScore) => {
  const response = await api.post('/api/report/generate', { profile, portfolio, simulationResult, healthScore });
  return response.data;
};

export const postPortfolio = async (profile) => {
  const response = await api.post('/api/portfolio', { profile });
  return response.data;
};

export const postRebalance = async (portfolio, customTargets, profile) => {
  const response = await api.post('/api/rebalance', { portfolio, customTargets, profile });
  return response.data;
};

export const postProject = async (currentPortfolio, rebalancedPortfolio, userProfile) => {
  const response = await api.post('/api/project', { currentPortfolio, rebalancedPortfolio, userProfile });
  return response.data;
};

export default api;
