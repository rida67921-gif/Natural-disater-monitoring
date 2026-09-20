import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Radio, 
  BatteryMedium, 
  Volume2, 
  VolumeX, 
  ShieldAlert,
  Clock,
  Layers
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';

interface HeaderProps {
  totalNodes: number;
  activeAlertsCount: number;
  nodesOffline: number;
  avgBattery: number;
  criticalAlertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  totalNodes,
  activeAlertsCount,
  nodesOffline,
  avgBattery,
  criticalAlertCount,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [timeStr, setTimeStr] = useState<string>('');
  const [utcStr, setUtcStr] = useState<string>('');

  useEffect(() => {
    setIsMuted(tacticalAudio.getMuted());
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }));
      setUtcStr(now.toISOString().slice(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAudio = () => {
    const nextMuted = tacticalAudio.toggleMute();
    setIsMuted(nextMuted);
  };

  return (
    <header className="bg-[#090e1c] border-b border-slate-800 text-slate-200 sticky top-0 z-40 shadow-lg shadow-black/40">
      {/* Top micro-bar with brand title, system status, clock, and demo badge */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-wider text-slate-100 uppercase font-tactical">
                Environmental Intelligence Network
              </h1>
              <span className="text-xs text-cyan-400/80 font-mono tracking-wide hidden sm:inline">
                — Live Monitoring (Simulated Demo Mode)
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded tracking-wider shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                DEMO DATA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
              <span>IOT TELEMETRY & MULTI-HAZARD DISASTER INTELLIGENCE</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                SYSTEM ACTIVE
              </span>
            </p>
          </div>
        </div>

        {/* Right side controls: Audio toggle & clock */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            onClick={handleToggleAudio}
            id="btn-toggle-audio"
            title={isMuted ? 'Unmute tactical audio alerts' : 'Mute audio alerts'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors ${
              isMuted 
                ? 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200' 
                : 'border-cyan-500/60 bg-cyan-950/60 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{isMuted ? 'AUDIO: MUTED' : 'AUDIO: LIVE'}</span>
          </button>

          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-900/90 border border-slate-800 rounded text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-200 font-bold">{timeStr}</span>
            <span className="text-[10px] text-slate-500">({utcStr})</span>
          </div>
        </div>
      </div>

      {/* Metric summary HUD bar */}
      <div className="px-4 py-2 bg-[#060a14] grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-4 text-xs font-mono">
        {/* Total Nodes */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/60 border border-slate-800/80 rounded">
          <div className="flex items-center gap-2 text-slate-400">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>TOTAL NODES</span>
          </div>
          <span className="text-sm font-bold text-slate-100">{totalNodes} <span className="text-[10px] font-normal text-slate-500">DEPLOYED</span></span>
        </div>

        {/* Active Alerts */}
        <div className={`flex items-center justify-between px-3 py-1.5 rounded border transition-all ${
          criticalAlertCount > 0 
            ? 'bg-rose-950/40 border-rose-600/60 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
            : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-3.5 h-3.5 ${criticalAlertCount > 0 ? 'text-rose-400 animate-bounce' : 'text-amber-400'}`} />
            <span className={criticalAlertCount > 0 ? 'text-rose-300 font-semibold' : 'text-slate-400'}>ACTIVE ALERTS</span>
          </div>
          <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            <span className={criticalAlertCount > 0 ? 'text-rose-400' : 'text-amber-400'}>{activeAlertsCount}</span>
            {criticalAlertCount > 0 && (
              <span className="text-[10px] px-1 py-0.2 bg-rose-500/30 text-rose-300 rounded font-semibold animate-pulse">
                {criticalAlertCount} CRIT
              </span>
            )}
          </span>
        </div>

        {/* Nodes Offline */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/60 border border-slate-800/80 rounded">
          <div className="flex items-center gap-2 text-slate-400">
            <Activity className="w-3.5 h-3.5 text-slate-500" />
            <span>NODES OFFLINE</span>
          </div>
          <span className="text-sm font-bold text-slate-100 flex items-center gap-1">
            <span className={nodesOffline > 0 ? 'text-slate-300' : 'text-emerald-400'}>{nodesOffline}</span>
            <span className="text-[10px] text-slate-500">/ {totalNodes}</span>
          </span>
        </div>

        {/* Average Battery */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/60 border border-slate-800/80 rounded">
          <div className="flex items-center gap-2 text-slate-400">
            <BatteryMedium className={`w-3.5 h-3.5 ${avgBattery < 50 ? 'text-amber-400' : 'text-emerald-400'}`} />
            <span>AVG BATTERY</span>
          </div>
          <span className="text-sm font-bold text-slate-100 flex items-center gap-1">
            <span className={avgBattery < 50 ? 'text-amber-400' : 'text-emerald-400'}>{avgBattery.toFixed(0)}%</span>
            <span className="text-[10px] text-slate-500">NOMINAL</span>
          </span>
        </div>
      </div>
    </header>
  );
};
