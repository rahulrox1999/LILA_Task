import React, { useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface TimelineControlsProps {
  durationMs: number;
  currentTimeMs: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onTimeChange: (timeMs: number) => void;
  onPlayPauseToggle: () => void;
  onSpeedChange: (speed: number) => void;
  onReset: () => void;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  durationMs,
  currentTimeMs,
  isPlaying,
  playbackSpeed,
  onTimeChange,
  onPlayPauseToggle,
  onSpeedChange,
  onReset,
}) => {
  // Animation loop for timeline playback
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (lastTimestamp !== null && isPlaying) {
        const delta = timestamp - lastTimestamp;
        const newTime = currentTimeMs + delta * playbackSpeed;
        if (newTime >= durationMs) {
          onTimeChange(durationMs);
          if (isPlaying) onPlayPauseToggle(); // Auto pause at end
        } else {
          onTimeChange(newTime);
        }
      }
      lastTimestamp = timestamp;
      if (isPlaying) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(step);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying, currentTimeMs, durationMs, playbackSpeed]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '16px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onPlayPauseToggle}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: '#38bdf8',
              color: '#0f172a',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <button
            onClick={onReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              background: 'var(--bg-main)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={14} />
            Reset
          </button>

          {/* Speed selector */}
          <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
            {[1, 2, 5, 10].map((speed) => (
              <button
                key={speed}
                onClick={() => onSpeedChange(speed)}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  background: playbackSpeed === speed ? '#38bdf8' : 'transparent',
                  color: playbackSpeed === speed ? '#0f172a' : 'var(--text-main)',
                  fontWeight: playbackSpeed === speed ? 700 : 400,
                  cursor: 'pointer'
                }}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontFamily: 'monospace', fontSize: '14px', color: 'var(--text-main)' }}>
          {formatTime(currentTimeMs)} / {formatTime(durationMs)}
        </div>
      </div>

      {/* Timeline Slider */}
      <input
        type="range"
        min={0}
        max={durationMs || 100}
        value={currentTimeMs}
        onChange={(e) => onTimeChange(Number(e.target.value))}
        style={{
          width: '100%',
          accentColor: '#38bdf8',
          cursor: 'pointer'
        }}
      />
    </div>
  );
};
