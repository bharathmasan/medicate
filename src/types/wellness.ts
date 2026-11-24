export type NavigationSection =
  | 'dashboard'
  | 'tracking'
  | 'analysis'
  | 'exercises'
  | 'challenges'
  | 'analytics';

export type MoodScore = 1 | 2 | 3 | 4 | 5;

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export type MentalState =
  | 'Clear'
  | 'Reflective'
  | 'Present'
  | 'Foggy'
  | 'Racing'
  | 'Drained';

export type EmotionOption =
  | 'Calm'
  | 'Grateful'
  | 'Hopeful'
  | 'Focused'
  | 'Grounded'
  | 'Joyful'
  | 'Anxious'
  | 'Overwhelmed'
  | 'Restless'
  | 'Tired'
  | 'Irritable'
  | 'Tender';

export type TriggerOption =
  | 'Work & Deadlines'
  | 'Sleep Quality'
  | 'Social Connection'
  | 'Physical Movement'
  | 'Screen Time'
  | 'Nature & Outdoors'
  | 'Quiet Solitude'
  | 'Family & Home'
  | 'Finances'
  | 'Caffeine & Diet';

export interface MindEntry {
  id: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO timestamp
  timeOfDay: TimeOfDay;
  mood: MoodScore;
  stress: number; // 1-10
  energy: number; // 1-10
  mentalState: MentalState;
  emotions: EmotionOption[];
  triggers: TriggerOption[];
  thoughts: string;
  gratitudeNote?: string;
}

export type ExerciseCategory =
  | 'Breathing'
  | 'Meditation'
  | 'Mindfulness'
  | 'Gratitude'
  | 'Reflection'
  | 'Focus'
  | 'Relaxation';

export type ExerciseModality =
  | 'breathing'
  | 'meditation'
  | 'grounding'
  | 'reflection'
  | 'focus';

export interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
  recommendedCycles: number;
}

export interface ExerciseDefinition {
  id: string;
  title: string;
  subtitle: string;
  category: ExerciseCategory;
  modality: ExerciseModality;
  durationMinutes: number;
  benefit: string;
  imageUrl?: string;
  imageAlt?: string;
  breathingPatternId?: string;
  guidedSteps?: string[];
  reflectionPrompts?: string[];
}

export interface ExerciseSessionLog {
  id: string;
  exerciseId: string;
  title: string;
  category: ExerciseCategory;
  durationMinutes: number;
  completedAt: string; // ISO timestamp
  date: string; // YYYY-MM-DD
  notes?: string;
  reflectionResponses?: { prompt: string; answer: string }[];
  focusReturns?: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  category: ExerciseCategory | 'Habit';
  durationMinutes: number;
  completedDates: string[]; // YYYY-MM-DD[]
  isCustom?: boolean;
  linkedExerciseId?: string;
}

export interface ReminderSettings {
  enabled: boolean;
  morningCheckIn: string; // HH:mm
  eveningReflection: string; // HH:mm
  breathingBreak: string; // HH:mm
  gentleInAppNudge: boolean;
}

export interface WellnessState {
  userName: string;
  entries: MindEntry[];
  sessions: ExerciseSessionLog[];
  challenges: DailyChallenge[];
  reminders: ReminderSettings;
  usingSampleData: boolean;
}

export const MOOD_LABELS: Record<MoodScore, { label: string; short: string; description: string }> = {
  1: { label: 'Struggling', short: 'Struggling', description: 'Heavy, difficult, or needing extra care' },
  2: { label: 'Low', short: 'Low', description: 'Subdued, stretched thin, or uneasy' },
  3: { label: 'Steady', short: 'Steady', description: 'Balanced, neutral, moving through the day' },
  4: { label: 'Good', short: 'Good', description: 'Warm, grounded, and generally at ease' },
  5: { label: 'Flourishing', short: 'Flourishing', description: 'Clear, energized, and deeply present' },
};

export const EMOTION_OPTIONS: EmotionOption[] = [
  'Calm',
  'Grateful',
  'Hopeful',
  'Focused',
  'Grounded',
  'Joyful',
  'Anxious',
  'Overwhelmed',
  'Restless',
  'Tired',
  'Irritable',
  'Tender',
];

export const TRIGGER_OPTIONS: TriggerOption[] = [
  'Work & Deadlines',
  'Sleep Quality',
  'Social Connection',
  'Physical Movement',
  'Screen Time',
  'Nature & Outdoors',
  'Quiet Solitude',
  'Family & Home',
  'Finances',
  'Caffeine & Diet',
];

export const MENTAL_STATE_OPTIONS: MentalState[] = [
  'Clear',
  'Present',
  'Reflective',
  'Foggy',
  'Racing',
  'Drained',
];
