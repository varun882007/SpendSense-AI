from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class BudgetCreate(BaseModel):
    category_id: int | None = None
    amount: Decimal
    currency_code: str = "INR"
    month: int
    year: int


class BudgetUpdate(BaseModel):
    amount: Decimal | None = None


class BudgetResponse(BaseModel):
    id: int
    user_id: int
    category_id: int | None
    amount: Decimal
    currency_code: str
    month: int
    year: int
    spent: Decimal = Decimal("0")
    category_name: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
