from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.categories import Category
from app.models.transactions import Transaction
from app.models.users import User

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary")
async def get_summary(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get financial summary: total_income, total_expenses, balance, savings_rate for a month."""
    now = datetime.now(timezone.utc)
    if month is None:
        month = now.month
    if year is None:
        year = now.year

    base_filter = [
        Transaction.user_id == current_user.id,
        extract("month", Transaction.transaction_date) == month,
        extract("year", Transaction.transaction_date) == year,
    ]

    # Total income
    income_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.original_amount), 0)).where(
            *base_filter,
            Transaction.transaction_type == "income",
        )
    )
    total_income = Decimal(str(income_result.scalar()))

    # Total expenses
    expense_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.original_amount), 0)).where(
            *base_filter,
            Transaction.transaction_type == "expense",
        )
    )
    total_expenses = Decimal(str(expense_result.scalar()))

    balance = total_income - total_expenses
    savings_rate = (
        round(float((total_income - total_expenses) / total_income) * 100, 2)
        if total_income > 0
        else 0.0
    )

    from app.models.savings_goals import SavingsGoal

    savings_result = await db.execute(
        select(func.coalesce(func.sum(SavingsGoal.current_amount), 0)).where(
            SavingsGoal.user_id == current_user.id
        )
    )
    total_savings = Decimal(str(savings_result.scalar()))

    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": balance,
        "savings_rate": savings_rate,
        "total_savings": total_savings,
        "month": month,
        "year": year,
    }


@router.get("/categories")
async def get_category_breakdown(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get category-wise expense breakdown for a given month/year."""
    now = datetime.now(timezone.utc)
    if month is None:
        month = now.month
    if year is None:
        year = now.year

    query = (
        select(
            Category.id,
            Category.name,
            Category.icon,
            func.coalesce(func.sum(Transaction.original_amount), 0).label("total"),
        )
        .join(Transaction, Transaction.category_id == Category.id)
        .where(
            Transaction.user_id == current_user.id,
            Transaction.transaction_type == "expense",
            extract("month", Transaction.transaction_date) == month,
            extract("year", Transaction.transaction_date) == year,
        )
        .group_by(Category.id, Category.name, Category.icon)
        .order_by(func.sum(Transaction.original_amount).desc())
    )
    result = await db.execute(query)
    rows = result.all()

    total_expenses = sum(row.total for row in rows)

    categories = []
    for row in rows:
        percentage = (
            round(float(Decimal(str(row.total)) / Decimal(str(total_expenses))) * 100, 2)
            if total_expenses > 0
            else 0.0
        )
        categories.append(
            {
                "category_id": row.id,
                "category_name": row.name,
                "icon": row.icon,
                "total": Decimal(str(row.total)),
                "percentage": percentage,
            }
        )

    return {
        "month": month,
        "year": year,
        "total_expenses": Decimal(str(total_expenses)),
        "categories": categories,
    }


@router.get("/trends")
async def get_trends(
    months: int = Query(6, ge=1, le=12, description="Number of months to look back"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get monthly income/expense totals for the last N months."""
    now = datetime.now(timezone.utc)
    trends = []

    for i in range(months - 1, -1, -1):
        # Calculate the target month/year going backwards
        target_month = now.month - i
        target_year = now.year
        while target_month <= 0:
            target_month += 12
            target_year -= 1

        base_filter = [
            Transaction.user_id == current_user.id,
            extract("month", Transaction.transaction_date) == target_month,
            extract("year", Transaction.transaction_date) == target_year,
        ]

        income_result = await db.execute(
            select(func.coalesce(func.sum(Transaction.original_amount), 0)).where(
                *base_filter,
                Transaction.transaction_type == "income",
            )
        )
        total_income = Decimal(str(income_result.scalar()))

        expense_result = await db.execute(
            select(func.coalesce(func.sum(Transaction.original_amount), 0)).where(
                *base_filter,
                Transaction.transaction_type == "expense",
            )
        )
        total_expenses = Decimal(str(expense_result.scalar()))

        trends.append(
            {
                "month": target_month,
                "year": target_year,
                "income": total_income,
                "expenses": total_expenses,
            }
        )

    return {"trends": trends}


@router.get("/predictions")
async def get_predictions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get AI-powered spending predictions."""
    from app.ml.prediction import predict_expenses

    return await predict_expenses(current_user.id, db)


@router.get("/anomalies")
async def get_anomalies(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Detect anomalous spending patterns."""
    from app.ml.anomaly import detect_anomalies

    return await detect_anomalies(current_user.id, db)
