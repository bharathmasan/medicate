import { createInitialSampleState } from '../data/seedData';
import { WellnessState } from '../types/wellness';

const STORAGE_KEY = 'medicate_wellness_state_v1';

export function loadWellnessState(): WellnessState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createInitialSampleState();
      saveWellnessState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as Partial<WellnessState>;
    if (!parsed || !Array.isArray(parsed.entries) || !Array.isArray(parsed.sessions)) {
      const fallback = createInitialSampleState();
      saveWellnessState(fallback);
      return fallback;
    }
    const defaults = createInitialSampleState();
    return {
      userName: typeof parsed.userName === 'string' ? parsed.userName : defaults.userName,
      entries: parsed.entries,
      sessions: parsed.sessions,
      challenges: Array.isArray(parsed.challenges) ? parsed.challenges : defaults.challenges,
      reminders: parsed.reminders ? { ...defaults.reminders, ...parsed.reminders } : defaults.reminders,
      usingSampleData: Boolean(parsed.usingSampleData),
    };
  } catch {
    return createInitialSampleState();
  }
}

export function saveWellnessState(state: WellnessState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Gracefully handle restricted storage environments
  }
}

export function clearAllWellnessData(userName: string): WellnessState {
  const defaults = createInitialSampleState();
  const emptyState: WellnessState = {
    userName: userName || 'Friend',
    entries: [],
    sessions: [],
    challenges: defaults.challenges.map((c) => ({ ...c, completedDates: [] })),
    reminders: defaults.reminders,
    usingSampleData: false,
  };
  saveWellnessState(emptyState);
  return emptyState;
}

export function exportWellnessStateAsJSON(state: WellnessState): void {
  const payload = {
    exportedFrom: 'Medicate Personal Wellness Companion',
    exportedAt: new Date().toISOString(),
    disclaimer: 'Personal self-tracked wellness reflections. Not a medical or diagnostic record.',
    data: state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `medicate-personal-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
