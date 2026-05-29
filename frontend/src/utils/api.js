import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/+$/, ''),
});

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

export const postRebalance = async (portfolio) => {
  const response = await api.post('/api/rebalance', { portfolio });
  return response.data;
};

export const postProject = async (currentPortfolio, rebalancedPortfolio, userProfile) => {
  const response = await api.post('/api/project', { currentPortfolio, rebalancedPortfolio, userProfile });
  return response.data;
};

export default api;
