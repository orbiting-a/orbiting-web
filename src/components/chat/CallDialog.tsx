"use client";

import { useState, useEffect, useRef } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff, Camera, CameraOff } from "lucide-react";
import { ringtoneManager } from "@/lib/ringtone";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.cloudflare.com:3478" },
  { urls: "stun:stun.l.google.com:19302" },
];

export function CallDialog({
  channelId,
  userId,
  otherUserId,
  otherUserName,
  initialType,
  callId: existingCallId,
  isCaller,
  onEnd,
}: {
  channelId: string;
  userId: string;
  otherUserId: string;
  otherUserName: string;
  initialType: "audio" | "video";
  callId?: string;
  isCaller: boolean;
  onEnd: () => void;
}) {
  const [muted, setMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(initialType === "video");
  const [callId, setCallId] = useState<string | null>(existingCallId || null);
  const [status, setStatus] = useState("connecting");
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const initRanRef = useRef(false);

  useEffect(() => {
    if (status === "ringing") ringtoneManager.startRingback();
    else ringtoneManager.stop();
    return () => { ringtoneManager.stop(); };
  }, [status]);

  useEffect(() => {
    let pc: RTCPeerConnection;
    let localStream: MediaStream;
    let ablyChannel: Awaited<ReturnType<typeof import("@/lib/ably")["getCallChannel"]>> | null = null;
    let statusUnsub: { unsubscribe: () => void } | null = null;
    const isCallerRole = isCaller;

    async function init() {
      if (initRanRef.current) return;
      initRanRef.current = true;

      try {
        const { createCall, updateCallStatus, getCallSignals, subscribeToCallStatus, endCallWithLog } = await import("@/lib/supabase/queries");
        const { getCallChannel, clearChannelCache } = await import("@/lib/ably");
        const Ably = await import("ably");

        // === 1. Setup PeerConnection ===
        pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;

        localStream = await navigator.mediaDevices.getUserMedia({
          video: videoEnabled,
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        localStreamRef.current = localStream;
        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream!));

        if (localVideoRef.current && videoEnabled) {
          localVideoRef.current.srcObject = localStream;
        }

        pc.ontrack = (event) => {
          if (event.streams[0]) {
            if (remoteVideoRef.current && videoEnabled) {
              remoteVideoRef.current.srcObject = event.streams[0];
            }
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = event.streams[0];
            }
          }
        };

        // === 2. Create or get call ID ===
        let cid = existingCallId;
        if (isCallerRole) {
          if (!cid) {
            const call = await createCall(channelId, otherUserId, initialType);
            cid = call.id;
            setCallId(cid);
          }
        }
        if (!cid) throw new Error("No call ID");

        // === 3. Subscribe to DB call status updates (for hangup) ===
        statusUnsub = subscribeToCallStatus(cid, (newStatus) => {
          if (newStatus === "ended") onEnd();
        });

        // === 4. Setup Ably channel for signaling ===
        ablyChannel = getCallChannel(cid);
        await ablyChannel.presence.enter({ userId, name: otherUserName });

        // Fetch existing signals from Ably channel history and DB
        const historyPage = await ablyChannel.history({ untilAttach: true });
        const historySignals: { type: string; payload: unknown; sender_id: string }[] = [];
        for (const msg of historyPage.items) {
          if (msg.data && typeof msg.data === "object" && "sender_id" in (msg.data as any)) {
            const d = msg.data as { type: string; payload: unknown; sender_id: string };
            if (d.sender_id !== userId) {
              historySignals.push(d);
            }
          }
        }

        const dbSignals = await getCallSignals(cid);
        const allSignals = [...historySignals, ...dbSignals];

        // Deduplicate by type+sender
        const seen = new Set<string>();
        const deduped = allSignals.filter((s) => {
          const key = `${s.type}-${s.sender_id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // === 5. ICE candidate queue (must wait for remote description) ===
        const iceQueue: RTCIceCandidateInit[] = [];
        const flushIce = async () => {
          while (iceQueue.length > 0) {
            const c = iceQueue.shift();
            if (c) await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
          }
        };

        // === 6. Handle incoming signals ===
        let remoteDescSet = false;

        ablyChannel.subscribe("signal", async (msg) => {
          const signal = msg.data as { type: string; payload: unknown; sender_id: string };
          if (signal.sender_id === userId) return;

          try {
            if (signal.type === "offer" && !isCallerRole) {
              if (remoteDescSet) return;
              await pc.setRemoteDescription(new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit));
              remoteDescSet = true;
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              ablyChannel?.publish("signal", { type: "answer", payload: answer, sender_id: userId });
              setStatus("connected");
              updateCallStatus(cid!, "connected").catch(() => {});
              await flushIce();
            } else if (signal.type === "answer" && isCallerRole) {
              if (remoteDescSet) return;
              await pc.setRemoteDescription(new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit));
              remoteDescSet = true;
              setStatus("connected");
              updateCallStatus(cid!, "connected").catch(() => {});
              await flushIce();
            } else if (signal.type === "ice-candidate") {
              if (pc.remoteDescription && pc.remoteDescription.type) {
                await pc.addIceCandidate(new RTCIceCandidate(signal.payload as RTCIceCandidateInit)).catch(() => {});
              } else {
                iceQueue.push(signal.payload as RTCIceCandidateInit);
              }
            }
          } catch (err) {
            console.error("Ably signal error:", err);
          }
        });

        // Process deduped signals from history/DB (only if not already handled by subscription)
        for (const s of deduped) {
          if (remoteDescSet) break;
          if (s.type === "offer" && !isCallerRole) {
            await pc.setRemoteDescription(new RTCSessionDescription(s.payload as RTCSessionDescriptionInit));
            remoteDescSet = true;
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ablyChannel.publish("signal", { type: "answer", payload: answer, sender_id: userId });
            setStatus("connected");
            updateCallStatus(cid!, "connected").catch(() => {});
            await flushIce();
          } else if (s.type === "answer" && isCallerRole) {
            await pc.setRemoteDescription(new RTCSessionDescription(s.payload as RTCSessionDescriptionInit));
            remoteDescSet = true;
            setStatus("connected");
            updateCallStatus(cid!, "connected").catch(() => {});
            await flushIce();
          } else if (s.type === "ice-candidate") {
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(s.payload as RTCIceCandidateInit)).catch(() => {});
            } else {
              iceQueue.push(s.payload as RTCIceCandidateInit);
            }
          }
        }

        // === 7. ICE candidate sending ===
        pc.onicecandidate = (event) => {
          if (event.candidate && cid) {
            ablyChannel?.publish("signal", { type: "ice-candidate", payload: event.candidate.toJSON(), sender_id: userId }).catch(() => {});
          }
        };

        // === 8. Connection state ===
        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "connected") {
            setStatus("connected");
            updateCallStatus(cid!, "connected").catch(() => {});
          } else if (pc.connectionState === "failed") {
            updateCallStatus(cid!, "ended").catch(() => {});
            setTimeout(onEnd, 1000);
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
            setStatus("connected");
            updateCallStatus(cid!, "connected").catch(() => {});
          } else if (pc.iceConnectionState === "failed") {
            updateCallStatus(cid!, "ended").catch(() => {});
            setTimeout(onEnd, 1000);
          }
        };

        // === 9. Caller sends offer ===
        if (isCallerRole) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          ablyChannel.publish("signal", { type: "offer", payload: offer, sender_id: userId });
          setStatus("ringing");
        } else {
          if (!remoteDescSet) setStatus("connecting");
        }

      } catch (e) {
        const msg = e instanceof Error ? e.message : "Call failed";
        console.error("Call init failed", msg);
        setStatus(`Error: ${msg}`);
        setTimeout(onEnd, 3000);
      }
    }

    init();

    return () => {
      initRanRef.current = false;
      if (ablyChannel) {
        ablyChannel.presence.leave();
        ablyChannel.unsubscribe("signal");
      }
      statusUnsub?.unsubscribe();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, userId, otherUserId, initialType, existingCallId, isCaller, onEnd]);

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = muted; });
    setMuted(!muted);
  };

  const toggleVideo = async () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    if (videoEnabled) {
      stream.getVideoTracks().forEach((t) => { t.stop(); stream.removeTrack(t); });
      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video");
      if (sender) pcRef.current?.removeTrack(sender);
      setVideoEnabled(false);
    } else {
      try {
        const vid = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const t = vid.getVideoTracks()[0];
        stream.addTrack(t);
        pcRef.current?.addTrack(t, stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setVideoEnabled(true);
      } catch { /* permission denied */ }
    }
  };

  const endCall = async () => {
    if (callId) {
      const { updateCallStatus } = await import("@/lib/supabase/queries");
      await updateCallStatus(callId, "ended").catch(() => {});
    }
    onEnd();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <audio ref={remoteAudioRef} autoPlay playsInline muted={videoEnabled} />
      <div className="flex-1 relative flex items-center justify-center p-4">
        {videoEnabled ? (
          <>
            <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            <video ref={localVideoRef} autoPlay playsInline muted className="absolute top-4 right-4 w-32 h-48 rounded-2xl object-cover bg-surface-raised border-2 border-white/20 shadow-lg" />
          </>
        ) : (
          <div className="relative z-10 text-center">
            <div className="h-24 w-24 rounded-full bg-brand-400/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl text-brand-400 font-bold">{otherUserName.charAt(0).toUpperCase()}</span>
            </div>
            <p className="text-white text-xl font-bold">{otherUserName}</p>
            <p className="text-white/60 text-sm mt-1">
              {status === "ringing" ? "Ringing..." : status === "connecting" ? "Connecting..." : "Connected"}
            </p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-6 pb-12 pt-6">
        <button onClick={toggleMute} className={`p-4 rounded-full transition-colors ${muted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}>
          {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>
        <button onClick={endCall} className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors">
          <PhoneOff className="h-6 w-6" />
        </button>
        <button onClick={toggleVideo} className={`p-4 rounded-full transition-colors bg-white/10 text-white hover:bg-white/20`} title={videoEnabled ? "Turn off camera" : "Turn on camera"}>
          {videoEnabled ? <Video className="h-6 w-6" /> : <Camera className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );
}
