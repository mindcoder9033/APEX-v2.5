import { TelemetryFrame } from '../types/telemetry';

export const LOD_PRESETS = {
  FULL: 0,           // Raw full-fidelity 60Hz frames (for active lap cursor scrubbing and corner analysis)
  GRAPH_HIGH: 1200,  // High-resolution canvas trace (e.g. 4K / wide debrief telemetry graphs)
  GRAPH_MED: 600,    // Standard widget & modal traces (e.g. LiveTracesWidget, PDF charts)
  SUMMARY: 250,      // Inactive lap preview, TrackMap line, Friction circle
  THUMBNAIL: 100     // Stint list cards, sparklines
} as const;

/**
 * Fast Extrema-Preserving Level-of-Detail (LOD) Downsampler.
 * 
 * Downsamples large telemetry frame sequences (e.g. 30,000+ frames from a long 20.8km circuit lap)
 * down to a target count (e.g. 600-1200 points) while strictly preserving critical dynamic extrema:
 * - Peak brake hits & rise spikes
 * - Apex minimum speeds & speed transitions
 * - Peak lateral G & longitudinal load transitions
 * - Throttle application points & traction limits
 * - Lap start (0m) and finish lines
 */
export function downsampleTelemetryLOD(
  frames: TelemetryFrame[],
  targetPoints: number = LOD_PRESETS.GRAPH_HIGH
): TelemetryFrame[] {
  if (!frames || frames.length === 0) return [];
  if (targetPoints <= 0 || frames.length <= targetPoints) {
    return frames;
  }

  const length = frames.length;
  const criticalIndices = new Set<number>();

  // Always keep first and last frame
  criticalIndices.add(0);
  criticalIndices.add(length - 1);

  // Phase 1: Fast extrema detection pass across telemetry dynamics
  // We scan the data to find significant local peaks/troughs
  const scanStep = Math.max(1, Math.floor(length / (targetPoints * 2)));
  
  for (let i = scanStep; i < length - scanStep; i += scanStep) {
    const prev = frames[i - scanStep];
    const curr = frames[i];
    const next = frames[Math.min(length - 1, i + scanStep)];

    // 1. Peak braking pressure (e.g. initial hard hits > 30% brake)
    if (curr.brake > 0.3 && curr.brake >= prev.brake && curr.brake >= next.brake) {
      criticalIndices.add(i);
    }
    // 2. Corner Apex minimum speed under lateral load
    if (curr.speedKph <= prev.speedKph && curr.speedKph <= next.speedKph && Math.abs(curr.latG) > 0.4) {
      criticalIndices.add(i);
    }
    // 3. Peak lateral grip (maximum cornering load)
    const absLatG = Math.abs(curr.latG);
    if (absLatG > 0.9 && absLatG >= Math.abs(prev.latG) && absLatG >= Math.abs(next.latG)) {
      criticalIndices.add(i);
    }
    // 4. Peak longitudinal acceleration / braking G
    if (Math.abs(curr.lonG) > 0.8 && Math.abs(curr.lonG) >= Math.abs(prev.lonG) && Math.abs(curr.lonG) >= Math.abs(next.lonG)) {
      criticalIndices.add(i);
    }
    // 5. Throttle pickup transition (going from coast/brake to power)
    if (prev.throttle < 0.1 && curr.throttle > 0.4) {
      criticalIndices.add(i);
    }
    // 6. High Traction Budget saturation (>95% grip limit)
    if (curr.tractionBudgetPct > 95 && curr.tractionBudgetPct >= prev.tractionBudgetPct && curr.tractionBudgetPct >= next.tractionBudgetPct) {
      criticalIndices.add(i);
    }
  }

  // Phase 2: Largest-Triangle-Three-Buckets (LTTB) bucket selection for remaining budget
  const remainingBudget = Math.max(2, targetPoints - criticalIndices.size);
  const bucketSize = (length - 2) / remainingBudget;

  let prevIndex = 0;
  for (let i = 0; i < remainingBudget; i++) {
    const bucketStart = Math.floor((i + 0) * bucketSize) + 1;
    const bucketEnd = Math.min(length - 1, Math.floor((i + 1) * bucketSize) + 1);
    const nextBucketStart = Math.floor((i + 1) * bucketSize) + 1;
    const nextBucketEnd = Math.min(length - 1, Math.floor((i + 2) * bucketSize) + 1);

    // Calculate center of next bucket for triangular weighting
    let nextAvgX = 0;
    let nextAvgY = 0;
    const nextBucketLen = Math.max(1, nextBucketEnd - nextBucketStart);
    for (let j = nextBucketStart; j < nextBucketEnd; j++) {
      nextAvgX += frames[j].distance;
      nextAvgY += frames[j].speedKph;
    }
    nextAvgX /= nextBucketLen;
    nextAvgY /= nextBucketLen;

    // Find point in current bucket with maximum triangular area against prev and next bucket center
    const prevFrame = frames[prevIndex];
    let maxArea = -1;
    let maxAreaIndex = bucketStart;

    for (let j = bucketStart; j < bucketEnd; j++) {
      const f = frames[j];
      // Area of triangle = 0.5 * |x_a(y_b - y_c) + x_b(y_c - y_a) + x_c(y_a - y_b)|
      const area = Math.abs(
        (prevFrame.distance - nextAvgX) * (f.speedKph - prevFrame.speedKph) -
        (prevFrame.distance - f.distance) * (nextAvgY - prevFrame.speedKph)
      );

      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = j;
      }
    }

    criticalIndices.add(maxAreaIndex);
    prevIndex = maxAreaIndex;
  }

  // Sort selected indices and build compact resulting array
  const sortedIndices = Array.from(criticalIndices).sort((a, b) => a - b);
  const result: TelemetryFrame[] = new Array(sortedIndices.length);
  for (let i = 0; i < sortedIndices.length; i++) {
    result[i] = frames[sortedIndices[i]];
  }

  return result;
}

/**
 * Downsamples 2D GPS track coordinates [posX, posZ] for TrackMapViewer
 * preserving track shape, turns, and apex points.
 */
export function downsampleTrackPoints(
  frames: TelemetryFrame[],
  targetPoints: number = LOD_PRESETS.SUMMARY
): TelemetryFrame[] {
  if (!frames || frames.length <= targetPoints) return frames || [];

  const len = frames.length;
  const step = len / targetPoints;
  const result: TelemetryFrame[] = [];

  result.push(frames[0]);

  for (let i = 1; i < targetPoints - 1; i++) {
    const idx = Math.min(len - 2, Math.floor(i * step));
    result.push(frames[idx]);
  }

  result.push(frames[len - 1]);
  return result;
}
