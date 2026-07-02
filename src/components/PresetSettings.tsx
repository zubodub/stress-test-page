import React from 'react';
import { Settings } from 'lucide-react';
import type { Preset } from '../types';

interface PresetSettingsProps {
  preset: Preset;
  cpuIntensity: number;
  gpuIntensity: number;
  cpuRunning: boolean;
  gpuRunning: boolean;
  maxCores: number;
  onPresetChange: (preset: Preset) => void;
  onCpuChange: (val: number) => void;
  onGpuChange: (val: number) => void;
}

export const PresetSettings: React.FC<PresetSettingsProps> = ({
  preset,
  cpuIntensity,
  gpuIntensity,
  cpuRunning,
  gpuRunning,
  maxCores,
  onPresetChange,
  onCpuChange,
  onGpuChange
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={20} style={{ opacity: 0.7 }} />
          <label style={{ fontWeight: 'bold' }}>Preset</label>
        </div>
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '0.5rem',
          padding: '0.2rem',
          gap: '0.2rem',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {(['low', 'medium', 'high', 'extreme', 'custom'] as Preset[]).map(p => (
            <div
              key={p}
              onClick={() => {
                if (!cpuRunning && !gpuRunning) {
                  onPresetChange(p);
                }
              }}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '0.4rem 0',
                borderRadius: '0.4rem',
                fontSize: '0.85em',
                fontWeight: preset === p ? 'bold' : 'normal',
                cursor: (cpuRunning || gpuRunning) ? 'not-allowed' : 'pointer',
                background: preset === p ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
                color: preset === p ? '#60a5fa' : 'inherit',
                transition: 'all 0.2s',
                opacity: (cpuRunning || gpuRunning) && preset !== p ? 0.5 : 1
              }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', opacity: 0.8 }}>
          <span>CPU Intensity (Workers)</span>
          <span style={{ fontWeight: 'bold' }}>{Math.round(cpuIntensity)} threads</span>
        </div>
        <input
          type="range"
          min="1"
          max={maxCores * 4}
          step="any"
          value={cpuIntensity}
          onChange={(e) => onCpuChange(Number(e.target.value))}
          disabled={cpuRunning}
          style={{ width: '100%', cursor: cpuRunning ? 'not-allowed' : 'pointer' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', opacity: 0.8 }}>
          <span>GPU Intensity (Loop Size)</span>
          <span style={{ fontWeight: 'bold' }}>{Math.round(gpuIntensity)} ops</span>
        </div>
        <input
          type="range"
          min="10"
          max="15000"
          step="any"
          value={gpuIntensity}
          onChange={(e) => onGpuChange(Number(e.target.value))}
          disabled={gpuRunning}
          style={{ width: '100%', cursor: gpuRunning ? 'not-allowed' : 'pointer' }}
        />
      </div>
    </div>
  );
};
