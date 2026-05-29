import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialState = {
  userProfile: null,
  twinState: null,
  simulationResult: null,
  portfolio: [],
  rebalanceActions: [],
  projectionResult: null,
  healthScore: null,
  goalsResult: null,
  isLoading: false,
  error: null,
};

export const useTwinStore = create(
  persist(
    (set) => ({
      userProfile: null,
      twinState: null,
      simulationResult: null,
      portfolio: [],
      rebalanceActions: [],
      projectionResult: null,
      healthScore: null,
      goalsResult: null,
      isLoading: false,
      error: null,

      setUserProfile: (profile) => set({ userProfile: profile }),
      updateProfile: (partial) => set((state) => ({
        userProfile: { ...state.userProfile, ...partial }
      })),
      setTwinState: (state) => set({ twinState: state }),
      setSimulationResult: (result) => set({ simulationResult: result }),
      setPortfolio: (holdings) => set({ portfolio: holdings }),
      setRebalanceActions: (actions) => set({ rebalanceActions: actions }),
      setProjectionResult: (result) => set({ projectionResult: result }),
      setHealthScore: (score) => set({ healthScore: score }),
      setGoalsResult: (result) => set({ goalsResult: result }),
      setLoading: (bool) => set({ isLoading: bool }),
      setError: (msg) => set({ error: msg }),
      resetAll: () => set(initialState),
    }),
    {
      name: 'fintwin-store', // name of the item in the storage (must be unique)
    }
  )
);

