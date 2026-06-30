"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
      } else {
        router.push("/feed");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-brand-300 to-brand-500 flex items-center justify-center shadow-lg shadow-brand-400/20 mb-4">
            <span className="text-white font-bold text-2xl">O</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-sm text-[#a5a1ac] mt-1">Log in to your Orbiting account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300">
              Forgot Password?
            </Link>
          </div>
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </Button>

        </form>

        <div className="mt-6 text-center">
          <Link href="/signup" className="text-sm text-brand-400 hover:text-brand-300">
            Don&apos;t have an account? <span className="font-semibold">Sign Up</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
