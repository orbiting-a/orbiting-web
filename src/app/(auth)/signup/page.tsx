"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import { AlertCircle, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAgreed) {
      setError("You must agree to the Terms of Use and Privacy Policy.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        username: email.split("@")[0],
        display_name: name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        console.warn("Profile insert error:", profileError.message);
      }

      router.push("/onboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between">
      <div className="flex-1 flex flex-col items-center justify-center py-12">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-brand-300 to-brand-500 flex items-center justify-center shadow-lg shadow-brand-400/20 mb-4">
          <span className="text-white font-bold text-3xl">O</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Orbiting</h1>
        <p className="text-brand-300 text-sm mt-1">Find your community. Match your vibe.</p>
      </div>

      <div className="bg-[#20222f] border-t border-[#2e303d] rounded-t-[32px] px-6 pt-8 pb-10 w-full max-w-md mx-auto shadow-2xl relative">
        <h2 className="text-xl font-bold mb-6">Create Account</h2>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<User className="h-4 w-4" />}
            required
          />

          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="h-4 w-4" />}
            required
          />

          <Input
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button onClick={() => setShowPassword(!showPassword)} className="cursor-pointer" type="button">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            required
          />

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="mt-1 accent-brand-400 h-4 w-4 rounded border-[#2e303d] bg-black"
            />
            <span className="text-xs text-[#a5a1ac] leading-normal">
              By continuing I agree to the{" "}
              <Link href="/terms" className="text-brand-400 hover:text-[#f9ff54] font-bold">
                Terms of Use
              </Link>{" "}
              &amp;{" "}
              <Link href="/privacy" className="text-brand-400 hover:text-[#f9ff54] font-bold">
                Privacy Policy
              </Link>
            </span>
          </label>

          <Button type="submit" variant="primary" size="lg" className="w-full text-black bg-brand-400 hover:bg-[#f9ff54]" loading={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-[#a5a1ac]">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-400 hover:underline font-semibold">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
