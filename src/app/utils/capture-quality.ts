export interface CaptureQuality {
  brightnessOk: boolean;
  sharpnessOk: boolean;
  subjectOk: boolean;
  ready: boolean;
  reasons: string[];
}

const ANALYZE_W = 480;
const ANALYZE_H = 360;

function frameToImageDataFromVideo(video: HTMLVideoElement): ImageData | null {
  const w = video.videoWidth || 0;
  const h = video.videoHeight || 0;
  if (!w || !h) return null;

  const canvas = document.createElement('canvas');
  canvas.width = ANALYZE_W;
  canvas.height = ANALYZE_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, ANALYZE_W, ANALYZE_H);
  return ctx.getImageData(0, 0, ANALYZE_W, ANALYZE_H);
}

function luminanceStats(image: ImageData): { mean: number; sharpness: number } {
  const d = image.data;
  const w = image.width;
  const h = image.height;

  let sum = 0;
  let edgeSum = 0;

  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      const j = (y * w + (x + 1)) * 4;
      const k = (((y + 1) * w) + x) * 4;

      const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const lx = 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2];
      const ly = 0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2];

      sum += l;
      edgeSum += Math.abs(l - lx) + Math.abs(l - ly);
    }
  }

  const px = (w - 1) * (h - 1);
  return {
    mean: sum / Math.max(1, px),
    sharpness: edgeSum / Math.max(1, px),
  };
}

function detectDocumentCornersHeuristic(image: ImageData): boolean {
  const { width: w, height: h, data } = image;

  const luma = (x: number, y: number): number => {
    const idx = (y * w + x) * 4;
    return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  };

  const gx0 = Math.floor(w * 0.1);
  const gx1 = Math.floor(w * 0.9);
  const gy0 = Math.floor(h * 0.16);
  const gy1 = Math.floor(h * 0.84);

  const cornerWindows = [
    { x0: gx0 - 18, y0: gy0 - 18, x1: gx0 + 18, y1: gy0 + 18 },
    { x0: gx1 - 18, y0: gy0 - 18, x1: gx1 + 18, y1: gy0 + 18 },
    { x0: gx0 - 18, y0: gy1 - 18, x1: gx0 + 18, y1: gy1 + 18 },
    { x0: gx1 - 18, y0: gy1 - 18, x1: gx1 + 18, y1: gy1 + 18 },
  ];

  let cornerHits = 0;
  for (const win of cornerWindows) {
    let strongEdges = 0;
    for (let y = Math.max(1, win.y0); y < Math.min(h - 1, win.y1); y++) {
      for (let x = Math.max(1, win.x0); x < Math.min(w - 1, win.x1); x++) {
        const g = Math.abs(luma(x + 1, y) - luma(x - 1, y)) + Math.abs(luma(x, y + 1) - luma(x, y - 1));
        if (g > 58) strongEdges++;
      }
    }
    if (strongEdges > 30) cornerHits++;
  }

  return cornerHits >= 3;
}

function detectFaceApi(): {
  detect: (source: CanvasImageSource) => Promise<Array<{ boundingBox: { x: number; y: number; width: number; height: number } }>>;
} | null {
  try {
    const FaceDetectorCtor = (globalThis as unknown as {
      FaceDetector?: new (opts?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
        detect: (source: CanvasImageSource) => Promise<Array<{ boundingBox: { x: number; y: number; width: number; height: number } }>>;
      };
    }).FaceDetector;
    if (!FaceDetectorCtor) return null;
    return new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 1 });
  } catch {
    return null;
  }
}

export async function analyzeSelfieVideo(video: HTMLVideoElement): Promise<CaptureQuality> {
  const image = frameToImageDataFromVideo(video);
  if (!image) {
    return { brightnessOk: false, sharpnessOk: false, subjectOk: false, ready: false, reasons: ['camera-not-ready'] };
  }

  const stats = luminanceStats(image);
  const brightnessOk = stats.mean >= 65;
  const sharpnessOk = stats.sharpness >= 20;

  let subjectOk = false;
  const faceApi = detectFaceApi();

  if (faceApi) {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(image, 0, 0);
      try {
        const faces = await faceApi.detect(canvas);
        const face = faces?.[0];
        if (face) {
          const cx = face.boundingBox.x + face.boundingBox.width / 2;
          const cy = face.boundingBox.y + face.boundingBox.height / 2;
          const centered =
            cx > image.width * 0.3 &&
            cx < image.width * 0.7 &&
            cy > image.height * 0.25 &&
            cy < image.height * 0.7;
          const bigEnough = face.boundingBox.width > image.width * 0.18 && face.boundingBox.height > image.height * 0.18;
          subjectOk = centered && bigEnough;
        }
      } catch {
        subjectOk = false;
      }
    }
  }

  const reasons: string[] = [];
  if (!brightnessOk) reasons.push('low-light');
  if (!sharpnessOk) reasons.push('blurry');
  if (!subjectOk) reasons.push('face-not-detected-or-centered');

  return {
    brightnessOk,
    sharpnessOk,
    subjectOk,
    ready: brightnessOk && sharpnessOk && subjectOk,
    reasons,
  };
}

export async function analyzeIdVideo(video: HTMLVideoElement): Promise<CaptureQuality> {
  const image = frameToImageDataFromVideo(video);
  if (!image) {
    return { brightnessOk: false, sharpnessOk: false, subjectOk: false, ready: false, reasons: ['camera-not-ready'] };
  }

  const stats = luminanceStats(image);
  const brightnessOk = stats.mean >= 58;
  const sharpnessOk = stats.sharpness >= 18;
  const subjectOk = detectDocumentCornersHeuristic(image);

  const reasons: string[] = [];
  if (!brightnessOk) reasons.push('low-light');
  if (!sharpnessOk) reasons.push('blurry');
  if (!subjectOk) reasons.push('document-not-fully-detected');

  return {
    brightnessOk,
    sharpnessOk,
    subjectOk,
    ready: brightnessOk && sharpnessOk && subjectOk,
    reasons,
  };
}

export async function analyzeImageDataUrl(dataUrl: string, type: 'selfie' | 'id'): Promise<CaptureQuality> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = ANALYZE_W;
      canvas.height = ANALYZE_H;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ brightnessOk: false, sharpnessOk: false, subjectOk: false, ready: false, reasons: ['decode-failed'] });
        return;
      }
      ctx.drawImage(img, 0, 0, ANALYZE_W, ANALYZE_H);
      const backingCanvas = document.createElement('canvas');
      backingCanvas.width = ANALYZE_W;
      backingCanvas.height = ANALYZE_H;
      const bctx = backingCanvas.getContext('2d');
      if (!bctx) {
        resolve({ brightnessOk: false, sharpnessOk: false, subjectOk: false, ready: false, reasons: ['decode-failed'] });
        return;
      }
      bctx.drawImage(img, 0, 0, ANALYZE_W, ANALYZE_H);
      const image = bctx.getImageData(0, 0, ANALYZE_W, ANALYZE_H);
      if (!image) {
        resolve({ brightnessOk: false, sharpnessOk: false, subjectOk: false, ready: false, reasons: ['decode-failed'] });
        return;
      }

      if (type === 'id') {
        const stats = luminanceStats(image);
        const brightnessOk = stats.mean >= 58;
        const sharpnessOk = stats.sharpness >= 18;
        const subjectOk = detectDocumentCornersHeuristic(image);
        const reasons: string[] = [];
        if (!brightnessOk) reasons.push('low-light');
        if (!sharpnessOk) reasons.push('blurry');
        if (!subjectOk) reasons.push('document-not-fully-detected');
        resolve({ brightnessOk, sharpnessOk, subjectOk, ready: brightnessOk && sharpnessOk && subjectOk, reasons });
        return;
      }

      const stats = luminanceStats(image);
      const brightnessOk = stats.mean >= 65;
      const sharpnessOk = stats.sharpness >= 20;
      const faceApi = detectFaceApi();
      let subjectOk = false;
      if (faceApi) {
        try {
          const faces = await faceApi.detect(backingCanvas);
          const face = faces?.[0];
          if (face) {
            const cx = face.boundingBox.x + face.boundingBox.width / 2;
            const cy = face.boundingBox.y + face.boundingBox.height / 2;
            const centered =
              cx > ANALYZE_W * 0.3 &&
              cx < ANALYZE_W * 0.7 &&
              cy > ANALYZE_H * 0.25 &&
              cy < ANALYZE_H * 0.7;
            const bigEnough = face.boundingBox.width > ANALYZE_W * 0.18 && face.boundingBox.height > ANALYZE_H * 0.18;
            subjectOk = centered && bigEnough;
          }
        } catch {
          subjectOk = false;
        }
      }
      const reasons: string[] = [];
      if (!brightnessOk) reasons.push('low-light');
      if (!sharpnessOk) reasons.push('blurry');
      if (!subjectOk) reasons.push('face-not-detected-or-centered');
      resolve({ brightnessOk, sharpnessOk, subjectOk, ready: brightnessOk && sharpnessOk && subjectOk, reasons });
    };
    img.onerror = () => {
      resolve({ brightnessOk: false, sharpnessOk: false, subjectOk: false, ready: false, reasons: ['decode-failed'] });
    };
    img.src = dataUrl;
  });
}
