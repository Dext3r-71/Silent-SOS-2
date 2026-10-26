import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  VideoOff,
  Sliders,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Maximize2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { handDetectionService } from '../utils/handDetectionService';
import { classifyHandLandmarks } from '../utils/gestureClassifier';
import { GestureDetectionResult, LandmarkPoint } from '../types/sos';

interface CameraViewProps {
  onTriggerSos: (snapshotUrl: string) => void;
  onDisarmSos: () => void;
  isGracePeriodActive: boolean;
  onOpenGuide: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onTriggerSos,
  onDisarmSos,
  isGracePeriodActive,
  onOpenGuide,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);

  // User controls
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMirrored, setIsMirrored] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Gesture state
  const [detectionResult, setDetectionResult] = useState<GestureDetectionResult | null>(null);
  const [fps, setFps] = useState(0);

  const animationFrameId = useRef<number | null>(null);
  const lastFpsTimestamp = useRef(performance.now());
  const frameCount = useRef(0);

  // Initialize MediaPipe Vision
  useEffect(() => {
    let isMounted = true;
    async function loadModel() {
      setIsModelLoading(true);
      setModelError(null);
      const res = await handDetectionService.initialize();
      if (!isMounted) return;
      if (!res.success) {
        setModelError(res.error || 'Failed to initialize hand detector');
      }
      setIsModelLoading(false);
    }
    loadModel();
    return () => {
      isMounted = false;
    };
  }, []);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera access was denied or not found.';
      setCameraError(msg);
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [startCamera]);

  // Main Detection Loop
  const runDetection = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState >= 2) {
      const videoW = video.videoWidth;
      const videoH = video.videoHeight;

      if (canvas.width !== videoW || canvas.height !== videoH) {
        canvas.width = videoW;
        canvas.height = videoH;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, videoW, videoH);

        const now = performance.now();
        const detectedHands = handDetectionService.detect(video, now);

        if (detectedHands.length > 0) {
          const primaryHand = detectedHands[0];
          const result = classifyHandLandmarks(primaryHand);
          setDetectionResult(result);

          // Select color scheme based on status
          let themeColor = '#38bdf8'; // sky blue
          if (result.isEmergency) {
            themeColor = '#f43f5e'; // rose / emergency
          } else if (result.gesture === 'signal_for_help_stage1') {
            themeColor = '#fbbf24'; // amber stage 1
          } else if (result.gesture === 'thumbs_up') {
            themeColor = '#10b981'; // emerald disarm
          }

          if (showSkeleton) {
            handDetectionService.drawLandmarks(ctx, primaryHand, videoW, videoH, themeColor);
          }

          // Trigger SOS if confirmed
          if (result.isEmergency) {
            // Take snapshot
            const snapshotUrl = canvas.toDataURL('image/jpeg', 0.9);
            onTriggerSos(snapshotUrl);
          }

          // Trigger Disarm if thumbs up in grace period
          if (result.isDisarm && isGracePeriodActive) {
            onDisarmSos();
          }
        } else {
          setDetectionResult(null);
        }

        // FPS calculation
        frameCount.current += 1;
        if (now - lastFpsTimestamp.current >= 1000) {
          setFps(Math.round((frameCount.current * 1000) / (now - lastFpsTimestamp.current)));
          frameCount.current = 0;
          lastFpsTimestamp.current = now;
        }
      }
    }

    animationFrameId.current = requestAnimationFrame(runDetection);
  }, [showSkeleton, isGracePeriodActive, onTriggerSos, onDisarmSos]);

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(runDetection);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [runDetection]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
      {/* Top Stream HUD Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3.5 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-transparent">
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 rounded-lg bg-slate-900/80 px-2.5 py-1 text-xs border border-slate-800/80 backdrop-blur-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                stream ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="font-mono text-slate-300">
              {stream ? 'Camera Live' : 'Camera Off'}
            </span>
            <span className="text-slate-600">·</span>
            <span className="font-mono text-slate-400 text-[11px] tabular-nums">{fps} FPS</span>
          </div>

          {/* Model Status */}
          {isModelLoading && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-amber-950/70 border border-amber-800/60 px-2.5 py-1 text-xs text-amber-300 font-mono">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Loading MediaPipe Hand Model...</span>
            </div>
          )}
        </div>

        {/* Camera Control Affordances */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSkeleton(!showSkeleton)}
            title={showSkeleton ? 'Hide Skeleton Overlay' : 'Show Skeleton Overlay'}
            className={`p-2 rounded-lg border text-xs transition-colors backdrop-blur-sm ${
              showSkeleton
                ? 'border-slate-700 bg-slate-900/80 text-rose-400'
                : 'border-slate-800 bg-slate-950/60 text-slate-400'
            }`}
          >
            {showSkeleton ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>

          <button
            onClick={() => setIsMirrored(!isMirrored)}
            title="Mirror Video Feed"
            className="p-2 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white text-xs transition-colors backdrop-blur-sm"
          >
            <Sliders className="h-4 w-4" />
          </button>

          <button
            onClick={toggleCameraFacing}
            title="Switch Front/Rear Camera"
            className="p-2 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white text-xs transition-colors backdrop-blur-sm"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Primary Video Canvas Viewport */}
      <div className="relative aspect-[4/3] sm:aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* HTML5 Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
        />

        {/* Canvas Landmark Overlay */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full pointer-events-none ${
            isMirrored ? 'scale-x-[-1]' : ''
          }`}
        />

        {/* Camera Access Error State */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/95 text-center z-10">
            <VideoOff className="h-12 w-12 text-rose-500 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Camera Access Required</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              Silent SOS requires camera access to detect hand gestures in real time. Please grant camera permission in your browser.
            </p>
            <div className="flex gap-2">
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Retry Camera Access
              </button>
            </div>
          </div>
        )}

        {/* Subtle Target Guide Outline (Center Framing) */}
        {!detectionResult && !cameraError && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-64 w-64 rounded-3xl border-2 border-dashed border-slate-700/60 flex items-center justify-center">
              <span className="text-[11px] text-slate-400 font-medium bg-slate-950/80 px-3 py-1 rounded-full border border-slate-800">
                Hold hand in view
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Live Gesture Status Bar */}
      <div className="border-t border-slate-800/80 bg-slate-950/90 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Detected Gesture Feedback */}
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                detectionResult?.isEmergency
                  ? 'border-rose-600 bg-rose-950/50 text-rose-400 animate-bounce'
                  : detectionResult?.gesture === 'signal_for_help_stage1'
                  ? 'border-amber-600 bg-amber-950/40 text-amber-300'
                  : detectionResult?.gesture === 'thumbs_up'
                  ? 'border-emerald-600 bg-emerald-950/40 text-emerald-300'
                  : 'border-slate-800 bg-slate-900 text-slate-400'
              }`}
            >
              <ShieldAlert className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 uppercase font-mono tracking-wider">
                  Recognized Gesture
                </span>
                {detectionResult && (
                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    · {Math.round(detectionResult.confidence * 100)}% Confidence
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-white tracking-tight truncate mt-0.5">
                {detectionResult ? detectionResult.label : 'Waiting for Hand Gesture...'}
              </h3>

              {/* Step Tracking Progression */}
              <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 font-mono">
                <span
                  className={
                    detectionResult?.details.stage === 1 || detectionResult?.details.stage === 2
                      ? 'text-amber-400 font-semibold'
                      : 'text-slate-600'
                  }
                >
                  Step 1: Thumb Folded {detectionResult?.details.thumbTucked ? '[✓]' : '[ ]'}
                </span>
                <span className="text-slate-700">·</span>
                <span
                  className={
                    detectionResult?.details.stage === 2
                      ? 'text-rose-400 font-semibold'
                      : 'text-slate-600'
                  }
                >
                  Step 2: Trapped Thumb {detectionResult?.details.fingersFolded ? '[✓]' : '[ ]'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Trigger / Helper links */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={onOpenGuide}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-rose-400" />
              <span>Gesture Guide</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
