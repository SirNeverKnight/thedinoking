 **Prerequsite.md**, **Client.md**, and **Server.md** architecture documents cover the real-time requirements thoroughly. However, a few architectural edge cases and physics gaps will cause bugs during implementation if not addressed now.

Below are key improvements and refinements to add to your documentation.

---

### 1. Physics & Movement Improvements

#### Fix the X-Axis "Drift" Problem

In your 60-degree jump design, you add a horizontal velocity impulse ($\text{vel}_x = 300.0\text{ px/s}$) to the player.

* **The Bug**: In a traditional side-scroller/Chrome Dino game, the world moves left while the player stays locked on the left side of the screen. If you change the player's world $\text{pos}_x$, the dino will physically move forward toward the right edge of the screen during a jump, reducing the player's reaction window for incoming obstacles.
* **The Fix**: Keep the jump trajectory as **purely relative**. Either:
1. Treat the horizontal velocity as an offset from the player's anchor point: $X_{\text{render}} = X_{\text{anchor}} + \Delta x_{\text{jump}}$. When landing, smoothly snap $\Delta x_{\text{jump}}$ back to $0$.
2. Apply the 60° vector strictly as an aesthetic visual arc on the frontend while using authoritative vertical physics ($Y$-axis) and dynamic obstacle speed ($X$-axis) on the backend.



#### Air-Time Scale with Dynamic Ground Speed

As world speed ($V_{\text{world}}$) scales up over time, obstacles travel faster toward the player. If gravity ($g$) and jump impulse ($V_0$) remain constant:

* **The Bug**: Late in the game, the player won't be able to clear wide obstacle clusters because their air time (hang time) stays fixed while ground speed accelerates.
* **The Fix**: Slightly scale horizontal jump speed or gravity resistance relative to $V_{\text{world}}$, or strictly regulate maximum obstacle group spacing on the backend based on current $V_{\text{world}}$.

---

### 2. Network & Synchronization Improvements

#### Add Room Code to Client Input Packet

Your inbound jump action schema is currently:

```json
["JUMP", "RM7X2A", "usr_991"]

```

* **Refinement**: Since a WebSocket connection is already bound to a specific room endpoint (`/ws/{room_code}/{player_id}`), sending `ROOM_ID` and `PLAYER_ID` inside every jump frame creates unnecessary string parsing overhead.
* **Optimized Payload**: Bind `player_id` and `room_id` to the WebSocket session context in FastAPI upon handshake. The client only needs to send a single byte or minimal string action:
```json
["JUMP"]

```



#### Handle Client Disconnects During Active Physics Loops

* **Edge Case**: If a player closes their browser tab mid-game, their entry in the NumPy array remains `is_alive = True`. The game loop will hang forever waiting for all players to die before transitioning to `ENDED`.
* **Fix**: In `websockets/connection_manager.py`, register a `WebSocketDisconnect` event that immediately sets `is_alive[player_index] = False` and frees up the player slot index in the NumPy array.

---

### 3. Obstacle Generation Improvements

#### Deterministic Random Seed per Room

To guarantee that all players in a room see identical obstacle placement without streaming every tiny obstacle movement parameter over the network:

* **Implementation**: When `START_GAME` is triggered, the server generates a single `room_seed = random.randint(1000, 9999)` and broadcasts it in the `GAME_START` frame.
* **Benefit**: The server and client use the same seed-based pseudo-random sequence to determine obstacle types and spawn intervals, reducing the network payload size.

---

### 4. Consolidated Requirements Checklist (`Requirements_Final.md`)

```plaintext
Backend Stack:
- Python 3.10+
- FastAPI & Uvicorn (ASGI Web Server & WebSockets)
- NumPy (np.float32 contiguous memory physics arrays)
- Asyncio (30 Hz non-blocking tick task loop)
- SQLite3 + AIOSQLite (Async persistence for accounts & high scores)

Frontend Stack:
- React.js (Lobby UI, overlays, room management)
- Pixi.js (WebGL hardware-accelerated 2D canvas renderer)
- Native Browser WebSocket API

Architectural Blueprint:
- Server-Authoritative Physics (Vectorized jump math, dynamic speed scaling, AABB collision checks)
- Fixed 30 Hz Server Tick Broadcast
- Client-Side LERP (Interpolates 30 Hz server snapshots to 60 FPS Pixi.js canvas)
- State Machine (LOBBY -> COUNTDOWN (3s) -> RUNNING -> ENDED)
- Binary Array Payload (Flat array structure to eliminate JSON key serialization overhead)

```