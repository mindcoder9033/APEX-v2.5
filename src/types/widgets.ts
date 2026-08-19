export type DriverLevelPreset = 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'expert';

export type WidgetId =
  | 'speedometer'
  | 'gearRpm'
  | 'pedals'
  | 'tractionBudget'
  | 'frictionCircle'
  | 'trackMap'
  | 'telemetryTraces'
  | 'steeringBalance'
  | 'tireSuspension'
  | 'liveTiming';

export interface WidgetMetadata {
  id: WidgetId;
  title: string;
  category: 'core' | 'dynamics' | 'analysis' | 'advanced';
  description: string;
  defaultSpan: 1 | 2; // 1 = 1 column / half width, 2 = 2 columns / full width (in 2-col or 4-col responsive grid)
  minLevel: DriverLevelPreset;
}

export interface WidgetConfig {
  id: WidgetId;
  span: 1 | 2;
}

export interface PracticeViewLayout {
  preset: DriverLevelPreset;
  isCustom: boolean;
  widgets: WidgetConfig[];
}

export const WIDGET_CATALOG: Record<WidgetId, WidgetMetadata> = {
  speedometer: {
    id: 'speedometer',
    title: 'Speedometer',
    category: 'core',
    description: 'Digital HUD speed indicator with km/h and mph readouts',
    defaultSpan: 1,
    minLevel: 'beginner'
  },
  gearRpm: {
    id: 'gearRpm',
    title: 'Gear & RPM Rev Gauge',
    category: 'core',
    description: 'Selected transmission gear and color-banded RPM tachometer',
    defaultSpan: 1,
    minLevel: 'beginner'
  },
  pedals: {
    id: 'pedals',
    title: 'Throttle & Brake Inputs',
    category: 'core',
    description: 'Live pedal pressure bars for throttle and braking inputs',
    defaultSpan: 1,
    minLevel: 'beginner'
  },
  tractionBudget: {
    id: 'tractionBudget',
    title: 'Traction Budget & G-Forces',
    category: 'dynamics',
    description: 'Grip utilization percentage with lateral and longitudinal G-forces',
    defaultSpan: 1,
    minLevel: 'novice'
  },
  liveTiming: {
    id: 'liveTiming',
    title: 'Live Lap Timing & Stint Delta',
    category: 'dynamics',
    description: 'Current lap timer, previous lap, stint best time, and frame counter',
    defaultSpan: 1,
    minLevel: 'novice'
  },
  frictionCircle: {
    id: 'frictionCircle',
    title: 'Friction Circle (g-g Plot)',
    category: 'analysis',
    description: 'Real-time tire friction circle scatter diagram and peak friction boundary',
    defaultSpan: 2,
    minLevel: 'intermediate'
  },
  trackMap: {
    id: 'trackMap',
    title: 'Live Track Map & Car GPS',
    category: 'core',
    description: 'Real-time GPS trajectory with automated track detection and car location',
    defaultSpan: 2,
    minLevel: 'beginner'
  },
  steeringBalance: {
    id: 'steeringBalance',
    title: 'Steering Angle & Dynamic Balance',
    category: 'analysis',
    description: 'Steering rack angle and slip differential understeer/oversteer meter',
    defaultSpan: 1,
    minLevel: 'intermediate'
  },
  telemetryTraces: {
    id: 'telemetryTraces',
    title: 'Rolling Telemetry Traces',
    category: 'advanced',
    description: 'Live waveform time-series traces for speed, throttle, brake, and steering inputs',
    defaultSpan: 2,
    minLevel: 'advanced'
  },
  tireSuspension: {
    id: 'tireSuspension',
    title: '4-Wheel Tire Temps & Damper Travel',
    category: 'advanced',
    description: '4-corner tire thermal heatmap and suspension compression indicators',
    defaultSpan: 2,
    minLevel: 'expert'
  }
};

export const PRESET_LEVELS: { id: DriverLevelPreset; label: string; badge: string; desc: string }[] = [
  { id: 'beginner', label: 'Beginner', badge: 'LEVEL 1', desc: 'Core 4 driving essentials: Speed, Gear/RPM, Pedals & Track Map' },
  { id: 'novice', label: 'Novice', badge: 'LEVEL 2', desc: 'Foundational dynamics: Adds Traction Budget and Live Timing' },
  { id: 'intermediate', label: 'Intermediate', badge: 'LEVEL 3', desc: 'Car balance & grip: Adds Friction Circle g-g plot & Steering Balance' },
  { id: 'advanced', label: 'Advanced', badge: 'LEVEL 4', desc: 'Pace optimization: Adds Live Rolling Telemetry Waveforms' },
  { id: 'expert', label: 'Expert', badge: 'PRO ENGINEER', desc: 'Complete analytical telemetry suite: All 10 widgets active' }
];

export const PRESET_LAYOUTS: Record<DriverLevelPreset, WidgetConfig[]> = {
  beginner: [
    { id: 'speedometer', span: 1 },
    { id: 'gearRpm', span: 1 },
    { id: 'pedals', span: 1 },
    { id: 'trackMap', span: 2 }
  ],
  novice: [
    { id: 'speedometer', span: 1 },
    { id: 'gearRpm', span: 1 },
    { id: 'pedals', span: 1 },
    { id: 'tractionBudget', span: 1 },
    { id: 'liveTiming', span: 1 },
    { id: 'trackMap', span: 2 }
  ],
  intermediate: [
    { id: 'speedometer', span: 1 },
    { id: 'gearRpm', span: 1 },
    { id: 'pedals', span: 1 },
    { id: 'tractionBudget', span: 1 },
    { id: 'steeringBalance', span: 1 },
    { id: 'liveTiming', span: 1 },
    { id: 'frictionCircle', span: 2 },
    { id: 'trackMap', span: 2 }
  ],
  advanced: [
    { id: 'speedometer', span: 1 },
    { id: 'gearRpm', span: 1 },
    { id: 'pedals', span: 1 },
    { id: 'tractionBudget', span: 1 },
    { id: 'steeringBalance', span: 1 },
    { id: 'liveTiming', span: 1 },
    { id: 'telemetryTraces', span: 2 },
    { id: 'frictionCircle', span: 2 },
    { id: 'trackMap', span: 2 }
  ],
  expert: [
    { id: 'speedometer', span: 1 },
    { id: 'gearRpm', span: 1 },
    { id: 'pedals', span: 1 },
    { id: 'tractionBudget', span: 1 },
    { id: 'steeringBalance', span: 1 },
    { id: 'liveTiming', span: 1 },
    { id: 'telemetryTraces', span: 2 },
    { id: 'tireSuspension', span: 2 },
    { id: 'frictionCircle', span: 2 },
    { id: 'trackMap', span: 2 }
  ]
};

export const DEFAULT_PRACTICE_LAYOUT: PracticeViewLayout = {
  preset: 'intermediate',
  isCustom: false,
  widgets: [...PRESET_LAYOUTS.intermediate]
};
