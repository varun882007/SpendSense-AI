from fastapi import APIRouter, Depends
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.categories import Category
from app.models.users import User
from app.schemas.categories import CategoryResponse

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/", response_model=list[CategoryResponse])
async def list_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all default categories and the current user's custom categories."""
    query = (
        select(Category)
        .where(
            or_(
                Category.is_default == True,  # noqa: E712
                Category.user_id == current_user.id,
            )
        )
        .order_by(Category.id)
    )
    result = await db.execute(query)
    categories = result.scalars().all()
    return categories
