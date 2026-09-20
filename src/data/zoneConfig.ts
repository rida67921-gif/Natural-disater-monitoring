import { RiskZone, SensorNode, WindDirection } from '../types';

export const BASE_ZONES: Omit<RiskZone, 'tier' | 'escalationType' | 'escalationReason'>[] = [
  {
    id: 'zone-a',
    code: 'Zone A',
    name: 'Riverside District',
    description: 'Upper River Corridor & Floodplain',
    polygonPoints: '50,4 96,4 96,46 52,46 50,38',
    labelCoord: { x: 74, y: 18 },
    assignedNodeIds: ['F-102', 'F-104', 'N-04', 'A-033'],
    downstreamZoneId: 'zone-b',
    downwindZoneMap: {
      SE: 'zone-b',
      S: 'zone-b',
      SW: 'zone-d',
      W: 'zone-e',
      NW: 'zone-e',
      N: 'zone-a',
      NE: 'zone-a',
      E: 'zone-a',
    },
  },
  {
    id: 'zone-b',
    code: 'Zone B',
    name: 'Downstream Ward 4',
    description: 'Lower Basin & Delta Estuary',
    polygonPoints: '52,46 96,46 96,74 54,74 54,64',
    labelCoord: { x: 75, y: 58 },
    assignedNodeIds: ['F-120', 'A-022', 'F-110'],
    downstreamZoneId: 'zone-f',
    downwindZoneMap: {
      S: 'zone-f',
      SE: 'zone-f',
      SW: 'zone-f',
      W: 'zone-d',
      NW: 'zone-d',
      N: 'zone-a',
      NE: 'zone-a',
      E: 'zone-b',
    },
  },
  {
    id: 'zone-c',
    code: 'Zone C',
    name: 'Hill Township & Forest',
    description: 'Western Ghats Ridge & Canopy',
    polygonPoints: '4,42 32,42 34,64 36,94 4,94',
    labelCoord: { x: 18, y: 68 },
    assignedNodeIds: ['N-09', 'N-08', 'N-07', 'F-108', 'A-028'],
    downstreamZoneId: 'zone-d',
    downwindZoneMap: {
      NE: 'zone-d',
      E: 'zone-d',
      SE: 'zone-f',
      S: 'zone-f',
      N: 'zone-e',
      NW: 'zone-e',
      SW: 'zone-c',
      W: 'zone-c',
    },
  },
  {
    id: 'zone-d',
    code: 'Zone D',
    name: 'Central Valley Township',
    description: 'Industrial Basin & Ravines',
    polygonPoints: '32,42 52,46 54,64 34,64',
    labelCoord: { x: 43, y: 53 },
    assignedNodeIds: ['A-044', 'N-10'],
    downstreamZoneId: 'zone-b',
    downwindZoneMap: {
      E: 'zone-b',
      SE: 'zone-b',
      NE: 'zone-a',
      N: 'zone-e',
      S: 'zone-f',
      SW: 'zone-c',
      W: 'zone-c',
      NW: 'zone-e',
    },
  },
  {
    id: 'zone-e',
    code: 'Zone E',
    name: 'Highland Headwaters',
    description: 'Himalayan Basin & Glacial Runoff',
    polygonPoints: '4,4 50,4 50,38 28,42 4,42',
    labelCoord: { x: 26, y: 20 },
    assignedNodeIds: ['A-040', 'F-115', 'N-05', 'A-015'],
    downstreamZoneId: 'zone-a',
    downwindZoneMap: {
      E: 'zone-a',
      SE: 'zone-d',
      S: 'zone-d',
      SW: 'zone-c',
      W: 'zone-e',
      NW: 'zone-e',
      N: 'zone-e',
      NE: 'zone-a',
    },
  },
  {
    id: 'zone-f',
    code: 'Zone F',
    name: 'Coastal Sanctuary',
    description: 'Sundarbans Estuary & Mangrove Buffer',
    polygonPoints: '36,64 96,74 96,94 36,94',
    labelCoord: { x: 66, y: 84 },
    assignedNodeIds: [],
    downwindZoneMap: {
      N: 'zone-b',
      NW: 'zone-d',
      W: 'zone-c',
      NE: 'zone-b',
      E: 'zone-f',
      SE: 'zone-f',
      S: 'zone-f',
      SW: 'zone-f',
    },
  },
];

export const WIND_ANGLES: Record<WindDirection, number> = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: 225,
  W: 270,
  NW: 315,
};

/**
 * Evaluates zone classification based on sensor node statuses,
 * physical flow (flood downstream), and meteorological transport (wind direction for fire).
 */
export function evaluateZones(
  nodes: SensorNode[],
  windDirection: WindDirection,
  promotedZoneIds: Set<string> = new Set()
): RiskZone[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Step 1: Identify direct Zone 1 (Extreme Danger) triggers
  const initialEvaluations = BASE_ZONES.map((zone) => {
    const zoneNodes = zone.assignedNodeIds
      .map((id) => nodeMap.get(id))
      .filter((n): n is SensorNode => Boolean(n));

    const criticalNodes = zoneNodes.filter((n) => n.status === 'critical');
    const hasCritical = criticalNodes.length > 0;

    let primaryHazard: string | undefined;
    if (hasCritical) {
      const floodNode = criticalNodes.find((n) => n.hazardType === 'flood');
      const fireNode = criticalNodes.find((n) => n.hazardType === 'fire');
      primaryHazard = floodNode ? 'flood' : fireNode ? 'fire' : criticalNodes[0].hazardType;
    }

    return {
      ...zone,
      tier: (hasCritical ? 1 : 3) as 1 | 2 | 3,
      escalationType: (hasCritical ? 'direct_critical' : 'safe') as
        | 'direct_critical'
        | 'downstream_flood'
        | 'downwind_fire'
        | 'safe',
      escalationReason: hasCritical
        ? `${criticalNodes.length} node(s) in critical alarm: ${criticalNodes.map((n) => n.id).join(', ')}`
        : undefined,
      primaryHazard,
      hasCritical,
    };
  });

  // Step 2: Compute adjacent propagation (Zone 2: Expected Risk)
  const zoneResult = initialEvaluations.map((zone) => {
    // If already Tier 1, keep Tier 1
    if (zone.tier === 1) {
      return zone;
    }

    // Check if this zone is explicitly promoted by propagation delay timer
    const isPromoted = promotedZoneIds.has(zone.id);

    // Look for any Tier 1 zone that would propagate to this zone
    for (const sourceZone of initialEvaluations) {
      if (sourceZone.tier !== 1) continue;

      // Flood Propagation: Downstream zone
      if (sourceZone.primaryHazard === 'flood' && sourceZone.downstreamZoneId === zone.id) {
        if (isPromoted) {
          return {
            ...zone,
            tier: 2 as const,
            escalationType: 'downstream_flood' as const,
            escalationReason: `Downstream corridor of active Zone 1 flood event in ${sourceZone.code} (${sourceZone.name})`,
          };
        }
      }

      // Fire Propagation: Downwind zone respecting current wind direction
      if (sourceZone.primaryHazard === 'fire') {
        const targetDownwindZoneId = sourceZone.downwindZoneMap?.[windDirection];
        if (targetDownwindZoneId === zone.id) {
          if (isPromoted) {
            return {
              ...zone,
              tier: 2 as const,
              escalationType: 'downwind_fire' as const,
              escalationReason: `Downwind (${windDirection}) propagation path of active wildfire in ${sourceZone.code}`,
            };
          }
        }
      }
    }

    // Default to Safe
    return {
      ...zone,
      tier: 3 as const,
      escalationType: 'safe' as const,
      escalationReason: undefined,
    };
  });

  return zoneResult;
}
