import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { env } from "./env";
import { HttpError } from "./http-error";

/** Local folder for uploads when there is no Blob token (development only). Tests set UPLOAD_DIR. */
export const localUploadDir = () => process.env.UPLOAD_DIR || path.resolve(process.cwd(), "uploads");
export const LOCAL_UPLOAD_PATH = "/api/v1/uploads";
export type UploadFolder = "quotes" | "products";
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // Vercel functions accept at most 4.5 MB per request

const TYPES = {
  "image/jpeg": { ext: "jpg", magic: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { ext: "png", magic: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": {
    ext: "webp",
    magic: (b: Buffer) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP",
  },
} as const;
export const PHOTO_TYPES = Object.keys(TYPES) as (keyof typeof TYPES)[];

/** Detects the real image type from the file bytes (not from the header the browser sends). */
export function detectImage(buf: Buffer) {
  for (const [type, t] of Object.entries(TYPES)) if (buf.length > 12 && t.magic(buf)) return { type, ext: t.ext };
  return null;
}

/** Saves a photo to Vercel Blob (or the local folder in development). Returns its public URL. */
export async function savePhoto(folder: UploadFolder, buf: Buffer): Promise<string> {
  const image = detectImage(buf);
  if (!image) throw new HttpError(415, "Only JPG, PNG or WebP photos are allowed");
  const name = `${folder}/${new Date().toISOString().slice(0, 10)}-${randomUUID()}.${image.ext}`;

  // Old Blob connection: BLOB_READ_WRITE_TOKEN. New one: BLOB_STORE_ID + Vercel's own OIDC sign-in.
  const token = env().BLOB_READ_WRITE_TOKEN;
  if (token || env().BLOB_STORE_ID) {
    const blob = await put(name, buf, {
      access: "public",
      contentType: image.type,
      addRandomSuffix: false,
      ...(token ? { token } : {}),
    });
    return blob.url;
  }
  if (env().NODE_ENV === "production") throw new HttpError(503, "Photo upload is not configured");
  const file = path.join(localUploadDir(), name);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, buf);
  return `${env().WEB_URL.replace(/\/$/, "")}${LOCAL_UPLOAD_PATH}/${name}`;
}

/** True if the URL is a photo that we stored (so a form cannot point to any other site). */
export function isOurPhoto(url: string, folder: UploadFolder) {
  const local = `${env().WEB_URL.replace(/\/$/, "")}${LOCAL_UPLOAD_PATH}/${folder}/`;
  const file = /^\d{4}-\d{2}-\d{2}-[0-9a-f-]{36}\.(jpg|png|webp)$/;
  if (url.startsWith(local)) return file.test(url.slice(local.length));
  const m = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/([a-z]+)\/(.+)$/.exec(url);
  return !!m && m[1] === folder && file.test(m[2]);
}
