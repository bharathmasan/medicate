import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { BREATHING_PATTERNS, daysAgoISO } from '../data/seedData';
import { ExerciseDefinition, ExerciseSessionLog } from '../types/wellness';
import { playSoftChime } from '../utils/audio';

interface ExerciseStudioModalProps {
  exercise: ExerciseDefinition | null;
  onClose: () => void;
  onCompleteSession: (session: Omit<ExerciseSessionLog, 'id'>) => void;
}

type BreathPhaseKey = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

interface BreathPhase {
  key: BreathPhaseKey;
  label: string;
  seconds: number;
  scale: number;
  guidance: string;
}

const GROUNDING_STEPS = [
  { count: 5, sense: 'Sight', prompt: 'Name 5 quiet details you can see around you right now.' },
  { count: 4, sense: 'Touch', prompt: 'Notice 4 physical textures you can feel (chair, fabric, air, floor).' },
  { count: 3, sense: 'Sound', prompt: 'Listen for 3 distinct sounds, near or distant.' },
  { count: 2, sense: 'Smell', prompt: 'Notice 2 subtle scents in the space around you.' },
  { count: 1, sense: 'Taste or Breath', prompt: 'Notice 1 taste in your mouth or the cool air on a slow inhale.' },
];

export function ExerciseStudioModal({
  exercise,
  onClose,
  onCompleteSession,
}: ExerciseStudioModalProps) {
  if (!exercise) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1D2E]/45 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="studio-exercise-title"
    >
      <div className="bg-white border border-[#E5E8F2] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Studio Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[#E5E8F2] shrink-0">
          <div>
            <div className="text-xs text-[#767E98]">
              {exercise.category} · {exercise.durationMinutes} min recommended
            </div>
            <h2 id="studio-exercise-title" className="text-2xl font-medium text-[#1A1D2E] mt-0.5">
              {exercise.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close exercise studio"
            className="h-9 w-9 flex items-center justify-center rounded-lg text-[#5A617A] hover:bg-[#F3F5FA] hover:text-[#1A1D2E] shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Studio Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {exercise.modality === 'breathing' && (
            <BreathingStudio
              exercise={exercise}
              onComplete={(notes, durationMinutes) => {
                onCompleteSession({
                  exerciseId: exercise.id,
                  title: exercise.title,
                  category: exercise.category,
                  durationMinutes,
                  completedAt: new Date().toISOString(),
                  date: daysAgoISO(0),
                  notes,
                });
                onClose();
              }}
            />
          )}

          {exercise.modality === 'meditation' && (
            <MeditationStudio
              exercise={exercise}
              onComplete={(notes, durationMinutes) => {
                onCompleteSession({
                  exerciseId: exercise.id,
                  title: exercise.title,
                  category: exercise.category,
                  durationMinutes,
                  completedAt: new Date().toISOString(),
                  date: daysAgoISO(0),
                  notes,
                });
                onClose();
              }}
            />
          )}

          {exercise.modality === 'grounding' && (
            <GroundingStudio
              onComplete={(notes) => {
                onCompleteSession({
                  exerciseId: exercise.id,
                  title: exercise.title,
                  category: exercise.category,
                  durationMinutes: exercise.durationMinutes,
                  completedAt: new Date().toISOString(),
                  date: daysAgoISO(0),
                  notes,
                });
                onClose();
              }}
            />
          )}

          {exercise.modality === 'reflection' && (
            <ReflectionStudio
              exercise={exercise}
              onComplete={(responses) => {
                onCompleteSession({
                  exerciseId: exercise.id,
                  title: exercise.title,
                  category: exercise.category,
                  durationMinutes: exercise.durationMinutes,
                  completedAt: new Date().toISOString(),
                  date: daysAgoISO(0),
                  reflectionResponses: responses,
                });
                onClose();
              }}
            />
          )}

          {exercise.modality === 'focus' && (
            <FocusStudio
              onComplete={(durationMinutes, focusReturns, notes) => {
                onCompleteSession({
                  exerciseId: exercise.id,
                  title: exercise.title,
                  category: exercise.category,
                  durationMinutes,
                  completedAt: new Date().toISOString(),
                  date: daysAgoISO(0),
                  focusReturns,
                  notes,
                });
                onClose();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* 1. Guided Breathing Studio */
function BreathingStudio({
  exercise,
  onComplete,
}: {
  exercise: ExerciseDefinition;
  onComplete: (notes: string | undefined, durationMinutes: number) => void;
}) {
  const initialPattern =
    BREATHING_PATTERNS.find((p) => p.id === exercise.breathingPatternId) || BREATHING_PATTERNS[0];

  const [patternId, setPatternId] = useState(initialPattern.id);
  const [running, setRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(initialPattern.inhale);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [notes, setNotes] = useState('');

  const pattern = useMemo(
    () => BREATHING_PATTERNS.find((p) => p.id === patternId) || BREATHING_PATTERNS[0],
    [patternId]
  );

  const phases: BreathPhase[] = useMemo(() => {
    const list: BreathPhase[] = [
      {
        key: 'inhale',
        label: 'Inhale',
        seconds: pattern.inhale,
        scale: 1.24,
        guidance: 'Draw a slow, quiet breath in through your nose.',
      },
    ];
    if (pattern.holdIn > 0) {
      list.push({
        key: 'holdIn',
        label: 'Hold',
        seconds: pattern.holdIn,
        scale: 1.24,
        guidance: 'Rest gently at the top of the breath without strain.',
      });
    }
    list.push({
      key: 'exhale',
      label: 'Exhale',
      seconds: pattern.exhale,
      scale: 0.84,
      guidance: 'Release the breath smoothly and let your shoulders soften.',
    });
    if (pattern.holdOut > 0) {
      list.push({
        key: 'holdOut',
        label: 'Rest',
        seconds: pattern.holdOut,
        scale: 0.84,
        guidance: 'Pause in stillness before the next natural inhale.',
      });
    }
    return list;
  }, [pattern]);

  const currentPhase = phases[phaseIdx % phases.length];

  const handleChangePattern = (newId: string) => {
    const next = BREATHING_PATTERNS.find((p) => p.id === newId) || BREATHING_PATTERNS[0];
    setPatternId(next.id);
    setRunning(false);
    setPhaseIdx(0);
    setSecondsLeft(next.inhale);
    setCyclesCompleted(0);
    setElapsedSeconds(0);
  };

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      setSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        const nextIdx = (phaseIdx + 1) % phases.length;
        if (nextIdx === 0) {
          setCyclesCompleted((c) => c + 1);
        }
        setPhaseIdx(nextIdx);
        if (soundEnabled) {
          playSoftChime(nextIdx === 0 ? 432 : nextIdx === 2 ? 324 : 384, 1.0);
        }
        return phases[nextIdx].seconds;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running, phaseIdx, phases, soundEnabled]);

  const handleToggleRun = () => {
    if (!running && soundEnabled) {
      playSoftChime(432, 1.0);
    }
    setRunning((r) => !r);
  };

  const handleReset = () => {
    setRunning(false);
    setPhaseIdx(0);
    setSecondsLeft(phases[0].seconds);
    setCyclesCompleted(0);
    setElapsedSeconds(0);
  };

  const circleScale = running ? currentPhase.scale : 1;

  return (
    <div className="space-y-6">
      {/* Pattern Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 p-1 bg-[#F3F5FA] rounded-lg">
          {BREATHING_PATTERNS.map((bp) => (
            <button
              key={bp.id}
              type="button"
              onClick={() => handleChangePattern(bp.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                patternId === bp.id
                  ? 'bg-white text-[#1A1D2E] shadow-xs'
                  : 'text-[#5A617A] hover:text-[#1A1D2E]'
              }`}
            >
              {bp.name}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSoundEnabled((s) => !s)}
          aria-label={soundEnabled ? 'Mute gentle breath chime' : 'Enable gentle breath chime'}
          className="px-3 py-1.5 rounded-lg border border-[#E5E8F2] text-xs font-medium text-[#5A617A] hover:text-[#1A1D2E] inline-flex items-center gap-1.5 whitespace-nowrap"
        >
          {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-[#5B49B8]" /> : <VolumeX className="h-3.5 w-3.5" />}
          <span>{soundEnabled ? 'Chime On' : 'Chime Off'}</span>
        </button>
      </div>

      <p className="text-xs text-[#5A617A]">{pattern.description}</p>

      {/* Breathing Visual Ring */}
      <div className="py-6 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-[#F5F3FF]/70 via-[#EFF6FF]/60 to-white border border-[#E5E8F2]">
        <div className="relative flex h-52 w-52 items-center justify-center">
          <div
            className="absolute h-40 w-40 rounded-full bg-gradient-to-br from-[#DDD6FE]/80 to-[#DBEAFE]/80"
            style={{
              transform: `scale(${circleScale})`,
              transition: `transform ${running ? currentPhase.seconds : 0.4}s ease-in-out`,
            }}
            aria-hidden="true"
          />
          <div
            className="relative z-10 flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white border border-[#DDD6FE] shadow-sm text-center"
            style={{
              transform: `scale(${running ? (circleScale > 1 ? 1.08 : 0.94) : 1})`,
              transition: `transform ${running ? currentPhase.seconds : 0.4}s ease-in-out`,
            }}
          >
            <div className="text-sm font-semibold text-[#4A3A9C]">
              {running ? currentPhase.label : 'Ready'}
            </div>
            <div className="font-mono text-3xl font-medium tabular-nums text-[#1A1D2E] mt-0.5">
              {secondsLeft}s
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm text-[#3A3F58] text-center max-w-sm px-4 min-h-[40px]">
          {running ? currentPhase.guidance : 'Press Start when you are settled and comfortable.'}
        </p>

        <div className="mt-3 text-xs text-[#767E98] font-mono tabular-nums">
          Cycles completed: {cyclesCompleted} / {pattern.recommendedCycles} · Elapsed:{' '}
          {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleRun}
            className="px-5 py-2.5 rounded-lg bg-[#5B49B8] text-white text-sm font-medium hover:bg-[#4A3A9C] inline-flex items-center gap-2 whitespace-nowrap"
          >
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{running ? 'Pause' : elapsedSeconds > 0 ? 'Resume' : 'Start Breathing'}</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2.5 rounded-lg border border-[#E5E8F2] bg-white text-sm font-medium text-[#5A617A] hover:text-[#1A1D2E] inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Optional Post-Session Note + Complete */}
      <div className="space-y-3 pt-2 border-t border-[#E5E8F2]">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[#3A3F58]">
            How does your body feel now? <span className="font-normal text-[#767E98]">(optional note)</span>
          </span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Shoulders dropped, breathing feels deeper..."
            className="w-full h-10 px-3.5 rounded-lg border border-[#E5E8F2] bg-[#F8F9FC] text-sm text-[#1A1D2E] focus:bg-white focus:border-[#5B49B8]"
          />
        </label>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() =>
              onComplete(
                notes.trim() || undefined,
                Math.max(1, Math.round(elapsedSeconds / 60) || exercise.durationMinutes)
              )
            }
            className="px-5 py-2.5 rounded-lg bg-[#1A1D2E] text-white text-sm font-medium hover:bg-[#3A3F58] inline-flex items-center gap-2 whitespace-nowrap"
          >
            <Check className="h-4 w-4" />
            <span>Log Completed Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* 2. Guided Meditation & Progressive Relaxation Studio */
function MeditationStudio({
  exercise,
  onComplete,
}: {
  exercise: ExerciseDefinition;
  onComplete: (notes: string | undefined, durationMinutes: number) => void;
}) {
  const steps = exercise.guidedSteps || [
    'Settle comfortably and take two slow breaths.',
    'Allow your attention to rest gently on the rhythm of breathing.',
    'When thoughts arise, notice them kindly and return to stillness.',
  ];
  const [durationMinutes, setDurationMinutes] = useState(exercise.durationMinutes);
  const [secondsRemaining, setSecondsRemaining] = useState(exercise.durationMinutes * 60);
  const [running, setRunning] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notes, setNotes] = useState('');

  const handleSelectDuration = (mins: number) => {
    setDurationMinutes(mins);
    setSecondsRemaining(mins * 60);
    setRunning(false);
    setStepIdx(0);
  };

  useEffect(() => {
    if (!running) return;
    const totalSeconds = durationMinutes * 60;
    const interval = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          if (soundEnabled) playSoftChime(528, 1.8);
          return 0;
        }
        const nextRemaining = prev - 1;
        const elapsed = totalSeconds - nextRemaining;
        const computedStep = Math.min(
          steps.length - 1,
          Math.floor((elapsed / totalSeconds) * steps.length)
        );
        if (computedStep !== stepIdx) {
          setStepIdx(computedStep);
          if (soundEnabled) playSoftChime(396, 1.2);
        }
        return nextRemaining;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running, durationMinutes, steps.length, stepIdx, soundEnabled]);

  const minsDisplay = Math.floor(secondsRemaining / 60);
  const secsDisplay = secondsRemaining % 60;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-[#F3F5FA] rounded-lg">
          {[3, 5, 10, 15].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleSelectDuration(m)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium tabular-nums transition-colors ${
                durationMinutes === m
                  ? 'bg-white text-[#1A1D2E] shadow-xs'
                  : 'text-[#5A617A] hover:text-[#1A1D2E]'
              }`}
            >
              {m} min
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSoundEnabled((s) => !s)}
          className="px-3 py-1.5 rounded-lg border border-[#E5E8F2] text-xs font-medium text-[#5A617A] hover:text-[#1A1D2E] inline-flex items-center gap-1.5"
        >
          {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-[#5B49B8]" /> : <VolumeX className="h-3.5 w-3.5" />}
          <span>{soundEnabled ? 'Transition Bell On' : 'Bell Off'}</span>
        </button>
      </div>

      {/* Guided Prompt Surface */}
      <div className="p-7 rounded-2xl bg-gradient-to-b from-[#F5F3FF]/60 to-[#EFF6FF]/40 border border-[#E5E8F2] text-center space-y-5">
        <div className="font-mono text-4xl font-medium tabular-nums text-[#1A1D2E]">
          {String(minsDisplay).padStart(2, '0')}:{String(secsDisplay).padStart(2, '0')}
        </div>

        <div className="text-xs text-[#767E98] tabular-nums">
          Step {stepIdx + 1} of {steps.length}
        </div>

        <p className="font-editorial text-xl leading-relaxed text-[#1A1D2E] max-w-lg mx-auto min-h-[84px]">
          {steps[stepIdx]}
        </p>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
            disabled={stepIdx === 0}
            aria-label="Previous meditation step"
            className="h-10 w-10 flex items-center justify-center rounded-lg border border-[#E5E8F2] bg-white text-[#5A617A] disabled:opacity-40 hover:text-[#1A1D2E]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (!running && soundEnabled) playSoftChime(432, 1.2);
              setRunning((r) => !r);
            }}
            className="px-6 py-2.5 rounded-lg bg-[#5B49B8] text-white text-sm font-medium hover:bg-[#4A3A9C] inline-flex items-center gap-2"
          >
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{running ? 'Pause' : secondsRemaining === 0 ? 'Restart' : 'Begin Session'}</span>
          </button>

          <button
            type="button"
            onClick={() => setStepIdx((i) => Math.min(steps.length - 1, i + 1))}
            disabled={stepIdx === steps.length - 1}
            aria-label="Next meditation step"
            className="h-10 w-10 flex items-center justify-center rounded-lg border border-[#E5E8F2] bg-white text-[#5A617A] disabled:opacity-40 hover:text-[#1A1D2E]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-[#E5E8F2]">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional takeaway from your session..."
          className="w-full h-10 px-3.5 rounded-lg border border-[#E5E8F2] bg-[#F8F9FC] text-sm text-[#1A1D2E] focus:bg-white focus:border-[#5B49B8]"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onComplete(notes.trim() || undefined, durationMinutes)}
            className="px-5 py-2.5 rounded-lg bg-[#1A1D2E] text-white text-sm font-medium hover:bg-[#3A3F58] inline-flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            <span>Complete & Save Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* 3. 5-4-3-2-1 Sensory Grounding Studio */
function GroundingStudio({
  onComplete,
}: {
  onComplete: (notes: string | undefined) => void;
}) {
  const [checked, setChecked] = useState<boolean[]>([false, false, false, false, false]);
  const [entries, setEntries] = useState<string[]>(['', '', '', '', '']);

  const completedCount = checked.filter(Boolean).length;

  const toggleStep = (idx: number) => {
    setChecked((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  const updateNote = (idx: number, val: string) => {
    setEntries((prev) => prev.map((v, i) => (i === idx ? val : v)));
    if (val.trim().length > 0 && !checked[idx]) {
      setChecked((prev) => prev.map((v, i) => (i === idx ? true : v)));
    }
  };

  const handleFinish = () => {
    const summary = GROUNDING_STEPS.map((st, idx) =>
      entries[idx].trim() ? `${st.count} ${st.sense}: ${entries[idx].trim()}` : null
    )
      .filter(Boolean)
      .join(' · ');
    onComplete(summary || 'Completed 5–4–3–2–1 sensory grounding.');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-xs text-[#5A617A]">
        <span>Move slowly through each sense. Checking off or jotting a word is enough.</span>
        <span className="font-mono tabular-nums text-[#1A1D2E]">{completedCount} / 5</span>
      </div>

      <div className="space-y-3">
        {GROUNDING_STEPS.map((step, idx) => (
          <div
            key={step.sense}
            className={`p-4 rounded-xl border transition-colors ${
              checked[idx]
                ? 'bg-[#F5F3FF]/60 border-[#DDD6FE]'
                : 'bg-white border-[#E5E8F2]'
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => toggleStep(idx)}
                aria-pressed={checked[idx]}
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border font-mono text-xs font-medium transition-colors ${
                  checked[idx]
                    ? 'bg-[#5B49B8] border-[#5B49B8] text-white'
                    : 'bg-white border-[#C5CBE0] text-[#3A3F58]'
                }`}
              >
                {checked[idx] ? <Check className="h-3.5 w-3.5" /> : step.count}
              </button>
              <div className="flex-1 space-y-2">
                <div className="text-sm font-medium text-[#1A1D2E]">
                  {step.count} · {step.sense}
                </div>
                <p className="text-xs text-[#5A617A]">{step.prompt}</p>
                <input
                  type="text"
                  value={entries[idx]}
                  onChange={(e) => updateNote(idx, e.target.value)}
                  placeholder={`Optional notes for ${step.sense.toLowerCase()}...`}
                  className="w-full h-9 px-3 rounded-lg border border-[#E5E8F2] bg-white text-xs text-[#1A1D2E] focus:border-[#5B49B8]"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleFinish}
          className="px-5 py-2.5 rounded-lg bg-[#5B49B8] text-white text-sm font-medium hover:bg-[#4A3A9C] inline-flex items-center gap-2"
        >
          <Check className="h-4 w-4" />
          <span>Save Grounding Session</span>
        </button>
      </div>
    </div>
  );
}

/* 4. Guided Gratitude & Positive Reflection Studio */
function ReflectionStudio({
  exercise,
  onComplete,
}: {
  exercise: ExerciseDefinition;
  onComplete: (responses: { prompt: string; answer: string }[]) => void;
}) {
  const prompts = exercise.reflectionPrompts || [
    'What is one small moment that supported you today?',
  ];
  const [answers, setAnswers] = useState<string[]>(prompts.map(() => ''));
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filled = prompts
      .map((prompt, idx) => ({ prompt, answer: answers[idx].trim() }))
      .filter((item) => item.answer.length > 0);

    if (filled.length === 0) {
      setError('Write at least one brief reflection before saving this session.');
      return;
    }
    onComplete(filled);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-[#5A617A]">
        Take your time with each prompt. Your reflections are saved privately in your session log.
      </p>

      {prompts.map((prompt, idx) => (
        <label key={prompt} className="block space-y-2">
          <span className="block text-sm font-medium text-[#1A1D2E]">
            {idx + 1}. {prompt}
          </span>
          <textarea
            rows={3}
            value={answers[idx]}
            onChange={(e) => {
              const val = e.target.value;
              setAnswers((prev) => prev.map((item, i) => (i === idx ? val : item)));
              if (error) setError('');
            }}
            placeholder="Write a few honest sentences..."
            className="w-full rounded-xl border border-[#E5E8F2] bg-[#F8F9FC] px-4 py-3 text-sm text-[#1A1D2E] focus:bg-white focus:border-[#5B49B8] resize-y"
          />
        </label>
      ))}

      {error && (
        <div role="alert" className="text-xs text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-4 py-2.5">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="px-5 py-2.5 rounded-lg bg-[#5B49B8] text-white text-sm font-medium hover:bg-[#4A3A9C] inline-flex items-center gap-2"
        >
          <Check className="h-4 w-4" />
          <span>Save Reflection</span>
        </button>
      </div>
    </form>
  );
}

/* 5. Single-Point Focus Training Studio */
function FocusStudio({
  onComplete,
}: {
  onComplete: (durationMinutes: number, focusReturns: number, notes: string | undefined) => void;
}) {
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [secondsLeft, setSecondsLeft] = useState(10 * 60);
  const [running, setRunning] = useState(false);
  const [intention, setIntention] = useState('');
  const [returnsCount, setReturnsCount] = useState(0);

  const handleSelectDuration = (mins: number) => {
    setDurationMinutes(mins);
    setSecondsLeft(mins * 60);
    setRunning(false);
  };

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          playSoftChime(528, 1.6);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-medium text-[#3A3F58]">Focus Duration</span>
        <div className="flex items-center gap-1 p-1 bg-[#F3F5FA] rounded-lg">
          {[5, 10, 15, 25].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleSelectDuration(m)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium tabular-nums ${
                durationMinutes === m
                  ? 'bg-white text-[#1A1D2E] shadow-xs'
                  : 'text-[#5A617A] hover:text-[#1A1D2E]'
              }`}
            >
              {m} min
            </button>
          ))}
        </div>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-[#3A3F58]">Single Focus Intention</span>
        <input
          type="text"
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          placeholder="e.g., Draft two paragraphs calmly without checking tabs"
          className="w-full h-10 px-3.5 rounded-lg border border-[#E5E8F2] bg-[#F8F9FC] text-sm text-[#1A1D2E] focus:bg-white focus:border-[#5B49B8]"
        />
      </label>

      <div className="p-7 rounded-2xl bg-[#F8F9FC] border border-[#E5E8F2] text-center space-y-5">
        <div className="font-mono text-5xl font-medium tabular-nums text-[#1A1D2E]">
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>

        <p className="text-xs text-[#5A617A] max-w-md mx-auto leading-relaxed">
          Each time you notice your attention drifting, tap “Notice & Return”. Noticing distraction
          is the core repetition that builds calm focus.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="px-5 py-2.5 rounded-lg bg-[#5B49B8] text-white text-sm font-medium hover:bg-[#4A3A9C] inline-flex items-center gap-2"
          >
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{running ? 'Pause Timer' : 'Start Focus Block'}</span>
          </button>

          <button
            type="button"
            onClick={() => setReturnsCount((c) => c + 1)}
            className="px-4 py-2.5 rounded-lg border border-[#DDD6FE] bg-[#F5F3FF] text-sm font-medium text-[#4A3A9C] hover:bg-[#EDE9FE] tabular-nums"
          >
            Notice & Return ({returnsCount})
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() =>
            onComplete(
              durationMinutes,
              returnsCount,
              intention.trim() ? `Focus intention: ${intention.trim()}` : undefined
            )
          }
          className="px-5 py-2.5 rounded-lg bg-[#1A1D2E] text-white text-sm font-medium hover:bg-[#3A3F58] inline-flex items-center gap-2"
        >
          <Check className="h-4 w-4" />
          <span>Complete Focus Session</span>
        </button>
      </div>
    </div>
  );
}
