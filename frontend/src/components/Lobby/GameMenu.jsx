import React, { useState, useEffect } from 'react';
import { PlusCircle, LogIn, RefreshCw, User } from 'lucide-react';
import { fetchActiveRooms } from '../../services/api';

export default function GameMenu({ user, onCreateRoom, onJoinRoom, onChangeCharacter }) {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [activeRooms, setActiveRooms] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadRooms = async () => {
    try {
      const data = await fetchActiveRooms();
      setActiveRooms(data.rooms || []);
    } catch (err) {
      console.error('Failed to load active rooms:', err);
    }
  };

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    setError('');
    onJoinRoom(roomCodeInput.trim().toUpperCase());
  };

  return (
    <div className="card" style={{ maxWidth: '520px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 className="card-title" style={{ margin: 0 }}>Game Menu</h2>
          <span style={{ fontSize: '0.65rem', color: '#666' }}>Playing as: <strong>{user.username}</strong></span>
        </div>
        <button className="btn btn-secondary" onClick={onChangeCharacter} style={{ fontSize: '0.7rem', padding: '8px' }}>
          <User size={14} /> Profile
        </button>
      </div>

      {error && <div style={{ color: 'red', fontSize: '0.7rem', marginBottom: '12px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <button
          className="btn btn-primary"
          onClick={onCreateRoom}
          style={{ flexDirection: 'column', padding: '16px', fontSize: '0.75rem' }}
        >
          <PlusCircle size={24} style={{ marginBottom: '6px' }} />
          Create Room
        </button>

        <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="ROOM CODE"
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            maxLength={6}
            style={{ textAlign: 'center', letterSpacing: '2px', fontSize: '0.85rem' }}
          />
          <button type="submit" className="btn btn-accent" style={{ padding: '10px', fontSize: '0.75rem' }}>
            <LogIn size={16} /> Join Room
          </button>
        </form>
      </div>

      <div style={{ borderTop: '2px dashed #000', paddingTop: '16px', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Active Lobbies</h3>
          <button className="btn btn-secondary" onClick={loadRooms} style={{ padding: '4px 8px', fontSize: '0.65rem' }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {activeRooms.length === 0 ? (
          <p style={{ fontSize: '0.7rem', color: '#777', textAlign: 'center', padding: '12px 0' }}>
            No active public rooms right now. Create one!
          </p>
        ) : (
          <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
            {activeRooms.map((r) => (
              <div
                key={r.room_code}
                style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  marginBottom: '6px',
                  fontSize: '0.7rem',
                  background: '#fff',
                }}
              >
                <div>
                  <strong>Code: {r.room_code}</strong>
                  <div style={{ fontSize: '0.6rem', color: '#666' }}>Host: {r.admin_name}</div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => onJoinRoom(r.room_code)}
                  style={{ padding: '6px 12px', fontSize: '0.65rem' }}
                >
                  Join ({r.player_count}/{r.max_players})
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
