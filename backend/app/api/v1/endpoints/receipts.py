from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.models.users import User

router = APIRouter(prefix="/receipts", tags=["Receipt OCR"])


@router.post("/upload")
async def upload_receipt(current_user: User = Depends(get_current_user)):
    """Upload and process a receipt image via OCR."""
    return {"message": "endpoint coming in phase 3"}
