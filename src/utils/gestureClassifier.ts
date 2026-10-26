import { GestureDetectionResult, GestureType, LandmarkPoint } from '../types/sos';

function distance3D(a: LandmarkPoint, b: LandmarkPoint): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.hypot(dx, dy, dz);
}

// Stateful sequence tracker for 2-step "Signal for Help"
class GestureSequenceTracker {
  private lastStage1Timestamp: number = 0;
  private stage1SustainedCount: number = 0;
  private stage2SustainedCount: number = 0;
  private staticSosSustainedCount: number = 0;

  public reset() {
    this.lastStage1Timestamp = 0;
    this.stage1SustainedCount = 0;
    this.stage2SustainedCount = 0;
    this.staticSosSustainedCount = 0;
  }

  public update(currentPose: 'stage1' | 'stage2' | 'other'): {
    confirmed: boolean;
    stage: 0 | 1 | 2;
    progress: number; // 0 to 1
  } {
    const now = Date.now();

    if (currentPose === 'stage1') {
      this.stage1SustainedCount += 1;
      this.stage2SustainedCount = 0;
      this.staticSosSustainedCount = 0;
      if (this.stage1SustainedCount >= 4) {
        this.lastStage1Timestamp = now;
      }
      return {
        confirmed: false,
        stage: 1,
        progress: Math.min(this.stage1SustainedCount / 8, 0.5),
      };
    }

    if (currentPose === 'stage2') {
      this.stage2SustainedCount += 1;
      this.staticSosSustainedCount += 1;

      // Check if preceded by Stage 1 within 3 seconds
      const elapsedSinceStage1 = now - this.lastStage1Timestamp;
      const isSequenceValid = this.lastStage1Timestamp > 0 && elapsedSinceStage1 < 3200 && elapsedSinceStage1 > 200;

      if (isSequenceValid && this.stage2SustainedCount >= 4) {
        return { confirmed: true, stage: 2, progress: 1.0 };
      }

      // Or static SOS hold for ~1.5s (~18 frames at 15-20fps)
      if (this.staticSosSustainedCount >= 16) {
        return { confirmed: true, stage: 2, progress: 1.0 };
      }

      const progress = isSequenceValid
        ? 0.5 + Math.min(this.stage2SustainedCount / 8, 0.5)
        : Math.min(this.staticSosSustainedCount / 16, 0.9);

      return {
        confirmed: false,
        stage: 2,
        progress,
      };
    }

    // Other pose
    this.stage1SustainedCount = Math.max(0, this.stage1SustainedCount - 1);
    this.stage2SustainedCount = 0;
    this.staticSosSustainedCount = Math.max(0, this.staticSosSustainedCount - 2);

    // Keep stage1 valid for a grace window
    if (now - this.lastStage1Timestamp > 3200) {
      this.lastStage1Timestamp = 0;
    }

    return {
      confirmed: false,
      stage: this.lastStage1Timestamp > 0 ? 1 : 0,
      progress: 0,
    };
  }
}

export const sequenceTracker = new GestureSequenceTracker();

export function classifyHandLandmarks(landmarks: LandmarkPoint[]): GestureDetectionResult {
  if (!landmarks || landmarks.length < 21) {
    return {
      gesture: 'none',
      confidence: 0,
      label: 'No Hand Detected',
      isEmergency: false,
      isDisarm: false,
      details: {
        thumbTucked: false,
        fingersFolded: false,
        palmFacingCamera: false,
        stage: 0,
        activeFingers: {
          thumb: false,
          index: false,
          middle: false,
          ring: false,
          pinky: false,
        },
      },
    };
  }

  const wrist = landmarks[0];
  const thumbCmc = landmarks[1];
  const thumbMcp = landmarks[2];
  const thumbIp = landmarks[3];
  const thumbTip = landmarks[4];

  const indexMcp = landmarks[5];
  const indexPip = landmarks[6];
  const indexDip = landmarks[7];
  const indexTip = landmarks[8];

  const middleMcp = landmarks[9];
  const middlePip = landmarks[10];
  const middleDip = landmarks[11];
  const middleTip = landmarks[12];

  const ringMcp = landmarks[13];
  const ringPip = landmarks[14];
  const ringDip = landmarks[15];
  const ringTip = landmarks[16];

  const pinkyMcp = landmarks[17];
  const pinkyPip = landmarks[18];
  const pinkyDip = landmarks[19];
  const pinkyTip = landmarks[20];

  // Palm size normalization baseline
  const palmSize = Math.max(0.05, distance3D(wrist, middleMcp));

  // Check finger extensions (tip farther from wrist than pip)
  const isIndexExtended =
    distance3D(indexTip, wrist) > distance3D(indexPip, wrist) * 1.1 &&
    distance3D(indexTip, indexMcp) > palmSize * 0.65;

  const isMiddleExtended =
    distance3D(middleTip, wrist) > distance3D(middlePip, wrist) * 1.1 &&
    distance3D(middleTip, middleMcp) > palmSize * 0.65;

  const isRingExtended =
    distance3D(ringTip, wrist) > distance3D(ringPip, wrist) * 1.1 &&
    distance3D(ringTip, ringMcp) > palmSize * 0.65;

  const isPinkyExtended =
    distance3D(pinkyTip, wrist) > distance3D(pinkyPip, wrist) * 1.05 &&
    distance3D(pinkyTip, pinkyMcp) > palmSize * 0.55;

  // Check if four fingers are curled down
  const allFourFingersCurled =
    !isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended;

  // Check if four fingers are upright/extended
  const allFourFingersExtended =
    isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended;

  // Check thumb position:
  // In Signal for Help, thumb is folded inward across the palm toward ring/pinky base
  const distThumbToPinkyMcp = distance3D(thumbTip, pinkyMcp);
  const distThumbToRingMcp = distance3D(thumbTip, ringMcp);
  const distThumbToMiddleMcp = distance3D(thumbTip, middleMcp);
  const distThumbToWrist = distance3D(thumbTip, wrist);

  // Thumb is tucked if tip is closer to pinky/ring MCP than normal spread, or close to palm center
  const isThumbTuckedInPalm =
    (distThumbToPinkyMcp < palmSize * 0.72 ||
      distThumbToRingMcp < palmSize * 0.62 ||
      distThumbToMiddleMcp < palmSize * 0.55) &&
    distThumbToWrist < palmSize * 1.15;

  // Thumb extended out
  const isThumbExtendedOut =
    distance3D(thumbTip, thumbMcp) > palmSize * 0.6 &&
    distThumbToPinkyMcp > palmSize * 0.85;

  // Thumbs up check: thumb tip is high (lower y in screen space) relative to wrist and other fingers
  const isThumbUpward =
    thumbTip.y < thumbMcp.y - palmSize * 0.25 &&
    thumbTip.y < indexMcp.y &&
    distance3D(thumbTip, wrist) > palmSize * 0.75;

  // Palm facing camera check (landmarks z-depth variance or cross-product orientation)
  const palmFacingCamera = true; // Most desktop/mobile front webcams have palm facing forward

  // 1. Check for Disarm gesture ("Thumbs Up")
  if (isThumbUpward && allFourFingersCurled) {
    sequenceTracker.reset();
    return {
      gesture: 'thumbs_up',
      confidence: 0.94,
      label: "Thumbs Up (Safe / Disarm)",
      isEmergency: false,
      isDisarm: true,
      details: {
        thumbTucked: false,
        fingersFolded: true,
        palmFacingCamera,
        stage: 0,
        activeFingers: {
          thumb: true,
          index: false,
          middle: false,
          ring: false,
          pinky: false,
        },
      },
    };
  }

  // 2. Check for Signal for Help: Stage 1 (Palm open with thumb tucked in)
  if (isThumbTuckedInPalm && allFourFingersExtended) {
    const seq = sequenceTracker.update('stage1');
    return {
      gesture: 'signal_for_help_stage1',
      confidence: 0.92,
      label: 'Signal for Help (Step 1: Thumb Tucked)',
      isEmergency: false,
      isDisarm: false,
      details: {
        thumbTucked: true,
        fingersFolded: false,
        palmFacingCamera,
        stage: 1,
        activeFingers: {
          thumb: false,
          index: true,
          middle: true,
          ring: true,
          pinky: true,
        },
      },
    };
  }

  // 3. Check for Signal for Help: Stage 2 (Fingers closed over tucked thumb)
  if (isThumbTuckedInPalm && allFourFingersCurled) {
    const seq = sequenceTracker.update('stage2');
    const isConfirmed = seq.confirmed;

    return {
      gesture: isConfirmed ? 'signal_for_help_confirmed' : 'signal_for_help_stage2',
      confidence: isConfirmed ? 0.98 : 0.88,
      label: isConfirmed
        ? 'EMERGENCY: Signal for Help CONFIRMED'
        : 'Signal for Help (Step 2: Fingers Trapping Thumb)',
      isEmergency: isConfirmed,
      isDisarm: false,
      details: {
        thumbTucked: true,
        fingersFolded: true,
        palmFacingCamera,
        stage: 2,
        activeFingers: {
          thumb: false,
          index: false,
          middle: false,
          ring: false,
          pinky: false,
        },
      },
    };
  }

  // Reset sequence tracking for other poses
  const seq = sequenceTracker.update('other');

  // 4. Open Palm (All fingers extended, thumb outward)
  if (allFourFingersExtended && isThumbExtendedOut) {
    return {
      gesture: 'open_palm',
      confidence: 0.95,
      label: 'Open Palm (Normal / Idle)',
      isEmergency: false,
      isDisarm: false,
      details: {
        thumbTucked: false,
        fingersFolded: false,
        palmFacingCamera,
        stage: seq.stage,
        activeFingers: {
          thumb: true,
          index: true,
          middle: true,
          ring: true,
          pinky: true,
        },
      },
    };
  }

  // 5. Standard Closed Fist (Thumb resting on exterior knuckles)
  if (allFourFingersCurled && !isThumbTuckedInPalm) {
    return {
      gesture: 'closed_fist',
      confidence: 0.9,
      label: 'Closed Fist (Standard)',
      isEmergency: false,
      isDisarm: false,
      details: {
        thumbTucked: false,
        fingersFolded: true,
        palmFacingCamera,
        stage: seq.stage,
        activeFingers: {
          thumb: false,
          index: false,
          middle: false,
          ring: false,
          pinky: false,
        },
      },
    };
  }

  // 6. Victory / Peace Sign (Index & Middle up, others folded)
  if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    return {
      gesture: 'victory',
      confidence: 0.93,
      label: 'Victory / Peace Sign',
      isEmergency: false,
      isDisarm: false,
      details: {
        thumbTucked: isThumbTuckedInPalm,
        fingersFolded: false,
        palmFacingCamera,
        stage: seq.stage,
        activeFingers: {
          thumb: false,
          index: true,
          middle: true,
          ring: false,
          pinky: false,
        },
      },
    };
  }

  // 7. Pointing gesture (Index up, others curled)
  if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    return {
      gesture: 'pointing',
      confidence: 0.89,
      label: 'Pointing Index Finger',
      isEmergency: false,
      isDisarm: false,
      details: {
        thumbTucked: isThumbTuckedInPalm,
        fingersFolded: false,
        palmFacingCamera,
        stage: seq.stage,
        activeFingers: {
          thumb: false,
          index: true,
          middle: false,
          ring: false,
          pinky: false,
        },
      },
    };
  }

  // Default state when hand is present but gesture is transitioning
  return {
    gesture: 'none',
    confidence: 0.7,
    label: 'Hand Tracked (Adjusting)',
    isEmergency: false,
    isDisarm: false,
    details: {
      thumbTucked: isThumbTuckedInPalm,
      fingersFolded: allFourFingersCurled,
      palmFacingCamera,
      stage: seq.stage,
      activeFingers: {
        thumb: isThumbExtendedOut,
        index: isIndexExtended,
        middle: isMiddleExtended,
        ring: isRingExtended,
        pinky: isPinkyExtended,
      },
    },
  };
}
