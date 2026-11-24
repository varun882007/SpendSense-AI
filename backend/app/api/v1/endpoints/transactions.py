from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.categories import Category
from app.models.transactions import Transaction
from app.models.users import User
from app.schemas.transactions import (
    TransactionCreate,
    TransactionResponse,
    TransactionUpdate,
)

router = APIRouter(prefix="/transactions", tags=["Transactions"])


def _to_response(txn: Transaction) -> TransactionResponse:
    """Convert a Transaction ORM object to a TransactionResponse."""
    category_name = txn.category.name if txn.category else None
    return TransactionResponse(
        id=txn.id,
        user_id=txn.user_id,
        category_id=txn.category_id,
        transaction_type=txn.transaction_type,
        original_amount=txn.original_amount,
        currency_code=txn.currency_code,
        converted_amount=txn.converted_amount,
        display_currency=txn.display_currency,
        exchange_rate=txn.exchange_rate,
        description=txn.description,
        notes=txn.notes,
        transaction_date=txn.transaction_date,
        is_recurring=txn.is_recurring,
        recurring_frequency=txn.recurring_frequency,
        created_at=txn.created_at,
        category_name=category_name,
    )


@router.get("/", response_model=list[TransactionResponse])
async def list_transactions(
    transaction_type: str | None = Query(None, description="Filter by type: income or expense"),
    category_id: int | None = Query(None, description="Filter by category ID"),
    search: str | None = Query(None, description="Search in description"),
    date_from: date | None = Query(None, description="Filter from date"),
    date_to: date | None = Query(None, description="Filter to date"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all transactions for the current user with optional filters."""
    query = (
        select(Transaction)
        .options(joinedload(Transaction.category))
        .where(Transaction.user_id == current_user.id)
    )

    if transaction_type:
        query = query.where(Transaction.transaction_type == transaction_type)
    if category_id is not None:
        query = query.where(Transaction.category_id == category_id)
    if search:
        query = query.where(Transaction.description.ilike(f"%{search}%"))
    if date_from:
        query = query.where(Transaction.transaction_date >= date_from)
    if date_to:
        query = query.where(Transaction.transaction_date <= date_to)

    query = query.order_by(Transaction.transaction_date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    transactions = result.unique().scalars().all()
    return [_to_response(t) for t in transactions]


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new transaction for the current user."""
    if data.category_id is not None:
        cat_result = await db.execute(select(Category).where(Category.id == data.category_id))
        if not cat_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )

    transaction = Transaction(
        user_id=current_user.id,
        category_id=data.category_id,
        transaction_type=data.transaction_type,
        original_amount=data.original_amount,
        currency_code=data.currency_code,
        description=data.description,
        notes=data.notes,
        transaction_date=data.transaction_date,
        is_recurring=data.is_recurring,
        recurring_frequency=data.recurring_frequency,
    )
    db.add(transaction)
    await db.flush()
    await db.refresh(transaction)

    # Eagerly load category for the response
    query = (
        select(Transaction)
        .options(joinedload(Transaction.category))
        .where(Transaction.id == transaction.id)
    )
    result = await db.execute(query)
    transaction = result.unique().scalar_one()
    return _to_response(transaction)


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific transaction."""
    query = (
        select(Transaction)
        .options(joinedload(Transaction.category))
        .where(Transaction.id == transaction_id, Transaction.user_id == current_user.id)
    )
    result = await db.execute(query)
    transaction = result.unique().scalar_one_or_none()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )
    return _to_response(transaction)


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: int,
    data: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a transaction."""
    query = (
        select(Transaction)
        .options(joinedload(Transaction.category))
        .where(Transaction.id == transaction_id, Transaction.user_id == current_user.id)
    )
    result = await db.execute(query)
    transaction = result.unique().scalar_one_or_none()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)

    await db.flush()
    await db.refresh(transaction)

    # Re-load with category
    query = (
        select(Transaction)
        .options(joinedload(Transaction.category))
        .where(Transaction.id == transaction.id)
    )
    result = await db.execute(query)
    transaction = result.unique().scalar_one()
    return _to_response(transaction)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a transaction."""
    query = select(Transaction).where(
        Transaction.id == transaction_id, Transaction.user_id == current_user.id
    )
    result = await db.execute(query)
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )
    await db.delete(transaction)
