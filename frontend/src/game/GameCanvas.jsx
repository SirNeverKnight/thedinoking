import React, { useEffect, useRef } from 'react';
import { createPixiApp } from './pixiApp';
import { socketService } from '../services/socket';
import { soundService } from '../services/sound';

export default function GameCanvas({ onSnapshotRef }) {
  const containerRef = useRef(null);
  const pixiRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Pixi application
    const pixiInstance = createPixiApp(containerRef.current);
    pixiRef.current = pixiInstance;

    // Pass snapshot listener callback up to parent
    if (onSnapshotRef) {
      onSnapshotRef.current = (snapshot) => {
        pixiInstance.gameTicker.onSnapshot(snapshot);
      };
    }

    const triggerJumpAction = () => {
      socketService.sendJump();
      soundService.playJump();
    };

    // Keydown Listener (Spacebar or Up Arrow)
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        triggerJumpAction();
      }
    };

    // Touch / Click Tap Listener for Mobile and Mouse
    const handleTap = (e) => {
      e.preventDefault();
      triggerJumpAction();
    };

    window.addEventListener('keydown', handleKeyDown);
    const canvasElement = containerRef.current;
    if (canvasElement) {
      canvasElement.addEventListener('touchstart', handleTap, { passive: false });
      canvasElement.addEventListener('mousedown', handleTap);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (canvasElement) {
        canvasElement.removeEventListener('touchstart', handleTap);
        canvasElement.removeEventListener('mousedown', handleTap);
      }
      pixiInstance.destroy();
      pixiRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: '1000px',
        aspectRatio: '2 / 1',
        maxHeight: '60vh',
        border: '4px solid #000',
        borderRadius: '12px',
        boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    />
  );
}
