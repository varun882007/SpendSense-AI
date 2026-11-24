# SpendSense AI

**Your Money. Your Insights.**

SpendSense AI is an AI-powered personal finance management platform that helps users track income and expenses, manage budgets, monitor savings, understand spending habits, predict future expenses, and receive personalized financial insights.

## Features

### Core Finance
- **Transaction Management** -- Full CRUD for income and expenses with category tagging, search, and filters
- **Budget Tracking** -- Monthly and category-wise budgets with progress bars and overspending alerts
- **Savings Goals** -- Create goals, track progress with visual indicators, and add contributions
- **INR/USD Support** -- Dual currency with real-time conversion and proper formatting

### AI-Powered Intelligence
- **AI Financial Advisor** -- Chat with an AI that analyzes your actual financial data and provides personalized advice
- **Expense Prediction** -- ML-based predictions for next month's expenses using historical data
- **Anomaly Detection** -- Automatic detection of unusual spending patterns and transactions

### Analytics & Insights
- **Interactive Charts** -- Income vs expenses, category breakdowns, monthly trends (powered by Recharts)
- **Spending Reports** -- Category-wise analysis, weekly/monthly comparisons


### User Experience
- **Dark/Light Theme** -- Premium fintech design with smooth theme switching
- **Responsive Design** -- Optimized for desktop, tablet, and mobile
- **Real-time Updates** -- Dashboard reflects actual transaction data, not hardcoded values

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Vite, Tailwind CSS, Recharts, Lucide React |
| Backend | Python, FastAPI, SQLAlchemy, Alembic |
| Database | SQLite (dev) / MySQL (production) |
| AI/ML | Anthropic Claude API, scikit-learn, pandas, NumPy |
| OCR | Tesseract (pytesseract) |
| Auth | JWT, bcrypt |

## Project Structure

```
spendsense-ai/
├── frontend/               # React + Vite frontend
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Route pages
│       ├── layouts/        # Dashboard and auth layouts
│       ├── context/        # Theme, auth, currency providers
│       ├── services/       # API service layer
│       └── utils/          # Utility functions
├── backend/                # FastAPI backend
│   └── app/
│       ├── api/v1/         # REST API endpoints
│       ├── core/           # Config, database, security
│       ├── models/         # SQLAlchemy models
│       ├── schemas/        # Pydantic schemas
│       ├── ai/             # AI advisor logic
│       ├── ml/             # ML prediction and anomaly detection
│       └── services/       # Business logic
├── database/               # Schema and seed scripts
└── docs/                   # Documentation
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Git

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/spendsense-ai.git
cd spendsense-ai
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
```

### 4. Seed Demo Data (Optional)
```bash
cd backend
python ../database/seed.py
# Creates a demo user: demo@spendsense.ai / demo123
```

### 5. Run the Application
In separate terminals:

```bash
# Terminal 1 -- Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 -- Frontend
cd frontend
npm run dev
```

Visit **http://localhost:5173** in your browser.

## Environment Variables

### Backend (.env)
```
DATABASE_URL=sqlite+aiosqlite:///./spendsense.db
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
LLM_API_KEY=                    # Anthropic API key (optional, enables AI advisor)
EXCHANGE_RATE_API_KEY=          # ExchangeRate API key (optional, enables live rates)
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/transactions` | List transactions |
| POST | `/api/v1/transactions` | Create transaction |
| GET | `/api/v1/budgets` | List budgets |
| GET | `/api/v1/analytics/summary` | Financial summary |
| GET | `/api/v1/analytics/trends` | Monthly trends |
| POST | `/api/v1/assistant/chat` | AI advisor chat |
| GET | `/api/v1/analytics/predictions` | Expense predictions |
| GET | `/api/v1/analytics/anomalies` | Anomaly detection |
| GET | `/api/v1/financial-health/score` | Health score |

## Color Palette

### Dark Mode (Default)
| Element | Color |
|---------|-------|
| Background | `#101525` |
| Cards | `#1B2438` |
| Primary | `#8067F5` |
| Success | `#29C995` |
| Warning | `#F4B860` |
| Expense | `#EF6680` |

### Light Mode
| Element | Color |
|---------|-------|
| Background | `#F6F7FB` |
| Cards | `#FFFFFF` |
| Primary | `#8067F5` |
| Text | `#20243A` |

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
