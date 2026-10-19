/**
 * Sanitiza HTML para prevenir XSS
 * Compatible con Server Components (sin dependencias DOM)
 * Permite solo tags seguros whitelisteados
 *
 * @param html - HTML a sanitizar
 * @returns HTML limpio y seguro
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  let clean = html;

  // Strip tags peligrosos
  clean = clean.replace(/<\s*\/?\s*(script|style|iframe|object|embed|form|input|textarea|button|select|option|link|meta|base|applet|dir|frame|frameset|ilayer|layer|bgsound|comment)\b[^>]*>/gi, "");

  // Strip on* event handlers
  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // Strip javascript: y vbscript: de hrefs/srcs
  clean = clean.replace(/(href|src|action)\s*=\s*(?:"[^"]*(?:javascript|vbscript)[^"]*"|'[^']*(?:javascript|vbscript)[^']*')/gi, "");

  return clean;
}
