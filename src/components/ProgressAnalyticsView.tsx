import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Award, Check } from 'lucide-react';
import { WellnessState } from '../types/wellness';
import {
  buildDailySeries,
  computeExerciseCategoryStats,
  computeMilestones,
  computePeriodMetrics,
} from '../utils/analytics';

interface ProgressAnalyticsViewProps {
  state: WellnessState;
}

export function ProgressAnalyticsView({ state }: ProgressAnalyticsViewProps) {
  const [periodDays, setPeriodDays] = useState<7 | 30>(7);

  const metrics = useMemo(
    () => computePeriodMetrics(state.entries, state.sessions, periodDays),
    [state.entries, state.sessions, periodDays]
  );

  const series = useMemo(
    () => buildDailySeries(state.entries, state.sessions, periodDays),
    [state.entries, state.sessions, periodDays]
  );

  const categoryStats = useMemo(
    () => computeExerciseCategoryStats(state.sessions),
    [state.sessions]
  );

  const milestones = useMemo(() => computeMilestones(state), [state]);
  const achievedCount = milestones.filter((m) => m.achieved).length;

  const hasTrendData = series.some((p) => p.mood !== null);
  const periodLabel = periodDays === 7 ? '7 days' : '30 days';

  const formatDelta = (delta: number | null, unit: string, lowerIsBetter = false) => {
    if (delta === null) return `Baseline period (${periodLabel})`;
    if (delta === 0) return `Unchanged vs prior ${periodLabel}`;
    const sign = delta > 0 ? '+' : '';
    const directionNote = lowerIsBetter
      ? delta < 0
        ? 'lower tension'
        : 'higher tension'
      : delta > 0
        ? 'upward trend'
        : 'softer trend';
    return `${sign}${delta} ${unit} vs prior ${periodLabel} · ${directionNote}`;
  };

  return (
    <div className="space-y-8">
      {/* Header + Segmented Timeframe Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-medium tracking-tight text-[#1A1D2E]">
            Progress Analytics
          </h1>
          <p className="text-sm text-[#5A617A] max-w-2xl">
            Weekly and monthly reports tracking mood steadiness, stress shifts, guided exercise
            completion, and personal milestones.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white border border-[#E5E8F2] rounded-xl self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setPeriodDays(7)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              periodDays === 7
                ? 'bg-[#5B49B8] text-white'
                : 'text-[#5A617A] hover:text-[#1A1D2E]'
            }`}
          >
            Weekly (7 Days)
          </button>
          <button
            type="button"
            onClick={() => setPeriodDays(30)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              periodDays === 30
                ? 'bg-[#5B49B8] text-white'
                : 'text-[#5A617A] hover:text-[#1A1D2E]'
            }`}
          >
            Monthly (30 Days)
          </button>
        </div>
      </div>

      {/* Period Improvement Trends Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E8F2] rounded-xl p-5 space-y-1.5">
          <div className="text-xs text-[#767E98]">Average Mood ({periodLabel})</div>
          <div className="font-mono text-2xl font-medium tabular-nums text-[#1A1D2E]">
            {metrics.mood !== null ? `${metrics.mood.toFixed(1)} / 5` : '—'}
          </div>
          <div className="text-xs text-[#5A617A] tabular-nums">
            {formatDelta(metrics.moodDelta, 'pts')}
          </div>
        </div>

        <div className="bg-white border border-[#E5E8F2] rounded-xl p-5 space-y-1.5">
          <div className="text-xs text-[#767E98]">Average Stress ({periodLabel})</div>
          <div className="font-mono text-2xl font-medium tabular-nums text-[#1A1D2E]">
            {metrics.stress !== null ? `${metrics.stress.toFixed(1)} / 10` : '—'}
          </div>
          <div className="text-xs text-[#5A617A] tabular-nums">
            {formatDelta(metrics.stressDelta, 'pts', true)}
          </div>
        </div>

        <div className="bg-white border border-[#E5E8F2] rounded-xl p-5 space-y-1.5">
          <div className="text-xs text-[#767E98]">Average Energy ({periodLabel})</div>
          <div className="font-mono text-2xl font-medium tabular-nums text-[#1A1D2E]">
            {metrics.energy !== null ? `${metrics.energy.toFixed(1)} / 10` : '—'}
          </div>
          <div className="text-xs text-[#5A617A] tabular-nums">
            {formatDelta(metrics.energyDelta, 'pts')}
          </div>
        </div>

        <div className="bg-white border border-[#E5E8F2] rounded-xl p-5 space-y-1.5">
          <div className="text-xs text-[#767E98]">Guided Practice ({periodLabel})</div>
          <div className="font-mono text-2xl font-medium tabular-nums text-[#1A1D2E]">
            {metrics.mindfulMinutes} min
          </div>
          <div className="text-xs text-[#5A617A] tabular-nums">
            {metrics.sessionCount} {metrics.sessionCount === 1 ? 'session' : 'sessions'} ·{' '}
            {metrics.minutesDelta >= 0 ? `+${metrics.minutesDelta}` : metrics.minutesDelta} min vs prior
          </div>
        </div>
      </section>

      {/* Multi-Metric Mood, Stress & Energy Graph */}
      <section className="bg-white border border-[#E5E8F2] rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5E8F2]">
          <div>
            <h2 className="text-xl font-medium text-[#1A1D2E]">
              {periodDays === 7 ? 'Weekly' : 'Monthly'} Wellness Trajectory
            </h2>
            <p className="text-xs text-[#767E98] mt-0.5">
              Mood (1–5), Energy (1–10), and Stress (1–10) plotted over the past {periodLabel}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs text-[#5A617A]">
            <span className="inline-flex items-center gap-2">
              <span className="h-0.5 w-4 bg-[#5B49B8] inline-block" aria-hidden="true" />
              Mood (1–5)
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-0.5 w-4 bg-[#4A89C8] inline-block" aria-hidden="true" />
              Energy (1–10)
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="h-0.5 w-4 border-t-2 border-dashed border-[#9097AE] inline-block"
                aria-hidden="true"
              />
              Stress (1–10)
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          {hasTrendData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E8F2" vertical={false} />
                <XAxis
                  dataKey="label"
                  interval={periodDays === 30 ? 4 : 0}
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
                    boxShadow: '0 4px 16px rgba(26, 29, 46, 0.08)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="mood"
                  name="Mood (/5)"
                  stroke="#5B49B8"
                  strokeWidth={2.5}
                  connectNulls
                  dot={{ r: periodDays === 7 ? 4 : 2.5, fill: '#5B49B8' }}
                />
                <Line
                  type="monotone"
                  dataKey="energy"
                  name="Energy (/10)"
                  stroke="#4A89C8"
                  strokeWidth={2}
                  connectNulls
                  dot={{ r: periodDays === 7 ? 3.5 : 2, fill: '#4A89C8' }}
                />
                <Line
                  type="monotone"
                  dataKey="stress"
                  name="Stress (/10)"
                  stroke="#9097AE"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  connectNulls
                  dot={{ r: periodDays === 7 ? 3 : 2, fill: '#9097AE' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-[#767E98]">
              Log mind check-ins to populate your {periodLabel} trend line.
            </div>
          )}
        </div>
      </section>

      {/* Exercise Completion Statistics + Milestones */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Exercise Completion Breakdown */}
        <div className="xl:col-span-6 bg-white border border-[#E5E8F2] rounded-2xl p-6 space-y-5">
          <div className="pb-4 border-b border-[#E5E8F2]">
            <h2 className="text-xl font-medium text-[#1A1D2E]">Exercise Completion Statistics</h2>
            <p className="text-xs text-[#767E98] mt-0.5">
              Total guided practice minutes and completed sessions by modality
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryStats} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E8F2" vertical={false} />
                <XAxis
                  dataKey="category"
                  tick={{ fill: '#767E98', fontSize: 11 }}
                  axisLine={{ stroke: '#E5E8F2' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#767E98', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E8F2',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="minutes" name="Minutes" fill="#6D5BD0" radius={[5, 5, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto pt-2 border-t border-[#E5E8F2]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5E8F2] text-[#767E98]">
                  <th className="py-2 font-medium">Practice Area</th>
                  <th className="py-2 font-medium text-right">Sessions</th>
                  <th className="py-2 font-medium text-right">Total Minutes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E8F2]">
                {categoryStats.map((row) => (
                  <tr key={row.category}>
                    <td className="py-2 font-medium text-[#1A1D2E]">{row.category}</td>
                    <td className="py-2 text-right font-mono tabular-nums text-[#5A617A]">
                      {row.sessions}
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums text-[#1A1D2E]">
                      {row.minutes} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Personal Milestones & Achievements */}
        <div className="xl:col-span-6 bg-white border border-[#E5E8F2] rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E8F2]">
            <div>
              <h2 className="text-xl font-medium text-[#1A1D2E]">Personal Milestones</h2>
              <p className="text-xs text-[#767E98] mt-0.5">
                Steady progress markers earned through consistent self-care
              </p>
            </div>
            <div className="text-xs font-mono tabular-nums text-[#5B49B8] font-medium">
              {achievedCount} / {milestones.length} earned
            </div>
          </div>

          <div className="divide-y divide-[#E5E8F2]">
            {milestones.map((m) => {
              const pct = Math.min(100, Math.round((m.current / m.target) * 100));
              return (
                <div key={m.id} className="py-4 first:pt-1 last:pb-1 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          m.achieved
                            ? 'bg-[#F5F3FF] text-[#5B49B8]'
                            : 'bg-[#F3F5FA] text-[#9097AE]'
                        }`}
                      >
                        {m.achieved ? (
                          <Check className="h-4 w-4" strokeWidth={2.5} />
                        ) : (
                          <Award className="h-4 w-4" />
                        )}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-[#1A1D2E]">{m.title}</div>
                        <p className="text-xs text-[#5A617A] mt-0.5">{m.description}</p>
                      </div>
                    </div>
                    <span className="font-mono text-xs tabular-nums text-[#5A617A] whitespace-nowrap">
                      {m.current} / {m.target} {m.unit}
                    </span>
                  </div>

                  <div className="pl-10">
                    <div className="h-1.5 w-full bg-[#F3F5FA] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          m.achieved ? 'bg-[#5B49B8]' : 'bg-[#94A3B8]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
