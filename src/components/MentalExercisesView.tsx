import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Play } from 'lucide-react';
import { EXERCISE_CATALOG } from '../data/seedData';
import { ExerciseCategory, ExerciseSessionLog } from '../types/wellness';
import { formatShortDate } from '../utils/analytics';
import { ResilientImage } from './ResilientImage';

interface MentalExercisesViewProps {
  sessions: ExerciseSessionLog[];
  onLaunchExercise: (exerciseId: string) => void;
}

const CATEGORIES: ('All' | ExerciseCategory)[] = [
  'All',
  'Breathing',
  'Meditation',
  'Mindfulness',
  'Gratitude',
  'Reflection',
  'Focus',
  'Relaxation',
];

export function MentalExercisesView({
  sessions,
  onLaunchExercise,
}: MentalExercisesViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | ExerciseCategory>('All');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const filteredExercises = useMemo(() => {
    if (selectedCategory === 'All') return EXERCISE_CATALOG;
    return EXERCISE_CATALOG.filter((ex) => ex.category === selectedCategory);
  }, [selectedCategory]);

  const totalMinutes = useMemo(
    () => sessions.reduce((sum, s) => sum + s.durationMinutes, 0),
    [sessions]
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-medium tracking-tight text-[#1A1D2E]">Mental Exercises</h1>
          <p className="text-sm text-[#5A617A] max-w-2xl">
            Guided breathing, body-scan meditation, sensory grounding, gratitude reflections, and
            calm focus training—built for everyday practice.
          </p>
        </div>
        <div className="text-xs text-[#767E98] tabular-nums whitespace-nowrap">
          {sessions.length} sessions completed · {totalMinutes} total minutes
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-[#E5E8F2] rounded-xl">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === cat
                ? 'bg-[#5B49B8] text-white'
                : 'text-[#5A617A] hover:bg-[#F8F9FC] hover:text-[#1A1D2E]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Exercise Library Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredExercises.map((ex) => {
          const completedCount = sessions.filter((s) => s.exerciseId === ex.id).length;
          return (
            <article
              key={ex.id}
              className="bg-white border border-[#E5E8F2] rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#C7C2E8] transition-colors"
            >
              <div>
                <div className="aspect-[16/10] w-full overflow-hidden bg-[#F3F5FA]">
                  <ResilientImage
                    src={ex.imageUrl}
                    alt={ex.imageAlt || ex.title}
                    className="w-full h-full object-cover"
                    fallbackTitle={ex.title}
                  />
                </div>
                <div className="p-6 space-y-2.5">
                  <div className="text-xs text-[#767E98] tabular-nums">
                    {ex.category} · {ex.durationMinutes} min
                    {completedCount > 0 ? ` · Completed ${completedCount}×` : ''}
                  </div>
                  <h2 className="text-xl font-medium text-[#1A1D2E]">{ex.title}</h2>
                  <p className="text-sm leading-relaxed text-[#5A617A]">{ex.subtitle}</p>
                  <p className="text-xs text-[#767E98] pt-1">{ex.benefit}</p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2">
                <button
                  type="button"
                  onClick={() => onLaunchExercise(ex.id)}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] text-sm font-medium text-[#4A3A9C] hover:bg-[#5B49B8] hover:text-white hover:border-[#5B49B8] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Start Session</span>
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {/* Completed Sessions & Reflections Log */}
      <section className="bg-white border border-[#E5E8F2] rounded-2xl p-6 space-y-5">
        <div className="pb-4 border-b border-[#E5E8F2]">
          <h2 className="text-xl font-medium text-[#1A1D2E]">Practice History & Saved Reflections</h2>
          <p className="text-xs text-[#767E98] mt-0.5">
            Every completed exercise counts toward your daily mindfulness rhythm
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="py-10 text-center space-y-1.5">
            <p className="text-sm font-medium text-[#1A1D2E]">No sessions recorded yet</p>
            <p className="text-xs text-[#767E98]">
              Choose any practice above to begin a guided breathing, meditation, or reflection session.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E8F2]">
            {sessions.slice(0, 12).map((session) => {
              const hasDetails =
                Boolean(session.notes) ||
                Boolean(session.reflectionResponses && session.reflectionResponses.length > 0) ||
                typeof session.focusReturns === 'number';
              const isExpanded = expandedSessionId === session.id;

              return (
                <div key={session.id} className="py-4 first:pt-1 last:pb-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-[#1A1D2E]">{session.title}</div>
                      <div className="text-xs text-[#767E98] tabular-nums mt-0.5">
                        {formatShortDate(session.date)} · {session.category} · {session.durationMinutes} min
                        {typeof session.focusReturns === 'number'
                          ? ` · ${session.focusReturns} mindful returns`
                          : ''}
                      </div>
                    </div>

                    {hasDetails && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSessionId(isExpanded ? null : session.id)
                        }
                        className="text-xs font-medium text-[#5B49B8] hover:text-[#4A3A9C] inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <span>{isExpanded ? 'Hide notes' : 'View notes'}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="pt-2 space-y-2 text-xs text-[#3A3F58] bg-[#F8F9FC] rounded-xl p-4">
                      {session.notes && <p>{session.notes}</p>}
                      {session.reflectionResponses?.map((r, i) => (
                        <div key={i} className="space-y-0.5">
                          <div className="font-medium text-[#5A617A]">{r.prompt}</div>
                          <p className="text-[#1A1D2E]">{r.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
