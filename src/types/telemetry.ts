export interface ForzaCarDashPacket {
  isRaceOn: number; // 1 = in race, 0 = paused/menu
  timestampMs: number;
  engineMaxRpm: number;
  engineIdleRpm: number;
  currentEngineRpm: number;
  accelerationX: number; // In the car's local space: X = right, Y = up, Z = forward
  accelerationY: number;
  accelerationZ: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  angularVelocityX: number; // Pitch
  angularVelocityY: number; // Yaw
  angularVelocityZ: number; // Roll
  yaw: number;
  pitch: number;
  roll: number;
  normalizedSuspensionTravelFL: number;
  normalizedSuspensionTravelFR: number;
  normalizedSuspensionTravelRL: number;
  normalizedSuspensionTravelRR: number;
  tireSlipRatioFL: number;
  tireSlipRatioFR: number;
  tireSlipRatioRL: number;
  tireSlipRatioRR: number;
  wheelRotationSpeedFL: number;
  wheelRotationSpeedFR: number;
  wheelRotationSpeedRL: number;
  wheelRotationSpeedRR: number;
  wheelOnRumbleStripFL: number;
  wheelOnRumbleStripFR: number;
  wheelOnRumbleStripRL: number;
  wheelOnRumbleStripRR: number;
  wheelInPuddleDepthFL: number;
  wheelInPuddleDepthFR: number;
  wheelInPuddleDepthRL: number;
  wheelInPuddleDepthRR: number;
  surfaceRumbleFL: number;
  surfaceRumbleFR: number;
  surfaceRumbleRL: number;
  surfaceRumbleRR: number;
  tireSlipAngleFL: number;
  tireSlipAngleFR: number;
  tireSlipAngleRL: number;
  tireSlipAngleRR: number;
  tireCombinedSlipFL: number;
  tireCombinedSlipFR: number;
  tireCombinedSlipRL: number;
  tireCombinedSlipRR: number;
  suspensionTravelMetersFL: number;
  suspensionTravelMetersFR: number;
  suspensionTravelMetersRL: number;
  suspensionTravelMetersRR: number;
  carOrdinal: number; // Car ID
  carClass: number; // 0 (D) - 7 (X)
  carPerformanceIndex: number; // 100 - 999
  drivetrainType: number; // 0 = FWD, 1 = RWD, 2 = AWD
  numCylinders: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  speedMps: number;
  powerWatts: number;
  torqueNm: number;
  tireTempFL: number;
  tireTempFR: number;
  tireTempRL: number;
  tireTempRR: number;
  boost: number;
  fuel: number;
  distanceTraveledMeters: number;
  bestLapTimeSeconds: number;
  lastLapTimeSeconds: number;
  currentLapTimeSeconds: number;
  currentRaceTimeSeconds: number;
  lapNumber: number;
  racePosition: number;
  accel: number; // 0 - 255 normalized to 0.0 - 1.0
  brake: number; // 0 - 255 normalized to 0.0 - 1.0
  clutch: number; // 0 - 255 normalized to 0.0 - 1.0
  handbrake: number; // 0 - 255 normalized to 0.0 - 1.0
  gear: number; // 0 = Reverse, 1-10 = Forward, 11 = Neutral
  steer: number; // -127 - 127 normalized to -1.0 (Left) to +1.0 (Right)
  normalizedDrivingLine: number;
  normalizedAIBrakeDifference: number;
}

export interface TelemetryFrame {
  timestamp: number; // ms
  lapNumber: number;
  distance: number; // meters along lap
  speedKph: number;
  speedMph: number;
  throttle: number; // 0.0 to 1.0
  brake: number; // 0.0 to 1.0
  clutch: number;
  steering: number; // -1.0 to 1.0
  gear: number;
  rpm: number;
  latG: number; // lateral acceleration in Gs (+ is right, - is left)
  lonG: number; // longitudinal acceleration in Gs (+ is accel, - is braking)
  combinedG: number; // sqrt(latG^2 + lonG^2)
  tractionBudgetPct: number; // 0% to 120%
  avgSlipAngleDeg: number;
  slipAngleDifferential: number; // Front slip - Rear slip (+ understeer, - oversteer)
  posX: number;
  posY: number;
  posZ: number;
  carOrdinal?: number;
  carClass?: number;
  carPI?: number;
  tireTempFL?: number;
  tireTempFR?: number;
  tireTempRL?: number;
  tireTempRR?: number;
  suspensionTravelFL?: number;
  suspensionTravelFR?: number;
  suspensionTravelRL?: number;
  suspensionTravelRR?: number;
}

export interface CornerTelemetryAnalysis {
  cornerIndex: number;
  cornerName: string;
  startDistance: number;
  apexDistance: number;
  endDistance: number;
  type: 'hairpin' | 'medium' | 'fast_sweeper' | 'chicane' | 'kink';
  brakingHitRateMs: number; // Rise time to peak brake
  peakBrakePressure: number; // 0.0 to 1.0
  trailBrakingDecayDurationSec: number; // Duration of brake bleed into apex
  trailBrakingScore: number; // 0 - 100
  apexMinSpeedKph: number;
  targetApexSpeedKph: number;
  apexGripUtilizationPct: number; // 0 - 100%
  throttlePickupHesitationMs: number; // Lag between brake release and throttle
  throttleUnwindLinearityScore: number; // 0 - 100
  balanceCategory: 'neutral' | 'understeer' | 'oversteer';
  cornerScore: number; // 0 - 100
  diagnosis: string;
  skipBarberAdvice: string;
  sector?: 1 | 2 | 3;
  sectorName?: string;
}

export interface LapAnalysis {
  lapId: string;
  stintId?: string;
  lapNumber: number;
  lapTimeSec: number;
  isClean: boolean;
  maxSpeedKph: number;
  avgSpeedKph: number;
  avgTractionBudgetPct: number;
  peakLatG: number;
  peakBrakingG: number;
  overallScore: number; // 0 - 100
  corners: CornerTelemetryAnalysis[];
  frames: TelemetryFrame[];
  compactBuffer?: import('../engine/telemetryBuffer').CompactTelemetryBuffer;
  isOffloaded?: boolean;
  actionItems: string[];
  wasRewound?: boolean;
  source?: 'academy' | 'practice';
  moduleNumber?: number;
  moduleTitle?: string;
  sessionId?: string;
  sessionTitle?: string;
  recordedAt?: string;
  detectedCarName?: string;
  detectedTrackName?: string;
}

export interface StintSession {
  stintId: string;
  stintNumber: number;
  title: string;
  carName: string;
  trackName: string;
  source: 'academy' | 'practice';
  recordedAt: string;
  durationSec: number;
  totalLaps: number;
  bestLapTimeSec: number;
  avgScore: number;
  wasRewound?: boolean;
  laps: LapAnalysis[];
  moduleNumber?: number;
  moduleTitle?: string;
  sessionId?: string;
  sessionTitle?: string;
}

export type SkipBarberPillarId = 
  | 'traction_budget' 
  | 'trail_braking' 
  | 'corner_priority' 
  | 'throttle_unwind' 
  | 'stint_consistency';

export interface SkipBarberPillarScore {
  id: SkipBarberPillarId;
  name: string;
  score: number; // 0 - 100
  grade: string; // A+, A, B, C, D
  bookChapter: string;
  summary: string;
}

export interface CoachFeedbackItem {
  id: string;
  type: 'strength' | 'weakness' | 'drill';
  title: string;
  description: string;
  bookCitation: string;
  metricEvidence?: string;
  cornerIndex?: number;
  cornerName?: string;
  priority?: 1 | 2 | 3;
}

export interface CornerCoachAdvice {
  cornerIndex: number;
  cornerName: string;
  cornerType: 'hairpin' | 'medium' | 'fast_sweeper' | 'chicane' | 'kink';
  priorityType: 'Type 1 (Exit Priority)' | 'Type 2 (Entry Priority)' | 'Type 3 (Sequence Priority)';
  score: number;
  grade: string;
  whatWentRight: string;
  whatWentWrong: string;
  howToImprove: string;
  bookCitation: string;
  metrics: {
    trailBrakingScore: number;
    trailDecayMs: number;
    coastingHesitationMs: number;
    throttleUnwindScore: number;
    apexMinSpeedKph: number;
    targetApexSpeedKph: number;
    gripUtilizationPct: number;
    balance: 'neutral' | 'understeer' | 'oversteer';
  };
  coastingZoneMeters?: [number, number];
  brakeZoneMeters?: [number, number];
}

export interface AICoachDebrief {
  stintId?: string;
  lapId?: string;
  stintGrade: string;
  overallScore: number;
  driverProfileTag: string;
  driverProfileDescription: string;
  pillarScores: SkipBarberPillarScore[];
  whatWentRight: CoachFeedbackItem[];
  whatWentWrong: CoachFeedbackItem[];
  howToImprove: CoachFeedbackItem[];
  cornerAnalyses: CornerCoachAdvice[];
  stintConsistencySummary?: {
    lapDeltaStdDevSec: number;
    brakingMarkerVarianceMeters: number;
    apexSpeedVarianceKph: number;
    fastestLapNum: number;
    paceTrend: 'improving' | 'consistent' | 'fading';
  };
}

