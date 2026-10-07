export type ImageSize = { width: number; height: number };
export type ImageAdjustments = {
  aspect: number;
  zoom: number;
  positionX: number;
  positionY: number;
  rotation: number;
  flipHorizontal: boolean;
  brightness: number;
  contrast: number;
};
export type ImageExportFormat = "image/jpeg" | "image/png" | "image/webp";

export const MAX_IMAGE_DIMENSION = 4096;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getRotatedSize(size: ImageSize, rotation: number): ImageSize {
  return Math.abs(rotation % 180) === 90
    ? { width: size.height, height: size.width }
    : { ...size };
}

export function getCropRect(size: ImageSize, adjustments: ImageAdjustments) {
  const rotated = getRotatedSize(size, adjustments.rotation);
  const aspect = Number.isFinite(adjustments.aspect) && adjustments.aspect > 0
    ? adjustments.aspect : rotated.width / rotated.height;
  const zoom = clamp(adjustments.zoom, 1, 5);
  const width = Math.min(rotated.width, rotated.height * aspect) / zoom;
  const height = width / aspect;
  return {
    x: (rotated.width - width) * clamp(adjustments.positionX, 0, 1),
    y: (rotated.height - height) * clamp(adjustments.positionY, 0, 1),
    width,
    height,
  };
}

// Fit dimensions proportionally; never distort images or exceed canvas limits.
export function fitImageSize(size: ImageSize, max = MAX_IMAGE_DIMENSION): ImageSize {
  const scale = Math.min(1, max / size.width, max / size.height);
  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  };
}

export function resizeImageSize(
  size: ImageSize,
  field: "width" | "height",
  value: number,
  lockAspect: boolean,
): ImageSize {
  const dimension = clamp(Math.round(value) || 1, 1, MAX_IMAGE_DIMENSION);
  const aspect = size.width / size.height;
  return fitImageSize(lockAspect
    ? field === "width"
      ? { width: dimension, height: dimension / aspect }
      : { width: dimension * aspect, height: dimension }
    : { ...size, [field]: dimension });
}

export function moveCrop(
  size: ImageSize,
  adjustments: ImageAdjustments,
  deltaX: number,
  deltaY: number,
  display: ImageSize,
) {
  const rotated = getRotatedSize(size, adjustments.rotation);
  const crop = getCropRect(size, adjustments);
  const overflowX = rotated.width - crop.width;
  const overflowY = rotated.height - crop.height;
  return {
    positionX: overflowX > 0
      ? clamp(adjustments.positionX - deltaX * crop.width / display.width / overflowX, 0, 1)
      : adjustments.positionX,
    positionY: overflowY > 0
      ? clamp(adjustments.positionY - deltaY * crop.height / display.height / overflowY, 0, 1)
      : adjustments.positionY,
  };
}

// Use the same rendering for the live preview and the file being uploaded.
export function drawAdjustedImage(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  adjustments: ImageAdjustments,
  output: ImageSize,
  format: ImageExportFormat,
) {
  canvas.width = output.width;
  canvas.height = output.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser does not support image editing.");
  const source = { width: image.naturalWidth, height: image.naturalHeight };
  const rotated = getRotatedSize(source, adjustments.rotation);
  const crop = getCropRect(source, adjustments);
  context.save();
  try {
    context.clearRect(0, 0, output.width, output.height);
    if (format === "image/jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, output.width, output.height);
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%)`;
    context.scale(output.width / crop.width, output.height / crop.height);
    context.translate(-crop.x, -crop.y);
    context.translate(rotated.width / 2, rotated.height / 2);
    if (adjustments.flipHorizontal) context.scale(-1, 1);
    context.rotate(adjustments.rotation * Math.PI / 180);
    context.drawImage(image, -source.width / 2, -source.height / 2);
  } finally {
    context.restore();
  }
}

export async function exportAdjustedImage(
  image: HTMLImageElement,
  originalName: string,
  adjustments: ImageAdjustments,
  output: ImageSize,
  format: ImageExportFormat,
  quality: number,
): Promise<File> {
  if (![output.width, output.height].every((value) =>
    Number.isInteger(value) && value > 0 && value <= MAX_IMAGE_DIMENSION)) {
    throw new Error(`Image dimensions must be between 1 and ${MAX_IMAGE_DIMENSION} pixels.`);
  }
  const canvas = document.createElement("canvas");
  try {
    drawAdjustedImage(canvas, image, adjustments, output, format);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => result
        ? resolve(result) : reject(new Error("Unable to export this image. Try a smaller size.")),
      format, clamp(quality, 0.1, 1));
    });
    if (blob.size > MAX_UPLOAD_BYTES) {
      throw new Error("The adjusted image exceeds 10 MB. Reduce its dimensions or quality.");
    }
    // Some browsers fall back to PNG when an export format isn't supported.
    const extension = blob.type === "image/jpeg" ? "jpg" : blob.type === "image/webp" ? "webp" : "png";
    const name = originalName.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${name}-adjusted.${extension}`, { type: blob.type });
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}