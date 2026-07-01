"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui";
import { Send, Smile, Paperclip, File, X, Mic, MicOff, Square } from "lucide-react";

const EMOJIS = [
  "😀", "😂", "😍", "🥰", "😎", "🤔", "😢", "😡",
  "👍", "👎", "❤️", "🔥", "🎉", "✨", "💯", "🙏",
  "🤣", "😊", "🙂", "😉", "😌", "😏", "😴",
  "😋", "🤗", "😇", "🥳", "🤩", "😈", "👀", "💀",
  "🎶", "💪", "🤝", "👋", "✌️", "🤞", "👏", "🙌",
];

export function ChatInput({
  onSend,
  onSendFile,
}: {
  onSend: (content: string) => void;
  onSendFile?: (file: File) => void;
}) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [filePreview, setFilePreview] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([] as Blob[]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => clearInterval(recordTimerRef.current);
  }, []);

  const handleSend = async () => {
    if ((!content.trim() && !filePreview) || sending) return;
    setSending(true);
    if (filePreview) {
      await onSendFile?.(filePreview);
      setFilePreview(null);
    }
    if (content.trim()) {
      await onSend(content.trim());
    }
    setContent("");
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setContent((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFilePreview(file);
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      setRecordingStream(stream);
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
        setRecordingStream(null);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordDuration(0);
      setRecordedBlob(null);
      recordTimerRef.current = setInterval(() => {
        setRecordDuration((d) => d + 1);
      }, 1000);
    } catch {
      // Permission denied or no mic
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    clearInterval(recordTimerRef.current);
  };

  const cancelRecording = () => {
    recordingStream?.getTracks().forEach((t) => t.stop());
    setRecordingStream(null);
    mediaRecorderRef.current?.stop();
    setRecording(false);
    setRecordedBlob(null);
    clearInterval(recordTimerRef.current);
  };

  const sendRecording = () => {
    if (!recordedBlob) return;
    const file = Object.assign(new Blob([recordedBlob], { type: "audio/webm" }), { name: `voice-${Date.now()}.webm`, lastModified: Date.now() }) as File;
    onSendFile?.(file);
    setRecordedBlob(null);
  };

  const isImage = filePreview?.type.startsWith("image/");
  const isAudio = filePreview?.type.startsWith("audio/");

  return (
    <div className="border-t border-border p-4 relative">
      {showEmoji && (
        <div
          ref={emojiRef}
          className="absolute bottom-full left-4 mb-2 bg-surface-raised border border-border-subtle rounded-xl shadow-lg p-3 grid grid-cols-8 gap-1 z-10"
        >
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="w-8 h-8 flex items-center justify-center hover:bg-surface-hover rounded-lg text-lg transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {filePreview && !recording && (
        <div className="mb-3 p-2 bg-surface-raised rounded-xl border border-border-subtle flex items-center gap-3">
          {isImage ? (
            <img
              src={URL.createObjectURL(filePreview)}
              alt="Preview"
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : isAudio ? (
            <div className="h-12 w-12 rounded-lg bg-green-400/10 flex items-center justify-center">
              <Mic className="h-5 w-5 text-green-400" />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-lg bg-brand-400/10 flex items-center justify-center">
              <File className="h-5 w-5 text-brand-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-primary truncate">{filePreview.name}</p>
            <p className="text-xs text-text-muted">{(filePreview.size / 1024).toFixed(1)} KB</p>
          </div>
          <button
            onClick={() => setFilePreview(null)}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {recording && (
        <div className="mb-3 p-3 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm text-red-500 font-medium">
            Recording... {recordDuration}s
          </span>
          <div className="flex-1 flex gap-1 items-center ml-2">
            {Array.from({ length: Math.min(recordDuration, 20) }).map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full bg-red-400/50"
                style={{ height: `${4 + Math.random() * 12}px` }} />
            ))}
          </div>
        </div>
      )}

      {recordedBlob && !recording && (
        <div className="mb-3 p-3 glass-card-static flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-400/10 flex items-center justify-center shrink-0">
            <Mic className="h-5 w-5 text-green-400" />
          </div>
          <audio src={URL.createObjectURL(recordedBlob)} controls preload="metadata" className="h-9 flex-1" style={{ maxWidth: "200px" }} />
          <span className="text-xs text-text-muted">{recordDuration}s</span>
          <button onClick={cancelRecording}
            className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors">
            <X className="h-4 w-4" />
          </button>
          <Button variant="primary" size="sm" onClick={sendRecording}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          onClick={() => !recording && fileInputRef.current?.click()}
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors shrink-0 disabled:opacity-50"
          disabled={recording}
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt,.mp3,.wav,.ogg,.webm"
          onChange={handleFileSelect}
          className="hidden"
        />

        {recording ? (
          <button
            onClick={stopRecording}
            className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shrink-0"
          >
            <Square className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="p-2 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
          >
            <Mic className="h-5 w-5" />
          </button>
        )}

        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="w-full rounded-xl bg-surface-raised border border-border-subtle px-4 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-none max-h-32 disabled:opacity-50"
            style={{ minHeight: "40px" }}
            disabled={recording}
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors shrink-0"
          >
            <Smile className="h-5 w-5" />
          </button>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={handleSend}
          disabled={(!content.trim() && !filePreview) || recording}
          loading={sending}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
