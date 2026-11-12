// Generates public/music.wav — an original ambient score for the demo video.
// Deterministic (no randomness), so re-running produces the identical file.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 44100;
const SECONDS = 162;
const N = SR * SECONDS;
const BPM = 96;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Am – F – C – G, two bars each; voiced low-mid for a warm pad.
const CHORDS = [
  [57, 60, 64, 69],
  [53, 57, 60, 65],
  [48, 55, 60, 64],
  [55, 59, 62, 67],
];
const ARP = [
  [69, 72, 76, 72, 81, 76, 72, 76],
  [65, 69, 72, 69, 77, 72, 69, 72],
  [64, 67, 72, 67, 76, 72, 67, 72],
  [67, 71, 74, 71, 79, 74, 71, 74],
];

const L = new Float32Array(N);
const R = new Float32Array(N);

const env = (x, a, d) => (x < 0 ? 0 : x < a ? x / a : Math.exp(-(x - a) / d));

for (let i = 0; i < N; i++) {
  const time = i / SR;
  const chordLen = BAR * 2;
  const ci = Math.floor(time / chordLen) % 4;
  const inChord = time % chordLen;
  const xfade = Math.min(1, inChord / 1.2);
  const prev = CHORDS[(ci + 3) % 4];
  const cur = CHORDS[ci];

  // Pad: detuned sines + soft 2nd harmonic, crossfaded between chords.
  let padL = 0;
  let padR = 0;
  const voice = (notes, gain) => {
    for (let k = 0; k < notes.length; k++) {
      const fq = midi(notes[k]);
      const a = Math.sin(2 * Math.PI * fq * 0.998 * time + k);
      const b = Math.sin(2 * Math.PI * fq * 1.002 * time + k * 2);
      const h = 0.18 * Math.sin(2 * Math.PI * fq * 2 * time);
      padL += gain * (a + h) * 0.5;
      padR += gain * (b + h) * 0.5;
    }
  };
  voice(cur, xfade);
  if (xfade < 1) voice(prev, 1 - xfade);
  const swell = 0.75 + 0.25 * Math.sin(2 * Math.PI * time / 16);
  padL *= 0.045 * swell;
  padR *= 0.045 * swell;

  // Bass: chord root an octave down, pulsing on each beat.
  const root = midi(cur[0] - 12);
  const beatPos = time % BEAT;
  const bass = 0.12 * Math.sin(2 * Math.PI * root * time) * env(beatPos, 0.02, 0.35);

  // Arpeggio on eighth notes, enters after the intro.
  let arp = 0;
  if (time > 8) {
    const eighth = BEAT / 2;
    const step = Math.floor(time / eighth) % 8;
    const pos = time % eighth;
    const fq = midi(ARP[ci][step]);
    const tone = Math.sin(2 * Math.PI * fq * time) + 0.3 * Math.sin(2 * Math.PI * fq * 2 * time);
    arp = 0.05 * tone * env(pos, 0.004, 0.16) * Math.min(1, (time - 8) / 4);
  }

  // Soft kick from the architecture section onward; drops out near the end.
  let kick = 0;
  if (time > 30 && time < SECONDS - 12) {
    const kf = 50 + 90 * Math.exp(-beatPos * 30);
    kick = 0.22 * Math.sin(2 * Math.PI * kf * beatPos) * env(beatPos, 0.002, 0.12);
  }

  // Hi-hat-like tick: deterministic noise from a hash, off-beats only.
  let hat = 0;
  if (time > 46 && time < SECONDS - 14) {
    const off = (time + BEAT / 2) % BEAT;
    const n = Math.sin(i * 12.9898) * 43758.5453;
    hat = 0.018 * (n - Math.floor(n) - 0.5) * 2 * env(off, 0.001, 0.03);
  }

  const pan = 0.3 * Math.sin(2 * Math.PI * time / 6);
  L[i] = padL + bass + kick + arp * (1 - pan) + hat;
  R[i] = padR + bass + kick + arp * (1 + pan) + hat;
}

// Ping-pong delay for space.
const D = Math.floor(BEAT * 0.75 * SR);
for (let i = D; i < N; i++) {
  L[i] += 0.32 * R[i - D];
  R[i] += 0.32 * L[i - D];
}

// Master fade + normalise to -3 dBFS.
let peak = 0;
for (let i = 0; i < N; i++) {
  const time = i / SR;
  const fade = Math.min(1, time / 3, (SECONDS - time) / 5);
  L[i] *= fade;
  R[i] *= fade;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const gain = 0.707 / peak;

const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0);
buf.writeUInt32LE(36 + N * 4, 4);
buf.write('WAVE', 8);
buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write('data', 36);
buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const s = (x) => Math.max(-32768, Math.min(32767, Math.round(x * gain * 32767)));
  buf.writeInt16LE(s(L[i]), 44 + i * 4);
  buf.writeInt16LE(s(R[i]), 46 + i * 4);
}

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'music.wav');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, buf);
console.log(`Wrote ${out} (${SECONDS}s)`);
