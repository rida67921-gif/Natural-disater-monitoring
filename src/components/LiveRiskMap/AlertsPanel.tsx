import React from 'react';
import { ActiveAlert, HazardType, RiskZone } from '../../types';
import { 
  Droplets, 
  Flame, 
  Wind, 
  ChevronRight, 
  BellRing,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Radio
} from 'lucide-react';

interface AlertsPanelProps {
  alerts: ActiveAlert[];
  zones: RiskZone[];
  selectedNodeId: string | null;
  onSelectAlertNode: (nodeId: string) => void;
  onSelectZone?: (zoneId: string) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  zones,
  selectedNodeId,
  onSelectAlertNode,
  onSelectZone,
}) => {
  const getHazardLabel = (type: HazardType) => {
    switch (type) {
      case 'flood':
        return 'Flood risk';
      case 'fire':
        return 'Fire risk';
      case 'air_quality':
        return 'Air hazard';
    }
  };

  const getSeverityDot = (severity: ActiveAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <span className="text-rose-500 animate-pulse text-sm">🔴</span>;
      case 'warning':
        return <span className="text-amber-500 text-sm">🟠</span>;
      case 'watch':
        return <span className="text-yellow-400 text-sm">🟡</span>;
      default:
        return <span className="text-emerald-400 text-sm">🟢</span>;
    }
  };

  // Group alerts by zone
  const zoneAlertsMap = zones.map((zone) => {
    const zoneAlerts = alerts.filter((a) => zone.assignedNodeIds.includes(a.nodeId));
    return {
      zone,
      alerts: zoneAlerts,
    };
  });

  // Sort zones so Tier 1 (Extreme Danger) is first, then Tier 2 (Expected Risk), then Tier 3 (Safe)
  const sortedZoneGroups = [...zoneAlertsMap].sort((a, b) => {
    if (a.zone.tier !== b.zone.tier) {
      return a.zone.tier - b.zone.tier;
    }
    return b.alerts.length - a.alerts.length;
  });

  const getZoneTierBadge = (tier: RiskZone['tier']) => {
    switch (tier) {
      case 1:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-950/80 text-rose-300 border border-rose-600/80 flex items-center gap-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            EXTREME DANGER
          </span>
        );
      case 2:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-950/80 text-amber-300 border border-amber-500/80 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            EXPECTED RISK
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            SAFE
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0a1020]/90 border border-slate-800 rounded-lg p-3.5 flex flex-col h-full shadow-lg">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <BellRing className="w-3.5 h-3.5 animate-bounce" />
          </div>
          <div>
            <h2 className="text-xs font-bold font-tactical uppercase tracking-wider text-slate-200">
              Active Alerts & Zone Status
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">
              GROUPED BY RISK ZONE TIER
            </span>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-rose-950/60 text-rose-300 border border-rose-800/60">
          {alerts.length} ALERTS
        </span>
      </div>

      {/* Grouped by Zone Feed (User request: Group alerts by zone instead of by node) */}
      <div className="flex-1 overflow-y-auto mt-2 space-y-3.5 pr-1 max-h-[640px]">
        {sortedZoneGroups.map(({ zone, alerts: zAlerts }) => {
          const isDanger = zone.tier === 1;
          const isExpected = zone.tier === 2;
          const isSafe = zone.tier === 3;

          // Header string requirement:
          // "Zone A (Extreme Danger) — 2 active alerts"
          // "Zone B (Expected Risk) — auto-escalated, 0 direct sensor alerts"
          const tierLabel = isDanger
            ? 'Extreme Danger'
            : isExpected
            ? 'Expected Risk'
            : 'Safe';

          const countSubtitle =
            isExpected && zAlerts.length === 0
              ? 'auto-escalated, 0 direct sensor alerts'
              : `${zAlerts.length} active alert${zAlerts.length === 1 ? '' : 's'}`;

          return (
            <div
              key={zone.id}
              className={`rounded-lg border transition-all overflow-hidden ${
                isDanger
                  ? 'bg-rose-950/15 border-rose-900/60'
                  : isExpected
                  ? 'bg-amber-950/15 border-amber-900/60'
                  : 'bg-slate-900/20 border-slate-800/80'
              }`}
            >
              {/* Zone Group Header */}
              <div
                onClick={() => onSelectZone?.(zone.id)}
                className={`p-2.5 flex items-center justify-between border-b cursor-pointer transition-colors ${
                  isDanger
                    ? 'bg-rose-950/40 border-rose-900/60 hover:bg-rose-900/40'
                    : isExpected
                    ? 'bg-amber-950/40 border-amber-900/60 hover:bg-amber-900/40'
                    : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-100">
                    {zone.code} ({tierLabel}) — {countSubtitle}
                  </span>
                </div>
                <div>{getZoneTierBadge(zone.tier)}</div>
              </div>

              {/* Body: Auto-escalated Banner if 0 direct alerts, OR alerts list */}
              <div className="p-2 space-y-1.5">
                {/* Zone auto-escalation notice for Tier 2 Expected Risk */}
                {isExpected && zAlerts.length === 0 && (
                  <div className="p-2.5 rounded bg-amber-950/30 border border-amber-600/40 text-xs font-mono text-amber-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-300">
                        AUTOMATIC PROPAGATION ESCALATION
                      </div>
                      <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">
                        {zone.escalationReason ||
                          'Geographically adjacent downstream zone from active flood/wildfire incident. Advance public safety notice dispatched.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Safe zone indicator if 0 alerts */}
                {isSafe && zAlerts.length === 0 && (
                  <div className="py-1.5 px-2 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      All telemetry within nominal baseline
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {zone.assignedNodeIds.length} Nodes Online
                    </span>
                  </div>
                )}

                {/* Direct Sensor Alerts */}
                {zAlerts.map((alert) => {
                  const isSelected = selectedNodeId === alert.nodeId;
                  return (
                    <button
                      key={alert.id}
                      onClick={() => onSelectAlertNode(alert.nodeId)}
                      id={`alert-item-${alert.id}`}
                      className={`w-full text-left p-2 rounded border transition-all cursor-pointer group ${
                        isSelected
                          ? 'bg-slate-800/95 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                          : alert.severity === 'critical'
                          ? 'bg-rose-950/30 hover:bg-rose-950/60 border-rose-800/70'
                          : 'bg-slate-900/60 hover:bg-slate-800/70 border-slate-800'
                      }`}
                    >
                      {/* Format: 🔴 Flood risk — Node F-102 — 91% confidence — Assam sector */}
                      <div className="flex items-start gap-1.5 text-xs font-mono font-medium text-slate-100">
                        <span className="shrink-0">{getSeverityDot(alert.severity)}</span>
                        <span className="leading-snug">
                          <strong className="text-slate-100">{getHazardLabel(alert.hazardType)}</strong>
                          <span className="text-slate-400"> — Node </span>
                          <span className="text-cyan-300 font-bold">{alert.nodeId}</span>
                          <span className="text-slate-400"> — </span>
                          <span
                            className={
                              alert.severity === 'critical'
                                ? 'text-rose-300 font-bold'
                                : 'text-amber-300 font-bold'
                            }
                          >
                            {alert.confidence}% confidence
                          </span>
                        </span>
                      </div>

                      <div className="mt-1 pl-5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="truncate pr-2 text-slate-400">{alert.metricSummary}</span>
                        <span className="text-slate-500 shrink-0 flex items-center gap-1">
                          <span>{alert.timestamp}</span>
                          <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-cyan-400" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex items-center justify-between">
        <span>DYNAMIC MULTI-ZONE CASCADE ENGINE</span>
        <span className="text-emerald-400">ZONES EVALUATED: 6/6</span>
      </div>
    </div>
  );
};
