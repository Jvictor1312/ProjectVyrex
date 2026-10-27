const internalOrigin = "https://vyrex.invalid";

export function safeLocalRedirectPath(
  requestedPath: string | null,
  fallback = "/dashboard",
): string {
  if (!requestedPath) return fallback;

  try {
    const destination = new URL(requestedPath, internalOrigin);
    if (destination.origin !== internalOrigin) return fallback;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return fallback;
  }
}
