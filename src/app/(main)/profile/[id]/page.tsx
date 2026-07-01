"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Avatar, Button } from "@/components/ui";
import { UserListModal } from "@/components/ui/UserListModal";
import {
  Users,
  Settings,
  Grid3X3,
  Bookmark,
  Heart,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { getProfile, getFollowers, getFollowing, getUserOrbits, getCreatedOrbits, getUserPosts, toggleFollow, isFollowing, createDMChannel } from "@/lib/supabase/queries";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/auth";
import { PostCard } from "@/components/feed/PostCard";
import type { Profile, Orbit, Post } from "@/types/database";

type PostWithRelations = Post & {
  profiles: Profile;
  orbits: Pick<Orbit, "name" | "slug" | "logo_url">;
};

export default function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orbits, setOrbits] = useState<Orbit[]>([]);
  const [createdOrbits, setCreatedOrbits] = useState<Orbit[]>([]);
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [amFollowing, setAmFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("Posts");
  const [loading, setLoading] = useState(true);
  const [listModal, setListModal] = useState<"followers" | "following" | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const currentUser = await getCurrentUser();

      if (currentUser) setCurrentUserId(currentUser.id);
      if (id === "me" && currentUser) {
        setIsOwnProfile(true);
        const p = await getProfile(currentUser.id);
        setProfile(p);
      } else if (id !== "me") {
        setIsOwnProfile(false);
        const p = await getProfile(id);
        setProfile(p);
        if (currentUser) {
          const following = await isFollowing(id);
          setAmFollowing(following);
        }
      }

      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!profile) return;
    getUserOrbits(profile.id).then((data) => setOrbits(data ?? []));
    getCreatedOrbits(profile.id).then((data) => setCreatedOrbits(data ?? []));
    getFollowers(profile.id).then((data) => setFollowers(data ?? []));
    getFollowing(profile.id).then((data) => setFollowing(data ?? []));
    getUserPosts(profile.id).then((data) => setPosts(data as PostWithRelations[]));
  }, [profile]);

  const handleFollowToggle = async () => {
    if (!profile) return;
    const result = await toggleFollow(profile.id);
    if (result.following) {
      setFollowers((prev) => [...prev, profile]);
      setAmFollowing(true);
    } else {
      setFollowers((prev) => prev.filter((p) => p.id !== profile.id));
      setAmFollowing(false);
    }
  };

  const handleMessage = async () => {
    if (!profile) return;
    try {
      const channel = await createDMChannel(profile.id);
      if (channel) router.push(`/chat/${channel.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start chat");
    }
  };

  const handleEditProfile = () => {
    router.push("/settings");
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="rounded-2xl bg-surface-raised border border-border-subtle p-6 space-y-4 animate-pulse">
          <div className="flex flex-col items-center gap-3">
            <div className="h-20 w-20 rounded-full bg-border-subtle" />
            <div className="h-5 w-32 bg-border-subtle rounded" />
            <div className="h-4 w-20 bg-border-subtle rounded" />
          </div>
        </div>
      </div>
    );
  }

  const displayName = profile?.display_name || profile?.username || "User";
  const username = profile?.username || "unknown";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Card padding="lg" className="mb-6">
        <div className="flex flex-col items-center text-center">
          <Avatar name={displayName} size="xl" src={profile?.avatar_url} />
          <h1 className="text-xl font-bold text-text-primary mt-4">
            {displayName}
          </h1>
          <p className="text-sm text-text-muted mt-0.5">@{username}</p>
          {profile?.bio && (
            <p className="text-sm text-text-secondary mt-3 max-w-md">
              {profile.bio}
            </p>
          )}

          <div className="flex items-center gap-8 mt-5">
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">
                {posts.length}
              </p>
              <p className="text-xs text-text-muted">Posts</p>
            </div>
            <button className="text-center hover:opacity-80 transition-opacity" onClick={() => setListModal("followers")}>
              <p className="text-lg font-bold text-text-primary">
                {followers.length}
              </p>
              <p className="text-xs text-text-muted">Followers</p>
            </button>
            <button className="text-center hover:opacity-80 transition-opacity" onClick={() => setListModal("following")}>
              <p className="text-lg font-bold text-text-primary">
                {following.length}
              </p>
              <p className="text-xs text-text-muted">Following</p>
            </button>
          </div>

          <div className="flex gap-3 mt-5 w-full max-w-xs">
            {isOwnProfile ? (
              <>
                <Button variant="primary" size="md" className="flex-1" onClick={handleEditProfile}>
                  Edit Profile
                </Button>
                <Link href="/settings">
                  <Button
                    variant="secondary"
                    size="md"
                    icon={<Settings className="h-4 w-4" />}
                  >
                    Settings
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Button
                  variant={amFollowing ? "secondary" : "primary"}
                  size="md"
                  className="flex-1"
                  onClick={handleFollowToggle}
                >
                  {amFollowing ? "Following" : "Follow"}
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  icon={<MessageCircle className="h-4 w-4" />}
                  onClick={handleMessage}
                >
                  Message
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      <div className="mb-6 space-y-6">
        {createdOrbits.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-brand-400" />
              <h2 className="text-lg font-bold">Created Orbits</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {createdOrbits.map((orbit) => (
                <Link key={orbit.id} href={`/orbit/${orbit.slug}`}>
                  <Card hover padding="sm" className="text-center border-brand-500/20 bg-brand-500/5">
                    <Avatar
                      name={orbit.name}
                      size="sm"
                      src={orbit.logo_url}
                      className="mx-auto mb-2"
                    />
                    <p className="text-xs font-medium text-text-primary truncate">
                      {orbit.name}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-brand-400" />
            <h2 className="text-lg font-bold">Joined Orbits</h2>
          </div>
          {orbits.filter((o) => o.created_by !== profile?.id).length === 0 ? (
            <Card padding="md" className="flex flex-col items-center py-8 text-center">
              <p className="text-sm text-text-muted">
                {isOwnProfile ? "You haven't joined any orbits yet" : "No orbits joined yet"}
              </p>
              {isOwnProfile && (
                <Link href="/discover">
                  <Button variant="outline" size="sm" className="mt-3">Discover Orbits</Button>
                </Link>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {orbits.filter((o) => o.created_by !== profile?.id).map((orbit) => (
                <Link key={orbit.id} href={`/orbit/${orbit.slug}`}>
                  <Card hover padding="sm" className="text-center">
                    <Avatar name={orbit.name} size="sm" src={orbit.logo_url} className="mx-auto mb-2" />
                    <p className="text-xs font-medium text-text-primary truncate">{orbit.name}</p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex border-b border-border mb-4">
        {[
          { icon: Grid3X3, label: "Posts" },
          { icon: Bookmark, label: "Saved" },
          { icon: Heart, label: "Liked" },
        ].map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.label
                ? "border-brand-400 text-brand-400"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "Posts" && posts.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-brand-400/10 flex items-center justify-center mb-4">
            <Grid3X3 className="h-8 w-8 text-brand-400" />
          </div>
          <h3 className="font-bold text-text-primary mb-1">No posts yet</h3>
          <p className="text-sm text-text-muted">
            {isOwnProfile
              ? "Start sharing with your communities!"
              : "This user hasn't posted anything yet."}
          </p>
        </div>
      )}

      {activeTab === "Posts" && posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {activeTab === "Saved" && (
        <div className="flex flex-col items-center py-16 text-center">
          <Bookmark className="h-10 w-10 text-text-muted mb-3" />
          <p className="text-sm text-text-muted">No saved posts yet</p>
        </div>
      )}

      {activeTab === "Liked" && (
        <div className="flex flex-col items-center py-16 text-center">
          <Heart className="h-10 w-10 text-text-muted mb-3" />
          <p className="text-sm text-text-muted">No liked posts yet</p>
        </div>
      )}

      {listModal && (
        <UserListModal
          title={listModal === "followers" ? "Followers" : "Following"}
          users={listModal === "followers" ? followers : following}
          onClose={() => setListModal(null)}
          currentUserId={currentUserId || undefined}
        />
      )}
    </div>
  );
}
