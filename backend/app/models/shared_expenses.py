from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SharedExpense(Base):
    __tablename__ = "shared_expenses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency_code: Mapped[str] = mapped_column(
        String(10), nullable=False, default="INR"
    )
    split_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "equal", "percentage", "custom"
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user = relationship("User", back_populates="shared_expenses")
    members = relationship(
        "SharedExpenseMember", back_populates="shared_expense", cascade="all, delete-orphan"
    )


class SharedExpenseMember(Base):
    __tablename__ = "shared_expense_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    shared_expense_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("shared_expenses.id"), nullable=False
    )
    member_name: Mapped[str] = mapped_column(String(100), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    shared_expense = relationship("SharedExpense", back_populates="members")
