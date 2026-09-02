import React, { useState } from 'react';
import { Settings, Play, Shield } from 'lucide-react';
import { DINO_COLOR_HEXES } from '../../game/utils/lerp';

export default function CharacterCreate({ onConfirm, onOpenSettings }) {
  const [username, setUsername] = useState(localStorage.getItem('dino_username') || 'DinoMaster');
  const [selectedColor, setSelectedColor] = useState(
    parseInt(localStorage.getItem('dino_color') || '0', 10)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    localStorage.setItem('dino_username', username);
    localStorage.setItem('dino_color', selectedColor.toString());
    onConfirm(username.trim(), selectedColor);
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="card-title" style={{ margin: 0 }}>Create Character</h2>
        <button
          className="btn btn-secondary"
          onClick={onOpenSettings}
          style={{ padding: '8px', borderRadius: '50%' }}
          title="Audio & Settings"
        >
          <Settings size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Dino Runner Name</label>
          <input
            type="text"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={15}
            placeholder="Enter your nickname"
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Select Dino Color</label>
          <div className="color-picker-grid">
            {DINO_COLOR_HEXES.map((hex, idx) => (
              <div
                key={idx}
                className={`color-swatch ${selectedColor === idx ? 'selected' : ''}`}
                style={{ backgroundColor: hex }}
                onClick={() => setSelectedColor(idx)}
              />
            ))}
          </div>
        </div>

        <div style={{ marginTop: '24px' }}>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            <Play size={18} /> Enter Game Menu
          </button>
        </div>
      </form>
    </div>
  );
}
