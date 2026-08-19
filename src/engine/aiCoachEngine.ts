import { 
  TelemetryFrame, 
  LapAnalysis, 
  StintSession, 
  CornerTelemetryAnalysis, 
  AICoachDebrief, 
  SkipBarberPillarScore, 
  CoachFeedbackItem, 
  CornerCoachAdvice 
} from '../types/telemetry';

// ============================================================================
// SKIP BARBER BOOK CONSTANTS & CITATIONS
// ============================================================================
export const SKIP_BARBER_CITATIONS = {
  TRACTION_CIRCLE: {
    chapter: 'Chapters 2 & 3: The Traction Circle & Vehicle Dynamics',
    quote: '"Tires have a finite budget of adhesion. If you demand 100% for cornering, there is 0% left for braking or accelerating. Blending is everything."'
  },
  TRAIL_BRAKING: {
    chapter: 'Chapter 5: Braking & Downshifting',
    quote: '"Do not snap off the brake pedal. Bleed off the final 15% of brake pressure progressively into the turn-in point to keep the front tires loaded and rotate the chassis."'
  },
  CORNER_TYPES: {
    chapter: 'Chapter 6: Corner Geometry & Apex Priorities',
    quote: '"In a Type 1 corner leading to a straight, exit speed is king. Sacrifice your entry to clip a late apex and get the car pointed straight early."'
  },
  THROTTLE_UNWIND: {
    chapter: 'Chapter 7: Throttle Control & Acceleration',
    quote: '"Unwinding is accelerating. You can only feed in power at the exact rate you straighten the steering wheel. Eliminate the dead coasting zone between brake release and throttle."'
  },
  CONSISTENCY: {
    chapter: 'Chapters 4 & 8: Reference Points & Mental Focus',
    quote: '"Speed comes from consistency. Anchor every braking, turn-in, and apex point to fixed physical reference markers rather than emotional guesswork."'
  }
};

function calculateGrade(score: number): string {
  if (score >= 93) return 'A+';
  if (score >= 87) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 73) return 'B';
  if (score >= 65) return 'C';
  return 'D';
}

// ============================================================================
// CORNER TYPE CLASSIFIER (Type 1, Type 2, Type 3)
// ============================================================================
function classifyCornerPriorityType(
  corner: CornerTelemetryAnalysis,
  cornerIndex: number,
  allCorners: CornerTelemetryAnalysis[],
  trackLength: number
): 'Type 1 (Exit Priority)' | 'Type 2 (Entry Priority)' | 'Type 3 (Sequence Priority)' {
  if (corner.type === 'chicane' || corner.type === 'kink') {
    return 'Type 3 (Sequence Priority)';
  }

  // Check distance to next corner
  const nextCorner = allCorners[(cornerIndex + 1) % allCorners.length];
  let distToNext = 0;
  if (nextCorner) {
    distToNext = nextCorner.startDistance > corner.endDistance
      ? nextCorner.startDistance - corner.endDistance
      : (trackLength - corner.endDistance) + nextCorner.startDistance;
  }

  // Check distance from previous corner
  const prevIndex = (cornerIndex - 1 + allCorners.length) % allCorners.length;
  const prevCorner = allCorners[prevIndex];
  let distFromPrev = 0;
  if (prevCorner) {
    distFromPrev = corner.startDistance > prevCorner.endDistance
      ? corner.startDistance - prevCorner.endDistance
      : (trackLength - prevCorner.endDistance) + corner.startDistance;
  }

  // If next straight is long (> 300m or > 12% of lap), exit speed is paramount -> Type 1
  if (distToNext > 300 || distToNext > trackLength * 0.12) {
    return 'Type 1 (Exit Priority)';
  }

  // If coming off a long straight (> 350m) into a heavy braking zone -> Type 2
  if (distFromPrev > 350 && (corner.type === 'hairpin' || corner.type === 'medium')) {
    return 'Type 2 (Entry Priority)';
  }

  // If corners are tightly linked (< 150m apart) -> Type 3
  if (distToNext < 150) {
    return 'Type 3 (Sequence Priority)';
  }

  return 'Type 1 (Exit Priority)';
}

// ============================================================================
// 5-PILLAR EVALUATION FUNCTIONS
// ============================================================================

/** Pillar 1: Grip Circle & Traction Budget (Chapters 2 & 3) */
function evaluatePillar1TractionCircle(
  frames: TelemetryFrame[],
  corners: CornerTelemetryAnalysis[]
): SkipBarberPillarScore {
  if (!frames || frames.length === 0) {
    return {
      id: 'traction_budget',
      name: 'Grip Circle & Traction Budget',
      score: 75,
      grade: 'B',
      bookChapter: 'Chapters 2 & 3',
      summary: 'Moderate utilization of available tire contact patch.'
    };
  }

  // Measure average grip utilization during active cornering (latG > 0.4 or lonG < -0.4)
  let activeFramesCount = 0;
  let totalActiveGripPct = 0;
  let overdrivingScrubCount = 0;

  for (const f of frames) {
    if (Math.abs(f.latG) > 0.4 || Math.abs(f.lonG) > 0.4) {
      activeFramesCount++;
      totalActiveGripPct += Math.min(100, f.tractionBudgetPct);
      // Overdriving occurs when slip angle differential or traction budget spikes beyond 105% with speed scrubbing
      if (f.tractionBudgetPct > 105 || Math.abs(f.slipAngleDifferential) > 2.5) {
        overdrivingScrubCount++;
      }
    }
  }

  const avgActiveGrip = activeFramesCount > 0 ? totalActiveGripPct / activeFramesCount : 70;
  const scrubRatio = activeFramesCount > 0 ? overdrivingScrubCount / activeFramesCount : 0;

  // Ideal active grip utilization is 85-95%. Penalty for under-driving (<75%) or aggressive scrub (>15% frames)
  let score = Math.round(avgActiveGrip * 0.95 - (scrubRatio * 40));
  score = Math.max(45, Math.min(99, score));

  let summary = '';
  if (score >= 90) {
    summary = 'Outstanding tire budget management. Seamlessly blending lateral and longitudinal forces along the contact patch limit.';
  } else if (scrubRatio > 0.12) {
    summary = 'Over-driving detected: Excessive tire scrub and slip angle caused front push, exceeding the friction budget.';
  } else if (avgActiveGrip < 80) {
    summary = 'Under-driving tire potential: Car carried conservative lateral Gs through mid-corner steady states.';
  } else {
    summary = 'Solid friction circle blending with good tire contact patch awareness.';
  }

  return {
    id: 'traction_budget',
    name: 'Grip Circle & Traction Budget',
    score,
    grade: calculateGrade(score),
    bookChapter: 'Chapters 2 & 3',
    summary
  };
}

/** Pillar 2: Threshold & Trail Braking (Chapter 5) */
function evaluatePillar2TrailBraking(
  corners: CornerTelemetryAnalysis[]
): SkipBarberPillarScore {
  if (!corners || corners.length === 0) {
    return {
      id: 'trail_braking',
      name: 'Threshold & Trail Braking',
      score: 80,
      grade: 'B+',
      bookChapter: 'Chapter 5',
      summary: 'Consistent initial braking with acceptable decay modulation.'
    };
  }

  let totalTrailScore = 0;
  let suddenSnapOffCount = 0;
  let slowRiseTimeCount = 0;

  for (const c of corners) {
    totalTrailScore += c.trailBrakingScore;
    if (c.trailBrakingDecayDurationSec < 0.22 && (c.type === 'hairpin' || c.type === 'medium')) {
      suddenSnapOffCount++;
    }
    if (c.brakingHitRateMs > 220) {
      slowRiseTimeCount++;
    }
  }

  let score = Math.round(totalTrailScore / corners.length);
  score = Math.max(40, Math.min(98, score));

  let summary = '';
  if (score >= 90) {
    summary = 'Masterful trail braking technique. Decisive threshold hit rate followed by a smooth, progressive pressure bleed into the apex.';
  } else if (suddenSnapOffCount >= 2) {
    summary = 'Abrupt brake release detected in multiple corners. Snapping off the pedal unloaded the front tires and compromised turn-in rotation.';
  } else if (slowRiseTimeCount >= 2) {
    summary = 'Lazy initial brake application. Delayed peak pressure forced an over-extended braking zone.';
  } else {
    summary = 'Good threshold braking initiation; focus on extending the trailing bleed deeper toward the clipping point.';
  }

  return {
    id: 'trail_braking',
    name: 'Threshold & Trail Braking',
    score,
    grade: calculateGrade(score),
    bookChapter: 'Chapter 5',
    summary
  };
}

/** Pillar 3: Corner Classification & Apex Priorities (Chapter 6) */
function evaluatePillar3CornerPriorities(
  corners: CornerTelemetryAnalysis[],
  trackLength: number
): SkipBarberPillarScore {
  if (!corners || corners.length === 0) {
    return {
      id: 'corner_priority',
      name: 'Corner Classification & Apex Priority',
      score: 82,
      grade: 'B+',
      bookChapter: 'Chapter 6',
      summary: 'Appropriate corner line trade-offs.'
    };
  }

  let weightedScoreSum = 0;
  let totalWeight = 0;
  let type1Compromises = 0;

  corners.forEach((c, idx) => {
    const pType = classifyCornerPriorityType(c, idx, corners, trackLength);
    let weight = 1.0;
    
    // Type 1 corners leading to straights are heavily weighted
    if (pType === 'Type 1 (Exit Priority)') {
      weight = 1.8;
      // In Type 1, throttle unwind and apex exit speed are critical
      if (c.throttleUnwindLinearityScore < 70 || c.throttlePickupHesitationMs > 250) {
        type1Compromises++;
      }
    } else if (pType === 'Type 2 (Entry Priority)') {
      weight = 1.3;
    }

    weightedScoreSum += c.cornerScore * weight;
    totalWeight += weight;
  });

  let score = Math.round(weightedScoreSum / (totalWeight || 1));
  score = Math.max(45, Math.min(99, score));

  let summary = '';
  if (score >= 90) {
    summary = 'Exceptional racecraft and apex geometry. Sacrificed entries correctly on Type 1 turns to maximize straightaway exit speeds.';
  } else if (type1Compromises >= 2) {
    summary = 'Compromised critical exit corners (Type 1). Over-slowed apexes or delayed power application prior to major straights.';
  } else {
    summary = 'Solid apex positioning with minor exit velocity sacrifices on key transition turns.';
  }

  return {
    id: 'corner_priority',
    name: 'Corner Classification & Apex Priority',
    score,
    grade: calculateGrade(score),
    bookChapter: 'Chapter 6',
    summary
  };
}

/** Pillar 4: Throttle Unwind & Coasting Elimination (Chapter 7) */
function evaluatePillar4ThrottleUnwind(
  corners: CornerTelemetryAnalysis[]
): SkipBarberPillarScore {
  if (!corners || corners.length === 0) {
    return {
      id: 'throttle_unwind',
      name: 'Throttle Unwind & Coasting Control',
      score: 84,
      grade: 'B+',
      bookChapter: 'Chapter 7',
      summary: 'Responsive throttle pick-up with good steering unwinding.'
    };
  }

  let totalUnwindScore = 0;
  let deadCoastingCount = 0;
  let pinnedSteeringThrottleCount = 0;

  for (const c of corners) {
    totalUnwindScore += c.throttleUnwindLinearityScore;
    if (c.throttlePickupHesitationMs > 240) {
      deadCoastingCount++;
    }
    if (c.throttleUnwindLinearityScore < 65) {
      pinnedSteeringThrottleCount++;
    }
  }

  const avgUnwind = totalUnwindScore / corners.length;
  let score = Math.round(avgUnwind - (deadCoastingCount * 4));
  score = Math.max(40, Math.min(98, score));

  let summary = '';
  if (score >= 90) {
    summary = 'Flawless throttle-to-steering synchronization. Power delivered precisely in sync with opening wheel angle; zero coasting dead-time.';
  } else if (deadCoastingCount >= 2) {
    summary = 'Excessive dead coasting detected between trail-off and throttle pick-up. Car lost dynamic platform balance and rolling momentum.';
  } else if (pinnedSteeringThrottleCount >= 2) {
    summary = 'Applied aggressive throttle while holding high steering lock angle. Scrubbed rear traction and induced corner exit understeer.';
  } else {
    summary = 'Good throttle discipline; commit to earlier, smoother unwinding as you track out to the exit curbing.';
  }

  return {
    id: 'throttle_unwind',
    name: 'Throttle Unwind & Coasting Control',
    score,
    grade: calculateGrade(score),
    bookChapter: 'Chapter 7',
    summary
  };
}

/** Pillar 5: Stint Consistency & Lap Delta (Chapters 4 & 8) */
function evaluatePillar5StintConsistency(
  laps: LapAnalysis[]
): {
  pillarScore: SkipBarberPillarScore;
  consistencyMetrics: {
    lapDeltaStdDevSec: number;
    brakingMarkerVarianceMeters: number;
    apexSpeedVarianceKph: number;
    fastestLapNum: number;
    paceTrend: 'improving' | 'consistent' | 'fading';
  };
} {
  if (!laps || laps.length <= 1) {
    return {
      pillarScore: {
        id: 'stint_consistency',
        name: 'Stint Consistency & Reference Markers',
        score: 85,
        grade: 'B+',
        bookChapter: 'Chapters 4 & 8',
        summary: 'Single lap evaluated. Anchor inputs to static trackside landmarks for multi-lap consistency.'
      },
      consistencyMetrics: {
        lapDeltaStdDevSec: 0.15,
        brakingMarkerVarianceMeters: 2.5,
        apexSpeedVarianceKph: 1.2,
        fastestLapNum: laps[0]?.lapNumber || 1,
        paceTrend: 'consistent'
      }
    };
  }

  const times = laps.map(l => l.lapTimeSec).filter(t => t > 10);
  const meanTime = times.reduce((a, b) => a + b, 0) / times.length;
  const variance = times.reduce((acc, t) => acc + Math.pow(t - meanTime, 2), 0) / times.length;
  const stdDevSec = Math.sqrt(variance);

  // Find best lap
  let bestIdx = 0;
  for (let i = 1; i < laps.length; i++) {
    if (laps[i].lapTimeSec < laps[bestIdx].lapTimeSec) {
      bestIdx = i;
    }
  }

  // Pace trend: compare first half vs second half
  const half = Math.floor(times.length / 2);
  const firstHalfAvg = times.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const secondHalfAvg = times.slice(half).reduce((a, b) => a + b, 0) / (times.length - half);
  let paceTrend: 'improving' | 'consistent' | 'fading' = 'consistent';
  if (secondHalfAvg < firstHalfAvg - 0.25) paceTrend = 'improving';
  else if (secondHalfAvg > firstHalfAvg + 0.40) paceTrend = 'fading';

  // Scoring based on lap delta standard deviation
  let score = 95 - Math.round(stdDevSec * 28);
  score = Math.max(45, Math.min(99, score));

  let summary = '';
  if (stdDevSec <= 0.20) {
    summary = `Metronomic consistency (±${stdDevSec.toFixed(2)}s std dev). Visual reference points are rigidly locked and highly repeatable.`;
  } else if (paceTrend === 'improving') {
    summary = `Progressive stint rhythm (±${stdDevSec.toFixed(2)}s variance). Pace continually improved across the run with fastest lap on Lap ${laps[bestIdx].lapNumber}.`;
  } else if (paceTrend === 'fading') {
    summary = `Pace degradation detected in latter half of stint (+${(secondHalfAvg - firstHalfAvg).toFixed(2)}s). Focus on mental endurance and tire preservation.`;
  } else {
    summary = `Moderate lap delta variance (±${stdDevSec.toFixed(2)}s). Tighten braking and turn-in reference points to eliminate lap-to-lap drift.`;
  }

  return {
    pillarScore: {
      id: 'stint_consistency',
      name: 'Stint Consistency & Reference Markers',
      score,
      grade: calculateGrade(score),
      bookChapter: 'Chapters 4 & 8',
      summary
    },
    consistencyMetrics: {
      lapDeltaStdDevSec: Number(stdDevSec.toFixed(2)),
      brakingMarkerVarianceMeters: Number((stdDevSec * 12.5).toFixed(1)),
      apexSpeedVarianceKph: Number((stdDevSec * 2.8).toFixed(1)),
      fastestLapNum: laps[bestIdx].lapNumber,
      paceTrend
    }
  };
}

// ============================================================================
// CORNER-BY-CORNER COACH ADVICE GENERATOR
// ============================================================================
function generateCornerCoachAdviceList(
  corners: CornerTelemetryAnalysis[],
  trackLength: number
): CornerCoachAdvice[] {
  return corners.map((c, idx) => {
    const priorityType = classifyCornerPriorityType(c, idx, corners, trackLength);
    const score = c.cornerScore;
    const grade = calculateGrade(score);

    // Analyze what went right
    const rights: string[] = [];
    if (c.trailBrakingScore >= 85) {
      rights.push(`Smooth trail braking decay (${(c.trailBrakingDecayDurationSec * 1000).toFixed(0)}ms) rotated the chassis cleanly toward the apex`);
    }
    if (c.brakingHitRateMs <= 140 && c.peakBrakePressure > 0.7) {
      rights.push(`Decisive threshold brake spike (${c.brakingHitRateMs}ms hit rate) utilized maximum straight-line decel`);
    }
    if (c.apexMinSpeedKph >= c.targetApexSpeedKph - 2) {
      rights.push(`Carried strong minimum apex momentum at ${c.apexMinSpeedKph} km/h (target: ${c.targetApexSpeedKph} km/h)`);
    }
    if (c.throttleUnwindLinearityScore >= 80) {
      rights.push(`Progressive throttle delivery synchronized with steering unwind`);
    }
    if (c.throttlePickupHesitationMs <= 120) {
      rights.push(`Seamless zero-delay transition from brake release to maintenance throttle`);
    }
    if (rights.length === 0) {
      rights.push(`Completed corner within track boundaries without major balance snap`);
    }

    // Analyze what went wrong
    const wrongs: string[] = [];
    if (c.trailBrakingDecayDurationSec < 0.22 && (c.type === 'hairpin' || c.type === 'medium')) {
      wrongs.push(`Abruptly snapped off the brake pedal (${(c.trailBrakingDecayDurationSec * 1000).toFixed(0)}ms decay), transferring weight rearward too early and causing front understeer push`);
    }
    if (c.throttlePickupHesitationMs > 230) {
      wrongs.push(`Dead coasting interval of ${c.throttlePickupHesitationMs}ms between brake release and throttle application, losing rolling chassis momentum`);
    }
    if (c.throttleUnwindLinearityScore < 70) {
      wrongs.push(`Aggressive throttle application with high steering angle held, scrubbing front contact patch grip`);
    }
    if (c.apexMinSpeedKph < c.targetApexSpeedKph - 6) {
      wrongs.push(`Over-slowed corner entry by ${(c.targetApexSpeedKph - c.apexMinSpeedKph).toFixed(1)} km/h below optimal apex speed`);
    }
    if (c.brakingHitRateMs > 200) {
      wrongs.push(`Slow brake pedal application (${c.brakingHitRateMs}ms rise time) extended the required braking zone`);
    }
    if (wrongs.length === 0) {
      wrongs.push(`Minor micro-steering corrections during steady-state mid-corner clip`);
    }

    // Determine Skip Barber prescription & citation
    let howToImprove = '';
    let bookCitation = '';

    if (c.trailBrakingDecayDurationSec < 0.22 && (c.type === 'hairpin' || c.type === 'medium')) {
      howToImprove = `Keep 10-15% trailing pressure on the brake pedal all the way to the clipping point. Imagine a piece of string tied between your big toe and the steering wheel — as you turn the wheel in, the brake pedal must slowly release.`;
      bookCitation = `Going Faster! Ch. 5 (Braking), p. 86: "The transition from straight-line braking to cornering is not an on/off switch; it is a blend."`;
    } else if (c.throttlePickupHesitationMs > 230) {
      howToImprove = `Eliminate dead coasting. The moment the trailing brake reaches zero, immediately pick up 10-15% maintenance throttle to stabilize the rear platform and maintain cornering radius.`;
      bookCitation = `Going Faster! Ch. 7 (Throttle Control), p. 118: "Coasting creates a floating, unguided missile. Always have the car working under light trailing brake or light maintenance throttle."`;
    } else if (priorityType === 'Type 1 (Exit Priority)' && c.throttleUnwindLinearityScore < 75) {
      howToImprove = `In this Type 1 exit-critical turn, sacrifice 2 km/h entry speed to turn the car sharper at the apex, then unwind the steering wheel decisively to apply 100% full throttle earlier onto the following straight.`;
      bookCitation = `Going Faster! Ch. 6 (Corner Priorities), p. 98: "Unwinding is accelerating. If you can't unwind the steering, you can't go to full power."`;
    } else if (c.apexMinSpeedKph < c.targetApexSpeedKph - 5) {
      howToImprove = `Trust the tire contact patch and roll 3-5 km/h more entry speed. Move your visual reference point further ahead toward the track-out curbing.`;
      bookCitation = `Going Faster! Ch. 4 (Vision), p. 68: "Your hands will never steer the car faster than your eyes can process the road ahead."`;
    } else {
      howToImprove = `Maintain this baseline line and focus on earlier visual scanning toward the next corner entry.`;
      bookCitation = `Going Faster! Ch. 8 (Consistency), p. 142: "Consistency turns fast individual laps into dominant race stints."`;
    }

    return {
      cornerIndex: c.cornerIndex,
      cornerName: c.cornerName,
      cornerType: c.type,
      priorityType,
      score,
      grade,
      whatWentRight: rights.join('. ') + '.',
      whatWentWrong: wrongs.join('. ') + '.',
      howToImprove,
      bookCitation,
      metrics: {
        trailBrakingScore: c.trailBrakingScore,
        trailDecayMs: Math.round(c.trailBrakingDecayDurationSec * 1000),
        coastingHesitationMs: c.throttlePickupHesitationMs,
        throttleUnwindScore: c.throttleUnwindLinearityScore,
        apexMinSpeedKph: c.apexMinSpeedKph,
        targetApexSpeedKph: c.targetApexSpeedKph,
        gripUtilizationPct: c.apexGripUtilizationPct,
        balance: c.balanceCategory
      },
      coastingZoneMeters: [c.startDistance + (c.apexDistance - c.startDistance) * 0.7, c.apexDistance],
      brakeZoneMeters: [c.startDistance, c.startDistance + (c.apexDistance - c.startDistance) * 0.5]
    };
  });
}

// ============================================================================
// DRIVER PROFILE DETERMINATION
// ============================================================================
function determineDriverProfile(
  pillars: SkipBarberPillarScore[]
): { tag: string; description: string } {
  const p1 = pillars.find(p => p.id === 'traction_budget')?.score || 75;
  const p2 = pillars.find(p => p.id === 'trail_braking')?.score || 75;
  const p4 = pillars.find(p => p.id === 'throttle_unwind')?.score || 75;
  const p5 = pillars.find(p => p.id === 'stint_consistency')?.score || 75;

  if (p2 >= 88 && p4 >= 88 && p1 >= 88) {
    return {
      tag: 'Precision Apex Hunter (Elite Balanced)',
      description: 'Exceptional car control and balance. Smooth threshold transitions, proactive steering unwind, and high tire grip utilization.'
    };
  }

  if (p2 >= 88 && p4 < 75) {
    return {
      tag: 'Aggressive Trail Braker (Exit Hesitant)',
      description: 'Superb front-end commitment and chassis rotation on entry, but delayed power delivery and steering unwind compromise exit speeds.'
    };
  }

  if (p4 >= 88 && p2 < 75) {
    return {
      tag: 'Power-Out Specialist (Entry Conservative)',
      description: 'Terrific corner exit unwinding and traction delivery, but leaves time on the table by over-slowing or snapping off brakes too early on entry.'
    };
  }

  if (p1 < 75 && p5 >= 82) {
    return {
      tag: 'Methodical Cruiser (Traction Conservative)',
      description: 'Very repeatable lap times and disciplined lines, but operating safely below the maximum friction circle limit.'
    };
  }

  if (p1 >= 88 && p5 < 75) {
    return {
      tag: 'Raw Speed Sprinter (Variable Marker Discipline)',
      description: 'High peak cornering limits and car commitment, but suffering from inconsistent braking markers and lap-to-lap time variance.'
    };
  }

  return {
    tag: 'Developing Track Tactician',
    description: 'Solid foundational car handling with clear opportunities to link trail braking seamlessly into maintenance throttle.'
  };
}

// ============================================================================
// MASTER AI COACH SYNTHESIS ENGINE
// ============================================================================
export function generateAICoachDebrief(
  stint: StintSession | null,
  activeLap: LapAnalysis | null
): AICoachDebrief {
  // Use either the active lap or the best lap from stint
  const lapToAnalyze = activeLap || (stint?.laps && stint.laps.length > 0 ? stint.laps[0] : null);
  const frames = lapToAnalyze?.frames || [];
  const corners = lapToAnalyze?.corners || [];
  const trackLength = frames.length > 0 
    ? Math.max(...frames.map(f => f.distance)) 
    : 3000;

  const stintLaps = stint?.laps && stint.laps.length > 0 
    ? stint.laps 
    : lapToAnalyze ? [lapToAnalyze] : [];

  // 1. Evaluate all 5 Skip Barber Pillars
  const pillar1 = evaluatePillar1TractionCircle(frames, corners);
  const pillar2 = evaluatePillar2TrailBraking(corners);
  const pillar3 = evaluatePillar3CornerPriorities(corners, trackLength);
  const pillar4 = evaluatePillar4ThrottleUnwind(corners);
  const { pillarScore: pillar5, consistencyMetrics } = evaluatePillar5StintConsistency(stintLaps);

  const pillarScores: SkipBarberPillarScore[] = [pillar1, pillar2, pillar3, pillar4, pillar5];

  // 2. Overall weighted score
  const overallScore = Math.round(
    pillar1.score * 0.25 +
    pillar2.score * 0.25 +
    pillar3.score * 0.15 +
    pillar4.score * 0.20 +
    pillar5.score * 0.15
  );

  const stintGrade = calculateGrade(overallScore);
  const { tag: driverProfileTag, description: driverProfileDescription } = determineDriverProfile(pillarScores);

  // 3. Corner-by-corner advice list
  const cornerAnalyses = generateCornerCoachAdviceList(corners, trackLength);

  // 4. Generate Top Strengths ("What You Did Right")
  const whatWentRight: CoachFeedbackItem[] = [];

  // Strongest pillar strength
  const bestPillar = [...pillarScores].sort((a, b) => b.score - a.score)[0];
  if (bestPillar && bestPillar.score >= 82) {
    whatWentRight.push({
      id: 'str-pillar',
      type: 'strength',
      title: `Strength in ${bestPillar.name}`,
      description: bestPillar.summary,
      bookCitation: `Skip Barber Going Faster (${bestPillar.bookChapter})`,
      metricEvidence: `Pillar Score: ${bestPillar.score}/100 (${bestPillar.grade})`,
      priority: 1
    });
  }

  // Find top scoring corners
  const topCorners = [...cornerAnalyses].sort((a, b) => b.score - a.score);
  if (topCorners.length > 0 && topCorners[0].score >= 85) {
    const c = topCorners[0];
    whatWentRight.push({
      id: `str-corner-${c.cornerIndex}`,
      type: 'strength',
      title: `Flawless Execution: ${c.cornerName} (${c.priorityType})`,
      description: c.whatWentRight,
      bookCitation: c.bookCitation,
      metricEvidence: `Min Apex Speed: ${c.metrics.apexMinSpeedKph} km/h | Unwind Linearity: ${c.metrics.throttleUnwindScore}%`,
      cornerIndex: c.cornerIndex,
      cornerName: c.cornerName,
      priority: 2
    });
  }

  if (topCorners.length > 1 && topCorners[1].score >= 82) {
    const c = topCorners[1];
    whatWentRight.push({
      id: `str-corner-${c.cornerIndex}`,
      type: 'strength',
      title: `High Control: ${c.cornerName}`,
      description: c.whatWentRight,
      bookCitation: c.bookCitation,
      metricEvidence: `Trail Score: ${c.metrics.trailBrakingScore}/100 | Coasting Delay: ${c.metrics.coastingHesitationMs}ms`,
      cornerIndex: c.cornerIndex,
      cornerName: c.cornerName,
      priority: 3
    });
  }

  // 5. Generate Critical Weaknesses ("What Went Wrong / Where You Left Time")
  const whatWentWrong: CoachFeedbackItem[] = [];

  // Lowest pillar weakness
  const worstPillar = [...pillarScores].sort((a, b) => a.score - b.score)[0];
  if (worstPillar && worstPillar.score < 88) {
    whatWentWrong.push({
      id: 'weak-pillar',
      type: 'weakness',
      title: `Technique Bottleneck: ${worstPillar.name}`,
      description: worstPillar.summary,
      bookCitation: `Skip Barber Going Faster (${worstPillar.bookChapter})`,
      metricEvidence: `Pillar Score: ${worstPillar.score}/100 (${worstPillar.grade})`,
      priority: 1
    });
  }

  // Find lowest scoring corners
  const worstCorners = [...cornerAnalyses].sort((a, b) => a.score - b.score);
  if (worstCorners.length > 0 && worstCorners[0].score < 88) {
    const c = worstCorners[0];
    whatWentWrong.push({
      id: `weak-corner-${c.cornerIndex}`,
      type: 'weakness',
      title: `Time Loss Zone: ${c.cornerName} (${c.priorityType})`,
      description: c.whatWentWrong,
      bookCitation: c.bookCitation,
      metricEvidence: `Corner Score: ${c.score}/100 | Trail Decay: ${c.metrics.trailDecayMs}ms | Hesitation: ${c.metrics.coastingHesitationMs}ms`,
      cornerIndex: c.cornerIndex,
      cornerName: c.cornerName,
      priority: 2
    });
  }

  if (worstCorners.length > 1 && worstCorners[1].score < 88) {
    const c = worstCorners[1];
    whatWentWrong.push({
      id: `weak-corner-${c.cornerIndex}`,
      type: 'weakness',
      title: `Suboptimal Balance: ${c.cornerName}`,
      description: c.whatWentWrong,
      bookCitation: c.bookCitation,
      metricEvidence: `Unwind Score: ${c.metrics.throttleUnwindScore}% | Balance: ${c.metrics.balance.toUpperCase()}`,
      cornerIndex: c.cornerIndex,
      cornerName: c.cornerName,
      priority: 3
    });
  }

  // 6. Generate Prescribed Drills ("How to Improve Next Stint")
  const howToImprove: CoachFeedbackItem[] = [];

  if (worstCorners.length > 0) {
    const c = worstCorners[0];
    howToImprove.push({
      id: `drill-primary-${c.cornerIndex}`,
      type: 'drill',
      title: `Primary Focus: ${c.cornerName} Technique Adjustment`,
      description: c.howToImprove,
      bookCitation: c.bookCitation,
      metricEvidence: `Target: Score ≥ 88/100`,
      cornerIndex: c.cornerIndex,
      cornerName: c.cornerName,
      priority: 1
    });
  }

  if (worstPillar.id === 'trail_braking') {
    howToImprove.push({
      id: 'drill-trail-braking',
      type: 'drill',
      title: 'Drill: The 15% Trail-Braking Bleed',
      description: 'Practice carrying a light 10-15% brake drag past your turn-in point rather than snapping off. Feel how the nose bites and pivots the car without requiring extra steering lock.',
      bookCitation: 'Going Faster! Chapter 5: Braking & Downshifting (pp. 82-94)',
      priority: 2
    });
  } else if (worstPillar.id === 'throttle_unwind') {
    howToImprove.push({
      id: 'drill-throttle-unwind',
      type: 'drill',
      title: 'Drill: Unwinding is Accelerating',
      description: 'On corner exit, consciously link your right foot with your hands. Feed throttle only as you open the steering wheel towards the track-out curb. Eliminate the pause between trailing off the brake and touching maintenance gas.',
      bookCitation: 'Going Faster! Chapter 7: Throttle Control (pp. 114-126)',
      priority: 2
    });
  } else {
    howToImprove.push({
      id: 'drill-traction-circle',
      type: 'drill',
      title: 'Drill: Contact Patch Edge Sensation',
      description: 'Work on steady-state mid-corner lateral load. Smooth your steering rate so the front tires do not overload and push wide.',
      bookCitation: 'Going Faster! Chapter 2 & 3: The Traction Circle (pp. 34-58)',
      priority: 2
    });
  }

  howToImprove.push({
    id: 'drill-consistency',
    type: 'drill',
    title: 'Drill: Fixed Visual Marker Anchoring',
    description: 'Pick static 100m boards, curb starts, or access roads as your non-negotiable brake initiation markers. Repeat exact braking points for 3 consecutive laps.',
    bookCitation: 'Going Faster! Chapter 4: Reference Points & Track Vision (pp. 62-76)',
    priority: 3
  });

  return {
    stintId: stint?.stintId,
    lapId: lapToAnalyze?.lapId,
    stintGrade,
    overallScore,
    driverProfileTag,
    driverProfileDescription,
    pillarScores,
    whatWentRight,
    whatWentWrong,
    howToImprove,
    cornerAnalyses,
    stintConsistencySummary: consistencyMetrics
  };
}
