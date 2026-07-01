"use client";

import { useState, useEffect } from "react";
import { ChatList } from "@/components/chat/ChatList";
import { MessageCircle, Plus, X, Search, Loader2 } from "lucide-react";
import { Button, Input, Avatar } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { createGroupChannel, createDMChannel, searchProfiles } from "@/lib/supabase/queries";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/database";

export default function ChatPage() {
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (userSearch.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchProfiles(userSearch);
      const currentUser = await getCurrentUser();
      setSearchResults(results.filter((p) => p.id !== currentUser?.id));
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const toggleUser = (profile: Profile) => {
    setSelectedUsers((prev) =>
      prev.find((u) => u.id === profile.id)
        ? prev.filter((u) => u.id !== profile.id)
        : [...prev, profile]
    );
  };

  const handleCreateGroup = async () => {
    if (selectedUsers.length === 0) return;
    setCreating(true);
    let channel;
    if (selectedUsers.length === 1) {
      channel = await createDMChannel(selectedUsers[0].id);
    } else {
      const name = groupName.trim() || `${selectedUsers.map((u) => u.display_name || u.username).join(", ")}`;
      channel = await createGroupChannel(name, selectedUsers.map((u) => u.id));
    }
    setCreating(false);
    setShowNewChat(false);
    setGroupName("");
    setSelectedUsers([]);
    setUserSearch("");
    if (channel) router.push(`/chat/${channel.id}`);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="w-full lg:w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-text-primary">Chat</h1>
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-xl bg-surface-raised border border-border-subtle pl-10 pr-4 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>
        </div>

        <div className="flex gap-2 px-4 pt-3 pb-1">
          {["All", "DMs", "Channels"].map((tab) => (
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
          <ChatList filter={filter} search={search} />
        </div>
      </div>

      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="h-20 w-20 rounded-full bg-brand-400/10 flex items-center justify-center mb-5">
          <MessageCircle className="h-10 w-10 text-brand-400" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Select a conversation</h2>
        <p className="text-sm text-text-muted max-w-sm mb-6">
          Choose a chat from the sidebar or start a new conversation
        </p>
        <button
          onClick={() => setShowNewChat(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Conversation
        </button>
      </div>

      {showNewChat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNewChat(false)}>
          <div className="bg-surface-raised border border-border-subtle rounded-2xl w-full max-w-md p-6" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text-primary text-lg">New Conversation</h3>
              <button onClick={() => setShowNewChat(false)} className="p-1 rounded-lg hover:bg-surface-raised text-text-muted hover:text-text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-3">
              <label className="text-xs text-text-muted mb-1 block">Group name (optional)</label>
              <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Leave empty for DM" />
            </div>

            <div className="mb-3">
              <label className="text-xs text-text-muted mb-1 block">Add people</label>
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name..."
                icon={<Search className="h-4 w-4" />}
              />
            </div>

            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedUsers.map((u) => (
                  <span key={u.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-brand-500/20 text-brand-400 text-xs">
                    <Avatar name={u.display_name || "U"} size="xs" src={u.avatar_url} />
                    {u.display_name || u.username}
                    <button onClick={() => toggleUser(u)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}

            {userSearch.trim().length >= 2 && (
              <div className="max-h-40 overflow-y-auto mb-4 space-y-1">
                {searchResults.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-4">No users found</p>
                ) : (
                  searchResults.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => toggleUser(profile)}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors ${
                        selectedUsers.find((u) => u.id === profile.id)
                          ? "bg-brand-500/20"
                          : "hover:bg-surface-raised"
                      }`}
                    >
                      <Avatar name={profile.display_name || "U"} size="sm" src={profile.avatar_url} />
                      <div className="text-left min-w-0">
                        <p className="text-sm text-text-primary truncate">{profile.display_name || profile.username}</p>
                        <p className="text-xs text-text-muted truncate">@{profile.username}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleCreateGroup}
              loading={creating}
              disabled={selectedUsers.length === 0}
            >
              {selectedUsers.length === 1 ? "Start DM" : `Create Group (${selectedUsers.length})`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
