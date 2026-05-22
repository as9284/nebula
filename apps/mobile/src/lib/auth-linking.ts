import { useEffect } from "react";
import * as Linking from "expo-linking";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { makeRedirectUri } from "expo-auth-session";
import { createSupabaseClient } from "@/lib/supabase";

export const authRedirectUri = makeRedirectUri({
  scheme: "nebula",
  path: "auth/callback",
});

export async function createSessionFromUrl(url: string): Promise<boolean> {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  const supabase = createSupabaseClient();

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(
      String(params.code),
    );
    if (error) throw error;
    return true;
  }

  const access_token = params.access_token;
  const refresh_token = params.refresh_token;
  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: String(access_token),
      refresh_token: String(refresh_token),
    });
    if (error) throw error;
    return true;
  }

  const token_hash = params.token_hash;
  const type = params.type;
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: String(token_hash),
      type: type as "email" | "magiclink",
    });
    if (error) throw error;
    return true;
  }

  return false;
}

export function useAuthDeepLink(handler: (url: string) => void) {
  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => handler(url));
    void Linking.getInitialURL().then((url) => {
      if (url) handler(url);
    });
    return () => sub.remove();
  }, [handler]);
}
