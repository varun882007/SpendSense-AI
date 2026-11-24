from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class SavingsGoalCreate(BaseModel):
    name: str
    target_amount: Decimal
    currency_code: str = "INR"
    deadline: date | None = None


class SavingsGoalUpdate(BaseModel):
    name: str | None = None
    target_amount: Decimal | None = None
    current_amount: Decimal | None = None
    deadline: date | None = None


class SavingsGoalResponse(BaseModel):
    id: int
    user_id: int
    name: str
    target_amount: Decimal
    current_amount: Decimal
    currency_code: str
    deadline: date | None
    progress: float = 0.0
    created_at: datetime

    model_config = {"from_attributes": True}
