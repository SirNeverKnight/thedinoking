import React, { useState } from 'react';
import { Copy, Check, Play, LogOut, Users } from 'lucide-react';
import { getDinoColorHex } from '../../game/utils/lerp';

export default function RoomLobby({ roomCode, players, adminId, currentUserId, onStartGame, onLeaveRoom }) {
  const [copied, setCopied] = useState(false);
  const isAdmin = currentUserId === adminId;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overlay-container">
      <div className="card" style={{ maxWidth: '480px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 className="card-title" style={{ margin: 0, marginBottom: '6px' }}>Game Lobby</h2>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#e0e0e0', padding: '6px 12px', borderRadius: '6px', border: '2px solid #000' }}>
            <span style={{ fontSize: '0.9rem', letterSpacing: '2px' }}>CODE: <strong>{roomCode}</strong></span>
            <button
              onClick={handleCopyCode}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="Copy Room Code"
            >
              {copied ? <Check size={16} color="green" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'left', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', marginBottom: '10px' }}>
            <Users size={16} /> Connected Players ({players.length}/16):
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
            {players.map((p) => (
              <div
                key={p.user_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px',
                  border: '2px solid #000',
                  borderRadius: '6px',
                  background: '#fff',
                  fontSize: '0.7rem',
                }}
              >
                <div
                  className="dino-badge"
                  style={{ backgroundColor: getDinoColorHex(p.color_id) }}
                />
                <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {p.username} {p.user_id === currentUserId ? '(You)' : ''}
                </span>
                {p.is_admin && (
                  <span style={{ fontSize: '0.55rem', background: 'var(--accent-color)', color: '#fff', padding: '2px 4px', borderRadius: '4px' }}>
                    HOST
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={onLeaveRoom} style={{ flex: 1 }}>
            <LogOut size={16} /> Leave
          </button>

          {isAdmin ? (
            <button className="btn btn-primary" onClick={onStartGame} style={{ flex: 2 }}>
              <Play size={18} /> Start Game
            </button>
          ) : (
            <div style={{ flex: 2, fontSize: '0.65rem', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Waiting for room host to start...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
