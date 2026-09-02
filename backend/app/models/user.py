from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    username: str
    color_id: Optional[int] = 0

class UserResponse(BaseModel):
    user_id: str
    username: str
    color_id: int

class RoomCreate(BaseModel):
    user_id: str
    username: str
    color_id: Optional[int] = 0

class RoomJoin(BaseModel):
    room_code: str
    user_id: str
    username: str
    color_id: Optional[int] = 0
