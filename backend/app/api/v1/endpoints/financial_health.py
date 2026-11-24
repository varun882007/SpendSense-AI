from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User
from app.services.financial_health import calculate_health_score

router = APIRouter(prefix="/financial-health", tags=["Financial Health"])


@router.get("/score")
async def get_health_score(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Calculate and return the user's financial health score."""
    return await calculate_health_score(current_user.id, db)
