"use client";

import { useState, useEffect } from "react";
import { ChatList } from "@/components/chat/ChatList";
import { MessageCircle, Search, ArrowRight, Plus } from "lucide-react";
import { Avatar, Button } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { createDMChannel, searchProfiles, createGroupChannel } from "@/lib/supabase/queries";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Profile } from "@/types/database";

export default function ChatPage() {
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [creating, setCreating] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Profile[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<Profile[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  useEffect(() => {
    if (search.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchProfiles(search);
      const currentUser = await getCurrentUser();
      setSearchResults(results.filter((p) => p.id !== currentUser?.id));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (memberSearch.trim().length < 2) {
      setMemberResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchProfiles(memberSearch);
      const currentUser = await getCurrentUser();
      setMemberResults(results.filter((p) => p.id !== currentUser?.id && !selectedMembers.some((m) => m.id === p.id)));
    }, 300);
    return () => clearTimeout(timer);
  }, [memberSearch, selectedMembers]);

  const startDM = async (profile: Profile) => {
    setCreating(profile.id);
    try {
      const channel = await createDMChannel(profile.id);
      if (channel) {
        setSearch("");
        setSearchResults([]);
        setShowNewChat(false);
        router.push(`/chat/${channel.id}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start chat");
    }
    setCreating(null);
  };

  const handleCreateGroup = async () => {
    if (selectedMembers.length === 0) return;
    setCreatingGroup(true);
    try {
      const name = groupName.trim() || `Group (${selectedMembers.length})`;
      const channel = await createGroupChannel(name, selectedMembers.map((m) => m.id));
      if (channel) {
        setShowNewChat(false);
        setGroupName("");
        setSelectedMembers([]);
        setMemberSearch("");
        router.push(`/chat/${channel.id}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create group");
    }
    setCreatingGroup(false);
  };

  const addMember = (profile: Profile) => {
    setSelectedMembers((prev) => [...prev, profile]);
    setMemberSearch("");
    setMemberResults([]);
  };

  const removeMember = (profileId: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== profileId));
  };

  const closeModal = () => {
    setShowNewChat(false);
    setGroupName("");
    setSelectedMembers([]);
    setMemberSearch("");
    setMemberResults([]);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="w-full lg:w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-text-primary">Chat</h1>
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
              title="New group"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people..."
              className="w-full rounded-xl bg-surface-raised border border-border-subtle pl-10 pr-4 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>
        </div>

        {search.trim().length >= 2 && (
          <div className="max-h-60 overflow-y-auto border-b border-border">
            {searchResults.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">No users found</p>
            ) : (
              <div className="p-2 space-y-0.5">
                {searchResults.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => startDM(profile)}
                    disabled={creating === profile.id}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-raised transition-colors text-left"
                  >
                    <Avatar name={profile.display_name || "U"} size="sm" src={profile.avatar_url} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary font-medium truncate">{profile.display_name || profile.username}</p>
                      <p className="text-xs text-text-muted truncate">@{profile.username}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-text-muted shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 px-4 pt-3 pb-1">
          {["All", "DMs", "Groups"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === tab
                  ? "bg-brand-500 text-white"
                  : "bg-surface-raised text-text-secondary border border-border-subtle hover:text-text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <ChatList filter={filter} />
        </div>
      </div>

      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="h-20 w-20 rounded-full bg-brand-400/10 flex items-center justify-center mb-5">
          <MessageCircle className="h-10 w-10 text-brand-400" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Your messages</h2>
        <p className="text-sm text-text-muted max-w-sm">
          Search for someone above to start a conversation
        </p>
      </div>

      {/* New Group Modal */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface border border-border-subtle rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-bold text-text-primary">New Group</h2>
              <button onClick={closeModal} className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Group name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Project Team"
                  className="w-full rounded-xl bg-surface-raised border border-border-subtle px-4 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Add members</label>
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full rounded-xl bg-surface-raised border border-border-subtle px-4 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
                {memberSearch.trim().length >= 2 && memberResults.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto bg-surface-raised rounded-xl border border-border-subtle">
                    {memberResults.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => addMember(profile)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-surface-hover transition-colors text-left"
                      >
                        <Avatar name={profile.display_name || "U"} size="xs" src={profile.avatar_url} />
                        <p className="text-sm text-text-primary">{profile.display_name || profile.username}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedMembers.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-text-primary mb-2">{selectedMembers.length} selected</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMembers.map((profile) => (
                      <div
                        key={profile.id}
                        className="flex items-center gap-2 bg-brand-400/10 text-brand-400 px-3 py-1.5 rounded-full text-sm"
                      >
                        <span>{profile.display_name || profile.username}</span>
                        <button onClick={() => removeMember(profile.id)} className="hover:text-red-500 transition-colors">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleCreateGroup}
                disabled={selectedMembers.length === 0}
                loading={creatingGroup}
              >
                {groupName.trim() ? `Create group` : `Group (${selectedMembers.length})`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
