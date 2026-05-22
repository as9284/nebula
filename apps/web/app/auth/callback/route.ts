import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getRequestOrigin } from "@/lib/auth-redirect";

function authErrorRedirect(origin: string, reason?: string) {
  const url = new URL("/", origin);
  url.searchParams.set("auth", "error");
  if (reason) url.searchParams.set("auth_reason", reason);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";
  const origin = getRequestOrigin(request);
  const redirectTo = new URL(next, origin);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return authErrorRedirect(origin, "config");
  }

  let response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        response = NextResponse.redirect(redirectTo);
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email" | "magiclink" | "signup" | "recovery" | "invite",
    });
    if (!error) return response;
    return authErrorRedirect(origin, "verify");
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
    return authErrorRedirect(origin, "exchange");
  }

  return authErrorRedirect(origin, "missing");
}
