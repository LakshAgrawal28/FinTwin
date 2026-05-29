# FinTwin

FinTwin is a modern, AI-powered financial projection and visualization tool. It helps users model their financial future, analyze risk profiles, simulate scenarios (e.g., job loss, promotions, vehicle purchases), and explore smart rebalancing and tax-optimization strategies.

---

## 🚀 Features

- **Financial Twin Personality Analyzer**: Analyzes income, expenses, and asset allocations to categorize users into financial archetypes (e.g., *Balanced Achiever*, *Aggressive Grower*).
- **Interactive Scenarios**: Simulates life events (job loss, inflation jumps, salary hikes) to display best/worst case Monte Carlo style compounding curves.
- **Smart Portfolio Rebalancing**: Recommends action-oriented buy/sell moves to align with a target asset allocation.
- **Tax Optimization & Reports**: Generates comprehensive PDFs or downloadable breakdowns of tax savings and annual summaries.
- **Live/Mock Dual Mode AI**: Uses Groq/Gemini APIs for real-time generative insights, falling back gracefully to rich static simulations in mock mode.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), CSS (Vanilla for premium design layout), Lucide Icons, Recharts (for rich financial curves and radar charts).
- **Backend**: Node.js, Express, Axios (for LLM proxying), Dotenv.

---

## ⚙️ Configuration & Installation

### 1. Clone the repository and install dependencies
From the project root:
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Environment Variables Setup
Create a `.env` file in the `backend/` directory:
```env
PORT=3001
CORS_ORIGINS=http://localhost:5173
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
```

---

## 🚦 Running the Application

You can run both backend and frontend concurrently using the convenience script in the root directory:

```bash
# In the root directory
npm run dev
```

Alternatively, run them separately:

- **Backend**: `npm run dev:backend` (starts Express server on `http://localhost:3001` with nodemon)
- **Frontend**: `npm run dev:frontend` (starts Vite dev server on `http://localhost:5173`)

---

## 📁 Repository Structure

```text
FinTwin/
├── backend/
│   ├── api/            # Serverless deployment configurations (e.g. Vercel)
│   ├── src/
│   │   ├── middleware/ # CORS & Error Handlers
│   │   ├── routes/     # Express Route Definitions (simulate, tax, goals, rebalance...)
│   │   ├── services/   # AI Orchestration (Groq/Gemini integrations)
│   │   └── server.js   # Express entrypoint
│   └── .env            # Private keys and PORT configurations
├── frontend/
│   ├── public/         # Static assets
│   └── src/
│       ├── components/ # Reusable UI components
│       ├── pages/      # Views (Dashboard, Rebalancer, Simulations)
│       └── main.jsx    # Client entrypoint
└── package.json        # Concurrent workspace scripts
```

---

## 🛡️ License

This project is private and proprietary.
