const isSafeRedirect = (value: string) =>
  value.startsWith("/") && !value.startsWith("//");

export function safeRedirect(value?: unknown, fallback: string = "/"): string {
  const safeFallback = isSafeRedirect(fallback) ? fallback : "/";

  if (typeof value === "string" && isSafeRedirect(value)) {
    return value;
  }

  return safeFallback;
}

export function resolveAuthRedirectUrls(
  redirectParam?: unknown,
  fallbackParam?: unknown,
): {
  redirectUrl: string | undefined;
  fallbackRedirectUrl: string;
  crossRedirectUrl: string;
} {
  const fallbackRedirectUrl = safeRedirect(fallbackParam, "/");
  const redirectUrl =
    typeof redirectParam === "string" && isSafeRedirect(redirectParam)
      ? redirectParam
      : undefined;
  const crossRedirectUrl = safeRedirect(redirectParam, fallbackRedirectUrl);

  return {
    redirectUrl,
    fallbackRedirectUrl,
    crossRedirectUrl,
  };
}
