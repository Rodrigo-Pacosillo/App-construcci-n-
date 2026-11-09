// src/lib/cloudinary-img.ts
type Opts = { w?: number; ar?: string };

/**
 * Inserta transformaciones en una secure_url de Cloudinary.
 * Si la URL no es de Cloudinary (p. ej. portadas locales /img/... del seed), la devuelve igual.
 */
export function cloudSrc(secureUrl: string, opts: Opts = {}): string {
  const t = ["f_auto", "q_auto:good"];
  if (opts.w) t.push(`w_${opts.w}`);
  if (opts.ar) t.push(`ar_${opts.ar}`, "c_fill", "g_auto");
  else t.push("c_limit");
  const [base, rest] = secureUrl.split("/image/upload/");
  return rest ? `${base}/image/upload/${t.join(",")}/${rest}` : secureUrl;
}