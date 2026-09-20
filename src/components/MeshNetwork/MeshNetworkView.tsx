import React, { useState, useEffect, useRef } from 'react';
import { 
  FOREST_MESH_NODES, 
  INITIAL_MESH_LINKS, 
  INITIAL_HEARTBEAT_LOGS 
} from '../../data/mockNodes';
import { MeshNode, MeshLink, HeartbeatLog } from '../../types';
import { HeartbeatLogPanel } from './HeartbeatLogPanel';
import { 
  Flame, 
  RotateCcw, 
  Radio, 
  Share2, 
  ShieldAlert, 
  AlertTriangle, 
  Compass, 
  ArrowUpRight, 
  Battery, 
  Thermometer, 
  Wind,
  Layers,
  Cpu
} from 'lucide-react';
import { tacticalAudio } from '../../utils/audio';

export const MeshNetworkView: React.FC = () => {
  const [nodes, setNodes] = useState<MeshNode[]>(FOREST_MESH_NODES);
  const [links, setLinks] = useState<MeshLink[]>(INITIAL_MESH_LINKS);
  const [logs, setLogs] = useState<HeartbeatLog[]>(INITIAL_HEARTBEAT_LOGS);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [selectedNode, setSelectedNode] = useState<MeshNode | null>(null);
  const [hoveredLink, setHoveredLink] = useState<MeshLink | null>(null);

  // Fire event state
  const [isFireSimulating, setIsFireSimulating] = useState<boolean>(false);
  const [firePhase, setFirePhase] = useState<number>(0); // 0 = none, 1 = N-08 degrade, 2 = N-09 degrade, 3 = N-10 degrade
  const [showSummaryBanner, setShowSummaryBanner] = useState<boolean>(false);

  const simulationTimers = useRef<NodeJS.Timeout[]>([]);

  // Periodically append a routine heartbeat log when streaming is active
  useEffect(() => {
    if (!isStreaming || isFireSimulating) return;

    const interval = setInterval(() => {
      const randomNodeNum = Math.floor(Math.random() * 6) + 1;
      const nodeId = `N-0${randomNodeNum}`;
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
      const rssi = -70 - Math.floor(Math.random() * 15);

      const newLog: HeartbeatLog = {
        id: `hb-${Date.now()}`,
        timeStr,
        nodeId,
        type: 'ok',
        message: `Node ${nodeId} heartbeat OK — RSSI ${rssi}dBm`,
        rssi,
      };

      setLogs((prev) => [...prev.slice(-40), newLog]);
    }, 4500);

    return () => clearInterval(interval);
  }, [isStreaming, isFireSimulating]);

  // Clean up timers
  useEffect(() => {
    return () => {
      simulationTimers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  // TRIGGER FIRE EVENT AT NODE N-08
  const handleTriggerFireEvent = () => {
    // Clear any pending timers
    simulationTimers.current.forEach((t) => clearTimeout(t));
    simulationTimers.current = [];

    setIsFireSimulating(true);
    setFirePhase(1);
    setShowSummaryBanner(false);

    tacticalAudio.playBlip(520, 0.15);

    const now = new Date();
    const t0 = now.toLocaleTimeString('en-US', { hour12: false });

    // Step 1: N-08 starts heating up, link begins degrading (immediate to 1.5s)
    setNodes((prev) =>
      prev.map((n) =>
        n.id === 'N-08'
          ? { ...n, tempC: 48.5, status: 'warning', smokePpm: 95 }
          : n
      )
    );

    setLinks((prev) =>
      prev.map((l) =>
        l.from === 'N-08' || l.to === 'N-08'
          ? { ...l, rssi: -98, snr: 1.2, status: 'degraded', packetLossPct: 18.5 }
          : l
      )
    );

    setLogs((prev) => [
      ...prev,
      {
        id: `fire-1-${Date.now()}`,
        timeStr: t0,
        nodeId: 'N-08',
        type: 'warning',
        message: 'Node N-08 heartbeat DELAYED — RSSI dropped to -98dBm (Thermal draft detected)',
        rssi: -98,
      },
    ]);

    // Step 2 (after 2.0s): N-08 fails / offline ("last-gasp packet received: temp=61°C")
    const t1 = setTimeout(() => {
      setFirePhase(2);
      const time1 = new Date().toLocaleTimeString('en-US', { hour12: false });

      setNodes((prev) =>
        prev.map((n) => {
          if (n.id === 'N-08') {
            return { ...n, tempC: 61.2, status: 'critical', smokePpm: 210 };
          }
          if (n.id === 'N-09') {
            return { ...n, tempC: 46.8, status: 'warning', smokePpm: 75 };
          }
          return n;
        })
      );

      setLinks((prev) =>
        prev.map((l) => {
          if (l.from === 'N-08' || l.to === 'N-08') {
            return { ...l, rssi: -115, snr: -4.5, status: 'broken', packetLossPct: 92.0 };
          }
          if (l.from === 'N-09' || l.to === 'N-09') {
            return { ...l, rssi: -94, snr: 2.1, status: 'degraded', packetLossPct: 24.0 };
          }
          return l;
        })
      );

      setLogs((prev) => [
        ...prev,
        {
          id: `fire-2-${Date.now()}`,
          timeStr: time1,
          nodeId: 'N-08',
          type: 'missed',
          message: 'Node N-08 heartbeat MISSED — 2nd consecutive packet frame',
        },
        {
          id: `fire-3-${Date.now()}`,
          timeStr: time1,
          nodeId: 'N-08',
          type: 'offline',
          message: 'Node N-08 → OFFLINE — last-gasp packet received: temp=61°C, flame IR triggered',
          temp: 61.2,
        },
      ]);
      tacticalAudio.playSiren();
    }, 2000);

    // Step 3 (after 4.2s): Spread to N-09 and then N-10 (NE direction)
    const t2 = setTimeout(() => {
      setFirePhase(3);
      const time2 = new Date().toLocaleTimeString('en-US', { hour12: false });

      setNodes((prev) =>
        prev.map((n) => {
          if (n.id === 'N-09') {
            return { ...n, tempC: 55.4, status: 'critical', smokePpm: 180 };
          }
          if (n.id === 'N-10') {
            return { ...n, tempC: 44.2, status: 'warning', smokePpm: 88 };
          }
          return n;
        })
      );

      setLinks((prev) =>
        prev.map((l) => {
          if (l.from === 'N-09' || l.to === 'N-09') {
            return { ...l, rssi: -108, snr: -2.8, status: 'broken', packetLossPct: 78.0 };
          }
          if (l.from === 'N-10' || l.to === 'N-10') {
            return { ...l, rssi: -96, snr: 1.8, status: 'degraded', packetLossPct: 35.0 };
          }
          return l;
        })
      );

      setLogs((prev) => [
        ...prev,
        {
          id: `fire-4-${Date.now()}`,
          timeStr: time2,
          nodeId: 'N-09',
          type: 'anomaly',
          message: 'Node N-09 mesh route severed — RF absorption spike (-32dBm) consistent with ionizing smoke plume',
        },
        {
          id: `fire-5-${Date.now()}`,
          timeStr: time2,
          nodeId: 'N-10',
          type: 'warning',
          message: 'Node N-10 telemetry: temp rising to 44.2°C — wind spreading thermal front NE',
        },
      ]);
    }, 4200);

    // Step 4 (after 6.0s): Prominent summary banner appears
    const t3 = setTimeout(() => {
      setShowSummaryBanner(true);
      tacticalAudio.playBlip(740, 0.2);
    }, 6000);

    simulationTimers.current = [t1, t2, t3];
  };

  // RESET MESH NETWORK
  const handleResetMesh = () => {
    simulationTimers.current.forEach((t) => clearTimeout(t));
    simulationTimers.current = [];
    setIsFireSimulating(false);
    setFirePhase(0);
    setShowSummaryBanner(false);
    setNodes(FOREST_MESH_NODES);
    setLinks(INITIAL_MESH_LINKS);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
    setLogs((prev) => [
      ...prev,
      {
        id: `reset-${Date.now()}`,
        timeStr,
        nodeId: 'N-01',
        type: 'ok',
        message: 'Mesh topology reset to nominal baseline. All 14 LoRa links re-established.',
      },
    ]);
  };

  return (
    <div className="p-3 sm:p-4 space-y-4 max-w-7xl mx-auto">
      {/* Prominent Summary Message (Required by prompt) */}
      {showSummaryBanner && (
        <div 
          id="mesh-fire-summary-banner"
          className="p-4 bg-rose-950/90 border-2 border-rose-500 rounded-lg flex flex-wrap items-center justify-between gap-3 text-rose-100 shadow-[0_0_25px_rgba(244,63,94,0.35)] animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 rounded-full text-white">
              <Flame className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              {/* Exact format required: "Zone B-12: fire confidence 87%, 3 nodes affected, spread direction NE" */}
              <div className="text-base sm:text-lg font-bold font-mono tracking-wide text-white">
                Zone B-12: fire confidence 87%, 3 nodes affected, spread direction NE
              </div>
              <p className="text-xs font-mono text-rose-200 mt-0.5">
                Active wildfire thermal anomaly confirmed across nodes N-08, N-09, and N-10. Automatic Forest Service Dispatch alert triggered.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1 bg-rose-900 border border-rose-400 rounded text-rose-100 font-bold">
              CONTAINMENT SECTOR B-12
            </span>
          </div>
        </div>
      )}

      {/* Control Action Toolbar */}
      <div className="bg-[#0c1426] border border-slate-800 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-amber-950/50 border border-amber-500/40 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.2)]">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold font-tactical uppercase tracking-wider text-slate-100">
              RF Mesh Network & Wildfire Spread Topology
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              LoRa multi-hop forest sensor canopy graph with dynamic packet loss and heat-attenuated link degradation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Button: Trigger Fire Event at Node N-08 */}
          <button
            onClick={handleTriggerFireEvent}
            id="btn-trigger-fire-mesh"
            disabled={isFireSimulating && firePhase > 0}
            className={`px-4 py-2 rounded text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isFireSimulating
                ? 'bg-rose-600 text-white shadow-[0_0_16px_rgba(225,29,72,0.5)] border border-rose-400'
                : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80 hover:border-rose-600'
            }`}
          >
            <Flame className={`w-4 h-4 text-orange-400 ${isFireSimulating ? 'animate-bounce' : ''}`} />
            <span>Trigger Fire Event at Node N-08</span>
          </button>

          {/* Reset Mesh Button */}
          <button
            onClick={handleResetMesh}
            id="btn-reset-mesh"
            className="px-3 py-2 rounded text-xs font-mono font-bold flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Mesh</span>
          </button>
        </div>
      </div>

      {/* Main Grid: SVG Mesh Graph on Left (approx 65%), Heartbeat Log Panel on Right (approx 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Interactive SVG Mesh Graph */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="bg-[#090e1c] border border-slate-800 rounded-lg overflow-hidden flex flex-col relative shadow-xl">
            {/* Graph Header overlay */}
            <div className="p-3 bg-[#0c1426] border-b border-slate-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-200 font-bold uppercase font-tactical">
                  FOREST CANOPY MESH TOPOLOGY (10 NODES • 14 LINKS)
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-1 bg-emerald-400 rounded"></span> Optimal Link
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-1 bg-amber-400 rounded"></span> Degraded
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-1 bg-rose-500 rounded"></span> Severed
                </span>
              </div>
            </div>

            {/* SVG Interactive Canvas */}
            <div className="relative w-full h-[450px] sm:h-[500px] bg-[#070b16] select-none overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 1000 600">
                {/* Defs for gradients and glow filters */}
                <defs>
                  <filter id="glow-mesh" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <pattern id="mesh-grid-pattern" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#101b33" strokeWidth="0.5" />
                  </pattern>
                </defs>

                {/* Subgrid */}
                <rect width="100%" height="100%" fill="url(#mesh-grid-pattern)" />

                {/* Canopy terrain subtle contour lines */}
                <g stroke="#14213d" strokeWidth="1" fill="none" opacity="0.5">
                  <path d="M 100,100 Q 300,180 500,120 T 900,150" />
                  <path d="M 150,300 Q 400,250 650,340 T 950,280" />
                  <path d="M 200,480 Q 450,420 700,520 T 980,460" />
                </g>

                {/* LINKS (Lines between nodes) */}
                {links.map((link) => {
                  const fromNode = nodes.find((n) => n.id === link.from);
                  const toNode = nodes.find((n) => n.id === link.to);
                  if (!fromNode || !toNode) return null;

                  // Scale percent coords to 1000x600 SVG viewBox
                  const x1 = (fromNode.x / 100) * 1000;
                  const y1 = (fromNode.y / 100) * 600;
                  const x2 = (toNode.x / 100) * 1000;
                  const y2 = (toNode.y / 100) * 600;

                  const midX = (x1 + x2) / 2;
                  const midY = (y1 + y2) / 2;

                  const isHovered = hoveredLink?.id === link.id;

                  const linkColor =
                    link.status === 'broken'
                      ? '#f43f5e'
                      : link.status === 'degraded'
                      ? '#f59e0b'
                      : '#10b981';

                  const strokeWidth = isHovered ? 3.5 : link.status === 'broken' ? 1.5 : 2;

                  return (
                    <g key={link.id} onMouseEnter={() => setHoveredLink(link)} onMouseLeave={() => setHoveredLink(null)} className="cursor-pointer">
                      {/* Invisible wider hit-box for easy hovering */}
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="16" />

                      {/* Visible Link Line */}
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={linkColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={link.status === 'broken' ? '3,6' : link.status === 'degraded' ? '6,3' : 'none'}
                        opacity={link.status === 'broken' ? 0.35 : 0.85}
                        className="transition-all duration-300"
                      />

                      {/* Packet pulse animation on healthy links */}
                      {link.status === 'optimal' && !isFireSimulating && (
                        <circle r="2.5" fill="#38bdf8">
                          <animateMotion
                            path={`M ${x1},${y1} L ${x2},${y2}`}
                            dur={`${3 + (link.id.charCodeAt(2) % 3)}s`}
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}

                      {/* Prompt Requirement: "Each link has a live RSSI/SNR value shown on hover or as a small label" */}
                      {/* Small telemetry label at midpoint */}
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-32"
                          y="-9"
                          width="64"
                          height="16"
                          rx="3"
                          fill="#0b1325"
                          stroke={isHovered ? '#38bdf8' : '#1e293b'}
                          strokeWidth="1"
                          opacity="0.9"
                        />
                        <text
                          x="0"
                          y="3"
                          textAnchor="middle"
                          fill={link.status === 'broken' ? '#f87171' : link.status === 'degraded' ? '#fbbf24' : '#94a3b8'}
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {link.rssi}dBm
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* SPREAD VECTOR ARROW & ZONE B-12 ANNOTATION IF FIRE IS EXPANDING */}
                {firePhase >= 2 && (
                  <g>
                    {/* Zone B-12 perimeter boundary highlight */}
                    <ellipse
                      cx="790"
                      cy="320"
                      rx="160"
                      ry="190"
                      fill="rgba(244, 63, 94, 0.08)"
                      stroke="#f43f5e"
                      strokeWidth="2"
                      strokeDasharray="6,4"
                      className="animate-pulse"
                    />
                    <text x="800" y="160" fill="#f87171" fontSize="13" fontFamily="monospace" fontWeight="bold">
                      🔥 ZONE B-12 (FIRE FRONT)
                    </text>

                    {/* Spread Direction Arrow NE */}
                    <g transform="translate(730, 360)">
                      <line x1="0" y1="40" x2="80" y2="-40" stroke="#f43f5e" strokeWidth="4" strokeDasharray="8,4" />
                      <polygon points="80,-40 60,-35 75,-20" fill="#f43f5e" />
                      <text x="90" y="-45" fill="#fca5a5" fontSize="12" fontFamily="monospace" fontWeight="bold">
                        SPREAD DIRECTION: NE (42°)
                      </text>
                    </g>
                  </g>
                )}

                {/* NODES (Dots with labels) */}
                {nodes.map((node) => {
                  const cx = (node.x / 100) * 1000;
                  const cy = (node.y / 100) * 600;
                  const isSelected = selectedNode?.id === node.id;

                  const nodeColor =
                    node.status === 'critical'
                      ? '#f43f5e'
                      : node.status === 'warning'
                      ? '#f59e0b'
                      : '#10b981';

                  const isGateway = node.role === 'gateway';

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${cx}, ${cy})`}
                      onClick={() => setSelectedNode(node)}
                      className="cursor-pointer group"
                    >
                      {/* Critical Ping Halo */}
                      {node.status === 'critical' && (
                        <circle r="22" fill="none" stroke="#f43f5e" strokeWidth="2" opacity="0.6">
                          <animate attributeName="r" values="12;28" dur="1.5s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.8;0" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                      )}

                      {/* Selection Ring */}
                      {isSelected && (
                        <circle r="18" fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="3,3" />
                      )}

                      {/* Outer node circle */}
                      <circle
                        r={isGateway ? 14 : 11}
                        fill="#0c1427"
                        stroke={nodeColor}
                        strokeWidth={isGateway ? 3 : 2}
                      />

                      {/* Inner dot */}
                      <circle
                        r={isGateway ? 6 : 4.5}
                        fill={nodeColor}
                      />

                      {/* Node Label above or below */}
                      <g transform="translate(0, 24)">
                        <rect
                          x="-30"
                          y="-10"
                          width="60"
                          height="18"
                          rx="3"
                          fill="#090e1c"
                          stroke={nodeColor}
                          strokeWidth="1"
                          opacity="0.95"
                        />
                        <text
                          x="0"
                          y="3"
                          textAnchor="middle"
                          fill="#f1f5f9"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {node.id}
                        </text>
                      </g>

                      {/* Secondary Temperature or Role tag */}
                      <text
                        x="0"
                        y="-16"
                        textAnchor="middle"
                        fill={node.tempC > 45 ? '#f87171' : '#94a3b8'}
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {isGateway ? 'GATEWAY' : `${node.tempC.toFixed(1)}°C`}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Hovered link telemetry popover */}
              {hoveredLink && (
                <div className="absolute top-3 left-3 bg-[#0c1427]/95 border border-cyan-500/40 rounded p-2.5 text-xs font-mono text-slate-200 shadow-xl backdrop-blur-sm pointer-events-none z-20 min-w-[220px]">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-800">
                    <span className="font-bold text-cyan-300">Link {hoveredLink.from} ↔ {hoveredLink.to}</span>
                    <span className={`text-[10px] px-1 rounded uppercase font-bold ${
                      hoveredLink.status === 'broken' ? 'bg-rose-950 text-rose-300' : hoveredLink.status === 'degraded' ? 'bg-amber-950 text-amber-300' : 'text-emerald-400'
                    }`}>
                      {hoveredLink.status}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-[11px]">
                    <span className="text-slate-400">Signal RSSI:</span>
                    <span className="font-bold text-slate-100">{hoveredLink.rssi} dBm</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Signal SNR:</span>
                    <span className="font-bold text-slate-100">{hoveredLink.snr} dB</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Packet Loss Rate:</span>
                    <span className="font-bold text-slate-100">{hoveredLink.packetLossPct}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Selected Node Details micro-footer bar */}
            {selectedNode && (
              <div className="p-3 bg-[#0c1426] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cyan-300">Node {selectedNode.id} ({selectedNode.label}):</span>
                  <span className="text-slate-300 flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                    {selectedNode.tempC}°C
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-300 flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-cyan-400" />
                    RH {selectedNode.humidityPct}%
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-300 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    CO {selectedNode.smokePpm}ppm
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-slate-300">
                    <Battery className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{selectedNode.batteryPct}%</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                    selectedNode.status === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {selectedNode.status}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Heartbeat Log Panel */}
        <div className="lg:col-span-4 flex flex-col">
          <HeartbeatLogPanel
            logs={logs}
            isStreaming={isStreaming}
            onToggleStreaming={() => setIsStreaming(!isStreaming)}
          />
        </div>
      </div>
    </div>
  );
};
