import httpx
from sqlalchemy import select, func, extract
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone, timedelta
from decimal import Decimal

from app.core.config import settings
from app.models.transactions import Transaction
from app.models.budgets import Budget
from app.models.categories import Category


async def get_financial_context(user_id: int, db: AsyncSession) -> dict:
    """Gather user's financial data for AI context."""
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Current month transactions
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == user_id)
        .where(Transaction.transaction_date >= month_start.date())
        .order_by(Transaction.transaction_date.desc())
    )
    transactions = result.scalars().all()

    total_income = sum(
        t.original_amount for t in transactions if t.transaction_type == "income"
    )
    total_expenses = sum(
        t.original_amount for t in transactions if t.transaction_type == "expense"
    )

    # Category breakdown
    expense_txns = [t for t in transactions if t.transaction_type == "expense"]
    category_spending: dict[str, Decimal] = {}
    for t in expense_txns:
        cat_result = await db.execute(
            select(Category).where(Category.id == t.category_id)
        )
        cat = cat_result.scalar_one_or_none()
        cat_name = cat.name if cat else "Other"
        category_spending[cat_name] = (
            category_spending.get(cat_name, Decimal("0")) + t.original_amount
        )

    # Budgets
    result = await db.execute(
        select(Budget)
        .where(Budget.user_id == user_id)
        .where(Budget.month == now.month)
        .where(Budget.year == now.year)
    )
    budgets = result.scalars().all()

    return {
        "month": now.strftime("%B %Y"),
        "total_income": float(total_income),
        "total_expenses": float(total_expenses),
        "balance": float(total_income - total_expenses),
        "category_spending": {
            k: float(v)
            for k, v in sorted(
                category_spending.items(), key=lambda x: x[1], reverse=True
            )
        },
        "budget_count": len(budgets),
        "transaction_count": len(transactions),
    }


async def chat_with_advisor(user_id: int, message: str, db: AsyncSession) -> str:
    """Process a chat message and return AI response."""
    context = await get_financial_context(user_id, db)

    if settings.LLM_API_KEY:
        return await _llm_response(context, message)
    return _rule_based_response(context, message)


async def _llm_response(context: dict, message: str) -> str:
    system_prompt = f"""You are a helpful financial advisor for SpendSense AI. Analyze the user's financial data and provide personalized advice.

Current financial context for {context['month']}:
- Total Income: {context['total_income']}
- Total Expenses: {context['total_expenses']}
- Balance: {context['balance']}
- Spending by category: {context['category_spending']}
- Number of transactions: {context['transaction_count']}

Rules:
- Be concise and actionable
- Reference actual numbers from their data
- Never invent data not provided
- If data is insufficient, say so
- Suggest specific, realistic savings strategies"""

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.LLM_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 500,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": message}],
                },
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            return data["content"][0]["text"]
        except Exception:
            return _rule_based_response(context, message)


def _rule_based_response(context: dict, message: str) -> str:
    """Generate response from rules when no LLM available."""
    msg_lower = message.lower()

    if context["transaction_count"] == 0:
        return (
            "I don't have enough transaction data to analyze yet. "
            "Start adding your income and expenses, and I'll be able to "
            "provide personalized insights!"
        )

    # Build parts of the response
    parts: list[str] = []

    if any(w in msg_lower for w in ["spend", "spent", "expense", "most"]):
        if context["category_spending"]:
            top_cat = list(context["category_spending"].items())
            parts.append(
                f"This month, your total expenses are {context['total_expenses']:.2f}."
            )
            if top_cat:
                parts.append(
                    f"Your highest spending category is {top_cat[0][0]} "
                    f"at {top_cat[0][1]:.2f}."
                )
                if len(top_cat) > 1:
                    parts.append(
                        f"Followed by {top_cat[1][0]} at {top_cat[1][1]:.2f}."
                    )

    elif any(w in msg_lower for w in ["save", "saving", "savings"]):
        savings = context["balance"]
        rate = (
            (savings / context["total_income"] * 100)
            if context["total_income"] > 0
            else 0
        )
        parts.append(
            f"Your current savings this month: {savings:.2f} "
            f"({rate:.1f}% savings rate)."
        )
        if rate < 20:
            parts.append(
                "Financial experts recommend saving at least 20% of income."
            )
            if context["category_spending"]:
                top = list(context["category_spending"].items())[0]
                parts.append(
                    f"Consider reducing {top[0]} spending "
                    f"(currently {top[1]:.2f}) to boost your savings."
                )
        else:
            parts.append("Great job! You're maintaining a healthy savings rate.")

    elif any(w in msg_lower for w in ["budget", "exceed", "over"]):
        parts.append(
            f"You have {context['budget_count']} active budgets this month."
        )
        parts.append(
            f"Total expenses: {context['total_expenses']:.2f} "
            f"against income of {context['total_income']:.2f}."
        )

    elif any(w in msg_lower for w in ["summary", "overview", "how am i"]):
        parts.append(f"Here's your {context['month']} summary:")
        parts.append(
            f"Income: {context['total_income']:.2f} | "
            f"Expenses: {context['total_expenses']:.2f} | "
            f"Balance: {context['balance']:.2f}"
        )
        if context["category_spending"]:
            top3 = list(context["category_spending"].items())[:3]
            cats = ", ".join(f"{n} ({v:.2f})" for n, v in top3)
            parts.append(f"Top spending categories: {cats}")

    elif any(w in msg_lower for w in ["compare", "last month", "previous"]):
        parts.append(
            f"This month so far: Income {context['total_income']:.2f}, "
            f"Expenses {context['total_expenses']:.2f}."
        )
        parts.append(
            "I need more historical data to compare with previous months. "
            "Keep tracking your finances!"
        )

    else:
        parts.append("Here's what I know about your finances this month:")
        parts.append(
            f"Income: {context['total_income']:.2f} | "
            f"Expenses: {context['total_expenses']:.2f}"
        )
        if context["category_spending"]:
            top = list(context["category_spending"].items())[0]
            parts.append(f"Top spending: {top[0]} ({top[1]:.2f})")
        parts.append(
            "Try asking me about your spending patterns, savings tips, "
            "or budget status!"
        )

    return "\n\n".join(parts)
