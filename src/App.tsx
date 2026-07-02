import { useEffect, useRef, useState } from 'react';
import { Activity, Cpu, Monitor, Settings } from 'lucide-react';
import { GPUStressTest } from './gpuStress';
import './App.css'; // Just keeping it around if needed, though we rely on index.css

type Preset = 'low' | 'medium' | 'high' | 'extreme' | 'custom';

function App() {
  const [cpuRunning, setCpuRunning] = useState(false);
  const [gpuRunning, setGpuRunning] = useState(false);
  const maxCores = navigator.hardwareConcurrency || 4;
  const [preset, setPreset] = useState<Preset>('medium');
  const [cpuIntensity, setCpuIntensity] = useState<number>(6);
  const [gpuIntensity, setGpuIntensity] = useState<number>(500);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [fps, setFps] = useState(0);

  const workersRef = useRef<Worker[]>([]);
  const gpuTestRef = useRef<GPUStressTest | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    gpuTestRef.current = new GPUStressTest('gpu-canvas');
    return () => {
      workersRef.current.forEach(w => w.terminate());
      workersRef.current = [];
      gpuTestRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const measureFPS = (time: number) => {
      frameCount++;
      if (time - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (time - lastTime)));
        frameCount = 0;
        lastTime = time;
      }
      animationFrameId = requestAnimationFrame(measureFPS);
    };

    animationFrameId = requestAnimationFrame(measureFPS);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const wakeLockRef = useRef<any>(null);

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch (err) {
      console.error('Wake lock error:', err);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(console.error);
      wakeLockRef.current = null;
    }
  };

  useEffect(() => {
    const isTesting = cpuRunning || gpuRunning;
    
    if (isTesting) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isTesting) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (!isTesting) {
        releaseWakeLock();
      }
    };
  }, [cpuRunning, gpuRunning]);

  useEffect(() => {
    if (cpuRunning || gpuRunning) {
      timerRef.current = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cpuRunning, gpuRunning]);

  const handlePresetChange = (newPreset: Preset) => {
    setPreset(newPreset);
    if (newPreset === 'low') {
      setCpuIntensity(Math.max(1, Math.floor(maxCores * 0.25)));
      setGpuIntensity(50);
    } else if (newPreset === 'medium') {
      setCpuIntensity(6);
      setGpuIntensity(500);
    } else if (newPreset === 'high') {
      setCpuIntensity(maxCores);
      setGpuIntensity(2500);
    } else if (newPreset === 'extreme') {
      setCpuIntensity(maxCores * 2);
      setGpuIntensity(8000);
    }
  };

  const handleCpuChange = (val: number) => {
    setCpuIntensity(val);
    setPreset('custom');
  };

  const handleGpuChange = (val: number) => {
    setGpuIntensity(val);
    setPreset('custom');
  };

  const startCpuTest = () => {
    workersRef.current.forEach(w => w.terminate());
    workersRef.current = [];
    for (let i = 0; i < cpuIntensity; i++) {
      const worker = new Worker(new URL('./cpu.worker.ts', import.meta.url), { type: 'module' });
      worker.postMessage('start');
      workersRef.current.push(worker);
    }
    setCpuRunning(true);
  };

  const stopCpuTest = () => {
    workersRef.current.forEach(w => w.terminate());
    workersRef.current = [];
    setCpuRunning(false);
  };

  const startGpuTest = () => {
    gpuTestRef.current?.start(gpuIntensity);
    setGpuRunning(true);
  };

  const stopGpuTest = () => {
    gpuTestRef.current?.stop();
    setGpuRunning(false);
  };

  const handleModeClick = (mode: 'cpu' | 'gpu' | 'both') => {
    const isCpuTarget = mode === 'cpu' || mode === 'both';
    const isGpuTarget = mode === 'gpu' || mode === 'both';

    if (cpuRunning === isCpuTarget && gpuRunning === isGpuTarget) {
      stopCpuTest();
      stopGpuTest();
    } else {
      if (isCpuTarget && !cpuRunning) startCpuTest();
      if (!isCpuTarget && cpuRunning) stopCpuTest();
      
      if (isGpuTarget && !gpuRunning) startGpuTest();
      if (!isGpuTarget && gpuRunning) stopGpuTest();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <>
      <canvas id="gpu-canvas"></canvas>
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <Activity color="#60a5fa" size={48} />
          <h1 style={{ margin: 0, lineHeight: 1 }}>Stress Test</h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={20} style={{ opacity: 0.7 }} />
              <label style={{ fontWeight: 'bold' }}>Preset:</label>
            </div>
            <select 
              value={preset} 
              onChange={(e) => handlePresetChange(e.target.value as Preset)}
              style={{ 
                background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                padding: '0.5rem 1rem', borderRadius: '0.5rem', outline: 'none', cursor: 'pointer', flexGrow: 1
              }}
              disabled={cpuRunning || gpuRunning}
            >
              <option value="low" style={{ color: 'black' }}>Low</option>
              <option value="medium" style={{ color: 'black' }}>Medium</option>
              <option value="high" style={{ color: 'black' }}>High</option>
              <option value="extreme" style={{ color: 'black' }}>Extreme</option>
              <option value="custom" style={{ color: 'black' }} disabled>Custom</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', opacity: 0.8 }}>
              <span>CPU Intensity (Workers)</span>
              <span style={{ fontWeight: 'bold' }}>{cpuIntensity} threads</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max={maxCores * 4} 
              value={cpuIntensity} 
              onChange={(e) => handleCpuChange(Number(e.target.value))}
              disabled={cpuRunning}
              style={{ width: '100%', cursor: cpuRunning ? 'not-allowed' : 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', opacity: 0.8 }}>
              <span>GPU Intensity (Loop Size)</span>
              <span style={{ fontWeight: 'bold' }}>{gpuIntensity} ops</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="15000" 
              step="10"
              value={gpuIntensity} 
              onChange={(e) => handleGpuChange(Number(e.target.value))}
              disabled={gpuRunning}
              style={{ width: '100%', cursor: gpuRunning ? 'not-allowed' : 'pointer' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${cpuRunning && !gpuRunning ? 'active pulse' : ''}`}
            onClick={() => handleModeClick('cpu')}
            style={{ flex: '1 1 0', minWidth: '120px', padding: '1rem 0.5rem' }}
          >
            <Cpu size={20} />
            <span>CPU only</span>
          </button>

          <button 
            className={`btn ${!cpuRunning && gpuRunning ? 'active pulse' : ''}`}
            onClick={() => handleModeClick('gpu')}
            style={{ flex: '1 1 0', minWidth: '120px', padding: '1rem 0.5rem' }}
          >
            <Monitor size={20} />
            <span>GPU only</span>
          </button>

          <button 
            className={`btn ${cpuRunning && gpuRunning ? 'active pulse' : ''}`}
            onClick={() => handleModeClick('both')}
            style={{ flex: '1 1 0', minWidth: '120px', padding: '1rem 0.5rem' }}
          >
            <Activity size={20} />
            <span>CPU + GPU</span>
          </button>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-around', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8em', opacity: 0.6 }}>ACTIVE THREADS</div>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{cpuRunning ? cpuIntensity : maxCores}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8em', opacity: 0.6 }}>FPS</div>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: fps < 30 ? '#ef4444' : fps < 50 ? '#facc15' : 'inherit' }}>
              {fps}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8em', opacity: 0.6 }}>ELAPSED TIME</div>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', fontFamily: 'monospace' }}>
              {formatTime(elapsedTime)}
            </div>
          </div>
          <div style={{ flexBasis: '100%', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.8em', opacity: 0.6 }}>STATUS</div>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: (cpuRunning || gpuRunning) ? '#fca5a5' : '#86efac' }}>
              {cpuRunning || gpuRunning ? 'TESTING' : 'IDLE'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
