"use client";

import { useState } from "react";
import { api, getImageUrl } from "@/lib/api";
import { useToast } from "@/app/components/ui/Toaster";
import ImageUploadInput from "./ImageUploadInput";

interface ProductImagesInputProps {
  value: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}

export default function ProductImagesInput({
  value,
  onChange,
  disabled = false,
  onBusyChange,
}: ProductImagesInputProps) {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const isDisabled = disabled || busy;

  const setUploading = (uploading: boolean) => {
    setBusy(uploading);
    onBusyChange?.(uploading);
  };

  const uploadImage = async (file: File, replaceIndex?: number) => {
    try {
      setUploading(true);
      const data = new FormData();
      data.append("image", file);
      const result = await api.upload.image(data);
      onChange(replaceIndex === undefined
        ? [...value, result.url]
        : value.map((image, index) => index === replaceIndex ? result.url : image));
      toast(replaceIndex === undefined ? "Product image added" : "Product image updated", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Image upload failed", "error");
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const addImageUrl = () => {
    const url = imageUrl.trim();
    if (!url) return;
    if (value.includes(url)) {
      toast("This image is already in the gallery", "error");
      return;
    }
    onChange([...value, url]);
    setImageUrl("");
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-xs font-medium text-gray-600">
          <span className="mb-1.5 block">Add an image URL</span>
          <input
            type="text"
            value={imageUrl}
            disabled={isDisabled}
            onChange={(event) => setImageUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addImageUrl();
              }
            }}
            placeholder="https://example.com/product-image.jpg"
            className="w-full rounded border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-[#e47911] focus:outline-none disabled:bg-gray-100"
          />
        </label>
        <button
          type="button"
          disabled={isDisabled || !imageUrl.trim()}
          onClick={addImageUrl}
          className="rounded border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add URL
        </button>
        <ImageUploadInput
          disabled={isDisabled}
          onReady={(file) => uploadImage(file)}
          label={busy ? "Uploading..." : "+ Upload & Adjust Image"}
        />
      </div>

      {value.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          No additional images yet. Add images to create a product gallery.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((image, index) => (
            <div key={`${image}-${index}`} className="overflow-hidden rounded-md border border-gray-200 bg-white">
              <div className="aspect-[4/3] bg-gray-100">
                <img
                  src={getImageUrl(image)}
                  alt={`Product gallery ${index + 1}`}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="space-y-3 p-3">
                <p className="truncate text-xs text-gray-500" title={image}>Image {index + 1}</p>
                <ImageUploadInput
                  existingImage={getImageUrl(image)}
                  disabled={isDisabled}
                  onReady={(file) => uploadImage(file, index)}
                  label="Replace"
                />
                <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-2">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      aria-label={`Move image ${index + 1} earlier`}
                      disabled={isDisabled || index === 0}
                      onClick={() => moveImage(index, -1)}
                      className="rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      aria-label={`Move image ${index + 1} later`}
                      disabled={isDisabled || index === value.length - 1}
                      onClick={() => moveImage(index, 1)}
                      className="rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      →
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
                    className="text-xs font-medium text-red-600 hover:underline disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
