"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Input, Textarea, Button, Avatar } from "@/components/ui";
import { ArrowLeft, Save, Upload, Wand2 } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getProfile, updateProfile, uploadMedia } from "@/lib/supabase/queries";
import type { Profile } from "@/types/database";

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      if (!user) { router.push("/login"); return; }
      const p = await getProfile(user.id);
      if (p) {
        setProfile(p);
        setDisplayName(p.display_name || "");
        setUsername(p.username || "");
        setBio(p.bio || "");
      }
      setLoading(false);
    });
  }, [router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    let avatar_url = profile.avatar_url;

    if (avatarFile) {
      const path = `avatars/${profile.id}/${Date.now()}-${avatarFile.name}`;
      const url = await uploadMedia(avatarFile, path);
      if (url) avatar_url = url;
    }

    await updateProfile(profile.id, {
      display_name: displayName.trim() || null,
      username: username.trim(),
      bio: bio.trim() || null,
      avatar_url,
    });

    setSaving(false);
    router.push("/settings");
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 animate-pulse space-y-4">
        <div className="h-4 w-20 bg-border-subtle rounded" />
        <div className="rounded-2xl bg-surface-raised border border-border-subtle p-6 space-y-4">
          <div className="h-20 w-20 rounded-full bg-border-subtle mx-auto" />
          <div className="h-4 w-32 bg-border-subtle rounded mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">Personal Information</h1>

      <Card className="space-y-5">
        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar name={displayName || "User"} size="xl" src={avatarPreview || profile?.avatar_url} />
            <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-brand-500 text-white flex items-center justify-center cursor-pointer hover:bg-brand-600 transition-colors shadow-lg">
              <Upload className="h-3.5 w-3.5" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <Link href="/avatar" className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 mt-2">
            <Wand2 className="h-3.5 w-3.5" /> Create Avatar
          </Link>
        </div>

        <Input label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your display name" />
        <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="username" />
        <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} />

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={() => router.back()}>Cancel</Button>
          <Button variant="primary" className="flex-1" loading={saving} onClick={handleSave} icon={<Save className="h-4 w-4" />}>
            Save Changes
          </Button>
        </div>
      </Card>
    </div>
  );
}
