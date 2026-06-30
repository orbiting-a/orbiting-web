"use client";

import { useState, useRef } from "react";
import { Card, Button } from "@/components/ui";
import Image from "next/image";
import { ArrowLeft, Save, Upload, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { updateProfile, uploadMedia } from "@/lib/supabase/queries";

const hairStyles = ["Short", "Long", "Curly", "Punk", "Bald", "Pompadour"];
const hairColors = ["#1a1a2e", "#e2a740", "#8b4513", "#ff4500", "#c0c0c0", "#000000"];
const eyeStyles = ["Round", "Almond", "Hooded", "Cat", "Doe"];
const skinTones = ["#f5d0b5", "#d4a574", "#8d5524", "#e8b88a", "#c68642", "#f0c8a0"];
const outfits = ["Casual", "Formal", "Sporty", "Hoodie", "T-Shirt", "Jacket"];

type AvatarConfig = {
  hair: string;
  hairColor: string;
  eyes: string;
  skin: string;
  outfit: string;
  bgColor: string;
};

const defaultConfig: AvatarConfig = {
  hair: "Short",
  hairColor: "#1a1a2e",
  eyes: "Round",
  skin: "#f5d0b5",
  outfit: "Casual",
  bgColor: "#7c3aed",
};

export default function AvatarCreationPage() {
  const router = useRouter();
  const [config, setConfig] = useState<AvatarConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const user = await getCurrentUser();
    if (!user) return;
    const path = `avatars/${user.id}-${Date.now()}.${file.name.split(".").pop()}`;
    const url = await uploadMedia(file, path);
    if (url) setUploadedUrl(url);
  };

  const handleSave = async () => {
    setSaving(true);
    const user = await getCurrentUser();
    if (!user) { setSaving(false); return; }

    if (uploadedUrl) {
      await updateProfile(user.id, { avatar_url: uploadedUrl });
    } else {
      // Save avatar config as a data URI or store config in profile
      const svg = generateAvatarSvg(config);
      const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
      await updateProfile(user.id, { avatar_url: dataUrl });
    }
    router.push("/settings/profile");
    setSaving(false);
  };

  const generateAvatarSvg = (cfg: AvatarConfig): string => {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200">
      <rect width="100" height="100" rx="20" fill="${cfg.bgColor}"/>
      <ellipse cx="50" cy="45" rx="30" ry="28" fill="${cfg.skin}"/>
      ${cfg.hair !== "Bald" ? `
      <path d="M20 40 Q20 15 50 10 Q80 15 80 40" fill="${cfg.hairColor}"/>
      ` : ""}
      ${cfg.hair === "Long" ? `
      <path d="M25 40 Q20 60 22 80" stroke="${cfg.hairColor}" stroke-width="4" fill="none"/>
      <path d="M75 40 Q80 60 78 80" stroke="${cfg.hairColor}" stroke-width="4" fill="none"/>
      ` : ""}
      ${cfg.hair === "Curly" ? `
      <circle cx="25" cy="25" r="6" fill="${cfg.hairColor}"/>
      <circle cx="40" cy="18" r="7" fill="${cfg.hairColor}"/>
      <circle cx="55" cy="16" r="6" fill="${cfg.hairColor}"/>
      <circle cx="70" cy="22" r="7" fill="${cfg.hairColor}"/>
      <circle cx="33" cy="32" r="5" fill="${cfg.hairColor}"/>
      <circle cx="60" cy="30" r="5" fill="${cfg.hairColor}"/>
      ` : ""}
      ${cfg.eyes === "Round" ? `
      <circle cx="38" cy="42" r="5" fill="white"/>
      <circle cx="62" cy="42" r="5" fill="white"/>
      <circle cx="38" cy="42" r="2.5" fill="#1a1a2e"/>
      <circle cx="62" cy="42" r="2.5" fill="#1a1a2e"/>
      ` : ""}
      ${cfg.eyes === "Almond" ? `
      <ellipse cx="38" cy="42" rx="5" ry="3" fill="white"/>
      <ellipse cx="62" cy="42" rx="5" ry="3" fill="white"/>
      <ellipse cx="38" cy="42" rx="2.5" ry="1.5" fill="#1a1a2e"/>
      <ellipse cx="62" cy="42" rx="2.5" ry="1.5" fill="#1a1a2e"/>
      ` : ""}
      ${cfg.eyes === "Doe" ? `
      <circle cx="38" cy="42" r="6" fill="white"/>
      <circle cx="62" cy="42" r="6" fill="white"/>
      <circle cx="38" cy="42" r="3.5" fill="#1a1a2e"/>
      <circle cx="62" cy="42" r="3.5" fill="#1a1a2e"/>
      <circle cx="36" cy="40" r="1.5" fill="white"/>
      <circle cx="60" cy="40" r="1.5" fill="white"/>
      ` : ""}
      <path d="M45 52 Q50 57 55 52" stroke="#c0392b" stroke-width="2" fill="none" stroke-linecap="round"/>
      ${cfg.outfit === "Casual" ? `<rect x="30" y="70" width="40" height="20" rx="5" fill="#3b82f6"/>` : ""}
      ${cfg.outfit === "Formal" ? `<rect x="30" y="70" width="40" height="20" rx="2" fill="#1e293b"/><path d="M45 70 L50 75 L55 70" fill="white"/>` : ""}
      ${cfg.outfit === "Sporty" ? `<rect x="30" y="70" width="40" height="20" rx="5" fill="#ef4444"/><rect x="42" y="72" width="16" height="8" rx="2" fill="white"/>` : ""}
      ${cfg.outfit === "Hoodie" ? `<rect x="28" y="68" width="44" height="22" rx="6" fill="#6366f1"/><ellipse cx="50" cy="80" rx="8" ry="4" fill="#4f46e5"/>` : ""}
      ${cfg.outfit === "T-Shirt" ? `<rect x="30" y="70" width="40" height="20" rx="4" fill="#22c55e"/><circle cx="50" cy="72" r="2" fill="#16a34a"/>` : ""}
      ${cfg.outfit === "Jacket" ? `<rect x="28" y="68" width="44" height="22" rx="3" fill="#8b5cf6"/><rect x="35" y="68" width="8" height="22" fill="#7c3aed"/><rect x="57" y="68" width="8" height="22" fill="#7c3aed"/>` : ""}
    </svg>`;
  };

  const previewSvg = generateAvatarSvg(config);

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <Link href="/settings/profile" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Profile
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">Create Avatar</h1>

      <div className="flex flex-col items-center mb-8">
        <div className="w-40 h-40 rounded-2xl overflow-hidden mb-4 border-2 border-border-subtle">
          {uploadedUrl ? (
            <Image src={uploadedUrl} alt="" width={160} height={160} className="w-full h-full object-cover" />
          ) : (
            <Image
              src={`data:image/svg+xml;base64,${btoa(previewSvg)}`}
              alt="Avatar preview"
              width={160}
              height={160}
              className="w-full h-full"
              unoptimized
            />
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-3.5 w-3.5 mr-1" /> Upload Photo
          </Button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
            <Save className="h-3.5 w-3.5 mr-1" /> Save Avatar
          </Button>
        </div>
      </div>

      {!uploadedUrl && (
        <div className="space-y-5">
          <div>
            <label className="text-xs text-text-muted mb-2 block">Skin Tone</label>
            <div className="flex gap-2">
              {skinTones.map((color) => (
                <button key={color} onClick={() => setConfig({ ...config, skin: color })}
                  className={`h-8 w-8 rounded-full border-2 ${config.skin === color ? "border-brand-400 scale-110" : "border-border-subtle"}`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted mb-2 block">Hair Style</label>
            <div className="flex flex-wrap gap-2">
              {hairStyles.map((style) => (
                <button key={style} onClick={() => setConfig({ ...config, hair: style })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${config.hair === style ? "bg-brand-500 text-white" : "bg-surface-raised text-text-secondary border border-border-subtle hover:text-text-primary"}`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted mb-2 block">Hair Color</label>
            <div className="flex gap-2">
              {hairColors.map((color) => (
                <button key={color} onClick={() => setConfig({ ...config, hairColor: color })}
                  className={`h-8 w-8 rounded-full border-2 ${config.hairColor === color ? "border-brand-400 scale-110" : "border-border-subtle"}`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted mb-2 block">Eye Style</label>
            <div className="flex flex-wrap gap-2">
              {eyeStyles.map((style) => (
                <button key={style} onClick={() => setConfig({ ...config, eyes: style })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${config.eyes === style ? "bg-brand-500 text-white" : "bg-surface-raised text-text-secondary border border-border-subtle hover:text-text-primary"}`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted mb-2 block">Outfit</label>
            <div className="flex flex-wrap gap-2">
              {outfits.map((style) => (
                <button key={style} onClick={() => setConfig({ ...config, outfit: style })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${config.outfit === style ? "bg-brand-500 text-white" : "bg-surface-raised text-text-secondary border border-border-subtle hover:text-text-primary"}`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted mb-2 block">Background Color</label>
            <div className="flex gap-2">
              {["#7c3aed", "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#ec4899"].map((color) => (
                <button key={color} onClick={() => setConfig({ ...config, bgColor: color })}
                  className={`h-8 w-8 rounded-full border-2 ${config.bgColor === color ? "border-brand-400 scale-110" : "border-border-subtle"}`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
