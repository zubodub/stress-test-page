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

  const cpuRef = useRef(cpuIntensity);
  const gpuRef = useRef(gpuIntensity);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    cpuRef.current = cpuIntensity;
  }, [cpuIntensity]);

  useEffect(() => {
    gpuRef.current = gpuIntensity;
  }, [gpuIntensity]);

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

  const animateTo = (targetCpu: number, targetGpu: number) => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    const startCpu = cpuRef.current;
    const startGpu = gpuRef.current;
    const startTime = performance.now();
    const duration = 400; // ms

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      if (progress < 1) {
        setCpuIntensity(startCpu + (targetCpu - startCpu) * ease);
        setGpuIntensity(startGpu + (targetGpu - startGpu) * ease);
        animationRef.current = requestAnimationFrame(step);
      } else {
        setCpuIntensity(targetCpu);
        setGpuIntensity(targetGpu);
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(step);
  };

  const handlePresetChange = (newPreset: Preset) => {
    setPreset(newPreset);
    if (newPreset === 'low') {
      animateTo(Math.max(1, Math.floor(maxCores * 0.25)), 50);
    } else if (newPreset === 'medium') {
      animateTo(6, 500);
    } else if (newPreset === 'high') {
      animateTo(maxCores, 2500);
    } else if (newPreset === 'extreme') {
      animateTo(maxCores * 2, 8000);
    }
  };

  const handleCpuChange = (val: number) => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setCpuIntensity(val);
    setPreset('custom');
  };

  const handleGpuChange = (val: number) => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setGpuIntensity(val);
    setPreset('custom');
  };

  const startCpuTest = () => {
    workersRef.current.forEach(w => w.terminate());
    workersRef.current = [];
    const threadsToUse = Math.round(cpuIntensity);
    for (let i = 0; i < threadsToUse; i++) {
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
    gpuTestRef.current?.start(Math.round(gpuIntensity));
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Activity color="#60a5fa" size={42} />
          <h1 style={{ margin: 0, lineHeight: 1 }}>Stress Test</h1>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${cpuRunning && !gpuRunning ? 'active pulse' : ''}`}
            onClick={() => handleModeClick('cpu')}
            style={{ flex: '1 1 0', minWidth: 0, padding: '0.8rem 0.2rem', fontSize: '0.9em', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}
          >
            <Cpu size={20} />
            <span style={{ whiteSpace: 'nowrap' }}>CPU only</span>
          </button>

          <button
            className={`btn ${!cpuRunning && gpuRunning ? 'active pulse' : ''}`}
            onClick={() => handleModeClick('gpu')}
            style={{ flex: '1 1 0', minWidth: 0, padding: '0.8rem 0.2rem', fontSize: '0.9em', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}
          >
            <Monitor size={20} />
            <span style={{ whiteSpace: 'nowrap' }}>GPU only</span>
          </button>

          <button
            className={`btn ${cpuRunning && gpuRunning ? 'active pulse' : ''}`}
            onClick={() => handleModeClick('both')}
            style={{ flex: '1 1 0', minWidth: 0, padding: '0.8rem 0.2rem', fontSize: '0.9em', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}
          >
            <Activity size={20} />
            <span style={{ whiteSpace: 'nowrap' }}>CPU + GPU</span>
          </button>
        </div>

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
                      handlePresetChange(p);
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
              onChange={(e) => handleCpuChange(Number(e.target.value))}
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
              onChange={(e) => handleGpuChange(Number(e.target.value))}
              disabled={gpuRunning}
              style={{ width: '100%', cursor: gpuRunning ? 'not-allowed' : 'pointer' }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
