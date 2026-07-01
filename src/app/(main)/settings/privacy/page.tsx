"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/components/ui";
import { ArrowLeft, Shield, Eye, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";

export default function PrivacyPage() {
  const router = useRouter();
  const supabase = createClient();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [locationPrivacy, setLocationPrivacy] = useState<"Everyone" | "Followers" | "Nobody" | null>(null);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("location_privacy")
          .eq("id", user.id)
          .single();
        setLocationPrivacy((data?.location_privacy as any) || "Everyone");
      }
    }
    load();
  }, [supabase]);

  const handlePrivacyChange = async (val: "Everyone" | "Followers" | "Nobody") => {
    setLocationPrivacy(val);
    setSavingPrivacy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({ location_privacy: val })
          .eq("id", user.id);
        if (error) throw error;
      }
    } catch (e) {
      console.error("Failed to save location privacy", e);
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    setDeleteError(null);

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setDeleteError("No active session. Please log in again.");
        setDeleting(false);
        return;
      }

      // Call the server-side API route (uses service role key securely)
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      const result = await res.json();

      if (!res.ok) {
        setDeleteError(result.error || "Failed to delete account");
        setDeleting(false);
        return;
      }

      // Sign out and redirect
      await signOut();
      router.push("/login");
    } catch (err: any) {
      setDeleteError(err?.message || "Something went wrong");
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">Privacy & Security</h1>

      <div className="space-y-4">
        {/* Location Privacy Settings */}
        <Card padding="md" className="flex flex-col gap-3 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-brand-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">Location Privacy Settings</p>
              <p className="text-xs text-text-muted">Control who can see your live location on the Radar map</p>
            </div>
            {savingPrivacy && (
              <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
            )}
          </div>
          
          {locationPrivacy === null ? (
            <div className="h-9 w-full bg-surface-hover animate-pulse rounded-xl" />
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["Everyone", "Followers", "Nobody"] as const).map((opt) => (
                <button
                  key={opt}
                  disabled={savingPrivacy}
                  onClick={() => handlePrivacyChange(opt)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                    locationPrivacy === opt
                      ? "bg-brand-500/10 border-brand-500 text-brand-400 font-bold"
                      : "bg-surface-raised border-border-subtle text-text-secondary hover:bg-surface-hover"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Existing Static Cards */}
        <Card padding="md" className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-text-muted shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">Two-Factor Authentication</p>
            <p className="text-xs text-text-muted">Not enabled — coming soon</p>
          </div>
        </Card>

        <div className="border-t border-border-subtle pt-6 mt-6">
          <h3 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </h3>
          <Card padding="md">
            <p className="text-sm text-text-primary font-medium mb-1">Delete Account</p>
            <p className="text-xs text-text-muted mb-4">Permanently delete your account and all data. This cannot be undone.</p>
            {deleteError && (
              <p className="text-xs text-red-400 mb-3">{deleteError}</p>
            )}
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="h-4 w-4" />}
              loading={deleting}
              onClick={handleDeleteAccount}
            >
              {confirmDelete ? "Are you sure? Click again to confirm" : "Delete Account"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
