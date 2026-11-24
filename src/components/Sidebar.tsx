import {
  Activity,
  BarChart3,
  CheckCircle2,
  Compass,
  LayoutDashboard,
  PenLine,
  ShieldCheck,
  X,
} from 'lucide-react';
import { NavigationSection } from '../types/wellness';

interface SidebarProps {
  activeSection: NavigationSection;
  onSelectSection: (section: NavigationSection) => void;
  streakDays: number;
  onOpenPrivacy: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: {
  id: NavigationSection;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tracking', label: 'Mind Tracking', icon: PenLine },
  { id: 'analysis', label: 'Mind Analysis', icon: Compass },
  { id: 'exercises', label: 'Mental Exercises', icon: Activity },
  { id: 'challenges', label: 'Daily Challenges', icon: CheckCircle2 },
  { id: 'analytics', label: 'Progress Analytics', icon: BarChart3 },
];

export function Sidebar({
  activeSection,
  onSelectSection,
  streakDays,
  onOpenPrivacy,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const handleSelect = (section: NavigationSection) => {
    onSelectSection(section);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex h-full flex-col bg-white border-r border-[#E5E8F2]">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-[#E5E8F2]">
        <button
          type="button"
          onClick={() => handleSelect('dashboard')}
          className="text-left focus-visible:outline-2 rounded"
        >
          <span className="font-editorial text-2xl font-medium tracking-tight text-[#1A1D2E] whitespace-nowrap">
            Medicate
          </span>
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg text-[#5A617A] hover:bg-[#F3F5FA] hover:text-[#1A1D2E] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Primary Navigation */}
      <nav aria-label="Primary navigation" className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#F5F3FF] text-[#4A3A9C]'
                  : 'text-[#5A617A] hover:bg-[#F8F9FC] hover:text-[#1A1D2E]'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? 'text-[#5B49B8]' : 'text-[#767E98]'
                }`}
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Privacy & Streak Footer */}
      <div className="px-5 py-5 border-t border-[#E5E8F2] space-y-4">
        <div className="space-y-1">
          <div className="text-xs text-[#767E98]">Current rhythm</div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-lg font-medium tabular-nums text-[#1A1D2E]">
              {streakDays}
            </span>
            <span className="text-xs text-[#5A617A]">
              {streakDays === 1 ? 'consecutive day' : 'consecutive days'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onOpenPrivacy();
            onCloseMobile();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-[#5A617A] hover:bg-[#F8F9FC] hover:text-[#1A1D2E] border border-[#E5E8F2] transition-colors whitespace-nowrap"
        >
          <ShieldCheck className="h-4 w-4 text-[#5B49B8] shrink-0" aria-hidden="true" />
          <span>Privacy & Data Controls</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#1A1D2E]/35 backdrop-blur-[2px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-72 max-w-[82vw] h-full shadow-xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
