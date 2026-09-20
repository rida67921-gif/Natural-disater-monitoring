import React, { useState } from 'react';
import { 
  SensorNode, 
  HazardType, 
  RiskLevel, 
  RiskZone, 
  WindDirection 
} from '../../types';
import { WIND_ANGLES } from '../../data/zoneConfig';
import { 
  Droplets, 
  Flame, 
  Wind, 
  Compass, 
  Layers, 
  Eye, 
  Maximize2, 
  RefreshCw,
  Radar,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface RiskMapProps {
  nodes: SensorNode[];
  zones: RiskZone[];
  windDirection: WindDirection;
  onWindDirectionChange: (dir: WindDirection) => void;
  selectedNodeId: string | null;
  onSelectNode: (node: SensorNode) => void;
  showZoneLayer: boolean;
  onToggleZoneLayer: () => void;
  onTriggerCascadeDemo: () => void;
  onTriggerFireWindDemo: () => void;
  onResetZones: () => void;
  isCascading: boolean;
}

export const RiskMap: React.FC<RiskMapProps> = ({
  nodes,
  zones,
  windDirection,
  onWindDirectionChange,
  selectedNodeId,
  onSelectNode,
  showZoneLayer,
  onToggleZoneLayer,
  onTriggerCascadeDemo,
  onTriggerFireWindDemo,
  onResetZones,
  isCascading,
}) => {
  const [hazardFilter, setHazardFilter] = useState<'all' | HazardType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'alert_only'>('all');
  const [showRadar, setShowRadar] = useState<boolean>(true);
  const [hoveredNode, setHoveredNode] = useState<SensorNode | null>(null);
  const [hoveredZone, setHoveredZone] = useState<RiskZone | null>(null);

  const windDirections: WindDirection[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  const filteredNodes = nodes.filter((node) => {
    if (hazardFilter !== 'all' && node.hazardType !== hazardFilter) return false;
    if (statusFilter === 'alert_only' && (node.status === 'normal' || node.status === 'offline')) return false;
    return true;
  });

  const getNodeColor = (status: RiskLevel) => {
    switch (status) {
      case 'critical':
        return '#f43f5e'; // red-500
      case 'warning':
        return '#f97316'; // orange-500
      case 'watch':
        return '#eab308'; // yellow-500
      case 'offline':
        return '#64748b'; // slate-500
      default:
        return '#10b981'; // emerald-500
    }
  };

  const getHazardIconSmall = (type: HazardType) => {
    switch (type) {
      case 'flood':
        return <Droplets className="w-2.5 h-2.5 text-sky-300" />;
      case 'fire':
        return <Flame className="w-2.5 h-2.5 text-orange-300" />;
      case 'air_quality':
        return <Wind className="w-2.5 h-2.5 text-slate-300" />;
    }
  };

  const currentWindAngle = WIND_ANGLES[windDirection] ?? 45;

  return (
    <div className="bg-[#090e1c] border border-slate-800 rounded-lg overflow-hidden flex flex-col relative shadow-xl">
      {/* Zone Control Deck & Demo Action Bar */}
      <div className="p-3 bg-[#0c1426] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-200 font-bold uppercase tracking-wider flex items-center gap-1.5 font-tactical">
            <Compass className="w-4 h-4 text-cyan-400" />
            REGIONAL TACTICAL GRID & ZONE RISK LAYER
          </span>
          <button
            onClick={onToggleZoneLayer}
            id="btn-toggle-zone-layer"
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
              showZoneLayer
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/70 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                : 'bg-slate-900 text-slate-400 border-slate-700'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>ZONES: {showZoneLayer ? 'ENABLED' : 'HIDDEN'}</span>
          </button>
        </div>

        {/* Action Controls: Cascade Demo & Reset */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onTriggerCascadeDemo}
            id="btn-trigger-cascade-demo"
            disabled={isCascading}
            className={`px-3 py-1.5 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              isCascading
                ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse'
                : 'bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-700/80'
            }`}
            title="Demonstrate flood propagation from river-adjacent Zone A to downstream Zone B"
          >
            <Play className="w-3 h-3 text-rose-400 fill-current" />
            <span>Trigger Multi-Zone Cascade Demo</span>
          </button>

          <button
            onClick={onTriggerFireWindDemo}
            id="btn-trigger-fire-wind-demo"
            className="px-2.5 py-1.5 rounded text-[11px] font-mono font-bold bg-orange-950/50 hover:bg-orange-900/70 text-orange-200 border border-orange-700/70 cursor-pointer transition-colors flex items-center gap-1"
            title="Demonstrate wildfire downwind propagation based on active wind direction"
          >
            <Flame className="w-3 h-3 text-orange-400" />
            <span>Fire Downwind Demo</span>
          </button>

          <button
            onClick={onResetZones}
            id="btn-reset-zones"
            className="px-2.5 py-1.5 rounded text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors flex items-center gap-1"
            title="Reset all zones and sensor telemetry to baseline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Sub-Toolbar: Wind Direction Dial & Hazard Filters */}
      <div className="px-3 py-2 bg-[#080d1a] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
        {/* Wind Selector (Requirement: Wind Direction dial/selector N/S/E/W/NE/NW/SE/SW) */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Wind className="w-3 h-3 text-cyan-400" />
            WIND VECTOR:
          </span>
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded p-0.5">
            {windDirections.map((dir) => (
              <button
                key={dir}
                onClick={() => onWindDirectionChange(dir)}
                id={`btn-wind-${dir.toLowerCase()}`}
                className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded transition-colors cursor-pointer ${
                  windDirection === dir
                    ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {dir}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-cyan-400/90 font-bold ml-1">
            {currentWindAngle}° (18 km/h)
          </span>
        </div>

        {/* Hazard filter buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setHazardFilter('all')}
            id="btn-filter-all"
            className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
              hazardFilter === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            All ({nodes.length})
          </button>
          <button
            onClick={() => setHazardFilter('flood')}
            id="btn-filter-flood"
            className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors ${
              hazardFilter === 'flood'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Droplets className="w-3 h-3 text-blue-400" />
            Flood
          </button>
          <button
            onClick={() => setHazardFilter('fire')}
            id="btn-filter-fire"
            className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors ${
              hazardFilter === 'fire'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Flame className="w-3 h-3 text-orange-400" />
            Fire
          </button>
          <button
            onClick={() => setHazardFilter('air_quality')}
            id="btn-filter-air"
            className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors ${
              hazardFilter === 'air_quality'
                ? 'bg-slate-700/40 text-slate-300 border border-slate-600'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Wind className="w-3 h-3 text-slate-400" />
            Air
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1"></div>

          <button
            onClick={() => setStatusFilter(statusFilter === 'all' ? 'alert_only' : 'all')}
            id="btn-filter-alerts-only"
            className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
              statusFilter === 'alert_only'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            {statusFilter === 'alert_only' ? '● Alerts' : '○ All'}
          </button>

          <button
            onClick={() => setShowRadar(!showRadar)}
            id="btn-toggle-radar"
            title="Toggle Radar Sweep Effect"
            className={`p-1 rounded cursor-pointer ${
              showRadar ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800' : 'text-slate-500'
            }`}
          >
            <Radar className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Stylized Regional Map Canvas / SVG */}
      <div className="relative w-full h-[520px] lg:h-[580px] bg-[#070c18] overflow-hidden select-none">
        {/* SVG Tactical Terrain Background & Zones Layer */}
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Grid pattern */}
            <pattern id="tactical-grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#101b33" strokeWidth="0.1" />
            </pattern>
            {/* Radar gradient */}
            <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(6, 182, 212, 0.15)" />
              <stop offset="70%" stopColor="rgba(6, 182, 212, 0.02)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Background subgrid */}
          <rect width="100" height="100" fill="url(#tactical-grid)" />

          {/* Regional Contour Lines & River (Physical Topology) */}
          <g stroke="#1a2744" strokeWidth="0.2" fill="none" opacity="0.6">
            <path d="M 20,10 Q 35,6 50,12 T 80,10" />
            <path d="M 18,15 Q 34,11 52,18 T 82,16" />
            <path d="M 16,35 C 18,50 20,70 24,85" stroke="#1e3a5f" strokeWidth="0.3" />
            <path d="M 62,60 C 66,70 70,78 76,90" stroke="#0e3a4e" strokeWidth="0.3" />
          </g>

          {/* ZONE SYSTEM: Shaded Polygon / Region Areas (Requirement) */}
          {showZoneLayer &&
            zones.map((zone) => {
              const isTier1 = zone.tier === 1; // 🔴 Extreme Danger
              const isTier2 = zone.tier === 2; // 🟠 Expected Risk
              const isTier3 = zone.tier === 3; // 🟢 Safe

              // Colors based on classification
              const fillColor = isTier1
                ? 'rgba(244, 63, 94, 0.24)'
                : isTier2
                ? 'rgba(245, 158, 11, 0.20)'
                : 'rgba(16, 185, 129, 0.08)';

              const strokeColor = isTier1
                ? '#f43f5e'
                : isTier2
                ? '#f59e0b'
                : '#10b981';

              const strokeWidth = isTier1 ? '0.6' : isTier2 ? '0.4' : '0.2';
              const strokeDasharray = isTier2 ? '1,0.5' : 'none';

              return (
                <polygon
                  key={`poly-${zone.id}`}
                  points={zone.polygonPoints}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  vectorEffect="non-scaling-stroke"
                  className={`transition-colors duration-700 ${
                    isTier1 ? 'animate-pulse' : ''
                  }`}
                  style={{
                    filter: isTier1 ? 'drop-shadow(0 0 1.5px rgba(244,63,94,0.6))' : 'none',
                  }}
                />
              );
            })}

          {/* River Corridor Flow Vector (Demonstrating Downstream Direction: Zone A -> Zone B) */}
          <g stroke="rgba(56, 189, 248, 0.55)" fill="none" strokeLinecap="round">
            <path
              d="M 52,18 C 62,22 72,25 82,32"
              strokeWidth="0.7"
              strokeDasharray="1.5,1.5"
            />
            <path
              d="M 82,32 C 78,42 70,52 66,66"
              strokeWidth="0.6"
              strokeDasharray="1.5,1.5"
            />
            <path
              d="M 66,66 C 68,76 74,84 80,92"
              strokeWidth="0.5"
              strokeDasharray="1.5,1.5"
            />
          </g>

          {/* Radar Sweep Effect */}
          {showRadar && (
            <g className="animate-radar" style={{ transformOrigin: '55% 45%' }}>
              <circle cx="55" cy="45" r="35" fill="url(#radar-glow)" />
              <line x1="55" y1="45" x2="90" y2="45" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="0.3" />
            </g>
          )}
        </svg>

        {/* Downstream River Flow Labels (Physical Flow Clarification) */}
        <div className="absolute top-[28%] left-[73%] pointer-events-none text-[9px] font-mono text-cyan-400/80 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60 flex items-center gap-1 backdrop-blur-xs">
          <span>RIVER FLOW</span>
          <ArrowRight className="w-2.5 h-2.5 animate-pulse text-cyan-300" />
          <span className="text-slate-300">DOWNSTREAM</span>
        </div>

        {/* ZONE LABELS OVERLAY (Requirement: Each zone has a label overlay showing its name and status) */}
        {showZoneLayer &&
          zones.map((zone) => {
            const isTier1 = zone.tier === 1;
            const isTier2 = zone.tier === 2;

            const statusText = isTier1
              ? '🔴 EXTREME DANGER'
              : isTier2
              ? '🟠 EXPECTED RISK'
              : '🟢 SAFE';

            const badgeClasses = isTier1
              ? 'bg-rose-950/90 text-rose-100 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse'
              : isTier2
              ? 'bg-amber-950/90 text-amber-100 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
              : 'bg-emerald-950/80 text-emerald-200 border-emerald-700/60';

            return (
              <div
                key={`zone-label-${zone.id}`}
                style={{
                  left: `${zone.labelCoord.x}%`,
                  top: `${zone.labelCoord.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute z-10 pointer-events-none px-2 py-0.5 rounded border text-[10px] font-mono font-bold tracking-tight backdrop-blur-sm whitespace-nowrap transition-all duration-700 ${badgeClasses}`}
              >
                {/* Format: "Zone A — Riverside District — 🔴 EXTREME DANGER" */}
                <span>{zone.code}</span>
                <span className="text-slate-400"> — </span>
                <span className="text-slate-200">{zone.name}</span>
                <span className="text-slate-400"> — </span>
                <span>{statusText}</span>
              </div>
            );
          })}

        {/* Visual Wind Direction Compass Widget (Top-Right on map) */}
        <div className="absolute top-3 right-3 bg-[#080d1a]/90 border border-slate-800/90 rounded-lg p-2 text-[10px] font-mono text-slate-300 backdrop-blur-md flex items-center gap-2.5 z-20 shadow-lg pointer-events-none">
          {/* Rotating Compass Needle Dial */}
          <div className="relative w-8 h-8 rounded-full border border-slate-700 bg-slate-900/80 flex items-center justify-center">
            {/* Cardinal marks */}
            <span className="absolute top-0.5 text-[7px] text-slate-500 font-bold">N</span>
            <span className="absolute right-0.5 text-[7px] text-slate-500 font-bold">E</span>
            <span className="absolute bottom-0.5 text-[7px] text-slate-500 font-bold">S</span>
            <span className="absolute left-0.5 text-[7px] text-slate-500 font-bold">W</span>

            {/* Rotating Arrow */}
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-500 ease-out"
              style={{ transform: `rotate(${currentWindAngle}deg)` }}
            >
              <div className="w-0.5 h-6 relative">
                {/* Arrowhead */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-cyan-400" />
                {/* Tail */}
                <div className="w-0.5 h-4 bg-cyan-500/60 mx-auto mt-1" />
              </div>
            </div>
          </div>

          <div>
            <div className="text-[9px] text-slate-500 uppercase font-bold">SURFACE WIND</div>
            <div className="text-cyan-300 font-bold text-xs flex items-center gap-1">
              <span>{windDirection}</span>
              <span className="text-slate-400 text-[10px]">({currentWindAngle}°)</span>
            </div>
            <div className="text-[9px] text-slate-400">18 km/h • Moderate</div>
          </div>
        </div>

        {/* Nodes Layer: Rendered as interactive Pins */}
        {filteredNodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const nodeColor = getNodeColor(node.status);
          const isCritical = node.status === 'critical';
          const isWarning = node.status === 'warning';

          return (
            <div
              key={node.id}
              onClick={() => onSelectNode(node)}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              id={`node-pin-${node.id}`}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute cursor-pointer group z-20"
            >
              {/* Outer pulsing ring for critical/warning nodes */}
              {isCritical && (
                <span
                  className="absolute -inset-3 rounded-full animate-ping opacity-60"
                  style={{ backgroundColor: nodeColor }}
                />
              )}
              {isWarning && (
                <span
                  className="absolute -inset-2 rounded-full animate-pulse opacity-40"
                  style={{ backgroundColor: nodeColor }}
                />
              )}

              {/* Selection Halo */}
              {isSelected && (
                <div className="absolute -inset-2.5 rounded-full border-2 border-cyan-300 animate-pulse shadow-[0_0_16px_rgba(6,182,212,0.8)]" />
              )}

              {/* Central Pin Node */}
              <div
                className={`relative flex items-center justify-center w-7 h-7 rounded-full border-2 transition-transform duration-200 group-hover:scale-125 ${
                  isSelected ? 'scale-125 shadow-lg' : ''
                }`}
                style={{
                  backgroundColor: '#0c1427',
                  borderColor: nodeColor,
                  boxShadow: `0 0 10px ${nodeColor}88`,
                }}
              >
                {/* Center hazard icon */}
                {getHazardIconSmall(node.hazardType)}

                {/* Micro status LED */}
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black"
                  style={{ backgroundColor: nodeColor }}
                />
              </div>

              {/* Node ID Label Tag below */}
              <div
                className={`mt-1 px-1.5 py-0.2 text-[9px] font-mono font-bold rounded shadow-md whitespace-nowrap transition-colors flex items-center gap-1 ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-900/90 text-slate-300 border border-slate-700/80 group-hover:text-white group-hover:border-slate-500'
                }`}
              >
                <span>{node.id}</span>
                <span className="text-[8px] opacity-75">{node.primaryMetric.value}{node.primaryMetric.unit}</span>
              </div>
            </div>
          );
        })}

        {/* Hover Quick-Glance Tooltip */}
        {hoveredNode && (
          <div
            className="absolute pointer-events-none z-30 p-2.5 rounded bg-[#09101f]/95 border border-cyan-500/40 text-slate-200 text-xs font-mono shadow-2xl backdrop-blur-md min-w-[200px]"
            style={{
              left: `${Math.min(hoveredNode.x + 4, 76)}%`,
              top: `${Math.min(hoveredNode.y + 4, 74)}%`,
            }}
          >
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="font-bold text-cyan-300">Node {hoveredNode.id}</span>
              <span
                className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase"
                style={{
                  color: getNodeColor(hoveredNode.status),
                  backgroundColor: `${getNodeColor(hoveredNode.status)}22`,
                }}
              >
                {hoveredNode.status}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{hoveredNode.name}</div>
            <div className="mt-1.5 flex justify-between text-[11px]">
              <span className="text-slate-400">{hoveredNode.primaryMetric.label}:</span>
              <span className="font-bold text-slate-100">
                {hoveredNode.primaryMetric.value} {hoveredNode.primaryMetric.unit}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>Confidence:</span>
              <span className="text-cyan-300 font-bold">{hoveredNode.confidenceScore}%</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>Sector:</span>
              <span className="text-slate-300">{hoveredNode.sector}</span>
            </div>
          </div>
        )}

        {/* PERSISTENT LEGEND (Requirement: "🔴 Extreme Danger — Evacuate/Shelter | 🟠 Expected Risk — Stay Alert, Prepare | 🟢 Safe — No Action Needed.") */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto bg-[#080d1a]/95 border border-slate-800/95 rounded-lg p-2.5 text-[10px] font-mono text-slate-300 backdrop-blur-md shadow-xl z-20 pointer-events-none">
          <div className="text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-1">
            ZONE RISK CLASSIFICATION LEGEND
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1.5 text-rose-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <strong>🔴 Extreme Danger</strong> — Evacuate/Shelter
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="flex items-center gap-1.5 text-amber-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <strong>🟠 Expected Risk</strong> — Stay Alert, Prepare
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <strong>🟢 Safe</strong> — No Action Needed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
