import React from 'react';

interface StatsPanelProps {
  cpuRunning: boolean;
  gpuRunning: boolean;
  cpuIntensity: number;
  fps: number;
  elapsedTime: number;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  cpuRunning,
  gpuRunning,
  cpuIntensity,
  fps,
  elapsedTime
}) => {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', rowGap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.8em', opacity: 0.6 }}>ACTIVE THREADS</div>
        <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{cpuRunning ? Math.round(cpuIntensity) : 0}</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.8em', opacity: 0.6 }}>FPS</div>
        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: fps < 30 ? '#ef4444' : fps < 50 ? '#facc15' : 'inherit' }}>
          {fps}
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.8em', opacity: 0.6 }}>ELAPSED TIME</div>
        <div style={{ fontSize: '1.5em', fontWeight: 'bold', fontFamily: 'monospace' }}>
          {formatTime(elapsedTime)}
        </div>
      </div>
      <div style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
        <div style={{ fontSize: '0.8em', opacity: 0.6 }}>STATUS</div>
        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: (cpuRunning || gpuRunning) ? '#fca5a5' : '#86efac' }}>
          {cpuRunning || gpuRunning ? 'TESTING' : 'IDLE'}
        </div>
      </div>
    </div>
  );
};
