import { TelemetryFrame } from '../types/telemetry';
import { PredefinedCornerDef } from '../data/trackCorners';

/**
 * Dynamically extracts all discrete corners and apexes from raw telemetry frames.
 * Used when driving on unknown circuits, custom tracks, or unmapped FM23 layouts.
 */
export function extractDynamicCorners(
  frames: TelemetryFrame[],
  trackLengthMeters: number = 3800
): PredefinedCornerDef[] {
  if (!frames || frames.length < 15) {
    return [];
  }

  const maxDist = frames.reduce((max, f) => (f.distance > max ? f.distance : max), 0);
  const effectiveTrackLength = maxDist > 500 ? maxDist : trackLengthMeters;

  // 1. Identify cornering regions where lateral load or steering exceeds threshold
  const LAT_G_THRESHOLD = 0.50;
  const inCorner: boolean[] = new Array(frames.length).fill(false);

  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    const absLatG = Math.abs(f.latG || 0);
    const absSteer = Math.abs(f.steering || 0);
    if (absLatG >= LAT_G_THRESHOLD || (absSteer >= 0.12 && f.speedKph > 35)) {
      inCorner[i] = true;
    }
  }

  // 2. Group continuous inCorner segments
  interface RawSegment {
    startIndex: number;
    endIndex: number;
    startDist: number;
    endDist: number;
    apexIndex: number;
    apexDist: number;
    minSpeedKph: number;
    peakLatG: number;
  }

  const rawSegments: RawSegment[] = [];
  let currentStart = -1;

  for (let i = 0; i < frames.length; i++) {
    if (inCorner[i] && currentStart === -1) {
      currentStart = i;
    } else if (!inCorner[i] && currentStart !== -1) {
      const segLength = Math.abs(frames[i - 1].distance - frames[currentStart].distance);
      // Pure distance-based threshold (>= 25m) so downsampled frames detect the exact same turns
      if (segLength >= 25) {
        // Find apex (point of minimum speed or peak lateral G)
        let minSpeed = Infinity;
        let apexIdx = currentStart;
        let peakLat = 0;

        for (let j = currentStart; j < i; j++) {
          const fr = frames[j];
          if (fr.speedKph < minSpeed) {
            minSpeed = fr.speedKph;
            apexIdx = j;
          }
          if (Math.abs(fr.latG) > peakLat) {
            peakLat = Math.abs(fr.latG);
          }
        }

        rawSegments.push({
          startIndex: currentStart,
          endIndex: i - 1,
          startDist: frames[currentStart].distance,
          endDist: frames[i - 1].distance,
          apexIndex: apexIdx,
          apexDist: frames[apexIdx].distance,
          minSpeedKph: minSpeed < 999 ? minSpeed : 100,
          peakLatG: peakLat
        });
      }
      currentStart = -1;
    }
  }

  // Close trailing segment if active
  if (currentStart !== -1) {
    const i = frames.length - 1;
    const segLength = Math.abs(frames[i].distance - frames[currentStart].distance);
    if (segLength >= 25) {
      let minSpeed = Infinity;
      let apexIdx = currentStart;
      let peakLat = 0;
      for (let j = currentStart; j <= i; j++) {
        if (frames[j].speedKph < minSpeed) {
          minSpeed = frames[j].speedKph;
          apexIdx = j;
        }
        if (Math.abs(frames[j].latG) > peakLat) {
          peakLat = Math.abs(frames[j].latG);
        }
      }
      rawSegments.push({
        startIndex: currentStart,
        endIndex: i,
        startDist: frames[currentStart].distance,
        endDist: frames[i].distance,
        apexIndex: apexIdx,
        apexDist: frames[apexIdx].distance,
        minSpeedKph: minSpeed < 999 ? minSpeed : 100,
        peakLatG: peakLat
      });
    }
  }

  // 3. Merge segments that are close together (< 50 meters apart)
  const mergedSegments: RawSegment[] = [];
  for (let i = 0; i < rawSegments.length; i++) {
    const cur = rawSegments[i];
    if (mergedSegments.length === 0) {
      mergedSegments.push({ ...cur });
      continue;
    }

    const prev = mergedSegments[mergedSegments.length - 1];
    const gap = cur.startDist - prev.endDist;

    if (gap < 50 && gap >= 0) {
      // Merge
      prev.endIndex = cur.endIndex;
      prev.endDist = cur.endDist;
      if (cur.minSpeedKph < prev.minSpeedKph) {
        prev.minSpeedKph = cur.minSpeedKph;
        prev.apexIndex = cur.apexIndex;
        prev.apexDist = cur.apexDist;
      }
      if (cur.peakLatG > prev.peakLatG) {
        prev.peakLatG = cur.peakLatG;
      }
    } else {
      mergedSegments.push({ ...cur });
    }
  }

  // 4. Convert merged segments into PredefinedCornerDef
  const dynamicCorners: PredefinedCornerDef[] = mergedSegments.map((seg, idx) => {
    const startPct = Math.max(0.005, Math.min(0.98, seg.startDist / effectiveTrackLength));
    const endPct = Math.max(startPct + 0.015, Math.min(0.999, seg.endDist / effectiveTrackLength));
    const apexPct = Math.max(startPct + 0.005, Math.min(endPct - 0.005, seg.apexDist / effectiveTrackLength));

    // Corner classification based on apex speed and lateral load
    let cornerType: 'hairpin' | 'medium' | 'fast_sweeper' | 'chicane' | 'kink' = 'medium';
    if (seg.minSpeedKph < 85) {
      cornerType = 'hairpin';
    } else if (seg.minSpeedKph > 155) {
      cornerType = 'fast_sweeper';
    } else if ((seg.endDist - seg.startDist) < 110 && seg.peakLatG > 1.2) {
      cornerType = 'chicane';
    }

    return {
      index: idx + 1,
      name: `Turn ${idx + 1}`,
      startPct,
      apexPct,
      endPct,
      type: cornerType,
      targetApexSpeedKph: Math.round(seg.minSpeedKph * 1.05),
      description: `Detected ${cornerType.replace('_', ' ')} with peak lateral load of ${seg.peakLatG.toFixed(2)}G.`
    };
  });

  return dynamicCorners;
}
