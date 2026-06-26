type FaceLike = {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

async function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image data URL'));
    img.src = dataUrl;
  });
}

function safeDrawContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const iw = Math.max(1, img.width);
  const ih = Math.max(1, img.height);
  const scale = Math.min(width / iw, height / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (width - dw) / 2;
  const dy = y + (height - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function cropFromFaceIfDetected(
  imgW: number,
  imgH: number,
  face: FaceLike,
): { sx: number; sy: number; sw: number; sh: number } {
  const cx = face.boundingBox.x + face.boundingBox.width / 2;
  const cy = face.boundingBox.y + face.boundingBox.height / 2;
  const baseSize = Math.max(face.boundingBox.width, face.boundingBox.height) * 2.1;
  const maxSize = Math.min(imgW, imgH);
  const size = Math.max(64, Math.min(maxSize, baseSize));

  let sx = cx - size / 2;
  let sy = cy - size / 2;

  sx = Math.max(0, Math.min(imgW - size, sx));
  sy = Math.max(0, Math.min(imgH - size, sy));

  return { sx, sy, sw: size, sh: size };
}

async function detectSingleFace(dataUrl: string): Promise<FaceLike | null> {
  try {
    const globalFaceDetector = (globalThis as { FaceDetector?: new (opts?: { fastMode?: boolean; maxDetectedFaces?: number }) => { detect: (source: CanvasImageSource) => Promise<FaceLike[]> } }).FaceDetector;
    if (!globalFaceDetector) return null;

    const detector = new globalFaceDetector({ fastMode: true, maxDetectedFaces: 1 });
    const img = await loadImage(dataUrl);
    const faces = await detector.detect(img);
    return faces?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function normalizeSelfieEvidence(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);
  const face = await detectSingleFace(dataUrl);

  // Keep high native detail for PDF embedding while preventing oversized payloads.
  const outSize = Math.max(256, Math.min(1080, Math.min(img.width, img.height)));
  const canvas = document.createElement('canvas');
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outSize, outSize);

  if (face) {
    const crop = cropFromFaceIfDetected(img.width, img.height, face);
    ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, outSize, outSize);
  } else {
    // Fallback: centered contain keeps original aspect ratio and avoids stretching.
    safeDrawContain(ctx, img, 0, 0, outSize, outSize);
  }

  return canvas.toDataURL('image/jpeg', 0.9);
}

export async function normalizeIdEvidence(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);

  // Preserve ID legibility at HD-level resolution without unnecessary upscaling.
  const targetMaxW = 1920;
  const targetMaxH = 1210;
  const outW = Math.max(480, Math.min(targetMaxW, img.width));
  const outH = Math.max(300, Math.min(targetMaxH, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outW, outH);

  // Contain strategy to never deform the ID card/passport.
  safeDrawContain(ctx, img, 0, 0, outW, outH);

  return canvas.toDataURL('image/jpeg', 0.9);
}
