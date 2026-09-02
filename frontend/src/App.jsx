import React, { useState, useEffect, useRef } from 'react';
import CharacterCreate from './components/Auth/CharacterCreate';
import SettingsModal from './components/Auth/SettingsModal';
import GameMenu from './components/Lobby/GameMenu';
import RoomLobby from './components/Lobby/RoomLobby';
import CountdownOverlay from './components/Lobby/CountdownOverlay';
import LeaderboardTable from './components/Leaderboard/LeaderboardTable';
import GameCanvas from './game/GameCanvas';
import { registerGuest, createRoom, joinRoom } from './services/api';
import { socketService } from './services/socket';
import { soundService } from './services/sound';

export default function App() {
  const [view, setView] = useState('CHARACTER_CREATE'); // CHARACTER_CREATE, GAME_MENU, ROOM_LOBBY, PLAYING
  const [showSettings, setShowSettings] = useState(false);
  
  // User Profile
  const [user, setUser] = useState(null);
  
  // Room State
  const [roomCode, setRoomCode] = useState('');
  const [adminId, setAdminId] = useState('');
  const [players, setPlayers] = useState([]);
  const [roomState, setRoomState] = useState('LOBBY');
  const [countdown, setCountdown] = useState(3);
  const [winner, setWinner] = useState(null);

  const snapshotRef = useRef(null);

  // Setup WebSocket Listeners
  useEffect(() => {
    socketService.onMessage((msg) => {
      // 30 Hz Physics Snapshot Payload
      if (msg.r && msg.s && msg.p) {
        if (snapshotRef.current) {
          snapshotRef.current(msg);
        }
        // Update live player scores from snapshot
        setPlayers((prevPlayers) => {
          const updated = [...prevPlayers];
          msg.p.forEach(([slot, pId, name, pX, pY, isAlive, score, colorId]) => {
            const idx = updated.findIndex((p) => p.user_id === pId);
            if (idx >= 0) {
              updated[idx] = {
                ...updated[idx],
                score,
                is_alive: isAlive === 1,
              };
            } else {
              updated.push({
                user_id: pId,
                username: name,
                color_id: colorId,
                score,
                is_alive: isAlive === 1,
              });
            }
          });
          return updated;
        });
        return;
      }

      // Event Messages
      if (msg.type === 'LOBBY_UPDATE') {
        setRoomCode(msg.room_code);
        setAdminId(msg.admin_id);
        setRoomState(msg.state);
        setPlayers(msg.players || []);
      } else if (msg.type === 'COUNTDOWN') {
        setRoomState('COUNTDOWN');
        setCountdown(msg.value);
        if (msg.players) setPlayers(msg.players);
      } else if (msg.type === 'GAME_START') {
        setRoomState('RUNNING');
        setView('PLAYING');
        if (msg.players) setPlayers(msg.players);
        soundService.startBGM();
      } else if (msg.type === 'GAME_OVER') {
        setRoomState('ENDED');
        setWinner(msg.winner);
        if (msg.leaderboard) setPlayers(msg.leaderboard);
        soundService.stopBGM();
        soundService.playCollision();
      } else if (msg.type === 'ROOM_CLOSED') {
        alert(msg.message || 'Room was closed by the host.');
        socketService.disconnect();
        setView('GAME_MENU');
        setRoomCode('');
        setAdminId('');
        setPlayers([]);
        setRoomState('LOBBY');
      }
    });

    return () => {
      soundService.stopBGM();
      socketService.disconnect();
    };
  }, []);

  // Character Confirmation Handler
  const handleCharacterConfirm = async (username, colorId) => {
    try {
      const registered = await registerGuest(username, colorId);
      setUser(registered);
      setView('GAME_MENU');
    } catch (err) {
      console.error('Failed to register user:', err);
    }
  };

  // Create Room Handler
  const handleCreateRoom = async () => {
    if (!user) return;
    try {
      const roomData = await createRoom(user.user_id, user.username, user.color_id);
      setRoomCode(roomData.room_code);
      setAdminId(roomData.admin_id);
      setRoomState(roomData.state);
      setPlayers(roomData.players || []);

      socketService.connect(roomData.room_code, user.user_id);
      setView('ROOM_LOBBY');
    } catch (err) {
      alert('Error creating room: ' + err.message);
    }
  };

  // Join Room Handler
  const handleJoinRoom = async (code) => {
    if (!user) return;
    try {
      const roomData = await joinRoom(code, user.user_id, user.username, user.color_id);
      setRoomCode(roomData.room_code);
      setAdminId(roomData.admin_id);
      setRoomState(roomData.state);
      setPlayers(roomData.players || []);

      socketService.connect(roomData.room_code, user.user_id);
      setView('ROOM_LOBBY');
    } catch (err) {
      alert('Cannot join room: ' + err.message);
    }
  };

  const handleStartGame = () => {
    socketService.sendStartGame();
  };

  const handleLeaveRoom = () => {
    socketService.disconnect();
    setView('GAME_MENU');
  };

  return (
    <div className="app-container">
      {/* Settings Modal Overlay */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* START MENU */}
      {view === 'CHARACTER_CREATE' && (
        <CharacterCreate
          onConfirm={handleCharacterConfirm}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* GAME MENU */}
      {view === 'GAME_MENU' && (
        <GameMenu
          user={user}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onChangeCharacter={() => setView('CHARACTER_CREATE')}
        />
      )}

      {/* ROOM LOBBY */}
      {view === 'ROOM_LOBBY' && roomState === 'LOBBY' && (
        <RoomLobby
          roomCode={roomCode}
          players={players}
          adminId={adminId}
          currentUserId={user?.user_id}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {/* 3-SECOND COUNTDOWN OVERLAY */}
      {roomState === 'COUNTDOWN' && (
        <CountdownOverlay count={countdown} />
      )}

      {/* ACTIVE GAME CANVAS & LEADERBOARD */}
      {(view === 'PLAYING' || roomState === 'RUNNING' || roomState === 'ENDED') && (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="game-header">
            <div className="game-title">🦕 THE DINO KING</div>
            <div style={{ fontSize: '0.7rem', color: '#555' }}>
              Press <strong>SPACEBAR</strong> or <strong>TAP SCREEN</strong> to Jump!
            </div>
          </div>

          <GameCanvas onSnapshotRef={snapshotRef} />

          <LeaderboardTable
            players={players}
            isGameOver={roomState === 'ENDED'}
            winner={winner}
            onPlayAgain={() => {
              setRoomState('LOBBY');
              setView('ROOM_LOBBY');
            }}
            onBackToMenu={handleLeaveRoom}
          />
        </div>
      )}
    </div>
  );
}
