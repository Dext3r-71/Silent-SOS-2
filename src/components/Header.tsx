import React from 'react';
import {
  ShieldAlert,
  Volume2,
  VolumeX,
  EyeOff,
  BookOpen,
  FolderArchive,
  Users,
  FlaskConical,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'monitor' | 'vault' | 'contacts' | 'testlab';
  setActiveTab: (tab: 'monitor' | 'vault' | 'contacts' | 'testlab') => void;
  onOpenGuide: () => void;
  onToggleStealth: () => void;
  silentMode: boolean;
  onToggleSilentMode: () => void;
  incidentCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenGuide,
  onToggleStealth,
  silentMode,
  onToggleSilentMode,
  incidentCount,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('monitor')}
            className="flex items-center gap-2.5 text-left transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-600/20 text-rose-500 ring-1 ring-rose-500/30">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white">Silent SOS</span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`transition-colors whitespace-nowrap py-1 ${
              activeTab === 'monitor'
                ? 'text-white border-b-2 border-rose-500 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            Live Monitor
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 ${
              activeTab === 'vault'
                ? 'text-white border-b-2 border-rose-500 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            <FolderArchive className="h-4 w-4" />
            Evidence Vault
            {incidentCount > 0 && (
              <span className="ml-1 text-xs font-mono text-rose-400">({incidentCount})</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 ${
              activeTab === 'contacts'
                ? 'text-white border-b-2 border-rose-500 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            <Users className="h-4 w-4" />
            Safety Contacts
          </button>
          <button
            onClick={() => setActiveTab('testlab')}
            className={`transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 ${
              activeTab === 'testlab'
                ? 'text-white border-b-2 border-rose-500 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            <FlaskConical className="h-4 w-4" />
            Test Lab & Emulation
          </button>
          <button
            onClick={onOpenGuide}
            className="transition-colors hover:text-slate-200 whitespace-nowrap py-1 flex items-center gap-1.5"
          >
            <BookOpen className="h-4 w-4" />
            Gesture Guide
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Silent Mode / Siren toggle */}
          <button
            type="button"
            onClick={onToggleSilentMode}
            title={silentMode ? 'Silent Mode Active (No audio siren)' : 'Loud Deterrent Siren Active'}
            className={`flex h-9 items-center gap-1.5 px-3 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
              silentMode
                ? 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                : 'border-rose-800/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/50'
            }`}
          >
            {silentMode ? (
              <>
                <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                <span className="hidden sm:inline">Silent Mode</span>
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5 text-rose-400" />
                <span className="hidden sm:inline">Deterrent Siren</span>
              </>
            )}
          </button>

          {/* Quick Stealth Disguise Button */}
          <button
            type="button"
            onClick={onToggleStealth}
            title="Instant Stealth Screen (Disguise app as calculator)"
            className="flex h-9 items-center gap-1.5 px-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 text-xs font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <EyeOff className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Stealth Mode</span>
          </button>
        </div>
      </div>

      {/* Mobile subnavigation bar */}
      <div className="flex md:hidden border-t border-slate-800/80 bg-slate-950/90 px-3 py-1.5 justify-around text-xs font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`py-1 px-2 ${activeTab === 'monitor' ? 'text-rose-400 font-semibold' : ''}`}
        >
          Monitor
        </button>
        <button
          onClick={() => setActiveTab('vault')}
          className={`py-1 px-2 ${activeTab === 'vault' ? 'text-rose-400 font-semibold' : ''}`}
        >
          Vault {incidentCount > 0 && `(${incidentCount})`}
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`py-1 px-2 ${activeTab === 'contacts' ? 'text-rose-400 font-semibold' : ''}`}
        >
          Contacts
        </button>
        <button
          onClick={() => setActiveTab('testlab')}
          className={`py-1 px-2 ${activeTab === 'testlab' ? 'text-rose-400 font-semibold' : ''}`}
        >
          Test Lab
        </button>
        <button onClick={onOpenGuide} className="py-1 px-2">
          Guide
        </button>
      </div>
    </header>
  );
};
