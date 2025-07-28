import React, { useEffect, useRef, useState } from 'react';
import Gun from 'gun';

// Simple WebRTC video chat using Gun for signaling
export default function GunVideoChat({ userId, roomId }) {
  const localVideo = useRef();
  const remoteVideo = useRef();
  const pc = useRef();
  const gun = useRef();
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');

  // ICE servers for STUN/TURN
  const iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];

  useEffect(() => {
    gun.current = Gun(['https://gun.eco/gun', 'https://gunjs.herokuapp.com/gun']);
    pc.current = new RTCPeerConnection({ iceServers });
    const chat = gun.current.get('semweb-companion-video').get(roomId);

    // Handle incoming signaling
    chat.on(async (data) => {
      if (!data || data.user === userId) return;
      try {
        if (data.sdp) {
          await pc.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          if (data.sdp.type === 'offer') {
            const answer = await pc.current.createAnswer();
            await pc.current.setLocalDescription(answer);
            chat.set({ user: userId, sdp: pc.current.localDescription });
          }
        } else if (data.candidate) {
          await pc.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (e) { setError('Signaling error: ' + e.message); }
    });

    // ICE candidate relay
    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        chat.set({ user: userId, candidate: event.candidate });
      }
    };

    // Remote stream
    pc.current.ontrack = (event) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = event.streams[0];
      }
    };

    return () => {
      chat.off();
      pc.current && pc.current.close();
    };
  }, [roomId, userId]);

  // Join/start video chat
  const start = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideo.current) localVideo.current.srcObject = stream;
      stream.getTracks().forEach((track) => pc.current.addTrack(track, stream));
      setJoined(true);
      // If first to join, create offer
      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);
      gun.current.get('semweb-companion-video').get(roomId).set({ user: userId, sdp: pc.current.localDescription });
    } catch (e) {
      setError('Could not start video: ' + e.message);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 12, maxWidth: 340 }}>
      <div style={{ marginBottom: 8 }}>
        <video ref={localVideo} autoPlay muted playsInline style={{ width: 140, marginRight: 8, background: '#222' }} />
        <video ref={remoteVideo} autoPlay playsInline style={{ width: 140, background: '#222' }} />
      </div>
      {!joined && <button className="btn btn-sm btn-success" onClick={start}>Start Video Chat</button>}
      {error && <div style={{ color: 'red', fontSize: '0.95em' }}>{error}</div>}
    </div>
  );
}
