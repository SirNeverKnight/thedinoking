from pydantic import BaseModel
from typing import List, Optional

class LeaderboardEntry(BaseModel):
    user_id: str
    username: str
    score: float
    color_id: int
    created_at: str

class LeaderboardResponse(BaseModel):
    scores: List[LeaderboardEntry]

class MatchRecord(BaseModel):
    match_id: str
    room_code: str
    winner_id: Optional[str]
    winner_name: Optional[str]
    highest_score: float
    total_players: int
    created_at: str
