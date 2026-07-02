import React from 'react';
import { Settings, Plus, Trash2, Play, Pause, Repeat, Infinity, Clock, SlidersHorizontal } from 'lucide-react';
import type { Preset, TestSequence } from '../types';

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
  duration: number;
  onDurationChange: (val: number) => void;
  sequence: TestSequence;
  onSequenceChange: (seq: TestSequence) => void;
}

const GradientLabel: React.FC<{
  icon: React.ReactNode,
  text: string,
  width: number,
  id: string
}> = ({ icon, text, width, id }) => (
  <svg width={width} height="20" viewBox={`0 0 ${width} 20`} style={{ display: 'block', margin: '0 auto' }}>
    <defs>
      <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="100%" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#c084fc" />
      </linearGradient>
    </defs>
    <g transform="translate(0, 2)">
      {React.cloneElement(icon as React.ReactElement, { stroke: `url(#grad-${id})` } as any)}
    </g>
    <text x="22" y="11" dominantBaseline="central" fill={`url(#grad-${id})`} fontSize="13.5" fontWeight="bold" fontFamily="inherit">{text}</text>
  </svg>
);

const TimeInput: React.FC<{ value: number, onChange: (val: number) => void, disabled?: boolean }> = ({ value, onChange, disabled }) => {
  const h = Math.floor(value / 3600);
  const m = Math.floor((value % 3600) / 60);
  const s = value % 60;

  const handleChange = (type: 'h' | 'm' | 's', val: string) => {
    let num = parseInt(val) || 0;
    if (type === 'h') num = Math.max(0, num);
    if (type === 'm') num = Math.max(0, Math.min(59, num));
    if (type === 's') num = Math.max(0, Math.min(59, num));

    let newTotal = value;
    if (type === 'h') newTotal = num * 3600 + m * 60 + s;
    if (type === 'm') newTotal = h * 3600 + num * 60 + s;
    if (type === 's') newTotal = h * 3600 + m * 60 + num;
    onChange(newTotal);
  };

  const inputStyle: React.CSSProperties = {
    width: '26px',
    background: 'transparent',
    color: 'inherit',
    border: 'none',
    padding: '0',
    outline: 'none',
    textAlign: 'center',
    fontVariantNumeric: 'tabular-nums',
    fontSize: '1.05em',
    fontWeight: '500',
    cursor: disabled ? 'not-allowed' : 'text'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.85em', opacity: 0.5, marginLeft: '2px', marginRight: '8px', fontWeight: 'bold'
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      background: 'rgba(0,0,0,0.3)', 
      border: '1px solid rgba(255,255,255,0.1)', 
      borderRadius: '0.4rem', 
      padding: '0.4rem 0.5rem',
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
      opacity: disabled ? 0.5 : 1,
      flex: 1,
      justifyContent: 'center'
    }}>
      <input type="number" min="0" value={h || ''} onChange={e => handleChange('h', e.target.value)} disabled={disabled} style={inputStyle} placeholder="0" />
      <span style={labelStyle}>h</span>
      
      <input type="number" min="0" max="59" value={m || ''} onChange={e => handleChange('m', e.target.value)} disabled={disabled} style={inputStyle} placeholder="0" />
      <span style={labelStyle}>m</span>
      
      <input type="number" min="0" max="59" value={s || ''} onChange={e => handleChange('s', e.target.value)} disabled={disabled} style={inputStyle} placeholder="0" />
      <span style={{...labelStyle, marginRight: 0}}>s</span>
    </div>
  );
};

export const PresetSettings: React.FC<PresetSettingsProps> = ({
  preset,
  cpuIntensity,
  gpuIntensity,
  cpuRunning,
  gpuRunning,
  maxCores,
  onPresetChange,
  onCpuChange,
  onGpuChange,
  duration,
  onDurationChange,
  sequence,
  onSequenceChange
}) => {
  const [isCustomDuration, setIsCustomDuration] = React.useState(false);

  const durationTabs = [
    { id: 'infinite', icon: <Infinity size={18} /> },
    { id: 'timer', icon: <Clock size={18} /> },
    { id: 'custom', icon: <SlidersHorizontal size={18} /> }
  ];

  const handleDurationSelect = (id: string) => {
    if (cpuRunning || gpuRunning) return;
    if (id === 'custom') {
      setIsCustomDuration(true);
      onDurationChange(-1); // -1 = custom sequence mode
    } else if (id === 'infinite') {
      setIsCustomDuration(false);
      onDurationChange(0);
    } else if (id === 'timer') {
      setIsCustomDuration(false);
      onDurationChange(duration > 0 ? duration : 600);
    }
  };

  let activeTab = 'infinite';
  if (isCustomDuration) activeTab = 'custom';
  else if (duration > 0) activeTab = 'timer';

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
          {(['low', 'medium', 'high', 'extreme', 'custom'] as Preset[]).map(p => {
            let label = '';
            if (p === 'low') label = 'LOW';
            if (p === 'medium') label = 'MED';
            if (p === 'high') label = 'HIGH';
            if (p === 'extreme') label = 'EXT';
            if (p === 'custom') label = 'CUST';

            return (
              <div
                key={p}
                onClick={() => {
                  if (!cpuRunning && !gpuRunning) {
                    onPresetChange(p);
                  }
                }}
                className={preset === p ? "tab-active" : ""}
                title={p.charAt(0).toUpperCase() + p.slice(1)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.4rem 0',
                  borderRadius: '0.4rem',
                  cursor: (cpuRunning || gpuRunning) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: (cpuRunning || gpuRunning) && preset !== p ? 0.5 : 1
                }}
              >
                <span className="preset-label" style={{ fontSize: '0.85em', fontWeight: preset === p ? 'bold' : 'normal' }}>
                  {label}
                </span>
              </div>
            );
          })}
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
          style={{ width: '100%', cursor: cpuRunning ? 'not-allowed' : 'pointer', '--val': `${((cpuIntensity - 1) / (maxCores * 4 - 1)) * 100}%` } as React.CSSProperties}
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
          style={{ width: '100%', cursor: gpuRunning ? 'not-allowed' : 'pointer', '--val': `${((gpuIntensity - 10) / (15000 - 10)) * 100}%` } as React.CSSProperties}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', opacity: 0.8 }}>
          <span>Test Duration</span>
        </div>
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '0.5rem',
          padding: '0.2rem',
          gap: '0.2rem',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {durationTabs.map(opt => (
            <div
              key={opt.id}
              onClick={() => handleDurationSelect(opt.id)}
              className={activeTab === opt.id ? "tab-active" : ""}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.4rem 0',
                borderRadius: '0.4rem',
                cursor: (cpuRunning || gpuRunning) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: (cpuRunning || gpuRunning) && activeTab !== opt.id ? 0.5 : 1
              }}
            >
              {opt.icon}
            </div>
          ))}
        </div>
        
        {activeTab === 'timer' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: '85px' }}>
              <GradientLabel id="label-duration" icon={<Clock size={16} />} text="Duration:" width={85} />
            </div>
            <TimeInput 
              value={duration} 
              onChange={(val) => onDurationChange(Math.max(1, val))} 
              disabled={cpuRunning || gpuRunning} 
            />
          </div>
        )}
        {isCustomDuration && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <div style={{ fontSize: '0.85em', opacity: 0.8, marginBottom: '0.2rem' }}>Custom Sequence</div>
            
            {sequence.blocks.map((block, index) => (
              <div key={block.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: '85px' }}>
                  <GradientLabel 
                    id={`list-${block.id}`}
                    icon={block.type === 'run' ? <Play size={16} /> : <Pause size={16} />} 
                    text={block.type === 'run' ? 'Run' : 'Cooldown'} 
                    width={85} 
                  />
                </div>
                
                <TimeInput
                  value={block.durationSeconds}
                  onChange={(val) => {
                    const newBlocks = [...sequence.blocks];
                    newBlocks[index].durationSeconds = Math.max(1, val);
                    onSequenceChange({ ...sequence, blocks: newBlocks });
                  }}
                  disabled={cpuRunning || gpuRunning}
                />
                

                <button
                  onClick={() => {
                    const newBlocks = sequence.blocks.filter((_, i) => i !== index);
                    onSequenceChange({ ...sequence, blocks: newBlocks });
                  }}
                  disabled={cpuRunning || gpuRunning}
                  style={{ background: 'transparent', border: 'none', color: 'inherit', opacity: 0.6, cursor: (cpuRunning || gpuRunning) ? 'not-allowed' : 'pointer', padding: '0.2rem' }}
                  onMouseEnter={(e) => {
                    if (!cpuRunning && !gpuRunning) e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.6';
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  onSequenceChange({
                    ...sequence,
                    blocks: [...sequence.blocks, { id: Math.random().toString(36).substr(2, 9), type: 'run', durationSeconds: 1800 }]
                  });
                }}
                disabled={cpuRunning || gpuRunning}
                className="btn-gradient"
                style={{ flex: 1 }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
                  <Plus size={16} /> <span style={{ fontWeight: 'bold' }}>Run</span>
                </div>
              </button>
              <button
                onClick={() => {
                  onSequenceChange({
                    ...sequence,
                    blocks: [...sequence.blocks, { id: Math.random().toString(36).substr(2, 9), type: 'cooldown', durationSeconds: 600 }]
                  });
                }}
                disabled={cpuRunning || gpuRunning}
                className="btn-gradient"
                style={{ flex: 1 }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
                  <Plus size={16} /> <span style={{ fontWeight: 'bold' }}>Cooldown</span>
                </div>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
              <div style={{ width: '75px' }}>
                <GradientLabel id="label-loops" icon={<Repeat size={16} />} text="Loops:" width={75} />
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: 'rgba(0,0,0,0.3)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '0.4rem', 
                padding: '0.4rem 0.5rem',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                opacity: (cpuRunning || gpuRunning) ? 0.5 : 1
              }}>
                <input
                  type="number"
                  min="0"
                  value={sequence.loops}
                  onChange={(e) => onSequenceChange({ ...sequence, loops: Math.max(0, Number(e.target.value)) })}
                  disabled={cpuRunning || gpuRunning}
                  style={{
                    width: '40px',
                    background: 'transparent',
                    color: 'inherit',
                    border: 'none',
                    padding: '0',
                    outline: 'none',
                    textAlign: 'center',
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: '1.05em',
                    fontWeight: '500',
                    cursor: (cpuRunning || gpuRunning) ? 'not-allowed' : 'text'
                  }}
                />
              </div>
              <span style={{ fontSize: '0.85em', opacity: 0.7 }}>(0 = Infinite)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
