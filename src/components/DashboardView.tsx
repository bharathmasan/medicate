import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, Check, Play } from 'lucide-react';
import { ASSET_IMAGES, DAILY_QUOTES, daysAgoISO, EXERCISE_CATALOG } from '../data/seedData';
import {
  MOOD_LABELS,
  NavigationSection,
  WellnessState,
} from '../types/wellness';
import {
  buildDailySeries,
  computeMindfulnessStreak,
  computePeriodMetrics,
  generatePersonalObservations,
  getGreeting,
} from '../utils/analytics';
import { ResilientImage } from './ResilientImage';

interface DashboardViewProps {
  state: WellnessState;
  onNavigate: (section: NavigationSection) => void;
  onLaunchExercise: (exerciseId: string) => void;
  onToggleChallenge: (challengeId: string, dateISO: string) => void;
}

export function DashboardView({
  state,
  onNavigate,
  onLaunchExercise,
  onToggleChallenge,
}: DashboardViewProps) {
  const todayISO = daysAgoISO(0);

  const todayEntry = useMemo(
    () => state.entries.find((e) => e.date === todayISO),
    [state.entries, todayISO]
  );

  const streak = useMemo(
    () => computeMindfulnessStreak(state.entries, state.sessions),
    [state.entries, state.sessions]
  );

  const metrics7d = useMemo(
    () => computePeriodMetrics(state.entries, state.sessions, 7),
    [state.entries, state.sessions]
  );

  const series7d = useMemo(
    () => buildDailySeries(state.entries, state.sessions, 7),
    [state.entries, state.sessions]
  );

  const observations = useMemo(() => generatePersonalObservations(state), [state]);

  const completedChallengesToday = useMemo(
    () => state.challenges.filter((c) => c.completedDates.includes(todayISO)).length,
    [state.challenges, todayISO]
  );

  const quoteIndex = new Date().getDate() % DAILY_QUOTES.length;
  const dailyQuote = DAILY_QUOTES[quoteIndex];

  // Recommend 3 exercises tailored subtly to latest state
  const featuredExercises = useMemo(() => {
    const latest = state.entries[0];
    if (latest && latest.stress >= 6) {
      return [
        EXERCISE_CATALOG[0], // Box breathing
        EXERCISE_CATALOG[3], // 5-4-3-2-1 grounding
        EXERCISE_CATALOG[7], // Progressive muscle release
      ];
    }
    return [
      EXERCISE_CATALOG[0], // Box breathing
      EXERCISE_CATALOG[2], // Body scan
      EXERCISE_CATALOG[4], // Three Small Anchors gratitude
    ];
  }, [state.entries]);

  const hasChartData = series7d.some((pt) => pt.mood !== null);

  return (
    <div className="space-y-8">
      {/* Top 2-Column Balanced Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white border border-[#E5E8F2] rounded-2xl p-7 sm:p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-[#767E98]">
              <span>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span aria-hidden="true">·</span>
              <span>{todayEntry ? 'Check-in logged today' : 'No check-in logged yet today'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#1A1D2E] leading-[1.15]">
              {getGreeting(state.userName)}.
            </h1>

            <p className="text-[15px] leading-relaxed text-[#5A617A] max-w-xl">
              {todayEntry
                ? `Earlier today you noted feeling ${MOOD_LABELS[todayEntry.mood].label.toLowerCase()} with ${todayEntry.mentalState.toLowerCase()} mental clarity (${todayEntry.stress}/10 stress · ${todayEntry.energy}/10 energy). Take a quiet pause whenever you need to recalibrate.`
                : 'Take two quiet minutes to notice how your mind and body feel right now. Consistent check-ins gently reveal what restores your balance.'}
            </p>
          </div>

          <div className="mt-7 pt-6 border-t border-[#E5E8F2] flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('tracking')}
              className="px-5 py-2.5 rounded-lg bg-[#5B49B8] text-white text-sm font-medium hover:bg-[#4A3A9C] transition-colors whitespace-nowrap shrink-0"
            >
              {todayEntry ? 'Add Evening Check-in' : 'Log Today’s Check-in'}
            </button>
            <button
              type="button"
              onClick={() => onLaunchExercise('breath-box')}
              className="px-4 py-2.5 rounded-lg border border-[#E5E8F2] bg-white text-[#1A1D2E] text-sm font-medium hover:bg-[#F5F3FF] hover:border-[#DDD6FE] transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Play className="h-3.5 w-3.5 text-[#5B49B8]" aria-hidden="true" />
              <span>4-Min Box Breathing</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-[#E5E8F2] min-h-[240px]">
          <ResilientImage
            src={ASSET_IMAGES.heroHorizon}
            alt="Calm morning mist over soft blue water at dawn"
            className="w-full h-full object-cover lg:absolute lg:inset-0"
            fallbackTitle="Serene Morning Horizon"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#1A1D2E]/80 via-[#1A1D2E]/35 to-transparent"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7 text-white space-y-2">
            <p className="font-editorial text-lg leading-snug text-white/95">
              “{dailyQuote.text}”
            </p>
            <div className="text-xs text-white/75">{dailyQuote.attribution}</div>
          </div>
        </div>
      </section>

      {/* Full-Width 4-Column KPI Strip */}
      <section
        aria-label="Daily mental wellness summary"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <div className="bg-white border border-[#E5E8F2] rounded-xl p-5 space-y-1.5">
          <div className="text-xs text-[#767E98]">Mindfulness Streak</div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-medium tabular-nums text-[#1A1D2E]">
              {streak}
            </span>
            <span className="text-xs text-[#5A617A]">
              {streak === 1 ? 'day active' : 'days active'}
            </span>
          </div>
          <div className="text-xs text-[#5A617A]">
            {streak > 0 ? 'Steady daily rhythm' : 'Start today with a check-in'}
          </div>
        </div>

        <div className="bg-white border border-[#E5E8F2] rounded-xl p-5 space-y-1.5">
          <div className="text-xs text-[#767E98]">7-Day Average Mood</div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-medium tabular-nums text-[#1A1D2E]">
              {metrics7d.mood !== null ? metrics7d.mood.toFixed(1) : '—'}
            </span>
            <span className="text-xs text-[#5A617A]">/ 5.0 scale</span>
          </div>
          <div className="text-xs text-[#5A617A] tabular-nums">
            {metrics7d.moodDelta !== null
              ? `${metrics7d.moodDelta >= 0 ? '+' : ''}${metrics7d.moodDelta} vs prior 7 days`
              : `${metrics7d.entryCount} check-ins this week`}
          </div>
        </div>

        <div className="bg-white border border-[#E5E8F2] rounded-xl p-5 space-y-1.5">
          <div className="text-xs text-[#767E98]">Guided Practice (7d)</div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-medium tabular-nums text-[#1A1D2E]">
              {metrics7d.mindfulMinutes}
            </span>
            <span className="text-xs text-[#5A617A]">minutes</span>
          </div>
          <div className="text-xs text-[#5A617A] tabular-nums">
            {metrics7d.sessionCount} {metrics7d.sessionCount === 1 ? 'session' : 'sessions'} completed
          </div>
        </div>

        <div className="bg-white border border-[#E5E8F2] rounded-xl p-5 space-y-1.5">
          <div className="text-xs text-[#767E98]">Today’s Challenges</div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-medium tabular-nums text-[#1A1D2E]">
              {completedChallengesToday} / {state.challenges.length}
            </span>
            <span className="text-xs text-[#5A617A]">completed</span>
          </div>
          <div className="w-full h-1.5 bg-[#F3F5FA] rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-[#5B49B8] rounded-full transition-all duration-300"
              style={{
                width: `${
                  state.challenges.length > 0
                    ? Math.round((completedChallengesToday / state.challenges.length) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* Main Middle Grid: 7-Day Mood & Stress Chart + Personal Insights */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 bg-white border border-[#E5E8F2] rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#E5E8F2]">
            <div>
              <h2 className="text-xl font-medium text-[#1A1D2E]">Seven-Day Mood & Stress</h2>
              <p className="text-xs text-[#767E98] mt-1">
                Mood (1–5) alongside daily stress intensity (1–10)
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="text-xs font-medium text-[#5B49B8] hover:text-[#4A3A9C] inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <span>Full analytics</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="pt-6 h-72 w-full">
            {hasChartData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series7d} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashMoodFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6D5BD0" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#6D5BD0" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="dashStressFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4A89C8" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#4A89C8" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E8F2" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#767E98', fontSize: 12 }}
                    axisLine={{ stroke: '#E5E8F2' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fill: '#767E98', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E8F2',
                      borderRadius: '10px',
                      fontSize: '12px',
                      color: '#1A1D2E',
                      boxShadow: '0 4px 16px rgba(26, 29, 46, 0.08)',
                    }}
                    formatter={(value: unknown, name: unknown) => {
                      const num = typeof value === 'number' ? value : null;
                      const label = String(name);
                      if (num === null) return ['No entry', label];
                      return label === 'Mood' ? [`${num} / 5`, 'Mood'] : [`${num} / 10`, 'Stress'];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    name="Mood"
                    stroke="#5B49B8"
                    strokeWidth={2.25}
                    fill="url(#dashMoodFill)"
                    connectNulls
                    dot={{ r: 3.5, fill: '#5B49B8', strokeWidth: 0 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="stress"
                    name="Stress"
                    stroke="#4A89C8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fill="url(#dashStressFill)"
                    connectNulls
                    dot={{ r: 3, fill: '#4A89C8', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <p className="text-sm font-medium text-[#1A1D2E]">No mood trend yet</p>
                <p className="text-xs text-[#767E98] mt-1 max-w-xs">
                  Record your first mind check-in to visualize daily shifts in mood and stress.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('tracking')}
                  className="mt-4 px-4 py-2 rounded-lg bg-[#5B49B8] text-white text-xs font-medium hover:bg-[#4A3A9C] transition-colors"
                >
                  Log First Check-in
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-[#E5E8F2] flex flex-wrap items-center gap-6 text-xs text-[#5A617A]">
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-5 bg-[#5B49B8] inline-block" aria-hidden="true" />
              <span>Mood (1–5)</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="h-0.5 w-5 border-t-2 border-dashed border-[#4A89C8] inline-block"
                aria-hidden="true"
              />
              <span>Stress (1–10)</span>
            </div>
          </div>
        </div>

        {/* Personal Insights Panel */}
        <div className="xl:col-span-5 bg-white border border-[#E5E8F2] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#E5E8F2]">
              <div>
                <h2 className="text-xl font-medium text-[#1A1D2E]">Personal Observations</h2>
                <p className="text-xs text-[#767E98] mt-1">
                  Self-tracked pattern notes, not medical advice
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('analysis')}
                className="text-xs font-medium text-[#5B49B8] hover:text-[#4A3A9C] inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <span>Deep analysis</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="divide-y divide-[#E5E8F2]">
              {observations.slice(0, 3).map((item) => (
                <div key={item.id} className="py-4 first:pt-5 last:pb-2 space-y-1.5">
                  <div className="text-sm font-semibold text-[#1A1D2E]">{item.title}</div>
                  <p className="text-xs leading-relaxed text-[#5A617A]">{item.observation}</p>
                  <div className="text-[11px] text-[#767E98]">{item.basis}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Split: Suggested Exercises + Daily Challenges */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Recommended Practices */}
        <div className="xl:col-span-7 bg-white border border-[#E5E8F2] rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#E5E8F2]">
            <div>
              <h2 className="text-xl font-medium text-[#1A1D2E]">Guided Mental Practices</h2>
              <p className="text-xs text-[#767E98] mt-1">
                Short interactive sessions matched to your recent rhythm
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('exercises')}
              className="text-xs font-medium text-[#5B49B8] hover:text-[#4A3A9C] inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <span>All exercises</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="divide-y divide-[#E5E8F2]">
            {featuredExercises.map((ex) => (
              <div
                key={ex.id}
                className="py-4 first:pt-5 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-[#767E98]">
                    <span>{ex.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{ex.durationMinutes} min</span>
                  </div>
                  <div className="text-sm font-semibold text-[#1A1D2E]">{ex.title}</div>
                  <p className="text-xs text-[#5A617A]">{ex.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onLaunchExercise(ex.id)}
                  className="px-4 py-2 rounded-lg border border-[#E5E8F2] bg-[#F8F9FC] text-xs font-medium text-[#1A1D2E] hover:bg-[#F5F3FF] hover:border-[#DDD6FE] hover:text-[#4A3A9C] transition-colors inline-flex items-center gap-1.5 self-start sm:self-center whitespace-nowrap shrink-0"
                >
                  <Play className="h-3.5 w-3.5 text-[#5B49B8]" aria-hidden="true" />
                  <span>Begin</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Challenges Checklist */}
        <div className="xl:col-span-5 bg-white border border-[#E5E8F2] rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#E5E8F2]">
            <div>
              <h2 className="text-xl font-medium text-[#1A1D2E]">Daily Challenges</h2>
              <p className="text-xs text-[#767E98] mt-1">
                Gentle achievable habits for today
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('challenges')}
              className="text-xs font-medium text-[#5B49B8] hover:text-[#4A3A9C] inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <span>Manage</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="divide-y divide-[#E5E8F2]">
            {state.challenges.slice(0, 4).map((challenge) => {
              const done = challenge.completedDates.includes(todayISO);
              return (
                <button
                  key={challenge.id}
                  type="button"
                  onClick={() => onToggleChallenge(challenge.id, todayISO)}
                  className="w-full py-3.5 first:pt-5 last:pb-1 flex items-start gap-3.5 text-left group"
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      done
                        ? 'bg-[#5B49B8] border-[#5B49B8] text-white'
                        : 'border-[#C5CBE0] bg-white group-hover:border-[#5B49B8]'
                    }`}
                  >
                    {done && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
                  </span>
                  <div className="space-y-0.5 min-w-0">
                    <div
                      className={`text-sm font-medium transition-colors ${
                        done ? 'text-[#767E98] line-through' : 'text-[#1A1D2E]'
                      }`}
                    >
                      {challenge.title}
                    </div>
                    <div className="text-xs text-[#767E98]">
                      {challenge.category} · {challenge.durationMinutes} min
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
