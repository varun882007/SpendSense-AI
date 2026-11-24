from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    category_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("categories.id"), nullable=True
    )
    transaction_type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # "income" or "expense"
    original_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False
    )
    currency_code: Mapped[str] = mapped_column(
        String(10), nullable=False, default="INR"
    )
    converted_amount: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    display_currency: Mapped[str | None] = mapped_column(
        String(10), nullable=True
    )
    exchange_rate: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 6), nullable=True
    )
    exchange_rate_timestamp: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_recurring: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    recurring_frequency: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
