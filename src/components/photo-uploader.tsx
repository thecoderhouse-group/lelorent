"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageSquare, Plus, Star, Trash, WarningCircle } from "@phosphor-icons/react/ssr";

import {
  MAX_PHOTOS,
  processPhoto,
  type ProcessedPhoto,
} from "@/lib/image-pipeline";
import { cn } from "@/lib/utils";

export type StagedPhoto = ProcessedPhoto & {
  id: string;
  name: string;
  previewUrl: string;
};

/**
 * Stages up to 4 photos in the browser, compressed but not yet uploaded.
 *
 * Nothing is sent until the form is submitted, because the storage path
 * depends on a listing id that does not exist until then. Compressing here
 * rather than at submit means the slow part (a few seconds per photo on a
 * mid-range phone) happens while the user is still filling in fields.
 */
export function PhotoUploader({
  photos,
  onChange,
}: {
  photos: StagedPhoto[];
  onChange: (next: StagedPhoto[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Object URLs are a manual resource. Without this the browser holds every
  // full-size preview for the life of the tab.
  useEffect(() => {
    return () => photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount only
  }, []);

  const addFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      setError(null);

      const room = MAX_PHOTOS - photos.length;
      if (room <= 0) {
        setError(`You can add up to ${MAX_PHOTOS} photos.`);
        return;
      }

      const chosen = Array.from(files).slice(0, room);
      if (files.length > room) {
        setError(`Only the first ${room} of those were added. Limit is ${MAX_PHOTOS}.`);
      }

      setBusy(true);
      const staged: StagedPhoto[] = [];

      for (const file of chosen) {
        try {
          const processed = await processPhoto(file);
          staged.push({
            ...processed,
            id: crypto.randomUUID(),
            name: file.name,
            previewUrl: URL.createObjectURL(processed.card),
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : `Could not read ${file.name}.`);
        }
      }

      setBusy(false);
      if (staged.length) onChange([...photos, ...staged]);
    },
    [photos, onChange],
  );

  function remove(id: string) {
    const target = photos.find((p) => p.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(photos.filter((p) => p.id !== id));
  }

  function makeCover(id: string) {
    const target = photos.find((p) => p.id === id);
    if (!target) return;
    onChange([target, ...photos.filter((p) => p.id !== id)]);
  }

  const totalKb = Math.round(
    photos.reduce((sum, p) => sum + p.card.size + p.full.size, 0) / 1024,
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {photos.map((photo, i) => (
          <figure
            key={photo.id}
            className="group relative overflow-hidden rounded-md border border-border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
            <img
              src={photo.previewUrl}
              alt={photo.name}
              className="aspect-[4/3] w-full object-cover"
            />

            {i === 0 && (
              <figcaption className="sign-label absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-1 text-primary-foreground">
                Cover
              </figcaption>
            )}

            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1">
              {i !== 0 && (
                <button
                  type="button"
                  onClick={() => makeCover(photo.id)}
                  aria-label={`Make ${photo.name} the cover photo`}
                  className="inline-flex size-8 items-center justify-center rounded-md bg-plate/80 text-plate-foreground backdrop-blur transition-colors hover:bg-plate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Star size={14} aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(photo.id)}
                aria-label={`Remove ${photo.name}`}
                className="inline-flex size-8 items-center justify-center rounded-md bg-plate/80 text-plate-foreground backdrop-blur transition-colors hover:bg-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Trash size={14} aria-hidden="true" />
              </button>
            </div>
          </figure>
        ))}

        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className={cn(
              "flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-border text-muted-foreground transition-colors",
              "hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {busy ? (
              <>
                <ImageSquare size={20} className="animate-pulse" aria-hidden="true" />
                <span className="text-xs font-medium">Compressing…</span>
              </>
            ) : (
              <>
                <Plus size={20} aria-hidden="true" />
                <span className="text-xs font-medium">Add photo</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="sr-only"
        onChange={(e) => {
          void addFiles(e.target.files);
          // Reset so picking the same file twice still fires a change event.
          e.target.value = "";
        }}
      />

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {photos.length}/{MAX_PHOTOS} photos
        {photos.length > 0 && ` · ${totalKb} KB after compression`}
        {photos.length === 0 && " · listings with photos get far more enquiries"}
      </p>

      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-xs text-destructive">
          <WarningCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
