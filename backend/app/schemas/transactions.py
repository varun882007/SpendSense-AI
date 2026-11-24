from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class TransactionCreate(BaseModel):
    category_id: int | None = None
    transaction_type: str  # "income" or "expense"
    original_amount: Decimal
    currency_code: str = "INR"
    description: str
    notes: str | None = None
    transaction_date: date
    is_recurring: bool = False
    recurring_frequency: str | None = None


class TransactionUpdate(BaseModel):
    category_id: int | None = None
    transaction_type: str | None = None
    original_amount: Decimal | None = None
    currency_code: str | None = None
    description: str | None = None
    notes: str | None = None
    transaction_date: date | None = None


class TransactionResponse(BaseModel):
    id: int
    user_id: int
    category_id: int | None
    transaction_type: str
    original_amount: Decimal
    currency_code: str
    converted_amount: Decimal | None
    display_currency: str | None
    exchange_rate: Decimal | None
    description: str
    notes: str | None
    transaction_date: date
    is_recurring: bool
    recurring_frequency: str | None
    created_at: datetime
    category_name: str | None = None

    model_config = {"from_attributes": True}
