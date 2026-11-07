"use client";

import { useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CATEGORY_TYPES, EIRCODE_REGEX, MAX_QUOTE_PHOTOS, type CategoryType } from "@bestdoors/shared";
import { Link } from "@/i18n/navigation";

type Props = { product: { id: string; name: string; type: CategoryType } | null };
type Photo = { url: string; preview: string };

const MAX_SIDE = 2000; // px; keeps phone photos well under the 4 MB upload limit

/** Makes a big photo smaller (JPEG) in the browser. Falls back to the original file. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024 && file.type !== "image/heic") return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/jpeg", 0.85),
    );
  } catch {
    return file; // the browser cannot read it (e.g. HEIC in Chrome): the server decides
  }
}

class UploadError extends Error {
  constructor(readonly status: number) {
    super(`Upload failed: ${status}`);
  }
}

async function uploadPhoto(file: File): Promise<string> {
  const blob = await shrink(file);
  const res = await fetch("/api/v1/quotes/photos", {
    method: "POST",
    headers: { "Content-Type": blob.type || "application/octet-stream" },
    body: blob,
  });
  if (!res.ok) throw new UploadError(res.status);
  return ((await res.json()) as { url: string }).url;
}

export function QuoteForm({ product }: Props) {
  const t = useTranslations("Quote");
  const locale = useLocale();
  const fileInput = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eircodeError, setEircodeError] = useState(false);
  const [done, setDone] = useState<{ reference: string; email: string } | null>(null);

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setPhotoError(null);
    const room = MAX_QUOTE_PHOTOS - photos.length;
    const list = Array.from(files).slice(0, room);
    if (files.length > room) setPhotoError(t("tooMany", { max: MAX_QUOTE_PHOTOS }));
    setUploading(true);
    for (const file of list) {
      try {
        const url = await uploadPhoto(file);
        setPhotos((p) => [...p, { url, preview: URL.createObjectURL(file) }]);
      } catch (err) {
        // 415/413 = wrong type or too big; anything else is a problem on our side (or the network).
        const status = err instanceof UploadError ? err.status : 0;
        setPhotoError(t(status === 415 || status === 413 ? "photoError" : "photoUploadFailed"));
      }
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  function removePhoto(url: string) {
    setPhotos((p) => {
      const gone = p.find((x) => x.url === url);
      if (gone) URL.revokeObjectURL(gone.preview);
      return p.filter((x) => x.url !== url);
    });
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const value = (k: string) => String(form.get(k) ?? "").trim();
    const eircode = value("eircode");
    if (eircode && !EIRCODE_REGEX.test(eircode)) {
      setEircodeError(true);
      setError(t("invalid"));
      return;
    }
    setEircodeError(false);
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: value("name"),
          email: value("email"),
          phone: value("phone"),
          doorType: value("doorType"),
          widthMm: value("widthMm") || undefined,
          heightMm: value("heightMm") || undefined,
          eircode,
          message: value("message"),
          photos: photos.map((p) => p.url),
          productId: product?.id,
          locale,
          website: value("website"),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { reference } = (await res.json()) as { reference: string };
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      setDone({ reference, email: value("email") });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(t("error"));
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <section role="status" className="mt-8 rounded-2xl border border-line bg-surface p-8 text-center">
        <span aria-hidden className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">✓</span>
        <h2 className="mt-5 text-2xl font-extrabold tracking-tight">{t("doneTitle")}</h2>
        <p className="mt-3 text-muted">{t("doneText", done)}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn-outline" onClick={() => { setDone(null); setPhotos([]); }}>{t("another")}</button>
          <Link href="/doors" className="btn-primary">{t("browse")}</Link>
        </div>
      </section>
    );
  }

  const busy = sending || uploading;

  return (
    <form onSubmit={submit} className="mt-8 space-y-8" noValidate={false}>
      {product && (
        <p className="rounded-xl border border-line bg-brand-soft px-4 py-3 text-sm font-semibold text-brand">
          {t("about", { name: product.name })}
        </p>
      )}

      <fieldset className="space-y-4 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <legend className="px-1 text-lg font-bold">{t("contact")}</legend>
        <div>
          <label htmlFor="q-name" className="label">{t("name")}</label>
          <input id="q-name" name="name" required minLength={2} maxLength={120} autoComplete="name" className="input" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="q-email" className="label">{t("email")}</label>
            <input id="q-email" name="email" type="email" required maxLength={200} autoComplete="email" className="input" />
          </div>
          <div>
            <label htmlFor="q-phone" className="label">{t("phone")}</label>
            <input id="q-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" className="input" />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <legend className="px-1 text-lg font-bold">{t("door")}</legend>
        <div>
          <label htmlFor="q-type" className="label">{t("doorType")}</label>
          <select id="q-type" name="doorType" required defaultValue={product?.type ?? ""} className="input">
            <option value="" disabled>{t("choose")}</option>
            {CATEGORY_TYPES.map((type) => (
              <option key={type} value={type}>{t(`types.${type}`)}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="q-width" className="label">{t("width")}</label>
              <input id="q-width" name="widthMm" type="number" inputMode="numeric" min={300} max={5000} step={1} className="input" aria-describedby="q-size-hint" />
            </div>
            <div>
              <label htmlFor="q-height" className="label">{t("height")}</label>
              <input id="q-height" name="heightMm" type="number" inputMode="numeric" min={300} max={5000} step={1} className="input" aria-describedby="q-size-hint" />
            </div>
          </div>
          <p id="q-size-hint" className="mt-1.5 text-xs text-muted">{t("sizeHint")}</p>
        </div>
        <div>
          <label htmlFor="q-eircode" className="label">{t("eircode")}</label>
          <input id="q-eircode" name="eircode" maxLength={8} autoComplete="postal-code" className="input uppercase sm:max-w-48"
            aria-invalid={eircodeError} aria-describedby="q-eircode-hint" onChange={() => { setEircodeError(false); setError(null); }} />
          <p id="q-eircode-hint" className={`mt-1.5 text-xs ${eircodeError ? "text-red-700" : "text-muted"}`}>
            {eircodeError ? t("invalidEircode") : t("eircodeHint")}
          </p>
        </div>
        <div>
          <label htmlFor="q-message" className="label">{t("message")}</label>
          <textarea id="q-message" name="message" rows={4} maxLength={5000} placeholder={t("messagePlaceholder")} className="input" />
        </div>

        <div>
          <p className="label" id="q-photos-label">{t("photos")}</p>
          <p className="text-xs text-muted">{t("photosHint", { max: MAX_QUOTE_PHOTOS })}</p>
          {photos.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-3" aria-labelledby="q-photos-label">
              {photos.map((p, i) => (
                <li key={p.url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt="" className="h-24 w-24 rounded-xl border border-line object-cover" />
                  <button type="button" onClick={() => removePhoto(p.url)} aria-label={t("removePhoto", { n: i + 1 })}
                    className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-sm text-white">×</button>
                </li>
              ))}
            </ul>
          )}
          <input ref={fileInput} id="q-photos" type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple className="sr-only"
            onChange={(e) => addPhotos(e.target.files)} disabled={uploading || photos.length >= MAX_QUOTE_PHOTOS} />
          <label htmlFor="q-photos"
            className={`btn-outline mt-3 cursor-pointer ${uploading || photos.length >= MAX_QUOTE_PHOTOS ? "pointer-events-none opacity-50" : ""}`}>
            {uploading ? t("uploading") : t("addPhotos")}
          </label>
          <p role="status" className="mt-1.5 text-sm text-red-700">{photoError}</p>
        </div>
      </fieldset>

      {/* Honeypot for spam bots: hidden from people and screen readers. */}
      <div aria-hidden="true" className="absolute left-[-10000px] h-px w-px overflow-hidden">
        <label htmlFor="q-website">Website</label>
        <input id="q-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={busy} aria-busy={sending} className="btn-primary w-full py-3 sm:w-auto sm:px-10">
          {sending ? t("sending") : t("submit")}
        </button>
        <p className="mt-3 text-xs text-muted">{t("privacy")}</p>
      </div>
    </form>
  );
}
