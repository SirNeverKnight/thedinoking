from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.game.room_manager import room_manager
from app.websockets.connection_manager import manager

ws_router = APIRouter()

@ws_router.websocket("/ws/{room_code}/{player_id}")
async def websocket_endpoint(websocket: WebSocket, room_code: str, player_id: str):
    room_code = room_code.upper()
    room = room_manager.get_room(room_code)
    if not room:
        await websocket.close(code=4004, reason="Room not found")
        return

    await manager.connect(websocket, room_code, player_id)

    # Broadcast updated room lobby state
    await manager.broadcast_to_room(room_code, {
        "type": "LOBBY_UPDATE",
        "room_code": room_code,
        "admin_id": room.admin_id,
        "state": room.state,
        "players": room.get_player_list_summary()
    })

    try:
        while True:
            data = await websocket.receive_json()
            
            # Support both array format ["JUMP"] or dict format {"type": "JUMP"}
            action_type = data[0] if isinstance(data, list) and len(data) > 0 else data.get("type")

            if action_type == "JUMP":
                room.trigger_player_jump(player_id)
            elif action_type == "START_GAME":
                if player_id == room.admin_id and room.state in ["LOBBY", "ENDED"]:
                    await manager.start_countdown_sequence(room)

    except WebSocketDisconnect:
        manager.disconnect(room_code, player_id)
        if player_id == room.admin_id:
            await manager.broadcast_to_room(room_code, {
                "type": "ROOM_CLOSED",
                "message": "Host has left the room. Room closed."
            })
            room_manager.remove_room(room_code)
        elif room.state == "RUNNING":
            if player_id in room.player_indices:
                slot = room.player_indices[player_id]
                room.buffers["is_alive"][slot] = False
        else:
            room.remove_player(player_id)
            if len(room.player_indices) == 0:
                room_manager.remove_room(room_code)
            else:
                await manager.broadcast_to_room(room_code, {
                    "type": "LOBBY_UPDATE",
                    "room_code": room_code,
                    "admin_id": room.admin_id,
                    "state": room.state,
                    "players": room.get_player_list_summary()
                })
