import React, { useState, useEffect } from 'react';
import { 
  INITIAL_NODES, 
  INITIAL_ACTIVE_ALERTS 
} from './data/mockNodes';
import { SensorNode, ActiveAlert } from './types';
import { Header } from './components/Header';
import { TabsNav, ActiveTab } from './components/TabsNav';
import { LiveRiskMapView } from './components/LiveRiskMap/LiveRiskMapView';
import { DigitalTwinSimulator } from './components/DigitalTwin/DigitalTwinSimulator';
import { MeshNetworkView } from './components/MeshNetwork/MeshNetworkView';
import { tacticalAudio } from './utils/audio';
import { Shield, Activity, Radio, Cpu, Bell } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [nodes, setNodes] = useState<SensorNode[]>(INITIAL_NODES);
  const [alerts, setAlerts] = useState<ActiveAlert[]>(INITIAL_ACTIVE_ALERTS);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('F-102');
  const [twinNodeId, setTwinNodeId] = useState<string>('F-102');

  // Realistic subtle live telemetry jitter (IoT heartbeat)
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.status === 'offline') return node;

          // Slight realistic sensor reading drift (e.g. ±0.01m water level or ±0.1°C)
          const delta = (Math.random() - 0.49) * 0.02;
          const newPrimaryVal = +(node.primaryMetric.value + delta).toFixed(2);
          const newSparkline = [...node.sparklineHistory.slice(1), newPrimaryVal];

          return {
            ...node,
            primaryMetric: {
              ...node.primaryMetric,
              value: newPrimaryVal,
            },
            connectivity: {
              ...node.connectivity,
              lastPingSec: 1 + Math.floor(Math.random() * 4),
            },
            sparklineHistory: newSparkline,
          };
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Summary statistics for Top Bar
  const totalNodesCount = nodes.length;
  const activeAlertsCount = alerts.length;
  const criticalAlertCount = alerts.filter((a) => a.severity === 'critical').length;
  const nodesOfflineCount = nodes.filter((n) => n.status === 'offline').length;
  const avgBattery =
    nodes.reduce((acc, curr) => acc + curr.batteryPct, 0) / (nodes.length || 1);

  // Jump from Map Node Detail to Digital Twin
  const handleInspectInTwin = (nodeId: string) => {
    setTwinNodeId(nodeId);
    setActiveTab('twin');
    tacticalAudio.playBlip(780, 0.08);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Persistent Top Header Bar */}
      <Header
        totalNodes={totalNodesCount}
        activeAlertsCount={activeAlertsCount}
        nodesOffline={nodesOfflineCount}
        avgBattery={avgBattery}
        criticalAlertCount={criticalAlertCount}
      />

      {/* Tabs / Section Navigation */}
      <TabsNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          tacticalAudio.playBlip(650, 0.05);
        }}
        activeAlertCount={activeAlertsCount}
      />

      {/* Main Tab Views */}
      <main className="flex-1 overflow-x-hidden">
        {/* TAB 1: LIVE RISK MAP (Default View) */}
        {activeTab === 'map' && (
          <LiveRiskMapView
            nodes={nodes}
            alerts={alerts}
            selectedNodeId={selectedNodeId}
            onSelectNode={(id) => {
              setSelectedNodeId(id);
              tacticalAudio.playBlip(700, 0.05);
            }}
            onInspectInTwin={handleInspectInTwin}
          />
        )}

        {/* TAB 2: DIGITAL TWIN SIMULATOR */}
        {activeTab === 'twin' && (
          <DigitalTwinSimulator
            initialNodeId={twinNodeId}
          />
        )}

        {/* TAB 3: RF MESH NETWORK VIEW (Fire Detection) */}
        {activeTab === 'mesh' && (
          <MeshNetworkView />
        )}
      </main>

      {/* Tactical Bottom Status Bar */}
      <footer className="bg-[#050811] border-t border-slate-800/90 px-4 py-2 text-[11px] font-mono text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>LORA MESH NETWORK: 868.1 MHz [SF8 / CR 4/5]</span>
          </span>
          <span className="text-slate-700">|</span>
          <span className="hidden sm:inline text-slate-400">
            GATEWAY LATENCY: 18ms
          </span>
          <span className="hidden md:inline text-slate-400">
            FIRMWARE: EIN-OS v4.18-RELEASE
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">
            DISASTER PROTOCOL: <strong className="text-slate-200">STANDBY LEVEL 2</strong>
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            EDGE AI INFERENCE ACTIVE
          </span>
        </div>
      </footer>
    </div>
  );
}
