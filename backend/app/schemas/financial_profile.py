from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class FixedExpenseBase(BaseModel):
    name: str
    amount: Decimal
    category: Optional[str] = None


class FixedExpenseCreate(FixedExpenseBase):
    pass


class FixedExpenseUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[Decimal] = None
    category: Optional[str] = None


class FixedExpenseResponse(FixedExpenseBase):
    id: int
    profile_id: int

    model_config = {"from_attributes": True}


class FinancialProfileUpdate(BaseModel):
    monthly_income: Optional[Decimal] = None
    currency_code: Optional[str] = None


class FinancialProfileResponse(BaseModel):
    id: int
    user_id: int
    monthly_income: Decimal
    currency_code: str
    updated_at: datetime
    fixed_expenses: list[FixedExpenseResponse] = []
    total_fixed_expenses: Decimal = Decimal("0")

    model_config = {"from_attributes": True}
