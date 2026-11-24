import { useState } from 'react';
import { Download, RotateCcw, ShieldCheck, Trash2, X } from 'lucide-react';
import { WellnessState } from '../types/wellness';
import { exportWellnessStateAsJSON } from '../utils/storage';

interface PrivacyModalProps {
  open: boolean;
  state: WellnessState;
  onClose: () => void;
  onUpdateUserName: (name: string) => void;
  onRestoreSampleData: () => void;
  onClearAllData: () => void;
}

export function PrivacyModal({
  open,
  state,
  onClose,
  onUpdateUserName,
  onRestoreSampleData,
  onClearAllData,
}: PrivacyModalProps) {
  const [nameInput, setNameInput] = useState(state.userName);
  const [confirmClear, setConfirmClear] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (!open) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    onUpdateUserName(trimmed);
    setFeedback('Preferred name saved.');
    window.setTimeout(() => setFeedback(''), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1D2E]/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      <div className="bg-white border border-[#E5E8F2] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E8F2]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-[#5B49B8]" aria-hidden="true" />
            <h2 id="privacy-modal-title" className="text-xl font-medium text-[#1A1D2E]">
              Privacy & Personal Data
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close privacy controls"
            className="h-9 w-9 flex items-center justify-center rounded-lg text-[#5A617A] hover:bg-[#F3F5FA] hover:text-[#1A1D2E]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm leading-relaxed text-[#5A617A]">
            Your reflections, mood history, and completed exercises stay privately in your browser’s
            local storage on this device. Medicate never transmits or sells your personal journal
            entries.
          </p>

          {/* Personalization */}
          <form onSubmit={handleSaveName} className="space-y-2">
            <label htmlFor="preferred-name" className="block text-xs font-medium text-[#3A3F58]">
              Preferred Name
            </label>
            <div className="flex items-center gap-2">
              <input
                id="preferred-name"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={40}
                className="flex-1 h-10 px-3.5 rounded-lg border border-[#E5E8F2] bg-[#F8F9FC] text-sm text-[#1A1D2E] focus:bg-white focus:border-[#5B49B8]"
              />
              <button
                type="submit"
                className="px-4 py-2 h-10 rounded-lg bg-[#5B49B8] text-white text-xs font-medium hover:bg-[#4A3A9C] transition-colors whitespace-nowrap"
              >
                Update
              </button>
            </div>
            {feedback && <p className="text-xs text-[#4A3A9C]">{feedback}</p>}
          </form>

          {/* Data Controls */}
          <div className="pt-4 border-t border-[#E5E8F2] space-y-3">
            <div className="text-xs font-medium text-[#3A3F58]">Data Management</div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => exportWellnessStateAsJSON(state)}
                className="px-4 py-2 rounded-lg border border-[#E5E8F2] bg-white text-xs font-medium text-[#1A1D2E] hover:bg-[#F8F9FC] inline-flex items-center gap-2 whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5 text-[#5B49B8]" aria-hidden="true" />
                <span>Export JSON Backup</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onRestoreSampleData();
                  setConfirmClear(false);
                  setFeedback('Sample wellness dataset restored.');
                }}
                className="px-4 py-2 rounded-lg border border-[#E5E8F2] bg-white text-xs font-medium text-[#1A1D2E] hover:bg-[#F8F9FC] inline-flex items-center gap-2 whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5 text-[#4A89C8]" aria-hidden="true" />
                <span>Load Sample Data</span>
              </button>
            </div>

            <div className="pt-2">
              {!confirmClear ? (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="text-xs font-medium text-[#DC2626] hover:text-[#991B1B] inline-flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Clear all local entries and start fresh</span>
                </button>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] space-y-2.5">
                  <p className="text-xs text-[#991B1B]">
                    This permanently clears all logged check-ins and sessions stored in this browser.
                    Export a JSON backup first if you wish to keep a copy.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClearAllData();
                        setConfirmClear(false);
                        setFeedback('All personal entries cleared.');
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-[#DC2626] text-white text-xs font-medium hover:bg-[#B91C1C]"
                    >
                      Yes, clear everything
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="px-3.5 py-1.5 rounded-lg bg-white border border-[#E5E8F2] text-xs font-medium text-[#3A3F58]"
                    >
                      Keep my data
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
