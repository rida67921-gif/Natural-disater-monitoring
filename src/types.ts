export type HazardType = 'flood' | 'fire' | 'air_quality';

export type RiskLevel = 'normal' | 'watch' | 'warning' | 'critical' | 'offline';

export type SensorHealth = 'normal' | 'suspicious' | 'failed';

export interface NodeConnectivity {
  rssi: number; // in dBm, e.g. -78
  snr: number; // in dB, e.g. 9.2
  protocol: 'LoRaWAN 868' | 'LoRa Mesh' | 'NB-IoT';
  lastPingSec: number;
}

export interface SensorNode {
  id: string; // e.g. 'F-102', 'N-08', 'A-015'
  name: string;
  hazardType: HazardType;
  sector: string; // e.g. 'Assam Sector', 'Western Ghats', 'Himalayan Basin', 'Sundarbans'
  // Map coordinates (0 to 100% relative coordinates for responsive tactical canvas)
  x: number;
  y: number;
  lat: number;
  lng: number;
  elevationMeters: number;
  status: RiskLevel;
  health: SensorHealth;
  healthNote?: string;
  batteryPct: number;
  confidenceScore: number; // 0 - 100
  connectivity: NodeConnectivity;
  primaryMetric: {
    label: string;
    value: number;
    unit: string;
    warningThreshold: number;
    criticalThreshold: number;
  };
  secondaryMetrics: Array<{
    label: string;
    value: number | string;
    unit?: string;
  }>;
  sparklineHistory: number[]; // 10-15 data points
}

export interface ActiveAlert {
  id: string;
  nodeId: string;
  hazardType: HazardType;
  severity: RiskLevel;
  confidence: number;
  sector: string;
  metricSummary: string;
  timestamp: string;
}

export interface MeshLink {
  id: string;
  from: string;
  to: string;
  rssi: number; // dBm
  snr: number; // dB
  status: 'optimal' | 'degraded' | 'broken';
  packetLossPct: number;
}

export interface MeshNode {
  id: string; // 'N-01' through 'N-10'
  label: string;
  role: 'gateway' | 'repeater' | 'sensor';
  x: number;
  y: number;
  tempC: number;
  humidityPct: number;
  smokePpm: number;
  status: RiskLevel;
  batteryPct: number;
}

export interface HeartbeatLog {
  id: string;
  timeStr: string;
  nodeId: string;
  type: 'ok' | 'warning' | 'missed' | 'offline' | 'anomaly';
  message: string;
  rssi?: number;
  temp?: number;
}

export type WindDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export type ZoneRiskTier = 1 | 2 | 3; // 1: Extreme Danger (Red), 2: Expected Risk (Orange), 3: Safe (Green)

export interface RiskZone {
  id: string;
  code: string; // e.g. 'Zone A'
  name: string; // e.g. 'Riverside District'
  description: string;
  polygonPoints: string; // coordinate string in 0-100% space
  labelCoord: { x: number; y: number };
  assignedNodeIds: string[];
  downstreamZoneId?: string;
  downwindZoneMap?: Partial<Record<WindDirection, string>>;
  tier: ZoneRiskTier;
  escalationType: 'direct_critical' | 'downstream_flood' | 'downwind_fire' | 'safe';
  escalationReason?: string;
}
