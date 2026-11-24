from fastapi import APIRouter

from app.api.v1.endpoints import (
    analytics,
    assistant,
    auth,
    budgets,
    categories,
    currency,
    financial_health,
    financial_profile,
    notifications,
    receipts,
    savings,
    transactions,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(transactions.router)
api_router.include_router(budgets.router)
api_router.include_router(analytics.router)
api_router.include_router(savings.router)
api_router.include_router(categories.router)
api_router.include_router(assistant.router)
api_router.include_router(receipts.router)
api_router.include_router(notifications.router)
api_router.include_router(financial_health.router)
api_router.include_router(financial_profile.router)
api_router.include_router(currency.router)
