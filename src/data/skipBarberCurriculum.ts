import { Module } from '../types/curriculum';

export const SKIP_BARBER_MODULES: Module[] = [
  {
    id: 'mod-1',
    moduleNumber: 1,
    title: 'The Racing Line & Types of Corners',
    tagline: 'Geometric vs Early vs Late Apexes and Exit Prioritization',
    bookChapter: 'Chapter 2: The Racing Line',
    iconName: 'Route',
    description: 'Master the fundamental geometry of cornering. Learn why a late apex maximizes corner exit speed on straightaway lead-ins, how to identify sacrifice turns, and how to execute precise positioning.',
    sessions: [
      {
        id: 's-1-1',
        moduleId: 'mod-1',
        sessionNumber: 1,
        title: 'Geometric vs Late Apex Identification',
        subtitle: 'Understanding radius, clipping points, and corner classification',
        bookReference: 'Going Faster Chapter 2, pp. 24-38',
        theorySummary: [
          'A corner leading onto a straight is an "Exit Priority" corner requiring a Late Apex.',
          'Early apexes lead to running out of road on exit or having to back off throttle.',
          'Geometric apex gives minimum speed scrub but compromises exit acceleration.'
        ],
        keyPrinciples: [
          { title: 'The Straight Follows the Turn', explanation: 'Exit speed is carried down the entire length of the ensuing straight.' },
          { title: 'Late Apex Geometry', explanation: 'Turn in slightly later and sharper to straighten the car earlier for maximum throttle.' }
        ],
        drillGoal: 'Hit within ±1.5m of the designated late apex clipping point across all sector turns.',
        targetMetrics: [
          { label: 'Apex Accuracy', value: '≥ 90%', hint: 'Clipping point within 1.5m tolerance' },
          { label: 'Exit Throttle Point', value: 'Before Apex + 10m', hint: 'Car positioned to accelerate early' }
        ],
        challenge: {
          id: 'ch-1-1',
          name: 'Late Apex Precision Challenge',
          description: 'Achieve an apex clipping accuracy score of ≥ 85% on 2 consecutive laps.',
          metric: 'overall_lap_score',
          operator: 'gte',
          targetValue: 85,
          unit: '%',
          requiredLaps: 2
        }
      },
      {
        id: 's-1-2',
        moduleId: 'mod-1',
        sessionNumber: 2,
        title: 'Corner Exit Maximization',
        subtitle: 'Unwinding steering lock to unleash wide-open throttle',
        bookReference: 'Going Faster Chapter 2, pp. 39-49',
        theorySummary: [
          'You cannot have full throttle and maximum steering lock at the same time.',
          'Unwinding the steering wheel as the car tracks out allows rapid progression to 100% throttle.'
        ],
        keyPrinciples: [
          { title: 'Unwind = Accelerate', explanation: 'As steering angle decreases, throttle application increases proportionately.' },
          { title: 'Using the Full Width', explanation: 'Let the car drift out to the exit curbing to maximize effective turn radius.' }
        ],
        drillGoal: 'Reach 100% throttle within 15 meters of the apex without running off-track.',
        targetMetrics: [
          { label: 'Throttle Unwind Linearity', value: '≥ 85/100', hint: 'Smooth inverse relationship between steer & throttle' },
          { label: 'Full Throttle Commitment', value: '100% before curb', hint: 'Zero hesitation or throttle lift' }
        ],
        challenge: {
          id: 'ch-1-2',
          name: 'Exit Velocity & Unwind Challenge',
          description: 'Achieve a throttle unwind linearity score of ≥ 82/100 across 2 consecutive laps.',
          metric: 'throttle_unwind_score',
          operator: 'gte',
          targetValue: 82,
          unit: '/100',
          requiredLaps: 2
        }
      },
      {
        id: 's-1-3',
        moduleId: 'mod-1',
        sessionNumber: 3,
        title: 'Compromised Lines & Linked Corners',
        subtitle: 'The art of sacrificing Turn 1 to dominate Turn 2',
        bookReference: 'Going Faster Chapter 2, pp. 50-61',
        theorySummary: [
          'In quick S-curves or double-apexes, optimizing Turn 1 often ruins Turn 2.',
          'Always sacrifice the entrance to the first turn to achieve a perfect late apex and exit on the second turn.'
        ],
        keyPrinciples: [
          { title: 'The Priority Rule', explanation: 'The corner that leads to the longer straight always takes priority.' },
          { title: 'Mid-Complex Positioning', explanation: 'Keep the car tight on Turn 1 exit so you are wide for Turn 2 entry.' }
        ],
        drillGoal: 'Sacrifice Entry 1 speed to gain +5 km/h higher exit speed out of Turn 2.',
        targetMetrics: [
          { label: 'Turn 2 Exit Speed Delta', value: '+5 km/h', hint: 'Measurable exit speed increase' },
          { label: 'Complex Time Delta', value: '-0.30s', hint: 'Overall sector improvement' }
        ],
        challenge: {
          id: 'ch-1-3',
          name: 'Linked Complex Execution Challenge',
          description: 'Attain an overall complex sector grade of ≥ 85/100 with zero off-tracks.',
          metric: 'overall_lap_score',
          operator: 'gte',
          targetValue: 85,
          unit: '%',
          requiredLaps: 2
        }
      }
    ],
    graduationTest: {
      id: 'gt-1',
      moduleId: 'mod-1',
      title: 'Module 1 Graduation: Racing Line Mastery Exam',
      examOverview: 'A comprehensive 3-lap evaluation testing late apex geometry, exit track-out acceleration, and linked corner sacrifices.',
      trackName: 'Watkins Glen Short / Laguna Seca',
      carName: 'Formula Continental / GT3',
      requiredLaps: 3,
      passingScorePct: 82,
      requirements: [
        { title: 'Apex Consistency', description: 'Hit clipping zones on all priority turns', metric: 'Apex Accuracy', targetText: '≥ 85%', minScorePct: 85 },
        { title: 'Throttle Unwind Linearity', description: 'Smooth throttle application synchronized with steering unwind', metric: 'Unwind Score', targetText: '≥ 80/100', minScorePct: 80 },
        { title: 'Clean Lap Execution', description: '3 consecutive clean laps with zero track limit violations', metric: 'Clean Laps', targetText: '3/3 Laps', minScorePct: 100 }
      ]
    }
  },
  {
    id: 'mod-2',
    moduleNumber: 2,
    title: 'The Traction Budget & G-G Diagram',
    tagline: 'Friction Circle Mastery and 100% Combined Grip Utilization',
    bookChapter: 'Chapter 3: The Traction Budget',
    iconName: 'Activity',
    description: 'Understand the tire contact patch as a finite budget of grip (100%). Learn how to blend braking, steering, and accelerating so you continuously ride the outer envelope of the G-G friction circle.',
    sessions: [
      {
        id: 's-2-1',
        moduleId: 'mod-2',
        sessionNumber: 1,
        title: 'Pure Longitudinal vs Pure Lateral Grip',
        subtitle: 'Finding the isolated limits in straight-line braking and steady-state cornering',
        bookReference: 'Going Faster Chapter 3, pp. 62-75',
        theorySummary: [
          'Under pure straight-line braking, 100% of the friction circle is dedicated to longitudinal deceleration.',
          'At the apex with zero throttle/brake, 100% of the friction circle is dedicated to lateral grip.'
        ],
        keyPrinciples: [
          { title: 'The Grip Pie', explanation: 'You cannot use 100% braking and 100% steering simultaneously; they share the same budget.' },
          { title: 'G-G Coordinate System', explanation: 'X-axis = Lateral Gs; Y-axis = Longitudinal Gs.' }
        ],
        drillGoal: 'Reach >1.2G longitudinal braking and >1.3G steady lateral apex cornering.',
        targetMetrics: [
          { label: 'Peak Braking G', value: '≥ 1.25 G', hint: 'Maximum straight-line deceleration' },
          { label: 'Apex Lateral G', value: '≥ 1.30 G', hint: 'Steady-state cornering grip' }
        ],
        challenge: {
          id: 'ch-2-1',
          name: 'Peak G-G Boundary Challenge',
          description: 'Achieve an average peak grip score of ≥ 85% on 2 consecutive laps.',
          metric: 'traction_budget_pct',
          operator: 'gte',
          targetValue: 85,
          unit: '%',
          requiredLaps: 2
        }
      },
      {
        id: 's-2-2',
        moduleId: 'mod-2',
        sessionNumber: 2,
        title: 'Transitioning Around the Friction Circle',
        subtitle: 'Eliminating the dead zone between braking and steering',
        bookReference: 'Going Faster Chapter 3, pp. 76-88',
        theorySummary: [
          'Amateur drivers brake hard, completely release the brake, and then steer (leaving a huge grip deficit in the G-G circle).',
          'Professional drivers bleed off brake pressure in direct proportion to adding steering angle, hugging the friction circle perimeter.'
        ],
        keyPrinciples: [
          { title: 'No Grip Vacuums', explanation: 'Never let combined G fall below 0.85G during the transition from entry to apex.' },
          { title: 'Circular Transition Path', explanation: 'The telemetry G-G trace should trace a smooth perimeter arc.' }
        ],
        drillGoal: 'Maintain combined G > 80% of peak capacity through corner entry transitions.',
        targetMetrics: [
          { label: 'Transition Grip Retention', value: '≥ 80%', hint: 'Minimum combined G during turn-in' },
          { label: 'G-G Arc Smoothness', value: '≥ 85/100', hint: 'Continuous circular trace' }
        ],
        challenge: {
          id: 'ch-2-2',
          name: 'Friction Circle Arc Challenge',
          description: 'Maintain an average combined traction budget of ≥ 82% throughout all corner transitions.',
          metric: 'traction_budget_pct',
          operator: 'gte',
          targetValue: 82,
          unit: '%',
          requiredLaps: 2
        }
      },
      {
        id: 's-2-3',
        moduleId: 'mod-2',
        sessionNumber: 3,
        title: 'Maximizing Grip Utilization',
        subtitle: 'Living at 90%+ traction budget throughout the entire lap',
        bookReference: 'Going Faster Chapter 3, pp. 89-101',
        theorySummary: [
          'Lap time is won by spending the highest possible percentage of time near 100% grip capacity.',
          'Telemetry tracks "Traction Budget Utilization %" across all sectors.'
        ],
        keyPrinciples: [
          { title: 'Continuous Exploitation', explanation: 'If the car is not at 100% braking, 100% cornering, or 100% acceleration, speed is being left on the table.' },
          { title: 'Tire Budget Consciousness', explanation: 'Feel the tires through the steering resistance and chassis yaw.' }
        ],
        drillGoal: 'Achieve an average lap traction budget utilization of ≥ 85%.',
        targetMetrics: [
          { label: 'Lap Grip Utilization', value: '≥ 85%', hint: 'Calculated over all non-straightaway zones' }
        ],
        challenge: {
          id: 'ch-2-3',
          name: '85% Traction Budget Challenge',
          description: 'Achieve ≥ 85% average traction budget utilization across 2 full consecutive laps.',
          metric: 'traction_budget_pct',
          operator: 'gte',
          targetValue: 85,
          unit: '%',
          requiredLaps: 2
        }
      }
    ],
    graduationTest: {
      id: 'gt-2',
      moduleId: 'mod-2',
      title: 'Module 2 Graduation: Traction Budget & G-G Certification',
      examOverview: 'Execute 3 consecutive high-grip laps demonstrating continuous friction circle utilization and smooth corner entry/exit transitions.',
      trackName: 'Road America / Silverstone',
      carName: 'Formula Ford / GT3',
      requiredLaps: 3,
      passingScorePct: 83,
      requirements: [
        { title: 'Average Traction Budget', description: 'Maintain high grip utilization across all corners', metric: 'Traction Budget %', targetText: '≥ 83%', minScorePct: 83 },
        { title: 'Transition G Retention', description: 'Zero grip collapse during brake-to-steer transitions', metric: 'Transition Score', targetText: '≥ 80/100', minScorePct: 80 },
        { title: 'Lap Consistency', description: 'Lap delta variance within ±0.4s', metric: 'Delta Variance', targetText: '< 0.40s', minScorePct: 85 }
      ]
    }
  },
  {
    id: 'mod-3',
    moduleNumber: 3,
    title: 'Braking Mechanics & Threshold Braking',
    tagline: 'Peak Initial Hit, High-Speed Downforce Modulation, and Stopping Consistency',
    bookChapter: 'Chapter 4: Braking',
    iconName: 'AlertOctagon',
    description: 'Learn the difference between stopping a road car and racing threshold braking. Master instant initial rise-time, modulating pedal pressure as aerodynamic downforce bleeds off, and achieving millimeter braking consistency.',
    sessions: [
      {
        id: 's-3-1',
        moduleId: 'mod-3',
        sessionNumber: 1,
        title: 'Initial Brake Rise-Time & Hit Rate',
        subtitle: 'Reaching 100% threshold pressure in under 120 milliseconds',
        bookReference: 'Going Faster Chapter 4, pp. 102-115',
        theorySummary: [
          'Braking is not a gentle squeeze; in a racing car, you hit the pedal with immediate maximum force while the car is travelling fast and has maximum downforce.',
          'Slow pedal application wastes precious stopping distance before deceleration begins.'
        ],
        keyPrinciples: [
          { title: 'Hit Fast, Bleed Slow', explanation: 'Instant rise time to threshold, followed by controlled release.' },
          { title: 'High-Speed Grip', explanation: 'At 200+ km/h, aero load allows extreme braking force without locking wheels.' }
        ],
        drillGoal: 'Achieve brake pedal rise-time from 0% to peak threshold in < 140ms.',
        targetMetrics: [
          { label: 'Brake Rise Time', value: '< 140 ms', hint: 'Milliseconds to reach peak pressure' },
          { label: 'Zero Lockup', value: 'Slip Ratio < 15%', hint: 'Avoid wheel lock spikes' }
        ],
        challenge: {
          id: 'ch-3-1',
          name: 'Sub-140ms Threshold Hit Challenge',
          description: 'Achieve an average brake rise time of < 140ms across all heavy braking zones for 2 laps.',
          metric: 'braking_rise_time_ms',
          operator: 'lte',
          targetValue: 140,
          unit: 'ms',
          requiredLaps: 2
        }
      },
      {
        id: 's-3-2',
        moduleId: 'mod-3',
        sessionNumber: 2,
        title: 'High-Speed vs Low-Speed Modulation',
        subtitle: 'Relieving pressure as downforce bleeds off to prevent lockups',
        bookReference: 'Going Faster Chapter 4, pp. 116-128',
        theorySummary: [
          'As the car slows down, downforce decreases and tire grip drops.',
          'Holding maximum initial brake pressure into slow speed causes sudden front wheel lockup.'
        ],
        keyPrinciples: [
          { title: 'Aero Decay Compensation', explanation: 'Taper off straight-line brake pressure from 100% to 75% as speed falls below 120 km/h.' },
          { title: 'Auditory & FFB Feedback', explanation: 'Listen for tire scrub and feel steering lightening as front wheels approach threshold.' }
        ],
        drillGoal: 'Decelerate from top speed into a 2nd-gear hairpin without a single lockup spike.',
        targetMetrics: [
          { label: 'Brake Modulation Score', value: '≥ 85/100', hint: 'Smooth taper preventing low-speed lockup' }
        ],
        challenge: {
          id: 'ch-3-2',
          name: 'Zero-Lockup Modulation Challenge',
          description: 'Score ≥ 85/100 in brake modulation with zero lockups across 2 laps.',
          metric: 'overall_lap_score',
          operator: 'gte',
          targetValue: 85,
          unit: '/100',
          requiredLaps: 2
        }
      },
      {
        id: 's-3-3',
        moduleId: 'mod-3',
        sessionNumber: 3,
        title: 'Braking Point Precision & Marker Alignment',
        subtitle: 'Eliminating braking point variation across consecutive stints',
        bookReference: 'Going Faster Chapter 4, pp. 129-140',
        theorySummary: [
          'Consistent lap times require braking at the exact same physical meter board every single lap.',
          'Creeping braking points earlier by 10 meters forfeits tenths of a second per corner.'
        ],
        keyPrinciples: [
          { title: 'Visual Reference Markers', explanation: 'Use fixed trackside objects (meter boards, curbs, track marks) rather than intuition.' },
          { title: 'Confidence through Repeatability', explanation: 'Trust the car and your muscle memory.' }
        ],
        drillGoal: 'Hit your initial braking point within ±2 meters over 4 consecutive laps.',
        targetMetrics: [
          { label: 'Braking Point Variance', value: '± 2.0 m', hint: 'Deviation from benchmark' }
        ],
        challenge: {
          id: 'ch-3-3',
          name: 'Braking Marker Consistency Challenge',
          description: 'Maintain braking point variance within ±2.5m for 3 consecutive laps.',
          metric: 'overall_lap_score',
          operator: 'gte',
          targetValue: 85,
          unit: '%',
          requiredLaps: 3
        }
      }
    ],
    graduationTest: {
      id: 'gt-3',
      moduleId: 'mod-3',
      title: 'Module 3 Graduation: Threshold Braking Certification',
      examOverview: 'Demonstrate rapid initial hit rate, aero-compensated modulation, and precision stopping points on a heavy-braking circuit.',
      trackName: 'Monza / Sebring / Road America',
      carName: 'Formula Continental / GT3',
      requiredLaps: 3,
      passingScorePct: 84,
      requirements: [
        { title: 'Initial Hit Rise Time', description: 'Average rise time under 135ms', metric: 'Rise Time', targetText: '< 135ms', minScorePct: 85 },
        { title: 'Zero Lockup Penalty', description: 'No tire flat-spotting or lockup spikes > 20% slip', metric: 'Lockup Avoidance', targetText: '100% Clean', minScorePct: 90 },
        { title: 'Stopping Consistency', description: 'Braking zone distance variation under 3%', metric: 'Consistency', targetText: '≥ 85%', minScorePct: 85 }
      ]
    }
  },
  {
    id: 'mod-4',
    moduleNumber: 4,
    title: 'Trail Braking & Weight Transfer',
    tagline: 'Smooth Brake Release, Pitch Control, and Inducing Corner Rotation',
    bookChapter: 'Chapter 5: Corner Entry & Trail Braking',
    iconName: 'GitCommit',
    description: 'Master the defining skill of professional drivers: carrying brake pressure past the turn-in point directly to the apex. Use forward weight transfer to pin the front tires and pivot the rear of the car.',
    sessions: [
      {
        id: 's-4-1',
        moduleId: 'mod-4',
        sessionNumber: 1,
        title: 'Brake Release Timing & Pitch Management',
        subtitle: 'Avoiding abrupt brake pop-off that unloads the front suspension',
        bookReference: 'Going Faster Chapter 5, pp. 141-155',
        theorySummary: [
          'Abruptly snapping off the brake pedal causes the front suspension to rebound upwards, unloading the front contact patches and causing severe entry understeer.',
          'A smooth, controlled release ramp keeps the nose loaded while steering angle is applied.'
        ],
        keyPrinciples: [
          { title: 'Smooth Release Ramp', explanation: 'The release of the brake pedal should take 0.3 to 0.7 seconds depending on corner speed.' },
          { title: 'Pitch Control', explanation: 'Manage the front-to-rear weight balance via the left foot.' }
        ],
        drillGoal: 'Maintain smooth brake release decay duration > 0.35s on all corner entries.',
        targetMetrics: [
          { label: 'Trail Brake Decay Time', value: '≥ 0.35 s', hint: 'Duration of tapering brake pressure' },
          { label: 'Release Smoothness', value: '≥ 85/100', hint: 'No sudden drops in pressure' }
        ],
        challenge: {
          id: 'ch-4-1',
          name: 'Smooth Release Ramp Challenge',
          description: 'Achieve a trail-braking decay score of ≥ 82/100 across 2 consecutive laps.',
          metric: 'trail_braking_score',
          operator: 'gte',
          targetValue: 82,
          unit: '/100',
          requiredLaps: 2
        }
      },
      {
        id: 's-4-2',
        moduleId: 'mod-4',
        sessionNumber: 2,
        title: 'Trail-Braking for Corner Rotation',
        subtitle: 'Carrying 10-20% trailing pressure directly into the apex clipping point',
        bookReference: 'Going Faster Chapter 5, pp. 156-170',
        theorySummary: [
          'Holding light brake pressure (10-20%) while turning rotates the car around its vertical yaw axis.',
          'This allows you to point the nose at the exit earlier and get back to full throttle sooner.'
        ],
        keyPrinciples: [
          { title: 'Rotation at Apex', explanation: 'Trail braking finishes rotating the car before throttle application begins.' },
          { title: 'Steering & Brake Blend', explanation: 'Maximum steering angle coincides with minimum trailing brake pressure.' }
        ],
        drillGoal: 'Carry light trailing brake pressure all the way to within 5m of apex.',
        targetMetrics: [
          { label: 'Apex Rotation Score', value: '≥ 85/100', hint: 'Car yaw aligned before throttle pickup' },
          { label: 'Trail-to-Apex Coverage', value: '≥ 80%', hint: 'Pressure maintained into apex entry' }
        ],
        challenge: {
          id: 'ch-4-2',
          name: 'Apex Trail-Rotation Challenge',
          description: 'Achieve an apex trail-braking score of ≥ 85/100 on 2 consecutive laps.',
          metric: 'trail_braking_score',
          operator: 'gte',
          targetValue: 85,
          unit: '/100',
          requiredLaps: 2
        }
      },
      {
        id: 's-4-3',
        moduleId: 'mod-4',
        sessionNumber: 3,
        title: 'Adapting Trail Braking to Corner Radii',
        subtitle: 'Deep trail in tight hairpins vs brief breathers in fast sweepers',
        bookReference: 'Going Faster Chapter 5, pp. 171-185',
        theorySummary: [
          'Tight hairpins require deep, prolonged trail braking deep into the turn to overcome low-speed understeer.',
          'Fast high-speed sweepers require only a quick, light trail-brake to transfer weight without scrubbing momentum.'
        ],
        keyPrinciples: [
          { title: 'Corner Type Matching', explanation: 'Match trail braking depth to corner tightness.' },
          { title: 'Speed Scrub Awareness', explanation: 'Do not over-trail in fast corners; prioritize minimum corner speed.' }
        ],
        drillGoal: 'Successfully vary trail braking duration across slow hairpins (>0.6s) and fast sweepers (<0.25s).',
        targetMetrics: [
          { label: 'Adaptive Trail Score', value: '≥ 88/100', hint: 'Correct duration per corner type' }
        ],
        challenge: {
          id: 'ch-4-3',
          name: 'Multi-Corner Adaptive Trail Challenge',
          description: 'Achieve an overall trail-braking grade of ≥ 85/100 across a mixed-corner circuit.',
          metric: 'trail_braking_score',
          operator: 'gte',
          targetValue: 85,
          unit: '/100',
          requiredLaps: 2
        }
      }
    ],
    graduationTest: {
      id: 'gt-4',
      moduleId: 'mod-4',
      title: 'Module 4 Graduation: Trail Braking & Rotation Mastery Exam',
      examOverview: '3-lap certification demonstrating seamless brake bleed-off, chassis pitch stabilization, and apex rotation across all corner types.',
      trackName: 'Lime Rock Park / Mid-Ohio / Spa',
      carName: 'Formula Continental / Porsche 911 GT3',
      requiredLaps: 3,
      passingScorePct: 85,
      requirements: [
        { title: 'Trail Braking Score', description: 'Average trail braking decay score across all sectors', metric: 'Trail Score', targetText: '≥ 85/100', minScorePct: 85 },
        { title: 'Apex Minimum Speed', description: 'Carry optimal rolling speed without over-slowing', metric: 'Apex Delta', targetText: '≥ 80%', minScorePct: 80 },
        { title: 'Chassis Stability', description: 'No sudden pitch snap or uncontrolled oversteer snaps', metric: 'Stability', targetText: '≥ 90%', minScorePct: 90 }
      ]
    }
  },
  {
    id: 'mod-5',
    moduleNumber: 5,
    title: 'Turn-In Technique & Steering Smoothness',
    tagline: 'Single-Input Steering, Roll-Rate Matching, and Eliminating Wheel Sawing',
    bookChapter: 'Chapter 6: Steering & Turn-In',
    iconName: 'Compass',
    description: 'Develop silky, decisive steering inputs. Learn how sawing at the wheel destroys tire grip, how to set the car with a single smooth input, and how to match steering speed to suspension roll rate.',
    sessions: [
      {
        id: 's-5-1',
        moduleId: 'mod-5',
        sessionNumber: 1,
        title: 'The Single-Input Steering Rule',
        subtitle: 'Turning in once, setting the steering angle, and holding the arc',
        bookReference: 'Going Faster Chapter 6, pp. 186-200',
        theorySummary: [
          'Every steering adjustment upsets tire contact patches and scrubs speed.',
          'The ideal corner turn-in is one smooth, continuous input to the desired lock, held through the apex.'
        ],
        keyPrinciples: [
          { title: 'Commitment on Entry', explanation: 'Look far ahead to the apex to calculate the exact steering angle needed.' },
          { title: 'Eliminate Sawing', explanation: 'Micro-corrections indicate a lack of visual focus or improper entry speed.' }
        ],
        drillGoal: 'Maintain steering micro-correction variance < 8% throughout corner entry.',
        targetMetrics: [
          { label: 'Steering Smoothness Score', value: '≥ 88/100', hint: 'Smooth input trace with zero oscillation' }
        ],
        challenge: {
          id: 'ch-5-1',
          name: 'Steering Smoothness Challenge',
          description: 'Achieve a steering smoothness score of ≥ 85/100 on 2 consecutive laps.',
          metric: 'steering_smoothness_score',
          operator: 'gte',
          targetValue: 85,
          unit: '/100',
          requiredLaps: 2
        }
      },
      {
        id: 's-5-2',
        moduleId: 'mod-5',
        sessionNumber: 2,
        title: 'Steering Rate & Chassis Roll Matching',
        subtitle: 'Allowing the suspension to take a set without overloading the outside tires',
        bookReference: 'Going Faster Chapter 6, pp. 201-215',
        theorySummary: [
          'Turning the steering wheel too quickly snaps the chassis, spiking tire slip angle into severe understeer.',
          'Turn in at a rate that allows the outside springs and dampers to compress smoothly.'
        ],
        keyPrinciples: [
          { title: 'Chassis Set', explanation: 'Feel the outside suspension load up before reaching maximum lateral G.' },
          { title: 'Speed-Dependent Rate', explanation: 'Steer slower at 200 km/h than at 60 km/h.' }
        ],
        drillGoal: 'Match steering rate to lateral acceleration rise rate for seamless weight transfer.',
        targetMetrics: [
          { label: 'Lateral G Rise Linearity', value: '≥ 85%', hint: 'Progressive lateral load transfer' }
        ],
        challenge: {
          id: 'ch-5-2',
          name: 'Chassis Roll Matching Challenge',
          description: 'Score ≥ 85/100 in steering linearity and chassis settlement across 2 laps.',
          metric: 'steering_smoothness_score',
          operator: 'gte',
          targetValue: 85,
          unit: '/100',
          requiredLaps: 2
        }
      }
    ],
    graduationTest: {
      id: 'gt-5',
      moduleId: 'mod-5',
      title: 'Module 5 Graduation: Steering Precision Exam',
      examOverview: '3-lap evaluation testing smooth, single-input steering arcs and chassis roll control through complex technical sectors.',
      trackName: 'Circuit de Barcelona-Catalunya / Suzuka',
      carName: 'Formula Continental / GT3',
      requiredLaps: 3,
      passingScorePct: 85,
      requirements: [
        { title: 'Steering Smoothness', description: 'Zero erratic wheel corrections', metric: 'Smoothness', targetText: '≥ 85/100', minScorePct: 85 },
        { title: 'Turn-In Consistency', description: 'Precise initiation points', metric: 'Turn-In Score', targetText: '≥ 82%', minScorePct: 82 }
      ]
    }
  },
  {
    id: 'mod-6',
    moduleNumber: 6,
    title: 'Throttle Application & Corner Exit',
    tagline: 'Initial Pick-Up Point, Steering Unwind Coordination, and Slip Ratio Control',
    bookChapter: 'Chapter 7: Throttle Application',
    iconName: 'Zap',
    description: 'Learn when, where, and how hard to apply throttle out of corners. Master the synchronization between unwinding steering lock and pressing the gas to avoid exit wheelspin and power oversteer.',
    sessions: [
      {
        id: 's-6-1',
        moduleId: 'mod-6',
        sessionNumber: 1,
        title: 'The Maintenance Throttle Pick-Up',
        subtitle: 'Eliminating the coasting lag between trail braking and power application',
        bookReference: 'Going Faster Chapter 7, pp. 216-230',
        theorySummary: [
          'Any moment spent coasting (neither braking nor accelerating) is lost time.',
          'As trailing brake pressure reaches zero at the apex, your foot should instantly transition to light maintenance throttle (10-20%) to stabilize the rear platform.'
        ],
        keyPrinciples: [
          { title: 'Zero Hesitation Gap', explanation: 'Keep the transition time between brake off and throttle on under 150ms.' },
          { title: 'Rear Platform Settlement', explanation: 'Light throttle shifts weight to the rear tires, planting the back end for exit.' }
        ],
        drillGoal: 'Transition from 0% brake to initial throttle pickup in < 150ms at every apex.',
        targetMetrics: [
          { label: 'Throttle Pickup Lag', value: '< 150 ms', hint: 'Milliseconds between brake off & throttle on' }
        ],
        challenge: {
          id: 'ch-6-1',
          name: 'Zero-Coasting Pickup Challenge',
          description: 'Achieve an average throttle pickup hesitation time < 150ms across 2 laps.',
          metric: 'overall_lap_score',
          operator: 'gte',
          targetValue: 85,
          unit: '%',
          requiredLaps: 2
        }
      },
      {
        id: 's-6-2',
        moduleId: 'mod-6',
        sessionNumber: 2,
        title: 'Synchronizing Throttle with Steering Unwind',
        subtitle: 'Progressive power delivery as lateral grip requirements decrease',
        bookReference: 'Going Faster Chapter 7, pp. 231-248',
        theorySummary: [
          'Full throttle can only be achieved when steering angle is reduced near zero.',
          'Increase throttle in direct 1:1 proportion to opening the steering wheel.'
        ],
        keyPrinciples: [
          { title: 'Unwind Rule', explanation: 'If you cannot unwind the wheel, you cannot add more throttle without oversteering or understeering off track.' },
          { title: 'Traction Band Management', explanation: 'Maintain driven wheel slip ratio between 6% and 12% for peak acceleration.' }
        ],
        drillGoal: 'Achieve a throttle-to-unwind linearity correlation score of ≥ 90/100.',
        targetMetrics: [
          { label: 'Unwind Linearity', value: '≥ 90/100', hint: '1:1 ratio between wheel open & throttle' }
        ],
        challenge: {
          id: 'ch-6-2',
          name: 'Unwind Synchronization Challenge',
          description: 'Achieve a throttle unwind score of ≥ 88/100 on 2 consecutive laps.',
          metric: 'throttle_unwind_score',
          operator: 'gte',
          targetValue: 88,
          unit: '/100',
          requiredLaps: 2
        }
      }
    ],
    graduationTest: {
      id: 'gt-6',
      moduleId: 'mod-6',
      title: 'Module 6 Graduation: Exit Acceleration Certification',
      examOverview: 'Complete 3 laps demonstrating zero apex coasting, rapid maintenance pickup, and perfect throttle/unwind synchronization.',
      trackName: 'Watkins Glen Full / Road America',
      carName: 'Formula Continental / GT3 RWD',
      requiredLaps: 3,
      passingScorePct: 86,
      requirements: [
        { title: 'Throttle Unwind Linearity', description: 'Smooth progressive power delivery', metric: 'Unwind Score', targetText: '≥ 88/100', minScorePct: 88 },
        { title: 'Apex Pickup Lag', description: 'Zero coasting between brake and throttle', metric: 'Pickup Lag', targetText: '< 160ms', minScorePct: 85 }
      ]
    }
  },
  {
    id: 'mod-7',
    moduleNumber: 7,
    title: 'Slip Angles & Finding the Limit',
    tagline: 'Tire Slip Physics, Feeling the Grip Plateau, and Optimal Cornering Angles',
    bookChapter: 'Chapter 8: Slip Angles',
    iconName: 'Sliders',
    description: 'Understand tire mechanics: pneumatic trail, slip angle generation, and why maximum tire grip occurs when tires point 4° to 8° away from the direction of travel.',
    sessions: [
      {
        id: 's-7-1',
        moduleId: 'mod-7',
        sessionNumber: 1,
        title: 'The Tire Slip Angle Window',
        subtitle: 'Living in the 4° - 7° peak lateral grip sweet spot',
        bookReference: 'Going Faster Chapter 8, pp. 249-265',
        theorySummary: [
          'Tires do not steer like rail cars; the tread distorts to create a slip angle relative to the wheel heading.',
          'Peak lateral grip occurs between 4° and 7° of slip. Beyond 8°, grip falls off dramatically and generates excessive tire scrub.'
        ],
        keyPrinciples: [
          { title: 'The Grip Plateau', explanation: 'Tires reach peak grip across a broad slip plateau before breaking away.' },
          { title: 'Over-Steering Scrubs Speed', explanation: 'Turning the wheel further once past peak slip angle only overheats the tires and slows the car down.' }
        ],
        drillGoal: 'Maintain average cornering slip angles between 4.5° and 7.0° throughout apex zones.',
        targetMetrics: [
          { label: 'Avg Apex Slip Angle', value: '5.2° ± 1.0°', hint: 'Optimal grip envelope' }
        ],
        challenge: {
          id: 'ch-7-1',
          name: 'Slip Angle Plateau Challenge',
          description: 'Keep all 4 tire slip angles within the 4° - 7.5° optimal window for ≥ 80% of mid-corner distance over 2 laps.',
          metric: 'slip_angle_window',
          operator: 'gte',
          targetValue: 80,
          unit: '%',
          requiredLaps: 2
        }
      }
    ],
    graduationTest: {
      id: 'gt-7',
      moduleId: 'mod-7',
      title: 'Module 7 Graduation: Slip Angle & Limit Mastery Exam',
      examOverview: 'Demonstrate continuous cornering at the tire grip plateau without exceeding critical slip angle scrub thresholds.',
      trackName: 'Silverstone Grand Prix / Mugello',
      carName: 'Formula Continental / GT3',
      requiredLaps: 3,
      passingScorePct: 84,
      requirements: [
        { title: 'Slip Angle Control', description: 'Maintain optimal slip window through high-load corners', metric: 'Slip Window', targetText: '≥ 80%', minScorePct: 80 },
        { title: 'Corner Minimum Speed', description: 'Maximize rolling speed at peak grip', metric: 'Apex Speed', targetText: '≥ 85%', minScorePct: 85 }
      ]
    }
  },
  {
    id: 'mod-8',
    moduleNumber: 8,
    title: 'Handling Understeer & Oversteer',
    tagline: 'Slip Differentials, Weight Transfer Remedies, and Fast Reflexive Corrections',
    bookChapter: 'Chapter 9: Vehicle Balance',
    iconName: 'ShieldAlert',
    description: 'Diagnose whether the front or rear tires are exceeding their friction budget. Learn how to fix understeer by opening the steering wheel and breathing off throttle, and how to catch oversteer without snapping back.',
    sessions: [
      {
        id: 's-8-1',
        moduleId: 'mod-8',
        sessionNumber: 1,
        title: 'Diagnosing & Correcting Understeer (Push)',
        subtitle: 'Why turning the wheel more is the worst response to front wash',
        bookReference: 'Going Faster Chapter 9, pp. 266-282',
        theorySummary: [
          'Understeer occurs when front tire slip angle exceeds rear slip angle (Front Slip > Rear Slip + 2°).',
          'The correct remedy is to slightly OPEN the steering wheel and gently breathe off throttle to transfer weight back to the front contact patch.'
        ],
        keyPrinciples: [
          { title: 'Unwind to Grip', explanation: 'Reduce steering lock to bring front tires back from oversaturated slip angle to peak plateau.' },
          { title: 'Throttle Breathing', explanation: 'A smooth 10% throttle lift transfers weight forward to bite the front tires.' }
        ],
        drillGoal: 'Correct induced entry understeer within 0.25 seconds by opening the wheel and modulating throttle.',
        targetMetrics: [
          { label: 'Understeer Recovery Time', value: '< 300 ms', hint: 'Time to restore front tire grip' }
        ],
        challenge: {
          id: 'ch-8-1',
          name: 'Understeer Recovery Challenge',
          description: 'Recover from entry push events with minimal speed scrub, achieving a balance score of ≥ 85/100.',
          metric: 'overall_lap_score',
          operator: 'gte',
          targetValue: 85,
          unit: '%',
          requiredLaps: 2
        }
      },
      {
        id: 's-8-2',
        moduleId: 'mod-8',
        sessionNumber: 2,
        title: 'Catching & Balancing Oversteer (Loose)',
        subtitle: 'Immediate counter-steer reaction and throttle stabilization',
        bookReference: 'Going Faster Chapter 9, pp. 283-300',
        theorySummary: [
          'Oversteer occurs when rear slip angle exceeds front slip angle.',
          'Catch it with fast, decisive counter-steer matching yaw velocity, while keeping throttle steady to avoid lift-off snap.'
        ],
        keyPrinciples: [
          { title: 'Never Chop Throttle', explanation: 'Lifting abruptly off throttle during oversteer unloads the rear tires, guaranteeing a spin.' },
          { title: 'Fast Hands, Smooth Feet', explanation: 'Counter-steer instantly, and unwind just as quickly as the rear steps back in line.' }
        ],
        drillGoal: 'Catch induced rear slide with single counter-steer input and zero tank-slapper oscillations.',
        targetMetrics: [
          { label: 'Counter-steer Reaction Time', value: '< 180 ms', hint: 'Instant reaction to yaw acceleration spike' }
        ],
        challenge: {
          id: 'ch-8-2',
          name: 'Oversteer Catch & Balance Challenge',
          description: 'Control rear slides with zero secondary snap oscillations, achieving ≥ 85% balance score.',
          metric: 'overall_lap_score',
          operator: 'gte',
          targetValue: 85,
          unit: '%',
          requiredLaps: 2
        }
      }
    ],
    graduationTest: {
      id: 'gt-8',
      moduleId: 'mod-8',
      title: 'Module 8 Graduation: Vehicle Balance Certification',
      examOverview: '3-lap exam testing proactive balance management and instantaneous recovery from both push and loose conditions.',
      trackName: 'Circuit of the Americas / Nürburgring GP',
      carName: 'Formula Continental / GT3 RWD',
      requiredLaps: 3,
      passingScorePct: 85,
      requirements: [
        { title: 'Vehicle Balance Index', description: 'Keep slip angle differential under ±1.5°', metric: 'Balance Score', targetText: '≥ 85/100', minScorePct: 85 },
        { title: 'Zero Spin / Loss of Control', description: 'Zero spins or off-tracks across all 3 laps', metric: 'Car Control', targetText: '100% Clean', minScorePct: 95 }
      ]
    }
  },
  {
    id: 'mod-9',
    moduleNumber: 9,
    title: 'Linking Corners & Complex Chicanes',
    tagline: 'Sacrifice Principles, Rapid Directional Transitions, and Momentum Preservation',
    bookChapter: 'Chapter 10: Corner Combinations',
    iconName: 'Share2',
    description: 'Master fast chicanes, esses, and technical complexes. Learn how to manage the pendulum effect of weight transfer during quick left-right transitions.',
    sessions: [
      {
        id: 's-9-1',
        moduleId: 'mod-9',
        sessionNumber: 1,
        title: 'The Chicane Weight Reversal',
        subtitle: 'Using damper compression and curb strikes to rotate between transitions',
        bookReference: 'Going Faster Chapter 10, pp. 301-318',
        theorySummary: [
          'In a fast chicane, the rebound of the suspension from the first turn can be used to whip the car into the second turn.',
          'Timing the steering reversal to coincide with chassis pitch and roll rebound maximizes agility.'
        ],
        keyPrinciples: [
          { title: 'Transition Rhythm', explanation: 'A chicane is driven to a tempo: Turn, Settle, Reversal, Power.' },
          { title: 'Straightening the Line', explanation: 'Use allowable curb geometry to turn two sharp corners into one smooth shallow S.' }
        ],
        drillGoal: 'Minimize time spent in transition roll while maintaining chassis composure.',
        targetMetrics: [
          { label: 'Chicane Sector Delta', value: '-0.25s', hint: 'Improvement through rapid transition' }
        ],
        challenge: {
          id: 'ch-9-1',
          name: 'Chicane Transition Challenge',
          description: 'Achieve a chicane sector score of ≥ 85/100 on 2 consecutive laps.',
          metric: 'overall_lap_score',
          operator: 'gte',
          targetValue: 85,
          unit: '%',
          requiredLaps: 2
        }
      }
    ],
    graduationTest: {
      id: 'gt-9',
      moduleId: 'mod-9',
      title: 'Module 9 Graduation: Complex Combinations Exam',
      examOverview: 'Execute 3 flawless laps through high-speed chicane complexes and linked multi-apex technical sections.',
      trackName: 'Monza (Variante del Rettifilo) / Spa (Bus Stop & Chicane)',
      carName: 'Formula Continental / GT3',
      requiredLaps: 3,
      passingScorePct: 84,
      requirements: [
        { title: 'Chicane Sector Score', description: 'Flawless line and momentum maintenance', metric: 'Sector Score', targetText: '≥ 85%', minScorePct: 85 }
      ]
    }
  },
  {
    id: 'mod-10',
    moduleNumber: 10,
    title: 'Downshifting, Engine Braking & Gear Selection',
    tagline: 'Rev-Matching, Powerband Optimization, and Rear Axle Stability',
    bookChapter: 'Chapter 11: Shifting & Gearing',
    iconName: 'Gauge',
    description: 'Master precision downshifting and rev-matching. Learn how sloppy downshifts lock the rear axle under heavy braking and how corner exit gear selection impacts acceleration.',
    sessions: [
      {
        id: 's-10-1',
        moduleId: 'mod-10',
        sessionNumber: 1,
        title: 'Rev-Matching & Rear Axle Stability',
        subtitle: 'Eliminating engine braking spikes that cause entry oversteer',
        bookReference: 'Going Faster Chapter 11, pp. 319-335',
        theorySummary: [
          'A mismatched downshift acts like pulling the handbrake on the driven wheels.',
          'Proper rev-matching blips ensure engine RPM matches transmission speed perfectly before clutch engagement.'
        ],
        keyPrinciples: [
          { title: 'Axle Stability Under Decel', explanation: 'Prevent rear tire slip ratio spikes during downshift sequence.' },
          { title: 'Sequential Timing', explanation: 'Complete downshifts sequentially as speed drops rather than dumping multiple gears at once.' }
        ],
        drillGoal: 'Execute clean downshifts with zero rear slip ratio spikes > 10% during heavy braking.',
        targetMetrics: [
          { label: 'Downshift Smoothness', value: '≥ 90/100', hint: 'Zero RPM mismatch shudder' }
        ],
        challenge: {
          id: 'ch-10-1',
          name: 'Downshift Rev-Match Challenge',
          description: 'Achieve zero rear-axle lockup spikes across all downshifts for 2 consecutive laps.',
          metric: 'overall_lap_score',
          operator: 'gte',
          targetValue: 86,
          unit: '%',
          requiredLaps: 2
        }
      }
    ],
    graduationTest: {
      id: 'gt-10',
      moduleId: 'mod-10',
      title: 'Module 10 Graduation: Powertrain & Gearing Exam',
      examOverview: 'Demonstrate perfect downshift execution, optimal gear selection, and peak RPM exit acceleration over 3 laps.',
      trackName: 'Virginia International Raceway / Bathurst',
      carName: 'Formula Continental / GT3 Manual',
      requiredLaps: 3,
      passingScorePct: 85,
      requirements: [
        { title: 'Downshift Axle Stability', description: 'Zero rear-axle hop or lockup events', metric: 'Axle Stability', targetText: '100% Clean', minScorePct: 90 }
      ]
    }
  },
  {
    id: 'mod-11',
    moduleNumber: 11,
    title: 'Aerodynamics, Downforce & High-Speed Corners',
    tagline: 'Speed-Squared Grip Physics and High-Speed Mental Commitment',
    bookChapter: 'Chapter 12: Aerodynamics',
    iconName: 'Wind',
    description: 'Learn how aerodynamic wings generate downforce proportional to the square of vehicle speed ($V^2$), and why high-speed sweepers require total commitment at corner entry.',
    sessions: [
      {
        id: 's-11-1',
        moduleId: 'mod-11',
        sessionNumber: 1,
        title: 'Speed-Dependent Grip ($V^2$ Physics)',
        subtitle: 'Trusting downforce at 220+ km/h where grip is double low-speed grip',
        bookReference: 'Going Faster Chapter 12, pp. 336-352',
        theorySummary: [
          'Downforce doubles every time speed increases by ~41%.',
          'Braking or hesitating in a high-speed aero corner drops downforce, instantly reducing grip and inducing snap oversteer.'
        ],
        keyPrinciples: [
          { title: 'The Aero Trap', explanation: 'Lifting in high-speed turns loses both downforce and stability.' },
          { title: 'Turn-In Velocity Commitment', explanation: 'Enter high-speed corners with confidence to keep wings loaded.' }
        ],
        drillGoal: 'Carry maximum entry speed through high-speed sweepers with lateral G > 1.8G.',
        targetMetrics: [
          { label: 'High-Speed Apex Lateral G', value: '≥ 1.80 G', hint: 'Exploiting aerodynamic load' }
        ],
        challenge: {
          id: 'ch-11-1',
          name: 'High-Speed Aero Commitment Challenge',
          description: 'Maintain lateral G > 1.7G through target high-speed sweepers on 2 consecutive laps.',
          metric: 'overall_lap_score',
          operator: 'gte',
          targetValue: 85,
          unit: '%',
          requiredLaps: 2
        }
      }
    ],
    graduationTest: {
      id: 'gt-11',
      moduleId: 'mod-11',
      title: 'Module 11 Graduation: High-Speed Aero Mastery Exam',
      examOverview: '3-lap certification navigating high-speed aerodynamic corners at maximum commitment and stability.',
      trackName: 'Silverstone (Maggotts/Becketts) / Spa (Eau Rouge/Blanchimont)',
      carName: 'Formula Continental / LMP2',
      requiredLaps: 3,
      passingScorePct: 85,
      requirements: [
        { title: 'Aero Sector Grip', description: 'Maintain maximum high-speed cornering load', metric: 'Aero Lateral G', targetText: '≥ 1.75 G', minScorePct: 85 }
      ]
    }
  },
  {
    id: 'mod-12',
    moduleNumber: 12,
    title: 'Rain Driving & Wet Weather Dynamics',
    tagline: 'Alternative Wet Lines, Avoiding Polished Rubber, and Deliberate Modulation',
    bookChapter: 'Chapter 13: Rain & Low-Grip Dynamics',
    iconName: 'CloudRain',
    description: 'Learn why the dry racing line becomes ice in the wet, how to run the rim-shot wet line around the outside of corners, and how to manage low-grip traction budgets.',
    sessions: [
      {
        id: 's-12-1',
        moduleId: 'mod-12',
        sessionNumber: 1,
        title: 'The Wet Racing Line & Rim-Shot Technique',
        subtitle: 'Driving off-line to find gritty unpolished asphalt with maximum wet grip',
        bookReference: 'Going Faster Chapter 13, pp. 353-370',
        theorySummary: [
          'In the wet, embedded rubber on the traditional dry racing line acts like polished glass.',
          'The fast wet line runs wide on the outside of corners where rough aggregate provides mechanical grip.'
        ],
        keyPrinciples: [
          { title: 'Avoid the Polish', explanation: 'Cross the dry rubber line at right angles; do not corner on it.' },
          { title: 'Gentle Input Velocity', explanation: 'Reduce input application rates by 50% to prevent breaking wet friction threshold.' }
        ],
        drillGoal: 'Execute alternative wet lines with continuous grip retention on wet asphalt.',
        targetMetrics: [
          { label: 'Wet Grip Utilization', value: '≥ 82%', hint: 'Maximizing available wet friction budget' }
        ],
        challenge: {
          id: 'ch-12-1',
          name: 'Wet Line Execution Challenge',
          description: 'Achieve a wet track score of ≥ 82% with zero hydroplaning spins across 2 laps.',
          metric: 'overall_lap_score',
          operator: 'gte',
          targetValue: 82,
          unit: '%',
          requiredLaps: 2
        }
      }
    ],
    graduationTest: {
      id: 'gt-12',
      moduleId: 'mod-12',
      title: 'Module 12 Graduation: Low-Grip & Rain Certification',
      examOverview: '3-lap evaluation on low-grip / wet circuit demonstrating alternative line mastery and smooth control modulation.',
      trackName: 'Nürburgring Nordschleife (Wet) / Silverstone (Wet)',
      carName: 'Formula Continental / GT3 Wet',
      requiredLaps: 3,
      passingScorePct: 82,
      requirements: [
        { title: 'Wet Control Consistency', description: 'Smooth control modulation on low grip surface', metric: 'Control Score', targetText: '≥ 82%', minScorePct: 82 }
      ]
    }
  },
  {
    id: 'mod-13',
    moduleNumber: 13,
    title: 'Consistency & Mental Focus',
    tagline: 'Stint Variance Elimination, Reference Resetting, and Flow State Performance',
    bookChapter: 'Chapter 14: The Mental Game & Consistency',
    iconName: 'Target',
    description: 'Eliminate lap-to-lap variance. Learn the mental strategies used by champions to repeat laps within tenths of a second and immediately recover from mistakes without cascading errors.',
    sessions: [
      {
        id: 's-13-1',
        moduleId: 'mod-13',
        sessionNumber: 1,
        title: '5-Lap Delta Variance Minimization',
        subtitle: 'Driving 5 consecutive laps within a tight ±0.25 second window',
        bookReference: 'Going Faster Chapter 14, pp. 371-388',
        theorySummary: [
          'Speed without consistency does not win championships.',
          'Lock in exact braking markers, turn-in points, and throttle pickup zones on every lap.'
        ],
        keyPrinciples: [
          { title: 'Repeatability is Speed', explanation: 'Eliminate emotional driving; execute the telemetric plan.' },
          { title: 'Reference Discipline', explanation: 'Look to the next target marker before completing the current corner.' }
        ],
        drillGoal: 'Complete 5 consecutive laps with maximum lap time spread < 0.35s.',
        targetMetrics: [
          { label: 'Lap Delta Spread', value: '< 0.35 s', hint: 'Difference between fastest & slowest lap in stint' }
        ],
        challenge: {
          id: 'ch-13-1',
          name: '5-Lap Precision Consistency Challenge',
          description: 'Complete 5 clean consecutive laps with a lap time variance of < 0.35 seconds.',
          metric: 'lap_delta_variance_sec',
          operator: 'lte',
          targetValue: 0.35,
          unit: 'sec',
          requiredLaps: 5
        }
      }
    ],
    graduationTest: {
      id: 'gt-13',
      moduleId: 'mod-13',
      title: 'Module 13 Graduation: Grand Master Consistency Stint',
      examOverview: 'A demanding 5-lap endurance benchmark requiring uncompromising lap-time repeatability and zero track limit penalties.',
      trackName: 'Watkins Glen / Laguna Seca',
      carName: 'Formula Continental / GT3',
      requiredLaps: 5,
      passingScorePct: 88,
      requirements: [
        { title: 'Stint Lap Spread', description: 'Total variance across 5 laps', metric: 'Delta Variance', targetText: '< 0.30s', minScorePct: 90 },
        { title: 'Sector Consistency', description: 'Sector time variance across laps', metric: 'Sector Spread', targetText: '< 0.15s', minScorePct: 88 }
      ]
    }
  },
  {
    id: 'mod-14',
    moduleNumber: 14,
    title: 'Racecraft, Overtaking & Defensive Lines',
    tagline: 'Out-Braking Maneuvers, Switchback Undercuts, and Compromised Line Optimization',
    bookChapter: 'Chapter 15: Racecraft & Tactics',
    iconName: 'Trophy',
    description: 'The pinnacle of the Skip Barber Academy: applying vehicle dynamics under pressure. Master late out-braking on the inside line, executing switchback exit undercuts, and defending lines without losing overall lap time.',
    sessions: [
      {
        id: 's-14-1',
        moduleId: 'mod-14',
        sessionNumber: 1,
        title: 'The Inside Out-Braking Maneuver',
        subtitle: 'Braking deep on a tight inside entry while still making the apex',
        bookReference: 'Going Faster Chapter 15, pp. 389-405',
        theorySummary: [
          'When overtaking on the inside, the corner radius is tighter, meaning entry speed must be lower.',
          'Brake later and harder, turn in sharply, and square off the corner to block the line.'
        ],
        keyPrinciples: [
          { title: 'Squaring the Corner', explanation: 'Sacrifice mid-corner radius to control the clipping point.' },
          { title: 'Braking on Un-rubbered Line', explanation: 'Account for reduced grip off the optimal racing line.' }
        ],
        drillGoal: 'Execute inside-line passes without blowing past track limits on exit.',
        targetMetrics: [
          { label: 'Inside Line Control', value: '≥ 85/100', hint: 'Full control throughout pass' }
        ],
        challenge: {
          id: 'ch-14-1',
          name: 'Inside Line Braking Challenge',
          description: 'Achieve an inside-line execution score of ≥ 85/100 on 2 consecutive simulated passing laps.',
          metric: 'overall_lap_score',
          operator: 'gte',
          targetValue: 85,
          unit: '%',
          requiredLaps: 2
        }
      },
      {
        id: 's-14-2',
        moduleId: 'mod-14',
        sessionNumber: 2,
        title: 'The Switchback (Undercut) Counter-Attack',
        subtitle: 'Braking early on the outside to cut under an over-shooting opponent',
        bookReference: 'Going Faster Chapter 15, pp. 406-420',
        theorySummary: [
          'If an opponent dives down your inside too fast, let them overshoot.',
          'Brake early on the outside, take a wide late apex, turn back sharp, and power down the straight under their rear wing.'
        ],
        keyPrinciples: [
          { title: 'Patience Beats Aggression', explanation: 'The car that gets to full throttle first wins down the straight.' },
          { title: 'Exit Velocity Advantage', explanation: 'Maximize straight-line speed delta.' }
        ],
        drillGoal: 'Achieve +8 km/h higher exit speed out of Turn 1 using the switchback line.',
        targetMetrics: [
          { label: 'Switchback Exit Delta', value: '+8 km/h', hint: 'Exit speed advantage' }
        ],
        challenge: {
          id: 'ch-14-2',
          name: 'Switchback Undercut Challenge',
          description: 'Achieve an exit speed delta of ≥ +6 km/h out of target corner over 2 laps.',
          metric: 'overall_lap_score',
          operator: 'gte',
          targetValue: 85,
          unit: '%',
          requiredLaps: 2
        }
      }
    ],
    graduationTest: {
      id: 'gt-14',
      moduleId: 'mod-14',
      title: 'Module 14 Graduation: Skip Barber Master Race Driver Certification',
      examOverview: 'The ultimate final exam: 5 laps demonstrating complete mastery of the racing line, traction budget, threshold/trail braking, and tactical racecraft.',
      trackName: 'Watkins Glen Grand Prix / Spa-Francorchamps',
      carName: 'Formula Continental / GT3 Competition',
      requiredLaps: 5,
      passingScorePct: 88,
      requirements: [
        { title: 'Overall Telemetry Mastery', description: 'Comprehensive driving score across all sectors', metric: 'Mastery Grade', targetText: '≥ 88%', minScorePct: 88 },
        { title: 'Traction Budget Average', description: 'Continuous friction circle utilization', metric: 'Traction Budget', targetText: '≥ 85%', minScorePct: 85 },
        { title: 'Trail-Braking & Apex Score', description: 'Flawless pitch control and rotation', metric: 'Trail Score', targetText: '≥ 88/100', minScorePct: 88 },
        { title: 'Consistency Spread', description: 'Stint time variance within 0.35s', metric: 'Delta Spread', targetText: '< 0.35s', minScorePct: 90 }
      ]
    }
  }
];
