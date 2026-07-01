"use client";

import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Profile } from "@/types/database";

interface UserListModalProps {
  title: string;
  users: Profile[];
  onClose: () => void;
  currentUserId?: string;
  onRemove?: (userId: string) => void;
}

export function UserListModal({ title, users, onClose, currentUserId, onRemove }: UserListModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface-raised border border-border-subtle rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border-subtle shrink-0">
          <h3 className="font-bold text-text-primary">{title} ({users.length})</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-raised text-text-muted hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {users.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8">No users</p>
          ) : (
            users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-raised transition-colors group">
                <Link href={`/profile/${u.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  {u.avatar_url ? (
                    <Image src={u.avatar_url} alt="" width={36} height={36} className="h-9 w-9 rounded-full object-cover bg-surface-raised" unoptimized />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-brand-400/20 flex items-center justify-center text-xs font-bold text-brand-400 shrink-0">
                      {(u.display_name || u.username || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{u.display_name || u.username}</p>
                    <p className="text-xs text-text-muted truncate">@{u.username}</p>
                  </div>
                </Link>
                {currentUserId && onRemove && u.id !== currentUserId && (
                  <button
                    onClick={() => onRemove(u.id)}
                    className="text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
