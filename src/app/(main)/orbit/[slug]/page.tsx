"use client";

import { use, useState, useEffect } from "react";
import { Card, Avatar, Button, Input, Textarea } from "@/components/ui";
import { PostCard } from "@/components/feed/PostCard";
import { CreatePost } from "@/components/feed/CreatePost";
import {
  Users,
  MapPin,
  Calendar,
  Globe,
  Lock,
  ArrowLeft,
  Trophy,
  Shield,
  Settings,
  UserMinus,
  UserCheck,
  UserX,
  CheckCircle2,
  XCircle,
  BarChart3,
  Edit3,
  Save,
  Crown,
  Hammer,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  getOrbitBySlug,
  getOrbitPosts,
  getOrbitEvents,
  getOrbitChallenges,
  joinOrbit,
  leaveOrbit,
  isOrbitMember,
  getOrbitMembersWithRoles,
  getUserOrbitRole,
  requestJoinOrbit,
  approveJoinRequest,
  rejectJoinRequest,
  updateMemberRole,
  removeMember,
  updateOrbit,
} from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import type { Orbit, Post, Profile, OrbitEvent, OrbitMember, OrbitRole } from "@/types/database";

type PostWithRelations = Post & {
  profiles: Profile;
  orbits: Pick<Orbit, "name" | "slug" | "logo_url">;
};

export default function OrbitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [orbit, setOrbit] = useState<Orbit | null>(null);
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [events, setEvents] = useState<(OrbitEvent & { profiles: Profile })[]>([]);
  const [challenges, setChallenges] = useState<(import("@/types/database").Challenge & { profiles: Profile })[]>([]);
  const [member, setMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Feed");
  const [members, setMembers] = useState<(OrbitMember & { profiles: Profile })[]>([]);
  const [userRole, setUserRole] = useState<OrbitRole | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", about: "", is_private: false });
  const [showEditModal, setShowEditModal] = useState(false);

  async function loadOrbitData() {
    const data = await getOrbitBySlug(slug);
    setOrbit(data);
    if (data) {
      const [postData, eventData, challengeData, memberData] = await Promise.all([
        getOrbitPosts(data.id),
        getOrbitEvents(data.id),
        getOrbitChallenges(data.id),
        getOrbitMembersWithRoles(data.id),
      ]);
      setPosts(postData as PostWithRelations[]);
      setEvents(eventData as (OrbitEvent & { profiles: Profile })[]);
      setChallenges(challengeData as (import("@/types/database").Challenge & { profiles: Profile })[]);
      setMembers(memberData);
      setEditForm({ name: data.name, description: data.description || "", about: data.about || "", is_private: data.is_private });
      const user = await getCurrentUser();
      if (user) {
        const [isMem, role] = await Promise.all([
          isOrbitMember(data.id, user.id),
          getUserOrbitRole(data.id, user.id),
        ]);
        setMember(isMem);
        setUserRole(role);
      }
    }
    setLoading(false);
  }

  useEffect(() => { loadOrbitData(); }, [slug]);

  const handleJoinToggle = async () => {
    if (!orbit) return;
    if (member) {
      await leaveOrbit(orbit.id);
      setMember(false);
    } else if (orbit.is_private) {
      await requestJoinOrbit(orbit.id);
      setMember(true);
    } else {
      await joinOrbit(orbit.id);
      setMember(true);
    }
    loadOrbitData();
  };

  const isOrbitAdmin = userRole === "owner" || userRole === "admin" || userRole === "moderator";

  const handleRoleChange = async (memberId: string, newRole: OrbitRole) => {
    await updateMemberRole(memberId, newRole);
    loadOrbitData();
  };

  const handleRemoveMember = async (memberId: string) => {
    await removeMember(memberId);
    loadOrbitData();
  };

  const handleApproveRequest = async (memberId: string) => {
    await approveJoinRequest(memberId);
    loadOrbitData();
  };

  const handleRejectRequest = async (memberId: string) => {
    await rejectJoinRequest(memberId);
    loadOrbitData();
  };

  const handleSaveSettings = async () => {
    if (!orbit) return;
    setSaving(true);
    await updateOrbit(orbit.id, editForm);
    setShowEditModal(false);
    setSaving(false);
    loadOrbitData();
  };

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      owner: "bg-yellow-500/10 text-yellow-400",
      admin: "bg-blue-500/10 text-blue-400",
      moderator: "bg-green-500/10 text-green-400",
      member: "bg-text-muted/10 text-text-muted",
      requested: "bg-orange-500/10 text-orange-400",
    };
    return styles[role] || styles.member;
  };

  const roleIcon = (role: string) => {
    if (role === "owner") return <Crown className="h-3 w-3" />;
    if (role === "admin") return <Shield className="h-3 w-3" />;
    if (role === "moderator") return <Hammer className="h-3 w-3" />;
    return null;
  };

  const adminTabs = [...(isOrbitAdmin ? ["Admin"] : [])];

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="rounded-2xl bg-surface-raised border border-border-subtle overflow-hidden animate-pulse">
          <div className="h-40 bg-border-subtle" />
          <div className="p-6 space-y-4">
            <div className="h-8 w-48 bg-border-subtle rounded" />
            <div className="h-4 w-32 bg-border-subtle rounded" />
            <div className="h-4 w-full bg-border-subtle rounded" />
            <div className="h-4 w-3/4 bg-border-subtle rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!orbit) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-text-primary mb-2">
          Orbit not found
        </h2>
        <p className="text-sm text-text-muted mb-4">
          This orbit doesn&apos;t exist or has been removed.
        </p>
        <Link href="/discover">
          <Button variant="primary">Discover Orbits</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link
        href="/discover"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Discover
      </Link>

      <Card padding="none" className="overflow-hidden mb-6">
        <div className="h-32 sm:h-40 bg-gradient-to-br from-brand-400 to-brand-700 relative">
          <div className="absolute -bottom-10 left-6">
            <Avatar name={orbit.name} size="xl" src={orbit.logo_url} />
          </div>
        </div>

        <div className="pt-12 px-6 pb-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                {orbit.name}
              </h1>
              <p className="text-sm text-text-muted flex items-center gap-1.5 mt-0.5">
                {orbit.is_private ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : (
                  <Globe className="h-3.5 w-3.5" />
                )}
                {orbit.is_private ? "Private" : "Public"} orbit
                {orbit.category && (
                  <>
                    <span className="text-text-muted">·</span>
                    <span className="text-brand-400">{orbit.category}</span>
                  </>
                )}
              </p>
            </div>
            <Button
              variant={member ? "secondary" : "primary"}
              size="sm"
              onClick={handleJoinToggle}
            >
              {member ? "Leave" : "Join"}
            </Button>
          </div>

          {orbit.description && (
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              {orbit.description}
            </p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-text-muted">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" /> {orbit.member_count} members
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />{" "}
              {new Date(orbit.created_at).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>
            {orbit.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> Location set
              </span>
            )}
          </div>
        </div>
      </Card>

      <div className="flex border-b border-border mb-6">
        {["Feed", "About", "Members", "Events", "Challenges", ...adminTabs].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-brand-400 text-brand-400"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Feed" && (
        <div className="space-y-4">
          <CreatePost
            orbitId={orbit.id}
            onPostCreated={() =>
              getOrbitPosts(orbit.id).then(
                (data) => setPosts(data as PostWithRelations[])
              )
            }
          />
          {posts.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-brand-400/10 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-brand-400" />
              </div>
              <h3 className="font-bold text-text-primary mb-1">
                No posts in this orbit yet
              </h3>
              <p className="text-sm text-text-muted">
                Be the first to share something
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "About" && (
        <Card padding="lg">
          <h3 className="font-bold text-text-primary mb-3">About</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            {orbit.about || orbit.description || "No description provided."}
          </p>
        </Card>
      )}

      {activeTab === "Members" && (
        <div className="space-y-3">
          {orbit?.is_private && isOrbitAdmin && members.filter(m => m.role === "requested").length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-text-primary mb-2">Join Requests</h3>
              <div className="space-y-2">
                {members.filter(m => m.role === "requested").map((req) => (
                  <Card key={req.id} padding="sm" className="flex items-center justify-between">
                    <Link href={`/profile/${req.user_id}`} className="flex items-center gap-3 min-w-0">
                      <Avatar name={req.profiles?.display_name || "U"} size="sm" src={req.profiles?.avatar_url} />
                      <span className="text-sm text-text-primary truncate">{req.profiles?.display_name || req.profiles?.username}</span>
                    </Link>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleApproveRequest(req.id)} className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleRejectRequest(req.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <h3 className="text-sm font-bold text-text-primary mb-2">All Members ({members.filter(m => m.role !== "requested").length})</h3>
          {members.filter(m => m.role !== "requested").length === 0 ? (
            <Card padding="lg" className="flex flex-col items-center py-12 text-center">
              <Users className="h-10 w-10 text-text-muted mb-3" />
              <p className="text-sm text-text-muted">No members yet</p>
            </Card>
          ) : (
            <div className="space-y-1">
              {members.filter(m => m.role !== "requested").map((memberItem) => (
                <Card key={memberItem.id} padding="sm" className="flex items-center justify-between">
                  <Link href={`/profile/${memberItem.user_id}`} className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar name={memberItem.profiles?.display_name || "U"} size="sm" src={memberItem.profiles?.avatar_url} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate flex items-center gap-1.5">
                        {memberItem.profiles?.display_name || memberItem.profiles?.username}
                        {roleIcon(memberItem.role)}
                      </p>
                      <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ${roleBadge(memberItem.role)}`}>
                        {memberItem.role}
                      </span>
                    </div>
                  </Link>
                  {isOrbitAdmin && memberItem.role !== "owner" && memberItem.role !== "requested" && (
                    <div className="flex items-center gap-1 shrink-0">
                      <select
                        value={memberItem.role}
                        onChange={(e) => handleRoleChange(memberItem.id, e.target.value as OrbitRole)}
                        className="text-xs bg-surface border border-border-subtle rounded-lg px-2 py-1 text-text-primary"
                      >
                        <option value="admin">Admin</option>
                        <option value="moderator">Mod</option>
                        <option value="member">Member</option>
                      </select>
                      <button onClick={() => handleRemoveMember(memberItem.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                        <UserX className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "Challenges" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-text-primary">Challenges</h2>
            <Button variant="primary" size="sm">Create Challenge</Button>
          </div>
          {challenges.length === 0 ? (
            <Card padding="lg" className="flex flex-col items-center py-12 text-center">
              <Trophy className="h-10 w-10 text-text-muted mb-3" />
              <p className="text-sm text-text-muted">No challenges yet</p>
            </Card>
          ) : (
            challenges.map((ch) => (
              <Link key={ch.id} href={`/challenges/${ch.id}`}>
                <Card hover padding="md" className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-brand-400/10 flex items-center justify-center shrink-0">
                    <Trophy className="h-6 w-6 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-text-primary">{ch.title}</h3>
                    <p className="text-xs text-text-muted mt-0.5 capitalize">{ch.type} · {ch.participant_count} participants</p>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}

      {activeTab === "Events" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-text-primary">Upcoming Events</h2>
            <Link href="/create-activity">
              <Button variant="primary" size="sm">Create Event</Button>
            </Link>
          </div>
          {events.length === 0 ? (
            <Card padding="lg" className="flex flex-col items-center py-12 text-center">
              <Calendar className="h-10 w-10 text-text-muted mb-3" />
              <p className="text-sm text-text-muted">No upcoming events</p>
            </Card>
          ) : (
            events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card hover padding="md" className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-brand-400/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-6 w-6 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-text-primary">{event.title}</h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {new Date(event.starts_at).toLocaleDateString("en-US", {
                        weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                    <p className="text-xs text-text-muted">{event.attendee_count} attending</p>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}

      {activeTab === "Admin" && isOrbitAdmin && (
        <div className="space-y-4">
          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text-primary flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Analytics</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-surface-raised">
                <p className="text-2xl font-bold text-text-primary">{orbit?.member_count || 0}</p>
                <p className="text-xs text-text-muted mt-1">Members</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-surface-raised">
                <p className="text-2xl font-bold text-text-primary">{orbit?.post_count || 0}</p>
                <p className="text-xs text-text-muted mt-1">Posts</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-surface-raised">
                <p className="text-2xl font-bold text-text-primary">{posts.length}</p>
                <p className="text-xs text-text-muted mt-1">Recent Posts</p>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text-primary flex items-center gap-2"><Settings className="h-4 w-4" /> Settings</h3>
              <Button variant="primary" size="sm" onClick={() => setShowEditModal(true)}>
                <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Name</span>
                <span className="text-text-primary font-medium">{orbit?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Privacy</span>
                <span className="text-text-primary font-medium">{orbit?.is_private ? "Private" : "Public"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Category</span>
                <span className="text-text-primary font-medium capitalize">{orbit?.category || "None"}</span>
              </div>
              {orbit?.description && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Description</span>
                  <span className="text-text-primary font-medium text-right max-w-[200px] truncate">{orbit.description}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-surface-raised border border-border-subtle rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-text-primary text-lg mb-4">Edit Orbit Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Name</label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Description</label>
                <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">About</label>
                <Textarea value={editForm.about} onChange={(e) => setEditForm({ ...editForm, about: e.target.value })} rows={3} />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-text-primary">Private</label>
                <button
                  onClick={() => setEditForm({ ...editForm, is_private: !editForm.is_private })}
                  className={`w-10 h-5 rounded-full transition-colors ${editForm.is_private ? "bg-brand-400" : "bg-border-subtle"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${editForm.is_private ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setShowEditModal(false)}>Cancel</Button>
                <Button variant="primary" className="flex-1" onClick={handleSaveSettings} loading={saving}>
                  <Save className="h-4 w-4 mr-1" /> Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
