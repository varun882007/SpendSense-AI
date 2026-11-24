from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func, extract
from sqlalchemy.ext.asyncio import AsyncSession
import numpy as np

from app.models.transactions import Transaction
from app.models.categories import Category


async def predict_expenses(user_id: int, db: AsyncSession) -> dict:
    """Predict next month's expenses based on historical data."""
    now = datetime.now(timezone.utc)

    # Get last 6 months of expense data
    six_months_ago = (now - timedelta(days=180)).date()

    result = await db.execute(
        select(
            extract("year", Transaction.transaction_date).label("year"),
            extract("month", Transaction.transaction_date).label("month"),
            func.sum(Transaction.original_amount).label("total"),
        )
        .where(Transaction.user_id == user_id)
        .where(Transaction.transaction_type == "expense")
        .where(Transaction.transaction_date >= six_months_ago)
        .group_by(
            extract("year", Transaction.transaction_date),
            extract("month", Transaction.transaction_date),
        )
        .order_by(
            extract("year", Transaction.transaction_date),
            extract("month", Transaction.transaction_date),
        )
    )
    monthly_data = result.all()

    if len(monthly_data) < 2:
        return {
            "predicted_total": None,
            "confidence": "low",
            "message": "Need at least 2 months of data for predictions.",
            "monthly_history": [],
            "category_predictions": [],
        }

    amounts = [float(row.total) for row in monthly_data]
    months_list = [
        {"year": int(row.year), "month": int(row.month), "total": float(row.total)}
        for row in monthly_data
    ]

    # Simple prediction: weighted moving average (more recent months weighted higher)
    weights = list(range(1, len(amounts) + 1))
    predicted = sum(a * w for a, w in zip(amounts, weights)) / sum(weights)

    # Category predictions
    result = await db.execute(
        select(
            Category.name,
            func.avg(Transaction.original_amount).label("avg_amount"),
            func.count(Transaction.id).label("count"),
        )
        .join(Category, Transaction.category_id == Category.id)
        .where(Transaction.user_id == user_id)
        .where(Transaction.transaction_type == "expense")
        .where(Transaction.transaction_date >= six_months_ago)
        .group_by(Category.name)
        .order_by(func.sum(Transaction.original_amount).desc())
    )
    category_data = result.all()

    category_predictions = [
        {
            "category": row.name,
            "predicted_amount": round(
                float(row.avg_amount) * (float(row.count) / len(monthly_data)), 2
            ),
        }
        for row in category_data
    ]

    # Determine confidence
    if len(amounts) >= 4:
        std_dev = float(np.std(amounts))
        mean = float(np.mean(amounts))
        cv = std_dev / mean if mean > 0 else 1
        confidence = "high" if cv < 0.2 else "medium" if cv < 0.4 else "low"
    else:
        confidence = "low"

    return {
        "predicted_total": round(predicted, 2),
        "confidence": confidence,
        "message": (
            f"Based on {len(amounts)} months of data, your predicted expenses "
            f"next month are approximately {predicted:.2f}."
        ),
        "monthly_history": months_list,
        "category_predictions": category_predictions,
    }
