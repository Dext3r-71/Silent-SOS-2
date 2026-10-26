export type GestureType =
  | 'none'
  | 'signal_for_help_stage1' // Open palm with thumb folded across
  | 'signal_for_help_stage2' // 4 fingers folded down over thumb
  | 'signal_for_help_confirmed' // Sequence matched or sustained emergency pose
  | 'open_palm' // All fingers extended, thumb outward
  | 'closed_fist' // Regular fist (thumb outside)
  | 'thumbs_up' // Disarm / I'm safe gesture
  | 'victory' // Peace / V sign
  | 'pointing'; // Single index finger

export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}

export interface GestureDetectionResult {
  gesture: GestureType;
  confidence: number;
  label: string;
  isEmergency: boolean;
  isDisarm: boolean;
  details: {
    thumbTucked: boolean;
    fingersFolded: boolean;
    palmFacingCamera: boolean;
    stage: 0 | 1 | 2;
    activeFingers: {
      thumb: boolean;
      index: boolean;
      middle: boolean;
      ring: boolean;
      pinky: boolean;
    };
  };
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
  isPrimary: boolean;
}

export interface IncidentRecord {
  id: string;
  timestamp: number;
  dateFormatted: string;
  gestureTriggered: string;
  confidence: number;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  locationAddress?: string;
  snapshotDataUrl: string;
  videoBlobUrl?: string;
  videoDurationSec?: number;
  audioMode: 'siren' | 'silent';
  dispatchedToContacts: EmergencyContact[];
  status: 'triggered' | 'dispatched' | 'cancelled_false_alarm' | 'archived';
  simulationLog: Array<{
    time: string;
    action: string;
    status: 'success' | 'pending' | 'info';
  }>;
}

export interface AppSettings {
  silentMode: boolean; // false = loud siren on SOS, true = stealth silent alert
  autoRecordVideo: boolean;
  videoDurationSeconds: number; // e.g. 5 seconds
  countdownSeconds: number; // grace period before dispatch e.g. 3s
  vibrationEnabled: boolean;
  showSkeleton: boolean;
  mirrorCamera: boolean;
  emergencyThreshold: number; // confidence threshold
  disarmGestureEnabled: boolean; // Thumbs up to cancel
}
