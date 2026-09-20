import React, { useRef, useEffect } from 'react';
import { HeartbeatLog } from '../../types';
import { Terminal, Radio, Pause, Play } from 'lucide-react';

interface HeartbeatLogPanelProps {
  logs: HeartbeatLog[];
  isStreaming: boolean;
  onToggleStreaming: () => void;
}

export const HeartbeatLogPanel: React.FC<HeartbeatLogPanelProps> = ({
  logs,
  isStreaming,
  onToggleStreaming,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when new log arrives if streaming is active
  useEffect(() => {
    if (isStreaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isStreaming]);

  const getLogTypeBadge = (type: HeartbeatLog['type']) => {
    switch (type) {
      case 'offline':
        return <span className="text-rose-400 font-bold bg-rose-950/60 px-1 rounded border border-rose-800/80">OFFLINE</span>;
      case 'missed':
        return <span className="text-amber-400 font-bold bg-amber-950/60 px-1 rounded border border-amber-800/80">MISSED</span>;
      case 'anomaly':
        return <span className="text-orange-400 font-bold bg-orange-950/60 px-1 rounded border border-orange-800/80">ANOMALY</span>;
      case 'warning':
        return <span className="text-yellow-300 font-bold bg-yellow-950/60 px-1 rounded border border-yellow-800/80">WARN</span>;
      default:
        return <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1 rounded border border-emerald-800/80">OK</span>;
    }
  };

  return (
    <div className="bg-[#090e1c] border border-slate-800 rounded-lg p-3.5 flex flex-col h-full shadow-lg">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-200 font-tactical uppercase tracking-wider">
            LoRa Heartbeat & Telemetry Stream
          </span>
          <span className="flex h-2 w-2 relative">
            {isStreaming && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isStreaming ? 'bg-cyan-500' : 'bg-slate-600'}`}></span>
          </span>
        </div>

        <button
          onClick={onToggleStreaming}
          id="btn-toggle-log-stream"
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
        >
          {isStreaming ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
          <span>{isStreaming ? 'PAUSE' : 'RESUME'}</span>
        </button>
      </div>

      {/* Terminal Output Area */}
      <div
        ref={scrollRef}
        className="flex-1 mt-2 overflow-y-auto space-y-1.5 font-mono text-[11px] p-2 bg-[#050811] rounded border border-slate-900 max-h-[380px] lg:max-h-[500px]"
      >
        {logs.map((log) => {
          const isCrit = log.type === 'offline';
          const isWarn = log.type === 'missed' || log.type === 'warning' || log.type === 'anomaly';

          return (
            <div
              key={log.id}
              className={`p-1.5 rounded transition-colors flex items-start gap-2 border ${
                isCrit
                  ? 'bg-rose-950/30 border-rose-900/60 text-rose-200'
                  : isWarn
                  ? 'bg-amber-950/20 border-amber-900/40 text-amber-200'
                  : 'bg-transparent border-transparent hover:bg-slate-900/60 text-slate-300'
              }`}
            >
              <span className="text-slate-500 shrink-0 select-none">[{log.timeStr}]</span>
              <div className="shrink-0">{getLogTypeBadge(log.type)}</div>
              <div className="leading-snug flex-1">
                {/* Format exact prompt requirement: 
                    "10:32:01 — Node N-07 heartbeat OK — RSSI -78dBm" 
                    "10:32:45 — Node N-08 heartbeat MISSED — 2nd consecutive"
                    "10:33:02 — Node N-08 → OFFLINE — last-gasp packet received: temp=61°C"
                */}
                <span className="text-slate-400">— </span>
                <span className="font-semibold text-slate-200">{log.message}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex justify-between">
        <span>PACKET ENCRYPTION: AES-128</span>
        <span className="text-emerald-400">CRC VALIDATED</span>
      </div>
    </div>
  );
};
