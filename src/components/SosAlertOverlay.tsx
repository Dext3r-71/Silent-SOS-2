import React from 'react';
import {
  AlertOctagon,
  ShieldCheck,
  MapPin,
  Camera,
  Radio,
  VolumeX,
  Volume2,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { EmergencyContact, IncidentRecord } from '../types/sos';

interface SosAlertOverlayProps {
  phase: 'countdown' | 'triggered' | 'completed';
  countdown: number;
  incident: IncidentRecord | null;
  onCancelGracePeriod: () => void;
  onSilenceSiren: () => void;
  onViewVault: () => void;
  isSirenPlaying: boolean;
  contacts: EmergencyContact[];
}

export const SosAlertOverlay: React.FC<SosAlertOverlayProps> = ({
  phase,
  countdown,
  incident,
  onCancelGracePeriod,
  onSilenceSiren,
  onViewVault,
  isSirenPlaying,
  contacts,
}) => {
  if (phase === 'countdown') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/90 backdrop-blur-md animate-in fade-in">
        <div className="relative w-full max-w-lg rounded-2xl border-2 border-rose-500 bg-slate-950 p-6 sm:p-8 text-center shadow-[0_0_60px_rgba(244,63,94,0.35)]">
          {/* Animated pulsing warning badge */}
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-rose-950/80 ring-8 ring-rose-500/20 animate-pulse">
            <AlertOctagon className="h-10 w-10 text-rose-500" />
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white uppercase mb-1">
            Emergency Gesture Detected
          </h2>
          <p className="text-sm text-rose-300 font-medium mb-6">
            Universal &quot;Signal for Help&quot; identified. Dispatching emergency alert in:
          </p>

          {/* Countdown digit */}
          <div className="mb-6">
            <span className="font-mono text-7xl font-extrabold text-rose-500 tabular-nums">
              {countdown}
            </span>
            <span className="block text-xs font-mono text-slate-400 mt-1 uppercase tracking-widest">
              Seconds Grace Period
            </span>
          </div>

          {/* Disarm options */}
          <div className="rounded-xl border border-rose-900/60 bg-rose-950/40 p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Accidental Trigger?
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Tap the button below or raise a <strong className="text-emerald-300">Thumbs Up</strong> hand gesture to immediately disarm and cancel dispatch.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onCancelGracePeriod}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              Cancel / False Alarm
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Triggered or Completed
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-rose-600/70 bg-slate-900 p-6 sm:p-8 my-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-950 flex items-center justify-center text-rose-500 ring-1 ring-rose-500/40">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-rose-400 font-semibold">
                  Incident Logged
                </span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-400 font-mono">
                  {incident?.dateFormatted || 'Just now'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Simulated SOS Dispatch Confirmed
              </h2>
            </div>
          </div>

          {/* Siren Control */}
          {isSirenPlaying && (
            <button
              onClick={onSilenceSiren}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-800 bg-rose-950 text-rose-200 text-xs font-semibold hover:bg-rose-900 transition-colors"
            >
              <VolumeX className="h-3.5 w-3.5" />
              Silence Siren
            </button>
          )}
        </div>

        {/* Snapshot Evidence Thumbnail */}
        {incident?.snapshotDataUrl && (
          <div className="mb-6 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <div className="relative aspect-video w-full">
              <img
                src={incident.snapshotDataUrl}
                alt="Captured Emergency Evidence Snapshot"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded text-[11px] font-mono text-white flex items-center gap-1.5 border border-slate-800">
                <Camera className="h-3.5 w-3.5 text-rose-400" />
                <span>Evidence Frame Secured</span>
              </div>
            </div>
          </div>
        )}

        {/* Live Simulation Dispatch Telemetry */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Simulated Emergency Protocol Execution
          </h3>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                Hand Gesture Verification
              </span>
              <span className="font-mono text-emerald-400 font-medium">Signal for Help (98%)</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-rose-400" />
                Geolocation Fix
              </span>
              <span className="font-mono text-slate-200">
                {incident?.latitude ? `${incident.latitude}, ${incident.longitude}` : 'GPS Locked'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                Simulated 911 CAD Dispatch
              </span>
              <span className="font-mono text-rose-300 font-medium">Transmitted (Simulated)</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                Emergency Contacts Alert
              </span>
              <span className="font-mono text-slate-200">
                {contacts.length > 0 ? `${contacts.length} Contacts Pinged` : 'Demo Contacts Pinged'}
              </span>
            </div>
          </div>
        </div>

        {/* Simulated SMS Alert Preview */}
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 text-xs">
          <span className="font-semibold text-slate-400 block mb-1">
            Simulated Emergency SMS Payload:
          </span>
          <p className="text-slate-300 font-mono bg-slate-900 p-2.5 rounded border border-slate-800 text-[11px] leading-relaxed">
            &quot;EMERGENCY SOS: I triggered the Signal for Help gesture. My current location is{' '}
            {incident?.locationAddress || 'Market St & 5th Ave'}. Map:{' '}
            {incident?.latitude
              ? `https://maps.google.com/?q=${incident.latitude},${incident.longitude}`
              : 'https://maps.google.com'}
            . Please check on me immediately.&quot;
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onViewVault}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>View Saved Incident in Vault</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
