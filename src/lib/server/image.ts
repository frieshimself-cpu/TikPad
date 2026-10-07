/** Shared validation for uploaded coin images. */
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "../brand";

export interface UploadedImage {
  bytes: Uint8Array;
  type: string;
  name: string;
}

const MAGIC: [string, (b: Uint8Array) => boolean][] = [
  ["image/png", (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47],
  ["image/jpeg", (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  ["image/gif", (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38],
  ["image/webp", (b) => b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50],
];

/** Returns the image or an error message. The type is taken from the bytes, not the client. */
export async function readImage(form: FormData, field = "image"): Promise<UploadedImage | string> {
  const file = form.get(field);
  if (!(file instanceof File) || file.size === 0) return "A coin image is required.";
  if (file.size > MAX_IMAGE_BYTES) return `Image must be under ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB.`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = MAGIC.find(([, test]) => bytes.length > 12 && test(bytes))?.[0];
  if (!type || !(IMAGE_TYPES as readonly string[]).includes(type)) return "Image must be a PNG, JPEG, GIF or WebP file.";
  return { bytes, type, name: file.name || `image.${type.slice(6)}` };
}
