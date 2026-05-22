/**
 * Canonical app URL for Supabase magic-link redirects.
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://your-app.vercel.app).
 * Supabase must also allow this URL in Auth → URL configuration → Redirect URLs.
 */
export function getSiteUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return null;
}

export function getAuthCallbackUrl(): string {
  const site = getSiteUrl();
  if (!site) {
    throw new Error(
      "Missing NEXT_PUBLIC_SITE_URL (production) or browser origin for auth redirect.",
    );
  }
  return `${site}/auth/callback`;
}

/** Origin for server-side redirects (Vercel/proxy-aware). */
export function getRequestOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    const proto = forwardedProto?.split(",")[0]?.trim() ?? "https";
    return `${proto}://${forwardedHost.split(",")[0]?.trim()}`;
  }
  return new URL(request.url).origin;
}
