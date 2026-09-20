import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SensorNode, ActiveAlert, WindDirection, RiskZone } from '../../types';
import { RiskMap } from './RiskMap';
import { AlertsPanel } from './AlertsPanel';
import { NodeDetailCard } from './NodeDetailCard';
import { evaluateZones } from '../../data/zoneConfig';
import { tacticalAudio } from '../../utils/audio';
import { 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  ShieldAlert, 
  Info,
  Radio
} from 'lucide-react';

interface LiveRiskMapViewProps {
  nodes: SensorNode[];
  alerts: ActiveAlert[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onInspectInTwin: (nodeId: string) => void;
}

export const LiveRiskMapView: React.FC<LiveRiskMapViewProps> = ({
  nodes: initialNodes,
  alerts: initialAlerts,
  selectedNodeId,
  onSelectNode,
  onInspectInTwin,
}) => {
  // Working local nodes and alerts so the demo controls can manipulate telemetry live
  const [currentNodes, setCurrentNodes] = useState<SensorNode[]>(initialNodes);
  const [currentAlerts, setCurrentAlerts] = useState<ActiveAlert[]>(initialAlerts);

  // Sync with prop updates when not running a custom cascade demo
  const [isCascadeRunning, setIsCascadeRunning] = useState<boolean>(false);
  const [windDirection, setWindDirection] = useState<WindDirection>('NE');
  const [showZoneLayer, setShowZoneLayer] = useState<boolean>(true);

  // Set of zone IDs that have been promoted to Tier 2 (after delay)
  const [promotedZoneIds, setPromotedZoneIds] = useState<Set<string>>(new Set(['zone-b']));
  const [toastBanner, setToastBanner] = useState<{
    type: 'cascade' | 'fire' | 'info';
    message: string;
    subtext?: string;
  } | null>(null);

  const timers = useRef<NodeJS.Timeout[]>([]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  // Whenever wind direction changes and there's a fire critical node, update downwind promotion
  useEffect(() => {
    const hasFireCriticalInZoneC = currentNodes.some(
      (n) => (n.id === 'N-08' || n.id === 'N-07') && n.status === 'critical'
    );

    if (hasFireCriticalInZoneC) {
      // Re-evaluate downwind promotion
      const t = setTimeout(() => {
        setPromotedZoneIds((prev) => {
          const next = new Set(prev);
          // Zone D is NE/E, Zone B is SE, Zone E is N
          if (windDirection === 'NE' || windDirection === 'E') {
            next.add('zone-d');
          } else if (windDirection === 'SE') {
            next.add('zone-b');
          } else if (windDirection === 'N' || windDirection === 'NW') {
            next.add('zone-e');
          }
          return next;
        });
      }, 1200);
      timers.current.push(t);
    }
  }, [windDirection, currentNodes]);

  // Evaluate Zone Risk Tiers using real JS logic
  const zones: RiskZone[] = useMemo(() => {
    return evaluateZones(currentNodes, windDirection, promotedZoneIds);
  }, [currentNodes, windDirection, promotedZoneIds]);

  // Selected node object
  const selectedNode = currentNodes.find((n) => n.id === selectedNodeId) || null;

  // TRIGGER MULTI-ZONE CASCADE DEMO (Requirement from prompt)
  const handleTriggerCascadeDemo = () => {
    // Clear any previous timers
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];

    setIsCascadeRunning(true);
    setToastBanner(null);
    tacticalAudio.playBlip(620, 0.15);

    // 1. Sets one river-adjacent node to Critical (zone turns red)
    // and relax other non-adjacent zones to normal/watch so they remain Green (Safe)
    setCurrentNodes((prev) =>
      prev.map((node) => {
        if (node.id === 'F-102') {
          // River-adjacent node in Zone A (Riverside District)
          return {
            ...node,
            status: 'critical',
            primaryMetric: { ...node.primaryMetric, value: 5.45 },
            confidenceScore: 94,
          };
        }
        // Relax other zones to normal or watch so non-adjacent zones are clearly green
        if (node.id === 'N-08' || node.id === 'A-015') {
          return {
            ...node,
            status: 'normal',
            primaryMetric: {
              ...node.primaryMetric,
              value: node.hazardType === 'fire' ? 24.5 : 42,
            },
          };
        }
        return node;
      })
    );

    // Zone A turns red immediately, clear promoted zones initially
    setPromotedZoneIds(new Set());
    onSelectNode('F-102');

    // Update active alerts to reflect Zone A
    setCurrentAlerts([
      {
        id: `alert-cascade-${Date.now()}`,
        nodeId: 'F-102',
        hazardType: 'flood',
        severity: 'critical',
        confidence: 94,
        sector: 'Assam sector',
        metricSummary: 'Stage: 5.45m (+1.85m flood crest surge)',
        timestamp: 'JUST NOW',
      },
    ]);

    // 2. After ~2 seconds, automatically promotes the downstream zone (Zone B) to orange
    const timer = setTimeout(() => {
      setPromotedZoneIds(new Set(['zone-b']));
      setIsCascadeRunning(false);

      // 3. Shows a toast/banner: "Zone B automatically upgraded to Expected Risk — downstream of active Zone 1 flood event. Advance warning issued to residents."
      setToastBanner({
        type: 'cascade',
        message:
          'Zone B automatically upgraded to Expected Risk — downstream of active Zone 1 flood event. Advance warning issued to residents.',
        subtext:
          'Hydraulic routing model predicts flood wave arrival at Downstream Ward 4 in approximately 45 minutes.',
      });

      tacticalAudio.playSiren();
    }, 2000);

    timers.current.push(timer);
  };

  // TRIGGER WILDFIRE DOWNWIND CASCADE DEMO
  const handleTriggerFireWindDemo = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];

    setIsCascadeRunning(true);
    setToastBanner(null);
    tacticalAudio.playBlip(550, 0.15);

    // Set Zone C fire node N-08 to Critical, relax flood nodes
    setCurrentNodes((prev) =>
      prev.map((node) => {
        if (node.id === 'N-08') {
          return {
            ...node,
            status: 'critical',
            primaryMetric: { ...node.primaryMetric, value: 68.2 },
            confidenceScore: 91,
          };
        }
        if (node.id === 'F-102' || node.id === 'A-015') {
          return { ...node, status: 'normal' };
        }
        return node;
      })
    );

    setPromotedZoneIds(new Set());
    onSelectNode('N-08');

    // Promote downwind zone after 1.8 seconds
    const timer = setTimeout(() => {
      let targetZoneId = 'zone-d'; // default for NE
      if (windDirection === 'SE' || windDirection === 'S') targetZoneId = 'zone-f';
      if (windDirection === 'N' || windDirection === 'NW') targetZoneId = 'zone-e';

      setPromotedZoneIds(new Set([targetZoneId]));
      setIsCascadeRunning(false);

      const targetZoneObj = zones.find((z) => z.id === targetZoneId);
      const zoneCode = targetZoneObj ? targetZoneObj.code : 'Downwind Zone';

      setToastBanner({
        type: 'fire',
        message: `${zoneCode} automatically upgraded to Expected Risk — downwind (${windDirection}) of active Zone C wildfire.`,
        subtext: `Thermal convection and smoke particulate plume moving toward ${zoneCode} at 18 km/h. Advance fire-break protocols activated.`,
      });

      tacticalAudio.playBlip(750, 0.2);
    }, 1800);

    timers.current.push(timer);
  };

  // RESET ZONES TO NOMINAL BASELINE
  const handleResetZones = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    setIsCascadeRunning(false);
    setToastBanner(null);
    setCurrentNodes(initialNodes);
    setCurrentAlerts(initialAlerts);
    setPromotedZoneIds(new Set(['zone-b']));
    tacticalAudio.playBlip(480, 0.1);
  };

  return (
    <div className="p-3 sm:p-4 space-y-4 max-w-7xl mx-auto">
      {/* Toast / Banner (Prompt Requirement: "Shows a toast/banner: 'Zone B automatically upgraded to Expected Risk — downstream of active Zone 1 flood event. Advance warning issued to residents.'") */}
      {toastBanner && (
        <div 
          id="zone-cascade-toast-banner"
          className={`p-3.5 sm:p-4 rounded-lg border-2 flex items-start justify-between gap-3 shadow-2xl animate-fade-in ${
            toastBanner.type === 'cascade'
              ? 'bg-amber-950/95 border-amber-500 text-amber-100 shadow-[0_0_25px_rgba(245,158,11,0.35)]'
              : 'bg-rose-950/95 border-rose-500 text-rose-100 shadow-[0_0_25px_rgba(244,63,94,0.35)]'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 mt-0.5 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold font-mono text-white tracking-wide">
                {toastBanner.message}
              </div>
              {toastBanner.subtext && (
                <p className="text-[11px] sm:text-xs font-mono text-amber-200/80 mt-1">
                  {toastBanner.subtext}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setToastBanner(null)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Map on Left (approx 65-70% width), Alerts Panel on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map column */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-4">
          <RiskMap
            nodes={currentNodes}
            zones={zones}
            windDirection={windDirection}
            onWindDirectionChange={(dir) => setWindDirection(dir)}
            selectedNodeId={selectedNodeId}
            onSelectNode={(node) => onSelectNode(node.id)}
            showZoneLayer={showZoneLayer}
            onToggleZoneLayer={() => setShowZoneLayer(!showZoneLayer)}
            onTriggerCascadeDemo={handleTriggerCascadeDemo}
            onTriggerFireWindDemo={handleTriggerFireWindDemo}
            onResetZones={handleResetZones}
            isCascading={isCascadeRunning}
          />

          {/* Quick Node Selector Pills */}
          <div className="bg-[#0b1222] border border-slate-800 rounded-lg p-3 text-xs font-mono">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] font-tactical flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                DIRECT NODE QUICK-SELECT (TOTAL {currentNodes.length} SENSOR STATIONS)
              </span>
              <span className="text-[10px] text-slate-500">6 DYNAMIC RISK ZONES</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {currentNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const statusBg =
                  node.status === 'critical'
                    ? 'bg-rose-950/60 text-rose-300 border-rose-600/70 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                    : node.status === 'warning'
                    ? 'bg-amber-950/60 text-amber-300 border-amber-600/70'
                    : node.status === 'watch'
                    ? 'bg-yellow-950/60 text-yellow-300 border-yellow-600/70'
                    : node.status === 'offline'
                    ? 'bg-slate-800/60 text-slate-400 border-slate-700'
                    : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-700';

                return (
                  <button
                    key={node.id}
                    onClick={() => onSelectNode(node.id)}
                    id={`quick-select-${node.id}`}
                    className={`px-2 py-1 rounded border text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${statusBg} ${
                      isSelected ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-[#0b1222]' : ''
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        node.status === 'critical'
                          ? 'bg-rose-500 animate-ping'
                          : node.status === 'warning'
                          ? 'bg-amber-400'
                          : node.status === 'watch'
                          ? 'bg-yellow-400'
                          : node.status === 'offline'
                          ? 'bg-slate-500'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <span className="font-bold">{node.id}</span>
                    <span className="text-[10px] opacity-70">
                      ({node.hazardType.slice(0, 2).toUpperCase()})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Active Alerts & Selected Node Inspector */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-4">
          {/* If a node is selected, show detail card */}
          {selectedNode ? (
            <NodeDetailCard
              node={selectedNode}
              onClose={() => onSelectNode('')}
              onInspectInTwin={onInspectInTwin}
            />
          ) : (
            <div className="bg-[#0c1427]/80 border border-slate-800 border-dashed rounded-lg p-5 text-center text-slate-400 text-xs font-mono flex flex-col items-center justify-center gap-2">
              <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400">
                🔍
              </div>
              <p className="font-semibold text-slate-300">No Sensor Node Selected</p>
              <p className="text-[11px] text-slate-500 max-w-xs">
                Click any sensor node dot on the regional map or an alert item from the feed below to inspect live telemetry and trend history.
              </p>
            </div>
          )}

          {/* Active Alerts Panel (Grouped by Zone Tier) */}
          <AlertsPanel
            alerts={currentAlerts}
            zones={zones}
            selectedNodeId={selectedNodeId}
            onSelectAlertNode={onSelectNode}
            onSelectZone={(zoneId) => {
              const zone = zones.find((z) => z.id === zoneId);
              if (zone && zone.assignedNodeIds.length > 0) {
                onSelectNode(zone.assignedNodeIds[0]);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
