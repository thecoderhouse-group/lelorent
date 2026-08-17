import imageCompression from "browser-image-compression";

export type ProcessedPhoto = {
  card: Blob;
  full: Blob;
  blurDataUrl: string;
  width: number;
  height: number;
};

export const MAX_PHOTOS = 4;
/** Reject before compressing. Anything bigger is a mistake, not a photo. */
export const MAX_INPUT_BYTES = 25 * 1024 * 1024;

/**
 * iPhone photos picked from the Files app arrive as HEIC. Chrome and Firefox
 * cannot decode HEIC to a canvas, so compression silently produces nothing.
 * The camera picker usually hands over JPEG, which is exactly why this bug
 * reaches production: it only affects a subset of users and never shows up on
 * a desktop dev machine.
 *
 * heic2any is ~1.4 MB, so it is imported dynamically and only for the files
 * that actually need it.
 */
async function normaliseHeic(file: File): Promise<File> {
  const isHeic =
    /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
  if (!isHeic) return file;

  const { default: heic2any } = await import("heic2any");
  const converted = (await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  })) as Blob;

  return new File([converted], file.name.replace(/\.hei[cf]$/i, ".jpg"), {
    type: "image/jpeg",
  });
}

/** Tiny base64 placeholder shown while the real photo loads. ~400 bytes. */
async function makeBlurDataUrl(source: File): Promise<string> {
  const tiny = await imageCompression(source, {
    maxWidthOrHeight: 20,
    initialQuality: 0.5,
    useWebWorker: true,
    fileType: "image/webp",
  });
  return imageCompression.getDataUrlFromFile(tiny);
}

async function measure(blob: Blob): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(blob);
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return size;
}

/**
 * Produces the two WebP variants plus a blur placeholder.
 *
 * Sizes are fixed at upload rather than transformed on read: the storage
 * bucket only accepts image/webp under 600 KB, and pre-sizing means the CDN
 * serves exactly what the layout needs with no transformation quota burned.
 *
 * browser-image-compression re-encodes through a canvas, which drops EXIF —
 * including the GPS tag that would otherwise publish the flat's exact
 * coordinates alongside a listing that deliberately hides its address.
 */
export async function processPhoto(input: File): Promise<ProcessedPhoto> {
  if (input.size > MAX_INPUT_BYTES) {
    throw new Error(
      `${input.name} is ${(input.size / 1024 / 1024).toFixed(0)} MB. Please use an image under 25 MB.`,
    );
  }

  const file = await normaliseHeic(input);

  const shared = {
    useWebWorker: true,
    fileType: "image/webp" as const,
    // Applies the EXIF rotation before the metadata is discarded, otherwise
    // portrait phone photos upload sideways.
    exifOrientation: undefined as number | undefined,
  };

  const [card, full, blurDataUrl] = await Promise.all([
    imageCompression(file, { ...shared, maxWidthOrHeight: 640, initialQuality: 0.72 }),
    imageCompression(file, { ...shared, maxWidthOrHeight: 1600, initialQuality: 0.8 }),
    makeBlurDataUrl(file),
  ]);

  const { width, height } = await measure(full);

  return { card, full, blurDataUrl, width, height };
}
