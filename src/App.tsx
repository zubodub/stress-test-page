import { useEffect, useRef, useState } from 'react';
import { Activity, Cpu, Monitor, Play, Square } from 'lucide-react';
import { GPUStressTest } from './gpuStress';
import './App.css'; // Just keeping it around if needed, though we rely on index.css

function App() {
  const [cpuRunning, setCpuRunning] = useState(false);
  const [gpuRunning, setGpuRunning] = useState(false);
  const [cores] = useState<number>(navigator.hardwareConcurrency || 4);
  const [elapsedTime, setElapsedTime] = useState(0);

  const workersRef = useRef<Worker[]>([]);
  const gpuTestRef = useRef<GPUStressTest | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    gpuTestRef.current = new GPUStressTest('gpu-canvas');
    return () => {
      stopAll();
    };
  }, []);

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

  const toggleCpu = () => {
    if (cpuRunning) {
      workersRef.current.forEach(w => w.terminate());
      workersRef.current = [];
      setCpuRunning(false);
    } else {
      for (let i = 0; i < cores; i++) {
        const worker = new Worker(new URL('./cpu.worker.ts', import.meta.url), { type: 'module' });
        worker.postMessage('start');
        workersRef.current.push(worker);
      }
      setCpuRunning(true);
    }
  };

  const toggleGpu = () => {
    if (gpuRunning) {
      gpuTestRef.current?.stop();
      setGpuRunning(false);
    } else {
      gpuTestRef.current?.start();
      setGpuRunning(true);
    }
  };

  const toggleBoth = () => {
    if (cpuRunning || gpuRunning) {
      stopAll();
    } else {
      toggleCpu();
      toggleGpu();
    }
  };

  const stopAll = () => {
    if (cpuRunning) toggleCpu();
    if (gpuRunning) toggleGpu();
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
        <h1><Activity className="inline-block mr-2 text-blue-400" size={48} /> System Stress Test</h1>
        <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
          Push your device to its absolute limits.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
          <button 
            className={`btn ${cpuRunning ? 'active pulse' : ''}`}
            onClick={toggleCpu}
          >
            <Cpu size={20} />
            {cpuRunning ? 'Stop CPU Test' : 'Start CPU Test'}
          </button>

          <button 
            className={`btn ${gpuRunning ? 'active pulse' : ''}`}
            onClick={toggleGpu}
          >
            <Monitor size={20} />
            {gpuRunning ? 'Stop GPU Test' : 'Start GPU Test'}
          </button>
        </div>

        <button 
          className="btn" 
          style={{ width: '100%', padding: '1rem', fontSize: '1.2em', background: (cpuRunning || gpuRunning) ? 'rgba(239, 68, 68, 0.2)' : 'rgba(96, 165, 250, 0.2)' }}
          onClick={toggleBoth}
        >
          {cpuRunning || gpuRunning ? <Square size={24} /> : <Play size={24} />}
          {cpuRunning || gpuRunning ? 'STOP ALL' : 'BURN IT ALL (CPU + GPU)'}
        </button>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-around', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8em', opacity: 0.6 }}>LOGICAL CORES</div>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{cores}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8em', opacity: 0.6 }}>ELAPSED TIME</div>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', fontFamily: 'monospace' }}>
              {formatTime(elapsedTime)}
            </div>
          </div>
          <div>
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
