# Game UI and workflow (Client)
## Start menu
### UI
- player can see two options 
- Character creation
    - Change dino color
    - Name
    - Player id(Auto generated) 
- Settings
    - volume setting

### Wokflow
- Player can create new character
- Player can change volume of the game via slider
 
## Game menu: 
### UI
- can see two options 
1. Create a Room
    - this option creates a room and provides a copiable code that can be shared to every other player
2. Join a room
    - Player can join a room via valid room code

### workflow
- the room creator can see start button and conncetd palyes (center screen overlay background blurr)
- others only see conncted player with their dino color (center screen overlay background blurr)
- no two player have same colour dino , change dino automatically

## Game Lobby:
## UI
- Leaderboard
    - show leaderboard on right hand side
        - on pc show :  name, logo, current score, dead/alive(grenn/red)
        - on mobile : just name and score smaller font
- The game starts after 1... 2... 3... (3 seconnd delay)
- The game running state
    - shows live updating leader board number players going up and down based who has heighest score. The scores are sorted in decending order
    - when player hits tree and game over. his profile becomes red. the leader board comes to center (center screen overlay background blurr) and he only see updating score

## Workflow
- The desktop variant takes Space bar button input
- mobile variant takes screen tap
- game runs until last player game is over

# Game play Ui
- SIMILAR TO chrome dino game but with coloured dino
- After 3 second counts the dino starts running at the same place on the left
- the land and sprites are spawned in random space on the land and it moves from right to left

# Technology
- React.js 
    - Standard UI components and buttons
- Pixie.js
    - Game box, realtime leader board

# Folder structure
```plaintext

dino-game-frontend/
├── public/
│   └── assets/                  # Static textures, sprites, audio files (if any)
│
├── src/
│   ├── index.js                 # React root DOM renderer
│   ├── App.jsx                  # Main application router / view switcher
│   ├── styles/                  # Global CSS / UI styling
│   │   └── main.css
│   │
│   ├── components/              # Standard React UI Overlay Components
│   │   ├── Auth/                # Login / Signup forms
│   │   │   └── LoginForm.jsx
│   │   ├── Lobby/               # Room selection, player list, "Start Game" button
│   │   │   ├── RoomList.jsx
│   │   │   ├── RoomLobby.jsx
│   │   │   └── CountdownOverlay.jsx
│   │   └── Leaderboard/
│   │       └── LeaderboardTable.jsx
│   │
│   ├── game/                    # High-Performance PixiJS Engine Logic
│   │   ├── GameCanvas.jsx       # React wrapper component hosting the <canvas>
│   │   ├── pixiApp.js           # PixiJS Application instance setup & lifecycle
│   │   ├── ticker.js            # 60 FPS loop, LERP calculation for snapshots
│   │   ├── sprites/             # Sprite creation & pool management
│   │   │   ├── PlayerSprite.js
│   │   │   └── ObstacleSprite.js
│   │   └── utils/
│   │       └── lerp.js          # Linear interpolation formula helper
│   │
│   ├── services/                # Networking & API Layer
│   │   ├── api.js               # REST API fetch calls (Auth, Rooms, High Scores)
│   │   └── socket.js            # WebSocket client wrapper (handles binary/array parsing)
│   │
│   └── hooks/                   # Custom React Hooks
│       ├── useAuth.js           # User session management
│       └── useGameSocket.js     # Manages socket connection lifetime & state refs
│
├── package.json                 # react, pixi.js, react-dom
└── vite.config.js               # Vite or Webpack configuration

```

# Storage
 - user setting and metadata can be stored in LocalStorage