import { z } from "zod";

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/** "" -> undefined. Crítico en campos @unique: "" choca con el segundo registro vacío. */
export const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    schema
  );

/**
 * Booleano desde FormData sin z.coerce.boolean().
 * z.coerce.boolean() aplica Boolean(value): Boolean("false") === true.
 * NO usarlo para checkboxes ni switches.
 */
export const boolFromForm = z.preprocess(
  (v) => v === true || v === "true" || v === "on",
  z.boolean()
);

/** Solo URLs de imagen de TU cuenta de Cloudinary */
export const cloudinaryImageUrl = z.url().refine((value) => {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      u.hostname === "res.cloudinary.com" &&
      u.pathname.startsWith(`/${CLOUD}/image/upload/`)
    );
  } catch {
    return false;
  }
}, "URL de imagen no válida");

/** URL completa de un video de TikTok (se rechazan enlaces cortos vm./vt.) */
export const tiktokVideoUrl = z
  .url()
  .regex(
    /^https:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/,
    "Pega la URL completa del video (https://www.tiktok.com/@usuario/video/123…)"
  );

/** Acepta Cloudinary o una ruta local del repo (portadas heredadas del seed) */
export const portadaUrl = z.union([
  cloudinaryImageUrl,
  z.string().startsWith("/img/"),
]);

export function getTikTokVideoId(url: string): string | null {
  return url.match(/\/video\/(\d+)/)?.[1] ?? null;
}
