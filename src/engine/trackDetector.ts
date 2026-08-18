import { TelemetryFrame } from '../types/telemetry';

export interface TrackSignature {
  trackName: string;
  layoutName: string;
  lengthMeters: number;
  tolerancePct?: number; // default +/- 4%
  centerCoordinate?: { x: number; z: number };
}

export const TRACK_SIGNATURES: TrackSignature[] = [
  {
    trackName: 'Lime Rock Park',
    layoutName: 'Lime Rock Park - Full Circuit',
    lengthMeters: 2410,
    tolerancePct: 4.5
  },
  {
    trackName: 'Laguna Seca Raceway',
    layoutName: 'WeatherTech Raceway Laguna Seca',
    lengthMeters: 3602,
    tolerancePct: 4.0
  },
  {
    trackName: 'Watkins Glen',
    layoutName: 'Watkins Glen - Full Course',
    lengthMeters: 5430,
    tolerancePct: 4.0
  },
  {
    trackName: 'Watkins Glen',
    layoutName: 'Watkins Glen - Short Course',
    lengthMeters: 3940,
    tolerancePct: 4.0
  },
  {
    trackName: 'Circuit de Spa-Francorchamps',
    layoutName: 'Circuit de Spa-Francorchamps',
    lengthMeters: 7004,
    tolerancePct: 3.5
  },
  {
    trackName: 'Road America',
    layoutName: 'Road America - Full Course',
    lengthMeters: 6515,
    tolerancePct: 3.5
  },
  {
    trackName: 'Silverstone Circuit',
    layoutName: 'Silverstone - Grand Prix',
    lengthMeters: 5891,
    tolerancePct: 3.5
  },
  {
    trackName: 'Silverstone Circuit',
    layoutName: 'Silverstone - National',
    lengthMeters: 2638,
    tolerancePct: 4.0
  },
  {
    trackName: 'Circuit de Barcelona-Catalunya',
    layoutName: 'Circuit de Barcelona-Catalunya GP',
    lengthMeters: 4675,
    tolerancePct: 4.0
  },
  {
    trackName: 'Suzuka Circuit',
    layoutName: 'Suzuka Circuit - Full',
    lengthMeters: 5807,
    tolerancePct: 3.5
  },
  {
    trackName: 'Nurburgring',
    layoutName: 'Nurburgring - GP Circuit',
    lengthMeters: 5148,
    tolerancePct: 3.5
  },
  {
    trackName: 'Mid-Ohio Sports Car Course',
    layoutName: 'Mid-Ohio - Full Course',
    lengthMeters: 3860,
    tolerancePct: 4.0
  },
  {
    trackName: 'Kyalami Grand Prix Circuit',
    layoutName: 'Kyalami Grand Prix Circuit',
    lengthMeters: 4529,
    tolerancePct: 4.0
  },
  {
    trackName: 'Mugello Circuit',
    layoutName: 'Mugello - Full Course',
    lengthMeters: 5245,
    tolerancePct: 3.5
  },
  {
    trackName: 'Maple Valley',
    layoutName: 'Maple Valley - Full Circuit',
    lengthMeters: 4812,
    tolerancePct: 4.0
  },
  {
    trackName: 'Hakone',
    layoutName: 'Hakone - Grand Prix',
    lengthMeters: 4260,
    tolerancePct: 4.0
  },
  {
    trackName: 'Grand Oak Raceway',
    layoutName: 'Grand Oak - National',
    lengthMeters: 3400,
    tolerancePct: 4.0
  }
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
    const tolerance = sig.lengthMeters * ((sig.tolerancePct || 4.0) / 100);
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
