import numpy as np
from app.config import DINO_WIDTH, DINO_HEIGHT

class CollisionEngine:
    @staticmethod
    def check_collisions(buffers: dict, active_mask: np.ndarray, obstacles: list, padding: float = 4.0):
        """
        Performs 2D AABB bounding box collision checks between all living players
        and active obstacles. Updates buffers['is_alive'] in-place.
        """
        alive_indices = np.where(buffers["is_alive"] & active_mask)[0]
        
        if len(alive_indices) == 0 or len(obstacles) == 0:
            return

        for idx in alive_indices:
            p_x = buffers["pos_x"][idx]
            p_y = buffers["pos_y"][idx]

            # Player bounding box (feet at p_y, top at p_y - DINO_HEIGHT)
            p_left = p_x + padding
            p_right = p_x + DINO_WIDTH - padding
            p_top = p_y - DINO_HEIGHT + padding
            p_bottom = p_y - padding

            for obs in obstacles:
                o_left = obs["x"] + padding
                o_right = obs["x"] + obs["width"] - padding
                o_top = obs["y"] + padding
                o_bottom = obs["y"] + obs["height"] - padding

                # AABB Overlap check
                if (p_left < o_right and p_right > o_left and
                    p_top < o_bottom and p_bottom > o_top):
                    # Collision detected! Player is dead
                    buffers["is_alive"][idx] = False
                    break
