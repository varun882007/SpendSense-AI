from datetime import datetime, timezone
from sqlalchemy import select, func, extract
from sqlalchemy.ext.asyncio import AsyncSession
import numpy as np

from app.models.transactions import Transaction
from app.models.budgets import Budget
from app.models.savings_goals import SavingsGoal


async def calculate_health_score(user_id: int, db: AsyncSession) -> dict:
    now = datetime.now(timezone.utc)

    # Get current month data
    result = await db.execute(
        select(
            Transaction.transaction_type,
            func.sum(Transaction.original_amount).label("total"),
        )
        .where(Transaction.user_id == user_id)
        .where(extract("month", Transaction.transaction_date) == now.month)
        .where(extract("year", Transaction.transaction_date) == now.year)
        .group_by(Transaction.transaction_type)
    )
    totals = {row.transaction_type: float(row.total) for row in result.all()}
    income = totals.get("income", 0)
    expenses = totals.get("expense", 0)

    scores = {}

    # 1. Savings ratio (0-25 points)
    if income > 0:
        savings_ratio = (income - expenses) / income
        savings_score = min(25, max(0, savings_ratio * 125))  # 20% savings = 25 points
    else:
        savings_score = 0
        savings_ratio = 0
    scores["savings_ratio"] = {
        "score": round(savings_score, 1),
        "value": f"{savings_ratio * 100:.1f}%",
        "max": 25,
        "description": "Percentage of income saved",
    }

    # 2. Budget adherence (0-25 points)
    result = await db.execute(
        select(Budget)
        .where(Budget.user_id == user_id)
        .where(Budget.month == now.month)
        .where(Budget.year == now.year)
    )
    budgets = result.scalars().all()

    if budgets:
        within_budget = 0
        for b in budgets:
            # Calculate spent for this budget's category
            q = select(func.sum(Transaction.original_amount)).where(
                Transaction.user_id == user_id,
                Transaction.transaction_type == "expense",
                extract("month", Transaction.transaction_date) == now.month,
                extract("year", Transaction.transaction_date) == now.year,
            )
            if b.category_id:
                q = q.where(Transaction.category_id == b.category_id)
            spent_result = await db.execute(q)
            spent = float(spent_result.scalar() or 0)
            if spent <= float(b.amount):
                within_budget += 1
        budget_score = (within_budget / len(budgets)) * 25
    else:
        budget_score = 10  # Partial credit for no budgets set
    scores["budget_adherence"] = {
        "score": round(budget_score, 1),
        "value": f"{len(budgets)} budgets",
        "max": 25,
        "description": "How well you stay within budgets",
    }

    # 3. Spending consistency (0-25 points) - low variance is good
    result = await db.execute(
        select(
            extract("month", Transaction.transaction_date).label("month"),
            func.sum(Transaction.original_amount).label("total"),
        )
        .where(Transaction.user_id == user_id)
        .where(Transaction.transaction_type == "expense")
        .group_by(extract("month", Transaction.transaction_date))
    )
    monthly_expenses = [float(row.total) for row in result.all()]

    if len(monthly_expenses) >= 2:
        mean_val = float(np.mean(monthly_expenses))
        cv = float(np.std(monthly_expenses) / mean_val) if mean_val > 0 else 1
        consistency_score = max(0, 25 * (1 - cv))
    else:
        consistency_score = 12.5
    scores["spending_consistency"] = {
        "score": round(consistency_score, 1),
        "value": f"{len(monthly_expenses)} months tracked",
        "max": 25,
        "description": "Month-to-month spending stability",
    }

    # 4. Emergency fund / savings goals (0-25 points)
    result = await db.execute(
        select(SavingsGoal).where(SavingsGoal.user_id == user_id)
    )
    goals = result.scalars().all()

    if goals:
        total_target = sum(float(g.target_amount) for g in goals)
        total_saved = sum(float(g.current_amount) for g in goals)
        goal_progress = (total_saved / total_target) if total_target > 0 else 0
        emergency_score = min(25, goal_progress * 25)
    else:
        emergency_score = 0
    scores["emergency_fund"] = {
        "score": round(emergency_score, 1),
        "value": f"{len(goals)} goals",
        "max": 25,
        "description": "Progress toward savings goals",
    }

    total_score = round(sum(s["score"] for s in scores.values()))

    if total_score >= 80:
        grade = "Excellent"
        advice = "You're doing great! Keep maintaining your healthy financial habits."
    elif total_score >= 60:
        grade = "Good"
        advice = (
            "You're on the right track. Focus on areas with lower scores to improve."
        )
    elif total_score >= 40:
        grade = "Fair"
        advice = (
            "There's room for improvement. Start by setting budgets and "
            "tracking all expenses."
        )
    else:
        grade = "Needs Improvement"
        advice = (
            "Consider creating a budget, reducing unnecessary expenses, "
            "and setting savings goals."
        )

    return {
        "score": total_score,
        "grade": grade,
        "advice": advice,
        "breakdown": scores,
    }
