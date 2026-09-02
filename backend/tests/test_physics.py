import pytest
import numpy as np
from app.config import GROUND_Y, DINO_BASE_X, JUMP_VEL_Y, JUMP_VEL_X
from app.game.physics import PhysicsEngine
from app.game.collisions import CollisionEngine
from app.game.room_manager import RoomManager, GameRoom

def test_physics_jump_and_landing():
    buffers = PhysicsEngine.create_buffers(16)
    buffers["is_alive"][0] = True
    active_mask = np.zeros(16, dtype=bool)
    active_mask[0] = True

    # Initial state
    assert buffers["pos_y"][0] == GROUND_Y
    assert buffers["pos_x"][0] == DINO_BASE_X

    # Trigger jump
    PhysicsEngine.trigger_jump(buffers, 0)
    assert buffers["vel_y"][0] == JUMP_VEL_Y
    assert buffers["vel_x"][0] == JUMP_VEL_X

    # Update physics tick
    PhysicsEngine.update_physics(buffers, active_mask, world_speed=300.0, dt=0.033)
    assert buffers["pos_y"][0] < GROUND_Y  # Airborne (Y decreases going up)
    assert buffers["pos_x"][0] > DINO_BASE_X  # Relative X jump offset forward

def test_aabb_collision_detection():
    buffers = PhysicsEngine.create_buffers(16)
    buffers["is_alive"][0] = True
    active_mask = np.zeros(16, dtype=bool)
    active_mask[0] = True

    # Place Dino at X=100, Y=400
    buffers["pos_x"][0] = 100.0
    buffers["pos_y"][0] = 400.0

    # Obstacle overlapping Dino
    obstacles = [{
        "id": 1,
        "type": "CACTUS_SMALL",
        "x": 105.0,
        "y": 360.0,
        "width": 26.0,
        "height": 42.0,
    }]

    CollisionEngine.check_collisions(buffers, active_mask, obstacles, padding=2.0)
    assert buffers["is_alive"][0] == False

def test_room_manager_and_colors():
    rm = RoomManager()
    room = rm.create_room("usr_1", "Player1")
    assert room.room_code in rm.rooms
    assert room.admin_id == "usr_1"
    assert room.player_colors["usr_1"] == 0

    c2 = room.add_player("usr_2", "Player2")
    assert c2 == 1  # Unique assigned color ID
    assert len(room.player_indices) == 2
