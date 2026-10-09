"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  drawAdjustedImage, exportAdjustedImage, fitImageSize, getCropRect,
  getRotatedSize, loadImageFile, MAX_IMAGE_DIMENSION, moveCrop, resizeImageSize,
  type ImageAdjustments, type ImageExportFormat, type ImageSize,
} from "@/lib/image-adjuster";

const PRESETS = [
  { label: "Original", value: "original" },
  { label: "Square (1:1)", value: "1" },
  { label: "Book cover (2:3)", value: String(2 / 3) },
  { label: "Portrait (3:4)", value: "0.75" },
  { label: "Landscape (4:3)", value: String(4 / 3) },
  { label: "Banner (16:9)", value: String(16 / 9) },
  { label: "Custom ratio", value: "custom" },
];
const controlClass = "w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800";

function initialAdjustments(aspect: number): ImageAdjustments {
  return { aspect, zoom: 1, positionX: 0.5, positionY: 0.5, rotation: 0,
    flipHorizontal: false, brightness: 100, contrast: 100 };
}

export default function ImageUploadInput({
  onReady, disabled = false, label = "Upload & Adjust", className = "", existingImage,
}: {
  onReady: (file: File) => void | Promise<void>;
  disabled?: boolean;
  label?: string;
  className?: string;
  existingImage?: string | File | null;
}) {
  const [source, setSource] = useState<File | string | null>(null);
  const close = useCallback(() => setSource(null), []);
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <label className={`relative inline-flex cursor-pointer items-center rounded border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 ${disabled ? "pointer-events-none opacity-50" : ""} ${className}`}>
        {label}
        <input
          type="file"
          accept="image/*"
          disabled={disabled || !!source}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={label}
          onChange={(event) => {
            const selected = event.target.files?.[0];
            event.target.value = "";
            if (selected) setSource(selected);
          }}
        />
      </label>
      {existingImage && <button type="button" disabled={disabled || !!source}
        onClick={() => setSource(existingImage)}
        className={`rounded border border-[#e47911] bg-white px-4 py-2.5 text-sm font-medium text-[#c45500] hover:bg-orange-50 disabled:opacity-50 ${className}`}>
        Edit existing image
      </button>}
      {source && <ImageAdjuster source={source} onCancel={close} onReady={onReady} />}
    </span>
  );
}

function ImageAdjuster({ source, onCancel, onReady }: {
  source: File | string;
  onCancel: () => void;
  onReady: (file: File) => void | Promise<void>;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [adjustments, setAdjustments] = useState(initialAdjustments(1));
  const [preset, setPreset] = useState("original");
  const [customRatio, setCustomRatio] = useState({ width: 1, height: 1 });
  const [output, setOutput] = useState<ImageSize>({ width: 1, height: 1 });
  const [lockAspect, setLockAspect] = useState(true);
  const [format, setFormat] = useState<ImageExportFormat>("image/png");
  const [quality, setQuality] = useState(0.9);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    let url: string | undefined;
    const image = new Image();
    const load = async () => {
      try {
        const loadedFile = typeof source === "string" ? await loadImageFile(source, controller.signal) : source;
        if (cancelled) return;
        url = URL.createObjectURL(loadedFile);
        image.onload = () => {
          if (cancelled) return;
          setFile(loadedFile);
          setImage(image);
          setFormat(loadedFile.type === "image/jpeg" ? "image/jpeg" : loadedFile.type === "image/webp" ? "image/webp" : "image/png");
          setAdjustments(initialAdjustments(image.naturalWidth / image.naturalHeight));
          setOutput(fitImageSize({ width: image.naturalWidth, height: image.naturalHeight }));
        };
        image.onerror = () => {
          if (!cancelled) setError("This image cannot be opened. Please choose a JPEG, PNG, or WebP image.");
        };
        image.src = url;
      } catch (error) {
        if (!cancelled) setError(error instanceof Error ? error.message : "Unable to load the existing image.");
      }
    };
    void load();
    return () => {
      cancelled = true;
      controller.abort();
      image.onload = null;
      image.onerror = null;
      if (url) URL.revokeObjectURL(url);
    };
  }, [source, loadAttempt]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const preview = fitImageSize(output, 800);
    drawAdjustedImage(canvasRef.current, image, adjustments, preview, format);
  }, [image, adjustments, output, format]);

  const sourceSize = image ? { width: image.naturalWidth, height: image.naturalHeight } : null;

  const changeAspect = (value: string, ratio = customRatio) => {
    if (!sourceSize) return;
    const rotated = getRotatedSize(sourceSize, adjustments.rotation);
    const aspect = value === "original" ? rotated.width / rotated.height
      : value === "custom" ? ratio.width / ratio.height : Number(value);
    const next = { ...adjustments, aspect, positionX: 0.5, positionY: 0.5 };
    setPreset(value);
    setAdjustments(next);
    setOutput(fitImageSize(getCropRect(sourceSize, next)));
  };

  const reset = () => {
    if (!sourceSize) return;
    setPreset("original");
    setAdjustments(initialAdjustments(sourceSize.width / sourceSize.height));
    setOutput(fitImageSize(sourceSize));
    setLockAspect(true);
    setError("");
  };

  const rotate = () => {
    if (!sourceSize) return;
    const rotation = (adjustments.rotation + 90) % 360;
    const rotated = getRotatedSize(sourceSize, rotation);
    const next = { ...adjustments, rotation, positionX: 0.5, positionY: 0.5,
      aspect: preset === "original" ? rotated.width / rotated.height : adjustments.aspect };
    setAdjustments(next);
    setOutput(fitImageSize(getCropRect(sourceSize, next)));
  };

  const confirm = async () => {
    if (!image || !file || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await exportAdjustedImage(image, file.name, adjustments, output, format, quality);
      await onReady(result);
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save the adjusted image.");
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-3 sm:p-6">
      <div
        ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            if (!busy) onCancel();
          }
          if (event.key === "Tab") {
            const controls = dialogRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex='0']");
            if (!controls?.length) return;
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
              event.preventDefault(); last.focus();
            } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
              event.preventDefault(); first.focus();
            }
          }
        }}
      >
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-[#232f3e]">Adjust image before upload</h2>
            <p className="mt-1 text-xs text-gray-500">Crop, reposition, and resize. Your original file stays unchanged.</p>
          </div>
          <button type="button" onClick={onCancel} disabled={busy} aria-label="Close image editor" className="rounded px-3 py-1 text-xl text-gray-600 disabled:opacity-40">×</button>
        </div>

        <div className="grid gap-6 overflow-y-auto p-5 md:grid-cols-[1.4fr_1fr]">
          <div className="min-w-0">
            <div className="flex min-h-64 items-center justify-center rounded-xl bg-[#172033] p-4">
              {image ? (
                <canvas
                  ref={canvasRef} aria-label="Adjusted image preview. Drag to reposition the crop." tabIndex={0}
                  className="max-h-[48vh] max-w-full touch-none cursor-grab bg-white outline-offset-4 active:cursor-grabbing"
                  style={{ aspectRatio: `${output.width} / ${output.height}` }}
                  onPointerDown={(event) => {
                    if (busy) return;
                    event.preventDefault(); event.currentTarget.focus();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    dragRef.current = { x: event.clientX, y: event.clientY };
                  }}
                  onPointerMove={(event) => {
                    if (!dragRef.current || !sourceSize || busy) return;
                    const deltaX = event.clientX - dragRef.current.x;
                    const deltaY = event.clientY - dragRef.current.y;
                    dragRef.current = { x: event.clientX, y: event.clientY };
                    const bounds = event.currentTarget.getBoundingClientRect();
                    setAdjustments((current) => ({ ...current, ...moveCrop(sourceSize, current, deltaX, deltaY, bounds) }));
                  }}
                  onPointerUp={() => { dragRef.current = null; }}
                  onPointerCancel={() => { dragRef.current = null; }}
                  onLostPointerCapture={() => { dragRef.current = null; }}
                />
              ) : <p className="text-sm text-white" role="status">{error ? "Preview unavailable" : "Loading image..."}</p>}
            </div>
            <p className="mt-3 text-xs text-gray-500">Drag the preview or use the position sliders. Zoom in to crop more closely.</p>
            {sourceSize && file && <p className="mt-2 text-xs text-gray-500">Original: {sourceSize.width} × {sourceSize.height} px · {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
            <p className="mt-2 text-sm font-semibold text-[#232f3e]">Output: {output.width} × {output.height} px</p>
            {file?.type === "image/gif" && <p className="mt-2 text-xs text-amber-700">Animated images are exported as a single still frame.</p>}
          </div>

          <fieldset disabled={!image || busy} className="min-w-0 space-y-4 disabled:opacity-60">
            <label className="block text-sm font-medium text-gray-700">Crop ratio
              <select value={preset} onChange={(event) => changeAspect(event.target.value)} className={`${controlClass} mt-1`}>
                {PRESETS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            {preset === "custom" && <div className="grid grid-cols-2 gap-3">
              {(["width", "height"] as const).map((field) => <label key={field} className="text-xs text-gray-600">Ratio {field}
                <input type="number" min="1" max="100" value={customRatio[field]} className={`${controlClass} mt-1`}
                  onChange={(event) => {
                    const ratio = { ...customRatio, [field]: Math.min(100, Math.max(1, Number(event.target.value) || 1)) };
                    setCustomRatio(ratio); changeAspect("custom", ratio);
                  }} />
              </label>)}
            </div>}
            <Slider label="Zoom" value={adjustments.zoom} min={1} max={5} step={0.01} display={`${adjustments.zoom.toFixed(2)}×`} onChange={(zoom) => setAdjustments((current) => ({ ...current, zoom }))} />
            <Slider label="Horizontal position" value={adjustments.positionX} min={0} max={1} step={0.01} display={`${Math.round(adjustments.positionX * 100)}%`} onChange={(positionX) => setAdjustments((current) => ({ ...current, positionX }))} />
            <Slider label="Vertical position" value={adjustments.positionY} min={0} max={1} step={0.01} display={`${Math.round(adjustments.positionY * 100)}%`} onChange={(positionY) => setAdjustments((current) => ({ ...current, positionY }))} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={rotate} className="rounded border border-gray-300 px-3 py-2 text-xs">Rotate 90°</button>
              <button type="button" aria-pressed={adjustments.flipHorizontal} onClick={() => setAdjustments((current) => ({ ...current, flipHorizontal: !current.flipHorizontal }))} className="rounded border border-gray-300 px-3 py-2 text-xs">Flip horizontal</button>
              <button type="button" onClick={reset} className="rounded border border-gray-300 px-3 py-2 text-xs">Reset</button>
            </div>
            <Slider label="Brightness" value={adjustments.brightness} min={50} max={150} step={1} display={`${adjustments.brightness}%`} onChange={(brightness) => setAdjustments((current) => ({ ...current, brightness }))} />
            <Slider label="Contrast" value={adjustments.contrast} min={50} max={150} step={1} display={`${adjustments.contrast}%`} onChange={(contrast) => setAdjustments((current) => ({ ...current, contrast }))} />
            <div className="grid grid-cols-2 gap-3">
              {(["width", "height"] as const).map((field) => <label key={field} className="text-sm font-medium capitalize text-gray-700">{field} (px)
                <input type="number" min={1} max={MAX_IMAGE_DIMENSION} value={output[field]} className={`${controlClass} mt-1`}
                  onChange={(event) => setOutput((current) => resizeImageSize(current, field, Number(event.target.value), lockAspect))} />
              </label>)}
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-600"><input type="checkbox" checked={lockAspect} onChange={(event) => setLockAspect(event.target.checked)} /> Lock output aspect ratio</label>
            <p className="text-xs text-gray-500">Maximum {MAX_IMAGE_DIMENSION} px per side. Unlocking the ratio stretches the output.</p>
            <label className="block text-sm font-medium text-gray-700">File format
              <select value={format} onChange={(event) => setFormat(event.target.value as ImageExportFormat)} className={`${controlClass} mt-1`}>
                <option value="image/jpeg">JPEG (smaller file, white background)</option>
                <option value="image/png">PNG (preserve transparency)</option>
                <option value="image/webp">WebP (smaller file, transparency)</option>
              </select>
            </label>
            {format !== "image/png" && <Slider label="Quality" value={quality} min={0.1} max={1} step={0.01} display={`${Math.round(quality * 100)}%`} onChange={setQuality} />}
          </fieldset>
        </div>
        <div className="border-t border-gray-200 px-5 py-4">
          {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3">
            {error && !image && typeof source === "string" && <button type="button" onClick={() => { setError(""); setLoadAttempt((attempt) => attempt + 1); }} className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-600">Retry loading</button>}
            <button type="button" onClick={onCancel} disabled={busy} className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-600 disabled:opacity-50">Cancel</button>
            <button type="button" onClick={confirm} disabled={!image || busy} className="rounded bg-[#e47911] px-5 py-2 text-sm font-semibold text-white hover:bg-[#c45500] disabled:opacity-50">{busy ? "Saving image..." : "Use adjusted image"}</button>
          </div>
        </div>
      </div>
    </div>, document.body,
  );
}

function Slider({ label, value, min, max, step, display, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  display: string; onChange: (value: number) => void;
}) {
  return <label className="block text-xs text-gray-600">
    <span className="flex justify-between gap-2"><span>{label}</span><span>{display}</span></span>
    <input className="mt-1 w-full accent-[#e47911]" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
  </label>;
}