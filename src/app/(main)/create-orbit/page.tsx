"use client";

import { useState, useRef } from "react";
import { Card, Button, Input, Textarea } from "@/components/ui";
import { LocationSearch } from "@/components/ui/LocationSearch";
import type { LocationResult } from "@/components/ui/LocationSearch";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Globe, Lock, ArrowLeft, Image as ImageIcon, MapPin, Plus, X, Link2 } from "lucide-react";
import { createOrbit, uploadMedia } from "@/lib/supabase/queries";
import Link from "next/link";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";

const categories = [
  "Technology", "Music", "Gaming", "Art", "Sports",
  "Education", "Business", "Social", "Health", "Travel",
];

const interests = [
  "AI", "Design", "Photography", "Cooking", "Fitness",
  "Fashion", "Movies", "Books", "Nature", "Dancing",
  "Startups", "Blockchain", "Space", "History", "Cars",
];

export default function CreateOrbitPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [location, setLocation] = useState<LocationResult | null>(null);

  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const tag = customTag.trim();
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setCustomTag("");
    }
  };

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: "", url: "" }]);
  };

  const updateSocialLink = (index: number, field: keyof typeof socialLinks[0], value: string) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSocialLinks(updated);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError("");

    try {
      let logoUrl: string | undefined;
      let coverUrl: string | undefined;

      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const path = `orbit-logos/${slugify(name)}-${Date.now()}.${ext}`;
        logoUrl = await uploadMedia(logoFile, path) || undefined;
      }

      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const path = `orbit-covers/${slugify(name)}-${Date.now()}.${ext}`;
        coverUrl = await uploadMedia(coverFile, path) || undefined;
      }

      const loc = location ? { lat: location.lat, lng: location.lng, city: location.city, country: location.country } : undefined;

      const socialLinksObj = socialLinks
        .filter((s) => s.platform && s.url)
        .reduce((acc, s) => ({ ...acc, [s.platform]: s.url }), {} as Record<string, string>);

      const slug = slugify(name);
      const orbit = await createOrbit({
        name: name.trim(),
        slug,
        description: description.trim(),
        category: category || undefined,
        is_private: isPrivate,
        logo_url: logoUrl,
        cover_url: coverUrl,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        location: loc,
        social_links: Object.keys(socialLinksObj).length > 0 ? socialLinksObj : undefined,
      });

      if (orbit) {
        toast.success("Orbit created successfully!");
        router.push(`/orbit/${orbit.slug}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create orbit";
      setError(msg);
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <Link
        href="/discover"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Discover
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">Create an Orbit</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Orbit Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Tech Enthusiasts"
            required
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this orbit about?"
          />

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Logo & Cover</label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  onClick={() => logoRef.current?.click()}
                  className="h-16 w-16 rounded-xl bg-surface-raised border-2 border-dashed border-border-subtle flex items-center justify-center cursor-pointer hover:border-brand-400 transition-colors overflow-hidden"
                >
                  {logoPreview ? (
                    <Image src={logoPreview} alt="" width={64} height={64} className="w-full h-full object-cover" unoptimized />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-text-muted" />
                  )}
                </div>
                <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                <span className="text-xs text-text-muted">Orbit logo (square)</span>
              </div>
              <div
                onClick={() => coverRef.current?.click()}
                className="h-24 rounded-xl bg-surface-raised border-2 border-dashed border-border-subtle flex items-center justify-center cursor-pointer hover:border-brand-400 transition-colors overflow-hidden"
              >
                {coverPreview ? (
                  <Image src={coverPreview} alt="" width={400} height={96} className="w-full h-full object-cover" unoptimized />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <ImageIcon className="h-5 w-5 text-text-muted" />
                    <span className="text-xs text-text-muted">Cover image</span>
                  </div>
                )}
              </div>
              <input ref={coverRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat === category ? "" : cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    category === cat
                      ? "bg-brand-500 text-white"
                      : "bg-surface-raised text-text-secondary border border-border-subtle hover:text-text-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Interest Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {interests.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-brand-500 text-white"
                      : "bg-surface-raised text-text-secondary border border-border-subtle hover:text-text-primary"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Add custom tag..."
                className="text-sm"
                onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
              />
              <button type="button" onClick={addCustomTag} className="p-2 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedTags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-brand-500/20 text-brand-400">
                    {tag}
                    <button type="button" onClick={() => toggleTag(tag)} className="hover:text-white"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Location</label>
            <LocationSearch value={location} onChange={setLocation} placeholder="Search for a city or place..." />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-text-primary">Social Links</label>
              <button type="button" onClick={addSocialLink} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
            {socialLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <Link2 className="h-4 w-4 text-text-muted shrink-0" />
                <Input
                  placeholder="Platform (e.g. twitter, discord)"
                  value={link.platform}
                  onChange={(e) => updateSocialLink(i, "platform", e.target.value)}
                  className="text-sm flex-1"
                />
                <Input
                  placeholder="URL"
                  value={link.url}
                  onChange={(e) => updateSocialLink(i, "url", e.target.value)}
                  className="text-sm flex-1"
                />
                <button type="button" onClick={() => removeSocialLink(i)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-raised border border-border-subtle">
            <div className="flex items-center gap-3">
              {isPrivate ? <Lock className="h-5 w-5 text-text-muted" /> : <Globe className="h-5 w-5 text-text-muted" />}
              <div>
                <p className="text-sm font-medium text-text-primary">{isPrivate ? "Private" : "Public"}</p>
                <p className="text-xs text-text-muted">{isPrivate ? "Only invited members can join" : "Anyone can join this orbit"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`relative w-10 h-5 rounded-full transition-colors ${isPrivate ? "bg-brand-500" : "bg-border"}`}
            >
              <div className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isPrivate ? "translate-x-5" : ""}`} />
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 rounded-lg p-3">{error}</p>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full" loading={creating} disabled={!name.trim()}>
            Create Orbit
          </Button>
        </form>
      </Card>
    </div>
  );
}
