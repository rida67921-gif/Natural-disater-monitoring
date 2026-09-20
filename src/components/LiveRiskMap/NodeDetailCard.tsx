import React from 'react';
import { 
  SensorNode, 
  HazardType 
} from '../../types';
import { 
  X, 
  Droplets, 
  Flame, 
  Wind, 
  Battery, 
  Wifi, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Radio
} from 'lucide-react';

interface NodeDetailCardProps {
  node: SensorNode;
  onClose: () => void;
  onInspectInTwin: (nodeId: string) => void;
}

export const NodeDetailCard: React.FC<NodeDetailCardProps> = ({
  node,
  onClose,
  onInspectInTwin,
}) => {
  const getHazardIcon = (type: HazardType) => {
    switch (type) {
      case 'flood':
        return <Droplets className="w-4 h-4 text-cyan-400" />;
      case 'fire':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'air_quality':
        return <Wind className="w-4 h-4 text-slate-300" />;
    }
  };

  const getStatusBadge = (status: SensorNode['status']) => {
    switch (status) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 flex items-center gap-1 shadow-[0_0_8px_rgba(244,63,94,0.3)]">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            CRITICAL
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            WARNING
          </span>
        );
      case 'watch':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
            WATCH
          </span>
        );
      case 'offline':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-700/50 text-slate-400 border border-slate-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            OFFLINE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            NORMAL
          </span>
        );
    }
  };

  const getHealthBadge = (health: SensorNode['health']) => {
    switch (health) {
      case 'failed':
        return (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-mono bg-rose-950/40 px-2 py-1 rounded border border-rose-800/60">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-bold">FAILED</span>
          </div>
        );
      case 'suspicious':
        return (
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono bg-amber-950/40 px-2 py-1 rounded border border-amber-800/60">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">SUSPICIOUS (DRIFT)</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold">NORMAL (CERTIFIED)</span>
          </div>
        );
    }
  };

  // Generate SVG sparkline
  const minVal = Math.min(...node.sparklineHistory);
  const maxVal = Math.max(...node.sparklineHistory);
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;
  const width = 240;
  const height = 48;
  const points = node.sparklineHistory
    .map((val, idx) => {
      const x = (idx / (node.sparklineHistory.length - 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 10) - 5;
      return `${x},${y}`;
    })
    .join(' ');

  const sparklineColor = 
    node.status === 'critical' ? '#f43f5e' :
    node.status === 'warning' ? '#f59e0b' :
    node.status === 'watch' ? '#eab308' :
    node.status === 'offline' ? '#64748b' : '#10b981';

  return (
    <div 
      id="node-detail-card" 
      className="bg-[#0c1427]/95 border border-cyan-500/30 rounded-lg p-4 shadow-2xl backdrop-blur-md text-slate-200 w-full max-w-md relative flex flex-col gap-3.5"
    >
      {/* Card Header */}
      <div className="flex items-start justify-between border-b border-slate-800/90 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-slate-900 border border-slate-700/80">
            {getHazardIcon(node.hazardType)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold font-mono text-cyan-300">
                Node {node.id}
              </span>
              {getStatusBadge(node.status)}
            </div>
            <p className="text-xs text-slate-400 font-tactical">{node.name}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title="Close inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sector & GPS Metadata */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-900/70 p-2.5 rounded border border-slate-800/80">
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Sector</span>
          <span className="text-slate-200 font-medium">{node.sector}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Coordinates</span>
          <span className="text-slate-300">{node.lat.toFixed(4)}°N, {node.lng.toFixed(4)}°E</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Elevation</span>
          <span className="text-slate-300">{node.elevationMeters}m ASL</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">AI Confidence</span>
          <span className="text-cyan-300 font-bold flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-400" />
            {node.confidenceScore}%
          </span>
        </div>
      </div>

      {/* Primary Telemetry & Trend Sparkline */}
      <div className="p-3 bg-[#080d1a] border border-slate-800 rounded">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-mono text-slate-400 uppercase flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            {node.primaryMetric.label} (Current)
          </span>
          <span className="text-lg font-mono font-bold text-slate-100">
            {node.primaryMetric.value} {node.primaryMetric.unit}
          </span>
        </div>

        {/* Sparkline Graph */}
        <div className="relative pt-1 pb-1">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-12 overflow-visible">
            {/* Sparkline gradient fill */}
            <defs>
              <linearGradient id={`grad-${node.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={sparklineColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={sparklineColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <polygon
              fill={`url(#grad-${node.id})`}
              points={`0,${height} ${points} ${width},${height}`}
            />
            <polyline
              fill="none"
              stroke={sparklineColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
            {/* Last dot */}
            {node.sparklineHistory.length > 0 && (
              <circle
                cx={width}
                cy={height - ((node.sparklineHistory[node.sparklineHistory.length - 1] - minVal) / range) * (height - 10) - 5}
                r="3.5"
                fill={sparklineColor}
              />
            )}
          </svg>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>T-60m</span>
            <span>T-30m</span>
            <span className="text-cyan-400 font-semibold">T-0 (Now)</span>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800/80">
          {node.secondaryMetrics.map((sec, i) => (
            <div key={i} className="bg-slate-900/40 p-1.5 rounded border border-slate-800/50">
              <span className="text-[10px] text-slate-500 uppercase block truncate">{sec.label}</span>
              <span className="text-xs font-mono font-semibold text-slate-200">
                {sec.value} {sec.unit || ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sensor Health Status & Battery / Connectivity */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Sensor Health</span>
          {getHealthBadge(node.health)}
        </div>
        <div>
          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Battery & Comms</span>
          <div className="flex items-center justify-between p-1 px-2 rounded bg-slate-900/70 border border-slate-800 font-mono text-xs">
            <div className="flex items-center gap-1 text-slate-300">
              <Battery className={`w-3.5 h-3.5 ${node.batteryPct < 30 ? 'text-rose-400' : 'text-emerald-400'}`} />
              <span>{node.batteryPct}%</span>
            </div>
            <div className="flex items-center gap-1 text-cyan-400 text-[11px]">
              <Wifi className="w-3 h-3" />
              <span>{node.connectivity.rssi}dBm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Health Note if flagged */}
      {node.healthNote && (
        <div className="p-2 rounded bg-amber-950/30 border border-amber-800/60 text-amber-200 text-xs font-mono flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-snug">{node.healthNote}</p>
        </div>
      )}

      {/* Action: Open in Digital Twin */}
      <button
        onClick={() => onInspectInTwin(node.id)}
        id={`btn-inspect-twin-${node.id}`}
        className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 hover:from-emerald-600/40 hover:to-cyan-600/40 border border-emerald-500/40 rounded text-emerald-200 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.15)]"
      >
        <Cpu className="w-4 h-4 text-emerald-400" />
        <span>INSPECT IN DIGITAL TWIN SIMULATOR</span>
        <ExternalLink className="w-3.5 h-3.5 text-emerald-300" />
      </button>
    </div>
  );
};
