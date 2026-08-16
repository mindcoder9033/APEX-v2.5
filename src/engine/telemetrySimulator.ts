import { TelemetryFrame } from '../types/telemetry';
import { DEFAULT_TRACK_CORNERS } from './physicsEngine';

export interface SimulatorOptions {
  trackLengthMeters?: number;
  drivingStyle?: 'pro' | 'amateur_abrupt_brake' | 'coasting_exit';
  lapCount?: number;
}

export function generateSyntheticLapFrames(lapNumber: number = 1, options: SimulatorOptions = {}): TelemetryFrame[] {
  const trackLength = options.trackLengthMeters || 3800;
  const style = options.drivingStyle || 'pro';
  const frames: TelemetryFrame[] = [];

  const dt = 1 / 60; // 60Hz = 16.6ms
  let currentDist = 0;
  let currentSpeed = 45; // m/s (~162 km/h)
  let currentTime = lapNumber * 90000; // ms

  // Calculate track segments
  const corners = DEFAULT_TRACK_CORNERS;
  
  while (currentDist < trackLength) {
    const distPct = currentDist / trackLength;
    
    // Check if we are inside a corner zone
    const currentCorner = corners.find(c => distPct >= c.startPct && distPct <= c.endPct);
    
    let throttle = 0;
    let brake = 0;
    let steering = 0;
    let latG = 0;
    let lonG = 0;

    if (!currentCorner) {
      // Straightaway
      throttle = 1.0;
      brake = 0.0;
      steering = (Math.sin(currentDist / 100) * 0.02); // minor micro corrections
      currentSpeed = Math.min(72, currentSpeed + 8.5 * dt); // Accel up to 260 km/h
      lonG = 0.85 * (1.0 - (currentSpeed / 75));
      latG = (Math.random() - 0.5) * 0.05;
    } else {
      // Inside corner
      const cornerLen = (currentCorner.endPct - currentCorner.startPct) * trackLength;
      const cornerProgress = (currentDist - (currentCorner.startPct * trackLength)) / cornerLen;
      const targetSpeedMps = currentCorner.targetApexSpeedKph / 3.6;

      if (cornerProgress < 0.35) {
        // Entry / Braking phase
        if (style === 'amateur_abrupt_brake') {
          brake = 0.95;
          throttle = 0.0;
          steering = 0.4;
        } else {
          // Pro trail braking
          const brakeDecay = 1.0 - (cornerProgress / 0.35);
          brake = Math.max(0.05, brakeDecay * 0.9);
          throttle = 0.0;
          steering = (cornerProgress / 0.35) * 0.55;
        }
        currentSpeed = Math.max(targetSpeedMps, currentSpeed - 18.0 * dt);
        lonG = -1.25;
        latG = steering * 1.6;
      } else if (cornerProgress < 0.65) {
        // Apex phase
        if (style === 'coasting_exit') {
          throttle = 0.0;
          brake = 0.0;
        } else {
          throttle = 0.25; // Maintenance throttle
          brake = 0.0;
        }
        steering = 0.65 * (currentCorner.index % 2 === 0 ? -1 : 1);
        currentSpeed = targetSpeedMps + (Math.sin(cornerProgress * Math.PI) * 1.5);
        latG = (steering > 0 ? 1 : -1) * 1.38;
        lonG = 0.15;
      } else {
        // Exit phase
        const exitProgress = (cornerProgress - 0.65) / 0.35;
        steering = 0.65 * (1.0 - exitProgress) * (currentCorner.index % 2 === 0 ? -1 : 1);
        throttle = Math.min(1.0, 0.3 + exitProgress * 0.7);
        brake = 0.0;
        currentSpeed += 6.5 * dt;
        latG = (steering > 0 ? 1 : -1) * (1.2 * (1.0 - exitProgress));
        lonG = 0.75 * throttle;
      }
    }

    const speedKph = currentSpeed * 3.6;
    const speedMph = currentSpeed * 2.23694;
    const combinedG = Math.sqrt(latG * latG + lonG * lonG);
    const tractionBudgetPct = Math.min(120, (combinedG / 1.45) * 100);

    const slipFL = Math.abs(latG) * 3.8 + (Math.random() * 0.4);
    const slipRL = Math.abs(latG) * 3.6 + (Math.random() * 0.4);
    const avgSlipAngleDeg = (slipFL + slipRL) / 2.0;
    const slipAngleDifferential = slipFL - slipRL;

    // Track coordinates in circle/loop for track map
    const angle = (currentDist / trackLength) * 2 * Math.PI;
    const posX = Math.sin(angle) * 500 + Math.sin(angle * 3) * 80;
    const posZ = Math.cos(angle) * 500 + Math.cos(angle * 2) * 50;

    frames.push({
      timestamp: Math.round(currentTime),
      lapNumber,
      distance: Math.round(currentDist),
      speedKph: Number(speedKph.toFixed(1)),
      speedMph: Number(speedMph.toFixed(1)),
      throttle: Number(throttle.toFixed(2)),
      brake: Number(brake.toFixed(2)),
      clutch: 0,
      steering: Number(steering.toFixed(2)),
      gear: currentSpeed > 55 ? 5 : currentSpeed > 40 ? 4 : currentSpeed > 28 ? 3 : 2,
      rpm: Math.round(4500 + (currentSpeed % 15) * 250),
      latG: Number(latG.toFixed(2)),
      lonG: Number(lonG.toFixed(2)),
      combinedG: Number(combinedG.toFixed(2)),
      tractionBudgetPct: Number(tractionBudgetPct.toFixed(1)),
      avgSlipAngleDeg: Number(avgSlipAngleDeg.toFixed(1)),
      slipAngleDifferential: Number(slipAngleDifferential.toFixed(2)),
      posX: Number(posX.toFixed(1)),
      posY: 0,
      posZ: Number(posZ.toFixed(1))
    });

    currentDist += currentSpeed * dt;
    currentTime += dt * 1000;
  }

  return frames;
}
