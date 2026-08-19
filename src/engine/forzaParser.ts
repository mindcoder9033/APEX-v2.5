import { ForzaCarDashPacket, TelemetryFrame } from '../types/telemetry';

export function parseForzaBuffer(buffer: ArrayBuffer | Uint8Array): ForzaCarDashPacket | null {
  const byteLength = buffer.byteLength;
  if (byteLength < 311) {
    return null;
  }

  const view = buffer instanceof Uint8Array
    ? new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    : new DataView(buffer);

  try {
    const isRaceOn = view.getInt32(0, true);
    const timestampMs = view.getUint32(4, true);
    const engineMaxRpm = view.getFloat32(8, true);
    const engineIdleRpm = view.getFloat32(12, true);
    const currentEngineRpm = view.getFloat32(16, true);

    const accelerationX = view.getFloat32(20, true); // Lateral (m/s^2)
    const accelerationY = view.getFloat32(24, true); // Vertical (m/s^2)
    const accelerationZ = view.getFloat32(28, true); // Longitudinal (m/s^2)

    const velocityX = view.getFloat32(32, true);
    const velocityY = view.getFloat32(36, true);
    const velocityZ = view.getFloat32(40, true);

    const angularVelocityX = view.getFloat32(44, true);
    const angularVelocityY = view.getFloat32(48, true);
    const angularVelocityZ = view.getFloat32(52, true);

    const yaw = view.getFloat32(56, true);
    const pitch = view.getFloat32(60, true);
    const roll = view.getFloat32(64, true);

    const normalizedSuspensionTravelFL = view.getFloat32(68, true);
    const normalizedSuspensionTravelFR = view.getFloat32(72, true);
    const normalizedSuspensionTravelRL = view.getFloat32(76, true);
    const normalizedSuspensionTravelRR = view.getFloat32(80, true);

    const tireSlipRatioFL = view.getFloat32(84, true);
    const tireSlipRatioFR = view.getFloat32(88, true);
    const tireSlipRatioRL = view.getFloat32(92, true);
    const tireSlipRatioRR = view.getFloat32(96, true);

    const wheelRotationSpeedFL = view.getFloat32(100, true);
    const wheelRotationSpeedFR = view.getFloat32(104, true);
    const wheelRotationSpeedRL = view.getFloat32(108, true);
    const wheelRotationSpeedRR = view.getFloat32(112, true);

    const wheelOnRumbleStripFL = view.getInt32(116, true);
    const wheelOnRumbleStripFR = view.getInt32(120, true);
    const wheelOnRumbleStripRL = view.getInt32(124, true);
    const wheelOnRumbleStripRR = view.getInt32(128, true);

    const wheelInPuddleDepthFL = view.getFloat32(132, true);
    const wheelInPuddleDepthFR = view.getFloat32(136, true);
    const wheelInPuddleDepthRL = view.getFloat32(140, true);
    const wheelInPuddleDepthRR = view.getFloat32(144, true);

    const surfaceRumbleFL = view.getFloat32(148, true);
    const surfaceRumbleFR = view.getFloat32(152, true);
    const surfaceRumbleRL = view.getFloat32(156, true);
    const surfaceRumbleRR = view.getFloat32(160, true);

    const tireSlipAngleFL = view.getFloat32(164, true);
    const tireSlipAngleFR = view.getFloat32(168, true);
    const tireSlipAngleRL = view.getFloat32(172, true);
    const tireSlipAngleRR = view.getFloat32(176, true);

    const tireCombinedSlipFL = view.getFloat32(180, true);
    const tireCombinedSlipFR = view.getFloat32(184, true);
    const tireCombinedSlipRL = view.getFloat32(188, true);
    const tireCombinedSlipRR = view.getFloat32(192, true);

    const suspensionTravelMetersFL = view.getFloat32(196, true);
    const suspensionTravelMetersFR = view.getFloat32(200, true);
    const suspensionTravelMetersRL = view.getFloat32(204, true);
    const suspensionTravelMetersRR = view.getFloat32(208, true);

    const carOrdinal = view.getInt32(212, true);
    const carClass = view.getInt32(216, true);
    const carPerformanceIndex = view.getInt32(220, true);
    const drivetrainType = view.getInt32(224, true);
    const numCylinders = view.getInt32(228, true);

    // CarDash 324-byte packet offsets (FM7 / FM2023 / FH5)
    let positionX = 0, positionY = 0, positionZ = 0, speedMps = 0;
    let powerWatts = 0, torqueNm = 0;
    let tireTempFL = 0, tireTempFR = 0, tireTempRL = 0, tireTempRR = 0;
    let boost = 0, fuel = 0, distanceTraveledMeters = 0;
    let bestLapTimeSeconds = 0, lastLapTimeSeconds = 0, currentLapTimeSeconds = 0, currentRaceTimeSeconds = 0;
    let lapNumber = 0, racePosition = 0;
    let accel = 0, brake = 0, clutch = 0, handbrake = 0, gear = 0, steer = 0;
    let normalizedDrivingLine = 0, normalizedAIBrakeDifference = 0;

    const baseOffset = 232;

    if (byteLength >= 311) {
      positionX = view.getFloat32(baseOffset, true);
      positionY = view.getFloat32(baseOffset + 4, true);
      positionZ = view.getFloat32(baseOffset + 8, true);
      speedMps = view.getFloat32(baseOffset + 12, true);
      powerWatts = view.getFloat32(baseOffset + 16, true);
      torqueNm = view.getFloat32(baseOffset + 20, true);
      tireTempFL = view.getFloat32(baseOffset + 24, true);
      tireTempFR = view.getFloat32(baseOffset + 28, true);
      tireTempRL = view.getFloat32(baseOffset + 32, true);
      tireTempRR = view.getFloat32(baseOffset + 36, true);
      boost = view.getFloat32(baseOffset + 40, true);
      fuel = view.getFloat32(baseOffset + 44, true);
      distanceTraveledMeters = view.getFloat32(baseOffset + 48, true);
      bestLapTimeSeconds = view.getFloat32(baseOffset + 52, true);
      lastLapTimeSeconds = view.getFloat32(baseOffset + 56, true);
      currentLapTimeSeconds = view.getFloat32(baseOffset + 60, true);
      currentRaceTimeSeconds = view.getFloat32(baseOffset + 64, true);
      lapNumber = view.getUint16(baseOffset + 68, true);
      racePosition = view.getUint8(baseOffset + 70);
      accel = view.getUint8(baseOffset + 71) / 255.0;
      brake = view.getUint8(baseOffset + 72) / 255.0;
      clutch = view.getUint8(baseOffset + 73) / 255.0;
      handbrake = view.getUint8(baseOffset + 74) / 255.0;
      gear = view.getUint8(baseOffset + 75);
      steer = view.getInt8(baseOffset + 76) / 127.0;
      normalizedDrivingLine = view.getInt8(baseOffset + 77) / 127.0;
      normalizedAIBrakeDifference = view.getInt8(baseOffset + 78) / 127.0;
    }

    return {
      isRaceOn,
      timestampMs,
      engineMaxRpm,
      engineIdleRpm,
      currentEngineRpm,
      accelerationX,
      accelerationY,
      accelerationZ,
      velocityX,
      velocityY,
      velocityZ,
      angularVelocityX,
      angularVelocityY,
      angularVelocityZ,
      yaw,
      pitch,
      roll,
      normalizedSuspensionTravelFL,
      normalizedSuspensionTravelFR,
      normalizedSuspensionTravelRL,
      normalizedSuspensionTravelRR,
      tireSlipRatioFL,
      tireSlipRatioFR,
      tireSlipRatioRL,
      tireSlipRatioRR,
      wheelRotationSpeedFL,
      wheelRotationSpeedFR,
      wheelRotationSpeedRL,
      wheelRotationSpeedRR,
      wheelOnRumbleStripFL,
      wheelOnRumbleStripFR,
      wheelOnRumbleStripRL,
      wheelOnRumbleStripRR,
      wheelInPuddleDepthFL,
      wheelInPuddleDepthFR,
      wheelInPuddleDepthRL,
      wheelInPuddleDepthRR,
      surfaceRumbleFL,
      surfaceRumbleFR,
      surfaceRumbleRL,
      surfaceRumbleRR,
      tireSlipAngleFL,
      tireSlipAngleFR,
      tireSlipAngleRL,
      tireSlipAngleRR,
      tireCombinedSlipFL,
      tireCombinedSlipFR,
      tireCombinedSlipRL,
      tireCombinedSlipRR,
      suspensionTravelMetersFL,
      suspensionTravelMetersFR,
      suspensionTravelMetersRL,
      suspensionTravelMetersRR,
      carOrdinal,
      carClass,
      carPerformanceIndex,
      drivetrainType,
      numCylinders,
      positionX,
      positionY,
      positionZ,
      speedMps,
      powerWatts,
      torqueNm,
      tireTempFL,
      tireTempFR,
      tireTempRL,
      tireTempRR,
      boost,
      fuel,
      distanceTraveledMeters,
      bestLapTimeSeconds,
      lastLapTimeSeconds,
      currentLapTimeSeconds,
      currentRaceTimeSeconds,
      lapNumber,
      racePosition,
      accel,
      brake,
      clutch,
      handbrake,
      gear,
      steer,
      normalizedDrivingLine,
      normalizedAIBrakeDifference
    };
  } catch (err) {
    console.error('Error parsing Forza UDP packet:', err);
    return null;
  }
}

export function convertPacketToTelemetryFrame(packet: ForzaCarDashPacket, lapDistance: number, maxTractionBudgetG: number = 1.45): TelemetryFrame {
  const speedKph = packet.speedMps * 3.6;
  const speedMph = packet.speedMps * 2.23694;

  const latG = packet.accelerationX / 9.80665;
  const lonG = packet.accelerationZ / 9.80665;
  const combinedG = Math.sqrt(latG * latG + lonG * lonG);

  const tractionBudgetPct = Math.min(125, (combinedG / maxTractionBudgetG) * 100);

  const slipFL = Math.abs(packet.tireSlipAngleFL * (180 / Math.PI));
  const slipFR = Math.abs(packet.tireSlipAngleFR * (180 / Math.PI));
  const slipRL = Math.abs(packet.tireSlipAngleRL * (180 / Math.PI));
  const slipRR = Math.abs(packet.tireSlipAngleRR * (180 / Math.PI));

  const avgFrontSlip = (slipFL + slipFR) / 2.0;
  const avgRearSlip = (slipRL + slipRR) / 2.0;
  const avgSlipAngleDeg = (avgFrontSlip + avgRearSlip) / 2.0;
  const slipAngleDifferential = avgFrontSlip - avgRearSlip;

  return {
    timestamp: packet.timestampMs,
    lapNumber: packet.lapNumber,
    distance: lapDistance,
    speedKph,
    speedMph,
    throttle: packet.accel,
    brake: packet.brake,
    clutch: packet.clutch,
    steering: packet.steer,
    gear: packet.gear,
    rpm: packet.currentEngineRpm,
    latG,
    lonG,
    combinedG,
    tractionBudgetPct,
    avgSlipAngleDeg,
    slipAngleDifferential,
    posX: packet.positionX,
    posY: packet.positionY,
    posZ: packet.positionZ,
    carOrdinal: packet.carOrdinal,
    carClass: packet.carClass,
    carPI: packet.carPerformanceIndex,
    tireTempFL: packet.tireTempFL,
    tireTempFR: packet.tireTempFR,
    tireTempRL: packet.tireTempRL,
    tireTempRR: packet.tireTempRR,
    suspensionTravelFL: packet.normalizedSuspensionTravelFL,
    suspensionTravelFR: packet.normalizedSuspensionTravelFR,
    suspensionTravelRL: packet.normalizedSuspensionTravelRL,
    suspensionTravelRR: packet.normalizedSuspensionTravelRR
  };
}
