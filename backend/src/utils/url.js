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

  if (parsed.hostname.endsWith("target.com")) {
    const preselect = parsed.searchParams.get("preselect");

    if (/^\d+$/.test(preselect || "")) {
      parsed.pathname = `/p/-/A-${preselect}`;
      parsed.search = "";
    }
  }

  return parsed.toString();
}
