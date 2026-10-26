import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { CameraView } from './components/CameraView';
import { GestureGuideModal } from './components/GestureGuideModal';
import { SosAlertOverlay } from './components/SosAlertOverlay';
import { IncidentVault } from './components/IncidentVault';
import { ContactsDrawer } from './components/ContactsDrawer';
import { StealthMode } from './components/StealthMode';
import { GestureTestLab } from './components/GestureTestLab';
import { getCurrentLocation } from './utils/locationService';
import { soundSystem } from './utils/audioSiren';
import {
  EmergencyContact,
  IncidentRecord,
  AppSettings,
} from './types/sos';
import {
  ShieldAlert,
  Sparkles,
  MapPin,
  Volume2,
  VolumeX,
  Eye,
  CheckCircle2,
  Radio,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

const INITIAL_CONTACTS: EmergencyContact[] = [
  {
    id: 'contact-1',
    name: 'Sarah Miller',
    phone: '+1 (555) 234-8901',
    relation: 'Sister',
    isPrimary: true,
  },
  {
    id: 'contact-2',
    name: 'Elena Rostova',
    phone: '+1 (555) 872-3310',
    relation: 'Close Friend',
    isPrimary: false,
  },
];

const INITIAL_INCIDENTS: IncidentRecord[] = [
  {
    id: 'SOS-20261007-4821',
    timestamp: Date.now() - 3600000 * 2,
    dateFormatted: 'Today at 07:53 AM',
    gestureTriggered: 'Signal for Help (Confirmed)',
    confidence: 0.98,
    latitude: 37.774929,
    longitude: -122.419416,
    accuracyMeters: 8,
    locationAddress: 'Market St & 5th Ave, San Francisco, CA',
    snapshotDataUrl: '/src/assets/images/signal_for_help_guide_1791392081209.jpg',
    audioMode: 'silent',
    dispatchedToContacts: INITIAL_CONTACTS,
    status: 'dispatched',
    simulationLog: [
      { time: '07:53:14', action: 'Signal for Help gesture recognized (98% confidence)', status: 'success' },
      { time: '07:53:17', action: 'GPS coordinates locked (Lat: 37.7749, Long: -122.4194)', status: 'success' },
      { time: '07:53:17', action: 'Automated video evidence captured (5.0s clip)', status: 'success' },
      { time: '07:53:18', action: 'Simulated 911 CAD data transmission dispatched', status: 'success' },
      { time: '07:53:18', action: 'SMS broadcast alert sent to Sarah Miller (+1 555-234-8901)', status: 'success' },
    ],
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'vault' | 'contacts' | 'testlab'>('monitor');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isStealthActive, setIsStealthActive] = useState(false);
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);

  // Settings
  const [settings, setSettings] = useState<AppSettings>({
    silentMode: true, // Default to discreet silent mode for safety
    autoRecordVideo: true,
    videoDurationSeconds: 5,
    countdownSeconds: 3,
    vibrationEnabled: true,
    showSkeleton: true,
    mirrorCamera: true,
    emergencyThreshold: 0.85,
    disarmGestureEnabled: true,
  });

  // Contacts & Incidents from localStorage
  const [contacts, setContacts] = useState<EmergencyContact[]>(() => {
    try {
      const saved = localStorage.getItem('silent_sos_contacts');
      return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
    } catch {
      return INITIAL_CONTACTS;
    }
  });

  const [incidents, setIncidents] = useState<IncidentRecord[]>(() => {
    try {
      const saved = localStorage.getItem('silent_sos_incidents');
      return saved ? JSON.parse(saved) : INITIAL_INCIDENTS;
    } catch {
      return INITIAL_INCIDENTS;
    }
  });

  // SOS Execution Flow
  const [sosPhase, setSosPhase] = useState<'idle' | 'countdown' | 'triggered' | 'completed'>('idle');
  const [countdown, setCountdown] = useState(settings.countdownSeconds);
  const [activeIncident, setActiveIncident] = useState<IncidentRecord | null>(null);

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSnapshotRef = useRef<string>('');

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('silent_sos_contacts', JSON.stringify(contacts));
    } catch {
      // Storage unavailable
    }
  }, [contacts]);

  useEffect(() => {
    try {
      localStorage.setItem('silent_sos_incidents', JSON.stringify(incidents));
    } catch {
      // Storage unavailable
    }
  }, [incidents]);

  // Global keyboard shortcuts (Escape = Stealth Mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsStealthActive((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dispatch completion sequence
  const finalizeEmergencyDispatch = useCallback(async (snapshotUrl: string) => {
    if (!settings.silentMode) {
      soundSystem.startDeterrentSiren();
      setIsSirenPlaying(true);
    } else {
      soundSystem.triggerHapticAlert();
    }

    const loc = await getCurrentLocation();
    const now = new Date();
    const incidentId = `SOS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newIncident: IncidentRecord = {
      id: incidentId,
      timestamp: Date.now(),
      dateFormatted: `Today at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
      gestureTriggered: 'Signal for Help (Confirmed)',
      confidence: 0.98,
      latitude: loc.latitude,
      longitude: loc.longitude,
      accuracyMeters: loc.accuracyMeters,
      locationAddress: loc.address,
      snapshotDataUrl: snapshotUrl || '/src/assets/images/signal_for_help_guide_1791392081209.jpg',
      audioMode: settings.silentMode ? 'silent' : 'siren',
      dispatchedToContacts: contacts,
      status: 'dispatched',
      simulationLog: [
        {
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          action: 'Hand Gesture Classification: Signal for Help (98% confidence)',
          status: 'success',
        },
        {
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          action: `Geolocation Locked: ${loc.latitude}, ${loc.longitude} (±${loc.accuracyMeters}m)`,
          status: 'success',
        },
        {
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          action: 'Camera frame snapshot and evidence record sealed in local vault',
          status: 'success',
        },
        {
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          action: 'Simulated 911 / 112 CAD Emergency Data Packet transmitted',
          status: 'success',
        },
        {
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          action: `Automated SMS alert dispatched to ${contacts.length} designated emergency contacts`,
          status: 'success',
        },
      ],
    };

    setActiveIncident(newIncident);
    setIncidents((prev) => [newIncident, ...prev]);
    setSosPhase('triggered');
  }, [settings.silentMode, contacts]);

  // Handle gesture trigger
  const handleTriggerSos = useCallback((snapshotUrl: string) => {
    if (sosPhase !== 'idle') return;

    pendingSnapshotRef.current = snapshotUrl;
    setSosPhase('countdown');
    setCountdown(settings.countdownSeconds);

    let currentSec = settings.countdownSeconds;
    if (!settings.silentMode) {
      soundSystem.playCountdownBeep(currentSec);
    }

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    countdownTimerRef.current = setInterval(() => {
      currentSec -= 1;
      setCountdown(currentSec);

      if (!settings.silentMode && currentSec > 0) {
        soundSystem.playCountdownBeep(currentSec);
      }

      if (currentSec <= 0) {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }
        finalizeEmergencyDispatch(pendingSnapshotRef.current);
      }
    }, 1000);
  }, [sosPhase, settings.countdownSeconds, settings.silentMode, finalizeEmergencyDispatch]);

  // Disarm / cancel false alarm
  const handleDisarmSos = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    soundSystem.stopDeterrentSiren();
    soundSystem.playDisarmChime();
    setIsSirenPlaying(false);
    setSosPhase('idle');
  }, []);

  const handleSilenceSiren = () => {
    soundSystem.stopDeterrentSiren();
    setIsSirenPlaying(false);
  };

  const handleViewVault = () => {
    soundSystem.stopDeterrentSiren();
    setIsSirenPlaying(false);
    setSosPhase('idle');
    setActiveTab('vault');
  };

  // Contacts handlers
  const handleAddContact = (contact: Omit<EmergencyContact, 'id'>) => {
    const newContact: EmergencyContact = {
      ...contact,
      id: `contact-${Date.now()}`,
    };
    setContacts((prev) => [...prev, newContact]);
  };

  const handleDeleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleTogglePrimary = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => ({
        ...c,
        isPrimary: c.id === id,
      }))
    );
  };

  // Incident vault handlers
  const handleDeleteIncident = (id: string) => {
    setIncidents((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAllIncidents = () => {
    if (window.confirm('Are you sure you want to clear all evidence incident records?')) {
      setIncidents([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Constitutional Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenGuide={() => setIsGuideOpen(true)}
        onToggleStealth={() => setIsStealthActive(true)}
        silentMode={settings.silentMode}
        onToggleSilentMode={() =>
          setSettings((prev) => ({ ...prev, silentMode: !prev.silentMode }))
        }
        incidentCount={incidents.length}
      />

      {/* Main Viewport Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'monitor' && (
          <div className="space-y-6">
            {/* Contextual Hero Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-sm">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-mono tracking-wider uppercase font-semibold">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Real-Time Optical Safety Protection</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Discreet Hand Gesture Emergency Recognition
                  </h1>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                    Silent SOS continuously evaluates your webcam feed for the universal{' '}
                    <strong className="text-slate-200">Signal for Help</strong> hand gesture. When confirmed, it freezes video evidence, locks GPS coordinates, and simulates automated emergency dispatch entirely within your browser.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => setIsGuideOpen(true)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors flex items-center gap-2 border border-slate-700"
                    >
                      <BookOpen className="h-4 w-4 text-rose-400" />
                      <span>Learn Signal for Help</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('testlab')}
                      className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold transition-colors flex items-center gap-2 border border-rose-500/30"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Test Gesture Without Camera</span>
                    </button>
                  </div>
                </div>

                {/* Conceptual Protection Visual Graphic */}
                <div className="hidden lg:block lg:col-span-5">
                  <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    <img
                      src="/images/safety_shield_concept_1791392068729.jpg"
                      alt="Silent SOS protective visual"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
                      <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Client-Side Computer Vision Active</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Camera View with Real-time MediaPipe Hand Landmarker */}
            <CameraView
              onTriggerSos={handleTriggerSos}
              onDisarmSos={handleDisarmSos}
              isGracePeriodActive={sosPhase === 'countdown'}
              onOpenGuide={() => setIsGuideOpen(true)}
            />

            {/* Three Step Workflow Guide Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
                <span className="text-[11px] font-mono text-slate-500 block mb-1">01. CAMERA FEED</span>
                <h4 className="text-sm font-semibold text-white mb-1">Optical Landmark Tracking</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  21 skeletal joints are extracted at 30fps using MediaPipe without uploading any video frames to servers.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
                <span className="text-[11px] font-mono text-rose-400 block mb-1">02. SIGNAL FOR HELP</span>
                <h4 className="text-sm font-semibold text-white mb-1">Geometric Verification</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tucking the thumb across the palm and folding four fingers over it triggers a high-confidence emergency match.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
                <span className="text-[11px] font-mono text-slate-500 block mb-1">03. EVIDENCE VAULT</span>
                <h4 className="text-sm font-semibold text-white mb-1">Sealed Incident Logs</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  GPS telemetry, high-res frame capture, and simulated SMS dispatch links are saved to your browser&apos;s local storage.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vault' && (
          <IncidentVault
            incidents={incidents}
            onDeleteIncident={handleDeleteIncident}
            onClearAll={handleClearAllIncidents}
            onTriggerSimulatedTest={() => handleTriggerSos('')}
          />
        )}

        {activeTab === 'contacts' && (
          <ContactsDrawer
            contacts={contacts}
            onAddContact={handleAddContact}
            onDeleteContact={handleDeleteContact}
            onTogglePrimary={handleTogglePrimary}
          />
        )}

        {activeTab === 'testlab' && (
          <GestureTestLab
            onTriggerSos={handleTriggerSos}
            onDisarmSos={handleDisarmSos}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Silent SOS</span>
            <span>·</span>
            <span>Women&apos;s Safety Computer Vision Platform</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Esc</kbd> for Stealth Mode</span>
            <span>·</span>
            <span>Simulated Local Prototype</span>
          </div>
        </div>
      </footer>

      {/* Emergency SOS Countdown & Trigger Overlay */}
      {sosPhase !== 'idle' && (
        <SosAlertOverlay
          phase={sosPhase === 'countdown' ? 'countdown' : 'triggered'}
          countdown={countdown}
          incident={activeIncident}
          onCancelGracePeriod={handleDisarmSos}
          onSilenceSiren={handleSilenceSiren}
          onViewVault={handleViewVault}
          isSirenPlaying={isSirenPlaying}
          contacts={contacts}
        />
      )}

      {/* Visual Gesture Guide Modal */}
      <GestureGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Stealth Disguise Screen (Calculator Mode) */}
      <StealthMode
        isActive={isStealthActive}
        onExit={() => setIsStealthActive(false)}
      />
    </div>
  );
}
