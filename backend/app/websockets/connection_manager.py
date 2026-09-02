import asyncio
import time
import aiosqlite
from typing import Dict
from fastapi import WebSocket, WebSocketDisconnect
from app.game.room_manager import GameRoom, room_manager
from app.utils.serializer import SnapshotSerializer
from app.config import DT, DB_PATH

class ConnectionManager:
    def __init__(self):
        # Mapping: room_code -> {player_id: WebSocket}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_code: str, player_id: str):
        await websocket.accept()
        room_code = room_code.upper()
        if room_code not in self.active_connections:
            self.active_connections[room_code] = {}
        self.active_connections[room_code][player_id] = websocket

    def disconnect(self, room_code: str, player_id: str):
        room_code = room_code.upper()
        if room_code in self.active_connections:
            if player_id in self.active_connections[room_code]:
                del self.active_connections[room_code][player_id]
            if len(self.active_connections[room_code]) == 0:
                del self.active_connections[room_code]

    async def broadcast_to_room(self, room_code: str, message: dict):
        room_code = room_code.upper()
        if room_code not in self.active_connections:
            return

        dead_sockets = []
        for player_id, socket in self.active_connections[room_code].items():
            try:
                await socket.send_json(message)
            except Exception:
                dead_sockets.append(player_id)

        for p_id in dead_sockets:
            self.disconnect(room_code, p_id)

    async def start_countdown_sequence(self, room: GameRoom):
        if room.state not in ["LOBBY", "ENDED"]:
            return

        room.reset_room()
        room.state = "COUNTDOWN"
        for count in [3, 2, 1]:
            room.countdown_value = count
            await self.broadcast_to_room(room.room_code, {
                "type": "COUNTDOWN",
                "value": count,
                "players": room.get_player_list_summary()
            })
            await asyncio.sleep(1.0)

        # Transition to RUNNING
        room.state = "RUNNING"
        await self.broadcast_to_room(room.room_code, {
            "type": "GAME_START",
            "seed": room.seed,
            "players": room.get_player_list_summary()
        })

        # Launch non-blocking 30 Hz physics tick loop
        room.loop_task = asyncio.create_task(self.run_physics_loop(room))

    async def run_physics_loop(self, room: GameRoom):
        try:
            while room.state == "RUNNING":
                start_time = time.perf_counter()
                
                # Execute physics step
                room.tick()

                # Broadcast 30 Hz snapshot payload
                snapshot = SnapshotSerializer.serialize_room_state(room)
                await self.broadcast_to_room(room.room_code, snapshot)

                # Maintain 30 Hz tick timing
                elapsed = time.perf_counter() - start_time
                sleep_time = max(0.0, DT - elapsed)
                await asyncio.sleep(sleep_time)

            # Game finished
            if room.state == "ENDED":
                await self.handle_game_over(room)

        except Exception as e:
            print(f"[Loop Error] Room {room.room_code}: {e}")

    async def handle_game_over(self, room: GameRoom):
        # Determine rankings
        summary = room.get_player_list_summary()
        summary.sort(key=lambda x: x["score"], reverse=True)

        winner = summary[0] if summary else None

        # Save stats asynchronously to SQLite database
        try:
            async with aiosqlite.connect(DB_PATH) as db:
                if winner:
                    await db.execute(
                        "INSERT INTO matches (match_id, room_code, winner_id, winner_name, highest_score, total_players) VALUES (?, ?, ?, ?, ?, ?)",
                        (f"match_{int(time.time())}_{room.room_code}", room.room_code, winner["user_id"], winner["username"], winner["score"], len(summary))
                    )
                for p in summary:
                    await db.execute(
                        "INSERT INTO high_scores (user_id, username, score, color_id) VALUES (?, ?, ?, ?)",
                        (p["user_id"], p["username"], p["score"], p["color_id"])
                    )
                await db.commit()
        except Exception as err:
            print(f"[DB Error] Failed to persist game over records: {err}")

        # Broadcast game over event
        await self.broadcast_to_room(room.room_code, {
            "type": "GAME_OVER",
            "leaderboard": summary,
            "winner": winner
        })

manager = ConnectionManager()
