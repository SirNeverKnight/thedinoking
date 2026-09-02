# Prerequsite

The Dino King : Infinite Runner 2D Game with multiplayer

is a game similar to chrome dino but with a lot of changes.

# Game nature
Multi client and multiplayer

# Game Features
 - Game rooms where only the room creator can start game and it start in every connected player to that room
 - A live leader board that shows the scores in realtime and also updates in realtime
 - Pysics simulation : The game simulates accelartion, friction, jump trajectory and collision
 - Multiple room can be there
 - Can work on mobile and pc

# Technology
 - Python for backend and game engine
 - React.js for frontend and game cleint

# Libaries used
- Backend Requirements (Python):
    - Python 3.10 or higher
    - FastAPI 
    - Uvicorn 
    - NumPy 
    - Asyncio
    - SQLite3
    - AIOSQLite

- Frontend Requirements (JavaScript):
    - Node.js
    - React.js
    - Pixi.js
    - Native WebSocket Browser API

# Architecture of the game
Game Architecture:
- Server-Authoritative Physics (Calculates speed, acceleration, gravity, drag, and collision box checks on backend)
- Fixed Game Tick Timer (30 Hz loop on server broadcasting player state snapshots)
- Client-Side Linear Interpolation / LERP (Smooths 30 Hz server network ticks into 60 FPS visual rendering on Pixi canvas)
- Axis-Aligned Bounding Box / AABB Math (Simple 2D rectangle intersection checks on backend)
- Room State Machine (Lobby, 3-second Countdown, Active Game, Player Death tracking)

