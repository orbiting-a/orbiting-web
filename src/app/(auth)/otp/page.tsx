"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";

function OTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const phone = searchParams.get("phone") || "";
  const isMock = searchParams.get("mock") === "true";

  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (otp.length !== 6) {
      setError("Please enter a 6-digit OTP code.");
      return;
    }

    setLoading(true);

    try {
      if (isMock) {
        // Mock Verification
        if (otp === "123456" || otp.length === 6) {
          setSuccess("OTP Verified successfully (Demo Mode)!");
          setTimeout(() => {
            router.push(`/update-profile?phone=${encodeURIComponent(phone)}`);
          }, 1000);
        } else {
          setError("Incorrect OTP code. Enter 123456 to bypass in demo mode.");
        }
      } else {
        // Real Supabase verification
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          phone,
          token: otp,
          type: "sms",
        });

        if (verifyError) {
          setError(verifyError.message);
        } else {
          setSuccess("OTP Verified successfully!");
          setTimeout(() => {
            // Check if profile exists, otherwise redirect to update profile
            router.push(`/update-profile?phone=${encodeURIComponent(phone)}`);
          }, 1000);
        }
      }
    } catch (err: any) {
      setError(err?.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setError(null);
    setSuccess("OTP resent successfully!");
    setTimer(30);

    if (!isMock) {
      try {
        await supabase.auth.signInWithOtp({ phone });
      } catch (err) {
        console.error("Resend error:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between">
      {/* Header Branding */}
      <div className="flex-1 flex flex-col items-center justify-center py-12">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-brand-300 to-brand-500 flex items-center justify-center shadow-lg shadow-brand-400/20 mb-4">
          <span className="text-white font-bold text-3xl">O</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Orbiting</h1>
      </div>

      {/* Input Form Box */}
      <div className="bg-[#20222f] border-t border-[#2e303d] rounded-t-[32px] px-6 pt-8 pb-10 w-full max-w-md mx-auto shadow-2xl relative">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[#a5a1ac] mb-6 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <h2 className="text-xl font-bold mb-2">Enter OTP</h2>
        <p className="text-xs text-[#a5a1ac] mb-6">
          A 6 digit code has been sent to your mobile number <strong className="text-white">{phone}</strong>
          {isMock && <span className="block text-brand-300 mt-1">(Demo Mode: Enter any 6 digit code e.g. 123456)</span>}
        </p>

        <form onSubmit={handleVerify} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-4">
            <Input
              type="text"
              placeholder="0 0 0 0 0 0"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="text-center text-2xl tracking-[0.5em] font-mono"
              maxLength={6}
              required
            />

            <div className="text-xs text-[#a5a1ac] flex justify-between items-center px-1">
              {timer > 0 ? (
                <span>Resend OTP in {timer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-brand-400 hover:text-brand-300 font-semibold cursor-pointer"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full text-black bg-brand-400 hover:bg-[#f9ff54]" disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function OTPPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <OTPForm />
    </Suspense>
  );
}
