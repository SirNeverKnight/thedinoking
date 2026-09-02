import React, { useEffect } from 'react';
import { soundService } from '../../services/sound';

export default function CountdownOverlay({ count }) {
  useEffect(() => {
    soundService.playCountdown(count === 0);
  }, [count]);
  return (
    <div className="overlay-container" style={{ background: 'rgba(0, 0, 0, 0.6)' }}>
      <div
        style={{
          fontSize: '5rem',
          color: '#fff',
          fontFamily: 'var(--font-pixel)',
          textShadow: '6px 6px 0px #000',
          animation: 'pulse 0.8s infinite alternate',
        }}
      >
        {count > 0 ? count : 'GO!'}
      </div>
    </div>
  );
}
