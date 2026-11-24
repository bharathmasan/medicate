import { useMemo, useState } from 'react';
import { Check, Pencil, Search, Trash2, X } from 'lucide-react';
import { daysAgoISO } from '../data/seedData';
import {
  EMOTION_OPTIONS,
  EmotionOption,
  MENTAL_STATE_OPTIONS,
  MentalState,
  MindEntry,
  MOOD_LABELS,
  MoodScore,
  TimeOfDay,
  TRIGGER_OPTIONS,
  TriggerOption,
} from '../types/wellness';
import { formatShortDate } from '../utils/analytics';

interface MindTrackingViewProps {
  entries: MindEntry[];
  onSaveEntry: (entry: Omit<MindEntry, 'id' | 'createdAt'>, editingId?: string) => void;
  onDeleteEntry: (id: string) => void;
}

const GENTLE_PROMPTS = [
  'What is taking up the most space in your mind right now?',
  'What moment today brought even a brief sense of calm or steadiness?',
  'If you lowered the pressure by 20% today, what would look different?',
  'What physical sensation do you notice in your shoulders, chest, or breath?',
];

function inferTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export function MindTrackingView({
  entries,
  onSaveEntry,
  onDeleteEntry,
}: MindTrackingViewProps) {
  // Form state
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [date, setDate] = useState<string>(daysAgoISO(0));
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(inferTimeOfDay());
  const [mood, setMood] = useState<MoodScore>(4);
  const [stress, setStress] = useState<number>(4);
  const [energy, setEnergy] = useState<number>(6);
  const [mentalState, setMentalState] = useState<MentalState>('Clear');
  const [emotions, setEmotions] = useState<EmotionOption[]>(['Calm']);
  const [triggers, setTriggers] = useState<TriggerOption[]>([]);
  const [thoughts, setThoughts] = useState<string>('');
  const [gratitudeNote, setGratitudeNote] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [savedMessage, setSavedMessage] = useState<string>('');
  const [promptIndex, setPromptIndex] = useState<number>(0);

  // Filter / Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [moodFilter, setMoodFilter] = useState<'all' | 'low' | 'steady' | 'high'>('all');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const toggleEmotion = (em: EmotionOption) => {
    setEmotions((prev) =>
      prev.includes(em) ? prev.filter((item) => item !== em) : [...prev, em]
    );
    setFormError('');
  };

  const toggleTrigger = (tr: TriggerOption) => {
    setTriggers((prev) =>
      prev.includes(tr) ? prev.filter((item) => item !== tr) : [...prev, tr]
    );
  };

  const resetForm = () => {
    setEditingId(undefined);
    setDate(daysAgoISO(0));
    setTimeOfDay(inferTimeOfDay());
    setMood(4);
    setStress(4);
    setEnergy(6);
    setMentalState('Clear');
    setEmotions(['Calm']);
    setTriggers([]);
    setThoughts('');
    setGratitudeNote('');
    setFormError('');
  };

  const startEdit = (entry: MindEntry) => {
    setEditingId(entry.id);
    setDate(entry.date);
    setTimeOfDay(entry.timeOfDay);
    setMood(entry.mood);
    setStress(entry.stress);
    setEnergy(entry.energy);
    setMentalState(entry.mentalState);
    setEmotions(entry.emotions);
    setTriggers(entry.triggers);
    setThoughts(entry.thoughts);
    setGratitudeNote(entry.gratitudeNote || '');
    setFormError('');
    setSavedMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedThoughts = thoughts.trim();

    if (!date) {
      setFormError('Please select a date for this check-in.');
      return;
    }
    if (emotions.length === 0) {
      setFormError('Select at least one emotion that best describes your current state.');
      return;
    }
    if (trimmedThoughts.length < 4) {
      setFormError('Add a brief note about your thoughts or day (at least a few words).');
      return;
    }

    onSaveEntry(
      {
        date,
        timeOfDay,
        mood,
        stress,
        energy,
        mentalState,
        emotions,
        triggers,
        thoughts: trimmedThoughts,
        gratitudeNote: gratitudeNote.trim() || undefined,
      },
      editingId
    );

    setSavedMessage(editingId ? 'Check-in updated.' : 'Mind check-in saved to your private log.');
    resetForm();
    window.setTimeout(() => setSavedMessage(''), 4000);
  };

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries.filter((entry) => {
      if (moodFilter === 'low' && entry.mood > 2) return false;
      if (moodFilter === 'steady' && entry.mood !== 3) return false;
      if (moodFilter === 'high' && entry.mood < 4) return false;
      if (!q) return true;
      const haystack = [
        entry.thoughts,
        entry.gratitudeNote || '',
        entry.mentalState,
        ...entry.emotions,
        ...entry.triggers,
        formatShortDate(entry.date),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [entries, searchQuery, moodFilter]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-1.5">
        <h1 className="text-3xl font-medium tracking-tight text-[#1A1D2E]">Mind Tracking</h1>
        <p className="text-sm text-[#5A617A] max-w-2xl">
          Record your mood, stress, energy, emotions, and reflections without judgment. Every entry
          updates your personal pattern analysis immediately.
        </p>
      </div>

      {/* Main Split: Interactive Check-In Form + Entry History */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Composer Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="xl:col-span-7 bg-white border border-[#E5E8F2] rounded-2xl p-6 sm:p-7 space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E5E8F2]">
            <div>
              <h2 className="text-xl font-medium text-[#1A1D2E]">
                {editingId ? 'Edit Mind Check-in' : 'Daily Mind Check-in'}
              </h2>
              <p className="text-xs text-[#767E98] mt-0.5">
                Stored privately on your device only
              </p>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-medium text-[#5A617A] hover:text-[#1A1D2E] inline-flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" />
                <span>Cancel edit</span>
              </button>
            )}
          </div>

          {/* Date & Time of Day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#3A3F58]">Date</span>
              <input
                type="date"
                value={date}
                max={daysAgoISO(0)}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E5E8F2] bg-[#F8F9FC] text-sm text-[#1A1D2E] focus:bg-white focus:border-[#5B49B8] transition-colors"
              />
            </label>

            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-[#3A3F58]">Time of day</span>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-[#F3F5FA]">
                {(['morning', 'afternoon', 'evening'] as TimeOfDay[]).map((tod) => (
                  <button
                    key={tod}
                    type="button"
                    onClick={() => setTimeOfDay(tod)}
                    className={`py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap ${
                      timeOfDay === tod
                        ? 'bg-white text-[#1A1D2E] shadow-xs'
                        : 'text-[#5A617A] hover:text-[#1A1D2E]'
                    }`}
                  >
                    {tod}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mood Scale 1-5 */}
          <fieldset className="space-y-2.5">
            <legend className="text-xs font-medium text-[#3A3F58]">
              Overall Mood — <span className="text-[#5B49B8]">{MOOD_LABELS[mood].label}</span>
            </legend>
            <div className="grid grid-cols-5 gap-2">
              {([1, 2, 3, 4, 5] as MoodScore[]).map((score) => {
                const selected = mood === score;
                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setMood(score)}
                    aria-pressed={selected}
                    className={`py-3 px-2 rounded-xl border text-center transition-colors ${
                      selected
                        ? 'bg-[#F5F3FF] border-[#5B49B8] text-[#4A3A9C]'
                        : 'bg-white border-[#E5E8F2] text-[#5A617A] hover:bg-[#F8F9FC]'
                    }`}
                  >
                    <div className="font-mono text-base font-medium tabular-nums">{score}</div>
                    <div className="text-[11px] font-medium mt-0.5 truncate">
                      {MOOD_LABELS[score].short}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#767E98]">{MOOD_LABELS[mood].description}</p>
          </fieldset>

          {/* Stress & Energy Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
            <label className="block space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#3A3F58]">Stress Level</span>
                <span className="font-mono text-sm font-medium tabular-nums text-[#1A1D2E]">
                  {stress} / 10
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={stress}
                onChange={(e) => setStress(Number(e.target.value))}
                className="w-full medicate-slider"
              />
              <div className="flex justify-between text-[11px] text-[#767E98]">
                <span>At ease</span>
                <span>Moderate</span>
                <span>High tension</span>
              </div>
            </label>

            <label className="block space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#3A3F58]">Energy Level</span>
                <span className="font-mono text-sm font-medium tabular-nums text-[#1A1D2E]">
                  {energy} / 10
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                className="w-full medicate-slider"
              />
              <div className="flex justify-between text-[11px] text-[#767E98]">
                <span>Depleted</span>
                <span>Steady</span>
                <span>Energized</span>
              </div>
            </label>
          </div>

          {/* Mental State */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-[#3A3F58]">Mental State</legend>
            <div className="flex flex-wrap gap-2">
              {MENTAL_STATE_OPTIONS.map((ms) => {
                const active = mentalState === ms;
                return (
                  <button
                    key={ms}
                    type="button"
                    onClick={() => setMentalState(ms)}
                    aria-pressed={active}
                    className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#5B49B8] border-[#5B49B8] text-white'
                        : 'bg-white border-[#E5E8F2] text-[#3A3F58] hover:bg-[#F8F9FC]'
                    }`}
                  >
                    {ms}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Emotions Multi-Select */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-[#3A3F58]">
              Emotions Present <span className="font-normal text-[#767E98]">(select one or more)</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {EMOTION_OPTIONS.map((em) => {
                const selected = emotions.includes(em);
                return (
                  <button
                    key={em}
                    type="button"
                    onClick={() => toggleEmotion(em)}
                    aria-pressed={selected}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                      selected
                        ? 'bg-[#F5F3FF] border-[#5B49B8] text-[#4A3A9C]'
                        : 'bg-white border-[#E5E8F2] text-[#5A617A] hover:bg-[#F8F9FC] hover:text-[#1A1D2E]'
                    }`}
                  >
                    {selected && <Check className="h-3 w-3 shrink-0" aria-hidden="true" />}
                    <span>{em}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Context & Possible Influences */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-[#3A3F58]">
              Context & Influences <span className="font-normal text-[#767E98]">(optional — helps identify patterns)</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {TRIGGER_OPTIONS.map((tr) => {
                const selected = triggers.includes(tr);
                return (
                  <button
                    key={tr}
                    type="button"
                    onClick={() => toggleTrigger(tr)}
                    aria-pressed={selected}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                      selected
                        ? 'bg-[#EFF6FF] border-[#4A89C8] text-[#2B5D8F]'
                        : 'bg-white border-[#E5E8F2] text-[#5A617A] hover:bg-[#F8F9FC] hover:text-[#1A1D2E]'
                    }`}
                  >
                    {selected && <Check className="h-3 w-3 shrink-0" aria-hidden="true" />}
                    <span>{tr}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Thoughts Journal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="mind-thoughts" className="text-xs font-medium text-[#3A3F58]">
                Thoughts & Reflections
              </label>
              <button
                type="button"
                onClick={() => setPromptIndex((prev) => (prev + 1) % GENTLE_PROMPTS.length)}
                className="text-xs text-[#5B49B8] hover:text-[#4A3A9C] font-medium whitespace-nowrap"
              >
                New prompt
              </button>
            </div>
            <p className="text-xs italic text-[#767E98]">
              Prompt: {GENTLE_PROMPTS[promptIndex]}
            </p>
            <textarea
              id="mind-thoughts"
              rows={4}
              value={thoughts}
              onChange={(e) => {
                setThoughts(e.target.value);
                if (formError) setFormError('');
              }}
              placeholder="Write freely about how your day is unfolding, what stood out, or what you need right now..."
              className="w-full rounded-xl border border-[#E5E8F2] bg-[#F8F9FC] px-4 py-3 text-sm text-[#1A1D2E] placeholder:text-[#9097AE] focus:bg-white focus:border-[#5B49B8] transition-colors resize-y"
            />
          </div>

          {/* Optional Gratitude Note */}
          <div className="space-y-1.5">
            <label htmlFor="mind-gratitude" className="text-xs font-medium text-[#3A3F58]">
              One Small Thing You Appreciated <span className="font-normal text-[#767E98]">(optional)</span>
            </label>
            <input
              id="mind-gratitude"
              type="text"
              value={gratitudeNote}
              onChange={(e) => setGratitudeNote(e.target.value)}
              placeholder="A quiet cup of tea, a kind message, a deep breath..."
              className="w-full h-10 rounded-lg border border-[#E5E8F2] bg-[#F8F9FC] px-3.5 text-sm text-[#1A1D2E] placeholder:text-[#9097AE] focus:bg-white focus:border-[#5B49B8] transition-colors"
            />
          </div>

          {/* Validation & Feedback */}
          {formError && (
            <div
              role="alert"
              className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-xs text-[#991B1B]"
            >
              {formError}
            </div>
          )}

          {savedMessage && (
            <div
              role="status"
              className="rounded-lg border border-[#DDD6FE] bg-[#F5F3FF] px-4 py-3 text-xs font-medium text-[#4A3A9C]"
            >
              {savedMessage}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-[#767E98]">
              You can edit or remove any entry at any time.
            </span>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-[#5B49B8] text-white text-sm font-medium hover:bg-[#4A3A9C] transition-colors whitespace-nowrap shrink-0"
            >
              {editingId ? 'Save Changes' : 'Save Check-in'}
            </button>
          </div>
        </form>

        {/* Journal History Column */}
        <div className="xl:col-span-5 bg-white border border-[#E5E8F2] rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-medium text-[#1A1D2E]">Recent Check-ins</h2>
              <p className="text-xs text-[#767E98] mt-0.5 tabular-nums">
                Showing {filteredEntries.length} of {entries.length} entries
              </p>
            </div>
          </div>

          {/* Search & Mood Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search
                className="h-4 w-4 text-[#767E98] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search thoughts, emotions, or triggers..."
                aria-label="Search check-ins"
                className="w-full h-10 pl-10 pr-3.5 rounded-lg border border-[#E5E8F2] bg-[#F8F9FC] text-sm text-[#1A1D2E] placeholder:text-[#9097AE] focus:bg-white focus:border-[#5B49B8] transition-colors"
              />
            </div>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#F3F5FA]">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'high', label: 'Good & Up' },
                  { id: 'steady', label: 'Steady' },
                  { id: 'low', label: 'Low Days' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMoodFilter(tab.id)}
                  className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    moodFilter === tab.id
                      ? 'bg-white text-[#1A1D2E] shadow-xs'
                      : 'text-[#5A617A] hover:text-[#1A1D2E]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Entries Feed */}
          {filteredEntries.length === 0 ? (
            <div className="py-12 text-center space-y-2 border-t border-[#E5E8F2]">
              <p className="text-sm font-medium text-[#1A1D2E]">No matching check-ins</p>
              <p className="text-xs text-[#767E98]">
                {entries.length === 0
                  ? 'Use the form on the left to record your first mind check-in.'
                  : 'Try clearing your search or choosing a different mood filter.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E8F2] max-h-[760px] overflow-y-auto pr-1">
              {filteredEntries.map((entry) => (
                <article key={entry.id} className="py-4 first:pt-2 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="text-xs text-[#767E98] capitalize">
                        {formatShortDate(entry.date)} · {entry.timeOfDay} · {entry.mentalState}
                      </div>
                      <div className="text-sm font-semibold text-[#1A1D2E] tabular-nums">
                        {MOOD_LABELS[entry.mood].label} ({entry.mood}/5)
                        <span className="font-normal text-[#5A617A]">
                          {' '}
                          · Stress {entry.stress}/10 · Energy {entry.energy}/10
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(entry)}
                        aria-label={`Edit entry from ${entry.date}`}
                        className="p-1.5 rounded-md text-[#767E98] hover:text-[#1A1D2E] hover:bg-[#F3F5FA] transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {pendingDeleteId === entry.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteEntry(entry.id);
                              setPendingDeleteId(null);
                            }}
                            className="px-2 py-1 rounded text-[11px] font-medium bg-[#DC2626] text-white hover:bg-[#B91C1C]"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(null)}
                            className="px-2 py-1 rounded text-[11px] font-medium text-[#5A617A] hover:bg-[#F3F5FA]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(entry.id)}
                          aria-label={`Delete entry from ${entry.date}`}
                          className="p-1.5 rounded-md text-[#767E98] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-[#3A3F58]">{entry.thoughts}</p>

                  {entry.gratitudeNote && (
                    <p className="text-xs text-[#5A617A]">
                      <span className="font-medium text-[#4A3A9C]">Appreciated:</span>{' '}
                      {entry.gratitudeNote}
                    </p>
                  )}

                  <div className="text-xs text-[#767E98] space-y-0.5">
                    <div>Emotions: {entry.emotions.join(' · ')}</div>
                    {entry.triggers.length > 0 && (
                      <div>Context: {entry.triggers.join(' · ')}</div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
