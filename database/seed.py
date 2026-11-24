"""
Seed script for SpendSense AI database.
Run from the backend directory: python -m database.seed
Or: cd backend && python ../database/seed.py
"""
import asyncio
import sys
import os
from datetime import date, timedelta
from decimal import Decimal
import random

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.core.database import engine, async_session, Base
from app.models.users import User
from app.models.categories import Category
from app.models.transactions import Transaction
from app.models.budgets import Budget
from app.models.savings_goals import SavingsGoal
from app.core.security import hash_password


async def seed():
    async with engine.begin() as conn:
        import app.models
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # Check if already seeded
        from sqlalchemy import select
        result = await session.execute(select(User).where(User.email == "demo@spendsense.ai"))
        if result.scalar_one_or_none():
            print("Database already seeded. Skipping.")
            return

        # Create demo user
        user = User(
            name="Demo User",
            email="demo@spendsense.ai",
            hashed_password=hash_password("demo123"),
            preferred_currency="INR",
        )
        session.add(user)
        await session.flush()
        await session.refresh(user)
        print(f"Created demo user: demo@spendsense.ai / demo123")

        # Seed default categories
        categories = {}
        default_cats = [
            ("Food", "utensils"), ("Shopping", "shopping-bag"), ("Travel", "plane"),
            ("Transportation", "car"), ("Education", "book-open"), ("Healthcare", "heart-pulse"),
            ("Entertainment", "tv"), ("Bills", "file-text"), ("Rent", "home"),
            ("Subscriptions", "repeat"), ("Salary", "briefcase"), ("Freelance", "laptop"),
            ("Other", "more-horizontal"),
        ]
        for name, icon in default_cats:
            cat = Category(name=name, icon=icon, is_default=True, user_id=None)
            session.add(cat)
            await session.flush()
            await session.refresh(cat)
            categories[name] = cat.id

        # Seed transactions for the last 3 months
        today = date.today()
        expense_categories = ["Food", "Shopping", "Travel", "Transportation", "Entertainment", "Bills", "Rent", "Subscriptions"]
        income_categories = ["Salary", "Freelance"]

        for month_offset in range(3):
            # Go back month_offset months from the 1st of the current month
            m = today.month - month_offset
            y = today.year
            while m <= 0:
                m += 12
                y -= 1
            month_date = date(y, m, 1)

            # Income
            for _ in range(2):
                cat = random.choice(income_categories)
                amount = Decimal(str(random.randint(30000, 80000)))
                txn = Transaction(
                    user_id=user.id,
                    category_id=categories[cat],
                    transaction_type="income",
                    original_amount=amount,
                    currency_code="INR",
                    description=f"{cat} payment",
                    transaction_date=month_date + timedelta(days=random.randint(0, 27)),
                )
                session.add(txn)

            # Expenses
            for _ in range(15):
                cat = random.choice(expense_categories)
                amount = Decimal(str(random.randint(100, 15000)))
                txn = Transaction(
                    user_id=user.id,
                    category_id=categories[cat],
                    transaction_type="expense",
                    original_amount=amount,
                    currency_code="INR",
                    description=f"{cat} expense",
                    transaction_date=month_date + timedelta(days=random.randint(0, 27)),
                )
                session.add(txn)

        # Seed budgets for current month
        for cat_name in ["Food", "Shopping", "Entertainment", "Transportation"]:
            budget = Budget(
                user_id=user.id,
                category_id=categories[cat_name],
                amount=Decimal(str(random.randint(3000, 10000))),
                currency_code="INR",
                month=today.month,
                year=today.year,
            )
            session.add(budget)

        # Seed savings goals
        goals = [
            ("Emergency Fund", 100000, 35000),
            ("Vacation", 50000, 12000),
            ("New Laptop", 80000, 45000),
        ]
        for name, target, current in goals:
            goal = SavingsGoal(
                user_id=user.id,
                name=name,
                target_amount=Decimal(str(target)),
                current_amount=Decimal(str(current)),
                currency_code="INR",
                deadline=today + timedelta(days=random.randint(60, 365)),
            )
            session.add(goal)

        await session.commit()
        print("Seed data created successfully!")
        print(f"  - 1 demo user")
        print(f"  - 13 categories")
        print(f"  - ~51 transactions (3 months)")
        print(f"  - 4 budgets")
        print(f"  - 3 savings goals")


if __name__ == "__main__":
    asyncio.run(seed())
