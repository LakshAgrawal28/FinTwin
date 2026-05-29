# ⚡ FinTwin — Financial Digital Twin

FinTwin is a state-of-the-art, responsive financial projection, planning, and simulation engine. It enables users to model their financial trajectory, analyze cash flow dynamics, map their risk archetype, simulate life scenarios (e.g., job loss, real-estate purchases, early retirement), and explore automatic portfolio rebalancing and tax optimization.

FinTwin is engineered to run in a hybrid model—utilizing **Groq/Gemini AI APIs** for live contextual recommendations, and dynamically falling back to **fast, client-side math and rule engines** when offline or when rate limits are reached, guaranteeing a zero-fail user experience.

---

## ✨ Features

- **📊 Personality Profiler**: Instantly classifies users into archetypes (*Debt Warrior*, *Impulsive Spender*, *Conservative Saver*, *Aggressive Grower*, *Disciplined Builder*, *Balanced Achiever*) using deterministic cash flow and savings algorithms.
- **📈 Stochastic Monte Carlo Simulator**: Projects 10,000 randomized market paths (downside P10 to upside P90) based on asset class volatility weights, showcasing future net worth curves.
- **🏡 Structured Milestone Goals**: Mathematical planners for Buying a House (with automated EMI warnings), Early Retirement (FIRE 30x rule), and Child Education (8% inflation-adjusted cost curve).
- **🛡️ Smart Rebalancing**: Instantly compares current allocations with targets adjusted for age and risk tolerance. Generates step-by-step transaction check-off logs.
- **💸 Tax Optimizer**: Exposes deductions and harvesting opportunities (Section 80C, 80D, NPS, and LTCG gains booking) based on tax slabs.
- **📴 Zero-Fail Offline Sandbox**: Real-time browser-side fallbacks for profiling, tax guidelines, rebalance math, and scenario insights if connection to the backend fails.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), TailwindCSS, Recharts (financial models and radar charts), Zustand (state management).
- **Backend**: Node.js, Express, Axios, Yahoo Finance API proxy.
- **AI Integrations**: Groq (Llama-3) & Google Gemini (Gemini Flash).

---

## ⚙️ Installation & Local Setup

### 1. Install Dependencies
From the repository root:
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment
Create a `.env` file inside the `backend/` directory:
```env
PORT=3001
CORS_ORIGINS=http://localhost:5173
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
MOCK_AI=false
```

### 3. Run the App
Concurrently start both the Vite dev server and nodemon Express backend from the root directory:
```bash
npm run dev
```
- **Backend URL**: `http://localhost:3001`
- **Frontend URL**: `http://localhost:5173`

---

## ☁️ Cloudflare Deployment Guide

FinTwin can be deployed globally on Cloudflare's serverless infrastructure (Cloudflare Pages for the frontend and Cloudflare Workers for the backend Express API).

### 1. Deploy Frontend on Cloudflare Pages
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Build Output Directory**: `dist`
- **Root Directory**: `frontend`
- **Environment Variables**:
  - `VITE_API_URL`: The URL of your deployed backend Worker (e.g. `https://fintwin-api.yourusername.workers.dev`).

### 2. Deploy Backend on Cloudflare Workers
Because the backend is a lightweight Node.js Express application, it can be compiled to run on Cloudflare Workers. We configure a `wrangler.toml` in the `backend/` folder:
```toml
name = "fintwin-api"
main = "src/server.js"
compatibility_date = "2026-05-30"

[vars]
CORS_ORIGINS = "https://your-cloudflare-pages-url.pages.dev"
MOCK_AI = "false"
# Add GROQ_API_KEY and GEMINI_API_KEY as secret variables via CLI:
# wrangler secret put GROQ_API_KEY
# wrangler secret put GEMINI_API_KEY
```

---

## 📁 Project Structure

```text
FinTwin/
├── backend/
│   ├── src/
│   │   ├── middleware/ # CORS & Error handling
│   │   ├── routes/     # Express route handlers (rebalance, tax, healthScore, simulate...)
│   │   ├── services/   # AI APIs calling services (ClaudeService)
│   │   └── server.js   # Server listener entry
│   └── wrangler.toml   # Wrangler configuration for Cloudflare Workers
├── frontend/
│   └── src/
│       ├── components/ # Layout and page panels
│       ├── pages/      # Views (Dashboard, Rebalance, Simulator, Tax)
│       └── main.jsx    # Vite App entry
└── LICENSE             # MIT License
```

---

## 🛡️ License

This project is licensed under the terms of the [MIT License](file:///c:/Users/LAKSH%20AGRAWAL/Desktop/VSCode/Main%20Projects/FinTwin/LICENSE).
