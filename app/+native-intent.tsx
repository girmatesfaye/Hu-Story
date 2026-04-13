const DEFAULT_ROUTE = "/splash";

function normalizePathname(pathname: string) {
  const trimmed = pathname.trim();
  if (!trimmed) return "/";

  const withoutExpoPrefix = trimmed.replace(/^\/--(?=\/|$)/, "");
  if (!withoutExpoPrefix) return "/";

  return withoutExpoPrefix.startsWith("/")
    ? withoutExpoPrefix
    : `/${withoutExpoPrefix}`;
}

function isReservedExpoRoute(pathname: string) {
  return pathname === "/_sitemap" || pathname.startsWith("/_sitemap/");
}

export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  try {
    if (!path) {
      return DEFAULT_ROUTE;
    }

    const url = new URL(path, "hustory://app.home");
    const normalizedPath = normalizePathname(url.pathname);

    // Development builds can be resumed with expo-development-client URLs
    // or stale internal router URLs. Normalize both into the real boot route.
    if (url.hostname === "expo-development-client") {
      return DEFAULT_ROUTE;
    }

    if (normalizedPath === "/" || isReservedExpoRoute(normalizedPath)) {
      return DEFAULT_ROUTE;
    }

    return `${normalizedPath}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_ROUTE;
  }
}
