"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/components/ui";
import { ArrowLeft, Globe, Check } from "lucide-react";
import Link from "next/link";

const languages = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "ur", label: "Urdu", native: "اردو" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "fr", label: "French", native: "Français" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "ko", label: "Korean", native: "한국어" },
  { code: "zh", label: "Chinese", native: "中文" },
];

const STORAGE_KEY = "orbit_language";

export default function LanguagePage() {
  const router = useRouter();
  const [selected, setSelected] = useState("en");

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && languages.some((l) => l.code === saved)) {
      setSelected(saved);
    }
  }, []);

  const handleSelect = (code: string) => {
    setSelected(code);
    localStorage.setItem(STORAGE_KEY, code);
    // Future: sync to server profile when profile language field exists
    // e.g., supabase.from("profiles").update({ language: code }).eq("id", userId)
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">Language</h1>

      <div className="rounded-2xl bg-surface-raised border border-border-subtle overflow-hidden">
        {languages.map((lang, idx) => (
          <button
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-brand-50 dark:hover:bg-brand-900/10 ${
              idx < languages.length - 1 ? "border-b border-border-subtle" : ""
            }`}
          >
            <Globe className="h-5 w-5 text-text-muted shrink-0" />
            <div className="flex-1 text-left">
              <p className="font-medium text-text-primary">{lang.native}</p>
              <p className="text-xs text-text-muted">{lang.label}</p>
            </div>
            {selected === lang.code && (
              <Check className="h-5 w-5 text-brand-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
