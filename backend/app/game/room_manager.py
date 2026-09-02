import random
import string
import time
import asyncio
import numpy as np
from typing import Dict, Optional, List
from app.config import (
    MAX_PLAYERS_PER_ROOM, ROOM_CODE_LENGTH, INITIAL_WORLD_SPEED,
    SPEED_ACCELERATION, MAX_WORLD_SPEED, DT, DINO_COLORS,
    DINO_BASE_X, GROUND_Y
)
from app.game.physics import PhysicsEngine
from app.game.obstacles import ObstacleManager
from app.game.collisions import CollisionEngine

class GameRoom:
    def __init__(self, room_code: str, admin_id: str, admin_name: str, admin_color: Optional[int] = None):
        self.room_code = room_code
        self.admin_id = admin_id
        self.state = "LOBBY"  # LOBBY, COUNTDOWN, RUNNING, ENDED
        self.created_at = time.time()
        
        # Mappings
        self.player_indices: Dict[str, int] = {}
        self.player_names: Dict[str, str] = {}
        self.player_colors: Dict[str, int] = {}
        self.active_mask = np.zeros(MAX_PLAYERS_PER_ROOM, dtype=bool)

        # Physics Buffers
        self.buffers = PhysicsEngine.create_buffers(MAX_PLAYERS_PER_ROOM)
        
        # Game State
        self.seed = random.randint(1000, 9999)
        self.obstacle_manager = ObstacleManager(self.seed)
        self.world_speed = INITIAL_WORLD_SPEED
        self.tick_count = 0
        self.countdown_value = 3
        self.loop_task: Optional[asyncio.Task] = None
        self.on_state_change_callback = None

        # Add admin player initially
        self.add_player(admin_id, admin_name, admin_color)

    def reset_room(self):
        self.state = "LOBBY"
        self.seed = random.randint(1000, 9999)
        self.obstacle_manager = ObstacleManager(self.seed)
        self.world_speed = INITIAL_WORLD_SPEED
        self.tick_count = 0
        self.countdown_value = 3

        # Reset physics buffers for active players
        for p_id, slot in self.player_indices.items():
            self.buffers["pos_x"][slot] = DINO_BASE_X
            self.buffers["pos_y"][slot] = GROUND_Y
            self.buffers["vel_x"][slot] = 0.0
            self.buffers["vel_y"][slot] = 0.0
            self.buffers["is_alive"][slot] = True
            self.buffers["scores"][slot] = 0.0

    def add_player(self, player_id: str, player_name: str, requested_color: Optional[int] = None) -> Optional[int]:
        if player_id in self.player_indices:
            return self.player_colors[player_id]

        if len(self.player_indices) >= MAX_PLAYERS_PER_ROOM:
            return None  # Room full

        # Find first available slot
        slot = None
        for i in range(MAX_PLAYERS_PER_ROOM):
            if not self.active_mask[i]:
                slot = i
                break

        if slot is None:
            return None

        # Assign unique dino color
        assigned_color = self._assign_unique_color(requested_color)

        self.player_indices[player_id] = slot
        self.player_names[player_id] = player_name
        self.player_colors[player_id] = assigned_color
        self.active_mask[slot] = True

        self.buffers["is_alive"][slot] = True
        self.buffers["color_ids"][slot] = assigned_color
        self.buffers["scores"][slot] = 0.0

        return assigned_color

    def remove_player(self, player_id: str):
        if player_id not in self.player_indices:
            return

        slot = self.player_indices[player_id]
        self.active_mask[slot] = False
        self.buffers["is_alive"][slot] = False

        del self.player_indices[player_id]
        if player_id in self.player_names:
            del self.player_names[player_id]
        if player_id in self.player_colors:
            del self.player_colors[player_id]

        # Reassign admin if creator leaves
        if player_id == self.admin_id and len(self.player_indices) > 0:
            self.admin_id = next(iter(self.player_indices.keys()))

    def _assign_unique_color(self, requested_color: Optional[int] = None) -> int:
        used_colors = set(self.player_colors.values())
        all_color_ids = list(range(len(DINO_COLORS)))

        if requested_color is not None and requested_color in all_color_ids and requested_color not in used_colors:
            return requested_color

        for c_id in all_color_ids:
            if c_id not in used_colors:
                return c_id

        return 0

    def trigger_player_jump(self, player_id: str):
        if self.state != "RUNNING":
            return
        if player_id in self.player_indices:
            slot = self.player_indices[player_id]
            PhysicsEngine.trigger_jump(self.buffers, slot)

    def tick(self):
        if self.state != "RUNNING":
            return

        self.tick_count += 1
        
        # Accelerate ground world speed slightly over time
        if self.world_speed < MAX_WORLD_SPEED:
            self.world_speed += SPEED_ACCELERATION * DT

        # Update physics
        PhysicsEngine.update_physics(self.buffers, self.active_mask, self.world_speed, DT)

        # Update obstacles
        self.obstacle_manager.update(DT, self.world_speed)

        # Check collisions
        CollisionEngine.check_collisions(
            self.buffers, self.active_mask, self.obstacle_manager.obstacles
        )

        # Check if all active players are dead
        living_count = np.sum(self.buffers["is_alive"] & self.active_mask)
        if living_count == 0:
            self.state = "ENDED"

    def get_player_list_summary(self) -> List[dict]:
        summary = []
        for p_id, slot in self.player_indices.items():
            summary.append({
                "user_id": p_id,
                "username": self.player_names.get(p_id, "Player"),
                "color_id": self.player_colors.get(p_id, 0),
                "is_admin": (p_id == self.admin_id),
                "is_alive": bool(self.buffers["is_alive"][slot]),
                "score": round(float(self.buffers["scores"][slot]), 1),
            })
        return summary

class RoomManager:
    def __init__(self):
        self.rooms: Dict[str, GameRoom] = {}

    def create_room(self, admin_id: str, admin_name: str, admin_color: Optional[int] = None) -> GameRoom:
        code = self._generate_room_code()
        room = GameRoom(code, admin_id, admin_name, admin_color)
        self.rooms[code] = room
        return room

    def get_room(self, room_code: str) -> Optional[GameRoom]:
        return self.rooms.get(room_code.upper())

    def remove_room(self, room_code: str):
        if room_code.upper() in self.rooms:
            del self.rooms[room_code.upper()]

    def list_active_rooms(self) -> List[dict]:
        active = []
        for code, room in self.rooms.items():
            if room.state in ["LOBBY", "COUNTDOWN"]:
                active.append({
                    "room_code": code,
                    "admin_name": room.player_names.get(room.admin_id, "Admin"),
                    "player_count": len(room.player_indices),
                    "max_players": MAX_PLAYERS_PER_ROOM,
                    "state": room.state,
                })
        return active

    def _generate_room_code(self) -> str:
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=ROOM_CODE_LENGTH))
            if code not in self.rooms:
                return code

room_manager = RoomManager()
