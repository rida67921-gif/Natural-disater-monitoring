import React, { useState, useEffect, useRef } from 'react';
import { 
  CloudRain, 
  AlertTriangle, 
  Flame, 
  RotateCcw, 
  Siren, 
  Cpu, 
  Droplets, 
  Thermometer, 
  Wind, 
  Radio, 
  Activity, 
  CheckCircle2, 
  AlertOctagon, 
  Compass, 
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { RiskLevel, SensorHealth } from '../../types';
import { tacticalAudio } from '../../utils/audio';

interface NeighborLink {
  id: string;
  name: string;
  rssi: number;
  snr: number;
  degraded: boolean;
  broken: boolean;
}

interface DigitalTwinSimulatorProps {
  initialNodeId?: string;
  onAlertTriggered?: (alertText: string) => void;
}

export const DigitalTwinSimulator: React.FC<DigitalTwinSimulatorProps> = ({
  initialNodeId = 'F-102',
}) => {
  const [selectedNode, setSelectedNode] = useState<string>(initialNodeId);
  const [activeScenario, setActiveScenario] = useState<'idle' | 'heavy_rain' | 'sensor_failure' | 'fire_rf'>('idle');
  const [scenarioProgress, setScenarioProgress] = useState<number>(0); // 0 to 100%

  // Mode: 'flood' or 'fire'
  const [mode, setMode] = useState<'flood' | 'fire'>('flood');

  // Flood Metrics (Animated)
  const [waterLevel, setWaterLevel] = useState<number>(1.45);
  const [riseRate, setRiseRate] = useState<number>(1.2);
  const [rainfall, setRainfall] = useState<number>(6.5);
  const [floodProb, setFloodProb] = useState<number>(8);
  const [confidence, setConfidence] = useState<number>(94);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('normal');

  // Sensor Health
  const [sensorHealth, setSensorHealth] = useState<SensorHealth>('normal');
  const [sensorHealthNote, setSensorHealthNote] = useState<string>(
    'Dual hydrostatic transducers agreeing within ±0.02m (confidence 96%). Acoustic flow meter cross-check nominal.'
  );

  // Fire Metrics (for Fire Risk Scenario)
  const [fireTemp, setFireTemp] = useState<number>(27.5);
  const [fireHumidity, setFireHumidity] = useState<number>(55.0);
  const [fireSmoke, setFireSmoke] = useState<number>(12);
  const [fireConfidence, setFireConfidence] = useState<number>(92);
  const [spreadDirection, setSpreadDirection] = useState<string | null>(null);

  // Neighbor links for RF Anomaly
  const [neighborLinks, setNeighborLinks] = useState<NeighborLink[]>([
    { id: 'N-07', name: 'Escarpment 07', rssi: -78, snr: 8.5, degraded: false, broken: false },
    { id: 'N-09', name: 'North Ridge 09', rssi: -76, snr: 9.1, degraded: false, broken: false },
    { id: 'N-10', name: 'High Peak 10', rssi: -79, snr: 8.3, degraded: false, broken: false },
  ]);

  // Siren banner
  const [showCriticalBanner, setShowCriticalBanner] = useState<boolean>(false);

  // Live AI reasoning text
  const [aiReasoning, setAiReasoning] = useState<string>(
    'Water level 1.45m + rise rate 1.2cm/10min + rainfall 6.5mm/hr → fused flood probability 8% (Baseline Normal).'
  );

  // Animation frame / interval reference
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    };
  }, []);

  // Update mode when selectedNode changes
  useEffect(() => {
    if (selectedNode.startsWith('N-')) {
      setMode('fire');
    } else {
      setMode('flood');
    }
  }, [selectedNode]);

  // Sound cue on critical
  useEffect(() => {
    if (showCriticalBanner) {
      tacticalAudio.playSiren();
    }
  }, [showCriticalBanner]);

  // SCENARIO 1: Heavy Rain (~7-8 seconds smooth transition)
  const handleSimulateHeavyRain = () => {
    if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    setMode('flood');
    setActiveScenario('heavy_rain');
    setSensorHealth('normal');
    setSensorHealthNote('Telemetry consistent with multi-station radar gauge validation.');
    setShowCriticalBanner(false);

    const startTime = Date.now();
    const durationMs = 7000; // 7 seconds

    // Baseline values
    const startRain = 6.5;
    const targetRain = 82.0;

    const startWater = 1.45;
    const targetWater = 3.92;

    const startRise = 1.2;
    const targetRise = 15.8;

    const startProb = 8;
    const targetProb = 92;

    animationTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      setScenarioProgress(Math.round(progress * 100));

      // Ease in-out quadratic
      const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

      const curRain = +(startRain + (targetRain - startRain) * ease).toFixed(1);
      const curWater = +(startWater + (targetWater - startWater) * ease).toFixed(2);
      const curRise = +(startRise + (targetRise - startRise) * ease).toFixed(1);
      const curProb = Math.round(startProb + (targetProb - startProb) * ease);

      setRainfall(curRain);
      setWaterLevel(curWater);
      setRiseRate(curRise);
      setFloodProb(curProb);
      setConfidence(Math.round(90 + Math.random() * 4));

      // Transition risk badge: Normal -> Watch -> Warning -> Critical
      if (curProb < 35) {
        setRiskLevel('normal');
        setShowCriticalBanner(false);
      } else if (curProb < 60) {
        setRiskLevel('watch');
        setShowCriticalBanner(false);
      } else if (curProb < 80) {
        setRiskLevel('warning');
        setShowCriticalBanner(false);
      } else {
        setRiskLevel('critical');
        setShowCriticalBanner(true);
      }

      // Dynamic AI reasoning
      setAiReasoning(
        `Water level ${curWater}m + rise rate ${curRise}cm/10min + rainfall ${curRain}mm/hr → fused flood probability ${curProb}% (${
          curProb >= 80 ? 'CRITICAL INUNDATION THREAT' : curProb >= 60 ? 'WARNING: CHANNEL CAPACITY SATURATED' : 'WATCH: RUNOFF ELEVATION'
        })`
      );

      if (progress >= 1) {
        if (animationTimerRef.current) clearInterval(animationTimerRef.current);
      }
    }, 100);
  };

  // SCENARIO 2: Sensor Failure (abrupt jump to 0.2m, health flips Suspicious -> Failed)
  const handleSimulateSensorFailure = () => {
    if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    setActiveScenario('sensor_failure');
    setMode('flood');
    setShowCriticalBanner(false);
    setScenarioProgress(100);

    // Abrupt jump to implausible value 0.2m (glitch)
    setWaterLevel(0.20);
    setRiseRate(-88.4); // physically impossible drop
    setFloodProb(12);
    setConfidence(24);
    setRiskLevel('normal'); // Unreliable data does not trigger false flood alarm, triggers failure pipeline

    // First flip to Suspicious
    setSensorHealth('suspicious');
    setSensorHealthNote('Transient telemetry anomaly detected: rate-of-change exceeds hydrostatic limit (-1.25m/sec). Cross-checking neighboring acoustic sensors...');
    setAiReasoning('Anomaly Detector: Water level abruptly dropped from 3.8m to 0.20m in <100ms. Anomaly Score: 0.992 (Implausible physics). Health status: SUSPICIOUS.');

    // Then flip to Failed after 1.8 seconds
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    stepTimerRef.current = setTimeout(() => {
      setSensorHealth('failed');
      setSensorHealthNote('Reading inconsistent with rate-of-change history — flagged, not trusted, maintenance ticket auto-generated (#TKT-9941-FL).');
      setAiReasoning('FAILSAFE TRIPPED: Reading inconsistent with rate-of-change history — flagged, not trusted, maintenance ticket auto-generated. Synthetic baseline substituted for downstream forecast models.');
    }, 1800);
  };

  // SCENARIO 3: Fire Risk (RF Anomaly)
  const handleSimulateFireRisk = () => {
    if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    setMode('fire');
    setActiveScenario('fire_rf');
    setShowCriticalBanner(false);
    setSensorHealth('normal');
    setSpreadDirection(null);

    // Reset neighbor links
    setNeighborLinks([
      { id: 'N-07', name: 'Escarpment 07', rssi: -78, snr: 8.5, degraded: false, broken: false },
      { id: 'N-09', name: 'North Ridge 09', rssi: -76, snr: 9.1, degraded: false, broken: false },
      { id: 'N-10', name: 'High Peak 10', rssi: -79, snr: 8.3, degraded: false, broken: false },
    ]);

    const startTime = Date.now();
    const durationMs = 7500;

    animationTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      setScenarioProgress(Math.round(progress * 100));

      const curTemp = +(27.5 + (64.2 - 27.5) * progress).toFixed(1);
      const curHumidity = +(55.0 - (55.0 - 13.5) * progress).toFixed(1);
      const curSmoke = Math.round(12 + (195 - 12) * progress);

      setFireTemp(curTemp);
      setFireHumidity(curHumidity);
      setFireSmoke(curSmoke);
      setFireConfidence(Math.round(75 + progress * 19));

      if (progress < 0.3) {
        setRiskLevel('watch');
      } else if (progress < 0.65) {
        setRiskLevel('warning');
      } else {
        setRiskLevel('critical');
      }

      // Degrade neighbor links in sequence:
      // Link 1 (N-07) degrades at 30%
      // Link 2 (N-09) degrades at 55%
      // Link 3 (N-10) degrades at 80%
      setNeighborLinks((prev) => {
        return [
          {
            ...prev[0],
            rssi: progress > 0.3 ? -98 : -78,
            snr: progress > 0.3 ? 1.2 : 8.5,
            degraded: progress > 0.3,
            broken: progress > 0.6,
          },
          {
            ...prev[1],
            rssi: progress > 0.55 ? -104 : -76,
            snr: progress > 0.55 ? -1.5 : 9.1,
            degraded: progress > 0.55,
            broken: progress > 0.75,
          },
          {
            ...prev[2],
            rssi: progress > 0.8 ? -112 : -79,
            snr: progress > 0.8 ? -4.2 : 8.3,
            degraded: progress > 0.8,
            broken: progress > 0.9,
          },
        ];
      });

      // Spread indicator appears once 2+ neighbor links degrade
      if (progress > 0.55) {
        setSpreadDirection('NE (42° azimuth)');
      }

      setAiReasoning(
        `Thermal sensor ${curTemp}°C + CO Smoke ${curSmoke}ppm + RF Link absorption (-${Math.round(progress * 30)}dBm) → Fused Fire Risk: ${Math.round(75 + progress * 20)}% (Spread Direction: ${progress > 0.55 ? 'NE toward Ridge 09' : 'Calculating vector...'})`
      );

      if (progress >= 1) {
        if (animationTimerRef.current) clearInterval(animationTimerRef.current);
      }
    }, 100);
  };

  // SCENARIO 4: Reset to Normal (smooth animation back to baseline)
  const handleResetToNormal = () => {
    if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    setActiveScenario('idle');
    setShowCriticalBanner(false);
    setScenarioProgress(0);

    const startTime = Date.now();
    const durationMs = 2500;

    const startWater = waterLevel;
    const startRain = rainfall;
    const startRise = riseRate;
    const startProb = floodProb;

    const startTemp = fireTemp;
    const startHumidity = fireHumidity;
    const startSmoke = fireSmoke;

    animationTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      setWaterLevel(+(startWater + (1.45 - startWater) * progress).toFixed(2));
      setRainfall(+(startRain + (6.5 - startRain) * progress).toFixed(1));
      setRiseRate(+(startRise + (1.2 - startRise) * progress).toFixed(1));
      setFloodProb(Math.round(startProb + (8 - startProb) * progress));

      setFireTemp(+(startTemp + (27.5 - startTemp) * progress).toFixed(1));
      setFireHumidity(+(startHumidity + (55.0 - startHumidity) * progress).toFixed(1));
      setFireSmoke(Math.round(startSmoke + (12 - startSmoke) * progress));

      setRiskLevel('normal');
      setConfidence(94);
      setSensorHealth('normal');
      setSensorHealthNote('Dual hydrostatic transducers agreeing within ±0.02m (confidence 96%). Acoustic flow meter cross-check nominal.');
      setSpreadDirection(null);
      setNeighborLinks([
        { id: 'N-07', name: 'Escarpment 07', rssi: -78, snr: 8.5, degraded: false, broken: false },
        { id: 'N-09', name: 'North Ridge 09', rssi: -76, snr: 9.1, degraded: false, broken: false },
        { id: 'N-10', name: 'High Peak 10', rssi: -79, snr: 8.3, degraded: false, broken: false },
      ]);

      setAiReasoning(
        'System reset to baseline. Telemetry normal across all hydro and RF monitoring channels.'
      );

      if (progress >= 1) {
        if (animationTimerRef.current) clearInterval(animationTimerRef.current);
      }
    }, 80);
  };

  const getRiskBadge = (lvl: RiskLevel) => {
    switch (lvl) {
      case 'critical':
        return (
          <span className="px-3 py-1 rounded text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/60 flex items-center gap-1.5 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            CRITICAL
          </span>
        );
      case 'warning':
        return (
          <span className="px-3 py-1 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/60 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            WARNING
          </span>
        );
      case 'watch':
        return (
          <span className="px-3 py-1 rounded text-xs font-mono font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/60 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            WATCH
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            NORMAL
          </span>
        );
    }
  };

  return (
    <div className="p-3 sm:p-4 space-y-4 max-w-7xl mx-auto">
      {/* Top Banner: Flashing Critical Siren Alert */}
      {showCriticalBanner && (
        <div 
          id="critical-siren-banner"
          className="p-3.5 bg-rose-950/80 border-2 border-rose-500 rounded-lg flex items-center justify-between text-rose-100 shadow-[0_0_30px_rgba(244,63,94,0.4)] animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600 rounded-full text-white animate-spin">
              <Siren className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold font-tactical uppercase tracking-wider text-white">
                  🔴 CRITICAL ALERT — Downstream warning issued
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-rose-900 border border-rose-400 rounded text-rose-200">
                  DISASTER PROTOCOL ACTIVE
                </span>
              </div>
              <p className="text-xs font-mono text-rose-200">
                Automated downstream flood siren broadcast dispatched. Evacuation alert relayed to District Emergency Operations Center (DEOC).
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 font-mono text-xs">
            <span className="px-2.5 py-1 bg-rose-900/60 rounded border border-rose-700">
              DISPATCH ACKNOWLEDGED
            </span>
          </div>
        </div>
      )}

      {/* Control Station Header & Node Picker */}
      <div className="bg-[#0a1020] border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-tactical uppercase tracking-wider text-slate-100">
                Digital Twin Neural Simulator & Stress Engine
              </h2>
              <span className="text-xs font-mono text-emerald-400 px-2 py-0.5 bg-emerald-950/60 border border-emerald-800 rounded">
                AI REASONING CORE V2.4
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Live physics-based state model with sensor fault detection and RF mesh anomaly propagation.
            </p>
          </div>
        </div>

        {/* Node Dropdown Selector (default Flood Node F-102) */}
        <div className="flex items-center gap-2">
          <label htmlFor="node-select-twin" className="text-xs font-mono text-slate-400 uppercase">
            Active Twin Node:
          </label>
          <select
            id="node-select-twin"
            value={selectedNode}
            onChange={(e) => {
              setSelectedNode(e.target.value);
              handleResetToNormal();
            }}
            className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="F-102">Flood Node F-102 (Brahmaputra Basin)</option>
            <option value="F-104">Flood Node F-104 (Teesta Outpost)</option>
            <option value="F-108">Flood Node F-108 (Kallada Sluice)</option>
            <option value="N-08">Fire Node N-08 (Pine Ridge 08)</option>
            <option value="N-07">Fire Node N-07 (Escarpment 07)</option>
            <option value="A-015">Air Quality Node A-015 (Indo-Gangetic)</option>
          </select>
        </div>
      </div>

      {/* Scenario Control Action Bar */}
      <div className="bg-[#0c1426] border border-slate-800 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold font-mono text-slate-300 uppercase">
            Execute Scripted Scenario:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Heavy Rain Button */}
          <button
            onClick={handleSimulateHeavyRain}
            id="btn-scenario-heavy-rain"
            className={`px-3.5 py-2 rounded text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeScenario === 'heavy_rain'
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-400'
                : 'bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 border border-blue-800/80'
            }`}
          >
            <CloudRain className="w-4 h-4 text-blue-400" />
            <span>Simulate Heavy Rain</span>
          </button>

          {/* Sensor Failure Button */}
          <button
            onClick={handleSimulateSensorFailure}
            id="btn-scenario-sensor-failure"
            className={`px-3.5 py-2 rounded text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeScenario === 'sensor_failure'
                ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)] border border-rose-400'
                : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80'
            }`}
          >
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>Simulate Sensor Failure</span>
          </button>

          {/* Fire Risk (RF Anomaly) Button */}
          <button
            onClick={handleSimulateFireRisk}
            id="btn-scenario-fire-risk"
            className={`px-3.5 py-2 rounded text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeScenario === 'fire_rf'
                ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)] border border-orange-400'
                : 'bg-orange-950/40 hover:bg-orange-900/60 text-orange-300 border border-orange-800/80'
            }`}
          >
            <Flame className="w-4 h-4 text-orange-400" />
            <span>Simulate Fire Risk (RF Anomaly)</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={handleResetToNormal}
            id="btn-scenario-reset"
            className="px-3.5 py-2 rounded text-xs font-mono font-bold flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Normal</span>
          </button>
        </div>

        {/* Progress Bar when running */}
        {activeScenario !== 'idle' && (
          <div className="w-full mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">
              Scenario: <strong className="text-cyan-300 uppercase">{activeScenario.replace('_', ' ')}</strong>
            </span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-cyan-400 h-full transition-all duration-150"
                  style={{ width: `${scenarioProgress}%` }}
                />
              </div>
              <span className="text-cyan-400 font-bold">{scenarioProgress}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Live Readout Cards Grid */}
      {mode === 'flood' ? (
        /* Flood Mode Telemetry Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Card 1: Water Level */}
          <div className="bg-[#090e1c] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                Water Level
              </span>
              <span className="text-[10px] text-slate-500">HYDRO-ACOUSTIC</span>
            </div>
            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-100 transition-all duration-300">
                {waterLevel.toFixed(2)} <span className="text-sm font-normal text-slate-400">m</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    waterLevel > 3.5 ? 'bg-rose-500' : waterLevel > 2.8 ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${Math.min((waterLevel / 4.5) * 100, 100)}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-500">CRITICAL THRESHOLD: 3.50m</span>
          </div>

          {/* Card 2: Rise Rate */}
          <div className="bg-[#090e1c] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                Rise Rate
              </span>
              <span className="text-[10px] text-slate-500">VELOCITY</span>
            </div>
            <div className="my-2">
              <div className={`text-2xl sm:text-3xl font-bold font-mono transition-all duration-300 ${
                riseRate > 10 ? 'text-rose-400' : riseRate > 5 ? 'text-amber-400' : 'text-slate-100'
              }`}>
                {riseRate > 0 ? `+${riseRate.toFixed(1)}` : riseRate.toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-400">cm/10m</span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-1">
                {riseRate > 10 ? 'Rapid flash flood surge' : riseRate < 0 ? 'Negative drop' : 'Normal channel fluctuation'}
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500">CALCULATED OVER 10-MIN EPOCH</span>
          </div>

          {/* Card 3: Rainfall */}
          <div className="bg-[#090e1c] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span className="flex items-center gap-1">
                <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                Rainfall
              </span>
              <span className="text-[10px] text-slate-500">OPTICAL PLUVIOMETER</span>
            </div>
            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-100 transition-all duration-300">
                {rainfall.toFixed(1)} <span className="text-sm font-normal text-slate-400">mm/hr</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    rainfall > 50 ? 'bg-rose-500' : rainfall > 25 ? 'bg-amber-400' : 'bg-sky-400'
                  }`}
                  style={{ width: `${Math.min((rainfall / 100) * 100, 100)}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-500">HEAVY DOWNPOUR &gt; 50mm/hr</span>
          </div>

          {/* Card 4: AI Flood Probability */}
          <div className="bg-[#090e1c] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Flood Probability
              </span>
              <span className="text-[10px] text-slate-500">AI ESTIMATOR</span>
            </div>
            <div className="my-2">
              <div className={`text-2xl sm:text-3xl font-bold font-mono transition-all duration-300 ${
                floodProb >= 80 ? 'text-rose-400' : floodProb >= 50 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {floodProb}%
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    floodProb >= 80 ? 'bg-rose-500' : floodProb >= 50 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${floodProb}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-500">FUSED BASIN HYDRAULICS</span>
          </div>

          {/* Card 5: Confidence Score */}
          <div className="bg-[#090e1c] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Confidence
              </span>
              <span className="text-[10px] text-slate-500">BAYESIAN FIT</span>
            </div>
            <div className="my-2">
              <div className={`text-2xl sm:text-3xl font-bold font-mono transition-all duration-300 ${
                confidence < 50 ? 'text-rose-400' : 'text-cyan-300'
              }`}>
                {confidence}%
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-1">
                {confidence < 50 ? 'Sensor conflict / low signal' : 'High correlation with upstream'}
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500">CROSS-SENSOR VALIDATED</span>
          </div>

          {/* Card 6: Risk Level Badge */}
          <div className="bg-[#090e1c] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Risk Level</span>
              <span className="text-[10px] text-slate-500">STATUS</span>
            </div>
            <div className="my-3 flex items-center justify-center">
              {getRiskBadge(riskLevel)}
            </div>
            <span className="text-[10px] font-mono text-slate-500 text-center">
              AUTOMATED TRIAGE BADGE
            </span>
          </div>
        </div>
      ) : (
        /* Fire Mode Telemetry Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Card 1: Canopy Temp */}
          <div className="bg-[#090e1c] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span className="flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                Canopy Temp
              </span>
              <span className="text-[10px] text-slate-500">THERMAL IR</span>
            </div>
            <div className="my-2">
              <div className={`text-2xl sm:text-3xl font-bold font-mono transition-all duration-300 ${
                fireTemp > 50 ? 'text-rose-400' : fireTemp > 40 ? 'text-amber-400' : 'text-slate-100'
              }`}>
                {fireTemp.toFixed(1)} <span className="text-sm font-normal text-slate-400">°C</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    fireTemp > 50 ? 'bg-rose-500' : fireTemp > 40 ? 'bg-orange-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min((fireTemp / 80) * 100, 100)}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-500">THERMAL ALERT &gt; 45°C</span>
          </div>

          {/* Card 2: Humidity */}
          <div className="bg-[#090e1c] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span className="flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                Rel Humidity
              </span>
              <span className="text-[10px] text-slate-500">HYGROMETER</span>
            </div>
            <div className="my-2">
              <div className={`text-2xl sm:text-3xl font-bold font-mono transition-all duration-300 ${
                fireHumidity < 20 ? 'text-rose-400' : 'text-slate-100'
              }`}>
                {fireHumidity.toFixed(1)} <span className="text-sm font-normal text-slate-400">%</span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-1">
                {fireHumidity < 20 ? 'Extreme drought desiccated fuels' : 'Moderate ambient moisture'}
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500">CRITICAL DRYNESS &lt; 20%</span>
          </div>

          {/* Card 3: Smoke Gas */}
          <div className="bg-[#090e1c] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Smoke Level (CO)
              </span>
              <span className="text-[10px] text-slate-500">GAS SPECTRA</span>
            </div>
            <div className="my-2">
              <div className={`text-2xl sm:text-3xl font-bold font-mono transition-all duration-300 ${
                fireSmoke > 100 ? 'text-rose-400' : fireSmoke > 50 ? 'text-amber-400' : 'text-slate-100'
              }`}>
                {fireSmoke} <span className="text-sm font-normal text-slate-400">ppm</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    fireSmoke > 100 ? 'bg-rose-500' : fireSmoke > 50 ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${Math.min((fireSmoke / 250) * 100, 100)}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-500">COMBUSTION BYPRODUCT</span>
          </div>

          {/* Card 4: Fire Probability */}
          <div className="bg-[#090e1c] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-orange-400" />
                Fire Probability
              </span>
              <span className="text-[10px] text-slate-500">AI MULTIMODAL</span>
            </div>
            <div className="my-2">
              <div className={`text-2xl sm:text-3xl font-bold font-mono transition-all duration-300 ${
                riskLevel === 'critical' ? 'text-rose-400' : riskLevel === 'warning' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {fireConfidence}%
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    riskLevel === 'critical' ? 'bg-rose-500' : riskLevel === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${fireConfidence}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-500">THERMAL + GAS CORRELATION</span>
          </div>

          {/* Card 5: Spread Direction */}
          <div className="bg-[#090e1c] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span className="flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                Spread Vector
              </span>
              <span className="text-[10px] text-slate-500">RF GRADIENT</span>
            </div>
            <div className="my-2">
              <div className="text-base sm:text-lg font-bold font-mono text-amber-300 flex items-center gap-1">
                {spreadDirection ? (
                  <>
                    <ArrowUpRight className="w-5 h-5 text-rose-400 animate-bounce" />
                    <span>{spreadDirection}</span>
                  </>
                ) : (
                  <span className="text-slate-500 text-sm">NO ACTIVE SPREAD</span>
                )}
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-1">
                {spreadDirection ? 'Wind 22km/h pushing flame front' : 'Atmospheric conditions calm'}
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500">INFERRED FROM NEIGHBOR RF DROP</span>
          </div>

          {/* Card 6: Risk Level Badge */}
          <div className="bg-[#090e1c] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Risk Level</span>
              <span className="text-[10px] text-slate-500">STATUS</span>
            </div>
            <div className="my-3 flex items-center justify-center">
              {getRiskBadge(riskLevel)}
            </div>
            <span className="text-[10px] font-mono text-slate-500 text-center">
              WILDFIRE THREAT INDEX
            </span>
          </div>
        </div>
      )}

      {/* Two Column Section: Left = Sensor Health / RF Link Quality, Right = Live AI Reasoning */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (7 cols): Sensor Health & RF Link Anomaly Graph */}
        <div className="lg:col-span-7 space-y-4">
          {/* Sensor Health Status Box */}
          <div className={`p-4 rounded-lg border transition-all ${
            sensorHealth === 'failed'
              ? 'bg-rose-950/40 border-rose-600 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
              : sensorHealth === 'suspicious'
              ? 'bg-amber-950/40 border-amber-600'
              : 'bg-[#090e1c] border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold font-mono text-slate-200 uppercase">
                  Hardware Sensor Health & Integrity Sentinel
                </span>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                sensorHealth === 'failed'
                  ? 'bg-rose-500 text-white animate-pulse'
                  : sensorHealth === 'suspicious'
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                HEALTH: {sensorHealth}
              </span>
            </div>
            <div className="mt-2.5 text-xs font-mono text-slate-300 leading-relaxed">
              <p>{sensorHealthNote}</p>
            </div>
          </div>

          {/* Link Quality & Mesh Anomaly Graph */}
          <div className="bg-[#090e1c] border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold font-mono text-slate-200 uppercase">
                  RF Link Quality & Neighbor Attenuation Matrix
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                LORA MESH FREQ: 868.1 MHz
              </span>
            </div>

            {/* Readout for 3 neighboring nodes dropping in sequence */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
              {neighborLinks.map((link) => (
                <div
                  key={link.id}
                  className={`p-2.5 rounded border transition-all ${
                    link.broken
                      ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                      : link.degraded
                      ? 'bg-amber-950/40 border-amber-800/80 text-amber-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold">{link.name}</span>
                    <span className={`text-[10px] px-1 rounded font-bold uppercase ${
                      link.broken ? 'bg-rose-900 text-rose-200' : link.degraded ? 'bg-amber-900 text-amber-200' : 'text-emerald-400'
                    }`}>
                      {link.broken ? 'OFFLINE' : link.degraded ? 'DEGRADED' : 'NOMINAL'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>RSSI:</span>
                    <span className={`font-bold ${link.broken ? 'text-rose-400' : link.degraded ? 'text-amber-400' : 'text-slate-100'}`}>
                      {link.rssi} dBm
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>SNR:</span>
                    <span className="font-bold text-slate-100">{link.snr} dB</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Small Animated Node-Graph (5-6 dots connected by lines representing mesh links) */}
            <div className="mt-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2 text-[11px] font-mono text-slate-400">
                <span>CANOPY RF GRAPH TOPOLOGY (FADING/BREAKING UNDER HEAT)</span>
                {spreadDirection && (
                  <span className="text-amber-400 font-bold animate-pulse flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                    SPREAD DETECTED: {spreadDirection}
                  </span>
                )}
              </div>

              {/* SVG 5-6 dots graph */}
              <div className="relative w-full h-36 bg-[#060a14] rounded border border-slate-900 p-2 overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 400 130">
                  {/* Coordinates of 6 nodes: 
                      Node 1: Center/Origin (F-102 / N-08) at (180, 65)
                      Node 2: N-02 at (70, 35)
                      Node 3: N-03 at (80, 100)
                      Node 4: N-07 at (280, 30) (Neighbor 1)
                      Node 5: N-09 at (340, 70) (Neighbor 2)
                      Node 6: N-10 at (290, 110) (Neighbor 3)
                  */}
                  <g strokeWidth="2">
                    {/* Link 1 -> 2 */}
                    <line x1="180" y1="65" x2="70" y2="35" stroke="#10b981" strokeDasharray="3,3" opacity="0.8" />
                    {/* Link 1 -> 3 */}
                    <line x1="180" y1="65" x2="80" y2="100" stroke="#10b981" strokeDasharray="3,3" opacity="0.8" />

                    {/* Link 1 -> 4 (Neighbor 1: N-07) */}
                    <line 
                      x1="180" 
                      y1="65" 
                      x2="280" 
                      y2="30" 
                      stroke={neighborLinks[0].broken ? '#f43f5e' : neighborLinks[0].degraded ? '#f59e0b' : '#10b981'} 
                      strokeWidth={neighborLinks[0].broken ? '1' : '2'}
                      strokeDasharray={neighborLinks[0].broken ? '1,4' : 'none'}
                      opacity={neighborLinks[0].broken ? '0.2' : '0.9'}
                      className="transition-all duration-500"
                    />

                    {/* Link 1 -> 5 (Neighbor 2: N-09) */}
                    <line 
                      x1="180" 
                      y1="65" 
                      x2="340" 
                      y2="70" 
                      stroke={neighborLinks[1].broken ? '#f43f5e' : neighborLinks[1].degraded ? '#f59e0b' : '#10b981'} 
                      strokeWidth={neighborLinks[1].broken ? '1' : '2'}
                      strokeDasharray={neighborLinks[1].broken ? '1,4' : 'none'}
                      opacity={neighborLinks[1].broken ? '0.2' : '0.9'}
                      className="transition-all duration-500"
                    />

                    {/* Link 1 -> 6 (Neighbor 3: N-10) */}
                    <line 
                      x1="180" 
                      y1="65" 
                      x2="290" 
                      y2="110" 
                      stroke={neighborLinks[2].broken ? '#f43f5e' : neighborLinks[2].degraded ? '#f59e0b' : '#10b981'} 
                      strokeWidth={neighborLinks[2].broken ? '1' : '2'}
                      strokeDasharray={neighborLinks[2].broken ? '1,4' : 'none'}
                      opacity={neighborLinks[2].broken ? '0.2' : '0.9'}
                      className="transition-all duration-500"
                    />

                    {/* Inter-link between 4 and 5 */}
                    <line 
                      x1="280" 
                      y1="30" 
                      x2="340" 
                      y2="70" 
                      stroke={neighborLinks[1].broken ? '#f43f5e' : '#334155'} 
                      strokeWidth="1.2"
                      opacity={neighborLinks[1].broken ? '0.2' : '0.6'}
                    />
                  </g>

                  {/* Nodes as Dots */}
                  {/* Center Node: Origin */}
                  <g transform="translate(180, 65)">
                    <circle r="9" fill="#090e1c" stroke="#06b6d4" strokeWidth="2.5" />
                    <circle r="4" fill="#06b6d4" />
                    <text x="0" y="-12" textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      {selectedNode} (Origin)
                    </text>
                  </g>

                  {/* Node 2 */}
                  <g transform="translate(70, 35)">
                    <circle r="6" fill="#090e1c" stroke="#10b981" strokeWidth="2" />
                    <text x="0" y="-9" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">N-02</text>
                  </g>

                  {/* Node 3 */}
                  <g transform="translate(80, 100)">
                    <circle r="6" fill="#090e1c" stroke="#10b981" strokeWidth="2" />
                    <text x="0" y="15" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">N-03</text>
                  </g>

                  {/* Node 4 (N-07) */}
                  <g transform="translate(280, 30)">
                    <circle 
                      r="7" 
                      fill="#090e1c" 
                      stroke={neighborLinks[0].broken ? '#f43f5e' : neighborLinks[0].degraded ? '#f59e0b' : '#10b981'} 
                      strokeWidth="2" 
                    />
                    <text x="0" y="-10" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontFamily="monospace">N-07</text>
                  </g>

                  {/* Node 5 (N-09) */}
                  <g transform="translate(340, 70)">
                    <circle 
                      r="7" 
                      fill="#090e1c" 
                      stroke={neighborLinks[1].broken ? '#f43f5e' : neighborLinks[1].degraded ? '#f59e0b' : '#10b981'} 
                      strokeWidth="2" 
                    />
                    <text x="18" y="4" textAnchor="start" fill="#cbd5e1" fontSize="8" fontFamily="monospace">N-09</text>
                  </g>

                  {/* Node 6 (N-10) */}
                  <g transform="translate(290, 110)">
                    <circle 
                      r="7" 
                      fill="#090e1c" 
                      stroke={neighborLinks[2].broken ? '#f43f5e' : neighborLinks[2].degraded ? '#f59e0b' : '#10b981'} 
                      strokeWidth="2" 
                    />
                    <text x="0" y="16" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontFamily="monospace">N-10</text>
                  </g>

                  {/* Flame / Vector Arrow when spreading */}
                  {spreadDirection && (
                    <g transform="translate(240, 48)">
                      <path d="M 0,15 L 45,-15" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="4,2" />
                      <polygon points="45,-15 35,-12 42,-5" fill="#f43f5e" />
                      <text x="15" y="-18" fill="#f87171" fontSize="9" fontFamily="monospace" fontWeight="bold">
                        VECTOR NE ↗
                      </text>
                    </g>
                  )}
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): AI Reasoning Terminal Box */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[#080d1a] border border-cyan-500/30 rounded-lg p-4 flex flex-col h-full shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
                <h3 className="text-xs font-bold font-mono text-cyan-300 uppercase tracking-wider">
                  AI Decision Inference & Reasoning Log
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                LIVE EXPLANABILITY ENGINE
              </span>
            </div>

            {/* Prompt explicit requirement: A small "AI Reasoning" text box that updates live explaining WHY current risk level was assigned */}
            <div className="my-3 p-3.5 bg-[#050811] rounded border border-slate-800/80 font-mono text-xs leading-relaxed text-slate-200">
              <div className="text-[10px] text-cyan-400/80 uppercase font-bold mb-1.5 flex items-center gap-1.5">
                <Cpu className="w-3 h-3" />
                <span>DYNAMIC REASONING RATIONALE:</span>
              </div>
              <p className="text-cyan-100 font-medium bg-cyan-950/20 p-2.5 rounded border border-cyan-900/40">
                "{aiReasoning}"
              </p>
            </div>

            {/* Multi-Factor Weight Breakdown */}
            <div className="space-y-2 font-mono text-xs text-slate-400">
              <div className="text-[10px] uppercase text-slate-500 font-bold">
                Feature Importance Attribution:
              </div>
              <div className="space-y-1.5">
                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span>Hydrostatic Head Delta (∂H/∂t):</span>
                    <span className="text-slate-200 font-bold">42%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5">
                    <div className="bg-cyan-400 h-full rounded-full" style={{ width: '42%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span>Upstream Radar Rainfall:</span>
                    <span className="text-slate-200 font-bold">31%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5">
                    <div className="bg-sky-400 h-full rounded-full" style={{ width: '31%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span>Soil Saturation & Infiltration Loss:</span>
                    <span className="text-slate-200 font-bold">18%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: '18%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span>RF Attenuation & Multipath Scatter:</span>
                    <span className="text-slate-200 font-bold">9%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: '9%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Operational Advisory footer */}
            <div className="mt-auto pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-500">
              <span>DISASTER PROTOCOL ISO-22320 COMPLIANT • MODEL LATENCY 14ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
