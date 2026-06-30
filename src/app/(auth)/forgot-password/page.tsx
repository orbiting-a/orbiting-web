"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </Link>

        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-sm text-[#a5a1ac] mt-1">Enter your email and we'll send you a reset link</p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center text-center p-6 bg-surface-raised rounded-2xl border border-border-subtle">
            <CheckCircle2 className="h-10 w-10 text-green-400 mb-3" />
            <h3 className="font-bold text-text-primary mb-1">Check your email</h3>
            <p className="text-sm text-text-muted">We sent a password reset link to {email}</p>
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
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="h-4 w-4" />}
              required
            />

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading} disabled={!email.trim()}>
              Send Reset Link
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
