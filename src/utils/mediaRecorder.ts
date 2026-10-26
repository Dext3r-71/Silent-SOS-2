export async function captureVideoClip(
  stream: MediaStream,
  durationSeconds: number = 5
): Promise<{ videoBlobUrl: string; duration: number } | null> {
  if (!stream || !window.MediaRecorder) {
    return null;
  }

  return new Promise((resolve) => {
    try {
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ];
      const mimeType = mimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        try {
          const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
          const url = URL.createObjectURL(blob);
          resolve({ videoBlobUrl: url, duration: durationSeconds });
        } catch {
          resolve(null);
        }
      };

      recorder.onerror = () => {
        resolve(null);
      };

      recorder.start();
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, durationSeconds * 1000);
    } catch {
      resolve(null);
    }
  });
}

export function captureSnapshotFromCanvas(
  videoElement: HTMLVideoElement,
  overlayCanvas?: HTMLCanvasElement | null,
  metadata?: { timestamp: string; gesture: string; confidence: number }
): string {
  const width = videoElement.videoWidth || 640;
  const height = videoElement.videoHeight || 480;

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext('2d');

  if (!ctx) return '';

  // Draw current video frame
  ctx.drawImage(videoElement, 0, 0, width, height);

  // Overlay landmark canvas if present
  if (overlayCanvas) {
    ctx.drawImage(overlayCanvas, 0, 0, width, height);
  }

  // Draw security timestamp banner
  if (metadata) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(0, height - 36, width, 36);

    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(16, height - 18, 5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(
      `SILENT SOS EVIDENCE // ${metadata.timestamp} // ${metadata.gesture.toUpperCase()} (${Math.round(metadata.confidence * 100)}%)`,
      30,
      height - 14
    );
  }

  return offscreen.toDataURL('image/jpeg', 0.9);
}
