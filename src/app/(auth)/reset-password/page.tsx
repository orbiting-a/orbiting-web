"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold text-white">Set New Password</h1>
          <p className="text-sm text-[#a5a1ac] mt-1">Enter your new password below</p>
        </div>

        {success ? (
          <div className="flex flex-col items-center text-center p-6 bg-surface-raised rounded-2xl border border-border-subtle">
            <CheckCircle2 className="h-10 w-10 text-green-400 mb-3" />
            <h3 className="font-bold text-text-primary mb-1">Password updated!</h3>
            <p className="text-sm text-text-muted">Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              placeholder="New password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button onClick={() => setShowPassword(!showPassword)} type="button">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              required
            />

            <Input
              placeholder="Confirm password"
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              icon={<Lock className="h-4 w-4" />}
              required
            />

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading} disabled={!password.trim() || !confirm.trim()}>
              Update Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
