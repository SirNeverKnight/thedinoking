Here is **Server.md** formatted to match your specification style.

---

# Server.md

# Game Server Architecture & Workflow (Server)

The server acts as the **single source of truth** for all physics, room states, obstacle generation, and collision detection. The server processes all mechanics independently of client frame rates and broadcasts state snapshots to all connected players in a room via WebSockets.

---

# Server Capabilities & Responsibilities

1. **Room State Management**: Lifecycle transitions (`LOBBY` $\rightarrow$ `COUNTDOWN` $\rightarrow$ `RUNNING` $\rightarrow$ `ENDED`).
2. **Authoritative Physics Calculation**: Speed acceleration, jump velocity, gravity, and drag applied uniformly via vectorized NumPy math.
3. **Collision Detection**: Axis-Aligned Bounding Box (AABB) checks executed on every physics tick.
4. **Synchronized Obstacle Generation**: Random seed generation for terrain and obstacle spawning to ensure identical layouts across all clients in a room.
5. **Realtime Score & Leaderboard Calculation**: Tracks live survival times/distances, sorts ranks in descending order, and monitors active/dead player states.
6. **Data Persistence**: Asynchronous SQLite management for user accounts, global high scores, and match logs.

---

# Tech Stack & Libraries

* **Language**: Python 3.10+
* **Framework**: FastAPI (HTTP API & WebSocket routes)
* **ASGI Server**: Uvicorn
* **Math Engine**: NumPy (Vectorized float32 physics math)
* **Async Runtime**: Asyncio (Non-blocking 30 Hz game loop and socket management)
* **Database**: SQLite3 via AIOSQLite (Asynchronous persistence)

---

# System Architecture & Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FastAPI / Uvicorn                             │
│                                                                         │
│  ┌────────────────────────┐         ┌────────────────────────────────┐  │
│  │    REST API Endpoints  │         │    WebSocket Endpoint (/ws)    │  │
│  │  - Auth (Login/Signup) │         │  - Room Connection Manager     │  │
│  │  - Create/Join Rooms   │         │  - Player Input Queue (JUMP)   │  │
│  │  - Fetch Leaderboard   │         │  - High-Speed Byte Streaming   │  │
│  └───────────┬────────────┘         └───────────────┬────────────────┘  │
└──────────────┼──────────────────────────────────────┼───────────────────┘
               │                                      │
               ▼                                      ▼
┌───────────────────────────┐         ┌────────────────────────────────┐
│   SQLite Database (Async) │         │       GameRoom Instance        │
│  - Users / Profiles       │         │  ┌──────────────────────────┐  │
│  - Scores & Records       │         │  │ State Machine            │  │
│  - Match Logs             │         │  │ (LOBBY/COUNTDOWN/RUNNING)│  │
└───────────────────────────┘         │  └────────────┬─────────────┘  │
                                      │               │                │
                                      │  ┌────────────▼─────────────┐  │
                                      │  │ 30 Hz Physics Loop       │  │
                                      │  │  - NumPy Vector Math     │  │
                                      │  │  - Obstacle Motion       │  │
                                      │  │  - AABB Collision Math   │  │
                                      │  │  - Realtime Leaderboard  │  │
                                      │  └────────────┬─────────────┘  │
                                      └───────────────┼────────────────┘
                                                      │
                                                      ▼
                                       Broadcasting Array Snapshots
                                       (Flat JSON or Float32Array)

```

---

# Data Structures & Vector Physics Engine

Instead of executing slow Python loops per player, room state is stored inside **1D/2D NumPy `float32` arrays**.

### Room Memory Layout

```python
# Allocated per room upon game start (e.g., max 16 players per room)
pos_x      = np.zeros(max_players, dtype=np.float32)
pos_y      = np.full(max_players, GROUND_Y, dtype=np.float32)
vel_y      = np.zeros(max_players, dtype=np.float32)
is_alive   = np.ones(max_players, dtype=bool)
score      = np.zeros(max_players, dtype=np.float32)
color_ids  = np.zeros(max_players, dtype=np.int32)

```

### Physics Constants & Formulas

* **Tick Rate**: $30\text{ Hz}$ ($\Delta t = 0.033\text{ seconds}$)
* **Gravity Acceleration ($g$)**: $980.0\text{ px/s}^2$
* **Jump Velocity Impulse ($v_{jump}$)**: $-550.0\text{ px/s}$
* **Air Drag Rate ($k_{drag}$)**: $0.05$
* **Base Game Speed ($v_{speed}$)**: Increases over time to scale difficulty.

$$\vec{v}_{y\_new} = \vec{v}_{y\_old} + (g - \vec{v}_{y\_old} \cdot k_{drag}) \cdot \Delta t$$

$$\vec{p}_{y\_new} = \vec{p}_{y\_old} + \vec{v}_{y\_new} \cdot \Delta t$$

$$\text{score}_{new} = \text{score}_{old} + (v_{speed} \cdot \Delta t)$$

---

# Server Workflow & Room State Machine

### 1. Room Creation & Joining

* Player sends a request to create a room. Server generates a unique 6-character room code, assigns the creator as **Room Admin**, and allocates color IDs to prevent duplicate dinosaur colors in the room.
* When players connect over WebSockets, the server adds their connection to the `ConnectionManager` and broadcasts updated room player lists to all room participants.

### 2. 3-Second Countdown Sequence

* Admin sends `START_GAME` action over WebSocket.
* Server sets room state to `COUNTDOWN`.
* Server sends interval messages every second:
* `{"type": "COUNTDOWN", "value": 3}`
* `{"type": "COUNTDOWN", "value": 2}`
* `{"type": "COUNTDOWN", "value": 1}`


* On reaching zero, server sets room state to `RUNNING` and launches the non-blocking `asyncio` physics loop.

### 3. Active Running Physics Loop (30 Hz)

* **Input Resolution**: Reads incoming player `JUMP` actions from the room event queue and sets `vel_y[player_index] = -550.0` if the player is currently grounded (`pos_y >= GROUND_Y`).
* **Position & Speed Update**: Updates speeds and positions across all active player indices via single-line NumPy operations.
* **Obstacle Generation & Movement**: Moves obstacles leftward towards players at current game speed. Spawns new obstacles using deterministic room random seeds.
* **Collision Check**: Performs Axis-Aligned Bounding Box (AABB) intersection math for every living player against active obstacles:
```python
overlap_x = (player_x < obs_x + obs_w) and (player_x + player_w > obs_x)
overlap_y = (player_y < obs_y + obs_h) and (player_y + player_h > obs_y)

```


If `overlap_x` and `overlap_y` evaluate to `True`, `is_alive[player_index]` is set to `False`.
* **Snapshot Broadcast**: Serializes state into a compact stream (flat array/raw bytes) containing player coordinates, states, colors, scores, and obstacle data, then broadcasts it to all connected sockets in the room.

### 4. Game Over & Persistence

* When all players in the room reach `is_alive == False`, the room loop stops.
* Server sets room state to `ENDED`.
* Final scores and rank distributions are stored asynchronously in SQLite (`game.db`) via `aiosqlite`.
* Server broadcasts final match leaderboard overlay data.

---

### Updated Server Specifications (`Server.md` Addendum)

---

# Jump Physics & Dynamic Scaling

Instead of vertical-only movement, the jump follows a **60-degree angled impulse vector** combined with continuous air drag and dynamic ground-speed acceleration.

### 1. Vector Jump Impulse (60-Degree Trajectory)

When a jump command (`JUMP`) is received for a grounded player ($y \ge \text{GROUND\_Y}$):

* **Jump Angle**: $\theta = 60^\circ$
* **Initial Impulse Magnitude**: $V_0 = 600\text{ px/s}$

$$\text{vel}_x = V_0 \cdot \cos(60^\circ) = 600 \cdot 0.5 = 300.0\text{ px/s}$$

$$\text{vel}_y = -V_0 \cdot \sin(60^\circ) = -600 \cdot \frac{\sqrt{3}}{2} \approx -519.61\text{ px/s}$$

### 2. Physics Equations per Tick ($\Delta t = 0.033\text{s}$)

During each 30 Hz server frame, horizontal velocity ($\text{vel}_x$) decays toward zero due to air drag, while vertical velocity ($\text{vel}_y$) is acted upon by both drag and gravity:

$$\text{vel}_x = \text{vel}_x - (\text{vel}_x \cdot k_{\text{drag}} \cdot \Delta t)$$

$$\text{vel}_y = \text{vel}_y + \left(g - (\text{vel}_y \cdot k_{\text{drag}})\right) \cdot \Delta t$$

$$\text{pos}_x = \text{pos}_x + \text{vel}_x \cdot \Delta t$$

$$\text{pos}_y = \text{pos}_y + \text{vel}_y \cdot \Delta t$$

*When the player lands ($y \ge \text{GROUND\_Y}$), $\text{pos}_x$ resets to its default base lane position ($X_{\text{base}}$), and $\text{vel}_x, \text{vel}_y$ are set to `0.0`.*

### 3. Dynamic Difficulty Scaling (Ground Speed)

To make the game progressively faster over time, the global world speed ($V_{\text{world}}$) scales dynamically:

$$V_{\text{world}}(t) = V_{\text{initial}} + (\text{elapsed\_seconds} \cdot \text{acceleration\_rate})$$

* **$V_{\text{initial}}$**: $300.0\text{ px/s}$
* **$\text{acceleration\_rate}$**: $10.0\text{ px/s}^2$
* All obstacle movement vectors are calculated relative to $V_{\text{world}}(t)$.

---

# Room Management & WebSocket State Schema

Each game room instance runs isolated state buffers inside `app/game/room_manager.py`.

### 1. In-Memory Room Instance (`GameRoom`)

```python
class GameRoom:
    def __init__(self, room_id: str, admin_id: str):
        self.room_id: str = room_id          # Unique 6-character room code
        self.admin_id: str = admin_id        # Player ID of the room creator
        self.state: str = "LOBBY"            # LOBBY, COUNTDOWN, RUNNING, ENDED
        self.created_at: float = time.time()
        
        # Player map: player_id -> index in NumPy buffers
        self.player_indices: dict[str, int] = {}
        self.connections: dict[str, WebSocket] = {}
        
        # Physics state buffers (Allocated per room)
        self.max_players = 16
        self.pos_x = np.zeros(16, dtype=np.float32)
        self.pos_y = np.full(16, 400.0, dtype=np.float32)
        self.vel_x = np.zeros(16, dtype=np.float32)
        self.vel_y = np.zeros(16, dtype=np.float32)
        self.is_alive = np.ones(16, dtype=bool)
        self.scores = np.zeros(16, dtype=np.float32)
        self.color_ids = np.zeros(16, dtype=np.int32)

```

---

# Network Protocol & Data Structures (Socket Arrays)

To minimize latency and network serialization overhead, the server uses direct array payloads over WebSockets instead of key-value JSON objects.

### 1. Inbound Client Payload (Client $\rightarrow$ Server)

Sent over WebSocket whenever a player triggers an action.

```json
[
  "ACTION_TYPE", 
  "ROOM_ID", 
  "PLAYER_ID"
]

```

* **Example Jump Input**: `["JUMP", "RM7X2A", "usr_991"]`
* **Example Start Game (Admin Only)**: `["START_GAME", "RM7X2A", "usr_991"]`

---

### 2. Outbound Broadcast Snapshot Array (Server $\rightarrow$ Client)

Broadcasting runs at **30 Hz** during the `RUNNING` state.

#### Flat Array Structure (JSON Option)

```json
{
  "r": "RM7X2A",
  "s": "RUNNING",
  "t": 1042,
  "v": 345.2,
  "p": [
    [0, "usr_991", 102.4, 380.1, 1, 104.2, 0],
    [1, "usr_882", 100.0, 400.0, 0, 88.0, 1]
  ],
  "o": [
    [101, 650.2, 400.0, 30.0, 50.0],
    [102, 920.0, 400.0, 20.0, 40.0]
  ]
}

```

#### Payload Field Breakdown

| Key | Description | Type | Detail |
| --- | --- | --- | --- |
| **`r`** | Room ID | `string` | Unique 6-character room code |
| **`s`** | Room State | `string` | `"LOBBY"`, `"COUNTDOWN"`, `"RUNNING"`, or `"ENDED"` |
| **`t`** | Current Tick | `integer` | Incremental tick sequence count |
| **`v`** | World Speed | `float` | Current dynamic ground speed ($V_{\text{world}}$) |
| **`p`** | Players Array | `array` | List of player state vectors (see schema below) |
| **`o`** | Obstacles Array | `array` | List of active obstacle vectors (see schema below) |

#### Player Vector Schema (`p[i]`)

`[index, player_id, pos_x, pos_y, is_alive, score, color_id]`

* `index` (`int`): Room slot index ($0$ to $15$).
* `player_id` (`string`): Unique user identifier.
* `pos_x` (`float`): Render X-coordinate (interpolated by client).
* `pos_y` (`float`): Render Y-coordinate (interpolated by client).
* `is_alive` (`int`): `1` if alive, `0` if dead (collided with obstacle).
* `score` (`float`): Current distance traveled.
* `color_id` (`int`): Color index assigned to the dinosaur sprite.

#### Obstacle Vector Schema (`o[j]`)

`[obstacle_id, pos_x, pos_y, width, height]`

* `obstacle_id` (`int`): Unique entity ID for client sprite association.
* `pos_x` (`float`): X-coordinate of obstacle.
* `pos_y` (`float`): Y-coordinate of obstacle.
* `width` (`float`): Collision box width.
* `height` (`float`): Collision box height.

---

### 3. Binary Byte Optimization (Raw Float32 Buffer Option)

For maximum performance bypassing JSON parsing entirely, the server packs physics matrices into a contiguous **`Float32Array` buffer**:

```
Byte Offset:   0       4       8       12      16      20      24      28 ...
Header Info:  [ROOM_HASH, TICK_NO, STATE_ID, WORLD_SPEED]
Player 0:     [SLOT_ID, POS_X,  POS_Y,  IS_ALIVE, SCORE,  COLOR_ID]
Player 1:     [SLOT_ID, POS_X,  POS_Y,  IS_ALIVE, SCORE,  COLOR_ID]
Obstacles:    [OBS_ID,  POS_X,  POS_Y,  WIDTH,    HEIGHT]

```

```python
# Server Python Packaging (physics.py)
header = np.array([room_hash_int, tick_counter, state_enum, current_world_speed], dtype=np.float32)
player_data = np.column_stack((indices, pos_x, pos_y, is_alive, scores, color_ids)).astype(np.float32)

# Single contiguous binary payload
binary_payload = np.concatenate([header, player_data.flatten()]).tobytes()
await websocket.send_bytes(binary_payload)

```

# Folder Structure

```plaintext
dino-game-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI entry point, middleware & CORS configuration
│   ├── config.py                # System constants (TICK_RATE, GRAVITY, DRAG, GROUND_Y)
│   ├── database.py              # SQLite setup & AIOSQLite connection pool
│   │
│   ├── api/                     # REST Endpoints (HTTP)
│   │   ├── __init__.py
│   │   ├── auth.py              # Auth routes & session validation
│   │   ├── rooms.py             # HTTP room creation & listing
│   │   └── leaderboard.py       # Global high-scores API
│   │
│   ├── websockets/              # Real-Time WebSocket Infrastructure
│   │   ├── __init__.py
│   │   ├── connection_manager.py# Manages connected websockets per room
│   │   └── router.py            # /ws/{room_code}/{player_id} endpoint
│   │
│   ├── game/                    # Core Engine & Physics Simulation
│   │   ├── __init__.py
│   │   ├── room_manager.py      # Room lifecycle registry
│   │   ├── state_machine.py     # State handling (LOBBY, COUNTDOWN, RUNNING, ENDED)
│   │   ├── physics.py           # NumPy float32 physics vector routines
│   │   ├── obstacles.py         # Obstacle spawning & movement calculations
│   │   └── collisions.py        # AABB bounding box collision checks
│   │
│   ├── models/                  # Database Schemas & Pydantic Data Models
│   │   ├── __init__.py
│   │   ├── user.py              # User account & authentication schema
│   │   └── match.py             # Match history & score leaderboard schemas
│   │
│   └── utils/                   # Payload & Binary Serialization Tools
│       ├── __init__.py
│       └── serializer.py        # Converts NumPy arrays to flat JSON or Float32Array bytes
│
├── data/
│   └── game.db                  # Persistent SQLite database file
├── tests/                       # Unit tests for game logic, math, and socket connections
├── requirements.txt             # fastapi, uvicorn, numpy, aiosqlite
└── .env                         # Server port, environment variables, secret keys

```