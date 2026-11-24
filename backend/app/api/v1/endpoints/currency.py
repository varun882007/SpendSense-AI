from datetime import datetime, timezone, timedelta

import httpx
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.exchange_rates import ExchangeRate
from app.models.users import User

router = APIRouter(prefix="/currency", tags=["Currency Exchange"])

FALLBACK_RATE = 83.5  # USD to INR fallback


@router.get("/rates")
async def get_exchange_rates(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current exchange rates."""
    # Check for cached rate
    result = await db.execute(
        select(ExchangeRate)
        .where(ExchangeRate.from_currency == "USD")
        .where(ExchangeRate.to_currency == "INR")
        .order_by(ExchangeRate.fetched_at.desc())
        .limit(1)
    )
    cached = result.scalar_one_or_none()

    if cached and (
        datetime.now(timezone.utc)
        - cached.fetched_at.replace(tzinfo=timezone.utc)
    ) < timedelta(hours=24):
        return {
            "usd_to_inr": float(cached.rate),
            "inr_to_usd": round(1 / float(cached.rate), 6),
            "last_updated": cached.fetched_at.isoformat(),
            "source": "cached",
        }

    # Try to fetch fresh rate
    if settings.EXCHANGE_RATE_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"https://v6.exchangerate-api.com/v6/"
                    f"{settings.EXCHANGE_RATE_API_KEY}/pair/USD/INR",
                    timeout=10.0,
                )
                data = resp.json()
                if data.get("result") == "success":
                    rate = data["conversion_rate"]
                    # Cache it
                    new_rate = ExchangeRate(
                        from_currency="USD",
                        to_currency="INR",
                        rate=rate,
                        fetched_at=datetime.now(timezone.utc),
                    )
                    db.add(new_rate)
                    await db.flush()
                    return {
                        "usd_to_inr": rate,
                        "inr_to_usd": round(1 / rate, 6),
                        "last_updated": datetime.now(timezone.utc).isoformat(),
                        "source": "live",
                    }
        except Exception:
            pass

    # Fallback
    return {
        "usd_to_inr": FALLBACK_RATE,
        "inr_to_usd": round(1 / FALLBACK_RATE, 6),
        "last_updated": None,
        "source": "fallback",
        "note": "Using fallback rate. Set EXCHANGE_RATE_API_KEY for live rates.",
    }
