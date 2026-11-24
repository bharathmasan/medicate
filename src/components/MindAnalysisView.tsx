import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Check, Copy, Download, Info } from 'lucide-react';
import { NavigationSection, WellnessState } from '../types/wellness';
import {
  buildReflectionSummaryText,
  computeEmotionBreakdown,
  computeTriggerCorrelations,
  computeWeekdayVsWeekend,
  extractThoughtThemes,
  generatePersonalObservations,
} from '../utils/analytics';

interface MindAnalysisViewProps {
  state: WellnessState;
  onNavigate: (section: NavigationSection) => void;
}

export function MindAnalysisView({ state, onNavigate }: MindAnalysisViewProps) {
  const [copied, setCopied] = useState(false);

  const emotions = useMemo(() => computeEmotionBreakdown(state.entries), [state.entries]);
  const triggers = useMemo(() => computeTriggerCorrelations(state.entries), [state.entries]);
  const weekSplit = useMemo(() => computeWeekdayVsWeekend(state.entries), [state.entries]);
  const themes = useMemo(() => extractThoughtThemes(state.entries), [state.entries]);
  const observations = useMemo(() => generatePersonalObservations(state), [state]);

  const mentalStateCounts = useMemo(() => {
    const map = new Map<string, number>();
    state.entries.forEach((e) => {
      map.set(e.mentalState, (map.get(e.mentalState) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({
        name,
        count,
        pct: state.entries.length ? Math.round((count / state.entries.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [state.entries]);

  const handleCopySummary = async () => {
    const text = buildReflectionSummaryText(state);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback download if clipboard unavailable
      handleDownloadSummary();
    }
  };

  const handleDownloadSummary = () => {
    const text = buildReflectionSummaryText(state);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medicate-reflection-summary-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (state.entries.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-medium tracking-tight text-[#1A1D2E]">Mind Analysis</h1>
          <p className="text-sm text-[#5A617A]">
            Understand recurring emotional patterns, possible stress influences, and restorative rhythms.
          </p>
        </div>

        <div className="bg-white border border-[#E5E8F2] rounded-2xl p-10 text-center space-y-3">
          <h2 className="text-xl font-medium text-[#1A1D2E]">No entries to analyze yet</h2>
          <p className="text-sm text-[#5A617A] max-w-md mx-auto">
            Once you record a few daily check-ins in Mind Tracking, Medicate will surface your
            recurring emotional tones, stress trigger correlations, and behavioral trends here.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('tracking')}
              className="px-5 py-2.5 rounded-lg bg-[#5B49B8] text-white text-sm font-medium hover:bg-[#4A3A9C] transition-colors"
            >
              Log Your First Check-in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Summary Export */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-medium tracking-tight text-[#1A1D2E]">Mind Analysis</h1>
          <p className="text-sm text-[#5A617A] max-w-2xl">
            Visual synthesis of your {state.entries.length} self-reported check-ins—highlighting
            recurring emotional tones, possible stress associations, and restorative patterns.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopySummary}
            className="px-3.5 py-2 rounded-lg border border-[#E5E8F2] bg-white text-xs font-medium text-[#1A1D2E] hover:bg-[#F8F9FC] inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[#16A34A]" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-[#5B49B8]" aria-hidden="true" />
            )}
            <span>{copied ? 'Summary Copied' : 'Copy Summary'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadSummary}
            className="px-3.5 py-2 rounded-lg border border-[#E5E8F2] bg-white text-xs font-medium text-[#1A1D2E] hover:bg-[#F8F9FC] inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5 text-[#4A89C8]" aria-hidden="true" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Clear Distinction: Personal Observations vs. Medical Diagnosis */}
      <section
        aria-label="Important guidance about personal observations"
        className="bg-[#F5F3FF] border border-[#DDD6FE] rounded-2xl p-5 sm:p-6 flex items-start gap-4"
      >
        <Info className="h-5 w-5 text-[#5B49B8] shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1.5 text-sm">
          <div className="font-semibold text-[#1A1D2E]">
            Personal Observations, Not Medical Diagnoses
          </div>
          <p className="text-xs sm:text-[13px] leading-relaxed text-[#3A3F58]">
            Everything shown below is a descriptive summary of patterns in your own self-reported
            logs. Medicate does not diagnose mental health conditions or replace care from a
            licensed clinician. If you are experiencing persistent distress or feel unsafe, consider
            sharing your reflections with a healthcare professional or contacting local support
            services.
          </p>
        </div>
      </section>

      {/* Synthesized Observations Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {observations.map((obs) => (
          <div
            key={obs.id}
            className="bg-white border border-[#E5E8F2] rounded-2xl p-6 space-y-2.5 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="text-xs text-[#767E98]">
                {obs.tone === 'restorative'
                  ? 'Restorative observation'
                  : obs.tone === 'attention'
                    ? 'Possible stress association'
                    : 'Behavioral observation'}
              </div>
              <h2 className="text-lg font-medium text-[#1A1D2E]">{obs.title}</h2>
              <p className="text-sm leading-relaxed text-[#5A617A]">{obs.observation}</p>
            </div>
            <div className="pt-3 border-t border-[#E5E8F2] text-xs text-[#767E98]">{obs.basis}</div>
          </div>
        ))}
      </section>

      {/* Trigger Impact Correlation Chart + Table */}
      <section className="bg-white border border-[#E5E8F2] rounded-2xl p-6 space-y-6">
        <div className="pb-4 border-b border-[#E5E8F2]">
          <h2 className="text-xl font-medium text-[#1A1D2E]">
            Possible Stress Triggers & Restorative Contexts
          </h2>
          <p className="text-xs text-[#767E98] mt-1">
            Compares your average stress on days a context was noted against your personal baseline
            (positive values indicate higher observed stress; negative values indicate calmer days).
          </p>
        </div>

        {triggers.length === 0 ? (
          <p className="text-sm text-[#5A617A] py-4">
            Tag context factors (such as Sleep Quality, Work & Deadlines, or Nature) in your check-ins
            to compare their association with your stress and mood.
          </p>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-center">
            <div className="xl:col-span-6 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={triggers.slice(0, 7)}
                  layout="vertical"
                  margin={{ top: 4, right: 20, left: 10, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E8F2" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[-4, 4]}
                    tick={{ fill: '#767E98', fontSize: 12 }}
                    axisLine={{ stroke: '#E5E8F2' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="trigger"
                    width={136}
                    tick={{ fill: '#3A3F58', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ReferenceLine x={0} stroke="#9097AE" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E8F2',
                      borderRadius: '10px',
                      fontSize: '12px',
                    }}
                    formatter={(value: unknown) => {
                      const num = Number(value);
                      return [`${num >= 0 ? '+' : ''}${num} pts vs baseline`, 'Stress shift'];
                    }}
                  />
                  <Bar dataKey="stressDelta" radius={[4, 4, 4, 4]} barSize={18}>
                    {triggers.slice(0, 7).map((item) => (
                      <Cell
                        key={item.trigger}
                        fill={item.stressDelta > 0.3 ? '#6D5BD0' : '#4A89C8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="xl:col-span-6 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E8F2] text-xs text-[#767E98]">
                    <th className="py-2.5 font-medium">Context</th>
                    <th className="py-2.5 font-medium text-right">Entries</th>
                    <th className="py-2.5 font-medium text-right">Avg Stress</th>
                    <th className="py-2.5 font-medium text-right">Avg Mood</th>
                    <th className="py-2.5 font-medium text-right">Baseline Shift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E8F2] text-sm">
                  {triggers.map((item) => (
                    <tr key={item.trigger} className="hover:bg-[#F8F9FC]">
                      <td className="py-2.5 font-medium text-[#1A1D2E]">{item.trigger}</td>
                      <td className="py-2.5 text-right font-mono text-xs tabular-nums text-[#5A617A]">
                        {item.count}
                      </td>
                      <td className="py-2.5 text-right font-mono text-xs tabular-nums text-[#1A1D2E]">
                        {item.avgStress} / 10
                      </td>
                      <td className="py-2.5 text-right font-mono text-xs tabular-nums text-[#1A1D2E]">
                        {item.avgMood} / 5
                      </td>
                      <td
                        className={`py-2.5 text-right font-mono text-xs tabular-nums font-medium ${
                          item.stressDelta > 0.5
                            ? 'text-[#5B49B8]'
                            : item.stressDelta < -0.5
                              ? 'text-[#2B5D8F]'
                              : 'text-[#5A617A]'
                        }`}
                      >
                        {item.stressDelta >= 0 ? `+${item.stressDelta}` : item.stressDelta} stress
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Bottom 2-Column Split: Emotional Landscape + Behavioral Patterns */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Recurring Emotional Landscape */}
        <div className="xl:col-span-6 bg-white border border-[#E5E8F2] rounded-2xl p-6 space-y-5">
          <div className="pb-4 border-b border-[#E5E8F2]">
            <h2 className="text-xl font-medium text-[#1A1D2E]">Recurring Emotional Patterns</h2>
            <p className="text-xs text-[#767E98] mt-1">
              Share of emotions recorded across all check-ins
            </p>
          </div>

          <div className="space-y-3.5">
            {emotions.slice(0, 8).map((item) => (
              <div key={item.emotion} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#1A1D2E]">{item.emotion}</span>
                  <span className="font-mono tabular-nums text-[#5A617A]">
                    {item.count} {item.count === 1 ? 'time' : 'times'} · {item.percentage}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F3F5FA] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#6D5BD0] to-[#4A89C8]"
                    style={{ width: `${Math.max(item.percentage, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Behavioral Rhythm & Journal Themes */}
        <div className="xl:col-span-6 bg-white border border-[#E5E8F2] rounded-2xl p-6 space-y-6">
          <div className="pb-4 border-b border-[#E5E8F2]">
            <h2 className="text-xl font-medium text-[#1A1D2E]">Behavioral Rhythm & Themes</h2>
            <p className="text-xs text-[#767E98] mt-1">
              How your mind shifts across the week and what appears most in your writing
            </p>
          </div>

          {/* Weekday vs Weekend */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#F8F9FC] space-y-2">
              <div className="text-xs text-[#767E98]">Weekdays ({weekSplit.weekday.count} logs)</div>
              <div className="space-y-1 font-mono text-xs tabular-nums text-[#1A1D2E]">
                <div className="flex justify-between">
                  <span className="font-sans text-[#5A617A]">Avg Mood</span>
                  <span>{weekSplit.weekday.avgMood ?? '—'} / 5</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-[#5A617A]">Avg Stress</span>
                  <span>{weekSplit.weekday.avgStress ?? '—'} / 10</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-[#5A617A]">Avg Energy</span>
                  <span>{weekSplit.weekday.avgEnergy ?? '—'} / 10</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F9FC] space-y-2">
              <div className="text-xs text-[#767E98]">Weekends ({weekSplit.weekend.count} logs)</div>
              <div className="space-y-1 font-mono text-xs tabular-nums text-[#1A1D2E]">
                <div className="flex justify-between">
                  <span className="font-sans text-[#5A617A]">Avg Mood</span>
                  <span>{weekSplit.weekend.avgMood ?? '—'} / 5</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-[#5A617A]">Avg Stress</span>
                  <span>{weekSplit.weekend.avgStress ?? '—'} / 10</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-[#5A617A]">Avg Energy</span>
                  <span>{weekSplit.weekend.avgEnergy ?? '—'} / 10</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mental Clarity Breakdown */}
          <div className="space-y-2.5 pt-2 border-t border-[#E5E8F2]">
            <div className="text-xs font-medium text-[#3A3F58]">Mental Clarity States</div>
            <div className="divide-y divide-[#E5E8F2]">
              {mentalStateCounts.map((ms) => (
                <div
                  key={ms.name}
                  className="py-2 flex items-center justify-between text-xs text-[#3A3F58]"
                >
                  <span>{ms.name}</span>
                  <span className="font-mono tabular-nums text-[#5A617A]">
                    {ms.count} entries · {ms.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recurring Thought Themes */}
          {themes.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#E5E8F2]">
              <div className="text-xs font-medium text-[#3A3F58]">Recurring Journal Themes</div>
              <div className="space-y-1.5">
                {themes.map((t) => (
                  <div
                    key={t.theme}
                    className="flex items-center justify-between text-xs text-[#5A617A]"
                  >
                    <span>{t.theme}</span>
                    <span className="font-mono tabular-nums text-[#1A1D2E]">
                      {t.mentions} {t.mentions === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
