// WebRTC leg of a WhatsApp call, in the browser.
//
// Meta sends an SDP offer in the connect webhook and only accepts an answer to
// that exact offer. Meta's side is ICE-lite with public relay candidates, so a
// browser behind NAT can reach it with STUN alone. Signalling is not trickled:
// Meta takes one complete SDP, so ICE gathering must finish before we send it.

const ICE_GATHER_TIMEOUT_MS = 3000;

export interface CallLeg {
  answerSdp: string;
  setMuted: (muted: boolean) => void;
  close: () => void;
  onStateChange: (cb: (state: RTCPeerConnectionState) => void) => void;
}

export function softphoneSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.RTCPeerConnection === 'function' &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      pc.removeEventListener('icegatheringstatechange', check);
      clearTimeout(timer);
      resolve();
    };
    const check = () => {
      if (pc.iceGatheringState === 'complete') done();
    };
    // Some networks never report "complete"; the candidates gathered so far are
    // enough for Meta's ICE-lite relays.
    const timer = setTimeout(done, ICE_GATHER_TIMEOUT_MS);
    pc.addEventListener('icegatheringstatechange', check);
  });
}

/** Mic stream first: if the user refuses permission we fail before touching Meta. */
export async function openMicrophone(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    video: false,
  });
}

export async function answerOffer(offerSdp: string, mic: MediaStream): Promise<CallLeg> {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });
  const audio = document.createElement('audio');
  audio.autoplay = true;
  document.body.appendChild(audio);

  pc.ontrack = (event) => {
    audio.srcObject = event.streams[0] ?? new MediaStream([event.track]);
    void audio.play().catch(() => undefined);
  };
  mic.getTracks().forEach((track) => pc.addTrack(track, mic));

  let stateListener: ((state: RTCPeerConnectionState) => void) | null = null;
  pc.onconnectionstatechange = () => stateListener?.(pc.connectionState);

  const close = () => {
    pc.onconnectionstatechange = null;
    pc.ontrack = null;
    pc.close();
    mic.getTracks().forEach((t) => t.stop());
    audio.srcObject = null;
    audio.remove();
  };

  try {
    await pc.setRemoteDescription({ type: 'offer', sdp: offerSdp });
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await waitForIceGathering(pc);
  } catch (err) {
    close();
    throw err;
  }

  return {
    answerSdp: pc.localDescription?.sdp ?? '',
    setMuted: (muted) => mic.getAudioTracks().forEach((t) => (t.enabled = !muted)),
    close,
    onStateChange: (cb) => {
      stateListener = cb;
    },
  };
}

/** Two-tone ring so a call is noticed when the tab is in the background. */
export function startRingtone(): () => void {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return () => undefined;
  const ctx = new Ctx();
  let stopped = false;

  const ring = () => {
    if (stopped) return;
    const now = ctx.currentTime;
    [0, 0.45].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = offset === 0 ? 880 : 660;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.38);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.4);
    });
  };
  void ctx.resume().catch(() => undefined);
  ring();
  const interval = setInterval(ring, 2200);

  return () => {
    stopped = true;
    clearInterval(interval);
    void ctx.close().catch(() => undefined);
  };
}
