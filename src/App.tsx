import { useEffect, useRef, useState } from 'react';
import { Activity } from 'lucide-react';
import { GPUStressTest } from './gpuStress';
import { ControlButtons } from './components/ControlButtons';
import { StatsPanel } from './components/StatsPanel';
import { PresetSettings } from './components/PresetSettings';
import type { Preset } from './types';
import './App.css';

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

  return (
    <>
      <canvas id="gpu-canvas"></canvas>
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Activity color="#60a5fa" size={42} />
          <h1 style={{ margin: 0, lineHeight: 1 }}>Stress Test</h1>
        </div>

        <ControlButtons 
          cpuRunning={cpuRunning}
          gpuRunning={gpuRunning}
          onModeClick={handleModeClick}
        />

        <StatsPanel 
          cpuRunning={cpuRunning}
          gpuRunning={gpuRunning}
          cpuIntensity={cpuIntensity}
          fps={fps}
          elapsedTime={elapsedTime}
        />

        <PresetSettings
          preset={preset}
          cpuIntensity={cpuIntensity}
          gpuIntensity={gpuIntensity}
          cpuRunning={cpuRunning}
          gpuRunning={gpuRunning}
          maxCores={maxCores}
          onPresetChange={handlePresetChange}
          onCpuChange={handleCpuChange}
          onGpuChange={handleGpuChange}
        />
      </div>
    </>
  );
}

export default App;
