import math

# Game Loop Settings
TICK_RATE = 30
DT = 1.0 / TICK_RATE

# Room & Player Limits
MAX_PLAYERS_PER_ROOM = 16
ROOM_CODE_LENGTH = 6

# Physics Constants
GROUND_Y = 400.0
DINO_BASE_X = 100.0
DINO_WIDTH = 44.0
DINO_HEIGHT = 48.0

GRAVITY = 1150.0
JUMP_V0 = 460.0
JUMP_ANGLE_RAD = math.pi / 3.0  # 60 degrees
JUMP_VEL_X = JUMP_V0 * math.cos(JUMP_ANGLE_RAD)  # 230.0 px/s
JUMP_VEL_Y = -JUMP_V0 * math.sin(JUMP_ANGLE_RAD) # ~-398.37 px/s
AIR_DRAG = 0.05

# Speed Scaling
INITIAL_WORLD_SPEED = 300.0
SPEED_ACCELERATION = 10.0  # px/s^2 increase
MAX_WORLD_SPEED = 900.0

# Database
DB_PATH = "data/game.db"

# Available Dino Colors (16 distinct colors)
DINO_COLORS = [
    {"id": 0, "name": "Classic Green", "hex": "#4CAF50"},
    {"id": 1, "name": "Ocean Blue", "hex": "#2196F3"},
    {"id": 2, "name": "Crimson Red", "hex": "#F44336"},
    {"id": 3, "name": "Sunburst Orange", "hex": "#FF9800"},
    {"id": 4, "name": "Royal Purple", "hex": "#9C27B0"},
    {"id": 5, "name": "Hot Pink", "hex": "#E91E63"},
    {"id": 6, "name": "Electric Cyan", "hex": "#00BCD4"},
    {"id": 7, "name": "Neon Yellow", "hex": "#FFEB3B"},
    {"id": 8, "name": "Choco Brown", "hex": "#795548"},
    {"id": 9, "name": "Steel Grey", "hex": "#607D8B"},
    {"id": 10, "name": "Lime Green", "hex": "#8BC34A"},
    {"id": 11, "name": "Indigo Night", "hex": "#3F51B5"},
    {"id": 12, "name": "Deep Sunset", "hex": "#FF5722"},
    {"id": 13, "name": "Teal Splash", "hex": "#009688"},
    {"id": 14, "name": "Violet Dream", "hex": "#673AB7"},
    {"id": 15, "name": "Golden Amber", "hex": "#FFC107"},
]
