export function normalizeWebsiteUrl(input) {
  const value = input.trim();
  const parsed = new URL(value);

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
