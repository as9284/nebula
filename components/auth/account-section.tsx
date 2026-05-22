"use client";

import { useCallback, useState } from "react";
import { User, Cloud, CloudOff, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import {
  applyRemoteAndResolveConflict,
  pushLocalAndResolveConflict,
} from "@/lib/cloud-sync";
import { useSyncStore } from "@/stores/use-sync-store";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function AccountSection() {
  const { user, loading, configured, signOut } = useAuth();
  const cloudSyncEnabled = useSyncStore((s) => s.cloudSyncEnabled);
  const setCloudSyncEnabled = useSyncStore((s) => s.setCloudSyncEnabled);
  const lastPushedAt = useSyncStore((s) => s.lastPushedAt);
  const isSyncing = useSyncStore((s) => s.isSyncing);
  const pendingSync = useSyncStore((s) => s.pendingSync);
  const lastError = useSyncStore((s) => s.lastError);
  const conflictRemoteAt = useSyncStore((s) => s.conflictRemoteAt);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const sendMagicLink = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus("");
    try {
      const supabase = createClient();
      const redirectTo = getAuthCallbackUrl();
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setStatus("Check your email for the sign-in link.");
    } catch (e) {
      setStatus((e as Error).message);
    }
  }, [email]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setStatus("Signed out.");
  }, [signOut]);

  const resolveKeepLocal = useCallback(async () => {
    if (!user) return;
    await pushLocalAndResolveConflict(user.id);
    setStatus("Uploaded local data to cloud.");
  }, [user]);

  const resolveUseCloud = useCallback(async () => {
    if (!user) return;
    await applyRemoteAndResolveConflict(user.id);
    setStatus("Restored data from cloud.");
  }, [user]);

  if (!configured) {
    return (
      <div className="mb-8 last:mb-0">
        <SectionHeader />
        <p className="text-xs text-text-muted">
          Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable
          cloud sync.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8 last:mb-0">
      <SectionHeader />

      {loading ? (
        <p className="text-xs text-text-muted flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" />
          Checking session…
        </p>
      ) : user ? (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary truncate">{user.email}</p>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-text-secondary">Cloud sync</span>
            <Checkbox
              checked={cloudSyncEnabled}
              onChange={setCloudSyncEnabled}
              ariaLabel="Cloud sync"
            />
          </div>

          <SyncStatusLine
            isSyncing={isSyncing}
            pendingSync={pendingSync}
            lastPushedAt={lastPushedAt}
            lastError={lastError}
            enabled={cloudSyncEnabled}
          />

          {conflictRemoteAt && (
            <div className="rounded-xl border border-border bg-bg p-3 space-y-2">
              <p className="text-xs text-text-secondary">
                Cloud data ({formatRelativeTime(conflictRemoteAt)}) is newer than
                your last sync. Choose one:
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void resolveUseCloud()}
                  className="px-3 py-1.5 rounded-lg text-xs bg-surface-elevated hover:bg-surface-hover"
                >
                  Use cloud copy
                </button>
                <button
                  type="button"
                  onClick={() => void resolveKeepLocal()}
                  className="px-3 py-1.5 rounded-lg text-xs bg-surface-elevated hover:bg-surface-hover"
                >
                  Keep local & upload
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="text-sm text-text-secondary hover:text-text-primary"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void sendMagicLink();
            }}
          />
          <button
            type="button"
            onClick={() => void sendMagicLink()}
            disabled={!email.trim()}
            className={cn(
              "w-full py-2.5 rounded-xl text-sm font-medium transition-colors",
              email.trim()
                ? "bg-text-primary text-bg hover:opacity-90"
                : "bg-surface-hover text-text-muted cursor-not-allowed",
            )}
          >
            Send magic link
          </button>
          <p className="text-xs text-text-muted">
            New users are created automatically on first sign-in.
          </p>
        </div>
      )}

      {status && (
        <p className="mt-3 text-xs text-text-secondary bg-bg rounded-xl px-3 py-2 border border-border">
          {status}
        </p>
      )}
    </div>
  );
}

function SectionHeader() {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-hover">
        <User size={14} className="text-text-secondary" />
      </div>
      <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
        Account
      </h2>
    </div>
  );
}

function SyncStatusLine({
  isSyncing,
  pendingSync,
  lastPushedAt,
  lastError,
  enabled,
}: {
  isSyncing: boolean;
  pendingSync: boolean;
  lastPushedAt: string | null;
  lastError: string | null;
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <p className="text-xs text-text-muted flex items-center gap-1.5">
        <CloudOff size={12} />
        Sync paused
      </p>
    );
  }
  if (lastError) {
    return (
      <p className="text-xs text-danger flex items-center gap-1.5">
        <CloudOff size={12} />
        Sync error: {lastError}
      </p>
    );
  }
  if (isSyncing) {
    return (
      <p className="text-xs text-text-muted flex items-center gap-1.5">
        <Loader2 size={12} className="animate-spin" />
        Syncing…
      </p>
    );
  }
  if (pendingSync) {
    return (
      <p className="text-xs text-text-muted flex items-center gap-1.5">
        <Cloud size={12} />
        Sync pending…
      </p>
    );
  }
  return (
    <p className="text-xs text-text-muted flex items-center gap-1.5">
      <Cloud size={12} />
      Synced {formatRelativeTime(lastPushedAt)}
    </p>
  );
}
