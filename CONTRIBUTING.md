# Contributing to SpendSense AI

Thank you for considering contributing to SpendSense AI! This document provides guidelines and information for contributors.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your feature or bug fix
4. Make your changes
5. Submit a pull request

## Development Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- Git

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Seed Demo Data
```bash
cd backend
python ../database/seed.py
```

## Code Style

### Python (Backend)
- Follow PEP 8
- Use type hints
- Use async/await for database operations
- Use Decimal for monetary values, never float

### JavaScript (Frontend)
- Use functional components with hooks
- Use Tailwind CSS for styling
- Use CSS variables for theme colors
- Handle loading, error, and empty states

## Pull Request Guidelines

- Describe what your PR does and why
- Reference any related issues
- Ensure the app builds and runs without errors
- Test both dark and light themes
- Test responsive layouts

## Security

- Never commit API keys, passwords, or .env files
- Use environment variables for all secrets
- Validate user input on the backend
- Ensure all data endpoints filter by authenticated user

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
