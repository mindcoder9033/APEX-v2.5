import { LapAnalysis } from './telemetry';

export type DriverLevel = 'Beginner' | 'Novice' | 'Intermediate' | 'Advanced' | 'Expert';

export interface MedalThresholds {
  bronze: number;
  silver: number;
  gold: number;
}

export type MedalTier = 'bronze' | 'silver' | 'gold' | 'none';

export interface SessionChallengeCriteria {
  id: string;
  name: string;
  description: string;
  metric: 
    | 'traction_budget_pct'
    | 'braking_rise_time_ms'
    | 'trail_braking_score'
    | 'apex_speed_delta_kph'
    | 'steering_smoothness_score'
    | 'throttle_unwind_score'
    | 'slip_angle_window'
    | 'lap_delta_variance_sec'
    | 'overall_lap_score';
  operator: 'gte' | 'lte' | 'within_range';
  targetValue: number;
  minValue?: number;
  maxValue?: number;
  unit: string;
  requiredLaps: number; // e.g. 2 or 3 consecutive laps
  medals?: MedalThresholds;
}

export type GameType = 'Circuit Race' | 'Timed Race' | 'Drift' | 'Test Drive';

export type TimeOfDay = 
  | 'Sunrise' 
  | 'Morning' 
  | 'Late Morning' 
  | 'Noon' 
  | 'Afternoon' 
  | 'Late Afternoon' 
  | 'Evening' 
  | 'Sunset' 
  | 'Night' 
  | 'Midnight';

export type WeatherCondition = 
  | 'Rain at end'
  | 'Rain at start'
  | 'Clear'
  | 'Mostly Clear'
  | 'Partly Cloudy'
  | 'Cloudy'
  | 'Looming Clouds'
  | 'Thunder Clouds'
  | 'Thin Haze'
  | 'Patchy Fog'
  | 'Dense Fog'
  | 'Overcast Dry'
  | 'Overcast Wet'
  | 'Drizzle'
  | 'Light Rain'
  | 'Moderate Rain'
  | 'Heavy Rain'
  | 'Thunderstorm'
  | 'Rainstorm';

export interface RecommendedEventSetup {
  car: string;
  altCar?: string;
  track: string;
  gameType: GameType;
  timeOfDay: TimeOfDay;
  weather: WeatherCondition;
  laps: number;
  drivatars: number;
  notes?: string;
}

export interface Session {
  id: string;
  moduleId: string;
  sessionNumber: number;
  title: string;
  subtitle: string;
  bookReference: string; // e.g. "Going Faster Chapter 4, pp. 62-78"
  theorySummary: string[];
  keyPrinciples: { title: string; explanation: string }[];
  drillGoal: string;
  targetMetrics: { label: string; value: string; hint: string }[];
  challenge: SessionChallengeCriteria;
  recommendedSetup: RecommendedEventSetup;
}

export interface GraduationRequirement {
  title: string;
  description: string;
  metric: string;
  targetText: string;
  minScorePct: number;
}

export interface ModuleGraduationTest {
  id: string;
  moduleId: string;
  title: string;
  examOverview: string;
  trackName: string;
  carName: string;
  altCarName?: string;
  requiredLaps: number;
  passingScorePct: number; // e.g. 80% (Silver)
  requirements: GraduationRequirement[];
  recommendedSetup: RecommendedEventSetup;
}

export interface Module {
  id: string;
  driverLevel: DriverLevel;
  moduleNumber: number;
  title: string;
  tagline: string;
  bookChapter: string;
  iconName: string; // Lucide icon identifier
  description: string;
  sessions: Session[];
  graduationTest: ModuleGraduationTest;
}

export interface ChallengeResult {
  challengeId: string;
  passed: boolean;
  score: number;
  achievedValue: number;
  targetText: string;
  medal?: MedalTier;
  lapsCount: number;
  completedAt: string;
  notes: string;
}

export interface ChallengeAttempt {
  id: string;
  attemptNumber: number;
  timestamp: string;
  result: ChallengeResult;
  laps: LapAnalysis[];
}

export interface GraduationResult {
  testId: string;
  passed: boolean;
  scorePct: number;
  completedAt: string;
  lapAnalyses: LapAnalysis[];
  badgeUnlocked: string;
}

export interface UserProgressState {
  selectedDriverLevel?: DriverLevel;
  unlockedDriverLevels?: DriverLevel[];
  unlockedModuleIds: string[];
  unlockedSessionIds: string[];
  completedSessionIds: string[];
  graduatedModuleIds: string[];
  sessionBestScores: Record<string, number>; // sessionId -> score
  challengeResults: Record<string, ChallengeResult>;
  challengeAttempts?: Record<string, ChallengeAttempt[]>; // sessionId -> ChallengeAttempt[]
  graduationResults: Record<string, GraduationResult>;
  totalLapsDriven: number;
  totalTimeMinutes: number;
}
