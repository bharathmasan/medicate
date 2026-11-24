/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu } from 'lucide-react';
import { DailyChallengesView } from './components/DailyChallengesView';
import { DashboardView } from './components/DashboardView';
import { ExerciseStudioModal } from './components/ExerciseStudioModal';
import { MentalExercisesView } from './components/MentalExercisesView';
import { MindAnalysisView } from './components/MindAnalysisView';
import { MindTrackingView } from './components/MindTrackingView';
import { PrivacyModal } from './components/PrivacyModal';
import { ProgressAnalyticsView } from './components/ProgressAnalyticsView';
import { Sidebar } from './components/Sidebar';
import { createInitialSampleState, daysAgoISO, EXERCISE_CATALOG } from './data/seedData';
import {
  DailyChallenge,
  ExerciseSessionLog,
  MindEntry,
  NavigationSection,
  ReminderSettings,
  WellnessState,
} from './types/wellness';
import { computeMindfulnessStreak } from './utils/analytics';
import {
  clearAllWellnessData,
  loadWellnessState,
  saveWellnessState,
} from './utils/storage';

const SECTION_LABELS: Record<NavigationSection, string> = {
  dashboard: 'Dashboard',
  tracking: 'Mind Tracking',
  analysis: 'Mind Analysis',
  exercises: 'Mental Exercises',
  challenges: 'Daily Challenges',
  analytics: 'Progress Analytics',
};

export default function App() {
  const [state, setState] = useState<WellnessState>(() => loadWellnessState());
  const [activeSection, setActiveSection] = useState<NavigationSection>('dashboard');
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    saveWellnessState(state);
  }, [state]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  const streakDays = useMemo(
    () => computeMindfulnessStreak(state.entries, state.sessions),
    [state.entries, state.sessions]
  );

  const activeExercise = useMemo(
    () => EXERCISE_CATALOG.find((ex) => ex.id === activeExerciseId) || null,
    [activeExerciseId]
  );

  const handleSaveEntry = (
    draft: Omit<MindEntry, 'id' | 'createdAt'>,
    editingId?: string
  ) => {
    setState((prev) => {
      let nextEntries: MindEntry[];
      if (editingId) {
        nextEntries = prev.entries.map((item) =>
          item.id === editingId ? { ...item, ...draft } : item
        );
      } else {
        const newEntry: MindEntry = {
          ...draft,
          id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date().toISOString(),
        };
        nextEntries = [newEntry, ...prev.entries];
      }
      nextEntries.sort((a, b) =>
        b.date === a.date
          ? b.createdAt.localeCompare(a.createdAt)
          : b.date.localeCompare(a.date)
      );

      // Automatically mark today's check-in daily challenge complete if logging for today
      const todayISO = daysAgoISO(0);
      const nextChallenges =
        draft.date === todayISO
          ? prev.challenges.map((ch) =>
              ch.id === 'ch-morning-checkin' && !ch.completedDates.includes(todayISO)
                ? { ...ch, completedDates: [...ch.completedDates, todayISO] }
                : ch
            )
          : prev.challenges;

      return {
        ...prev,
        entries: nextEntries,
        challenges: nextChallenges,
      };
    });
  };

  const handleDeleteEntry = (id: string) => {
    setState((prev) => ({
      ...prev,
      entries: prev.entries.filter((e) => e.id !== id),
    }));
    showToast('Check-in removed.');
  };

  const handleCompleteSession = (session: Omit<ExerciseSessionLog, 'id'>) => {
    const newSession: ExerciseSessionLog = {
      ...session,
      id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    const todayISO = daysAgoISO(0);

    setState((prev) => ({
      ...prev,
      sessions: [newSession, ...prev.sessions],
      challenges: prev.challenges.map((ch) =>
        ch.linkedExerciseId === session.exerciseId && !ch.completedDates.includes(todayISO)
          ? { ...ch, completedDates: [...ch.completedDates, todayISO] }
          : ch
      ),
    }));
    showToast(`Completed "${session.title}" (${session.durationMinutes} min).`);
  };

  const handleToggleChallenge = (challengeId: string, dateISO: string) => {
    setState((prev) => ({
      ...prev,
      challenges: prev.challenges.map((ch) => {
        if (ch.id !== challengeId) return ch;
        const exists = ch.completedDates.includes(dateISO);
        return {
          ...ch,
          completedDates: exists
            ? ch.completedDates.filter((d) => d !== dateISO)
            : [...ch.completedDates, dateISO],
        };
      }),
    }));
  };

  const handleAddChallenge = (
    draft: Omit<DailyChallenge, 'id' | 'completedDates'>
  ) => {
    const newChallenge: DailyChallenge = {
      ...draft,
      id: `ch-custom-${Date.now()}`,
      completedDates: [],
    };
    setState((prev) => ({
      ...prev,
      challenges: [...prev.challenges, newChallenge],
    }));
    showToast(`Added "${draft.title}" to your daily goals.`);
  };

  const handleDeleteChallenge = (challengeId: string) => {
    setState((prev) => ({
      ...prev,
      challenges: prev.challenges.filter((ch) => ch.id !== challengeId),
    }));
  };

  const handleUpdateReminders = (reminders: ReminderSettings) => {
    setState((prev) => ({ ...prev, reminders }));
  };

  const handleUpdateUserName = (userName: string) => {
    setState((prev) => ({ ...prev, userName }));
  };

  const handleRestoreSampleData = () => {
    const sample = createInitialSampleState();
    setState({ ...sample, userName: state.userName || sample.userName });
    showToast('Sample wellness data restored.');
  };

  const handleClearAllData = () => {
    const cleared = clearAllWellnessData(state.userName);
    setState(cleared);
    showToast('All local personal entries cleared.');
  };

  const handleNavigate = (section: NavigationSection) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex bg-[#F8F9FC] text-[#1A1D2E]">
      {/* Sidebar Rail & Mobile Drawer */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={handleNavigate}
        streakDays={streakDays}
        onOpenPrivacy={() => setPrivacyOpen(true)}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Contextual Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-[#F8F9FC]/90 backdrop-blur-md border-b border-[#E5E8F2] px-4 sm:px-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-[#E5E8F2] bg-white text-[#3A3F58] hover:text-[#1A1D2E] shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-sm truncate">
              <span className="font-editorial font-medium text-[#1A1D2E] lg:text-[#767E98] lg:font-sans lg:font-normal whitespace-nowrap">
                Medicate
              </span>
              <span className="text-[#C5CBE0]" aria-hidden="true">
                /
              </span>
              <span className="font-medium text-[#1A1D2E] truncate">
                {SECTION_LABELS[activeSection]}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            {activeSection === 'tracking' ? (
              <button
                type="button"
                onClick={() => setActiveExerciseId('breath-box')}
                className="px-4 py-2 rounded-lg bg-[#5B49B8] text-white text-xs font-medium hover:bg-[#4A3A9C] transition-colors whitespace-nowrap shrink-0"
              >
                4-Min Breathing
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleNavigate('tracking')}
                className="px-4 py-2 rounded-lg bg-[#5B49B8] text-white text-xs font-medium hover:bg-[#4A3A9C] transition-colors whitespace-nowrap shrink-0"
              >
                Log Check-in
              </button>
            )}
          </div>
        </header>

        {/* Main Viewport Container */}
        <main className="flex-1 w-full max-w-[1160px] mx-auto px-4 sm:px-8 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeSection === 'dashboard' && (
                <DashboardView
                  state={state}
                  onNavigate={handleNavigate}
                  onLaunchExercise={(id) => setActiveExerciseId(id)}
                  onToggleChallenge={handleToggleChallenge}
                />
              )}

              {activeSection === 'tracking' && (
                <MindTrackingView
                  entries={state.entries}
                  onSaveEntry={handleSaveEntry}
                  onDeleteEntry={handleDeleteEntry}
                />
              )}

              {activeSection === 'analysis' && (
                <MindAnalysisView state={state} onNavigate={handleNavigate} />
              )}

              {activeSection === 'exercises' && (
                <MentalExercisesView
                  sessions={state.sessions}
                  onLaunchExercise={(id) => setActiveExerciseId(id)}
                />
              )}

              {activeSection === 'challenges' && (
                <DailyChallengesView
                  challenges={state.challenges}
                  entries={state.entries}
                  reminders={state.reminders}
                  onToggleChallenge={handleToggleChallenge}
                  onAddChallenge={handleAddChallenge}
                  onDeleteChallenge={handleDeleteChallenge}
                  onUpdateReminders={handleUpdateReminders}
                  onLaunchExercise={(id) => setActiveExerciseId(id)}
                />
              )}

              {activeSection === 'analytics' && <ProgressAnalyticsView state={state} />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Quiet Supportive Footer */}
        <footer className="w-full max-w-[1160px] mx-auto px-4 sm:px-8 py-6 border-t border-[#E5E8F2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#767E98]">
          <p>
            Medicate is a personal reflection companion. Insights are self-tracked observations and
            do not constitute medical advice or diagnosis.
          </p>
          <button
            type="button"
            onClick={() => setPrivacyOpen(true)}
            className="text-[#5A617A] hover:text-[#1A1D2E] font-medium self-start sm:self-auto whitespace-nowrap"
          >
            Local-only privacy settings
          </button>
        </footer>
      </div>

      {/* Gentle Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-40 max-w-sm bg-[#1A1D2E] text-white text-xs font-medium px-4 py-3 rounded-xl shadow-lg"
        >
          {toastMessage}
        </div>
      )}

      {/* Guided Exercise Studio Modal */}
      <ExerciseStudioModal
        exercise={activeExercise}
        onClose={() => setActiveExerciseId(null)}
        onCompleteSession={handleCompleteSession}
      />

      {/* Privacy & Data Controls Modal */}
      <PrivacyModal
        open={privacyOpen}
        state={state}
        onClose={() => setPrivacyOpen(false)}
        onUpdateUserName={handleUpdateUserName}
        onRestoreSampleData={handleRestoreSampleData}
        onClearAllData={handleClearAllData}
      />
    </div>
  );
}
