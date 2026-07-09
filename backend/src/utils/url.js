export function normalizeWebsiteUrl(input) {
  const parsed = new URL(input.trim());

  parsed.hash = "";
  parsed.hostname = parsed.hostname.toLowerCase();

  if (
    (parsed.protocol === "https:" && parsed.port === "443") ||
    (parsed.protocol === "http:" && parsed.port === "80")
  ) {
    parsed.port = "";
  }

  if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  }

  return parsed.toString();
}
