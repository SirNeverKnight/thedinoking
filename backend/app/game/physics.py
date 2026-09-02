import numpy as np
from app.config import (
    MAX_PLAYERS_PER_ROOM, GROUND_Y, DINO_BASE_X, GRAVITY,
    JUMP_VEL_X, JUMP_VEL_Y, AIR_DRAG, DT
)

class PhysicsEngine:
    @staticmethod
    def create_buffers(max_players: int = MAX_PLAYERS_PER_ROOM):
        return {
            "pos_x": np.full(max_players, DINO_BASE_X, dtype=np.float32),
            "pos_y": np.full(max_players, GROUND_Y, dtype=np.float32),
            "vel_x": np.zeros(max_players, dtype=np.float32),
            "vel_y": np.zeros(max_players, dtype=np.float32),
            "is_alive": np.zeros(max_players, dtype=bool),
            "scores": np.zeros(max_players, dtype=np.float32),
            "color_ids": np.zeros(max_players, dtype=np.int32),
        }

    @staticmethod
    def trigger_jump(buffers: dict, index: int):
        """Triggers a 60-degree vector jump if the player is alive and grounded."""
        if buffers["is_alive"][index] and buffers["pos_y"][index] >= GROUND_Y - 0.1:
            buffers["vel_x"][index] = JUMP_VEL_X
            buffers["vel_y"][index] = JUMP_VEL_Y

    @staticmethod
    def update_physics(buffers: dict, active_mask: np.ndarray, world_speed: float, dt: float = DT):
        """
        Updates physics vectors (positions, velocities, drag, gravity, scores)
        for all active living players using NumPy operations.
        """
        alive_mask = buffers["is_alive"] & active_mask

        # Apply air drag to vel_x
        buffers["vel_x"][alive_mask] -= (
            buffers["vel_x"][alive_mask] * AIR_DRAG * dt
        )

        # Apply gravity and air drag to vel_y
        buffers["vel_y"][alive_mask] += (
            (GRAVITY - buffers["vel_y"][alive_mask] * AIR_DRAG) * dt
        )

        # Integrate positions
        buffers["pos_x"][alive_mask] += buffers["vel_x"][alive_mask] * dt
        buffers["pos_y"][alive_mask] += buffers["vel_y"][alive_mask] * dt

        # Ground collision / landing reset
        landed_mask = alive_mask & (buffers["pos_y"] >= GROUND_Y)
        buffers["pos_y"][landed_mask] = GROUND_Y
        buffers["pos_x"][landed_mask] = DINO_BASE_X
        buffers["vel_x"][landed_mask] = 0.0
        buffers["vel_y"][landed_mask] = 0.0

        # Update scores based on ground speed & time alive
        buffers["scores"][alive_mask] += world_speed * dt
