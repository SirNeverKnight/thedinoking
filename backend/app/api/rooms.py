from fastapi import APIRouter, HTTPException
from app.models.user import RoomCreate, RoomJoin
from app.game.room_manager import room_manager

rooms_router = APIRouter(prefix="/api/rooms", tags=["Rooms"])

@rooms_router.post("/create")
async def create_room(payload: RoomCreate):
    room = room_manager.create_room(payload.user_id, payload.username, payload.color_id)
    return {
        "room_code": room.room_code,
        "admin_id": room.admin_id,
        "color_id": room.player_colors[payload.user_id],
        "state": room.state,
        "players": room.get_player_list_summary(),
    }

@rooms_router.post("/join")
async def join_room(payload: RoomJoin):
    room_code = payload.room_code.upper()
    room = room_manager.get_room(room_code)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found. Check your room code.")

    if room.state not in ["LOBBY", "ENDED"]:
        raise HTTPException(status_code=400, detail="Game is currently running in this room.")

    assigned_color = room.add_player(payload.user_id, payload.username, payload.color_id)
    if assigned_color is None:
        raise HTTPException(status_code=400, detail="Room is full (Max 16 players).")

    return {
        "room_code": room.room_code,
        "admin_id": room.admin_id,
        "color_id": assigned_color,
        "state": room.state,
        "players": room.get_player_list_summary(),
    }

@rooms_router.get("/active")
async def get_active_rooms():
    return {"rooms": room_manager.list_active_rooms()}
