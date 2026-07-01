"use client";

import { useEffect } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { ringtoneManager } from "@/lib/ringtone";

export function IncomingCall({
  callerName,
  type,
  onAnswer,
  onDecline,
}: {
  callerName: string;
  type: "audio" | "video";
  onAnswer: () => void;
  onDecline: () => void;
}) {
  useEffect(() => {
    ringtoneManager.startRingtone();
    return () => {
      ringtoneManager.stop();
    };
  }, []);
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card rounded-2xl p-8 w-full max-w-sm text-center">
        <div className="h-20 w-20 rounded-full bg-brand-400/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl text-brand-400 font-bold">
            {callerName.charAt(0).toUpperCase()}
          </span>
        </div>
        <p className="text-lg font-bold text-text-primary mb-1">{callerName}</p>
        <p className="text-sm text-text-muted mb-8 flex items-center justify-center gap-2">
          {type === "video" ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
          Incoming {type} call
        </p>
        <div className="flex items-center justify-center gap-6">
          <button onClick={onDecline}
            className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors">
            <PhoneOff className="h-6 w-6" />
          </button>
          <button onClick={onAnswer}
            className="p-4 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors">
            <Phone className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
