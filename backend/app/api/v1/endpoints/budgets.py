from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.budgets import Budget
from app.models.categories import Category
from app.models.transactions import Transaction
from app.models.users import User
from app.schemas.budgets import BudgetCreate, BudgetResponse, BudgetUpdate

router = APIRouter(prefix="/budgets", tags=["Budgets"])


async def _calculate_spent(
    db: AsyncSession, user_id: int, category_id: int | None, month: int, year: int
) -> Decimal:
    """Calculate total expenses for a category in a given month/year."""
    query = select(func.coalesce(func.sum(Transaction.original_amount), 0)).where(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "expense",
        extract("month", Transaction.transaction_date) == month,
        extract("year", Transaction.transaction_date) == year,
    )
    if category_id is not None:
        query = query.where(Transaction.category_id == category_id)
    result = await db.execute(query)
    return Decimal(str(result.scalar()))


def _to_response(budget: Budget, spent: Decimal) -> BudgetResponse:
    """Convert a Budget ORM object to a BudgetResponse."""
    category_name = budget.category.name if budget.category else None
    return BudgetResponse(
        id=budget.id,
        user_id=budget.user_id,
        category_id=budget.category_id,
        amount=budget.amount,
        currency_code=budget.currency_code,
        month=budget.month,
        year=budget.year,
        spent=spent,
        category_name=category_name,
        created_at=budget.created_at,
    )


@router.get("/", response_model=list[BudgetResponse])
async def list_budgets(
    month: int | None = Query(None, ge=1, le=12, description="Filter by month"),
    year: int | None = Query(None, description="Filter by year"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all budgets for the current user with optional month/year filter."""
    now = datetime.now(timezone.utc)
    if month is None:
        month = now.month
    if year is None:
        year = now.year

    query = (
        select(Budget)
        .options(joinedload(Budget.category))
        .where(
            Budget.user_id == current_user.id,
            Budget.month == month,
            Budget.year == year,
        )
    )
    result = await db.execute(query)
    budgets = result.unique().scalars().all()

    responses = []
    for budget in budgets:
        spent = await _calculate_spent(
            db, current_user.id, budget.category_id, budget.month, budget.year
        )
        responses.append(_to_response(budget, spent))
    return responses


@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(
    data: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new budget."""
    if data.category_id is not None:
        cat_result = await db.execute(select(Category).where(Category.id == data.category_id))
        if not cat_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )

    budget = Budget(
        user_id=current_user.id,
        category_id=data.category_id,
        amount=data.amount,
        currency_code=data.currency_code,
        month=data.month,
        year=data.year,
    )
    db.add(budget)
    await db.flush()
    await db.refresh(budget)

    # Reload with category
    query = (
        select(Budget)
        .options(joinedload(Budget.category))
        .where(Budget.id == budget.id)
    )
    result = await db.execute(query)
    budget = result.unique().scalar_one()

    spent = await _calculate_spent(
        db, current_user.id, budget.category_id, budget.month, budget.year
    )
    return _to_response(budget, spent)


@router.get("/{budget_id}", response_model=BudgetResponse)
async def get_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific budget."""
    query = (
        select(Budget)
        .options(joinedload(Budget.category))
        .where(Budget.id == budget_id, Budget.user_id == current_user.id)
    )
    result = await db.execute(query)
    budget = result.unique().scalar_one_or_none()
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found",
        )

    spent = await _calculate_spent(
        db, current_user.id, budget.category_id, budget.month, budget.year
    )
    return _to_response(budget, spent)


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: int,
    data: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a budget."""
    query = (
        select(Budget)
        .options(joinedload(Budget.category))
        .where(Budget.id == budget_id, Budget.user_id == current_user.id)
    )
    result = await db.execute(query)
    budget = result.unique().scalar_one_or_none()
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found",
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(budget, field, value)

    await db.flush()
    await db.refresh(budget)

    # Reload with category
    query = (
        select(Budget)
        .options(joinedload(Budget.category))
        .where(Budget.id == budget.id)
    )
    result = await db.execute(query)
    budget = result.unique().scalar_one()

    spent = await _calculate_spent(
        db, current_user.id, budget.category_id, budget.month, budget.year
    )
    return _to_response(budget, spent)


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a budget."""
    query = select(Budget).where(
        Budget.id == budget_id, Budget.user_id == current_user.id
    )
    result = await db.execute(query)
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found",
        )
    await db.delete(budget)
