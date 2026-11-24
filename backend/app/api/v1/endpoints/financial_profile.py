from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.financial_profile import FinancialProfile, FixedExpense
from app.models.users import User
from app.schemas.financial_profile import (
    FinancialProfileResponse,
    FinancialProfileUpdate,
    FixedExpenseCreate,
    FixedExpenseResponse,
    FixedExpenseUpdate,
)

router = APIRouter(prefix="/financial-profile", tags=["Financial Profile"])


async def _load_profile(user_id: int, db: AsyncSession) -> FinancialProfile:
    """Always return a fully loaded profile (with fixed_expenses via selectinload).
    Creates one if it doesn't exist yet."""
    result = await db.execute(
        select(FinancialProfile)
        .options(selectinload(FinancialProfile.fixed_expenses))
        .where(FinancialProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if profile is None:
        profile = FinancialProfile(
            user_id=user_id,
            monthly_income=Decimal("0"),
            currency_code="INR",
        )
        db.add(profile)
        await db.flush()
        # Re-fetch so selectinload runs and the relationship is properly initialised
        result2 = await db.execute(
            select(FinancialProfile)
            .options(selectinload(FinancialProfile.fixed_expenses))
            .where(FinancialProfile.user_id == user_id)
        )
        profile = result2.scalar_one()
    return profile


def _to_response(profile: FinancialProfile) -> FinancialProfileResponse:
    expenses = list(profile.fixed_expenses)
    total_fixed = sum((e.amount for e in expenses), Decimal("0"))
    return FinancialProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        monthly_income=profile.monthly_income,
        currency_code=profile.currency_code,
        updated_at=profile.updated_at,
        fixed_expenses=[FixedExpenseResponse.model_validate(e) for e in expenses],
        total_fixed_expenses=total_fixed,
    )


@router.get("/", response_model=FinancialProfileResponse)
async def get_financial_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await _load_profile(current_user.id, db)
    return _to_response(profile)


@router.put("/", response_model=FinancialProfileResponse)
async def update_financial_profile(
    data: FinancialProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await _load_profile(current_user.id, db)
    if data.monthly_income is not None:
        profile.monthly_income = data.monthly_income
    if data.currency_code is not None:
        profile.currency_code = data.currency_code
    profile.updated_at = datetime.now(timezone.utc)
    await db.flush()
    # Re-fetch to ensure a clean, fully-loaded state
    result = await db.execute(
        select(FinancialProfile)
        .options(selectinload(FinancialProfile.fixed_expenses))
        .where(FinancialProfile.user_id == current_user.id)
    )
    profile = result.scalar_one()
    return _to_response(profile)


@router.post(
    "/fixed-expenses",
    response_model=FixedExpenseResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_fixed_expense(
    data: FixedExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await _load_profile(current_user.id, db)
    expense = FixedExpense(
        profile_id=profile.id,
        name=data.name,
        amount=data.amount,
        category=data.category,
    )
    db.add(expense)
    await db.flush()
    # Re-fetch the expense to get a clean ORM object with all columns populated
    result = await db.execute(
        select(FixedExpense).where(FixedExpense.id == expense.id)
    )
    expense = result.scalar_one()
    return FixedExpenseResponse.model_validate(expense)


@router.put("/fixed-expenses/{expense_id}", response_model=FixedExpenseResponse)
async def update_fixed_expense(
    expense_id: int,
    data: FixedExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await _load_profile(current_user.id, db)
    result = await db.execute(
        select(FixedExpense).where(
            FixedExpense.id == expense_id,
            FixedExpense.profile_id == profile.id,
        )
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    await db.flush()
    result2 = await db.execute(
        select(FixedExpense).where(FixedExpense.id == expense_id)
    )
    expense = result2.scalar_one()
    return FixedExpenseResponse.model_validate(expense)


@router.delete("/fixed-expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fixed_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await _load_profile(current_user.id, db)
    result = await db.execute(
        select(FixedExpense).where(
            FixedExpense.id == expense_id,
            FixedExpense.profile_id == profile.id,
        )
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    await db.delete(expense)
