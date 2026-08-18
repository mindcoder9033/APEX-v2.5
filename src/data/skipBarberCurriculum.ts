import { Module } from '../types/curriculum';

export const SKIP_BARBER_MODULES: Module[] = [
  // ==========================================
  // DRIVER LEVEL: BEGINNER (MODULES 1 - 4)
  // ==========================================
  {
    id: 'mod-1',
    driverLevel: 'Beginner',
    moduleNumber: 1,
    title: 'Seating, Vision & Track Reference Points',
    tagline: 'Developing High-Speed Vision, Focal Scanning, and Reference Point Discipline',
    bookChapter: 'Chapters 1 & 4: Vision & Reference Points',
    iconName: 'Eye',
    description: 'Master the psychological and optical foundation of motorsport. Overcome high-speed tunnel vision, anchor your line using fixed static reference markers, and optimize corner exit track-out vision.',
    sessions: [
      {
        id: 's-1-1',
        moduleId: 'mod-1',
        sessionNumber: 1,
        title: 'Seating Posture & The Expanding Field of View',
        subtitle: 'Overcoming tunnel vision through high-frequency eye scanning',
        bookReference: 'Going Faster Chapter 1, pp. 12-23',
        theorySummary: [
          'Proper seating posture (slight bend in elbows and knees, firm back contact) maximizes kinesthetic feedback through the chassis.',
          'Tunnel vision occurs when staring directly over the hood; racers must keep their gaze far down the road to slow down perceived speed.',
          'Your hands naturally follow where your eyes look.'
        ],
        keyPrinciples: [
          { title: 'Look Where You Want to Go', explanation: 'Direct your focal vision at your next objective (apex/exit) rather than the immediate road surface.' },
          { title: 'High-Frequency Eye Scanning', explanation: 'Continuously scan between your immediate turn-in point, apex clipping point, and future track-out.' }
        ],
        drillGoal: 'Complete 5 consistent laps maintaining smooth line stability with minimal micro-corrections.',
        targetMetrics: [
          { label: 'Steering Smoothness', value: '≥ 75/100', hint: 'Fluid, decisive inputs with minimal sawing' },
          { label: 'Track Limit Discipline', value: '0 Violations', hint: 'Stay completely within track boundary limits' }
        ],
        challenge: {
          id: 'ch-beg-1-1',
          name: 'Vision & Smoothness Challenge',
          description: 'Attain a steering smoothness score of ≥ 75/100 across 2 consecutive laps.',
          metric: 'steering_smoothness_score',
          operator: 'gte',
          targetValue: 75,
          unit: '/100',
          requiredLaps: 2,
          medals: { bronze: 70, silver: 80, gold: 90 }
        },
        recommendedSetup: {
          car: 'Mazda MX-5 Miata 1994',
          altCar: 'Mazda MX-5 2016',
          track: 'Lime Rock Full',
          gameType: 'Circuit Race',
          timeOfDay: 'Morning',
          weather: 'Clear',
          laps: 5,
          drivatars: 0,
          notes: 'Focus on looking through Big Bend toward the Esses long before you arrive at turn-in.'
        }
      },
      {
        id: 's-1-2',
        moduleId: 'mod-1',
        sessionNumber: 2,
        title: 'Identifying Static Reference Markers (Braking & Turn-In)',
        subtitle: 'Eliminating guesswork by anchoring inputs to permanent trackside landmarks',
        bookReference: 'Going Faster Chapter 4, pp. 62-74',
        theorySummary: [
          'Intuition and "feeling" vary by fatigue; elite drivers rely on fixed visual markers (meter boards, curbing starts, painted lines, access roads).',
          'Finding a reliable turn-in point provides consistency across consecutive stints.',
          'Once past your braking marker, your eyes must immediately snap to the apex clipping point.'
        ],
        keyPrinciples: [
          { title: 'Hard Markers vs Soft Markers', explanation: 'Use stationary objects (curbs/signs), never moving shadows, tire marks, or parked vehicles.' },
          { title: 'Commitment Point', explanation: 'Once at your braking marker, execute deceleration without hesitation and scan ahead.' }
        ],
        drillGoal: 'Brake and turn in within ±2 meters of the exact designated reference point on every lap.',
        targetMetrics: [
          { label: 'Lap Delta Variance', value: '≤ 0.30s', hint: 'Consistent lap times from repeatable marker points' },
          { label: 'Turn-in Consistency', value: '≥ 80%', hint: 'Repeatable steering initiation point' }
        ],
        challenge: {
          id: 'ch-beg-1-2',
          name: 'Marker Point Consistency Challenge',
          description: 'Achieve a lap delta variance of ≤ 0.30s across 3 consecutive laps.',
          metric: 'lap_delta_variance_sec',
          operator: 'lte',
          targetValue: 0.30,
          unit: 's',
          requiredLaps: 3,
          medals: { bronze: 0.40, silver: 0.25, gold: 0.15 }
        },
        recommendedSetup: {
          car: 'Mazda MX-5 Miata 1994',
          altCar: 'Honda Civic Type R 1997',
          track: 'Lime Rock Full',
          gameType: 'Circuit Race',
          timeOfDay: 'Late Morning',
          weather: 'Mostly Clear',
          laps: 6,
          drivatars: 0,
          notes: 'Pick fixed trackside markers on the approach to Turn 1 and the West Bend chicane.'
        }
      },
      {
        id: 's-1-3',
        moduleId: 'mod-1',
        sessionNumber: 3,
        title: 'Exit Track-Out Vision & Track Width Exploitation',
        subtitle: 'Using every millimeter of curbing to maximize effective turn radius',
        bookReference: 'Going Faster Chapter 4, pp. 75-85',
        theorySummary: [
          'Leaving even 1 foot of pavement unused at corner exit artificially tightens the corner radius and sacrifices top speed down the entire straight.',
          'Eyes must lock onto the exit curbing apex transition before the car physically clips the inner apex.'
        ],
        keyPrinciples: [
          { title: 'Use Every Inch of Pavement', explanation: 'Maximizing exit radius directly increases allowable exit velocity.' },
          { title: 'Peripheral Awareness', explanation: 'Keep central focus on the horizon while using peripheral vision to gauge curb distance.' }
        ],
        drillGoal: 'Position outer tires within 0.5 meters of the exit curbing without exceeding track limits.',
        targetMetrics: [
          { label: 'Overall Lap Score', value: '≥ 75%', hint: 'Clean track-out execution on all key sectors' },
          { label: 'Exit Width Utilization', value: '≥ 90%', hint: 'Using the full width of the exit curbing' }
        ],
        challenge: {
          id: 'ch-beg-1-3',
          name: 'Track-Out Precision Challenge',
          description: 'Attain an overall sector track-out precision score of ≥ 75% on 2 consecutive laps.',
          metric: 'overall_lap_score',
          operator: 'gte',
          targetValue: 75,
          unit: '%',
          requiredLaps: 2,
          medals: { bronze: 70, silver: 80, gold: 90 }
        },
        recommendedSetup: {
          car: 'Mazda MX-5 Miata 1994',
          altCar: 'Mazda MX-5 2016',
          track: 'Lime Rock Full',
          gameType: 'Circuit Race',
          timeOfDay: 'Noon',
          weather: 'Clear',
          laps: 5,
          drivatars: 0,
          notes: 'Let the car track all the way to the paint on the exit of the Downhill onto the main straight.'
        }
      }
    ],
    graduationTest: {
      id: 'gt-1',
      moduleId: 'mod-1',
      title: 'Module 1 Graduation: Vision & Reference Point Exam',
      examOverview: 'A comprehensive 3-lap evaluation testing eye discipline, repeatable braking marker alignment, and full track-width utilization.',
      trackName: 'Lime Rock Full',
      carName: 'Mazda MX-5 Miata 1994',
      altCarName: 'Honda Civic Type R 1997',
      requiredLaps: 3,
      passingScorePct: 80,
      requirements: [
        { title: 'Braking Marker Precision', description: 'Lap time variance under 0.30s across laps', metric: 'Consistency', targetText: '≤ 0.30s', minScorePct: 80 },
        { title: 'Steering Smoothness', description: 'Average smoothness score of at least 75/100', metric: 'Smoothness', targetText: '≥ 75/100', minScorePct: 80 },
        { title: 'Track Limits Discipline', description: '3 clean laps with zero off-track violations', metric: 'Clean Laps', targetText: '3/3 Laps', minScorePct: 100 }
      ],
      recommendedSetup: {
        car: 'Mazda MX-5 Miata 1994',
        altCar: 'Honda Civic Type R 1997',
        track: 'Lime Rock Full',
        gameType: 'Circuit Race',
        timeOfDay: 'Afternoon',
        weather: 'Clear',
        laps: 3,
        drivatars: 3,
        notes: 'Official Module 1 Graduation Exam with light field traffic.'
      }
    }
  },

  {
    id: 'mod-2',
    driverLevel: 'Beginner',
    moduleNumber: 2,
    title: 'The Racing Line & Apex Geometry',
    tagline: 'Geometric vs Early vs Late Apexes and Corner Prioritization',
    bookChapter: 'Chapter 2: The Racing Line',
    iconName: 'Route',
    description: 'Master the fundamental geometry of cornering. Learn why a late apex maximizes corner exit speed on straightaway lead-ins, how to navigate decreasing-radius turns, and how to execute sacrifice turns in linked complexes.',
    sessions: [
      {
        id: 's-2-1',
        moduleId: 'mod-2',
        sessionNumber: 1,
        title: 'Geometric vs Late Apexes on Lead-in Corners',
        subtitle: 'Prioritizing exit speed for maximum straightaway velocity',
        bookReference: 'Going Faster Chapter 2, pp. 24-38',
        theorySummary: [
          'A corner leading onto a straight is an "Exit Priority" corner requiring a Late Apex.',
          'Early apexes lead to running out of road on exit or having to lift off throttle.',
          'Geometric apex gives minimum speed scrub but compromises exit acceleration.'
        ],
        keyPrinciples: [
          { title: 'The Straight Follows the Turn', explanation: 'Exit speed is carried down the entire length of the ensuing straight.' },
          { title: 'Late Apex Geometry', explanation: 'Turn in slightly later and sharper to straighten the car earlier for maximum throttle.' }
        ],
        drillGoal: 'Hit within ±1.0m of the late apex clipping point across all sector turns.',
        targetMetrics: [
          { label: 'Apex Accuracy', value: '≥ 85%', hint: 'Clipping point within 1.0m tolerance' },
          { label: 'Exit Throttle Point', value: 'Before Apex + 10m', hint: 'Car positioned to accelerate early' }
        ],
        challenge: {
          id: 'ch-beg-2-1',
          name: 'Late Apex Precision Challenge',
          description: 'Achieve an apex clipping accuracy score of ≥ 75% on 2 consecutive laps.',
          metric: 'overall_lap_score',
          operator: 'gte',
          targetValue: 75,
          unit: '%',
          requiredLaps: 2,
          medals: { bronze: 70, silver: 80, gold: 90 }
        },
        recommendedSetup: {
          car: 'Honda Civic Type R 1997',
          altCar: 'Acura Integra Type R 2001',
          track: 'Laguna Seca',
          gameType: 'Circuit Race',
          timeOfDay: 'Morning',
          weather: 'Mostly Clear',
          laps: 5,
          drivatars: 0,
          notes: 'Focus strictly on squaring off Turn 11 so you can be 100% full throttle before the pit wall.'
        }
      },
      {
        id: 's-2-2',
        moduleId: 'mod-2',
        sessionNumber: 2,
        title: 'Constant-Radius vs Decreasing-Radius Corners',
        subtitle: 'Patience and platform balance in tightening turns',
        bookReference: 'Going Faster Chapter 2, pp. 39-51',
        theorySummary: [
          'Constant-radius turns allow steady-state lateral grip throughout the mid-corner.',
          'Decreasing-radius corners trap impatient drivers into early apexes, causing severe understeer and off-track exits.',
          'Delay initial turn-in and maintain neutral maintenance throttle until the final apex is cleared.'
        ],
        keyPrinciples: [
          { title: 'Patient Turn-In', explanation: 'Do not rush the front tires into tightening corners.' },
          { title: 'Platform Balance', explanation: 'Maintain neutral maintenance throttle through the mid-corner.' }
        ],
        drillGoal: 'Execute smooth transition through multi-radius corners without mid-corner throttle chopping.',
        targetMetrics: [
          { label: 'Throttle Stability', value: '≥ 80/100', hint: 'Zero hesitations or throttle chops' },
          { label: 'Understeer Management', value: '0 Scrub Spikes', hint: 'Avoid pushing the front axle past grip limits' }
        ],
        challenge: {
          id: 'ch-beg-2-2',
          name: 'Corner Radius Management Challenge',
          description: 'Attain a throttle stability and unwind score of ≥ 78/100 across 2 consecutive laps.',
          metric: 'throttle_unwind_score',
          operator: 'gte',
          targetValue: 78,
          unit: '/100',
          requiredLaps: 2,
          medals: { bronze: 70, silver: 80, gold: 90 }
        },
        recommendedSetup: {
          car: 'Honda Civic Type R 1997',
          altCar: 'Mazda MX-5 Miata 1990',
          track: 'Laguna Seca',
          gameType: 'Circuit Race',
          timeOfDay: 'Late Morning',
          weather: 'Partly Cloudy',
          laps: 6,
          drivatars: 0,
          notes: 'Turn 3 and Turn 4 reward delayed steering commitment; avoid rushing the front tires.'
        }
      },
      {
        id: 's-2-3',
        moduleId: 'mod-2',
        sessionNumber: 3,
        title: 'Linked Corners & The Sacrifice Principle',
        subtitle: 'Sacrificing entry speed in the first corner to optimize the second',
        bookReference: 'Going Faster Chapter 2, pp. 52-61',
        theorySummary: [
          'When two corners are linked with little or no straightaway between them, the first corner must be sacrificed to optimize entry and exit for the second corner.',
          'The corner leading onto the longest straight takes 100% priority.'
        ],
        keyPrinciples: [
          { title: 'Priority Allocation', explanation: 'Always sacrifice the turn that leads into another turn, never the turn that leads onto a straight.' },
          { title: 'Position Over Speed', explanation: 'Geometric placement into the second corner matters more than entry velocity in the first.' }
        ],
        drillGoal: 'Sacrifice Turn 8 (Corkscrew) entry to maximize track position for Turn 8A and Turn 9 (Rainey Curve).',
        targetMetrics: [
          { label: 'Complex Exit Velocity', value: '+5 km/h', hint: 'Carrying exit momentum out of Rainey Curve' },
          { label: 'Line Accuracy', value: '≥ 85%', hint: 'Correct positioning over the blind crest' }
        ],
        challenge: {
          id: 'ch-beg-2-3',
          name: 'Linked Complex Execution Challenge',
          description: 'Attain an overall complex sector score of ≥ 78% with zero off-tracks across 2 consecutive laps.',
          metric: 'overall_lap_score',
          operator: 'gte',
          targetValue: 78,
          unit: '%',
          requiredLaps: 2,
          medals: { bronze: 70, silver: 80, gold: 90 }
        },
        recommendedSetup: {
          car: 'Honda Civic Type R 1997',
          altCar: 'Acura Integra Type R 2001',
          track: 'Laguna Seca',
          gameType: 'Circuit Race',
          timeOfDay: 'Noon',
          weather: 'Clear',
          laps: 6,
          drivatars: 0,
          notes: 'Hug the left side over the blind crest of the Corkscrew to open up the right-hand drop.'
        }
      }
    ],
    graduationTest: {
      id: 'gt-2',
      moduleId: 'mod-2',
      title: 'Module 2 Graduation: Racing Line Mastery Exam',
      examOverview: 'A comprehensive 3-lap exam evaluating apex precision, corner classification execution, and linked corner sacrifices.',
      trackName: 'Laguna Seca',
      carName: 'Honda Civic Type R 1997',
      altCarName: 'Mazda MX-5 Miata 1990',
      requiredLaps: 3,
      passingScorePct: 80,
      requirements: [
        { title: 'Apex Consistency', description: 'Hit clipping zones on all priority turns', metric: 'Apex Accuracy', targetText: '≥ 80%', minScorePct: 80 },
        { title: 'Throttle Unwind Linearity', description: 'Smooth throttle application synchronized with steering unwind', metric: 'Unwind Score', targetText: '≥ 78/100', minScorePct: 80 },
        { title: 'Clean Lap Execution', description: '3 consecutive clean laps with zero track limit violations', metric: 'Clean Laps', targetText: '3/3 Laps', minScorePct: 100 }
      ],
      recommendedSetup: {
        car: 'Honda Civic Type R 1997',
        altCar: 'Mazda MX-5 Miata 1990',
        track: 'Laguna Seca',
        gameType: 'Circuit Race',
        timeOfDay: 'Afternoon',
        weather: 'Clear',
        laps: 3,
        drivatars: 3,
        notes: 'Official Module 2 Graduation Exam with light field traffic.'
      }
    }
  },

  {
    id: 'mod-3',
    driverLevel: 'Beginner',
    moduleNumber: 3,
    title: 'Basic Braking & Throttle Control',
    tagline: 'Straight-Line Threshold Deceleration, Rise Time, and Throttle Unwind',
    bookChapter: 'Chapter 4: Braking & Throttle Mechanics',
    iconName: 'Zap',
    description: 'Learn high-rate brake rise time without inducing wheel lockups, establish linear throttle unwind synchronized with steering return, and maintain powertrain smoothness through clean gear shifts.',
    sessions: [
      {
        id: 's-3-1',
        moduleId: 'mod-3',
        sessionNumber: 1,
        title: 'Initial Brake Rise-Time & Straight-Line Threshold Hit',
        subtitle: 'Reaching maximum stopping force instantly in a straight line',
        bookReference: 'Going Faster Chapter 4, pp. 86-98',
        theorySummary: [
          'Fast drivers reach peak brake pressure in milliseconds, while novices squeeze gently and waste stopping distance.',
          'In straight-line braking, front tires have 100% grip dedicated to deceleration.',
          'Reach threshold rapidly, then modulate at the limit to prevent lockup flat-spots.'
        ],
        keyPrinciples: [
          { title: 'Bite Fast, Not Hard', explanation: 'Reach 90-95% threshold in under 150 milliseconds.' },
          { title: 'Zero Lockup Discipline', explanation: 'Modulate pressure right at the threshold limit without triggering severe slip.' }
        ],
        drillGoal: 'Achieve brake application rise-time under 140ms with zero wheel lockups.',
        targetMetrics: [
          { label: 'Initial Hit Rise Time', value: '< 140ms', hint: 'Rapid transition to peak brake pressure' },
          { label: 'Lockup Avoidance', value: '100% Clean', hint: 'Zero wheel slide spikes over 20% slip' }
        ],
        challenge: {
          id: 'ch-beg-3-1',
          name: 'Straight-Line Threshold Braking Challenge',
          description: 'Achieve an average brake rise-time of ≤ 140ms across 2 consecutive laps.',
          metric: 'braking_rise_time_ms',
          operator: 'lte',
          targetValue: 140,
          unit: 'ms',
          requiredLaps: 2,
          medals: { bronze: 170, silver: 140, gold: 110 }
        },
        recommendedSetup: {
          car: 'Mazda Formula Mazda 2015',
          altCar: 'Subaru BRZ 2022',
          track: 'Mid-Ohio Short',
          gameType: 'Circuit Race',
          timeOfDay: 'Morning',
          weather: 'Clear',
          laps: 5,
          drivatars: 0,
          notes: 'Slam into the brakes firmly in a dead-straight line at the end of the back straight into the Keyhole.'
        }
      },
      {
        id: 's-3-2',
        moduleId: 'mod-3',
        sessionNumber: 2,
        title: 'Throttle Unwind Synchronization (Steering Angle vs Throttle)',
        subtitle: 'Linear power application matched to steering wheel return',
        bookReference: 'Going Faster Chapter 4, pp. 99-112',
        theorySummary: [
          'As steering lock is removed on corner exit, available grip for acceleration increases proportionately.',
          'Applying full throttle with lingering steering lock results in immediate snap oversteer (RWD) or power understeer (FWD).',
          'Once throttle application begins, avoid hesitation, pumping, or lifting.'
        ],
        keyPrinciples: [
          { title: 'Unwind = Accelerate', explanation: 'Linear 1-to-1 relationship between steering return and throttle depression.' },
          { title: 'Zero Hesitation Commitment', explanation: 'Once throttle begins, feed it progressively to 100% without lifting.' }
        ],
        drillGoal: 'Maintain a linear inverse relationship between steering angle decrease and throttle pedal increase.',
        targetMetrics: [
          { label: 'Throttle Unwind Linearity', value: '≥ 80/100', hint: 'Smooth inverse relationship between steer & throttle' },
          { label: 'Full Throttle Commitment', value: '100% before curb', hint: 'Zero hesitation or throttle lift' }
        ],
        challenge: {
          id: 'ch-beg-3-2',
          name: 'Throttle Unwind Linearity Challenge',
          description: 'Achieve a throttle unwind linearity score of ≥ 80/100 across 2 consecutive laps.',
          metric: 'throttle_unwind_score',
          operator: 'gte',
          targetValue: 80,
          unit: '/100',
          requiredLaps: 2,
          medals: { bronze: 70, silver: 80, gold: 90 }
        },
        recommendedSetup: {
          car: 'Mazda Formula Mazda 2015',
          altCar: 'Toyota GR86 2022',
          track: 'Mid-Ohio Short',
          gameType: 'Circuit Race',
          timeOfDay: 'Late Morning',
          weather: 'Mostly Clear',
          laps: 6,
          drivatars: 0,
          notes: 'Feed in power out of the Carousel precisely as your hands unwind back toward center.'
        }
      },
      {
        id: 's-3-3',
        moduleId: 'mod-3',
        sessionNumber: 3,
        title: 'Smooth Shifting, Engine Braking & RPM Management',
        subtitle: 'Preserving chassis stability through clean gear selection',
        bookReference: 'Going Faster Chapter 10, pp. 210-225',
        theorySummary: [
          'Abrupt downshifting without rev-matching causes the drive wheels to momentarily lock (compression lockup), inducing destabilizing yaw.',
          'Upshifting at the engine optimal power peak preserves acceleration torque without bouncing off the limiter.'
        ],
        keyPrinciples: [
          { title: 'Braking in Gear', explanation: 'Execute all downshifts in a straight line before turning the wheel.' },
          { title: 'Smooth Drivetrain Engagement', explanation: 'Match revs cleanly to prevent rear axle hop.' }
        ],
        drillGoal: 'Complete 5 laps with zero engine rev-limiter bounces and zero downshift-induced rear slip spikes.',
        targetMetrics: [
          { label: 'Steering Smoothness', value: '≥ 80/100', hint: 'Stable chassis heading through downshift zones' },
          { label: 'Drivetrain Stability', value: '0 Compression Lockups', hint: 'Smooth clutch/gear engagement' }
        ],
        challenge: {
          id: 'ch-beg-3-3',
          name: 'Powertrain & Stability Challenge',
          description: 'Achieve a stability and smoothness score of ≥ 80/100 across 2 consecutive laps.',
          metric: 'steering_smoothness_score',
          operator: 'gte',
          targetValue: 80,
          unit: '/100',
          requiredLaps: 2,
          medals: { bronze: 70, silver: 80, gold: 90 }
        },
        recommendedSetup: {
          car: 'Mazda Formula Mazda 2015',
          altCar: 'Mazda MX-5 2016',
          track: 'Mid-Ohio Short',
          gameType: 'Circuit Race',
          timeOfDay: 'Noon',
          weather: 'Partly Cloudy',
          laps: 5,
          drivatars: 0,
          notes: 'Complete your downshift to 2nd gear before turn-in at Turn 1.'
        }
      }
    ],
    graduationTest: {
      id: 'gt-3',
      moduleId: 'mod-3',
      title: 'Module 3 Graduation: Threshold Braking & Throttle Certification',
      examOverview: 'A comprehensive 3-lap exam evaluating rapid brake threshold hit rate, clean unwinding throttle linearity, and vehicle stability under deceleration.',
      trackName: 'Mid-Ohio Short',
      carName: 'Mazda Formula Mazda 2015',
      altCarName: 'Subaru BRZ 2022',
      requiredLaps: 3,
      passingScorePct: 80,
      requirements: [
        { title: 'Initial Hit Rise Time', description: 'Average rise time under 140ms', metric: 'Rise Time', targetText: '< 140ms', minScorePct: 80 },
        { title: 'Throttle Unwind Linearity', description: 'Unwind linearity score of at least 80/100', metric: 'Unwind Score', targetText: '≥ 80/100', minScorePct: 80 },
        { title: 'Zero Lockup Penalty', description: 'No tire flat-spotting or lockup spikes > 20% slip', metric: 'Lockup Avoidance', targetText: '100% Clean', minScorePct: 90 }
      ],
      recommendedSetup: {
        car: 'Mazda Formula Mazda 2015',
        altCar: 'Subaru BRZ 2022',
        track: 'Mid-Ohio Short',
        gameType: 'Circuit Race',
        timeOfDay: 'Afternoon',
        weather: 'Clear',
        laps: 3,
        drivatars: 4,
        notes: 'Official Module 3 Graduation Exam with light field traffic.'
      }
    }
  },

  {
    id: 'mod-4',
    driverLevel: 'Beginner',
    moduleNumber: 4,
    title: 'The Friction Circle & Weight Transfer Fundamentals',
    tagline: 'Mastering the 100% Traction Budget, Pitch/Roll Dynamics, and Input Blending',
    bookChapter: 'Chapter 3: The Traction Budget',
    iconName: 'Activity',
    description: 'Understand tire adhesion as a 100% finite friction budget. Master longitudinal and lateral weight transfer and smoothly blend braking release with initial steering input to unlock your Beginner License.',
    sessions: [
      {
        id: 's-4-1',
        moduleId: 'mod-4',
        sessionNumber: 1,
        title: 'The 100% Traction Budget Concept',
        subtitle: 'Understanding the finite limits of tire contact patch adhesion',
        bookReference: 'Going Faster Chapter 3, pp. 62-74',
        theorySummary: [
          'Under pure straight-line braking, 100% of the friction circle is dedicated to longitudinal deceleration.',
          'In steady-state cornering at the apex, 100% of tire grip is lateral.',
          'Demanding 70% braking + 50% steering exceeds 100% of tire adhesion and induces understeer.'
        ],
        keyPrinciples: [
          { title: 'Budget Allocation', explanation: 'You cannot exceed 100% total grip without breaking traction.' },
          { title: 'No Grip Vacuums', explanation: 'Keep the telemetry G-G circle populated near the perimeter rather than collapsing to 0G.' }
        ],
        drillGoal: 'Maintain average combined G-force utilization above 75% through all transition phases.',
        targetMetrics: [
          { label: 'Traction Budget Utilization', value: '≥ 75%', hint: 'Continuous utilization of tire friction budget' },
          { label: 'Combined G Retention', value: '≥ 0.80G', hint: 'Avoid drops into the friction circle dead zone' }
        ],
        challenge: {
          id: 'ch-beg-4-1',
          name: 'Traction Budget Utilization Challenge',
          description: 'Maintain an average combined traction budget of ≥ 75% across 2 consecutive laps.',
          metric: 'traction_budget_pct',
          operator: 'gte',
          targetValue: 75,
          unit: '%',
          requiredLaps: 2,
          medals: { bronze: 70, silver: 78, gold: 85 }
        },
        recommendedSetup: {
          car: 'Mazda Formula Mazda 2015',
          altCar: 'Subaru BRZ 2022',
          track: 'Grand Oak Club',
          gameType: 'Circuit Race',
          timeOfDay: 'Morning',
          weather: 'Clear',
          laps: 6,
          drivatars: 0,
          notes: 'Watch your APEX live friction circle; avoid dropping into the center dead zone.'
        }
      },
      {
        id: 's-4-2',
        moduleId: 'mod-4',
        sessionNumber: 2,
        title: 'Pitch and Roll: Longitudinal vs Lateral Weight Transfer',
        subtitle: 'Managing chassis load distribution to control tire grip',
        bookReference: 'Going Faster Chapter 3, pp. 75-88',
        theorySummary: [
          'Braking pitches weight onto front tires (increasing front grip, lightening the rear).',
          'Acceleration transfers weight rearward (increasing rear traction, lightening the steering).',
          'Smooth pedal releases manage the rate of weight transfer, preventing chassis snap.'
        ],
        keyPrinciples: [
          { title: 'Loading the Front Tires', explanation: 'Turn in while the nose is loaded for crisp turn-in response.' },
          { title: 'Smooth Weight Settling', explanation: 'Slowly release the brake so the nose does not violently rebound.' }
        ],
        drillGoal: 'Eliminate abrupt chassis pitch/roll spikes by graduating brake release smoothly into turn-in.',
        targetMetrics: [
          { label: 'Steering Smoothness', value: '≥ 80/100', hint: 'Smooth chassis roll transition' },
          { label: 'Zero Snap Oversteer', value: '100% Controlled', hint: 'Stable rear axle load retention' }
        ],
        challenge: {
          id: 'ch-beg-4-2',
          name: 'Weight Transfer Smoothness Challenge',
          description: 'Achieve a steering and chassis smoothness score of ≥ 80/100 across 2 consecutive laps.',
          metric: 'steering_smoothness_score',
          operator: 'gte',
          targetValue: 80,
          unit: '/100',
          requiredLaps: 2,
          medals: { bronze: 70, silver: 80, gold: 90 }
        },
        recommendedSetup: {
          car: 'Subaru BRZ 2022',
          altCar: 'Honda S2000 CR 2009',
          track: 'Grand Oak Club',
          gameType: 'Circuit Race',
          timeOfDay: 'Late Morning',
          weather: 'Partly Cloudy',
          laps: 6,
          drivatars: 0,
          notes: 'Feel the front tires bite as you trail the last 10% of brake pressure past turn-in.'
        }
      },
      {
        id: 's-4-3',
        moduleId: 'mod-4',
        sessionNumber: 3,
        title: 'Basic Input Blending on Corner Entry',
        subtitle: 'Transitioning around the perimeter of the G-G friction circle',
        bookReference: 'Going Faster Chapter 3, pp. 89-105',
        theorySummary: [
          'As steering angle increases from 0° toward apex lock, brake pressure must linearly decay from 100% toward 0%.',
          'The transition trace on the G-G diagram should create a smooth, rounded arc along the perimeter.',
          'Never leave a dead zone between brake release and steering application.'
        ],
        keyPrinciples: [
          { title: 'Give and Take', explanation: 'If you add 20% steering, you must surrender 20% brake pressure.' },
          { title: 'Continuous Envelope Riding', explanation: 'Keep the tire right at its optimal slip angle without breaking traction.' }
        ],
        drillGoal: 'Execute continuous circular G-G transition arcs on all corner entries.',
        targetMetrics: [
          { label: 'Transition Grip Retention', value: '≥ 80%', hint: 'Minimum combined G during turn-in' },
          { label: 'G-G Arc Smoothness', value: '≥ 82/100', hint: 'Continuous circular trace' }
        ],
        challenge: {
          id: 'ch-beg-4-3',
          name: 'Friction Circle Arc Challenge',
          description: 'Maintain an average combined traction budget of ≥ 80% throughout all corner transitions across 2 consecutive laps.',
          metric: 'traction_budget_pct',
          operator: 'gte',
          targetValue: 80,
          unit: '%',
          requiredLaps: 2,
          medals: { bronze: 70, silver: 80, gold: 88 }
        },
        recommendedSetup: {
          car: 'Mazda Formula Mazda 2015',
          altCar: 'Subaru BRZ 2022',
          track: 'Silverstone National',
          gameType: 'Circuit Race',
          timeOfDay: 'Noon',
          weather: 'Mostly Clear',
          laps: 6,
          drivatars: 0,
          notes: 'Practice blending off brakes while turning into Brooklands and Luffield.'
        }
      }
    ],
    graduationTest: {
      id: 'gt-4',
      moduleId: 'mod-4',
      title: 'Module 4 Graduation: Beginner License Master Certification',
      examOverview: 'The comprehensive 5-lap Beginner Level Master Exam certifying that the driver has mastered vision, late apex geometry, threshold braking, and the friction circle traction budget.',
      trackName: 'Silverstone National',
      carName: 'Mazda Formula Mazda 2015',
      altCarName: 'Subaru BRZ 2022',
      requiredLaps: 5,
      passingScorePct: 80,
      requirements: [
        { title: 'Friction Circle Budget', description: 'Average combined traction budget of at least 80%', metric: 'Traction Budget', targetText: '≥ 80%', minScorePct: 80 },
        { title: 'Pace & Consistency', description: 'Lap delta variance under 0.35s across all 5 laps', metric: 'Consistency', targetText: '≤ 0.35s', minScorePct: 80 },
        { title: 'Clean Execution in Field', description: '5 clean laps with zero off-tracks or spins', metric: 'Clean Laps', targetText: '5/5 Laps', minScorePct: 100 }
      ],
      recommendedSetup: {
        car: 'Mazda Formula Mazda 2015',
        altCar: 'Subaru BRZ 2022',
        track: 'Silverstone National',
        gameType: 'Circuit Race',
        timeOfDay: 'Afternoon',
        weather: 'Clear',
        laps: 5,
        drivatars: 4,
        notes: 'Master Certification Exam. Passing unlocks the Novice Driver Level.'
      }
    }
  },

  // ==========================================
  // DRIVER LEVEL: NOVICE (MODULES 5 - 7)
  // ==========================================
  {
    id: 'mod-5',
    driverLevel: 'Novice',
    moduleNumber: 5,
    title: 'Trail-Braking & Corner Entry Rotation',
    tagline: 'Carrying Deceleration into the Apex to Yaw the Car',
    bookChapter: 'Chapter 5: Trail Braking',
    iconName: 'GitBranch',
    description: 'Learn how to bleed off the last 20% of brake pressure past the turn-in point all the way to the apex, transferring load to the front tires to generate progressive entry yaw.',
    sessions: [
      {
        id: 's-5-1',
        moduleId: 'mod-5',
        sessionNumber: 1,
        title: 'The Trail-Braking Taper: Linear Decay Rate',
        subtitle: 'Mastering the decaying ramp of brake pressure past turn-in',
        bookReference: 'Going Faster Chapter 5, pp. 115-128',
        theorySummary: [
          'Straight-line braking stops the car; trail-braking turns the car.',
          'Releasing the brake abruptly causes front-end lift and immediate entry understeer.',
          'A linear decay from 80% down to 5% pressure right at the apex keeps the front tires loaded.'
        ],
        keyPrinciples: [
          { title: 'Brake-to-Apex Connection', explanation: 'Brake pressure should reach zero precisely at the geometric/late apex.' },
          { title: 'Front Load Retention', explanation: 'Keep the front suspension compressed to maintain maximum turn-in bite.' }
        ],
        drillGoal: 'Maintain progressive brake taper through the first 40 meters of corner entry.',
        targetMetrics: [
          { label: 'Trail Braking Score', value: '≥ 85/100', hint: 'Smooth continuous decay trace' },
          { label: 'Release Point Precision', value: '±2m from Apex', hint: 'Zero pressure right at clipping point' }
        ],
        challenge: {
          id: 'ch-5-1',
          name: 'Trail-Braking Taper Challenge',
          description: 'Achieve a trail-braking score of ≥ 82/100 across 2 consecutive laps.',
          metric: 'trail_braking_score',
          operator: 'gte',
          targetValue: 82,
          unit: '/100',
          requiredLaps: 2,
          medals: { bronze: 70, silver: 82, gold: 92 }
        },
        recommendedSetup: {
          car: 'BMW M3 2005',
          altCar: 'Porsche 718 Cayman GTS 2018',
          track: 'Mid-Ohio',
          gameType: 'Circuit Race',
          timeOfDay: 'Morning',
          weather: 'Clear',
          laps: 6,
          drivatars: 0,
          notes: 'Practice trailing into Turn 1 and the Keyhole.'
        }
      }
    ],
    graduationTest: {
      id: 'gt-5',
      moduleId: 'mod-5',
      title: 'Module 5 Graduation: Trail-Braking Mastery Exam',
      examOverview: 'A 3-lap evaluation testing entry yaw control and trail-braking decay smoothness.',
      trackName: 'Mid-Ohio',
      carName: 'BMW M3 2005',
      altCarName: 'Porsche 718 Cayman GTS 2018',
      requiredLaps: 3,
      passingScorePct: 82,
      requirements: [
        { title: 'Trail Score', description: 'Average trail braking score ≥ 82/100', metric: 'Trail Score', targetText: '≥ 82/100', minScorePct: 82 },
        { title: 'Clean Laps', description: '3 clean consecutive laps', metric: 'Clean Laps', targetText: '3/3 Laps', minScorePct: 100 }
      ],
      recommendedSetup: {
        car: 'BMW M3 2005',
        altCar: 'Porsche 718 Cayman GTS 2018',
        track: 'Mid-Ohio',
        gameType: 'Circuit Race',
        timeOfDay: 'Afternoon',
        weather: 'Clear',
        laps: 3,
        drivatars: 3
      }
    }
  },

  // ==========================================
  // DRIVER LEVEL: INTERMEDIATE (MODULES 8 - 10)
  // ==========================================
  {
    id: 'mod-8',
    driverLevel: 'Intermediate',
    moduleNumber: 8,
    title: 'Tire Slip Angles & Peak Grip Envelopes',
    tagline: 'Riding the 6°-10° Slip Angle Plateau for Maximum Cornering Speed',
    bookChapter: 'Chapter 6: Tire Dynamics & Slip Angles',
    iconName: 'Compass',
    description: 'Understand tire mechanics at the molecular slip level. Learn why tires must slip to generate cornering force, and how to hold the tire at its peak friction peak without exceeding it into scrub.',
    sessions: [
      {
        id: 's-8-1',
        moduleId: 'mod-8',
        sessionNumber: 1,
        title: 'The Tire Slip Angle Curve: Peak vs Slide',
        subtitle: 'Understanding why peak lateral force requires controlled tire slip',
        bookReference: 'Going Faster Chapter 6, pp. 142-158',
        theorySummary: [
          'A tire travelling in a straight line has 0° slip angle.',
          'Maximum lateral grip occurs between 6° and 10° slip angle for racing slicks.',
          'Exceeding 12° slip angle results in thermal degradation and dramatic loss of grip.'
        ],
        keyPrinciples: [
          { title: 'Feel the Plateau', explanation: 'Listen for tire scrub and feel steering wheel weight at peak slip.' },
          { title: 'Do Not Oversteer into Scrub', explanation: 'Excessive steering wheel angle overheats tires and scrubs velocity.' }
        ],
        drillGoal: 'Keep tires in the 6°-10° optimal slip window throughout high-speed sweepers.',
        targetMetrics: [
          { label: 'Slip Window Retention', value: '≥ 85%', hint: '% of cornering duration in peak grip window' }
        ],
        challenge: {
          id: 'ch-8-1',
          name: 'Peak Slip Angle Plateau Challenge',
          description: 'Maintain optimal slip angle retention of ≥ 82% across 2 consecutive laps.',
          metric: 'slip_angle_window',
          operator: 'gte',
          targetValue: 82,
          unit: '%',
          requiredLaps: 2,
          medals: { bronze: 70, silver: 82, gold: 92 }
        },
        recommendedSetup: {
          car: 'Porsche 911 GT3 2021',
          altCar: 'Chevrolet Corvette Z06 2023',
          track: 'Road America',
          gameType: 'Circuit Race',
          timeOfDay: 'Morning',
          weather: 'Clear',
          laps: 6,
          drivatars: 0
        }
      }
    ],
    graduationTest: {
      id: 'gt-8',
      moduleId: 'mod-8',
      title: 'Module 8 Graduation: Tire Slip Dynamics Exam',
      examOverview: 'A 3-lap examination verifying tire slip angle management and cornering envelope mastery.',
      trackName: 'Road America',
      carName: 'Porsche 911 GT3 2021',
      altCarName: 'Chevrolet Corvette Z06 2023',
      requiredLaps: 3,
      passingScorePct: 84,
      requirements: [
        { title: 'Slip Angle Retention', description: 'Hold peak slip envelope', metric: 'Slip Window', targetText: '≥ 82%', minScorePct: 82 },
        { title: 'Clean Laps', description: '3 clean laps', metric: 'Clean Laps', targetText: '3/3 Laps', minScorePct: 100 }
      ],
      recommendedSetup: {
        car: 'Porsche 911 GT3 2021',
        altCar: 'Chevrolet Corvette Z06 2023',
        track: 'Road America',
        gameType: 'Circuit Race',
        timeOfDay: 'Afternoon',
        weather: 'Clear',
        laps: 3,
        drivatars: 4
      }
    }
  },

  // ==========================================
  // DRIVER LEVEL: ADVANCED (MODULES 11 - 12)
  // ==========================================
  {
    id: 'mod-11',
    driverLevel: 'Advanced',
    moduleNumber: 11,
    title: 'Aerodynamics, Downforce & High-Speed Corners',
    tagline: 'Speed-Dependent Grip ($V^2$ Physics) and Aero Trust',
    bookChapter: 'Chapter 9: Aerodynamics & Downforce',
    iconName: 'Wind',
    description: 'Learn how aerodynamic downforce scales with the square of velocity ($F_{down} \\propto V^2$). Overcome human survival instincts by committing to full throttle in high-speed turns where grip exists only at high speed.',
    sessions: [
      {
        id: 's-11-1',
        moduleId: 'mod-11',
        sessionNumber: 1,
        title: 'Speed-Dependent Grip ($V^2$ Physics)',
        subtitle: 'Trusting downforce in corners where slowing down induces oversteer',
        bookReference: 'Going Faster Chapter 9, pp. 195-208',
        theorySummary: [
          'Aerodynamic grip increases with the square of speed ($V^2$). At 200 km/h, downforce is 4x greater than at 100 km/h.',
          'Lifting in high-speed corners removes downforce and induces catastrophic snap oversteer.'
        ],
        keyPrinciples: [
          { title: 'Aero Trust', explanation: 'Commit 100% throttle; do not lift mid-corner.' },
          { title: 'Single Steering Set', explanation: 'Make one decisive steering input; avoid micro-corrections.' }
        ],
        drillGoal: 'Take high-speed sweepers flat-out with zero throttle hesitation.',
        targetMetrics: [
          { label: 'Aero Commitment', value: '100% Throttle', hint: 'Zero lift through high-speed sectors' }
        ],
        challenge: {
          id: 'ch-11-1',
          name: 'High-Speed Aero Trust Challenge',
          description: 'Achieve a throttle commitment score of ≥ 90/100 across 2 consecutive laps.',
          metric: 'overall_lap_score',
          operator: 'gte',
          targetValue: 90,
          unit: '%',
          requiredLaps: 2,
          medals: { bronze: 75, silver: 85, gold: 95 }
        },
        recommendedSetup: {
          car: 'Porsche 911 GT3 R #73 Park Place Motorsport 2018 – RDCP',
          altCar: 'BMW M8 GTE #1 BMW M Motorsport 2018',
          track: 'Silverstone GP',
          gameType: 'Circuit Race',
          timeOfDay: 'Afternoon',
          weather: 'Clear',
          laps: 6,
          drivatars: 0
        }
      }
    ],
    graduationTest: {
      id: 'gt-11',
      moduleId: 'mod-11',
      title: 'Module 11 Graduation: High-Speed Aero Mastery Exam',
      examOverview: 'A 3-lap test of high-speed aerodynamic commitment and single-input steering discipline.',
      trackName: 'Silverstone GP',
      carName: 'Porsche 911 GT3 R #73 Park Place Motorsport 2018 – RDCP',
      altCarName: 'BMW M8 GTE #1 BMW M Motorsport 2018',
      requiredLaps: 3,
      passingScorePct: 85,
      requirements: [
        { title: 'Aero Commitment', description: 'Zero throttle lifts in high speed sectors', metric: 'Throttle', targetText: '100%', minScorePct: 90 },
        { title: 'Clean Laps', description: '3 clean laps', metric: 'Clean Laps', targetText: '3/3 Laps', minScorePct: 100 }
      ],
      recommendedSetup: {
        car: 'Porsche 911 GT3 R #73 Park Place Motorsport 2018 – RDCP',
        altCar: 'BMW M8 GTE #1 BMW M Motorsport 2018',
        track: 'Silverstone GP',
        gameType: 'Circuit Race',
        timeOfDay: 'Sunset',
        weather: 'Clear',
        laps: 3,
        drivatars: 4
      }
    }
  },

  // ==========================================
  // DRIVER LEVEL: EXPERT (MODULES 13 - 15)
  // ==========================================
  {
    id: 'mod-13',
    driverLevel: 'Expert',
    moduleNumber: 13,
    title: 'Consistency, Mental Focus & Wet Weather Mastery',
    tagline: '5-Lap Delta Variance Minimization and Low-Grip Line Adaptation',
    bookChapter: 'Chapters 8 & 11: Rain Driving & Mental Focus',
    iconName: 'CloudRain',
    description: 'Learn the wet racing line (rim-shotting around the polished rubber), manage aquaplaning hydrodynamics, and minimize stint lap delta variance to within 0.15s per lap.',
    sessions: [
      {
        id: 's-13-1',
        moduleId: 'mod-13',
        sessionNumber: 1,
        title: 'The Wet Racing Line & Rim-Shot Technique',
        subtitle: 'Avoiding the slippery rubbered line in low-grip conditions',
        bookReference: 'Going Faster Chapter 8, pp. 175-190',
        theorySummary: [
          'In the wet, the traditional dry rubbered groove becomes as slick as ice.',
          'Driving off-line (the "Rim-Shot" line) on rough, unrubbered asphalt provides significantly more grip.',
          'Threshold braking distances increase by 40-70%; initial rise time must be gentler.'
        ],
        keyPrinciples: [
          { title: 'Cross the Rubber Quick', explanation: 'Only cross the dry racing line at 90° angles; never turn on it.' },
          { title: 'Search for Grip', explanation: 'Constantly explore alternative lines and camber changes for traction.' }
        ],
        drillGoal: 'Complete 5 laps in heavy rain keeping average traction budget above 75% without spinning.',
        targetMetrics: [
          { label: 'Wet Grip Retention', value: '≥ 75%', hint: 'Traction budget utilization in low-friction conditions' }
        ],
        challenge: {
          id: 'ch-13-1',
          name: 'Wet Weather Rim-Shot Challenge',
          description: 'Achieve a traction budget score of ≥ 75% in wet conditions across 2 consecutive laps.',
          metric: 'traction_budget_pct',
          operator: 'gte',
          targetValue: 75,
          unit: '%',
          requiredLaps: 2,
          medals: { bronze: 70, silver: 80, gold: 90 }
        },
        recommendedSetup: {
          car: 'Porsche 911 RSR #92 Porsche GT Team 2017',
          altCar: 'Ferrari 488 Challenge #25 Corse Clienti 2017',
          track: 'Circuit de Spa-Francorchamps',
          gameType: 'Circuit Race',
          timeOfDay: 'Afternoon',
          weather: 'Moderate Rain',
          laps: 6,
          drivatars: 0
        }
      }
    ],
    graduationTest: {
      id: 'gt-13',
      moduleId: 'mod-13',
      title: 'Module 13 Graduation: Expert Pro License Master Exam',
      examOverview: 'The ultimate 5-lap pro evaluation testing wet weather adaptation, traffic navigation, and sub-0.20s lap consistency.',
      trackName: 'Circuit de Spa-Francorchamps',
      carName: 'Porsche 911 RSR #92 Porsche GT Team 2017',
      altCarName: 'Ferrari 488 Challenge #25 Corse Clienti 2017',
      requiredLaps: 5,
      passingScorePct: 85,
      requirements: [
        { title: 'Stint Variance', description: 'Lap delta variance ≤ 0.20s across 5 laps', metric: 'Consistency', targetText: '≤ 0.20s', minScorePct: 85 },
        { title: 'Clean Execution', description: '5/5 clean laps in rain traffic', metric: 'Clean Laps', targetText: '5/5 Laps', minScorePct: 100 }
      ],
      recommendedSetup: {
        car: 'Porsche 911 RSR #92 Porsche GT Team 2017',
        altCar: 'Ferrari 488 Challenge #25 Corse Clienti 2017',
        track: 'Circuit de Spa-Francorchamps',
        gameType: 'Circuit Race',
        timeOfDay: 'Sunset',
        weather: 'Moderate Rain',
        laps: 5,
        drivatars: 5,
        notes: 'Final Grand Master Certification Exam.'
      }
    }
  }
];

export const DRIVER_LEVELS = [
  { id: 'Beginner', name: 'Beginner', description: 'Foundations of Vision, Apex Geometry, Threshold Braking & Friction Circle', minLevelIndex: 0 },
  { id: 'Novice', name: 'Novice', description: 'Trail-Braking, Corner Entry Yaw & Dynamic Weight Transfer Control', minLevelIndex: 1 },
  { id: 'Intermediate', name: 'Intermediate', description: 'Tire Slip Angle Envelopes, Vehicle Balance & Limit-Handling', minLevelIndex: 2 },
  { id: 'Advanced', name: 'Advanced', description: 'Aerodynamic Downforce, Powertrain Dynamics & Complex Chicanes', minLevelIndex: 3 },
  { id: 'Expert', name: 'Expert', description: 'Wet Weather Dynamics, Stint Variance Minimization & Pro Racecraft', minLevelIndex: 4 }
] as const;
