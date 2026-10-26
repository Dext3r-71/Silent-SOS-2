import React from 'react';
import { X, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

interface GestureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GestureGuideModal: React.FC<GestureGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close guide"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2.5 text-rose-400 mb-1.5">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-xs font-semibold tracking-wider uppercase">Official Safety Protocol</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            How Silent SOS Detects Hand Gestures
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Silent SOS utilizes client-side computer vision to recognize the universal Signal for Help gesture and safely automate emergency evidence collection.
          </p>
        </div>

        {/* Universal Signal for Help Visual Banner */}
        <div className="mb-8 rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-rose-400" />
              The Universal &quot;Signal for Help&quot;
            </h3>
            <span className="text-xs text-slate-500 font-mono">Canadian Women&apos;s Foundation Standard</span>
          </div>

          {/* Guide Image with resilient fallback container */}
          <div className="relative aspect-[4/3] sm:aspect-[16/9] w-full overflow-hidden rounded-lg bg-slate-900 border border-slate-800/80 mb-4">
            <img
              src="/src/assets/images/signal_for_help_guide_1791392081209.jpg"
              alt="Visual demonstration of the Signal for Help in three steps"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                // If image fails, keep fallback container visible
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          {/* 3 Step Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold text-slate-400">STEP 1</span>
                <span className="text-[11px] text-slate-400">Palm Raised</span>
              </div>
              <h4 className="text-sm font-semibold text-slate-200 mb-1">Open Hand</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hold your hand up toward the camera with your palm facing forward.
              </p>
            </div>

            <div className="rounded-lg border border-rose-900/40 bg-rose-950/20 p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold text-rose-400">STEP 2</span>
                <span className="text-[11px] text-rose-300">Thumb Tucked</span>
              </div>
              <h4 className="text-sm font-semibold text-rose-200 mb-1">Fold Thumb In</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tuck your thumb across into the palm while keeping your 4 fingers upright.
              </p>
            </div>

            <div className="rounded-lg border border-rose-700/60 bg-rose-950/40 p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold text-rose-400">STEP 3</span>
                <span className="text-[11px] text-rose-300 font-semibold">SOS TRIGGER</span>
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">Trap Thumb</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Close your four fingers over your thumb into a closed fist trapping the thumb.
              </p>
            </div>
          </div>
        </div>

        {/* Safety & Secondary Gestures Table */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Supported Secondary Gestures
          </h3>
          <div className="space-y-2.5">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-emerald-900/40 bg-emerald-950/20">
              <div className="p-1.5 rounded-md bg-emerald-900/40 text-emerald-400 shrink-0 mt-0.5">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-200">Thumbs Up</span>
                  <span className="text-xs font-medium text-emerald-400">Safety Disarm / Cancel</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Raises your thumb upright while curling 4 fingers. When an emergency countdown is active, showing Thumbs Up immediately cancels the alert and logs a false alarm dismissal.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60">
              <div className="p-1.5 rounded-md bg-slate-800 text-slate-300 shrink-0 mt-0.5">
                <HelpCircle className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-200">Victory / Peace Sign</span>
                  <span className="text-xs text-slate-400">Camera Calibration Check</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Two fingers upright (index and middle). Used in the Test Lab to verify high landmark tracking fidelity in low-light environments.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Environmental Tips */}
        <div className="rounded-xl border border-amber-900/30 bg-amber-950/15 p-4 text-xs text-amber-200/90 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300">Optimal Recognition Tips: </span>
            Ensure your hand is clearly visible within 0.4m to 1.8m from the camera. If room lighting is dim, move closer to your screen glow. You can customize the countdown grace period and siren mode in Settings.
          </div>
        </div>

        {/* Close CTA */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-500 transition-colors"
          >
            Got it, Return to Monitor
          </button>
        </div>
      </div>
    </div>
  );
};
