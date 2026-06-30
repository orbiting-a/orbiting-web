"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import { checkUsername } from "@/lib/supabase/queries";
import { AlertCircle, Eye, EyeOff, Mail, Lock, User, AtSign, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const nameChangedRef = useRef(false);
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateUsername = (fullName: string) => {
    const base = fullName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20) || "user";
    return `${base}${Math.random().toString(36).slice(2, 6)}`;
  };

  const sanitizeUsername = (val: string) =>
    val.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);

  useEffect(() => {
    if (!nameChangedRef.current) {
      setUsername(generateUsername(name));
    }
  }, [name]);

  useEffect(() => {
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    checkTimeoutRef.current = setTimeout(async () => {
      const available = await checkUsername(username);
      setUsernameAvailable(available);
      setCheckingUsername(false);
    }, 400);
    return () => { if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current); };
  }, [username]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!username.trim()) {
      setError("Please enter a username.");
      return;
    }

    if (usernameAvailable === false) {
      setError("Username is already taken. Try another.");
      return;
    }

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
        data: { display_name: name.trim(), username },
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
        username,
        display_name: name.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        setError("Failed to create profile. Try again.");
        setLoading(false);
        return;
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
            onChange={(e) => { setName(e.target.value); nameChangedRef.current = true; }}
            icon={<User className="h-4 w-4" />}
            required
          />

          <div className="relative">
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => { setUsername(sanitizeUsername(e.target.value)); nameChangedRef.current = true; }}
              icon={<AtSign className="h-4 w-4" />}
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {checkingUsername ? (
                <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
              ) : usernameAvailable === true ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : usernameAvailable === false ? (
                <XCircle className="h-4 w-4 text-red-400" />
              ) : null}
            </div>
            {usernameAvailable === false && (
              <p className="text-xs text-red-400 mt-1">Username already taken</p>
            )}
            {usernameAvailable === true && (
              <p className="text-xs text-green-400 mt-1">Username available</p>
            )}
          </div>

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
