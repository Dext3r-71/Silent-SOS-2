import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { LandmarkPoint } from '../types/sos';

// Connection indices for hand landmarks
export const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [9, 10], [10, 11], [11, 12],
  // Ring
  [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [5, 9], [9, 13], [13, 17],
];

export class HandDetectionService {
  private landmarker: HandLandmarker | null = null;
  private isInitializing = false;
  private initError: string | null = null;

  public async initialize(): Promise<{ success: boolean; error?: string }> {
    if (this.landmarker) return { success: true };
    if (this.isInitializing) return { success: false, error: 'Initialization in progress' };

    this.isInitializing = true;
    this.initError = null;

    try {
      // Load wasm assets
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
      );

      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.isInitializing = false;
      return { success: true };
    } catch (err: unknown) {
      console.warn('Failed with GPU delegate, retrying with CPU...', err);
      // Fallback to CPU delegate if GPU delegate failed
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
        );
        this.landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.45,
          minHandPresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
        });
        this.isInitializing = false;
        return { success: true };
      } catch (cpuErr: unknown) {
        const msg = cpuErr instanceof Error ? cpuErr.message : 'MediaPipe failed to load';
        this.initError = msg;
        this.isInitializing = false;
        return { success: false, error: msg };
      }
    }
  }

  public isReady(): boolean {
    return this.landmarker !== null;
  }

  public detect(
    videoElement: HTMLVideoElement,
    timestampMs: number
  ): LandmarkPoint[][] {
    if (!this.landmarker || videoElement.readyState < 2) return [];

    try {
      const results = this.landmarker.detectForVideo(videoElement, timestampMs);
      if (results.landmarks && results.landmarks.length > 0) {
        return results.landmarks.map((hand) =>
          hand.map((p) => ({ x: p.x, y: p.y, z: p.z }))
        );
      }
    } catch {
      // Frame drop or non-monotonic timestamp, skip silently
    }

    return [];
  }

  public drawLandmarks(
    ctx: CanvasRenderingContext2D,
    landmarks: LandmarkPoint[],
    width: number,
    height: number,
    statusColor: string = '#38bdf8'
  ) {
    if (!landmarks || landmarks.length < 21) return;

    // Draw connection lines
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = statusColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];

      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
    }

    // Draw landmark joints
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      const isTip = [4, 8, 12, 16, 20].includes(i);
      const radius = isTip ? 4.5 : 3;

      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isTip ? '#ffffff' : statusColor;
      ctx.fill();

      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.stroke();
    }

    // Draw bounding box
    let minX = 1;
    let minY = 1;
    let maxX = 0;
    let maxY = 0;

    for (const p of landmarks) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }

    const pad = 16;
    const boxX = Math.max(0, minX * width - pad);
    const boxY = Math.max(0, minY * height - pad);
    const boxW = Math.min(width - boxX, (maxX - minX) * width + pad * 2);
    const boxH = Math.min(height - boxY, (maxY - minY) * height + pad * 2);

    ctx.save();
    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Corner brackets
    ctx.setLineDash([]);
    ctx.lineWidth = 2.5;
    const cLen = 14;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + cLen);
    ctx.lineTo(boxX, boxY);
    ctx.lineTo(boxX + cLen, boxY);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(boxX + boxW - cLen, boxY);
    ctx.lineTo(boxX + boxW, boxY);
    ctx.lineTo(boxX + boxW, boxY + cLen);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + boxH - cLen);
    ctx.lineTo(boxX, boxY + boxH);
    ctx.lineTo(boxX + cLen, boxY + boxH);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(boxX + boxW - cLen, boxY + boxH);
    ctx.lineTo(boxX + boxW, boxY + boxH);
    ctx.lineTo(boxX + boxW, boxY + boxH - cLen);
    ctx.stroke();

    ctx.restore();
  }

  public close() {
    if (this.landmarker) {
      try {
        this.landmarker.close();
      } catch {
        // ignore
      }
      this.landmarker = null;
    }
  }
}

export const handDetectionService = new HandDetectionService();
