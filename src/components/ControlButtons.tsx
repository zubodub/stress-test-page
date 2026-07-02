import React from 'react';
import { Activity, Cpu, Monitor } from 'lucide-react';

interface ControlButtonsProps {
  cpuRunning: boolean;
  gpuRunning: boolean;
  onModeClick: (mode: 'cpu' | 'gpu' | 'both') => void;
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({
  cpuRunning,
  gpuRunning,
  onModeClick
}) => {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
      <button 
        className={`btn ${cpuRunning && !gpuRunning ? 'active pulse' : ''}`}
        onClick={() => onModeClick('cpu')}
        style={{ flex: '1 1 0', minWidth: 0, padding: '0.8rem 0.2rem', fontSize: '0.9em', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}
      >
        <Cpu size={20} />
        <span style={{ whiteSpace: 'nowrap' }}>CPU only</span>
      </button>

      <button 
        className={`btn ${!cpuRunning && gpuRunning ? 'active pulse' : ''}`}
        onClick={() => onModeClick('gpu')}
        style={{ flex: '1 1 0', minWidth: 0, padding: '0.8rem 0.2rem', fontSize: '0.9em', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}
      >
        <Monitor size={20} />
        <span style={{ whiteSpace: 'nowrap' }}>GPU only</span>
      </button>

      <button 
        className={`btn ${cpuRunning && gpuRunning ? 'active pulse' : ''}`}
        onClick={() => onModeClick('both')}
        style={{ flex: '1 1 0', minWidth: 0, padding: '0.8rem 0.2rem', fontSize: '0.9em', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}
      >
        <Activity size={20} />
        <span style={{ whiteSpace: 'nowrap' }}>CPU + GPU</span>
      </button>
    </div>
  );
};
