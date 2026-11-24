from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.savings_goals import SavingsGoal
from app.models.users import User
from app.schemas.savings_goals import (
    SavingsGoalCreate,
    SavingsGoalResponse,
    SavingsGoalUpdate,
)

router = APIRouter(prefix="/savings-goals", tags=["Savings Goals"])


def _to_response(goal: SavingsGoal) -> SavingsGoalResponse:
    """Convert a SavingsGoal ORM object to a SavingsGoalResponse."""
    progress = 0.0
    if goal.target_amount and goal.target_amount > 0:
        progress = round(float(goal.current_amount / goal.target_amount) * 100, 2)
    return SavingsGoalResponse(
        id=goal.id,
        user_id=goal.user_id,
        name=goal.name,
        target_amount=goal.target_amount,
        current_amount=goal.current_amount,
        currency_code=goal.currency_code,
        deadline=goal.deadline,
        progress=progress,
        created_at=goal.created_at,
    )


@router.get("/", response_model=list[SavingsGoalResponse])
async def list_savings_goals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all savings goals for the current user."""
    query = (
        select(SavingsGoal)
        .where(SavingsGoal.user_id == current_user.id)
        .order_by(SavingsGoal.created_at.desc())
    )
    result = await db.execute(query)
    goals = result.scalars().all()
    return [_to_response(g) for g in goals]


@router.post("/", response_model=SavingsGoalResponse, status_code=status.HTTP_201_CREATED)
async def create_savings_goal(
    data: SavingsGoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new savings goal."""
    goal = SavingsGoal(
        user_id=current_user.id,
        name=data.name,
        target_amount=data.target_amount,
        current_amount=Decimal("0"),
        currency_code=data.currency_code,
        deadline=data.deadline,
    )
    db.add(goal)
    await db.flush()
    await db.refresh(goal)
    return _to_response(goal)


@router.get("/{goal_id}", response_model=SavingsGoalResponse)
async def get_savings_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific savings goal."""
    query = select(SavingsGoal).where(
        SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id
    )
    result = await db.execute(query)
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found",
        )
    return _to_response(goal)


@router.put("/{goal_id}", response_model=SavingsGoalResponse)
async def update_savings_goal(
    goal_id: int,
    data: SavingsGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a savings goal."""
    query = select(SavingsGoal).where(
        SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id
    )
    result = await db.execute(query)
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found",
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)

    await db.flush()
    await db.refresh(goal)
    return _to_response(goal)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_savings_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a savings goal."""
    query = select(SavingsGoal).where(
        SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id
    )
    result = await db.execute(query)
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found",
        )
    await db.delete(goal)
