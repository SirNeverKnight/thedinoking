import numpy as np
from app.game.room_manager import GameRoom

class SnapshotSerializer:
    @staticmethod
    def serialize_room_state(room: GameRoom) -> dict:
        """
        Serializes room physics, player vectors, and obstacle entities into a compact JSON dict.
        """
        players_payload = []
        for p_id, slot in room.player_indices.items():
            username = room.player_names.get(p_id, "Player")
            p_x = round(float(room.buffers["pos_x"][slot]), 1)
            p_y = round(float(room.buffers["pos_y"][slot]), 1)
            alive = 1 if bool(room.buffers["is_alive"][slot]) else 0
            score = round(float(room.buffers["scores"][slot]), 1)
            color_id = int(room.buffers["color_ids"][slot])
            
            players_payload.append([
                slot, p_id, username, p_x, p_y, alive, score, color_id
            ])

        obstacles_payload = room.obstacle_manager.get_serialized_obstacles()

        return {
            "r": room.room_code,
            "s": room.state,
            "t": room.tick_count,
            "v": round(room.world_speed, 1),
            "p": players_payload,
            "o": obstacles_payload,
        }
