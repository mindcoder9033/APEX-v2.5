import { TelemetryFrame } from '../types/telemetry';

export interface TrackSignature {
  trackName: string;
  layoutName: string;
  lengthMeters: number;
  tolerancePct?: number; // default +/- 4%
  centerCoordinate?: { x: number; z: number };
}

export const TRACK_SIGNATURES: TrackSignature[] = [
  // 1. Circuit de Barcelona-Catalunya
  { trackName: 'Circuit de Barcelona-Catalunya', layoutName: 'Circuit de Barcelona-Catalunya GP', lengthMeters: 4657, tolerancePct: 3.5 },
  { trackName: 'Circuit de Barcelona-Catalunya', layoutName: 'Circuit de Barcelona-Catalunya National', lengthMeters: 2977, tolerancePct: 3.5 },
  { trackName: 'Circuit de Barcelona-Catalunya', layoutName: 'Circuit de Barcelona-Catalunya National Alt', lengthMeters: 2977, tolerancePct: 3.5 },

  // 2. Circuit de Spa-Francorchamps
  { trackName: 'Circuit de Spa-Francorchamps', layoutName: 'Circuit de Spa-Francorchamps', lengthMeters: 7004, tolerancePct: 3.0 },

  // 3. Homestead-Miami Speedway
  { trackName: 'Homestead-Miami Speedway', layoutName: 'Homestead Speedway (Oval)', lengthMeters: 2414, tolerancePct: 3.5 },
  { trackName: 'Homestead-Miami Speedway', layoutName: 'Homestead Road', lengthMeters: 3560, tolerancePct: 3.5 },

  // 4. Indianapolis Motor Speedway
  { trackName: 'Indianapolis Motor Speedway', layoutName: 'Indianapolis Brickyard Oval', lengthMeters: 4023, tolerancePct: 3.5 },
  { trackName: 'Indianapolis Motor Speedway', layoutName: 'Indianapolis GP', lengthMeters: 3925, tolerancePct: 3.5 },

  // 5. Kyalami Grand Prix Circuit
  { trackName: 'Kyalami Grand Prix Circuit', layoutName: 'Kyalami Grand Prix Circuit', lengthMeters: 4522, tolerancePct: 3.5 },

  // 6. Le Mans - Circuit International de la Sarthe
  { trackName: 'Le Mans - Circuit International de la Sarthe', layoutName: 'Le Mans La Sarthe Full', lengthMeters: 13626, tolerancePct: 2.5 },
  { trackName: 'Le Mans - Circuit International de la Sarthe', layoutName: 'Le Mans Old Mulsanne', lengthMeters: 13562, tolerancePct: 2.5 },

  // 7. Laguna Seca Raceway
  { trackName: 'Laguna Seca Raceway', layoutName: 'Laguna Seca Full', lengthMeters: 3602, tolerancePct: 3.5 },
  { trackName: 'Laguna Seca Raceway', layoutName: 'Laguna Seca Short', lengthMeters: 3000, tolerancePct: 3.5 },
  { trackName: 'Laguna Seca Raceway', layoutName: 'WeatherTech Raceway Laguna Seca', lengthMeters: 3602, tolerancePct: 3.5 },

  // 8. Lime Rock Park
  { trackName: 'Lime Rock Park', layoutName: 'Lime Rock Full', lengthMeters: 2414, tolerancePct: 3.5 },
  { trackName: 'Lime Rock Park', layoutName: 'Lime Rock Full Alt', lengthMeters: 2414, tolerancePct: 3.5 },
  { trackName: 'Lime Rock Park', layoutName: 'Lime Rock South', lengthMeters: 2300, tolerancePct: 3.5 },
  { trackName: 'Lime Rock Park', layoutName: 'Lime Rock Park - Full Circuit', lengthMeters: 2414, tolerancePct: 3.5 },

  // 9. Mid-Ohio Sports Car Course
  { trackName: 'Mid-Ohio Sports Car Course', layoutName: 'Mid-Ohio Full', lengthMeters: 3634, tolerancePct: 3.5 },
  { trackName: 'Mid-Ohio Sports Car Course', layoutName: 'Mid-Ohio Short', lengthMeters: 3621, tolerancePct: 3.5 },

  // 10. Mugello Circuit
  { trackName: 'Mugello Circuit', layoutName: 'Mugello Full', lengthMeters: 5245, tolerancePct: 3.5 },
  { trackName: 'Mugello Circuit', layoutName: 'Mugello Club', lengthMeters: 2795, tolerancePct: 3.5 },

  // 11. Nürburgring
  { trackName: 'Nürburgring', layoutName: 'Nurburgring GP', lengthMeters: 5148, tolerancePct: 3.5 },
  { trackName: 'Nürburgring', layoutName: 'Nurburgring Sprint', lengthMeters: 3629, tolerancePct: 3.5 },

  // 12. Road America
  { trackName: 'Road America', layoutName: 'Road America Full', lengthMeters: 6515, tolerancePct: 3.0 },
  { trackName: 'Road America', layoutName: 'Road America East', lengthMeters: 3500, tolerancePct: 3.5 },

  // 13. Silverstone Circuit
  { trackName: 'Silverstone Circuit', layoutName: 'Silverstone GP', lengthMeters: 5891, tolerancePct: 3.0 },
  { trackName: 'Silverstone Circuit', layoutName: 'Silverstone International', lengthMeters: 2979, tolerancePct: 3.5 },
  { trackName: 'Silverstone Circuit', layoutName: 'Silverstone National', lengthMeters: 2639, tolerancePct: 3.5 },

  // 14. Suzuka Circuit
  { trackName: 'Suzuka Circuit', layoutName: 'Suzuka Full', lengthMeters: 5807, tolerancePct: 3.0 },
  { trackName: 'Suzuka Circuit', layoutName: 'Suzuka East', lengthMeters: 2243, tolerancePct: 3.5 },

  // 15. Virginia International Raceway (VIR)
  { trackName: 'Virginia International Raceway', layoutName: 'VIR Full', lengthMeters: 5263, tolerancePct: 3.5 },
  { trackName: 'Virginia International Raceway', layoutName: 'VIR Grand East', lengthMeters: 6759, tolerancePct: 3.0 },
  { trackName: 'Virginia International Raceway', layoutName: 'VIR Grand West', lengthMeters: 6598, tolerancePct: 3.0 },
  { trackName: 'Virginia International Raceway', layoutName: 'VIR North', lengthMeters: 3621, tolerancePct: 3.5 },
  { trackName: 'Virginia International Raceway', layoutName: 'VIR South', lengthMeters: 2655, tolerancePct: 3.5 },

  // 16. Watkins Glen International
  { trackName: 'Watkins Glen International', layoutName: 'Watkins Glen Full', lengthMeters: 5430, tolerancePct: 3.5 },
  { trackName: 'Watkins Glen International', layoutName: 'Watkins Glen Short', lengthMeters: 3943, tolerancePct: 3.5 },
  { trackName: 'Watkins Glen International', layoutName: 'Watkins Glen - Full Course', lengthMeters: 5430, tolerancePct: 3.5 },

  // 17. Eaglerock Speedway (Fictional)
  { trackName: 'Eaglerock Speedway', layoutName: 'Eaglerock Oval', lengthMeters: 1600, tolerancePct: 3.5 },
  { trackName: 'Eaglerock Speedway', layoutName: 'Eaglerock Club', lengthMeters: 2100, tolerancePct: 3.5 },
  { trackName: 'Eaglerock Speedway', layoutName: 'Eaglerock Club Reverse', lengthMeters: 2100, tolerancePct: 3.5 },

  // 18. Grand Oak Raceway (Fictional)
  { trackName: 'Grand Oak Raceway', layoutName: 'Grand Oak National', lengthMeters: 3500, tolerancePct: 3.5 },
  { trackName: 'Grand Oak Raceway', layoutName: 'Grand Oak National Reverse', lengthMeters: 3500, tolerancePct: 3.5 },
  { trackName: 'Grand Oak Raceway', layoutName: 'Grand Oak Club', lengthMeters: 2200, tolerancePct: 3.5 },

  // 19. Hakone (Fictional)
  { trackName: 'Hakone', layoutName: 'Hakone Grand Prix', lengthMeters: 4800, tolerancePct: 3.5 },
  { trackName: 'Hakone', layoutName: 'Hakone Club', lengthMeters: 3200, tolerancePct: 3.5 },
  { trackName: 'Hakone', layoutName: 'Hakone Club Reverse', lengthMeters: 3200, tolerancePct: 3.5 },

  // 20. Maple Valley (Fictional)
  { trackName: 'Maple Valley', layoutName: 'Maple Valley Full', lengthMeters: 4828, tolerancePct: 3.5 },
  { trackName: 'Maple Valley', layoutName: 'Maple Valley Short', lengthMeters: 2500, tolerancePct: 3.5 },
  { trackName: 'Maple Valley', layoutName: 'Maple Valley Short Reverse', lengthMeters: 2500, tolerancePct: 3.5 }
];

/**
 * Detects the circuit layout name from recorded telemetry frames or total lap distance.
 * Returns the matched layout name or falls back strictly to "Unknown Track".
 */
export function detectTrackFromFrames(frames: TelemetryFrame[] = [], customDistanceMeters?: number): string {
  let lapDist = customDistanceMeters;

  if (!lapDist && frames.length > 0) {
    // Find highest recorded distance in the lap
    const maxDist = frames.reduce((max, f) => (f.distance > max ? f.distance : max), 0);
    if (maxDist > 500) {
      lapDist = maxDist;
    }
  }

  if (!lapDist || lapDist < 500) {
    return 'Unknown Track';
  }

  let bestMatch: TrackSignature | null = null;
  let smallestDiff = Infinity;

  for (const sig of TRACK_SIGNATURES) {
    const tolerance = sig.lengthMeters * ((sig.tolerancePct || 3.5) / 100);
    const diff = Math.abs(lapDist - sig.lengthMeters);

    if (diff <= tolerance && diff < smallestDiff) {
      smallestDiff = diff;
      bestMatch = sig;
    }
  }

  if (bestMatch) {
    return bestMatch.layoutName;
  }

  return 'Unknown Track';
}

/**
 * Returns the track length in meters for a given track name or layout ID.
 */
export function getTrackLength(trackName?: string, fallback?: number): number {
  if (!trackName) return fallback || 2414;
  const normalized = trackName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const match = TRACK_SIGNATURES.find(s => {
    const sNorm = s.layoutName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const tNorm = s.trackName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return normalized.includes(sNorm) || sNorm.includes(normalized) || normalized.includes(tNorm) || tNorm.includes(normalized);
  });
  return match ? match.lengthMeters : (fallback || 2414);
}

