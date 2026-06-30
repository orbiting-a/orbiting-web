"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import { AlertCircle, ArrowLeft, Check, CheckCircle2 } from "lucide-react";

function UpdateProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const phone = searchParams.get("phone") || "";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Status checks for green indicators
  const isUsernameValid = username.length >= 4;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isNameValid = name.length >= 3;
  const isPasswordValid = password.length >= 8;
  const isConfirmPasswordValid = password === confirmPassword && confirmPassword.length > 0;

  const handleSaveAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isUsernameValid) {
      setError("Username must be at least 4 characters long.");
      return;
    }
    if (!isEmailValid) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!isNameValid) {
      setError("Name must be at least 3 characters long.");
      return;
    }
    if (!isPasswordValid) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (!isConfirmPasswordValid) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Try to create/update profile details in Supabase
      // First, if they completed sign up with OTP, they are already authenticated.
      // We can update the user metadata or insert/upsert the profile row.
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Update auth user data
        const { error: updateError } = await supabase.auth.updateUser({
          email: email,
          password: password,
          data: {
            username,
            full_name: name,
            display_name: name,
            phone_number: phone,
          },
        });

        if (updateError) {
          setError(updateError.message);
          setLoading(false);
          return;
        }

        // Insert into public.profiles table (real db integration)
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            username,
            full_name: name,
            email,
            phone,
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.warn("Could not insert to profiles table (likely schema missing):", profileError.message);
        }
      }

      setSuccess("Profile settings updated successfully!");
      setTimeout(() => {
        router.push("/onboard");
      }, 1000);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between">
      {/* Top Header Branding */}
      <div className="flex-1 flex flex-col items-center justify-center py-8">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-brand-300 to-brand-500 flex items-center justify-center shadow-lg shadow-brand-400/20 mb-3">
          <span className="text-white font-bold text-3xl">O</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Orbiting</h1>
      </div>

      {/* Input Fields Card Container */}
      <div className="bg-[#20222f] border-t border-[#2e303d] rounded-t-[32px] px-6 pt-8 pb-10 w-full max-w-md mx-auto shadow-2xl relative">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[#a5a1ac] mb-6 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <h2 className="text-xl font-bold mb-6">Create Username &amp; Password</h2>

        <form onSubmit={handleSaveAndLogin} className="space-y-4">
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

          {/* Username Input with Verification Check */}
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            rightIcon={isUsernameValid ? <Check className="h-4 w-4 text-green-400" /> : null}
            required
          />

          {/* Email Input */}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            rightIcon={isEmailValid ? <Check className="h-4 w-4 text-green-400" /> : null}
            required
          />

          {/* Full Name Input */}
          <Input
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            rightIcon={isNameValid ? <Check className="h-4 w-4 text-green-400" /> : null}
            required
          />

          {/* Password Input */}
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            rightIcon={isPasswordValid ? <Check className="h-4 w-4 text-green-400" /> : null}
            required
          />

          {/* Confirm Password Input */}
          <Input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            rightIcon={isConfirmPasswordValid ? <Check className="h-4 w-4 text-green-400" /> : null}
            required
          />

          <Button type="submit" variant="primary" size="lg" className="w-full text-black bg-brand-400 hover:bg-[#f9ff54] mt-6" disabled={loading}>
            {loading ? "Saving..." : "Save and Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function UpdateProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <UpdateProfileForm />
    </Suspense>
  );
}
