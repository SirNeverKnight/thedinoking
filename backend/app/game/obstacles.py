import random
from app.config import GROUND_Y

OBSTACLE_TYPES = [
    {"type": "CACTUS_SMALL", "width": 26.0, "height": 42.0, "y_offset": 0.0},
    {"type": "CACTUS_LARGE", "width": 38.0, "height": 54.0, "y_offset": 0.0},
    {"type": "CACTUS_DOUBLE", "width": 56.0, "height": 50.0, "y_offset": 0.0},
    {"type": "PTERODACTYL_LOW", "width": 46.0, "height": 36.0, "y_offset": -45.0},
    {"type": "PTERODACTYL_HIGH", "width": 46.0, "height": 36.0, "y_offset": -85.0},
]

class ObstacleManager:
    def __init__(self, room_seed: int):
        self.rng = random.Random(room_seed)
        self.obstacles = []  # list of dicts: {id, type, x, y, width, height}
        self.next_id = 1
        self.next_spawn_distance = 600.0  # initial spawn X offset
        self.distance_traveled = 0.0

    def update(self, dt: float, world_speed: float):
        """Moves active obstacles and spawns new ones using deterministic seed."""
        # Update distance traveled
        self.distance_traveled += world_speed * dt

        # Move existing obstacles left
        move_dist = world_speed * dt
        for obs in self.obstacles:
            obs["x"] -= move_dist

        # Remove off-screen obstacles (X < -100)
        self.obstacles = [obs for obs in self.obstacles if obs["x"] > -100.0]

        # Check if we should spawn next obstacle
        last_obs_x = max([obs["x"] for obs in self.obstacles], default=0.0)
        if last_obs_x < 900.0:  # Spawn horizon at X = 1000
            self._spawn_obstacle(world_speed, last_obs_x)

    def _spawn_obstacle(self, world_speed: float, last_obs_x: float):
        # Choose random obstacle type
        obs_choice = self.rng.choice(OBSTACLE_TYPES)
        
        # Calculate minimum safe spacing scaled with speed
        min_gap = max(300.0, world_speed * 0.75)
        extra_gap = self.rng.uniform(50.0, 250.0)
        
        spawn_x = max(1000.0, last_obs_x + min_gap + extra_gap)
        spawn_y = GROUND_Y - obs_choice["height"] + obs_choice["y_offset"]

        self.obstacles.append({
            "id": self.next_id,
            "type": obs_choice["type"],
            "x": float(spawn_x),
            "y": float(spawn_y),
            "width": obs_choice["width"],
            "height": obs_choice["height"],
        })
        self.next_id += 1

    def get_serialized_obstacles(self):
        """Returns serializable list of active obstacles for state payload."""
        return [
            [obs["id"], round(obs["x"], 1), round(obs["y"], 1), obs["width"], obs["height"]]
            for obs in self.obstacles
        ]
