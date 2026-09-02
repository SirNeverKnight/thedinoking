import React, { useState } from 'react';
import { Volume2, VolumeX, X } from 'lucide-react';
import { soundService } from '../../services/sound';

export default function SettingsModal({ onClose }) {
  const [volume, setVolume] = useState(
    parseInt(localStorage.getItem('dino_volume') || '80', 10)
  );

  const handleVolumeChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    soundService.setVolume(val);
  };

  return (
    <div className="overlay-container">
      <div className="card" style={{ maxWidth: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="card-title" style={{ margin: 0 }}>Game Settings</h3>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '6px' }}>
            <X size={16} />
          </button>
        </div>

        <div className="input-group">
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {volume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />} Audio Volume: {volume}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            style={{ width: '100%', accentColor: 'var(--primary-color)', cursor: 'pointer' }}
          />
        </div>

        <div style={{ marginTop: '20px' }}>
          <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
