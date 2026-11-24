from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.models.users import User

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/")
async def list_notifications(current_user: User = Depends(get_current_user)):
    """List all notifications for the current user."""
    return {"message": "endpoint coming in phase 3"}
