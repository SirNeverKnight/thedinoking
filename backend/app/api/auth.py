import uuid
import aiosqlite
from fastapi import APIRouter, HTTPException, Depends
from app.models.user import UserCreate, UserResponse
from app.database import get_db

auth_router = APIRouter(prefix="/api/auth", tags=["Auth"])

@auth_router.post("/guest", response_model=UserResponse)
async def create_guest_user(payload: UserCreate, db: aiosqlite.Connection = Depends(get_db)):
    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    username = payload.username.strip() or "AnonymousDino"
    color_id = payload.color_id if payload.color_id is not None else 0

    await db.execute(
        "INSERT INTO users (user_id, username, color_id) VALUES (?, ?, ?)",
        (user_id, username, color_id)
    )
    await db.commit()

    return UserResponse(user_id=user_id, username=username, color_id=color_id)
