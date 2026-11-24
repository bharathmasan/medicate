import { useMemo, useState } from 'react';
import { Bell, Check, Play, Plus, Trash2 } from 'lucide-react';
import { daysAgoISO } from '../data/seedData';
import {
  DailyChallenge,
  ExerciseCategory,
  MindEntry,
  ReminderSettings,
} from '../types/wellness';
import { formatShortDate } from '../utils/analytics';

interface DailyChallengesViewProps {
  challenges: DailyChallenge[];
  entries: MindEntry[];
  reminders: ReminderSettings;
  onToggleChallenge: (challengeId: string, dateISO: string) => void;
  onAddChallenge: (challenge: Omit<DailyChallenge, 'id' | 'completedDates'>) => void;
  onDeleteChallenge: (challengeId: string) => void;
  onUpdateReminders: (reminders: ReminderSettings) => void;
  onLaunchExercise: (exerciseId: string) => void;
}

export function DailyChallengesView({
  challenges,
  entries,
  reminders,
  onToggleChallenge,
  onAddChallenge,
  onDeleteChallenge,
  onUpdateReminders,
  onLaunchExercise,
}: DailyChallengesViewProps) {
  const todayISO = daysAgoISO(0);
  const last7Days = useMemo(() => [6, 5, 4, 3, 2, 1, 0].map((d) => daysAgoISO(d)), []);

  // Custom goal composer
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExerciseCategory | 'Habit'>('Habit');
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [error, setError] = useState('');
  const [reminderStatus, setReminderStatus] = useState('');

  const completedTodayCount = useMemo(
    () => challenges.filter((c) => c.completedDates.includes(todayISO)).length,
    [challenges, todayISO]
  );

  const progressPct =
    challenges.length > 0 ? Math.round((completedTodayCount / challenges.length) * 100) : 0;

  // Personalized gentle suggestion based on recent entries
  const adaptiveSuggestion = useMemo(() => {
    const recent = entries.slice(0, 3);
    if (recent.length === 0) {
      return {
        title: 'Start with a two-minute check-in',
        body: 'Keeping daily goals small and achievable helps build sustainable care without pressure.',
      };
    }
    const avgStress = recent.reduce((s, e) => s + e.stress, 0) / recent.length;
    const avgEnergy = recent.reduce((s, e) => s + e.energy, 0) / recent.length;
    if (avgStress >= 6) {
      return {
        title: 'Prioritize nervous-system downshifts today',
        body: `Your recent stress averaged ${avgStress.toFixed(1)}/10. Focus on your midday Box Breathing pause and a screen-free wind-down tonight.`,
      };
    }
    if (avgEnergy <= 4.5) {
      return {
        title: 'Protect gentle restoration today',
        body: `Your recent energy averaged ${avgEnergy.toFixed(1)}/10. Ten minutes of natural daylight and an earlier evening wind-down are great anchors today.`,
      };
    }
    return {
      title: 'Reinforce what is already working',
      body: 'Your recent mood and energy look steady. Recording one specific gratitude anchor helps consolidate calm habits.',
    };
  }, [entries]);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) {
      setError('Enter a short, clear title for your personal wellness goal.');
      return;
    }
    onAddChallenge({
      title: title.trim(),
      description:
        description.trim() || 'Personal daily habit created to support your mental balance.',
      category,
      durationMinutes,
      isCustom: true,
    });
    setTitle('');
    setDescription('');
    setDurationMinutes(5);
    setError('');
  };

  const handleSaveReminders = (patch: Partial<ReminderSettings>) => {
    const updated = { ...reminders, ...patch };
    onUpdateReminders(updated);
    setReminderStatus('Reminder schedule saved.');
    window.setTimeout(() => setReminderStatus(''), 3000);
  };

  const handleRequestBrowserNotify = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setReminderStatus('Browser notifications are unavailable here; gentle in-app cues remain active.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setReminderStatus('Browser reminders enabled alongside your gentle in-app schedule.');
      } else {
        setReminderStatus('Gentle in-app reminders will appear inside Medicate.');
      }
    } catch {
      setReminderStatus('Gentle in-app reminders remain active.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-3xl font-medium tracking-tight text-[#1A1D2E]">Daily Challenges</h1>
        <p className="text-sm text-[#5A617A] max-w-2xl">
          Small, realistic daily practices designed to support emotional balance without perfectionism.
        </p>
      </div>

      {/* Top Progress + Adaptive Suggestion */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white border border-[#E5E8F2] rounded-2xl p-6 flex flex-col justify-between space-y-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="text-xl font-medium text-[#1A1D2E]">Today’s Progress</h2>
              <p className="text-xs text-[#767E98] mt-0.5">
                {formatShortDate(todayISO)} · Complete at your own pace
              </p>
            </div>
            <div className="font-mono text-2xl font-medium tabular-nums text-[#5B49B8]">
              {completedTodayCount} / {challenges.length}
              <span className="text-xs font-sans text-[#767E98] ml-1.5">({progressPct}%)</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-2.5 w-full bg-[#F3F5FA] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#5B49B8] to-[#4A89C8] rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-[#5A617A]">
              {progressPct === 100
                ? 'You completed every planned daily practice today. Well done.'
                : 'Even one completed habit counts toward steadier mental care.'}
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#F5F3FF] border border-[#DDD6FE] rounded-2xl p-6 flex flex-col justify-between space-y-2">
          <div className="text-xs font-medium text-[#5B49B8]">Personalized Daily Focus</div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-medium text-[#1A1D2E]">{adaptiveSuggestion.title}</h2>
            <p className="text-xs leading-relaxed text-[#3A3F58]">{adaptiveSuggestion.body}</p>
          </div>
        </div>
      </section>

      {/* Main Split: Challenges List + Custom Goal & Reminders */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Interactive Challenges List */}
        <section className="xl:col-span-7 bg-white border border-[#E5E8F2] rounded-2xl p-6 space-y-4">
          <div className="pb-4 border-b border-[#E5E8F2] flex items-center justify-between">
            <div>
              <h2 className="text-xl font-medium text-[#1A1D2E]">Active Wellness Goals</h2>
              <p className="text-xs text-[#767E98] mt-0.5">
                Tap any goal to check off today, or review your 7-day consistency
              </p>
            </div>
          </div>

          <div className="divide-y divide-[#E5E8F2]">
            {challenges.map((ch) => {
              const doneToday = ch.completedDates.includes(todayISO);
              const weekHits = last7Days.filter((d) => ch.completedDates.includes(d)).length;

              return (
                <div key={ch.id} className="py-5 first:pt-2 last:pb-1 space-y-3">
                  <div className="flex items-start gap-3.5">
                    <button
                      type="button"
                      onClick={() => onToggleChallenge(ch.id, todayISO)}
                      aria-pressed={doneToday}
                      aria-label={`Toggle ${ch.title}`}
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        doneToday
                          ? 'bg-[#5B49B8] border-[#5B49B8] text-white'
                          : 'bg-white border-[#C5CBE0] hover:border-[#5B49B8]'
                      }`}
                    >
                      {doneToday && <Check className="h-4 w-4" strokeWidth={2.5} />}
                    </button>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            doneToday ? 'text-[#767E98] line-through' : 'text-[#1A1D2E]'
                          }`}
                        >
                          {ch.title}
                        </span>
                        <span className="text-xs text-[#767E98] tabular-nums">
                          {ch.category} · {ch.durationMinutes} min · {weekHits}/7 days
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-[#5A617A]">{ch.description}</p>
                    </div>
                  </div>

                  {/* 7-day consistency strip + optional action */}
                  <div className="pl-9 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5" aria-label="7-day completion history">
                      {last7Days.map((dayISO) => {
                        const hit = ch.completedDates.includes(dayISO);
                        return (
                          <button
                            key={dayISO}
                            type="button"
                            title={`${formatShortDate(dayISO)}: ${hit ? 'Completed' : 'Not completed'}`}
                            onClick={() => onToggleChallenge(ch.id, dayISO)}
                            className={`h-5 w-5 rounded text-[10px] font-mono tabular-nums transition-colors ${
                              hit
                                ? 'bg-[#5B49B8] text-white'
                                : 'bg-[#F3F5FA] text-[#767E98] hover:bg-[#EDE9FE]'
                            }`}
                          >
                            {dayISO.slice(8)}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-3">
                      {ch.linkedExerciseId && (
                        <button
                          type="button"
                          onClick={() => onLaunchExercise(ch.linkedExerciseId!)}
                          className="text-xs font-medium text-[#5B49B8] hover:text-[#4A3A9C] inline-flex items-center gap-1 whitespace-nowrap"
                        >
                          <Play className="h-3 w-3" aria-hidden="true" />
                          <span>Launch exercise</span>
                        </button>
                      )}
                      {ch.isCustom && (
                        <button
                          type="button"
                          onClick={() => onDeleteChallenge(ch.id)}
                          aria-label={`Remove ${ch.title}`}
                          className="text-xs text-[#767E98] hover:text-[#DC2626] inline-flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Add Custom Goal + Reminder Preferences */}
        <div className="xl:col-span-5 space-y-6">
          {/* Add Custom Goal */}
          <form
            onSubmit={handleCreateGoal}
            className="bg-white border border-[#E5E8F2] rounded-2xl p-6 space-y-4"
          >
            <div className="pb-3 border-b border-[#E5E8F2]">
              <h2 className="text-lg font-medium text-[#1A1D2E]">Add Personal Wellness Goal</h2>
              <p className="text-xs text-[#767E98] mt-0.5">
                Tailor your daily routine with a meaningful habit
              </p>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#3A3F58]">Goal Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g., Afternoon herbal tea away from screens"
                className="w-full h-10 px-3.5 rounded-lg border border-[#E5E8F2] bg-[#F8F9FC] text-sm text-[#1A1D2E] focus:bg-white focus:border-[#5B49B8]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#3A3F58]">
                Why it helps <span className="font-normal text-[#767E98]">(optional)</span>
              </span>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Creates a calm transition between afternoon tasks"
                className="w-full h-10 px-3.5 rounded-lg border border-[#E5E8F2] bg-[#F8F9FC] text-sm text-[#1A1D2E] focus:bg-white focus:border-[#5B49B8]"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[#3A3F58]">Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExerciseCategory | 'Habit')}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E8F2] bg-[#F8F9FC] text-sm text-[#1A1D2E] focus:bg-white focus:border-[#5B49B8]"
                >
                  <option value="Habit">Habit</option>
                  <option value="Mindfulness">Mindfulness</option>
                  <option value="Breathing">Breathing</option>
                  <option value="Gratitude">Gratitude</option>
                  <option value="Relaxation">Relaxation</option>
                  <option value="Focus">Focus</option>
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[#3A3F58]">Minutes</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Math.max(1, Number(e.target.value) || 5))}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E8F2] bg-[#F8F9FC] text-sm font-mono tabular-nums text-[#1A1D2E] focus:bg-white focus:border-[#5B49B8]"
                />
              </label>
            </div>

            {error && <p className="text-xs text-[#DC2626]">{error}</p>}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-[#5B49B8] text-white text-sm font-medium hover:bg-[#4A3A9C] inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Add Daily Goal</span>
            </button>
          </form>

          {/* Gentle Reminder Schedule */}
          <section className="bg-white border border-[#E5E8F2] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E8F2]">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#5B49B8]" aria-hidden="true" />
                <h2 className="text-lg font-medium text-[#1A1D2E]">Gentle Reminders</h2>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={reminders.enabled}
                onClick={() => handleSaveReminders({ enabled: !reminders.enabled })}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  reminders.enabled
                    ? 'bg-[#F5F3FF] text-[#4A3A9C]'
                    : 'bg-[#F3F5FA] text-[#5A617A]'
                }`}
              >
                {reminders.enabled ? 'Active' : 'Paused'}
              </button>
            </div>

            <div className={`space-y-3 ${reminders.enabled ? '' : 'opacity-55 pointer-events-none'}`}>
              <label className="flex items-center justify-between gap-4 text-xs">
                <span className="text-[#3A3F58] font-medium">Morning Check-in</span>
                <input
                  type="time"
                  value={reminders.morningCheckIn}
                  onChange={(e) => handleSaveReminders({ morningCheckIn: e.target.value })}
                  className="h-9 px-2.5 rounded-lg border border-[#E5E8F2] bg-[#F8F9FC] font-mono text-xs text-[#1A1D2E]"
                />
              </label>

              <label className="flex items-center justify-between gap-4 text-xs">
                <span className="text-[#3A3F58] font-medium">Midday Breathing Pause</span>
                <input
                  type="time"
                  value={reminders.breathingBreak}
                  onChange={(e) => handleSaveReminders({ breathingBreak: e.target.value })}
                  className="h-9 px-2.5 rounded-lg border border-[#E5E8F2] bg-[#F8F9FC] font-mono text-xs text-[#1A1D2E]"
                />
              </label>

              <label className="flex items-center justify-between gap-4 text-xs">
                <span className="text-[#3A3F58] font-medium">Evening Reflection</span>
                <input
                  type="time"
                  value={reminders.eveningReflection}
                  onChange={(e) => handleSaveReminders({ eveningReflection: e.target.value })}
                  className="h-9 px-2.5 rounded-lg border border-[#E5E8F2] bg-[#F8F9FC] font-mono text-xs text-[#1A1D2E]"
                />
              </label>
            </div>

            <div className="pt-2 border-t border-[#E5E8F2] space-y-2">
              <button
                type="button"
                onClick={handleRequestBrowserNotify}
                className="text-xs font-medium text-[#5B49B8] hover:text-[#4A3A9C]"
              >
                Enable optional browser notifications
              </button>
              {reminderStatus && <p className="text-xs text-[#5A617A]">{reminderStatus}</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
