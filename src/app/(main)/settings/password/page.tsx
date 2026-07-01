"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Input, Button } from "@/components/ui";
import { ArrowLeft, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ChangePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);

    // NOTE: Supabase's updateUser({ password }) requires the user to have
    // logged in recently. If the session is too old, this will fail with
    // a "re-authentication needed" error. In that case, the user should
    // log out and use the "Forgot Password" flow instead.
    // For production, consider using supabase.auth.signInWithPassword()
    // with the current password first to re-authenticate.
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">Change Password</h1>

      <form onSubmit={handleSave}>
        <Card className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Password updated successfully!</span>
            </div>
          )}

          <Input
            label="New Password"
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            icon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button type="button" onClick={() => setShowNew(!showNew)} className="cursor-pointer">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            required
          />

          <Input
            label="Confirm New Password"
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            icon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="cursor-pointer">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            required
          />

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => router.back()}>Cancel</Button>
            <Button variant="primary" className="flex-1" type="submit" loading={saving}>
              Update Password
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
