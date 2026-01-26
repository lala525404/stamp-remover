
import { ProcessingSettings } from '../types';

declare const ImageTracer: any;

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 217, g: 0, b: 0 };
}

export function processSealImage(
  canvas: HTMLCanvasElement,
  originalImage: HTMLImageElement,
  settings: ProcessingSettings
): void {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const { width, height } = originalImage;
  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(originalImage, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const { redSensitivity, lightnessThreshold, chromaThreshold, targetColor, detectionMode } = settings;
  const targetRgb = hexToRgb(targetColor);

  const rRatio = 1.0 + (redSensitivity / 100); 
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const lightness = (r + g + b) / 3;
    let shouldKeep = false;

    if (detectionMode === 'red') {
      const isReddish = r > (g * rRatio) && r > (b * rRatio);
      const colorDiff = r - Math.max(g, b);
      if (lightness <= lightnessThreshold && isReddish && colorDiff >= chromaThreshold) {
        shouldKeep = true;
      }
    } else {
      const saturation = Math.max(r, g, b) - Math.min(r, g, b);
      const isDark = lightness < (255 - lightnessThreshold);
      if (isDark && saturation < (redSensitivity / 2)) {
        shouldKeep = true;
      }
    }
    
    if (!shouldKeep) {
      data[i + 3] = 0;
    } else {
      data[i + 3] = 255;
      data[i] = targetRgb.r;
      data[i + 1] = targetRgb.g;
      data[i + 2] = targetRgb.b;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

export function upscaleAndSharpen(
  sourceCanvas: HTMLCanvasElement,
  targetCanvas: HTMLCanvasElement,
  scale: number
): void {
  const sw = sourceCanvas.width;
  const sh = sourceCanvas.height;
  const dw = sw * scale;
  const dh = sh * scale;

  targetCanvas.width = dw;
  targetCanvas.height = dh;
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, dw, dh);
}

export function traceToSvg(canvas: HTMLCanvasElement): string {
  if (typeof ImageTracer === 'undefined') {
    console.warn('ImageTracer not found, using fallback.');
    return generateFallbackSvg(canvas);
  }

  try {
    const options = {
      ltres: 0.1,
      qtres: 0.1,
      pathomit: 32,
      rightangleenhance: true,
      colorsampling: 1,
      numberofcolors: 2,
      mincolorratio: 0.05,
      viewbox: true
    };
    return ImageTracer.getSVGString(canvas, options);
  } catch (e) {
    console.error('Tracing failed', e);
    return generateFallbackSvg(canvas);
  }
}

function generateFallbackSvg(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const w = canvas.width;
  const h = canvas.height;
  const data = ctx.getImageData(0, 0, w, h).data;
  let paths = '';
  const color = 'currentColor';

  for (let y = 0; y < h; y++) {
    let startX = -1;
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha > 128) {
        if (startX === -1) startX = x;
      } else if (startX !== -1) {
        paths += `M${startX},${y}h${x - startX}v1h-${x - startX}z `;
        startX = -1;
      }
    }
    if (startX !== -1) paths += `M${startX},${y}h${w - startX}v1h-${w - startX}z `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><path d="${paths}" fill="${color}"/></svg>`;
}
