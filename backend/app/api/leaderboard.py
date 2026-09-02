import aiosqlite
from fastapi import APIRouter, Depends
from app.database import get_db

leaderboard_router = APIRouter(prefix="/api/leaderboard", tags=["Leaderboard"])

@leaderboard_router.get("")
async def get_global_leaderboard(limit: int = 10, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute(
        """
        SELECT user_id, username, MAX(score) as top_score, color_id, created_at
        FROM high_scores
        GROUP BY user_id
        ORDER BY top_score DESC
        LIMIT ?
        """,
        (limit,)
    ) as cursor:
        rows = await cursor.fetchall()
        
    scores = []
    for r in rows:
        scores.append({
            "user_id": r["user_id"],
            "username": r["username"],
            "score": round(r["top_score"], 1),
            "color_id": r["color_id"],
            "created_at": str(r["created_at"]),
        })

    return {"scores": scores}
