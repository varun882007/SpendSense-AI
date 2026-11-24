from collections import defaultdict
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func, extract
from sqlalchemy.ext.asyncio import AsyncSession
import numpy as np

from app.models.transactions import Transaction
from app.models.categories import Category


async def detect_anomalies(user_id: int, db: AsyncSession) -> dict:
    """Detect unusual spending patterns."""
    now = datetime.now(timezone.utc)
    three_months_ago = (now - timedelta(days=90)).date()

    # Get recent expense transactions
    result = await db.execute(
        select(Transaction, Category.name.label("category_name"))
        .outerjoin(Category, Transaction.category_id == Category.id)
        .where(Transaction.user_id == user_id)
        .where(Transaction.transaction_type == "expense")
        .where(Transaction.transaction_date >= three_months_ago)
        .order_by(Transaction.transaction_date.desc())
    )
    rows = result.all()

    if len(rows) < 5:
        return {
            "anomalies": [],
            "category_anomalies": [],
            "message": "Need more transaction data to detect unusual patterns.",
        }

    transactions = [(row[0], row[1]) for row in rows]
    amounts = [float(t.original_amount) for t, _ in transactions]

    mean_amount = float(np.mean(amounts))
    std_amount = float(np.std(amounts))
    threshold = mean_amount + 2 * std_amount  # Transactions > 2 std deviations

    anomalies = []
    for txn, cat_name in transactions:
        amount = float(txn.original_amount)
        if amount > threshold and std_amount > 0:
            z_score = (amount - mean_amount) / std_amount
            anomalies.append(
                {
                    "transaction_id": txn.id,
                    "description": txn.description,
                    "amount": amount,
                    "category": cat_name or "Other",
                    "date": txn.transaction_date.isoformat(),
                    "z_score": round(z_score, 2),
                    "reason": (
                        f"This {cat_name or 'Other'} expense of {amount:.2f} is "
                        f"significantly higher than your average expense of "
                        f"{mean_amount:.2f}."
                    ),
                }
            )

    # Category-level anomalies: check if any category's monthly spend is unusually high
    category_anomalies = []
    result = await db.execute(
        select(
            Category.name,
            extract("month", Transaction.transaction_date).label("month"),
            func.sum(Transaction.original_amount).label("total"),
        )
        .join(Category, Transaction.category_id == Category.id)
        .where(Transaction.user_id == user_id)
        .where(Transaction.transaction_type == "expense")
        .where(Transaction.transaction_date >= three_months_ago)
        .group_by(Category.name, extract("month", Transaction.transaction_date))
    )
    cat_monthly = result.all()

    # Group by category
    cat_totals: dict[str, list[float]] = defaultdict(list)
    for row in cat_monthly:
        cat_totals[row.name].append(float(row.total))

    for cat_name, totals in cat_totals.items():
        if len(totals) >= 2:
            cat_mean = float(np.mean(totals[:-1])) if len(totals) > 1 else totals[0]
            latest = totals[-1]
            if cat_mean > 0 and latest > cat_mean * 1.5:
                category_anomalies.append(
                    {
                        "category": cat_name,
                        "current_month_total": latest,
                        "average_monthly": round(cat_mean, 2),
                        "increase_percentage": round(
                            (latest - cat_mean) / cat_mean * 100, 1
                        ),
                        "reason": (
                            f"{cat_name} spending ({latest:.2f}) is "
                            f"{((latest - cat_mean) / cat_mean * 100):.0f}% higher "
                            f"than your average ({cat_mean:.2f})."
                        ),
                    }
                )

    if anomalies or category_anomalies:
        message = (
            f"Found {len(anomalies)} unusual transactions and "
            f"{len(category_anomalies)} category-level anomalies."
        )
    else:
        message = "No unusual spending patterns detected."

    return {
        "anomalies": anomalies[:10],
        "category_anomalies": category_anomalies,
        "message": message,
    }
