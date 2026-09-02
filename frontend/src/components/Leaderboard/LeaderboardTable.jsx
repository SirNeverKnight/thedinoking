import React from 'react';
import { Trophy, Skull, Heart } from 'lucide-react';
import { getDinoColorHex } from '../../game/utils/lerp';

export default function LeaderboardTable({ players, isGameOver, winner, onPlayAgain, onBackToMenu }) {
  // Sort players descending by score
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  if (isGameOver) {
    return (
      <div className="overlay-container">
        <div className="card" style={{ maxWidth: '500px' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <Trophy size={48} color="#FFD700" style={{ filter: 'drop-shadow(3px 3px 0px #000)' }} />
            <h2 className="card-title" style={{ marginTop: '8px' }}>MATCH OVER</h2>
            {winner && (
              <p style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>
                🎉 Winner: <strong>{winner.username}::</strong> ({winner.score} pts)
              </p>
            )}
          </div>

          <div style={{ textAlign: 'left', marginBottom: '20px', maxHeight: '220px', overflowY: 'auto' }}>
            <div style={{ fontSize: '0.7rem', borderBottom: '2px solid #000', paddingBottom: '4px', marginBottom: '8px' }}>
              Final Standings:
            </div>
            {sortedPlayers.map((p, idx) => (
              <div
                key={p.user_id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  padding: '6px 10px',
                  background: idx === 0 ? 'rgba(255, 215, 0, 0.2)' : '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  marginBottom: '4px',
                  fontSize: '0.7rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: '24px', fontWeight: 'bold' }}>#{idx + 1}</span>
                  <div className="dino-badge" style={{ backgroundColor: getDinoColorHex(p.color_id) }} />
                  <span>{p.username}</span>
                </div>
                  ::
                <div style={{ fontWeight: 'bold' }}>{Math.round(p.score || 0)} pts</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={onBackToMenu} style={{ flex: 1 }}>
              Menu
            </button>
            <button className="btn btn-primary" onClick={onPlayAgain} style={{ flex: 1 }}>
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-sidebar">
      <div className="leaderboard-title">
        🏆 LEADERBOARD
      </div>
      {sortedPlayers.map((p, idx) => (
        <div
          key={p.user_id || idx}
          className={`leaderboard-row ${p.is_alive ? 'alive' : 'dead'}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <div
              className="dino-badge"
              style={{ backgroundColor: getDinoColorHex(p.color_id) }}
            />
            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '90px', fontSize: '0.65rem' }}>
              {p.username}
            </span>
          </div>

          <div style={{ fontWeight: 'bold', fontSize: '0.65rem' }}>
            {Math.round(p.score || 0)} pts
          </div>
        </div>
      ))}
    </div>
  );
}
