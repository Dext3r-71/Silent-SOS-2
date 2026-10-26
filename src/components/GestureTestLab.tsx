import React, { useState, useEffect, useRef } from 'react';
import {
  FlaskConical,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { classifyHandLandmarks } from '../utils/gestureClassifier';
import { HAND_CONNECTIONS } from '../utils/handDetectionService';
import { GestureDetectionResult, LandmarkPoint } from '../types/sos';

interface GestureTestLabProps {
  onTriggerSos: (snapshotUrl: string) => void;
  onDisarmSos: () => void;
}

// Synthetic landmarks for common poses
function generateSyntheticLandmarks(type: 'signal_stage1' | 'signal_stage2' | 'open_palm' | 'thumbs_up' | 'victory' | 'fist'): LandmarkPoint[] {
  // Base wrist at (0.5, 0.8)
  const lms: LandmarkPoint[] = [
    { x: 0.5, y: 0.8, z: 0 }, // 0: Wrist
    { x: 0.44, y: 0.72, z: 0 }, // 1: Thumb CMC
    { x: 0.4, y: 0.65, z: 0 }, // 2: Thumb MCP
    { x: 0.38, y: 0.58, z: 0 }, // 3: Thumb IP
    { x: 0.35, y: 0.52, z: 0 }, // 4: Thumb TIP
    // Index
    { x: 0.44, y: 0.52, z: 0 }, // 5: Index MCP
    { x: 0.43, y: 0.42, z: 0 }, // 6: Index PIP
    { x: 0.42, y: 0.35, z: 0 }, // 7: Index DIP
    { x: 0.41, y: 0.28, z: 0 }, // 8: Index TIP
    // Middle
    { x: 0.5, y: 0.5, z: 0 }, // 9: Middle MCP
    { x: 0.5, y: 0.38, z: 0 }, // 10: Middle PIP
    { x: 0.5, y: 0.3, z: 0 }, // 11: Middle DIP
    { x: 0.5, y: 0.22, z: 0 }, // 12: Middle TIP
    // Ring
    { x: 0.56, y: 0.52, z: 0 }, // 13: Ring MCP
    { x: 0.57, y: 0.42, z: 0 }, // 14: Ring PIP
    { x: 0.58, y: 0.35, z: 0 }, // 15: Ring DIP
    { x: 0.59, y: 0.28, z: 0 }, // 16: Ring TIP
    // Pinky
    { x: 0.62, y: 0.56, z: 0 }, // 17: Pinky MCP
    { x: 0.64, y: 0.48, z: 0 }, // 18: Pinky PIP
    { x: 0.65, y: 0.42, z: 0 }, // 19: Pinky DIP
    { x: 0.66, y: 0.36, z: 0 }, // 20: Pinky TIP
  ];

  if (type === 'signal_stage1') {
    // Thumb is folded horizontally into the palm center (towards pinky base)
    lms[3] = { x: 0.48, y: 0.6, z: 0.02 };
    lms[4] = { x: 0.54, y: 0.58, z: 0.04 }; // Thumb tip across palm
    // All 4 fingers are upright
  } else if (type === 'signal_stage2') {
    // Thumb is folded into the palm
    lms[3] = { x: 0.48, y: 0.6, z: 0.02 };
    lms[4] = { x: 0.54, y: 0.58, z: 0.04 };
    // All 4 fingers are curled over
    lms[7] = { x: 0.45, y: 0.56, z: 0.05 };
    lms[8] = { x: 0.47, y: 0.62, z: 0.08 }; // Index curled down
    lms[11] = { x: 0.51, y: 0.56, z: 0.05 };
    lms[12] = { x: 0.52, y: 0.62, z: 0.08 }; // Middle curled down
    lms[15] = { x: 0.56, y: 0.56, z: 0.05 };
    lms[16] = { x: 0.56, y: 0.62, z: 0.08 }; // Ring curled down
    lms[19] = { x: 0.62, y: 0.58, z: 0.05 };
    lms[20] = { x: 0.61, y: 0.64, z: 0.08 }; // Pinky curled down
  } else if (type === 'thumbs_up') {
    // Thumb is pointed high up
    lms[2] = { x: 0.42, y: 0.6, z: 0 };
    lms[3] = { x: 0.42, y: 0.45, z: 0 };
    lms[4] = { x: 0.42, y: 0.28, z: 0 }; // Thumb tip high
    // All 4 fingers curled down
    lms[8] = { x: 0.48, y: 0.62, z: 0.05 };
    lms[12] = { x: 0.52, y: 0.62, z: 0.05 };
    lms[16] = { x: 0.56, y: 0.62, z: 0.05 };
    lms[20] = { x: 0.61, y: 0.64, z: 0.05 };
  } else if (type === 'victory') {
    // Index and middle upright, ring and pinky curled
    lms[16] = { x: 0.56, y: 0.62, z: 0.05 };
    lms[20] = { x: 0.61, y: 0.64, z: 0.05 };
    lms[4] = { x: 0.52, y: 0.62, z: 0.05 };
  } else if (type === 'fist') {
    // Standard fist: all 4 fingers curled, thumb resting on outside of knuckles
    lms[8] = { x: 0.48, y: 0.62, z: 0.05 };
    lms[12] = { x: 0.52, y: 0.62, z: 0.05 };
    lms[16] = { x: 0.56, y: 0.62, z: 0.05 };
    lms[20] = { x: 0.61, y: 0.64, z: 0.05 };
    // Thumb outside
    lms[4] = { x: 0.38, y: 0.62, z: 0.05 };
  }

  return lms;
}

export const GestureTestLab: React.FC<GestureTestLabProps> = ({
  onTriggerSos,
  onDisarmSos,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<
    'signal_stage1' | 'signal_stage2' | 'open_palm' | 'thumbs_up' | 'victory' | 'fist'
  >('signal_stage1');

  const [landmarks, setLandmarks] = useState<LandmarkPoint[]>(
    generateSyntheticLandmarks('signal_stage1')
  );
  const [analysis, setAnalysis] = useState<GestureDetectionResult | null>(null);
  const [sequenceRunning, setSequenceRunning] = useState(false);

  useEffect(() => {
    const lms = generateSyntheticLandmarks(selectedPreset);
    setLandmarks(lms);
  }, [selectedPreset]);

  // Update classification whenever landmarks change
  useEffect(() => {
    const result = classifyHandLandmarks(landmarks);
    setAnalysis(result);

    // Draw on synthetic canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Background grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += 30) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Draw connections
        ctx.lineWidth = 3;
        ctx.strokeStyle = result.isEmergency
          ? '#f43f5e'
          : result.gesture === 'signal_for_help_stage1'
          ? '#fbbf24'
          : result.gesture === 'thumbs_up'
          ? '#10b981'
          : '#38bdf8';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (const [s, e] of HAND_CONNECTIONS) {
          const p1 = landmarks[s];
          const p2 = landmarks[e];
          ctx.beginPath();
          ctx.moveTo(p1.x * w, p1.y * h);
          ctx.lineTo(p2.x * w, p2.y * h);
          ctx.stroke();
        }

        // Draw points
        for (let i = 0; i < landmarks.length; i++) {
          const p = landmarks[i];
          const isTip = [4, 8, 12, 16, 20].includes(i);
          ctx.beginPath();
          ctx.arc(p.x * w, p.y * h, isTip ? 5 : 3.5, 0, 2 * Math.PI);
          ctx.fillStyle = isTip ? '#ffffff' : ctx.strokeStyle;
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }, [landmarks]);

  // Automated 2-stage sequence runner
  const runAutomatedSequence = () => {
    setSequenceRunning(true);
    setSelectedPreset('signal_stage1');

    // Run Stage 1 for 1 second, then switch to Stage 2
    setTimeout(() => {
      setSelectedPreset('signal_stage2');
      // Fire simulated trigger after sequence completes
      setTimeout(() => {
        setSequenceRunning(false);
        const canvas = canvasRef.current;
        const snapshot = canvas ? canvas.toDataURL('image/jpeg', 0.9) : '';
        onTriggerSos(snapshot);
      }, 1200);
    }, 1200);
  };

  const handleSimulateInstantSos = () => {
    const canvas = canvasRef.current;
    const snapshot = canvas ? canvas.toDataURL('image/jpeg', 0.9) : '';
    onTriggerSos(snapshot);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-rose-400 font-mono mb-1">
            <FlaskConical className="h-4 w-4" />
            <span>ALGORITHM VALIDATION & SIMULATION</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Gesture Test Lab & Emulation
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Test the 21-landmark geometric classification pipeline, verify finger angle vectors, and simulate emergency events without requiring a live camera.
          </p>
        </div>

        <button
          onClick={handleSimulateInstantSos}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm"
        >
          <Radio className="h-4 w-4" />
          <span>Simulate Emergency Trigger</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Preset Selectors */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center justify-between">
              <span>Hand Pose Presets</span>
              <span className="text-xs text-slate-500 font-mono">Select to Test</span>
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => setSelectedPreset('signal_stage1')}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-colors ${
                  selectedPreset === 'signal_stage1'
                    ? 'border-amber-500/80 bg-amber-950/30 text-amber-200'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="font-semibold text-white">Signal for Help (Step 1)</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Thumb tucked across palm, 4 fingers extended upright.
                </div>
              </button>

              <button
                onClick={() => setSelectedPreset('signal_stage2')}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-colors ${
                  selectedPreset === 'signal_stage2'
                    ? 'border-rose-500/80 bg-rose-950/30 text-rose-200'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="font-semibold text-white">Signal for Help (Step 2 - SOS)</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Fingers curling over and trapping tucked thumb.
                </div>
              </button>

              <button
                onClick={() => setSelectedPreset('thumbs_up')}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-colors ${
                  selectedPreset === 'thumbs_up'
                    ? 'border-emerald-500/80 bg-emerald-950/30 text-emerald-200'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="font-semibold text-white">Thumbs Up (Disarm / Safe)</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Thumb upright, 4 fingers curled down. Cancels active alert.
                </div>
              </button>

              <button
                onClick={() => setSelectedPreset('open_palm')}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-colors ${
                  selectedPreset === 'open_palm'
                    ? 'border-sky-500/80 bg-sky-950/30 text-sky-200'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="font-semibold text-white">Open Palm (Neutral)</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  All 5 fingers extended, thumb outward.
                </div>
              </button>

              <button
                onClick={() => setSelectedPreset('victory')}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-colors ${
                  selectedPreset === 'victory'
                    ? 'border-sky-500/80 bg-sky-950/30 text-sky-200'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="font-semibold text-white">Victory / Peace (Calibration)</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Index and middle extended, others folded.
                </div>
              </button>

              <button
                onClick={() => setSelectedPreset('fist')}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-colors ${
                  selectedPreset === 'fist'
                    ? 'border-slate-600 bg-slate-800 text-slate-200'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="font-semibold text-white">Standard Fist (Non-Emergency)</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Thumb outside knuckles; does NOT trigger SOS.
                </div>
              </button>
            </div>

            {/* Run dynamic 2-stage simulation */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={runAutomatedSequence}
                disabled={sequenceRunning}
                className="w-full py-2.5 px-4 rounded-xl border border-rose-800/80 bg-rose-950/50 hover:bg-rose-900/60 text-rose-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4" />
                <span>
                  {sequenceRunning ? 'Simulating Sequence (1 → 2)...' : 'Run Full 2-Step Gesture Cycle'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Visual Landmark Skeleton Display & Telemetry */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">21-Point Landmark Projection</h3>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-slate-400">Class:</span>
                <span
                  className={
                    analysis?.isEmergency
                      ? 'text-rose-400 font-bold'
                      : analysis?.gesture === 'signal_for_help_stage1'
                      ? 'text-amber-400 font-bold'
                      : analysis?.gesture === 'thumbs_up'
                      ? 'text-emerald-400 font-bold'
                      : 'text-sky-400'
                  }
                >
                  {analysis?.label}
                </span>
              </div>
            </div>

            {/* Visual Canvas Display */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={560}
                height={315}
                className="h-full w-full object-contain"
              />
            </div>

            {/* Real-time Extraction Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
              <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">THUMB TUCKED</span>
                <span
                  className={
                    analysis?.details.thumbTucked ? 'text-emerald-400 font-bold' : 'text-slate-500'
                  }
                >
                  {analysis?.details.thumbTucked ? 'YES (TRUE)' : 'NO (FALSE)'}
                </span>
              </div>

              <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">FINGERS FOLDED</span>
                <span
                  className={
                    analysis?.details.fingersFolded ? 'text-rose-400 font-bold' : 'text-slate-500'
                  }
                >
                  {analysis?.details.fingersFolded ? 'YES (TRUE)' : 'NO (FALSE)'}
                </span>
              </div>

              <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">CONFIDENCE</span>
                <span className="text-slate-200 font-bold tabular-nums">
                  {analysis ? Math.round(analysis.confidence * 100) : 0}%
                </span>
              </div>

              <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">EMERGENCY STATE</span>
                <span
                  className={
                    analysis?.isEmergency ? 'text-rose-400 font-bold' : 'text-emerald-400'
                  }
                >
                  {analysis?.isEmergency ? 'ALERT FIRED' : 'NORMAL'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
