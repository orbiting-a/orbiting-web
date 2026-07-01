"use client";

import { useState, useEffect, useRef } from "react";
import { PhoneOff, Mic, MicOff, Video, Camera } from "lucide-react";
import { ringtoneManager } from "@/lib/ringtone";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.cloudflare.com:3478" },
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:80?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
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
  const mountedRef = useRef(true);
  const connectedRef = useRef(false);
  const statusUnsubRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    if (status === "ringing") ringtoneManager.startRingback();
    else ringtoneManager.stop();
    return () => { ringtoneManager.stop(); };
  }, [status]);

  useEffect(() => {
    let pc: RTCPeerConnection;
    let localStream: MediaStream;
    let ablyChannel: Awaited<ReturnType<typeof import("@/lib/ably")["getCallChannel"]>> | null = null;
    mountedRef.current = true;
    connectedRef.current = false;

    async function init() {
      if (!mountedRef.current) return;

      try {
        const { createCall, updateCallStatus, getCallSignals, subscribeToCallStatus } = await import("@/lib/supabase/queries");
        const { getCallChannel } = await import("@/lib/ably");

        // === 1. Setup PeerConnection ===
        pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;

        localStream = await navigator.mediaDevices.getUserMedia({
          video: videoEnabled,
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        if (!mountedRef.current) return;
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
        if (isCaller) {
          if (!cid) {
            const call = await createCall(channelId, otherUserId, initialType);
            cid = call.id;
            setCallId(cid);
          }
        }
        if (!cid) throw new Error("No call ID");

        // === 3. Subscribe to DB call status updates (for hangup) ===
        const statusSub = subscribeToCallStatus(cid, (newStatus) => {
          if (newStatus === "ended") onEnd();
        });
        statusUnsubRef.current = statusSub;

        // === 4. Setup Ably channel ===
        if (!mountedRef.current) return;
        ablyChannel = getCallChannel(cid, userId);
        await ablyChannel.presence.enter({ userId, name: otherUserName });

        // === 5. ICE candidate queue ===
        const iceQueue: RTCIceCandidateInit[] = [];
        const flushIce = async () => {
          while (iceQueue.length > 0) {
            const c = iceQueue.shift();
            if (c) await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
          }
        };

        // === 6. Fetch history signals first, then subscribe ===
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

        const seen = new Set<string>();
        const deduped = allSignals.filter((s) => {
          const key = `${s.type}-${s.sender_id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // Process deduped history/DB signals first
        for (const s of deduped) {
          if (!mountedRef.current) return;
          if (s.type === "offer") {
            if (pc.signalingState !== "stable") continue;
            await pc.setRemoteDescription(new RTCSessionDescription(s.payload as RTCSessionDescriptionInit));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ablyChannel.publish("signal", { type: "answer", payload: answer, sender_id: userId });
            if (!connectedRef.current) {
              connectedRef.current = true;
              setStatus("connected");
              updateCallStatus(cid, "connected").catch(() => {});
            }
            await flushIce();
          } else if (s.type === "answer") {
            if (pc.signalingState !== "have-local-offer") continue;
            await pc.setRemoteDescription(new RTCSessionDescription(s.payload as RTCSessionDescriptionInit));
            if (!connectedRef.current) {
              connectedRef.current = true;
              setStatus("connected");
              updateCallStatus(cid, "connected").catch(() => {});
            }
            await flushIce();
          } else if (s.type === "ice-candidate") {
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(s.payload as RTCIceCandidateInit)).catch(() => {});
            } else {
              iceQueue.push(s.payload as RTCIceCandidateInit);
            }
          }
        }

        if (!mountedRef.current) return;

        // Then subscribe to live signals
        ablyChannel.subscribe("signal", async (msg) => {
          const signal = msg.data as { type: string; payload: unknown; sender_id: string };
          if (signal.sender_id === userId) return;

          try {
            if (signal.type === "offer") {
              if (pc.signalingState !== "stable") return;
              await pc.setRemoteDescription(new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              ablyChannel?.publish("signal", { type: "answer", payload: answer, sender_id: userId });
              if (!connectedRef.current) {
                connectedRef.current = true;
                setStatus("connected");
                updateCallStatus(cid!, "connected").catch(() => {});
              }
              await flushIce();
            } else if (signal.type === "answer") {
              if (pc.signalingState !== "have-local-offer") return;
              await pc.setRemoteDescription(new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit));
              if (!connectedRef.current) {
                connectedRef.current = true;
                setStatus("connected");
                updateCallStatus(cid!, "connected").catch(() => {});
              }
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

        // === 7. ICE candidate sending ===
        pc.onicecandidate = (event) => {
          if (event.candidate && cid) {
            ablyChannel?.publish("signal", { type: "ice-candidate", payload: event.candidate.toJSON(), sender_id: userId }).catch(() => {});
          }
        };

        // === 8. Renegotiation (video toggle, track changes) ===
        pc.onnegotiationneeded = async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            ablyChannel?.publish("signal", { type: "offer", payload: offer, sender_id: userId });
          } catch (err) {
            console.error("Renegotiation failed:", err);
          }
        };

        // === 9. Connection state ===
        let disconnectTimer: ReturnType<typeof setTimeout> | null = null;

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "connected") {
            if (disconnectTimer) { clearTimeout(disconnectTimer); disconnectTimer = null; }
            connectedRef.current = true;
            setStatus("connected");
            updateCallStatus(cid!, "connected").catch(() => {});
          } else if (pc.connectionState === "disconnected") {
            if (!disconnectTimer) {
              disconnectTimer = setTimeout(() => {
                if (pc.connectionState !== "connected") {
                  updateCallStatus(cid!, "ended").catch(() => {});
                  onEnd();
                }
              }, 8000);
            }
          } else if (pc.connectionState === "failed") {
            if (disconnectTimer) { clearTimeout(disconnectTimer); disconnectTimer = null; }
            updateCallStatus(cid!, "ended").catch(() => {});
            setTimeout(onEnd, 1000);
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
            if (disconnectTimer) { clearTimeout(disconnectTimer); disconnectTimer = null; }
            connectedRef.current = true;
            setStatus("connected");
            updateCallStatus(cid!, "connected").catch(() => {});
          } else if (pc.iceConnectionState === "failed") {
            if (disconnectTimer) { clearTimeout(disconnectTimer); disconnectTimer = null; }
            updateCallStatus(cid!, "ended").catch(() => {});
            setTimeout(onEnd, 1000);
          }
        };

        // === 10. Caller sends initial offer ===
        if (!mountedRef.current) return;
        if (isCaller) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          ablyChannel.publish("signal", { type: "offer", payload: offer, sender_id: userId });
          setStatus("ringing");
        } else {
          if (!connectedRef.current) setStatus("connecting");
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
      mountedRef.current = false;
      if (ablyChannel) {
        void ablyChannel.presence.leave();
        ablyChannel.unsubscribe("signal");
      }
      statusUnsubRef.current?.unsubscribe();
      statusUnsubRef.current = null;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      pcRef.current = null;
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
      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video");
      stream.getVideoTracks().forEach((t) => { t.stop(); stream.removeTrack(t); });
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
