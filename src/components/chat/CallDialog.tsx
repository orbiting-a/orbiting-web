"use client";

import { useState, useEffect, useRef } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff, Camera, CameraOff } from "lucide-react";

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
  onEnd,
}: {
  channelId: string;
  userId: string;
  otherUserId: string;
  otherUserName: string;
  initialType: "audio" | "video";
  onEnd: () => void;
}) {
  const [muted, setMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(initialType === "video");
  const [callId, setCallId] = useState<string | null>(null);
  const [status, setStatus] = useState("connecting");
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let pc: RTCPeerConnection;
    let localStream: MediaStream;
    let signalUnsub: { unsubscribe: () => void } | null = null;
    let isCaller = false;

    async function init() {
      try {
        const { createCall, updateCallStatus, sendCallSignal, subscribeToCallSignals, subscribeToCalls } = await import("@/lib/supabase/queries");

        pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;

        localStream = await navigator.mediaDevices.getUserMedia({
          video: videoEnabled,
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        localStreamRef.current = localStream;

        const tracks = localStream.getTracks();
        tracks.forEach((track) => pc.addTrack(track, localStream!));

        if (localVideoRef.current && videoEnabled) {
          localVideoRef.current.srcObject = localStream;
        }

        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        const call = await createCall(channelId, otherUserId, initialType);
        setCallId(call.id);
        isCaller = true;

        signalUnsub = subscribeToCallSignals(call.id, async (signal) => {
          if (signal.type === "answer") {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit));
            setStatus("connected");
          } else if (signal.type === "ice-candidate") {
            await pc.addIceCandidate(new RTCIceCandidate(signal.payload as RTCIceCandidateInit));
          }
        });

        pc.onicecandidate = (event) => {
          if (event.candidate && call.id) {
            sendCallSignal(call.id, "ice-candidate", event.candidate.toJSON()).catch(() => {});
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "connected") {
            setStatus("connected");
            updateCallStatus(call.id, "connected").catch(() => {});
          } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
            updateCallStatus(call.id, "ended").catch(() => {});
            setTimeout(onEnd, 1000);
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendCallSignal(call.id, "offer", offer);
        setStatus("ringing");

      } catch (e) {
        console.error("Call init failed", e);
        onEnd();
      }
    }

    init();

    return () => {
      signalUnsub?.unsubscribe();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
    };
  }, [channelId, userId, otherUserId, initialType]);

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
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const vidTrack = videoStream.getVideoTracks()[0];
        stream.addTrack(vidTrack);
        pcRef.current?.addTrack(vidTrack, stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setVideoEnabled(true);
      } catch {
        // camera permission denied
      }
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
      <div className="flex-1 relative flex items-center justify-center p-4">
        {videoEnabled ? (
          <>
            <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            <video ref={localVideoRef} autoPlay playsInline muted className="absolute top-4 right-4 w-32 h-48 rounded-2xl object-cover bg-surface-raised border-2 border-white/20 shadow-lg" />
          </>
        ) : (
          <div className="relative z-10 text-center">
            <div className="h-24 w-24 rounded-full bg-brand-400/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl text-brand-400 font-bold">
                {otherUserName.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-white text-xl font-bold">{otherUserName}</p>
            <p className="text-white/60 text-sm mt-1">
              {status === "ringing" ? "Ringing..." : status === "connecting" ? "Connecting..." : "Connected"}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 pb-12 pt-6">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full transition-colors ${muted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
        >
          {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>

        <button onClick={endCall} className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors">
          <PhoneOff className="h-6 w-6" />
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-colors ${videoEnabled ? "bg-white/10 text-white hover:bg-white/20" : "bg-white/10 text-white hover:bg-white/20"}`}
          title={videoEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {videoEnabled ? <Video className="h-6 w-6" /> : <Camera className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );
}
