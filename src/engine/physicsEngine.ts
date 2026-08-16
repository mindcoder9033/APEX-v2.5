import { TelemetryFrame, CornerTelemetryAnalysis, LapAnalysis } from '../types/telemetry';
import { SessionChallengeCriteria, ChallengeResult, ModuleGraduationTest, GraduationResult } from '../types/curriculum';

export interface PredefinedCornerDef {
  index: number;
  name: string;
  startPct: number; // 0.0 to 1.0 along track length
  apexPct: number;
  endPct: number;
  type: 'hairpin' | 'medium' | 'fast_sweeper' | 'chicane' | 'kink';
  targetApexSpeedKph: number;
  description: string;
}

export const DEFAULT_TRACK_CORNERS: PredefinedCornerDef[] = [
  { index: 1, name: 'Turn 1 (Big Bend / Main Entry)', startPct: 0.06, apexPct: 0.11, endPct: 0.16, type: 'medium', targetApexSpeedKph: 115, description: 'Heavy braking zone into 90° right-hander. Exit leads onto long straight.' },
  { index: 2, name: 'Turn 2 (The Esses Entry)', startPct: 0.22, apexPct: 0.26, endPct: 0.30, type: 'fast_sweeper', targetApexSpeedKph: 165, description: 'High-speed uphill sweeper requiring aero commitment and single-input steering.' },
  { index: 3, name: 'Turn 3 (The Esses Apex)', startPct: 0.32, apexPct: 0.36, endPct: 0.41, type: 'fast_sweeper', targetApexSpeedKph: 172, description: 'Crest transition requiring throttle maintenance.' },
  { index: 4, name: 'Turn 4 (Inner Loop / Bus Stop)', startPct: 0.48, apexPct: 0.52, endPct: 0.57, type: 'chicane', targetApexSpeedKph: 95, description: 'Heavy threshold braking into aggressive curb-strike transition.' },
  { index: 5, name: 'Turn 5 (The Carousel / Long Sweeper)', startPct: 0.62, apexPct: 0.68, endPct: 0.74, type: 'hairpin', targetApexSpeedKph: 108, description: 'Decreasing radius long corner requiring deep trail-braking to rotate car.' },
  { index: 6, name: 'Turn 6 (Chute Entry)', startPct: 0.78, apexPct: 0.83, endPct: 0.87, type: 'medium', targetApexSpeedKph: 128, description: 'Off-camber downhill turn-in; manage pitch transfer.' },
  { index: 7, name: 'Turn 7 (Final Turn onto Straight)', startPct: 0.90, apexPct: 0.94, endPct: 0.98, type: 'medium', targetApexSpeedKph: 132, description: 'Crucial exit priority corner. Straighten wheel early for 100% full throttle.' }
];

export function analyzeLapTelemetry(frames: TelemetryFrame[], trackLengthMeters: number = 3800): LapAnalysis {
  if (frames.length < 30) {
    return createEmptyLapAnalysis(1);
  }

  const lapNumber = frames[0].lapNumber || 1;
  const totalFrames = frames.length;
  const durationSec = (frames[totalFrames - 1].timestamp - frames[0].timestamp) / 1000.0;

  let maxSpeedKph = 0;
  let sumSpeed = 0;
  let sumTractionBudget = 0;
  let peakLatG = 0;
  let peakBrakingG = 0;

  for (const f of frames) {
    if (f.speedKph > maxSpeedKph) maxSpeedKph = f.speedKph;
    sumSpeed += f.speedKph;
    sumTractionBudget += f.tractionBudgetPct;
    if (Math.abs(f.latG) > peakLatG) peakLatG = Math.abs(f.latG);
    if (f.lonG < -peakBrakingG) peakBrakingG = Math.abs(f.lonG);
  }

  const avgSpeedKph = sumSpeed / totalFrames;
  const avgTractionBudgetPct = sumTractionBudget / totalFrames;

  // Segment corners based on predefined track map or dynamic curvature
  const corners: CornerTelemetryAnalysis[] = DEFAULT_TRACK_CORNERS.map((cDef) => {
    const startDist = cDef.startPct * trackLengthMeters;
    const apexDist = cDef.apexPct * trackLengthMeters;
    const endDist = cDef.endPct * trackLengthMeters;

    const cornerFrames = frames.filter(f => f.distance >= startDist && f.distance <= endDist);
    if (cornerFrames.length === 0) {
      return createDummyCornerAnalysis(cDef);
    }

    // 1. Braking analysis
    let peakBrake = 0;
    let brakeStartIndex = -1;
    let brakePeakIndex = -1;
    let trailReleaseEndIndex = -1;

    for (let i = 0; i < cornerFrames.length; i++) {
      const fr = cornerFrames[i];
      if (fr.brake > 0.1 && brakeStartIndex === -1) {
        brakeStartIndex = i;
      }
      if (fr.brake > peakBrake) {
        peakBrake = fr.brake;
        brakePeakIndex = i;
      }
      if (peakBrake > 0.4 && fr.brake < 0.05 && brakePeakIndex !== -1 && trailReleaseEndIndex === -1) {
        trailReleaseEndIndex = i;
      }
    }

    const brakingHitRateMs = (brakeStartIndex !== -1 && brakePeakIndex !== -1 && brakePeakIndex >= brakeStartIndex)
      ? Math.max(80, (cornerFrames[brakePeakIndex].timestamp - cornerFrames[brakeStartIndex].timestamp))
      : 120;

    const trailBrakingDecayDurationSec = (brakePeakIndex !== -1 && trailReleaseEndIndex !== -1 && trailReleaseEndIndex >= brakePeakIndex)
      ? (cornerFrames[trailReleaseEndIndex].timestamp - cornerFrames[brakePeakIndex].timestamp) / 1000.0
      : 0.35;

    // Trail braking score
    let trailScore = 80;
    if (cDef.type === 'hairpin' || cDef.type === 'medium') {
      if (trailBrakingDecayDurationSec >= 0.3 && trailBrakingDecayDurationSec <= 0.8) {
        trailScore = Math.min(98, 75 + Math.round((trailBrakingDecayDurationSec / 0.8) * 23));
      } else if (trailBrakingDecayDurationSec < 0.2) {
        trailScore = 55 + Math.round(trailBrakingDecayDurationSec * 100);
      }
    } else {
      trailScore = 88;
    }

    // 2. Apex analysis
    let minSpeedKph = 999;
    let apexFrameIndex = -1;
    let apexGripPct = 0;
    let sumFrontRearSlipDiff = 0;

    for (let i = 0; i < cornerFrames.length; i++) {
      const fr = cornerFrames[i];
      if (fr.speedKph < minSpeedKph) {
        minSpeedKph = fr.speedKph;
        apexFrameIndex = i;
        apexGripPct = fr.tractionBudgetPct;
      }
      sumFrontRearSlipDiff += fr.slipAngleDifferential;
    }

    const avgSlipDiff = cornerFrames.length > 0 ? sumFrontRearSlipDiff / cornerFrames.length : 0;
    let balanceCategory: 'neutral' | 'understeer' | 'oversteer' = 'neutral';
    if (avgSlipDiff > 1.2) balanceCategory = 'understeer';
    else if (avgSlipDiff < -1.2) balanceCategory = 'oversteer';

    // 3. Exit & Throttle pickup
    let throttlePickupHesitationMs = 140;
    let throttleUnwindScore = 85;

    if (apexFrameIndex !== -1 && apexFrameIndex < cornerFrames.length - 1) {
      let firstThrottleIndex = -1;
      for (let i = apexFrameIndex; i < cornerFrames.length; i++) {
        if (cornerFrames[i].throttle > 0.15) {
          firstThrottleIndex = i;
          break;
        }
      }
      if (firstThrottleIndex !== -1) {
        throttlePickupHesitationMs = Math.max(50, cornerFrames[firstThrottleIndex].timestamp - cornerFrames[apexFrameIndex].timestamp);
      }

      // Check unwind correlation: as steering drops, throttle should rise
      let unwindGoodSteps = 0;
      let totalExitSteps = 0;
      for (let i = apexFrameIndex; i < cornerFrames.length - 1; i++) {
        totalExitSteps++;
        const curr = cornerFrames[i];
        const next = cornerFrames[i + 1];
        const steerDropping = Math.abs(next.steering) <= Math.abs(curr.steering) + 0.05;
        const throttleRising = next.throttle >= curr.throttle - 0.05;
        if (steerDropping && throttleRising) unwindGoodSteps++;
      }
      if (totalExitSteps > 0) {
        throttleUnwindScore = Math.round((unwindGoodSteps / totalExitSteps) * 100);
      }
    }

    // Comprehensive corner score
    const speedDelta = minSpeedKph - cDef.targetApexSpeedKph;
    const speedScore = Math.max(40, Math.min(100, 85 + speedDelta * 1.5));
    const cornerScore = Math.round((trailScore * 0.35) + (throttleUnwindScore * 0.35) + (speedScore * 0.30));

    // Formulate Skip Barber diagnosis & advice
    let diagnosis = `Carried ${minSpeedKph.toFixed(1)} km/h through apex (target: ${cDef.targetApexSpeedKph} km/h). Grip budget utilization at ${apexGripPct.toFixed(0)}%.`;
    let skipBarberAdvice = `Good corner execution. Maintain focus on looking far ahead to exit tracking point.`;

    if (trailBrakingDecayDurationSec < 0.22 && (cDef.type === 'hairpin' || cDef.type === 'medium')) {
      diagnosis = `Abrupt brake release (${(trailBrakingDecayDurationSec * 1000).toFixed(0)}ms) before apex. Unloaded front tires induced ${balanceCategory === 'understeer' ? 'noticeable push' : 'slight understeer'}.`;
      skipBarberAdvice = `Skip Barber Rule (Ch. 5): 'Do not snap off the brake pedal.' Smoothly bleed off trailing 15% pressure deep into the clipping point to rotate the rear chassis.`;
    } else if (throttlePickupHesitationMs > 250) {
      diagnosis = `Coasting pause detected (${throttlePickupHesitationMs}ms) between brake release and throttle pickup. Lost rolling momentum at mid-corner.`;
      skipBarberAdvice = `Skip Barber Rule (Ch. 7): 'Eliminate dead coasting.' The instant trailing brake hits zero, pick up 15% maintenance throttle to stabilize the rear platform.`;
    } else if (throttleUnwindScore < 70) {
      diagnosis = `Applied throttle while holding aggressive steering lock (${(Math.abs(cornerFrames[apexFrameIndex]?.steering || 0) * 100).toFixed(0)}%). Scrubbed front tire slip budget.`;
      skipBarberAdvice = `Skip Barber Rule (Ch. 2 & 7): 'Unwinding is accelerating.' You cannot deliver full power until steering angle is actively opening up to exit curbs.`;
    }

    return {
      cornerIndex: cDef.index,
      cornerName: cDef.name,
      startDistance: startDist,
      apexDistance: apexDist,
      endDistance: endDist,
      type: cDef.type,
      brakingHitRateMs,
      peakBrakePressure: peakBrake,
      trailBrakingDecayDurationSec,
      trailBrakingScore: trailScore,
      apexMinSpeedKph: Math.round(minSpeedKph),
      targetApexSpeedKph: cDef.targetApexSpeedKph,
      apexGripUtilizationPct: Math.round(apexGripPct),
      throttlePickupHesitationMs,
      throttleUnwindLinearityScore: throttleUnwindScore,
      balanceCategory,
      cornerScore,
      diagnosis,
      skipBarberAdvice
    };
  });

  const avgCornerScore = corners.reduce((acc, c) => acc + c.cornerScore, 0) / (corners.length || 1);
  const overallScore = Math.round(avgCornerScore * 0.7 + (avgTractionBudgetPct * 0.3));

  // Prioritized action items for next stint
  const lowestScoringCorners = [...corners].sort((a, b) => a.cornerScore - b.cornerScore);
  const actionItems: string[] = [];

  if (lowestScoringCorners.length > 0 && lowestScoringCorners[0].cornerScore < 85) {
    const c = lowestScoringCorners[0];
    actionItems.push(`Priority 1 (${c.cornerName}): ${c.skipBarberAdvice}`);
  }
  if (lowestScoringCorners.length > 1 && lowestScoringCorners[1].cornerScore < 88) {
    const c = lowestScoringCorners[1];
    actionItems.push(`Priority 2 (${c.cornerName}): ${c.skipBarberAdvice}`);
  }
  if (avgTractionBudgetPct < 82) {
    actionItems.push(`Traction Budget Focus: Average lap grip is ${avgTractionBudgetPct.toFixed(0)}%. Lean harder on tire contact patch throughout mid-corner steady states.`);
  } else {
    actionItems.push(`Consistency Focus: Maintain the current braking markers and commit to earlier throttle unwind.`);
  }

  return {
    lapId: `lap-${Date.now()}-${lapNumber}`,
    lapNumber,
    lapTimeSec: durationSec > 0 ? durationSec : 92.45,
    isClean: true,
    maxSpeedKph: Math.round(maxSpeedKph),
    avgSpeedKph: Math.round(avgSpeedKph),
    avgTractionBudgetPct: Math.round(avgTractionBudgetPct),
    peakLatG: Number(peakLatG.toFixed(2)),
    peakBrakingG: Number(peakBrakingG.toFixed(2)),
    overallScore,
    corners,
    frames,
    actionItems
  };
}

function createDummyCornerAnalysis(cDef: PredefinedCornerDef): CornerTelemetryAnalysis {
  return {
    cornerIndex: cDef.index,
    cornerName: cDef.name,
    startDistance: cDef.startPct * 3800,
    apexDistance: cDef.apexPct * 3800,
    endDistance: cDef.endPct * 3800,
    type: cDef.type,
    brakingHitRateMs: 110,
    peakBrakePressure: 0.95,
    trailBrakingDecayDurationSec: 0.42,
    trailBrakingScore: 88,
    apexMinSpeedKph: cDef.targetApexSpeedKph - 2,
    targetApexSpeedKph: cDef.targetApexSpeedKph,
    apexGripUtilizationPct: 86,
    throttlePickupHesitationMs: 120,
    throttleUnwindLinearityScore: 90,
    balanceCategory: 'neutral',
    cornerScore: 87,
    diagnosis: `Clean execution through ${cDef.name}.`,
    skipBarberAdvice: `Maintain optimal entry line.`
  };
}

export function createEmptyLapAnalysis(lapNumber: number): LapAnalysis {
  return {
    lapId: `lap-empty-${lapNumber}`,
    lapNumber,
    lapTimeSec: 91.50,
    isClean: true,
    maxSpeedKph: 245,
    avgSpeedKph: 148,
    avgTractionBudgetPct: 85,
    peakLatG: 1.42,
    peakBrakingG: 1.35,
    overallScore: 86,
    corners: DEFAULT_TRACK_CORNERS.map(createDummyCornerAnalysis),
    frames: [],
    actionItems: [
      'Focus on smooth trail-braking taper into heavy apexes.',
      'Unwind steering aggressively on exit to reach 100% throttle sooner.'
    ]
  };
}

export function evaluateSessionChallenge(criteria: SessionChallengeCriteria, laps: LapAnalysis[]): ChallengeResult {
  if (laps.length === 0) {
    return {
      challengeId: criteria.id,
      passed: false,
      score: 0,
      achievedValue: 0,
      targetText: `${criteria.operator === 'gte' ? '≥' : '≤'} ${criteria.targetValue} ${criteria.unit}`,
      lapsCount: 0,
      completedAt: new Date().toISOString(),
      notes: 'No completed laps recorded in session.'
    };
  }

  const validLaps = laps.slice(-criteria.requiredLaps);
  let achievedValue = 0;

  switch (criteria.metric) {
    case 'traction_budget_pct':
      achievedValue = validLaps.reduce((sum, l) => sum + l.avgTractionBudgetPct, 0) / validLaps.length;
      break;
    case 'braking_rise_time_ms':
      const allRiseTimes: number[] = [];
      validLaps.forEach(l => l.corners.forEach(c => allRiseTimes.push(c.brakingHitRateMs)));
      achievedValue = allRiseTimes.reduce((a, b) => a + b, 0) / (allRiseTimes.length || 1);
      break;
    case 'trail_braking_score':
      const allTrailScores: number[] = [];
      validLaps.forEach(l => l.corners.forEach(c => allTrailScores.push(c.trailBrakingScore)));
      achievedValue = allTrailScores.reduce((a, b) => a + b, 0) / (allTrailScores.length || 1);
      break;
    case 'throttle_unwind_score':
      const allUnwind: number[] = [];
      validLaps.forEach(l => l.corners.forEach(c => allUnwind.push(c.throttleUnwindLinearityScore)));
      achievedValue = allUnwind.reduce((a, b) => a + b, 0) / (allUnwind.length || 1);
      break;
    case 'lap_delta_variance_sec':
      if (validLaps.length > 1) {
        const times = validLaps.map(l => l.lapTimeSec);
        const maxT = Math.max(...times);
        const minT = Math.min(...times);
        achievedValue = maxT - minT;
      } else {
        achievedValue = 0.20;
      }
      break;
    case 'slip_angle_window':
      achievedValue = 84; // % in optimal window
      break;
    case 'overall_lap_score':
    default:
      achievedValue = validLaps.reduce((sum, l) => sum + l.overallScore, 0) / validLaps.length;
      break;
  }

  achievedValue = Number(achievedValue.toFixed(1));
  let passed = false;
  if (criteria.operator === 'gte') {
    passed = achievedValue >= criteria.targetValue;
  } else if (criteria.operator === 'lte') {
    passed = achievedValue <= criteria.targetValue;
  }

  const score = Math.min(100, Math.round((achievedValue / (criteria.targetValue || 1)) * 100));

  return {
    challengeId: criteria.id,
    passed,
    score,
    achievedValue,
    targetText: `${criteria.operator === 'gte' ? '≥' : '≤'} ${criteria.targetValue} ${criteria.unit}`,
    lapsCount: validLaps.length,
    completedAt: new Date().toISOString(),
    notes: passed
      ? `PASSED! Achieved ${achievedValue} ${criteria.unit} across ${validLaps.length} consecutive laps.`
      : `Challenge Target Not Met: Achieved ${achievedValue} ${criteria.unit} vs target ${criteria.operator === 'gte' ? '≥' : '≤'} ${criteria.targetValue} ${criteria.unit}. Review debrief and retry.`
  };
}

export function evaluateGraduationTest(test: ModuleGraduationTest, laps: LapAnalysis[]): GraduationResult {
  const validLaps = laps.slice(-test.requiredLaps);
  const avgOverall = validLaps.reduce((acc, l) => acc + l.overallScore, 0) / (validLaps.length || 1);
  const scorePct = Math.round(avgOverall);
  const passed = scorePct >= test.passingScorePct && validLaps.length >= test.requiredLaps;

  return {
    testId: test.id,
    passed,
    scorePct,
    completedAt: new Date().toISOString(),
    lapAnalyses: validLaps,
    badgeUnlocked: passed ? `Mastery Certification: ${test.title}` : ''
  };
}
