import { daysAgoISO } from '../data/seedData';
import {
  EmotionOption,
  ExerciseCategory,
  ExerciseSessionLog,
  MindEntry,
  TriggerOption,
  WellnessState,
} from '../types/wellness';

export interface DailySeriesPoint {
  date: string;
  label: string;
  mood: number | null;
  stress: number | null;
  energy: number | null;
  minutes: number;
}

export interface TriggerCorrelation {
  trigger: TriggerOption;
  count: number;
  avgStress: number;
  avgMood: number;
  stressDelta: number; // vs overall avg stress
  moodDelta: number; // vs overall avg mood
}

export interface EmotionBreakdown {
  emotion: EmotionOption;
  count: number;
  percentage: number;
}

export interface ObservationInsight {
  id: string;
  title: string;
  observation: string;
  basis: string;
  tone: 'restorative' | 'attention' | 'neutral';
}

export interface MilestoneItem {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  unit: string;
  achieved: boolean;
}

export function formatShortDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const safeName = name.trim() ? `, ${name.trim()}` : '';
  if (hour < 12) return `Good morning${safeName}`;
  if (hour < 17) return `Good afternoon${safeName}`;
  return `Good evening${safeName}`;
}

export function computeMindfulnessStreak(
  entries: MindEntry[],
  sessions: ExerciseSessionLog[]
): number {
  const activeDates = new Set<string>();
  entries.forEach((e) => activeDates.add(e.date));
  sessions.forEach((s) => activeDates.add(s.date));

  if (activeDates.size === 0) return 0;

  let streak = 0;
  let offset = 0;
  // Allow streak to stay alive if today has not been logged yet, starting from yesterday
  if (!activeDates.has(daysAgoISO(0))) {
    if (!activeDates.has(daysAgoISO(1))) {
      return 0;
    }
    offset = 1;
  }

  while (activeDates.has(daysAgoISO(offset))) {
    streak += 1;
    offset += 1;
    if (offset > 365) break;
  }
  return streak;
}

export function buildDailySeries(
  entries: MindEntry[],
  sessions: ExerciseSessionLog[],
  days: number
): DailySeriesPoint[] {
  const points: DailySeriesPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = daysAgoISO(i);
    const dayEntries = entries.filter((e) => e.date === date);
    const daySessions = sessions.filter((s) => s.date === date);

    const mood =
      dayEntries.length > 0
        ? Number((dayEntries.reduce((acc, e) => acc + e.mood, 0) / dayEntries.length).toFixed(1))
        : null;
    const stress =
      dayEntries.length > 0
        ? Number((dayEntries.reduce((acc, e) => acc + e.stress, 0) / dayEntries.length).toFixed(1))
        : null;
    const energy =
      dayEntries.length > 0
        ? Number((dayEntries.reduce((acc, e) => acc + e.energy, 0) / dayEntries.length).toFixed(1))
        : null;
    const minutes = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

    points.push({
      date,
      label: formatShortDate(date),
      mood,
      stress,
      energy,
      minutes,
    });
  }

  return points;
}

export function computePeriodMetrics(entries: MindEntry[], sessions: ExerciseSessionLog[], days: number) {
  const cutoffCurrent = daysAgoISO(days - 1);
  const cutoffPrevStart = daysAgoISO(days * 2 - 1);
  const cutoffPrevEnd = daysAgoISO(days);

  const currentEntries = entries.filter((e) => e.date >= cutoffCurrent);
  const prevEntries = entries.filter((e) => e.date >= cutoffPrevStart && e.date <= cutoffPrevEnd);

  const currentSessions = sessions.filter((s) => s.date >= cutoffCurrent);
  const prevSessions = sessions.filter((s) => s.date >= cutoffPrevStart && s.date <= cutoffPrevEnd);

  const avg = (list: MindEntry[], key: 'mood' | 'stress' | 'energy') =>
    list.length > 0 ? Number((list.reduce((s, e) => s + e[key], 0) / list.length).toFixed(1)) : null;

  const mood = avg(currentEntries, 'mood');
  const prevMood = avg(prevEntries, 'mood');
  const stress = avg(currentEntries, 'stress');
  const prevStress = avg(prevEntries, 'stress');
  const energy = avg(currentEntries, 'energy');
  const prevEnergy = avg(prevEntries, 'energy');

  const mindfulMinutes = currentSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const prevMindfulMinutes = prevSessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  return {
    entryCount: currentEntries.length,
    sessionCount: currentSessions.length,
    mood,
    moodDelta: mood !== null && prevMood !== null ? Number((mood - prevMood).toFixed(1)) : null,
    stress,
    stressDelta: stress !== null && prevStress !== null ? Number((stress - prevStress).toFixed(1)) : null,
    energy,
    energyDelta: energy !== null && prevEnergy !== null ? Number((energy - prevEnergy).toFixed(1)) : null,
    mindfulMinutes,
    minutesDelta: mindfulMinutes - prevMindfulMinutes,
  };
}

export function computeEmotionBreakdown(entries: MindEntry[]): EmotionBreakdown[] {
  const counts = new Map<EmotionOption, number>();
  let totalTags = 0;

  entries.forEach((entry) => {
    entry.emotions.forEach((em) => {
      counts.set(em, (counts.get(em) || 0) + 1);
      totalTags += 1;
    });
  });

  if (totalTags === 0) return [];

  return Array.from(counts.entries())
    .map(([emotion, count]) => ({
      emotion,
      count,
      percentage: Math.round((count / totalTags) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

export function computeTriggerCorrelations(entries: MindEntry[]): TriggerCorrelation[] {
  if (entries.length === 0) return [];

  const baselineStress = entries.reduce((sum, e) => sum + e.stress, 0) / entries.length;
  const baselineMood = entries.reduce((sum, e) => sum + e.mood, 0) / entries.length;

  const grouped = new Map<TriggerOption, { stress: number[]; mood: number[] }>();

  entries.forEach((entry) => {
    entry.triggers.forEach((t) => {
      const curr = grouped.get(t) || { stress: [], mood: [] };
      curr.stress.push(entry.stress);
      curr.mood.push(entry.mood);
      grouped.set(t, curr);
    });
  });

  return Array.from(grouped.entries())
    .map(([trigger, vals]) => {
      const avgStress = Number((vals.stress.reduce((a, b) => a + b, 0) / vals.stress.length).toFixed(1));
      const avgMood = Number((vals.mood.reduce((a, b) => a + b, 0) / vals.mood.length).toFixed(1));
      return {
        trigger,
        count: vals.stress.length,
        avgStress,
        avgMood,
        stressDelta: Number((avgStress - baselineStress).toFixed(1)),
        moodDelta: Number((avgMood - baselineMood).toFixed(1)),
      };
    })
    .sort((a, b) => b.stressDelta - a.stressDelta);
}

export function computeWeekdayVsWeekend(entries: MindEntry[]) {
  const weekday: MindEntry[] = [];
  const weekend: MindEntry[] = [];

  entries.forEach((e) => {
    const [y, m, d] = e.date.split('-').map(Number);
    const day = new Date(y, m - 1, d).getDay();
    if (day === 0 || day === 6) weekend.push(e);
    else weekday.push(e);
  });

  const summarize = (arr: MindEntry[]) => ({
    count: arr.length,
    avgMood: arr.length ? Number((arr.reduce((s, e) => s + e.mood, 0) / arr.length).toFixed(1)) : null,
    avgStress: arr.length ? Number((arr.reduce((s, e) => s + e.stress, 0) / arr.length).toFixed(1)) : null,
    avgEnergy: arr.length ? Number((arr.reduce((s, e) => s + e.energy, 0) / arr.length).toFixed(1)) : null,
  });

  return {
    weekday: summarize(weekday),
    weekend: summarize(weekend),
  };
}

export function extractThoughtThemes(entries: MindEntry[]): { theme: string; mentions: number }[] {
  const dictionaries: { theme: string; keywords: string[] }[] = [
    { theme: 'Rest & Sleep Rhythm', keywords: ['sleep', 'slept', 'rest', 'midnight', 'tired', 'bed', 'wake'] },
    { theme: 'Work & Pacing', keywords: ['work', 'deadline', 'meeting', 'inbox', 'call', 'email', 'monday', 'priority'] },
    { theme: 'Breath & Grounding', keywords: ['breath', 'breathing', 'walk', 'scan', 'pause', 'quiet', 'still', 'steady'] },
    { theme: 'Screen & Attention', keywords: ['phone', 'screen', 'scroll', 'scrolling', 'focus', 'fog', 'fragmented'] },
    { theme: 'Connection & Warmth', keywords: ['friend', 'sister', 'family', 'dinner', 'coffee', 'support', 'laughter'] },
  ];

  const results = dictionaries.map(({ theme, keywords }) => {
    let mentions = 0;
    entries.forEach((entry) => {
      const text = `${entry.thoughts} ${entry.gratitudeNote || ''}`.toLowerCase();
      if (keywords.some((kw) => text.includes(kw))) {
        mentions += 1;
      }
    });
    return { theme, mentions };
  });

  return results.filter((r) => r.mentions > 0).sort((a, b) => b.mentions - a.mentions);
}

export function generatePersonalObservations(state: WellnessState): ObservationInsight[] {
  const { entries, sessions } = state;
  if (entries.length < 2) {
    return [
      {
        id: 'obs-starter',
        title: 'Building your personal baseline',
        observation:
          'Log at least two daily mind check-ins to surface recurring emotional patterns, possible stress associations, and restorative habits.',
        basis: `${entries.length} check-in recorded`,
        tone: 'neutral',
      },
    ];
  }

  const insights: ObservationInsight[] = [];
  const triggers = computeTriggerCorrelations(entries);
  const emotions = computeEmotionBreakdown(entries);
  const weekSplit = computeWeekdayVsWeekend(entries);

  const highestStressTrigger = triggers.find((t) => t.count >= 2 && t.stressDelta >= 0.6);
  if (highestStressTrigger) {
    insights.push({
      id: 'obs-stress-trigger',
      title: `Elevated tension observed around ${highestStressTrigger.trigger}`,
      observation: `On entries noting ${highestStressTrigger.trigger}, your average stress level was ${highestStressTrigger.avgStress}/10 (+${highestStressTrigger.stressDelta} above your personal baseline). Scheduling a brief breathing pause before or after may help soften the load.`,
      basis: `Observed across ${highestStressTrigger.count} logged check-ins`,
      tone: 'attention',
    });
  }

  const mostRestorative = [...triggers]
    .filter((t) => t.count >= 2 && t.moodDelta >= 0.2)
    .sort((a, b) => b.moodDelta - a.moodDelta)[0];

  if (mostRestorative) {
    insights.push({
      id: 'obs-restorative',
      title: `${mostRestorative.trigger} aligns with calmer days`,
      observation: `Entries mentioning ${mostRestorative.trigger} averaged a ${mostRestorative.avgMood}/5 mood rating and ${mostRestorative.avgStress}/10 stress—noticeably steadier than your overall average.`,
      basis: `Observed across ${mostRestorative.count} logged check-ins`,
      tone: 'restorative',
    });
  }

  if (
    weekSplit.weekday.avgStress !== null &&
    weekSplit.weekend.avgStress !== null &&
    weekSplit.weekday.avgStress - weekSplit.weekend.avgStress >= 1.0
  ) {
    insights.push({
      id: 'obs-weekday-shift',
      title: 'Noticeable weekday-to-weekend recovery pattern',
      observation: `Your weekday stress averages ${weekSplit.weekday.avgStress}/10 compared to ${weekSplit.weekend.avgStress}/10 on weekends. Bringing one small weekend anchor into mid-week afternoons could smooth the contrast.`,
      basis: `${weekSplit.weekday.count} weekday · ${weekSplit.weekend.count} weekend entries`,
      tone: 'neutral',
    });
  }

  if (emotions.length > 0) {
    const topTwo = emotions.slice(0, 2).map((e) => e.emotion).join(' and ');
    insights.push({
      id: 'obs-top-emotions',
      title: `Most frequent emotional tones: ${topTwo}`,
      observation: `Across your recent check-ins, ${emotions[0].emotion} appeared in ${emotions[0].count} entries (${emotions[0].percentage}% of all logged emotions). Tracking subtle shifts helps you recognize your personal rhythm early.`,
      basis: `${entries.length} total check-ins analyzed`,
      tone: 'neutral',
    });
  }

  if (sessions.length >= 3) {
    const sessionDates = new Set(sessions.map((s) => s.date));
    const entriesWithPractice = entries.filter((e) => sessionDates.has(e.date));
    const entriesWithoutPractice = entries.filter((e) => !sessionDates.has(e.date));
    if (entriesWithPractice.length >= 2 && entriesWithoutPractice.length >= 2) {
      const avgWith =
        entriesWithPractice.reduce((s, e) => s + e.mood, 0) / entriesWithPractice.length;
      const avgWithout =
        entriesWithoutPractice.reduce((s, e) => s + e.mood, 0) / entriesWithoutPractice.length;
      if (avgWith >= avgWithout) {
        insights.push({
          id: 'obs-practice-lift',
          title: 'Mindful practice days trend steadier',
          observation: `Days when you completed a guided exercise averaged ${avgWith.toFixed(1)}/5 mood versus ${avgWithout.toFixed(1)}/5 on days without an exercise session.`,
          basis: `${sessions.length} completed practice sessions`,
          tone: 'restorative',
        });
      }
    }
  }

  return insights.slice(0, 4);
}

export function computeExerciseCategoryStats(sessions: ExerciseSessionLog[]) {
  const categories: ExerciseCategory[] = [
    'Breathing',
    'Meditation',
    'Mindfulness',
    'Gratitude',
    'Reflection',
    'Focus',
    'Relaxation',
  ];

  return categories.map((category) => {
    const matching = sessions.filter((s) => s.category === category);
    return {
      category,
      sessions: matching.length,
      minutes: matching.reduce((sum, s) => sum + s.durationMinutes, 0),
    };
  });
}

export function computeMilestones(state: WellnessState): MilestoneItem[] {
  const streak = computeMindfulnessStreak(state.entries, state.sessions);
  const totalMinutes = state.sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const breathingSessions = state.sessions.filter(
    (s) => s.category === 'Breathing' || s.category === 'Relaxation'
  ).length;
  const reflectionSessions = state.sessions.filter(
    (s) => s.category === 'Gratitude' || s.category === 'Reflection'
  ).length;
  const totalChallengeCompletions = state.challenges.reduce(
    (sum, c) => sum + c.completedDates.length,
    0
  );

  return [
    {
      id: 'm-first-week',
      title: 'Steady Rhythm',
      description: 'Maintain a 5-day mindfulness or check-in streak.',
      current: Math.min(streak, 5),
      target: 5,
      unit: 'days',
      achieved: streak >= 5,
    },
    {
      id: 'm-ten-checkins',
      title: 'Mindful Observer',
      description: 'Record 10 daily mind check-ins to map your emotional patterns.',
      current: Math.min(state.entries.length, 10),
      target: 10,
      unit: 'entries',
      achieved: state.entries.length >= 10,
    },
    {
      id: 'm-breath-calm',
      title: 'Breathwork Anchor',
      description: 'Complete 3 guided breathing or relaxation sessions.',
      current: Math.min(breathingSessions, 3),
      target: 3,
      unit: 'sessions',
      achieved: breathingSessions >= 3,
    },
    {
      id: 'm-mindful-30',
      title: 'Thirty Quiet Minutes',
      description: 'Accumulate 30 minutes of guided mental exercises.',
      current: Math.min(totalMinutes, 30),
      target: 30,
      unit: 'min',
      achieved: totalMinutes >= 30,
    },
    {
      id: 'm-gratitude',
      title: 'Gratitude Keeper',
      description: 'Complete 2 gratitude or positive reflection sessions.',
      current: Math.min(reflectionSessions, 2),
      target: 2,
      unit: 'reflections',
      achieved: reflectionSessions >= 2,
    },
    {
      id: 'm-challenges',
      title: 'Consistent Care',
      description: 'Check off 15 daily wellness challenge completions.',
      current: Math.min(totalChallengeCompletions, 15),
      target: 15,
      unit: 'completed',
      achieved: totalChallengeCompletions >= 15,
    },
  ];
}

export function buildReflectionSummaryText(state: WellnessState): string {
  const metrics30 = computePeriodMetrics(state.entries, state.sessions, 30);
  const emotions = computeEmotionBreakdown(state.entries).slice(0, 5);
  const triggers = computeTriggerCorrelations(state.entries).slice(0, 5);
  const observations = generatePersonalObservations(state);

  const lines = [
    'MEDICATE — PERSONAL WELLNESS REFLECTION SUMMARY',
    `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    '',
    'IMPORTANT NOTE: This summary reflects self-reported personal observations only.',
    'It is not a clinical assessment or medical diagnosis.',
    '',
    '30-DAY SNAPSHOT',
    `- Check-ins recorded: ${metrics30.entryCount}`,
    `- Average Mood: ${metrics30.mood ?? 'N/A'} / 5`,
    `- Average Stress: ${metrics30.stress ?? 'N/A'} / 10`,
    `- Average Energy: ${metrics30.energy ?? 'N/A'} / 10`,
    `- Guided Practice: ${metrics30.mindfulMinutes} minutes across ${metrics30.sessionCount} sessions`,
    '',
    'MOST FREQUENT EMOTIONS',
    ...emotions.map((e) => `- ${e.emotion}: ${e.count} entries (${e.percentage}%)`),
    '',
    'CONTEXT & TRIGGER ASSOCIATIONS',
    ...triggers.map(
      (t) =>
        `- ${t.trigger}: avg stress ${t.avgStress}/10 (${t.stressDelta >= 0 ? '+' : ''}${t.stressDelta} vs baseline), avg mood ${t.avgMood}/5`
    ),
    '',
    'PATTERN OBSERVATIONS',
    ...observations.map((o) => `- ${o.title}: ${o.observation}`),
  ];

  return lines.join('\n');
}
